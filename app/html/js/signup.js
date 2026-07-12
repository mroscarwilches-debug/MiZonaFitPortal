import { validateName, validateEmail, validatePassword } from './validation.js';
import { signUp } from './auth.js';
import { PLANS } from './config.js';

const params = new URLSearchParams(window.location.search);
const requestedPlan = params.get('plan');

const planSelect = document.getElementById('field-plan');
const planPriceEl = document.getElementById('plan-price');
const subtitle = document.getElementById('signup-plan-subtitle');

function updatePlanPrice() {
  const plan = PLANS[planSelect.value];
  planPriceEl.textContent = plan ? `$${plan.priceUSD.toLocaleString('en-US')} USD` : '';
}

for (const [slug, plan] of Object.entries(PLANS)) {
  const option = document.createElement('option');
  option.value = slug;
  option.textContent = `${plan.name} — $${plan.priceUSD.toLocaleString('en-US')} USD`;
  planSelect.appendChild(option);
}

if (requestedPlan && PLANS[requestedPlan]) {
  planSelect.value = requestedPlan;
  subtitle.textContent = `Estás a un paso de empezar tu ${PLANS[requestedPlan].name}.`;
}
updatePlanPrice();
planSelect.addEventListener('change', updatePlanPrice);

const form = document.getElementById('signup-form');
const status = document.getElementById('form-status');

const FIELDS = ['name', 'email', 'password', 'passwordConfirm'];

function showFieldErrors(errors) {
  let firstInvalid = null;
  for (const field of FIELDS) {
    const elementId = field === 'passwordConfirm' ? 'password-confirm' : field;
    const input = form.elements[field];
    const errorEl = document.getElementById(`error-${elementId}`);
    const message = errors[field] ?? '';
    errorEl.textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (message && !firstInvalid) firstInvalid = input;
  }
  return firstInvalid;
}

function showStatus(text, isError) {
  status.textContent = text;
  status.classList.toggle('error', Boolean(isError));
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = form.elements.name.value;
  const email = form.elements.email.value;
  const password = form.elements.password.value;
  const passwordConfirm = form.elements.passwordConfirm.value;

  const errors = {};
  const nameError = validateName(name);
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  if (nameError) errors.name = nameError;
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  if (!passwordError && password !== passwordConfirm) {
    errors.passwordConfirm = 'Las contraseñas no coinciden.';
  }

  const firstInvalid = showFieldErrors(errors);
  if (firstInvalid) {
    showStatus('Falta completar o corregir algunos campos — revisa lo marcado en rojo.', true);
    firstInvalid.focus();
    return;
  }

  showStatus('Creando tu cuenta…', false);
  const { user, session, error } = await signUp({ name, email, password });

  if (error) {
    showStatus(error.message === 'User already registered'
      ? 'Ya existe una cuenta con ese correo. Inicia sesión.'
      : 'No pudimos crear tu cuenta. Inténtalo de nuevo.', true);
    return;
  }

  if (!user) {
    showStatus('No pudimos crear tu cuenta. Inténtalo de nuevo.', true);
    return;
  }

  // If email confirmation is required, Supabase returns a user but no
  // session — send them to confirm before they can pay.
  if (!session) {
    showStatus('¡Cuenta creada! Revisa tu correo para confirmarla y luego inicia sesión para continuar con el pago.', false);
    form.reset();
    return;
  }

  window.location.href = `checkout.html?plan=${encodeURIComponent(planSelect.value)}`;
});
