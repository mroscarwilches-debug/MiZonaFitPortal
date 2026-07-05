# Security Posture

## Application (static site)

- **No server-side code, no database, no secrets in the app.** The attack
  surface is nginx serving static files.
- **HTTP security headers** (`app/nginx.conf`, asserted by CI on every build):
  - `Content-Security-Policy`: `default-src 'none'` allowlist — no inline
    scripts/styles, no external origins.
  - `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
    `Referrer-Policy: strict-origin-when-cross-origin`,
    `Permissions-Policy` (camera/mic/geolocation disabled).
- **Contact form**: client-side validation + honeypot anti-bot field. No data
  is stored or transmitted until a production endpoint is configured
  (docs/DEPLOYMENT.md). If one is added, its origin must be added to
  `connect-src` in the CSP.
- **Dependencies**: zero runtime JS dependencies; dev-only tooling (Playwright,
  Vitest) pinned in `package-lock.json`.
- **Docker image**: pinned base (`nginx:1.27-alpine`), no `latest` tags,
  Dockerfile linted with hadolint in CI.

## Infrastructure (Terraform, applied only manually by the owner)

- **SSH is never public**: `admin_cidr` has a validation rule that rejects
  `0.0.0.0/0`. Default is the owner's IP `/32`.
- **IMDSv2 required** on the instance (blocks metadata-service credential theft).
- **Encrypted root volume** (gp3).
- **Automatic security patches**: `unattended-upgrades` enabled at boot.
- **HTTP exposure is a deliberate variable** (`http_ingress_cidr`): private
  validation with your IP, public only when you choose.
- **State**: S3 bucket with versioning; never committed to git
  (`terraform/.gitignore`).

## CI/CD

- **CI has no AWS credentials and no deploy capability.** It runs tests,
  builds the Docker image, and validates Terraform syntax with
  `-backend=false` (no state access).
- Workflow permissions restricted to `contents: read`.
- **Action item for you (GitHub → Settings → Secrets):** the repository still
  stores `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` from the old auto-apply
  workflow. No workflow uses them anymore — **delete both secrets**, and
  consider rotating the key in IAM since it was used by CI in the past.
- Recommended (GitHub → Settings → Branches): protect `main` — require the CI
  checks to pass before merging.

## Credentials inventory

| Credential | Where | Notes |
|---|---|---|
| AWS access key (`UserOWtest`) | Your workstation (`aws configure`) | Used only for manual terraform runs |
| AWS secrets in GitHub | Repo secrets | **Unused — delete and rotate** |
| EC2 key pair `WilchesFitness` | Your `.pem` file | Keep offline; needed for SSH |

## Known accepted risks (current phase)

1. **HTTP only** until a domain + TLS proxy is set up (docs/DEPLOYMENT.md).
   Acceptable while the site handles no user credentials or payments.
2. **Public repository**: the site content and infra code are visible. No
   secrets exist in the repo (verified); keep it that way.
3. **Dynamic admin IP**: if your ISP changes your IP, update `admin_cidr`
   (one `terraform apply`, SG-only change).
