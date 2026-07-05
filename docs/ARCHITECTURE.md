# Architecture Proposal — MiZonaFitPortal

Date: 2026-07-04

> **Decision update (2026-07-04):** the owner selected **AWS EC2** as the
> production target (deployed manually via Terraform, see docs/DEPLOYMENT.md)
> and the brand **"El Código del Guerrero — by Mr. Wilches"**. The hosting
> comparison below is kept for reference; Cloudflare Pages remains the
> documented lowest-cost alternative.

## 1. Nature of the Workload
The portal is a static marketing site (HTML/CSS/JS + images). Until a payment
gateway or member area exists, there is no server-side code. A static host is
therefore the correct architecture: cheaper, faster (global CDN), more secure
(no servers to patch), and simpler to operate than EC2 + Docker + nginx.

## 2. Hosting Comparison (static site)

| Option | Monthly cost | Private previews (password/access control) | Custom domain + TLS | CDN | Limits / notes |
|---|---|---|---|---|---|
| **Cloudflare Pages** | **$0** | Yes — Cloudflare Access on preview & production (free up to 50 users) | Free | Global, best-in-class | 500 builds/month free; unlimited bandwidth |
| GitHub Pages | $0 | Only on private repos with GitHub Enterprise ($$) — otherwise always public | Free | Fastly | No access control on free tier → fails the "private during development" requirement |
| Netlify | $0 free tier | Password protection requires paid plan ($19/user) | Free | Yes | 100 GB bandwidth/month free |
| Vercel | $0 hobby | Password/SSO protection requires Pro ($20/user) | Free | Yes | Hobby tier forbids commercial use → not valid for a business site |
| Firebase Hosting | ~$0 (Spark) | Preview channels have unguessable URLs but no real auth | Free | Google CDN | 10 GB storage / 360 MB/day transfer free |
| Azure Static Web Apps | $0 free tier | Password protection requires Standard (~$9/month) | Free | Yes | Free tier fine otherwise |
| Current: AWS EC2 t3.micro | ~$12–14 (instance + EBS + public IPv4) | Manual (SG rules) | Manual (certbot) | No | Requires patching, monitoring, deploy plumbing |

### Recommendation: Cloudflare Pages
- $0/month at this scale, unlimited bandwidth, global CDN.
- **Cloudflare Access** satisfies the privacy requirement: the site stays behind
  email-based authentication (your Gmail) during development and is opened to the
  public with a one-line policy change when you say "publish".
- Git-integrated: push to `main` → automatic build & deploy; PRs get preview URLs.
- Free tier includes commercial use (unlike Vercel Hobby).
- Growth path: Cloudflare Workers/Functions for future dynamic needs
  (contact form, payment webhooks) without changing hosts.

### What happens to the AWS stack
`terraform destroy` the EC2 instance and security group once Cloudflare Pages is
live (keeps ~$12–14/month from burning during development). The S3 state bucket
can stay (pennies) or be removed. The Terraform code remains in the repo as
reference; a `docs/DEPLOYMENT.md` section documents the decommission steps.

## 3. Target Repository Layout

```
/
├── src/                    # site source (renamed from app/html)
│   ├── index.html
│   ├── css/main.css        # extracted from inline <style>
│   ├── js/main.js          # extracted from inline <script>
│   └── assets/             # optimized WebP/AVIF images, logo, favicon
├── docs/                   # English technical documentation
├── tests/                  # Playwright E2E + accessibility (axe) tests
├── .github/workflows/
│   └── ci.yml              # lint + tests on PR; deploy handled by Cloudflare
└── README.md
```

No framework and no bundler: the site is one page; plain HTML/CSS/JS keeps the
bundle minimal (target < 100 KB excluding images) and removes build complexity.
If the site grows to many pages, revisit with Astro (static-first, zero JS by default).

## 4. Implementation Milestones
1. **M1 — Assessment & architecture** (this document).
2. **M2 — Codebase restructure**: extract CSS/JS, English naming, SEO metadata,
   accessibility fixes, favicon.
3. **M3 — Brand & imagery**: curate photos from `F:\MiZonaFit`, generate
   WebP/AVIF responsive variants, integrate logo, redesign polish.
4. **M4 — Testing**: Playwright E2E, axe accessibility, Lighthouse performance
   budget, responsive checks.
5. **M5 — Private deployment**: Cloudflare Pages + Access policy; decommission EC2.
6. **M6 — Documentation & production checklist**: deployment guide, rollback/backup
   strategy, go-live plan, payment gateway integration plan (Wompi/MercadoPago/Stripe
   comparison for Colombia).

## 5. Assumptions
- The business operates in Colombia (Bogotá footer, MZF RUT documents) — payment
  gateway plan will prioritize Wompi/MercadoPago over Stripe.
- The GitHub repo may remain public or become private; Cloudflare Pages works with both.
- Prices in the plans section ($29/$59/$99) are placeholders in USD — to be confirmed.
- You have (or can create) a free Cloudflare account.
