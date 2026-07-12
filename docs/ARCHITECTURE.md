# Architecture — Why the Site Is Built This Way

Date: 2026-07-04

> **Decision (2026-07-04):** the owner chose **AWS EC2** for production
> (published manually with Terraform — see docs/DEPLOYMENT.md), under the
> brand **"El Código del Guerrero — by Mr. Wilches"**. The hosting comparison
> below is kept as a reference. Cloudflare Pages is still the cheapest
> alternative if that ever changes.

## 1. What kind of site is this?

The public marketing page is still static (HTML/CSS/JS + images) — that part
of the hosting reasoning below hasn't changed. What *has* changed is the
member area added in docs/AUTH_AND_AGENDAMIENTO.md (login, payment,
valoración, booking): rather than build a custom server + database for that,
it's built on managed services — Supabase Auth (login only) and the owner's
own Google Sheets/Forms/Calendar (all client data, payment/booking status).
The only actual server-side code in the project is 4 small Supabase Edge
Functions that bridge Wompi/Google securely. This keeps the "no server to
patch, cheap to run" reasoning intact even though the site now has accounts
and payments.

## 2. Hosting options compared (for a static site)

| Option | Monthly cost | Can you keep it private while building? | Custom domain + HTTPS | CDN | Notes |
|---|---|---|---|---|---|
| **Cloudflare Pages** | **$0** | Yes — free login-based access control for up to 50 users | Free | Yes, excellent | 500 builds/month free; unlimited bandwidth |
| GitHub Pages | $0 | Only with a paid GitHub Enterprise plan — otherwise always public | Free | Yes | No free way to keep it private → doesn't meet the "private while building" need |
| Netlify | Free tier available | Password protection needs a paid plan ($19/user) | Free | Yes | 100 GB bandwidth/month free |
| Vercel | Free (hobby tier) | Password/login protection needs a paid Pro plan ($20/user) | Free | Yes | Free tier forbids commercial use → not valid for a business site |
| Firebase Hosting | Nearly free | Preview links are hard to guess but not truly password-protected | Free | Yes | 10 GB storage / 360 MB per day free |
| Azure Static Web Apps | Free tier available | Password protection needs a paid plan (~$9/month) | Free | Yes | Free tier is otherwise fine |
| Current: AWS EC2 (t3.micro) | ~$12–14 | Manual setup via firewall rules | Manual (certbot) | No | You're responsible for patching, monitoring, and deployment |

### Recommendation: Cloudflare Pages
- Free at this scale, with unlimited bandwidth and a fast global CDN.
- **Cloudflare Access** solves the "keep it private while building" need: the
  site stays behind a login (your Gmail) during development, and can be
  opened to the public with a single setting change when you're ready.
- Connects directly to GitHub: push to `main` and it builds and publishes
  automatically; pull requests get their own preview link.
- Free tier allows commercial use (unlike Vercel's free tier).
- Room to grow: Cloudflare Workers can add backend logic later (contact
  form, payment webhooks) without switching hosts.

### What happens to the current AWS setup
Once Cloudflare Pages is live, the AWS server and its firewall rules would be
torn down (`terraform destroy`), which stops the ~$12–14/month cost. The S3
bucket that stores Terraform's state can stay (it costs pennies) or be
removed too. The Terraform code itself stays in the repo for reference, and
docs/DEPLOYMENT.md would document the exact teardown steps.

## 3. How the repo is organized

```
/
├── src/                    # site source (would replace app/html)
│   ├── index.html
│   ├── css/main.css        # pulled out of the page's inline <style>
│   ├── js/main.js          # pulled out of the page's inline <script>
│   └── assets/             # optimized images, logo, favicon
├── supabase/functions/     # 4 small backend functions (login-gated payment/booking/status)
├── google-workspace/       # script that recreates the client intake Forms + Sheets
├── docs/                   # documentation
├── tests/                  # browser tests + accessibility checks
├── .github/workflows/
│   └── ci.yml              # checks code on every push; Cloudflare would handle publishing
└── README.md
```

No framework, no build tool: it's a single page, so plain HTML/CSS/JS keeps
things simple and small (the goal is under 100 KB, not counting images). If
the site grows into many pages later, it's worth revisiting with a tool like
Astro (built for static sites, ships very little JavaScript by default).

## 4. How this was built, step by step

1. **M1 — Look at the project and plan the architecture** (this document).
2. **M2 — Clean up the codebase**: separate CSS/JS from the HTML, use clear
   naming, add SEO tags, fix accessibility issues, add a favicon.
3. **M3 — Brand and photos**: pick real photos, generate lightweight
   WebP/AVIF versions in multiple sizes, add the logo, polish the design.
4. **M4 — Testing**: browser tests, accessibility scans, a performance
   budget, and checks on different screen sizes.
5. **M5 — Publish it privately**: Cloudflare Pages with a login wall; retire
   the AWS server.
6. **M6 — Write the docs**: deployment guide, rollback/backup plans, a
   go-live checklist, and a plan for accepting payments (comparing
   Wompi/MercadoPago/Stripe for Colombia).

## 5. Assumptions going in

- The business is based in Colombia (Bogotá address, MZF business documents)
  — so the payment plan favors Wompi/MercadoPago over Stripe.
- The GitHub repo can stay public or go private — Cloudflare Pages works
  either way.
- The prices shown in the plans ($29/$59/$99) were early placeholders, later
  replaced with real prices (see docs/PRODUCTION_CHECKLIST.md).
- A free Cloudflare account is available if that path is chosen.
