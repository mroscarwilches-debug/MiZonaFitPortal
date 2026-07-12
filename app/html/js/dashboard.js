import { requireSession, signOut } from './auth.js';
import { fetchClientStatus } from './client-status-client.js';
import { MEASUREMENT_GUIDE_URL, VALORACION_FORM, SEGUIMIENTO_FORM, PLANS } from './config.js';

function buildPrefillUrl(formConfig, name, email) {
  const url = new URL(formConfig.baseUrl);
  url.searchParams.set(formConfig.entryNombre, name);
  url.searchParams.set(formConfig.entryCorreo, email);
  return url.toString();
}

function daysSince(isoDate) {
  if (!isoDate) return Infinity;
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24);
}

async function main() {
  const session = await requireSession();
  if (!session) return; // requireSession() already redirected to login.html

  document.getElementById('logout-button').addEventListener('click', async () => {
    await signOut();
    window.location.href = 'index.html';
  });

  const statusEl = document.getElementById('dashboard-status');
  const steps = {
    pendingPayment: document.getElementById('step-pending-payment'),
    valoracion: document.getElementById('step-valoracion'),
    schedule: document.getElementById('step-schedule'),
    blackRecurring: document.getElementById('step-black-recurring'),
    waitingGuide: document.getElementById('step-waiting-guide'),
    guideReady: document.getElementById('step-guide-ready'),
    monthlyCheckin: document.getElementById('step-monthly-checkin'),
  };

  const status = await fetchClientStatus(session);
  if (!status) {
    statusEl.textContent = 'No pudimos cargar tu información en este momento. Intenta de nuevo más tarde.';
    return;
  }

  const name = session.user.user_metadata?.full_name ?? session.user.email;
  const email = session.user.email;

  if (status.paymentStatus !== 'approved') {
    statusEl.textContent = 'Bienvenido/a. Este es el siguiente paso:';
    steps.pendingPayment.hidden = false;
    const plan = PLANS[status.plan];
    const link = document.getElementById('pending-payment-link');
    link.href = plan ? `checkout.html?plan=${encodeURIComponent(status.plan)}` : 'index.html#planes';
  } else if (!status.valoracionCompleted) {
    statusEl.textContent = '¡Pago confirmado! Este es el siguiente paso:';
    steps.valoracion.hidden = false;
    document.getElementById('measurement-guide-link').href = MEASUREMENT_GUIDE_URL;
    document.getElementById('valoracion-form-link').href = buildPrefillUrl(VALORACION_FORM, name, email);
  } else if (!status.interviewScheduled) {
    statusEl.textContent = 'Ya diligenciaste tu valoración. Este es el siguiente paso:';
    steps.schedule.hidden = false;
  } else {
    statusEl.textContent = 'Tu proceso está en marcha:';

    if (status.plan === 'black') {
      steps.blackRecurring.hidden = false;
    }

    if (status.guideUrl) {
      steps.guideReady.hidden = false;
      document.getElementById('guide-link').href = status.guideUrl;
    } else {
      steps.waitingGuide.hidden = false;
    }

    if (daysSince(status.lastMonthlyCheckin) >= 30) {
      steps.monthlyCheckin.hidden = false;
      document.getElementById('seguimiento-form-link').href = buildPrefillUrl(SEGUIMIENTO_FORM, name, email);
    }
  }
}

main();
