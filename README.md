# Maronix Labs

An independent agency website built with React, TypeScript, Vite, Tailwind CSS, Framer Motion and Lucide. No Lovable account or runtime is involved. All assets are local; there are no font subscriptions or analytics trackers. The site is editable in VS Code. The supplied Maronix Labs wordmark appears in the header and footer, adapted to off-white and dusty rose on a transparent background.

## Start locally

Install Node.js 22.13 or later (Node 22 LTS recommended), then open this folder in VS Code:

```sh
npm ci
npm run dev
```

Open the localhost URL Vite prints. Production commands:

```sh
npm run build
npm run preview
npm test
```

`npm run build` checks TypeScript and writes the production website to `dist/`. `npm test` runs server-side form tests with mocked external services. Vite dev/preview serves only the frontend; it does not execute Cloudflare Pages Functions.

## Project map

- `src/App.tsx`: page sections and composition
- `src/components.tsx`: navigation, reveal animations and reusable project cards
- `src/ContactForm.tsx`: form, validation, Turnstile widget and submission states
- `src/content.ts`: service and project content
- `src/styles.css`: palette, typography, component styles and responsive layouts; imports Tailwind
- `functions/api/contact.ts`: Cloudflare Pages inquiry endpoint
- `tests/contact.test.ts`: validation, spam checks and delivery-result tests
- `public/hero.webp`: optimized original AI-generated hero image
- `public/maronix-logo-light.png`: transparent dark-background adaptation of the supplied wordmark
- `public/maronix-logo-original.jpg`: original supplied brand reference
- `public/favicon.svg`, `robots.txt`, `sitemap.xml`, `_headers`: brand/SEO/response assets
- `.env.example`: public build-time settings
- `.dev.vars.example`: example private function configuration
- `index.html`: title, description, canonical and Open Graph tags

All four portfolio cards are explicitly labeled **Concept**. Their interfaces are illustrative visuals, not working product demos or commercial-client claims. Change those labels only when you can substantiate the work. Clicking a project title expands the proposed scope.

## GitHub → Cloudflare Pages

1. Create an empty GitHub repository in your own account (private is fine).
2. From this extracted project folder run:

```sh
git init
git add .
git commit -m "Build Maronix Labs website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/maronix-labs.git
git push -u origin main
```

3. In Cloudflare, open **Workers & Pages → Create application → Pages → Connect to Git** (dashboard wording may vary). Authorize only the repository you need.
4. Choose your repository and `main`. Use the React (Vite) preset, build command `npm run build`, output directory `dist`, and repository root as the root directory. Set `NODE_VERSION` to `22`.
5. Add the public form site key as a build variable and private function variables as described below, then deploy. Pages automatically detects the root `functions/` directory during Git deployments.
6. Future commits pushed to `main` rebuild the production site. Review feature branches before merging. Keep secrets out of Git.

The frontend can use Cloudflare Pages' Free plan within its limits; the form uses Pages Functions and an email provider, each with separate quotas. No paid package is required by this project. Review the linked provider plans/terms for your account and expected traffic; this guide does not promise unlimited free service. Use Git deployment for the form: uploading only `dist/` does not include the function.

Official references:
- https://developers.cloudflare.com/pages/get-started/git-integration/
- https://developers.cloudflare.com/pages/configuration/build-configuration/
- https://developers.cloudflare.com/pages/platform/limits/
- https://developers.cloudflare.com/pages/functions/pricing/

## Connect maronixlabs.com (registered at Namecheap)

Domain registration stays at Namecheap. The recommended setup delegates DNS to Cloudflare so Pages can serve the apex domain.

1. Add `maronixlabs.com` as a zone in Cloudflare and choose the appropriate plan. Review the imported DNS records. Copy all existing MX, TXT, SPF, DKIM, verification and other required records before switching nameservers, especially if email already uses this domain.
2. Cloudflare supplies **two specific nameservers**. In Namecheap, open **Domain List → Manage → Nameservers → Custom DNS**, paste those exact two nameservers and save. Do not use example nameserver values. If DNSSEC is already enabled, follow Cloudflare's migration instructions for the existing DS record before switching; re-enable it after activation.
3. Wait for Cloudflare to show the zone as active. In the Pages project, open **Custom domains → Set up a custom domain** and add `maronixlabs.com`. Allow Cloudflare to create the required DNS record and certificate. Associate the domain in Pages first; a DNS record alone is insufficient.
4. Add `www.maronixlabs.com` as another Pages custom domain. Create a Cloudflare redirect rule for `www.maronixlabs.com` to `https://maronixlabs.com`, preserving path and query string, so one canonical host is used.
5. After propagation, verify HTTPS at both hostnames, mail records and form delivery. DNS is now managed in Cloudflare, while renewals remain at Namecheap. Do not purchase Namecheap hosting for this deployment.

References:
- https://developers.cloudflare.com/pages/configuration/custom-domains/
- https://www.namecheap.com/support/knowledgebase/article.aspx/767/10/how-to-change-dns-for-a-domain/
- https://developers.cloudflare.com/dns/nameservers/update-nameservers/

## Enable real inquiries

**The supplied preview intentionally disables Send until the public Turnstile site key is configured. No inquiry is silently stored or falsely reported as delivered.** The preview is a static review deployment; the endpoint runs when you deploy the complete repository to Cloudflare Pages.

1. Create a Cloudflare Turnstile widget for `maronixlabs.com` (and any exact staging host you intend to test). Copy its public site key and private secret key.
2. Create a Resend account, verify a domain you own using the DNS records it provides, and generate a restricted sending API key. Choose a verified sender and your real recipient mailbox. No mailbox is invented or preconfigured in this project.
3. Configure these in Cloudflare Pages settings:

| Variable | Location | Value |
| --- | --- | --- |
| `VITE_TURNSTILE_SITE_KEY` | Public build variable | Turnstile site key |
| `VITE_CONTACT_ENDPOINT` | Public build variable | `/api/contact` |
| `TURNSTILE_SECRET_KEY` | Private runtime secret | Turnstile secret |
| `RESEND_API_KEY` | Private runtime secret | Email sending key |
| `CONTACT_TO` | Private runtime setting | Actual receiving email |
| `CONTACT_FROM` | Runtime setting | e.g. `Maronix Labs <inquiries@YOUR_VERIFIED_DOMAIN>` |
| `ALLOWED_ORIGIN` | Runtime setting | `https://maronixlabs.com` (no trailing slash) |

4. Redeploy after changing public `VITE_` values. Never prefix a secret with `VITE_` because those values are embedded in browser code.
5. Test from the exact `ALLOWED_ORIGIN`. The function checks origin, body size, field values, a honeypot and the Turnstile token/hostname on the server before requesting email delivery. Invalid requests, bot checks and provider errors return useful failure feedback. Success means the email provider accepted the request; inbox delivery still depends on the provider and recipient filters.
6. Use separate staging variables and a separate authorized hostname for preview environments. The production origin restriction deliberately blocks other hosts. Avoid cross-origin endpoints unless you implement an explicit CORS policy.
7. Submit a real test inquiry and verify its arrival and reply-to address. External delivery has not been tested with real credentials. Apply Cloudflare rate limiting if your production traffic requires additional abuse controls.

Local full-stack testing: copy `.env.example` to `.env.local`, `.dev.vars.example` to `.dev.vars`, fill in development values, run `npm run build`, then use Cloudflare's official Wrangler CLI (`npx wrangler pages dev dist`) from the repository root. Set `ALLOWED_ORIGIN` to that exact local origin. The hostname comparison intentionally requires a matching hostname; Cloudflare dummy Turnstile keys return a dummy hostname, so the supplied mocked tests are the straightforward no-credential path. Never deploy a verification bypass.

Official references:
- https://developers.cloudflare.com/turnstile/get-started/
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- https://resend.com/docs/api-reference/emails/send-email

## Accessibility, privacy and maintenance

Semantic headings, labeled form fields, visible focus, keyboard navigation, Escape-to-close mobile navigation, status announcements and reduced-motion support are included. Responsive breakpoints cover mobile, tablet and desktop. The site does not persist visitor data in browser storage. Submitted inquiry details are processed by Cloudflare and your email provider; define an appropriate retention period and business privacy notice before public launch.

Update content in `src/content.ts`, page copy in `src/App.tsx`, colors in the CSS variables, and SEO URLs in `index.html`/`public/sitemap.xml` if the domain changes. Keep dependency updates reviewed and use the committed lockfile. This source is independent of the private review hosting system.

## Asset provenance

`public/hero.webp` was generated specifically for this site using OpenAI's built-in image generation, then optimized to WebP. Prompt: cinematic premium technology studio photograph; modern unbranded laptop with a minimal AI assistant interface and rose orbital waveform, dark burgundy workspace, muted crimson lighting, realistic editorial product photography, no people/logos/blue/purple. Project preview graphics are original CSS/HTML compositions. Lucide supplies interface icons under its open-source license. Space Grotesk headings and Manrope body text are bundled locally through Fontsource under their open-source font licenses. No external font service is called.

## Validation performed

- Production TypeScript and Vite build.
- Five server tests covering origin restrictions, missing configuration, invalid fields/honeypot, request size, failed spam verification, provider failure and accepted delivery (external responses mocked).
- Desktop browser visual inspection and interaction checks for project expansion and contact navigation.
- Real provider delivery, DNS changes and the user's own GitHub/Cloudflare account deployment remain configuration steps. Mobile styling is implemented; a separate physical-device pass is recommended before public launch.
