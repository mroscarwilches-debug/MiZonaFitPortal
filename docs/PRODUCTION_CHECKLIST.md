# Go-Live Checklist

Work through this list top to bottom when you're ready to publish the site
on the internet. Items marked ✅ are already done and confirmed working
locally.

## Already done (confirmed 2026-07-04)

- ✅ Works well on mobile and desktop (tested on desktop and phone-sized
  screens)
- ✅ Accessibility: an automated scan (axe-core, WCAG 2.1 A/AA) found 0
  issues
- ✅ Performance: perfect Lighthouse score, no layout shift, 0ms blocking
  time; images use modern AVIF/WebP formats with responsive sizing, load
  lazily below the fold, and the hero image preloads
- ✅ Security headers are set (CSP, X-Content-Type-Options, X-Frame-Options,
  Referrer-Policy, Permissions-Policy — configured in nginx)
- ✅ Contact form: validates input in Spanish, has a hidden bot trap, and
  announces status changes to screen readers
- ✅ SEO basics: page title, description, social sharing tags, theme color,
  favicon
- ✅ Tests: 10 unit tests + 14 browser/accessibility tests, all passing
- ✅ Nothing deploys automatically — Terraform only ever runs by hand

## Content that needs your input

- [x] Real plan names and prices — added 2026-07-04, from
      `F:\MarcaPersonal\Contenido\1. Planes y servicios Mr.Wilches.txt`
      (Consultoría Express $80.000 / Protocolo Estándar $350.000 /
      Protocolo Black $450.000 / Seminario Corporativo $3.900.000 COP)
- [ ] Real phone number (currently a placeholder: +57 300 000 0000)
- [ ] Real contact email (currently a placeholder:
      info@wilchesfitness.com — domain still to be decided)
- [x] The stats section uses real, owner-confirmed numbers: 193 clients
      served, plus other value props — nothing made up
- [ ] Legal pages, if needed: a privacy policy (Colombia's Ley 1581 on
      personal data protection applies once the form starts collecting
      real information) and terms of service

## Steps to take right before publishing (see docs/DEPLOYMENT.md)

- [x] Removed the `noindex` tag that was blocking search engines (2026-07-04)
- [x] `robots.txt` now allows indexing (2026-07-04)
- [ ] Add the canonical URL and the full social-sharing image URL — needs
      the final domain or IP address, do this right after the first deploy
- [ ] Set up the contact form's endpoint (or knowingly leave it in
      "acknowledge only" mode)
- [ ] If the form endpoint is external, update the security policy (CSP) to
      allow it
- [ ] `git push` to `main` with all checks passing (the server pulls its
      code from GitHub)

## Security check before going live (see docs/SECURITY.md)

- [ ] Delete the unused `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` secrets
      from the GitHub repo, and rotate that AWS key
- [ ] Turn on branch protection for `main`: require checks to pass before
      merging
- [ ] Double check `admin_cidr` still matches your current public IP

## Publishing (AWS EC2 — see docs/DEPLOYMENT.md)

- [ ] Automatic checks are passing on `main`
- [ ] `terraform plan` shows exactly 2 to add, 0 to change, 0 to destroy
- [ ] Run `terraform apply` (optionally private first, using
      `http_ingress_cidr=<your-ip>/32`)
- [ ] The site responds at the `portal_url` output
- [ ] Decide on a timeline for a fixed IP + domain + HTTPS (see the HTTPS
      section of DEPLOYMENT.md)

## After publishing, double-check

- [ ] Security headers show up in production responses
- [ ] The full test suite passes against the live URL
- [ ] Lighthouse score is 95+ across all categories on the live URL
- [ ] The contact form behaves the way it's configured to
- [ ] After a few days, check that the site is showing up in search
      (`site:` search)

## Keeping an eye on cost

- [ ] Server + disk + public IP should run about $12–14/month — check the
      AWS Billing console after the first week
- [ ] The S3 state bucket costs about $0.01/month
- [ ] Nothing else should be running in the AWS account
      (`aws ec2 describe-instances`)
