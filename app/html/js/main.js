// El Código del Guerrero — site behavior (navigation + contact form)
import { validateContactForm } from './validation.js';

// ── Mobile navigation ──────────────────────────────────────────────
const menu = document.getElementById('nav-menu');
const toggle = document.getElementById('nav-toggle');

function setMenuOpen(open) {
  menu.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
}

toggle.addEventListener('click', () => {
  setMenuOpen(!menu.classList.contains('open'));
});

// Close the menu after choosing a section link
menu.addEventListener('click', (event) => {
  if (event.target.tagName === 'A') setMenuOpen(false);
});

// Close the menu with the Escape key
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.classList.contains('open')) {
    setMenuOpen(false);
    toggle.focus();
  }
});

// ── Plans carousel ─────────────────────────────────────────────────
const track = document.getElementById('plans-track');
const prevBtn = document.getElementById('plans-prev');
const nextBtn = document.getElementById('plans-next');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// One card width + gap = one navigation step
function carouselStep() {
  const card = track.querySelector('.plan');
  const gap = parseFloat(getComputedStyle(track).columnGap) || 16;
  return card.getBoundingClientRect().width + gap;
}

function updateCarouselButtons() {
  const maxScroll = track.scrollWidth - track.clientWidth;
  prevBtn.disabled = track.scrollLeft <= 1;
  nextBtn.disabled = track.scrollLeft >= maxScroll - 1;
}

prevBtn.addEventListener('click', () => {
  track.scrollBy({ left: -carouselStep(), behavior: reduceMotion ? 'auto' : 'smooth' });
});
nextBtn.addEventListener('click', () => {
  track.scrollBy({ left: carouselStep(), behavior: reduceMotion ? 'auto' : 'smooth' });
});
track.addEventListener('scroll', updateCarouselButtons, { passive: true });
window.addEventListener('resize', updateCarouselButtons);
updateCarouselButtons();

// ── Contact form ───────────────────────────────────────────────────
// The endpoint comes from the form's data-endpoint attribute.
// Empty endpoint = local/dev mode: validate and show success without
// sending anything anywhere. Production wiring: docs/DEPLOYMENT.md.
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');

function showFieldErrors(errors) {
  for (const field of ['name', 'email', 'message']) {
    const input = form.elements[field];
    const errorEl = document.getElementById(`error-${field}`);
    const message = errors[field] ?? '';
    errorEl.textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }
}

function showStatus(text, isError) {
  status.textContent = text;
  status.classList.toggle('error', Boolean(isError));
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const data = {
    name: form.elements.name.value,
    email: form.elements.email.value,
    message: form.elements.message.value,
    honeypot: form.elements.company.value,
  };

  const result = validateContactForm(data);
  showFieldErrors(result.errors);

  if (!result.valid) {
    showStatus('Revisa los campos marcados e inténtalo de nuevo.', true);
    return;
  }
  if (result.bot) {
    // Silently drop bot submissions
    showStatus('¡Gracias! Te contactaremos muy pronto.', false);
    form.reset();
    return;
  }

  const endpoint = form.dataset.endpoint;
  if (!endpoint) {
    // Local/dev mode: no external service is contacted
    showStatus('¡Gracias! Te contactaremos muy pronto. (Modo local: el mensaje no se envió)', false);
    form.reset();
    return;
  }

  try {
    showStatus('Enviando…', false);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name, email: data.email, message: data.message }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    showStatus('¡Gracias! Te contactaremos muy pronto.', false);
    form.reset();
  } catch {
    showStatus('No pudimos enviar tu mensaje. Escríbenos directamente por correo.', true);
  }
});
