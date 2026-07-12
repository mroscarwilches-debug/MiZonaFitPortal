# Accepting Online Payments

> Status: implemented against Wompi's **sandbox** (test) environment. No real
> provider account/credentials exist yet — see docs/AUTH_AND_AGENDAMIENTO.md
> for what the owner needs to set up before this goes live.

## Background

The site sells three personal coaching plans (Consultoría Express, Protocolo
Estándar, Protocolo Black — a fourth plan, Seminario Corporativo, is a
B2B quote request and isn't part of this flow). The business is based in
Bogotá, Colombia, so the payment provider needs to support Colombian pesos
(COP), local payment methods (PSE, Nequi, cards), and settle funds into a
Colombian bank account.

## Comparing providers (Colombia, 2026)

| | Wompi (Bancolombia) | Mercado Pago | Stripe |
|---|---|---|---|
| Local methods (PSE, Nequi) | ✅ Best coverage | ✅ Good | ⚠️ Limited |
| Card payments | ✅ | ✅ | ✅ |
| Recurring monthly billing | ✅ (payment links / API) | ✅ | ✅ Best API |
| Fees (approximate) | ~2.65% + a fixed fee | ~3.29%–3.99% | ~3.25% + extra for international |
| Pays out to a Colombian bank | ✅ Native (Bancolombia) | ✅ | ⚠️ More friction |
| Hosted checkout (no backend needed) | ✅ Payment links | ✅ Checkout Pro | ✅ Payment Links |
| Free sandbox for testing | ✅ Full sandbox | ✅ | ✅ |

**Chosen: Wompi** — the best coverage for local payment methods, the lowest
fees, native settlement to Bancolombia, and a hosted checkout that needs no
card data to ever touch this site.

## How it actually works (implemented)

1. A client registers (`signup.html`), then lands on `checkout.html` for
   their chosen plan.
2. `checkout.js` builds a Wompi **Web Checkout** redirect URL: the owner's
   sandbox public key, a unique reference (`<plan>_<userId>_<timestamp>`),
   and a redirect URL back to `payment-confirmation.html`. The browser is
   redirected there — no card data is ever collected, stored, or
   transmitted by this site.
3. Wompi calls the `wompi-webhook` Supabase Edge Function server-to-server
   when the transaction resolves. That function verifies Wompi's event
   signature (the events secret never leaves Supabase), then records the
   payment status in the "Estado de Cliente" tab of the owner's Google
   Sheet, keyed by the client's email.
4. `payment-confirmation.html` polls the `client-status` function (which
   reads that same sheet) until it reflects the approved payment — the
   redirect itself is never treated as proof of payment, only the webhook is.

Full setup steps (Wompi sandbox account, events webhook URL, secrets) are in
docs/AUTH_AND_AGENDAMIENTO.md.

## Prices are in USD, charged in COP at the day's exchange rate

`index.html`, `signup.html`, and `checkout.html` all show plan prices in USD
($25/$90/$115 for Consultoría Express/Protocolo Estándar/Protocolo Black —
defined once in `PLANS` in `app/html/js/config.js`). Since Wompi charges in
COP, `checkout.js` converts the USD price to COP right when the client clicks
"Pagar", using Colombia's official daily exchange rate (TRM — Tasa
Representativa del Mercado), published as open data by the Colombian
government (`app/html/js/trm.js`). If that API is unreachable, it falls back
to a fixed rate in `config.js` (`FALLBACK_USD_TO_COP`) so checkout still
works — just slightly less precise. The checkout page also shows the client
an estimated COP amount before they pay, so there are no surprises.

## The site's payment logic stays in one place

Everything payment-related lives in `app/html/js/checkout.js` (building the
Wompi URL and doing the USD→COP conversion) and
`supabase/functions/wompi-webhook/` (confirming the payment) — the plan
catalog (`PLANS` in `app/html/js/config.js`) is the one place that defines
each plan's id, name, and USD price, so adding or repricing a plan doesn't
touch any other file.

## Known follow-up before going live

- **Switch to production**: once Wompi's business onboarding is complete
  (RUT + bank account), swap the sandbox public key and events secret for
  the production ones — no code changes needed, only the two credentials.
