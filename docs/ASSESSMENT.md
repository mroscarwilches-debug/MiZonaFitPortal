# Project Assessment — Where Things Started

> Historical document: written back when the project was still called
> "MiZonaFitPortal", before the rebrand to "El Código del Guerrero". Kept for
> the record — this describes the *starting point*, not the current state.

Date: 2026-07-04
Author: Claude (automated engineering review)

## 1. What the project looked like at the start

### The site
- One HTML page: `app/html/index.html` (about 460 lines, with all the CSS
  and JavaScript written directly inside it instead of separate files).
- Content: a fitness landing page (hero, stats, services, pricing, footer)
  in Spanish.
- No build tools, no images, no favicon, and almost no SEO tags beyond a
  page title.
- Served by a generic `nginx:latest` container (`app/Dockerfile`,
  `app/docker-compose.yml`), on port 80.

### The AWS setup (Terraform, region us-east-1)
- One server (`aws_instance.example`): a t3.micro running Ubuntu 22.04, with
  the key pair `WilchesFitness`.
- On boot, it installed Docker, cloned this public GitHub repo, and ran
  `docker-compose up`.
- The firewall (`aws_security_group.web_sg`) had ports 80 and 22 open to
  **the entire internet** (`0.0.0.0/0`).
- Terraform's state was stored remotely in an S3 bucket
  (`wilchesfitness-tfstate`, with version history), but...
- ...local `terraform.tfstate` files were also committed to git, sitting
  right inside the `terraform/` folder despite the S3 setup.
- Large provider binaries (~700 MB) from `.terraform/` were also present
  locally.

### The automated pipeline (`.github/workflows/hola-mundo.yml`)
- Ran `terraform apply -auto-approve` on **every single push** to `main` —
  no human review of what it was about to change.
- Created the S3 state bucket from scratch on every run.
- Had no code review step, no linting, no tests, and didn't actually deploy
  the app itself — the server only ever pulled the app once, at boot time.

## 2. What we found wrong, ranked by how serious it was

| # | How serious | What was wrong |
|---|----------|---------|
| 1 | High | The site was open to the whole internet (ports 80/22) even though the goal was to keep it private during development. |
| 2 | High | SSH (port 22) was open to everyone — an easy target for automated password-guessing attacks. |
| 3 | High | Every push ran `terraform apply -auto-approve` with no review step — one bad commit could change production infrastructure with nobody looking. |
| 4 | Medium | Updating the site required recreating the whole server (deployment only happened in the boot script) — pushing changes to `app/` did nothing on its own. |
| 5 | Medium | The Terraform state file (and its backup) were committed to git — state files can contain sensitive values. |
| 6 | Medium | Running a t3.micro server 24/7 (about $8–10/month plus disk and IP costs) was overkill and expensive for a page that doesn't change. |
| 7 | Low | The nginx version wasn't pinned (used `latest`, which can change unexpectedly); no compression or caching was configured. |
| 8 | Low | Some code comments, resource names, and workflow names were in Spanish, breaking the project's English-only convention for code. |
| 9 | Low | No SEO tags (description, social sharing preview, sitemap, robots.txt), no accessibility review, and no real photos or branding were in use. |

## 3. What photo assets were available
- `F:\MiZonaFit`: brand logos (`logo.png`, `LOGO-MZF-1.png`, white variants,
  icons) and professional photoshoots (`FOTOESTUDIO21082024/Wilches
  team-*.jpg`, plus earlier shoots from 2022–2023).
- `F:\MarcaPersonal`: a personal photo archive — mostly unrelated raw
  material, not curated for the site.
- Action taken: pick a small, curated set (hero, services, about, logo),
  convert them to WebP/AVIF in multiple sizes, and add them to the repo
  under `app/html/assets/`. The originals stay on the `F:` drive.

## 4. Bottom line
The site's content and mobile-first CSS were a solid starting point. The
real problem was the infrastructure: it was open to the public, cost more
than it needed to, and its deployment pipeline could break production
without anyone reviewing the change first. See `docs/ARCHITECTURE.md` for
what was proposed to fix that.
