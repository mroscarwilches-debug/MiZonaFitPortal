# Local Development Guide

Everything runs through Docker; no local Node.js, Terraform or image tooling is
required. Commands below are for PowerShell or Git Bash on Windows (adjust the
repo path if yours differs).

## Run the site

```bash
cd app
docker compose up --build          # http://localhost:8080
```

- `WEB_PORT=80 docker compose up --build` to serve on port 80 (production parity).
- `docker compose down` to stop.
- The container serves the files baked into the image; rebuild (`--build`) after
  editing anything under `app/html/`.

## Run the tests

Prerequisite: the site running on `:8080` (previous section).

```bash
docker run --rm --add-host=host.docker.internal:host-gateway ^
  -v "D:\Cloud Engineer\Git\MiZonaFitPortal:/repo" -w /repo ^
  -e BASE_URL=http://host.docker.internal:8080 ^
  mcr.microsoft.com/playwright:v1.53.0-noble ^
  sh -c "npm install && npm test"
```

- `npm run test:unit` — Vitest unit tests for `app/html/js/validation.js`.
- `npm run test:e2e` — Playwright E2E on desktop + mobile viewports, including
  an axe-core scan that fails on any WCAG A/AA violation.
- In Git Bash prefix docker commands with `MSYS_NO_PATHCONV=1` and use `\` line
  continuations instead of `^`.

## Performance audit (Lighthouse)

```bash
docker run --rm --shm-size=1g --add-host=host.docker.internal:host-gateway ^
  femtopixel/google-lighthouse:latest http://host.docker.internal:8080 ^
  --output=json --quiet --chrome-flags="--headless --no-sandbox --disable-dev-shm-usage"
```

Baseline (2026-07-04): performance 1.0, accessibility 1.0, CLS 0, TBT 0 ms.
`best-practices`/`seo` report HTTPS and `noindex` findings that are intentional
while local (see docs/PRODUCTION_CHECKLIST.md).

## Regenerating images

Curated originals live outside the repo under `F:\MiZonaFit` (multiple photo
shoots). The pipeline (`tools/optimize-images.mjs`) maps slugs to source files
(paths relative to that root) and emits AVIF/WebP responsive variants plus the
Open Graph JPEG into `app/html/assets/img/`:

```bash
docker run --rm ^
  -v "F:\MiZonaFit:/src" ^
  -v "D:\Cloud Engineer\Git\MiZonaFitPortal\app\html\assets\img:/out" ^
  -v "D:\Cloud Engineer\Git\MiZonaFitPortal\tools:/tools" ^
  -w /work node:22-bookworm-slim ^
  sh -c "cp /tools/optimize-images.mjs . && npm install sharp && node optimize-images.mjs"
```

To swap a photo, edit the `IMAGES` map in the script and re-run.

## Contact form in local mode

`app/html/index.html` has `data-endpoint=""` on the form. With an empty
endpoint the form validates and shows success without sending anything.
Production wiring is described in docs/DEPLOYMENT.md.
