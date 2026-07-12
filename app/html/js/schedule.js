import { requireSession } from './auth.js';
import { SUPABASE_URL } from './config.js';

async function main() {
  const session = await requireSession();
  if (!session) return; // requireSession() already redirected to login.html

  const statusEl = document.getElementById('schedule-status');
  const gridEl = document.getElementById('slot-grid');
  const confirmedEl = document.getElementById('schedule-confirmed');

  async function callFunction(name, options = {}) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
    if (!response.ok) throw new Error(`${name} failed: ${response.status}`);
    return response.json();
  }

  async function loadSlots() {
    try {
      const { slots } = await callFunction('booking-availability');
      gridEl.innerHTML = '';
      if (!slots || slots.length === 0) {
        statusEl.textContent = 'No hay horarios disponibles en los próximos días. Intenta más tarde.';
        return;
      }
      statusEl.textContent = 'Elige el horario que más te convenga:';
      for (const slot of slots) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'slot-btn';
        button.textContent = slot.label;
        button.addEventListener('click', () => bookSlot(slot));
        gridEl.appendChild(button);
      }
    } catch {
      statusEl.textContent = 'No pudimos cargar los horarios disponibles. Intenta de nuevo más tarde.';
    }
  }

  async function bookSlot(slot) {
    document.querySelectorAll('.slot-btn').forEach((btn) => { btn.disabled = true; });
    statusEl.textContent = 'Confirmando tu horario…';

    try {
      await callFunction('booking-create', {
        method: 'POST',
        body: JSON.stringify({ startIso: slot.startIso }),
      });
      gridEl.hidden = true;
      statusEl.hidden = true;
      confirmedEl.hidden = false;
      document.getElementById('schedule-confirmed-detail').textContent =
        `Tu llamada quedó agendada para ${slot.label}. Te llegará la invitación con el enlace de Google Meet a tu correo.`;
    } catch {
      statusEl.textContent = 'Ese horario ya no está disponible. Elige otro.';
      document.querySelectorAll('.slot-btn').forEach((btn) => { btn.disabled = false; });
      loadSlots();
    }
  }

  loadSlots();
}

main();
