# Production Go-Live Checklist

Work through this list top-to-bottom when Internet publication is approved.
Items marked ✅ are already done and verified locally.

## Already satisfied (verified 2026-07-04)

- ✅ Responsive mobile-first UI (tested on desktop + Pixel-class viewports)
- ✅ Accessibility: axe-core WCAG 2.1 A/AA scan — 0 violations
- ✅ Performance: Lighthouse 1.0, CLS 0, TBT 0 ms; images AVIF/WebP with
  srcset, lazy loading below the fold, hero preloaded
- ✅ Security headers: CSP, X-Content-Type-Options, X-Frame-Options,
  Referrer-Policy, Permissions-Policy (nginx)
- ✅ Contact form: client-side validation (Spanish messages), honeypot,
  aria-live status
- ✅ SEO metadata: title, description, Open Graph, theme-color, favicon
- ✅ Tests: 10 unit + 14 E2E/a11y, all passing
- ✅ No auto-provisioning CI; Terraform is manual-dispatch only

## Content (owner input required)

- [x] Plan names and prices — real ones applied 2026-07-04 from
      `F:\MarcaPersonal\Contenido\1. Planes y servicios Mr.Wilches.txt`
      (Consultoría Express $80.000 / Protocolo Estándar $350.000 /
      Protocolo Black $450.000 / Seminario Corporativo $3.900.000 COP)
- [ ] Real phone number (placeholder: +57 300 000 0000)
- [ ] Real contact email (placeholder: info@wilchesfitness.com — domain TBD)
- [x] Stats block uses real data: 193 clients served (owner-confirmed
      2026-07-04) plus verifiable value props — no invented numbers
- [ ] Legal pages if required: privacy policy (Colombian Ley 1581 habeas data
      applies once the form collects personal data), terms of service

## Go-live commit (see docs/DEPLOYMENT.md)

- [x] `noindex` meta tag removed (2026-07-04)
- [x] `robots.txt` allowing indexing (2026-07-04)
- [ ] Canonical URL + absolute `og:image` — needs the final domain/IP,
      do right after first deploy
- [ ] Contact form endpoint configured (or consciously left in local
      acknowledge-only mode)
- [ ] CSP updated if the form endpoint is external
- [ ] `git push` to `main` with CI green (the instance deploys from GitHub)

## Security pre-flight (see docs/SECURITY.md)

- [ ] Delete unused `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` from GitHub
      repo secrets; rotate the IAM key
- [ ] Protect `main` branch: require CI checks before merge
- [ ] Confirm `admin_cidr` matches your current public IP

## Deployment (AWS EC2 — docs/DEPLOYMENT.md)

- [ ] CI green on `main`
- [ ] `terraform plan` shows exactly 2 to add, 0 to change, 0 to destroy
- [ ] `terraform apply` (optionally private first via `http_ingress_cidr=<ip>/32`)
- [ ] Site answers on `portal_url` output
- [ ] Decide Elastic IP + domain + TLS timeline (HTTPS section of DEPLOYMENT.md)

## Post-deploy verification

- [ ] Security headers present in production responses
- [ ] E2E suite green against the production URL
- [ ] Lighthouse ≥ 95 across categories on the production URL
- [ ] Form flow behaves as configured
- [ ] Site indexed check after a few days (`site:` search)

## Cost guardrails

- [ ] EC2 t3.micro + gp3 + public IPv4 ≈ $12–14/month — confirm in Billing
      console after the first week
- [ ] S3 state bucket ≈ $0.01/month
- [ ] Nothing else running in the account (`aws ec2 describe-instances`)
