# Deployment Guide — Publishing on AWS EC2

> **Status: NOT DEPLOYED.** Nothing happens automatically — CI never touches
> AWS or Terraform's state. Publishing the site is something you do by hand,
> from your own computer, whenever you decide to.
>
> Last checked 2026-07-04: `terraform validate` passes, and `terraform plan`
> shows exactly `2 to add, 0 to change, 0 to destroy` (one server, one
> firewall).

## What gets created

| Resource | Details |
|---|---|
| `aws_instance.web` | A small server (t3.micro), Ubuntu 24.04, encrypted disk, with extra protection against credential-theft attacks (IMDSv2) |
| `aws_security_group.web_sg` | The firewall: web traffic (80/443) open per `http_ingress_cidr`, SSH allowed only from `admin_cidr` (your IP) |

When the server boots, it installs Docker and automatic security updates,
downloads this repository, and runs the exact same `docker compose up` you
use locally (just on port 80 instead of 8080). Estimated cost:
**~$12–14/month** (server + disk + a public IP address).

## Before you start (already set up on your machine)

- AWS CLI is configured with credentials (`aws sts get-caller-identity`
  works)
- Terraform 1.7 or newer is installed
- The EC2 key pair `WilchesFitness` exists in the `us-east-1` region, and you
  have the matching `.pem` file
- The remote state bucket `wilchesfitness-tfstate` already exists (S3, with
  version history on)

## Step 0 — Push to GitHub first

**The server downloads `main` from GitHub the moment it boots up** — so
whatever is on GitHub is exactly what will go live. Before running
`terraform apply`:

1. Replace the placeholder phone number and email in the footer of
   `app/html/index.html` (currently `+57 300 000 0000` and
   `info@wilchesfitness.com`).
2. `git push`, and wait for the automatic checks (CI) to pass.

Already done as of 2026-07-04: real prices and plans are in place, the
`noindex` tag that blocked search engines was removed, `robots.txt` now
allows indexing, and SEO/social-sharing tags and security headers are set
up. Still pending (needs the final web address): the canonical link and the
full image URL for social sharing — see the HTTPS/domain section below.

## Step 1 — Confirm your current IP address

SSH access is locked down to `admin_cidr` (defaults to
`181.63.25.164/32`). If your internet connection's public IP has changed
since then (common on home internet):

```bash
curl https://api.ipify.org
```

If it's different from the default, pass the new value in Step 3.

## Step 2 — Review what Terraform is about to do

```bash
cd terraform
terraform init
terraform plan
```

You should see exactly: `Plan: 2 to add, 0 to change, 0 to destroy.` If it
shows anything else, stop and figure out why before continuing.

## Step 3 — Apply it

```bash
terraform apply
# or, if your IP is different from the default:
terraform apply -var "admin_cidr=<your-ip>/32"
```

Read the plan it shows you, then type `yes`. Creating the server takes about
2 minutes, plus another 2–3 minutes for it to finish booting up (installing
Docker and building the site). When it's done, you'll get the site's address
(`portal_url`) and a ready-to-use SSH command.

### Optional: test it privately before making it public

To publish the site but keep it visible only to you at first:

```bash
terraform apply -var "http_ingress_cidr=<your-ip>/32"
```

Once you've checked everything looks right, open it to everyone with:

```bash
terraform apply -var "http_ingress_cidr=0.0.0.0/0"
```

(This only changes the firewall rule — the server itself isn't touched.)

## Step 4 — Check it worked

```bash
terraform output portal_url
curl -sI http://<ip>/ | grep -iE "200|content-security"
```

Then run the full test suite against the live site (from the repo, once the
site is either public or your IP is allowed through):

```bash
docker run --rm -v "<repo>:/repo" -w /repo -e BASE_URL=http://<ip> \
  mcr.microsoft.com/playwright:v1.53.0-noble sh -c "npm ci && npm run test:e2e"
```

## Updating the site after it's live

The server builds the site from `main` when it boots — it doesn't
auto-update after that. To push a content change live:

```bash
# after pushing to main and CI is green:
ssh -i <WilchesFitness.pem> ubuntu@<ip> \
  "cd /opt/warrior-code-portal && git pull && cd app && docker compose up -d --build"
```

If something goes wrong, see docs/ROLLBACK.md.

## Adding HTTPS / a custom domain (recommended next step)

Port 443 is already open in the firewall, but right now the server only
speaks plain HTTP. Once you have a domain name:

1. Point an `A` record at the server's IP address (consider reserving an
   Elastic IP first, so the address doesn't change if the server restarts:
   `aws ec2 allocate-address`).
2. On the server, set up something to handle HTTPS in front of nginx. The
   simplest option is Caddy (it gets free certificates automatically), or
   certbot paired with nginx installed directly on the server.
3. Update the `canonical` link and `og:image` URL to use `https://`, then
   redeploy.

Until HTTPS is set up, treat the site as HTTP-only, and don't add any login
or payment flows that handle card data (the payment plan in
docs/PAYMENTS.md deliberately uses provider-hosted pages so card numbers
never pass through this server).

## Tearing it down

```bash
cd terraform && terraform destroy
```

This brings the AWS cost back down to nearly $0 (just pennies for the S3
state bucket). The site keeps working locally the whole time, and can be
republished any time with `terraform apply`.

## Alternative: Cloudflare Pages ($0/month)

The comparison between static hosts, including how to set up Cloudflare
Pages, is in docs/ARCHITECTURE.md §2. It's still the cheapest option if you
ever want to move off AWS — the site itself wouldn't need any changes
(`app/html` would simply become the folder Cloudflare publishes).
