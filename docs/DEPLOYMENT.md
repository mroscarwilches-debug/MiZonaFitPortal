# Deployment Guide — AWS EC2

> **Status: NOT DEPLOYED.** Nothing runs automatically. CI never touches
> Terraform state or AWS credentials. Deployment is a manual, owner-executed
> procedure from your workstation.
>
> Verified 2026-07-04: `terraform validate` passes and `terraform plan` shows
> exactly `2 to add, 0 to change, 0 to destroy` (instance + security group).

## What gets created

| Resource | Details |
|---|---|
| `aws_instance.web` | t3.micro, Ubuntu 24.04, encrypted gp3 root disk, IMDSv2 required |
| `aws_security_group.web_sg` | 80/443 open per `http_ingress_cidr`, SSH only from `admin_cidr` |

At boot the instance installs Docker + automatic security updates, clones this
repository, and runs the same `docker compose up` you use locally (on port 80).
Estimated cost: **~$12–14/month** (instance + disk + public IPv4).

## Prerequisites (already satisfied on your machine)

- AWS CLI configured with credentials (`aws sts get-caller-identity` works)
- Terraform ≥ 1.7 installed
- EC2 key pair `WilchesFitness` exists in us-east-1 and you have the `.pem`
- Remote state bucket `wilchesfitness-tfstate` exists (S3, versioned)

## Step 0 — Push to GitHub (required)

**The instance clones `main` from GitHub at boot** — whatever is on GitHub is
what goes live. Before applying:

1. Replace the placeholder phone/email in the footer of `app/html/index.html`
   (currently `+57 300 000 0000` / `info@wilchesfitness.com`).
2. `git push` and wait for CI to be green.

Already done in code (2026-07-04): real plans and prices, `noindex` removed,
`robots.txt` allowing indexing, SEO/OG metadata, security headers.
Post-deploy (needs the final address): `<link rel="canonical">` and absolute
`og:image` URL — see the HTTPS/domain section below.

## Step 1 — Verify your admin IP

SSH access is locked to `admin_cidr` (default `181.63.25.164/32`). If your
public IP changed (it is a residential connection):

```bash
curl https://api.ipify.org
```

Pass the current value in Step 3 if it differs from the default.

## Step 2 — Review the plan

```bash
cd terraform
terraform init
terraform plan
```

Expected: `Plan: 2 to add, 0 to change, 0 to destroy.` Anything else — stop and
investigate before applying.

## Step 3 — Apply

```bash
terraform apply
# or, overriding the admin IP:
terraform apply -var "admin_cidr=<your-ip>/32"
```

Review the plan output and type `yes`. Provisioning takes ~2 minutes plus
~2–3 minutes of boot-time setup (Docker install + image build). Outputs show
`portal_url` and a ready-made `ssh_command`.

### Private validation phase (optional, recommended)

To deploy but keep the site visible only to you first:

```bash
terraform apply -var "http_ingress_cidr=<your-ip>/32"
```

Validate, then open it to the world with:

```bash
terraform apply -var "http_ingress_cidr=0.0.0.0/0"
```

(Security-group-only change; the instance is not touched.)

## Step 4 — Verify

```bash
terraform output portal_url
curl -sI http://<ip>/ | grep -iE "200|content-security"
```

Then run the E2E suite against production (from the repo, site public or your
IP allowed):

```bash
docker run --rm -v "<repo>:/repo" -w /repo -e BASE_URL=http://<ip> \
  mcr.microsoft.com/playwright:v1.53.0-noble sh -c "npm ci && npm run test:e2e"
```

## Updating the site after deployment

The instance builds the site from `main` at boot. To ship a content update:

```bash
# after git push to main (CI green):
ssh -i <WilchesFitness.pem> ubuntu@<ip> \
  "cd /opt/warrior-code-portal && git pull && cd app && docker compose up -d --build"
```

Rollback: docs/ROLLBACK.md.

## HTTPS / custom domain (recommended follow-up)

Port 443 is already open in the security group, but the container serves plain
HTTP. Once you have a domain:

1. Point an `A` record at the instance IP (consider an Elastic IP first so the
   address survives instance stop/start: `aws ec2 allocate-address`).
2. On the instance, run a TLS-terminating reverse proxy. Simplest option is
   Caddy in front of nginx (automatic Let's Encrypt certificates), or certbot
   with nginx installed on the host.
3. Update `canonical`/`og:image` URLs to `https://` and redeploy content.

Until then, treat the site as HTTP-only and do not add any login or payment
credential flows (the payment plan in docs/PAYMENTS.md uses provider-hosted
pages precisely so card data never touches this server).

## Teardown

```bash
cd terraform && terraform destroy
```

Returns AWS cost to ~$0 (S3 state bucket pennies). The site keeps working
locally and can be redeployed any time with `terraform apply`.

## Alternative: Cloudflare Pages ($0/month)

The static-host comparison and Cloudflare Pages setup are documented in
docs/ARCHITECTURE.md §2. It remains the lowest-cost option if you ever want to
move off EC2; the site source needs no changes (`app/html` is the publish
directory).
