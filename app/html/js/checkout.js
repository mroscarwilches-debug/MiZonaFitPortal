import { requireSession, getSession } from './auth.js';
import { PLANS, WOMPI_PUBLIC_KEY, WOMPI_CHECKOUT_URL } from './config.js';
import { getUsdToCopRate } from './trm.js';

async function main() {
  const session = await requireSession();
  if (!session) return; // requireSession() already redirected to login.html

  const params = new URLSearchParams(window.location.search);
  const planSlug = params.get('plan');
  const plan = PLANS[planSlug];

  const summaryEl = document.getElementById('plan-summary');
  const payButton = document.getElementById('pay-button');
  const statusEl = document.getElementById('checkout-status');

  if (!plan) {
    summaryEl.innerHTML = '<p>No reconocemos ese plan. Vuelve a la página de planes e inténtalo de nuevo.</p>';
    return;
  }

  summaryEl.innerHTML = `
    <h3>${plan.name}</h3>
    <p class="price">$${plan.priceUSD.toLocaleString('en-US')} <span class="currency">USD</span></p>
    <p class="cop-estimate">Calculando el equivalente en pesos colombianos…</p>
  `;
  payButton.disabled = false;

  // Show the COP estimate right away so the client knows roughly what
  // they'll be charged — the same conversion runs again at the moment they
  // click "Pagar" so the rate used is as fresh as possible.
  const { rate, isLive } = await getUsdToCopRate();
  const copEstimate = Math.round(plan.priceUSD * rate);
  const copNote = summaryEl.querySelector('.cop-estimate');
  copNote.textContent = isLive
    ? `≈ ${copEstimate.toLocaleString('es-CO')} COP, según la TRM de hoy`
    : `≈ ${copEstimate.toLocaleString('es-CO')} COP (tasa de referencia; se confirma el valor exacto en Wompi)`;

  payButton.addEventListener('click', async () => {
    const { user } = await getSession().then((s) => ({ user: s?.user }));
    if (!user) return;

    payButton.disabled = true;
    statusEl.textContent = 'Calculando el valor a cobrar…';
    const { rate: payRate } = await getUsdToCopRate();
    const amountCOP = Math.round(plan.priceUSD * payRate);

    // Reference ties the Wompi transaction back to this user + plan so the
    // webhook (wompi-webhook Edge Function) knows whose row to update.
    // Underscore-separated: the user id is a UUID and already contains hyphens.
    const reference = `${planSlug}_${user.id}_${Date.now()}`;
    const redirectUrl = new URL('payment-confirmation.html', window.location.href).toString();

    const checkoutUrl = new URL(WOMPI_CHECKOUT_URL);
    checkoutUrl.searchParams.set('public-key', WOMPI_PUBLIC_KEY);
    checkoutUrl.searchParams.set('currency', 'COP');
    checkoutUrl.searchParams.set('amount-in-cents', String(amountCOP * 100));
    checkoutUrl.searchParams.set('reference', reference);
    checkoutUrl.searchParams.set('redirect-url', redirectUrl);
    checkoutUrl.searchParams.set('customer-email', user.email);

    statusEl.textContent = 'Redirigiendo a Wompi…';
    window.location.href = checkoutUrl.toString();
  });
}

main();
