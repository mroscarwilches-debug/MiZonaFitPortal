# Security — What's Protected and How

## The site itself (static frontend + two managed backends)

- **No custom server and no database of our own.** The site is still static
  files served by nginx; login lives in Supabase Auth (a managed service),
  and all client data (measurements, health history, payment/booking status)
  lives in the owner's Google Sheets — nothing is stored on our own
  infrastructure. See docs/AUTH_AND_AGENDAMIENTO.md for the full picture.
- **Passwords never touch our code.** Supabase Auth handles hashing, session
  tokens, and (optionally) email verification — there is no custom
  authentication logic to get wrong.
- **Payment data never touches our code either.** Wompi's hosted checkout
  collects card details directly; the site only ever sees a plan reference
  and a payment status confirmed by a signed webhook (see docs/PAYMENTS.md).
- **Security headers** are set in `app/nginx.conf`, and CI checks for them
  on every build:
  - `Content-Security-Policy`: blocks everything by default, only allowing
    what's explicitly listed — no inline scripts/styles. `script-src` and
    `connect-src` allow `https://esm.sh` (the pinned Supabase JS client
    import) and `https://*.supabase.co` (auth/data/functions calls) — the
    two deliberate, narrow exceptions to an otherwise strict policy.
  - `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
    `Referrer-Policy: strict-origin-when-cross-origin`, and a
    `Permissions-Policy` that disables camera/microphone/location access.
- **Contact form**: checks input in the browser and has a hidden field that
  catches bots. No data is stored or sent anywhere until a real endpoint is
  configured at deploy time (docs/DEPLOYMENT.md).
- **The 4 Supabase Edge Functions** (`wompi-webhook`, `client-status`,
  `booking-availability`, `booking-create`) are the only server-side code in
  the whole project. They never expose the Google service account key or the
  Wompi events secret to the browser — those exist only as Edge Function
  secrets. `client-status`/`booking-*` always verify the caller's Supabase
  session first; nobody can read or book on someone else's behalf.
- **Docker image**: uses a pinned version (`nginx:1.27-alpine`), never
  `latest`, and the Dockerfile is checked by a linter (hadolint) in CI.

## The AWS server (only ever created manually, by the owner)

- **SSH is never open to the public**: the `admin_cidr` setting has a rule
  that refuses `0.0.0.0/0` — it only ever allows the owner's specific IP.
- **IMDSv2 is required** on the server, which blocks a common way attackers
  steal cloud credentials.
- **The disk is encrypted** (gp3 volume).
- **Security patches install automatically** (`unattended-upgrades` is
  turned on at boot).
- **Whether the site is public is a deliberate setting**
  (`http_ingress_cidr`): it can be locked to just the owner's IP for private
  testing, and opened to everyone only when that's actually wanted.
- **Terraform's state**: stored in a versioned S3 bucket, never committed
  to git (`terraform/.gitignore` blocks it).

## The automated pipeline (CI)

- **CI has no AWS credentials and can't deploy anything.** It only runs
  tests, builds the Docker image, and checks the Terraform code's syntax
  (using `-backend=false`, so it never touches the real state).
- Workflow permissions are limited to read-only repo access.
- **Something you should do:** the repo's GitHub secrets still contain
  `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` left over from an older
  workflow that auto-applied changes. No current workflow uses them —
  **delete both secrets**, and it's worth rotating that key in AWS IAM since
  it was used by CI in the past.
- Recommended: turn on branch protection for `main` in GitHub settings, so
  the automatic checks must pass before anything can be merged.

## Where credentials live

| Credential | Where it lives | Notes |
|---|---|---|
| AWS access key (`UserOWtest`) | Your own computer (`aws configure`) | Only used for manual Terraform runs |
| AWS secrets stored in GitHub | Repo secrets | **Unused — should be deleted and rotated** |
| EC2 key pair `WilchesFitness` | Your `.pem` file | Keep it offline; needed to SSH into the server |
| Supabase Project URL + anon key | `app/html/js/config.js` (gitignored) | Public by design, safe in client code — protected by Supabase Auth/RLS |
| Wompi public key (sandbox) | `app/html/js/config.js` | Public by design |
| Google service account (`client_email` + `private_key`) | Supabase Edge Function secrets only | **Never** in the repo or the browser |
| Wompi events secret | Secret of the `wompi-webhook` function only | **Never** in the repo or the browser |

## Known trade-offs, accepted for now

1. **HTTP only in production, no HTTPS yet** (docs/DEPLOYMENT.md). This was
   an acceptable trade-off while the site had no logins or payments — **it
   no longer is**. Now that accounts and payments exist
   (docs/AUTH_AND_AGENDAMIENTO.md), HTTPS is a hard prerequisite before
   publishing this for real clients, not just a "recommended follow-up".
2. **The GitHub repo is public**: the site's code and infrastructure setup
   are visible to anyone. No secrets are in the repo (double-checked) — and
   it needs to stay that way.
3. **Your home IP can change**: if your internet provider assigns you a new
   IP, update `admin_cidr` (one `terraform apply`, and it only touches the
   firewall rule, not the server itself).
