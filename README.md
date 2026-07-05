# El Código del Guerrero — by Mr. Wilches

Production-ready fitness portal (static site, Spanish UI). Currently in
**local-only development**: no cloud infrastructure is provisioned and the site
is not published anywhere.

## Run locally (single command)

```bash
cd app
docker compose up --build
```

Site: http://localhost:8080 (set `WEB_PORT=80` to use port 80).
This runs the exact nginx image that production would run.

## Project layout

```
app/                  Site + runtime
├── html/             Static site source (HTML/CSS/JS + optimized images)
├── nginx.conf        Server config (compression, cache, security headers)
├── Dockerfile        nginx:1.27-alpine image
└── docker-compose.yml
terraform/            AWS infrastructure AS CODE ONLY (nothing provisioned)
tools/                Image optimization pipeline (Docker + sharp)
tests/                Unit (Vitest) + E2E/accessibility (Playwright + axe)
docs/                 Technical documentation (English)
.github/workflows/    ci.yml (quality checks only) · infra-manual.yml (manual dispatch only)
```

## Tests

See [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md). Summary (no local
Node needed, everything runs in Docker):

```bash
# with the site running on :8080
docker run --rm --add-host=host.docker.internal:host-gateway \
  -v "<repo>:/repo" -w /repo -e BASE_URL=http://host.docker.internal:8080 \
  mcr.microsoft.com/playwright:v1.53.0-noble \
  sh -c "npm install && npm test"
```

## Documentation

| Document | Purpose |
|---|---|
| [docs/ASSESSMENT.md](docs/ASSESSMENT.md) | Initial project assessment |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture and hosting comparison |
| [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) | Run, test, and regenerate assets locally |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Manual AWS EC2 deployment (owner-executed, one `terraform apply`) |
| [docs/ROLLBACK.md](docs/ROLLBACK.md) | Rollback procedures |
| [docs/BACKUP.md](docs/BACKUP.md) | Backup strategy |
| [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md) | Go-live checklist |
| [docs/SECURITY.md](docs/SECURITY.md) | Security posture and credential inventory |
| [docs/PAYMENTS.md](docs/PAYMENTS.md) | Payment gateway integration plan (sandbox-first) |

## Status

- ✅ Site complete: responsive, WCAG AA (axe: 0 violations), Lighthouse 100 performance
- ✅ Zero cloud cost: EC2 destroyed on 2026-07-04; infra exists only as Terraform code
- ✅ Deployment-ready: `terraform plan` verified (2 resources); CI validates code, Docker image and Terraform on every push — it never deploys
- 🔒 Not published. Publishing = the manual procedure in docs/DEPLOYMENT.md
