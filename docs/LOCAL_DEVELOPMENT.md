# Local Development Guide

Everything runs through Docker — you don't need Node.js, Terraform, or any
image tools installed on your own machine. The commands below work in
PowerShell or Git Bash on Windows (adjust the repo path if yours is
different).

## Run the site

```bash
cd app
docker compose up --build          # http://localhost:8080
```

- Run `WEB_PORT=80 docker compose up --build` to serve it on port 80 instead
  (matches production).
- `docker compose down` stops it.
- The container serves whatever was baked into the image at build time — if
  you edit anything under `app/html/`, rebuild (`--build`) to see the
  change.

## Run the tests

Before running these, make sure the site is already running on `:8080`
(previous section).

```bash
docker run --rm --add-host=host.docker.internal:host-gateway ^
  -v "D:\Cloud Engineer\Git\warrior-code-portal:/repo" -w /repo ^
  -e BASE_URL=http://host.docker.internal:8080 ^
  mcr.microsoft.com/playwright:v1.53.0-noble ^
  sh -c "npm install && npm test"
```

- `npm run test:unit` runs just the fast checks on
  `app/html/js/validation.js` (Vitest).
- `npm run test:e2e` opens a real browser and tests the whole site on both
  desktop and mobile screen sizes, including an accessibility scan (axe)
  that fails if it finds any WCAG A/AA violation.
- In Git Bash, add `MSYS_NO_PATHCONV=1` before the docker commands, and use
  `\` instead of `^` for line breaks.

## Checking performance (Lighthouse)

```bash
docker run --rm --shm-size=1g --add-host=host.docker.internal:host-gateway ^
  femtopixel/google-lighthouse:latest http://host.docker.internal:8080 ^
  --output=json --quiet --chrome-flags="--headless --no-sandbox --disable-dev-shm-usage"
```

Last measured (2026-07-04): perfect scores for performance and
accessibility, no layout shift, 0ms blocking time. The `best-practices` and
`seo` categories will flag the missing HTTPS and the `noindex` tag while
running locally — that's expected and intentional (see
docs/PRODUCTION_CHECKLIST.md).

## Updating the site's photos

The original, curated photos live outside this repo, in `F:\MiZonaFit`
(several photoshoots). The script `tools/optimize-images.mjs` maps each
photo to a short name and generates lightweight AVIF/WebP versions in
several sizes, plus the social-sharing image, into
`app/html/assets/img/`:

```bash
docker run --rm ^
  -v "F:\MiZonaFit:/src" ^
  -v "D:\Cloud Engineer\Git\warrior-code-portal\app\html\assets\img:/out" ^
  -v "D:\Cloud Engineer\Git\warrior-code-portal\tools:/tools" ^
  -w /work node:22-bookworm-slim ^
  sh -c "cp /tools/optimize-images.mjs . && npm install sharp && node optimize-images.mjs"
```

To swap in a different photo, edit the `IMAGES` list at the top of the
script and run it again.

## The contact form while working locally

`app/html/index.html` sets `data-endpoint=""` on the form. With no endpoint
configured, the form still validates input and shows a success message —
it just doesn't send anything anywhere. How to wire it up for real is
covered in docs/DEPLOYMENT.md.

## Login, checkout, and the client dashboard

These pages (`signup.html`, `login.html`, `checkout.html`, `dashboard.html`,
`schedule.html`) need real values in `app/html/js/config.js` to work — copy
it from `config.example.js` and fill it in following
docs/AUTH_AND_AGENDAMIENTO.md (Supabase project, Wompi sandbox key, Google
Forms links). Rebuild the container (`docker compose up --build`) after
editing it, same as any other file under `app/html/`.

Without a real `config.js`, these pages will load but fail as soon as they
try to reach Supabase — that's expected until you've done the one-time setup
in docs/AUTH_AND_AGENDAMIENTO.md.
