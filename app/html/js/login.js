import { validateEmail } from './validation.js';
import { signIn } from './auth.js';

const params = new URLSearchParams(window.location.search);
const next = params.get('next') || 'dashboard.html';

const form = document.getElementById('login-form');
const status = document.getElementById('form-status');

function showStatus(text, isError) {
  status.textContent = text;
  status.classList.toggle('error', Boolean(isError));
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = form.elements.email.value;
  const password = form.elements.password.value;

  const emailError = validateEmail(email);
  const passwordError = password ? null : 'Ingresa tu contraseña.';

  document.getElementById('error-email').textContent = emailError ?? '';
  document.getElementById('error-password').textContent = passwordError ?? '';
  form.elements.email.setAttribute('aria-invalid', emailError ? 'true' : 'false');
  form.elements.password.setAttribute('aria-invalid', passwordError ? 'true' : 'false');

  if (emailError || passwordError) {
    showStatus('Falta completar o corregir algunos campos — revisa lo marcado en rojo.', true);
    (emailError ? form.elements.email : form.elements.password).focus();
    return;
  }

  showStatus('Iniciando sesión…', false);
  const { error } = await signIn({ email, password });

  if (error) {
    showStatus('Correo o contraseña incorrectos.', true);
    return;
  }

  window.location.href = next;
});
