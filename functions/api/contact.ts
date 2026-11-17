interface Env { TURNSTILE_SECRET_KEY: string; RESEND_API_KEY: string; CONTACT_TO: string; CONTACT_FROM: string; ALLOWED_ORIGIN: string }
const services=['Web Development','Business Automation','Artificial Intelligence','A combination / Not sure yet'];
const budgets=['','Under €1,000','€1,000–€3,000','€3,000–€5,000','€5,000–€10,000','€10,000+','Let’s discuss'];
function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}})}
export async function onRequestPost({request,env}:{request:Request;env:Env}):Promise<Response>{
 if(!env.ALLOWED_ORIGIN||request.headers.get('origin')!==env.ALLOWED_ORIGIN)return json({error:'Request origin not allowed.'},403);
 if(!env.TURNSTILE_SECRET_KEY||!env.RESEND_API_KEY||!env.CONTACT_TO||!env.CONTACT_FROM)return json({error:'Online inquiries are not enabled yet. Please check back soon.'},503);
 if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'Expected JSON.'},415);
 try{
  const reader=request.body?.getReader();if(!reader)return json({error:'Missing request.'},400);let size=0;const chunks:Uint8Array[]=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>24000){await reader.cancel();return json({error:'Request too large.'},413)}chunks.push(value)}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}let data:Record<string,unknown>;try{data=JSON.parse(new TextDecoder().decode(bytes))}catch{return json({error:'Invalid JSON.'},400)}
  if(!data||typeof data!=='object')return json({error:'Invalid request.'},400);
  if(data.website)return json({error:'Unable to process inquiry.'},400);
  const get=(k:string)=>typeof data[k]==='string'?(data[k] as string).trim():'';
  const name=get('name'),email=get('email'),company=get('company'),service=get('service'),budget=get('budget'),description=get('description'),token=get('token');
  if(name.length<2||name.length>120||email.length>254||!/^\S+@\S+\.\S+$/.test(email)||/[\r\n]/.test(email)||company.length>160||!services.includes(service)||!budgets.includes(budget)||description.length<20||description.length>5000||!token||token.length>2048)return json({error:'Please check your name, email, service and project description (20–5,000 characters).'},400);
  const verification=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:token,remoteip:request.headers.get('CF-Connecting-IP')||''}),signal:AbortSignal.timeout(10000)});
  const checked=await verification.json() as {success:boolean;hostname?:string};
  if(!verification.ok||!checked.success||checked.hostname!==new URL(env.ALLOWED_ORIGIN).hostname)return json({error:'Spam verification failed. Please retry the check.'},400);
  const delivery=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:env.CONTACT_FROM,to:[env.CONTACT_TO],reply_to:email,subject:`Maronix Labs inquiry: ${service}`,text:`Name: ${name}\nEmail: ${email}\nCompany: ${company||'Not provided'}\nService: ${service}\nBudget: ${budget||'Not provided'}\n\n${description}`}),signal:AbortSignal.timeout(15000)});
  if(!delivery.ok)return json({error:'Your inquiry could not be delivered. Please try again shortly.'},502);
  return json({ok:true});
 }catch{return json({error:'Unable to send right now. Please try again shortly.'},502)}
}
export const onRequestGet=()=>json({error:'Method not allowed.'},405);
