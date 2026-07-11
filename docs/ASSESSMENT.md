# Project Assessment — Warrior Code Portal

> Historical document: written when the project was still named
> "MiZonaFitPortal", before the rebrand to "El Código del Guerrero".

Date: 2026-07-04
Author: Claude (automated engineering review)

## 1. Current State

### Application
- Single static page: `app/html/index.html` (~460 lines, inline CSS + inline JS).
- Content: fitness landing page (hero, stats, services, pricing plans, footer) in Spanish.
- No build system, no bundler, no images, no favicon, no SEO metadata beyond `<title>`.
- Served by `nginx:latest` inside Docker (`app/Dockerfile`, `app/docker-compose.yml`), port 80.

### Infrastructure (Terraform, AWS us-east-1)
- `aws_instance.example`: t3.micro Ubuntu 22.04, key pair `WilchesFitness`.
- `user_data` installs Docker, clones this public GitHub repo, runs `docker-compose up`.
- `aws_security_group.web_sg`: ports 80 and 22 open to `0.0.0.0/0`.
- Remote state in S3 bucket `wilchesfitness-tfstate` (versioned, created ad hoc by CI).
- Local `terraform.tfstate` files are committed inside `terraform/` directory despite S3 backend.
- `.terraform/` provider binaries (~700 MB class artifacts) are present locally.

### CI/CD (`.github/workflows/hola-mundo.yml`)
- Runs `terraform apply -auto-approve` on every push to `main`.
- Creates the S3 state bucket with AWS CLI on every run.
- No plan review, no lint, no tests, no image build/push, no app deployment step
  (the EC2 instance only pulls the app once at boot via `user_data`).

## 2. Key Findings

| # | Severity | Finding |
|---|----------|---------|
| 1 | High | Site is publicly exposed (SG 80/22 open to the world) while the stated goal is to stay private during development. |
| 2 | High | SSH (22) open to `0.0.0.0/0` — brute-force target. |
| 3 | High | `terraform apply -auto-approve` on every push, no plan gate — any bad commit changes production infra. |
| 4 | Medium | App updates require instance re-creation (deploy happens only in `user_data`); pushes to `app/` do nothing. |
| 5 | Medium | `terraform.tfstate` + backup committed to git (state may contain sensitive values). |
| 6 | Medium | EC2 t3.micro 24/7 (~$8–10/month + EBS + public IPv4 ~$3.6/month) is expensive and over-engineered for a static page. |
| 7 | Low | `nginx:latest` unpinned tag; no gzip/cache headers configured. |
| 8 | Low | Spanish used in code comments, resource names (`instancia_ip_publica`), workflow names — violates the English-only code rule. |
| 9 | Low | No SEO (meta description, Open Graph, sitemap, robots), no accessibility audit, no images/brand assets used. |

## 3. Assets Review
- `F:\MiZonaFit`: brand logos (`logo.png`, `LOGO-MZF-1.png`, `blanco*.png`, icons) and professional photo shoots (`FOTOESTUDIO21082024/Wilches team-*.jpg`, earlier shoots from 2022/2023).
- `F:\MarcaPersonal`: personal photo archive (mixed, mostly unrelated raw material).
- Action: curate a small set (hero, services, about, logo), convert to WebP/AVIF with responsive sizes, and vendor them into the repo under `app/html/assets/`. Originals stay on `F:`.

## 4. Conclusion
The site content and mobile-first CSS are a good starting point. The infrastructure
is the weak point: it is public, costly, and its deploy pipeline is unsafe.
See `docs/ARCHITECTURE.md` for the proposal.
