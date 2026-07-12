# El Código del Guerrero — by Mr. Wilches

A fitness landing page (one static site, Spanish UI), ready for production.
Right now it only runs **locally**: no server exists in the cloud yet, and
the site is not published anywhere on the internet.

New to this repo? Start with
**[docs/GUIA_DEL_PROYECTO.md](docs/GUIA_DEL_PROYECTO.md)** — a plain-language
map of what every file and folder does (in Spanish).

## Run it locally (one command)

```bash
cd app
docker compose up --build
```

Open the site at http://localhost:8080 (or set `WEB_PORT=80` to use port 80
instead). This runs the exact same nginx setup that production would use, so
what you see locally is what you'd get live.

## What's in this repo

```
app/                  The website + how it runs
├── html/             The site itself: HTML/CSS/JS + images
├── nginx.conf        Web server settings (compression, caching, security headers)
├── Dockerfile         Recipe to build the web server image
└── docker-compose.yml One-command way to run it locally
supabase/functions/   4 small backend functions: login-gated payment/booking/status checks
google-workspace/     Script that recreates the client intake/tracking Forms + Sheets
terraform/            Blueprint for the AWS server (nothing is created yet — code only)
tools/                Script that prepares the site's photos
tests/                Automated checks (unit tests + full-browser tests)
docs/                 All the documentation
.github/workflows/    Automatic checks on every push (ci.yml); manual-only infra workflow
```

## Running the tests

Full details in [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md).
Short version (no need to install Node — everything runs inside Docker):

```bash
# with the site already running on :8080
docker run --rm --add-host=host.docker.internal:host-gateway \
  -v "<repo>:/repo" -w /repo -e BASE_URL=http://host.docker.internal:8080 \
  mcr.microsoft.com/playwright:v1.53.0-noble \
  sh -c "npm install && npm test"
```

## All the documentation

| Document | What it covers |
|---|---|
| [docs/GUIA_DEL_PROYECTO.md](docs/GUIA_DEL_PROYECTO.md) | Plain-language map of every file in the project (Spanish) |
| [docs/AUTH_AND_AGENDAMIENTO.md](docs/AUTH_AND_AGENDAMIENTO.md) | Login, payment, intake forms, and booking system — how it works and how to set it up (Spanish) |
| [docs/ASSESSMENT.md](docs/ASSESSMENT.md) | The project's starting point, before improvements |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Why the site is built this way, and hosting options compared |
| [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) | How to run, test, and update the site on your own computer |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | How to publish the site on AWS, step by step (done manually by the owner) |
| [docs/ROLLBACK.md](docs/ROLLBACK.md) | What to do if something breaks after publishing |
| [docs/BACKUP.md](docs/BACKUP.md) | What gets backed up, where, and how to restore it |
| [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md) | Checklist to work through before going live |
| [docs/SECURITY.md](docs/SECURITY.md) | Security measures in place and credentials to keep safe |
| [docs/PAYMENTS.md](docs/PAYMENTS.md) | How online payments work (Wompi, sandbox mode) |

## Where things stand today

- ✅ Site is complete: works well on mobile and desktop, passes accessibility checks (0 issues found by axe), scores 100/100 on Lighthouse performance
- ✅ Login, payment, intake, and booking system built (docs/AUTH_AND_AGENDAMIENTO.md): Supabase Auth for login, Wompi sandbox for payment, Google Forms/Sheets/Calendar for client data and scheduling — near-$0 cost at this scale
- ✅ Costs nothing right now: the AWS server was shut down on 2026-07-04; the server setup only exists as Terraform code, ready to use when needed
- ✅ Ready to publish whenever you want: `terraform plan` confirms it would create exactly 2 things; every push to GitHub runs automatic checks on the code, the Docker image, and the Terraform code — but it never publishes anything on its own
- 🔒 Not published yet. Publishing means following the manual steps in docs/DEPLOYMENT.md — and, since login/payments now exist, HTTPS is mandatory first (docs/SECURITY.md)
