# Payment Gateway Integration Plan

> Status: PLAN ONLY. No provider account is created and no credentials exist.
> Everything here is sandbox-first and activates only at your explicit request.

## Context

The site sells three membership plans (Básico/Pro/Elite, monthly recurring).
Business is based in Bogotá, Colombia → the gateway must support COP, local
payment methods (PSE, Nequi, cards) and Colombian settlement.

## Provider comparison (Colombia, 2026)

| | Wompi (Bancolombia) | Mercado Pago | Stripe |
|---|---|---|---|
| Local methods (PSE, Nequi) | ✅ Best coverage | ✅ Good | ⚠️ Limited |
| Cards | ✅ | ✅ | ✅ |
| Recurring subscriptions | ✅ (payment links / API) | ✅ | ✅ Best API |
| Fees (approx.) | ~2.65% + fixed | ~3.29%–3.99% | ~3.25% + intl. considerations |
| Settlement to Colombian bank | ✅ Native (Bancolombia) | ✅ | ⚠️ More friction |
| Hosted checkout (no backend needed) | ✅ Payment links | ✅ Checkout Pro | ✅ Payment Links |
| Sandbox | ✅ Full sandbox environment | ✅ | ✅ |

**Recommendation: Wompi** — best local method coverage, lowest fees, native
Bancolombia settlement, and hosted payment links that work with a static site
(no backend required for phase 1).

## Integration phases

### Phase 1 — Hosted payment links (no code, no backend)
Each plan's "Empezar" button points to a provider-hosted payment link.
Site change: replace `href="#contacto"` with the link URL. Zero PCI scope,
zero backend, works today.

### Phase 2 — Embedded checkout (JS widget)
Provider widget opens in-page. Requires adding the provider script origin to
the CSP and a public (sandbox/production) key in the page. Still no backend.

### Phase 3 — Webhooks + membership management (only if needed)
Requires a small backend (Cloudflare Worker) to receive payment webhooks and a
data store for memberships. Out of scope until the business needs it.

## Code abstraction (already in place by design)

The site keeps payments behind one seam: every plan CTA is an `<a class="btn">`
inside `.plan`. Phase 1 = change three `href` values; no structural work.
When/if Phase 2 arrives, add `js/payments.js` exposing
`getCheckoutUrl(planId)` so provider choice stays swappable, with plan IDs
(`basic`, `pro`, `elite`) as the stable contract.

## Sandbox validation plan (pre-activation)

1. Create Wompi sandbox account (free, no bank account needed).
2. Create three sandbox payment links (one per plan).
3. Set them in the site on a branch; verify E2E flow with Wompi's test cards
   and sandbox PSE.
4. Only after your approval: swap sandbox links for production links
   (requires Wompi production onboarding: RUT + bank account).
