import { requireSession } from './auth.js';
import { fetchClientStatus } from './client-status-client.js';

const MAX_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 3000;

async function main() {
  const session = await requireSession();
  if (!session) return; // requireSession() already redirected to login.html

  const messageEl = document.getElementById('confirmation-message');
  const ctaEl = document.getElementById('confirmation-cta');

  // The Wompi redirect itself is not trustworthy proof of payment — only the
  // wompi-webhook Edge Function (triggered server-to-server by Wompi) is. We
  // poll client-status until it reflects what the webhook already confirmed.
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const status = await fetchClientStatus(session);
    if (status?.paymentStatus === 'approved') {
      messageEl.textContent = '¡Pago confirmado! Ya puedes continuar con tu proceso.';
      ctaEl.hidden = false;
      return;
    }
    if (attempt === MAX_ATTEMPTS) {
      messageEl.textContent =
        'Tu pago sigue en proceso. Puedes revisar el estado desde tu panel en unos minutos.';
      ctaEl.hidden = false;
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

main();
