// Business rules for the interview booking system (docs/AUTH_AND_AGENDAMIENTO.md):
// only two 1-hour windows per day, only on days the owner's real calendar is
// actually free. Colombia (Bogotá) does not observe daylight saving time, so
// a fixed -05:00 offset is safe to hardcode here.

export const CALENDAR_ID = Deno.env.get('OWNER_CALENDAR_ID') ?? 'primary';
export const TIMEZONE_OFFSET = '-05:00';
export const SESSION_MINUTES = 60;
export const DAYS_AHEAD = 14;

export const WINDOWS = [
  { startHour: 6, endHour: 8 }, // 6:00–8:00 a.m.
  { startHour: 19, endHour: 21 }, // 7:00–9:00 p.m.
];

const SLOT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):00:00-05:00$/;

// Every legal 1-hour slot, starting tomorrow, for the next `daysAhead` days —
// before checking the calendar for conflicts. booking-availability filters
// this against real busy time; booking-create re-validates against this same
// list so a client can never book a time outside the allowed windows.
export function generateCandidateSlots(daysAhead = DAYS_AHEAD): string[] {
  const slots: string[] = [];
  const now = new Date();
  for (let d = 1; d <= daysAhead; d++) {
    const day = new Date(now);
    day.setUTCDate(day.getUTCDate() + d);
    const yyyy = day.getUTCFullYear();
    const mm = String(day.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(day.getUTCDate()).padStart(2, '0');
    for (const window of WINDOWS) {
      for (let hour = window.startHour; hour < window.endHour; hour++) {
        slots.push(`${yyyy}-${mm}-${dd}T${String(hour).padStart(2, '0')}:00:00${TIMEZONE_OFFSET}`);
      }
    }
  }
  return slots;
}

export function isLegalSlot(startIso: string): boolean {
  return generateCandidateSlots().includes(startIso);
}

export function getSlotEnd(startIso: string): string {
  const match = startIso.match(SLOT_PATTERN);
  if (!match) throw new Error('Unexpected slot format: ' + startIso);
  const [, yyyy, mm, dd, hh] = match;
  const endHour = String(Number(hh) + SESSION_MINUTES / 60).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${endHour}:00:00${TIMEZONE_OFFSET}`;
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function formatSlotLabel(startIso: string): string {
  const match = startIso.match(SLOT_PATTERN);
  if (!match) return startIso;
  const [, yyyy, mm, dd, hh] = match;
  // Noon UTC avoids any timezone edge case affecting which weekday it lands on.
  const date = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd), 12));
  const diaSemana = DIAS[date.getUTCDay()];
  const mes = MESES[date.getUTCMonth()];
  const hour = Number(hh);
  const period = hour < 12 ? 'a.m.' : 'p.m.';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const diaCapitalizado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
  return `${diaCapitalizado} ${Number(dd)} de ${mes}, ${hour12}:00 ${period}`;
}
