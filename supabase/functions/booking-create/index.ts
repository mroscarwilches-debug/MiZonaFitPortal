// Books the client's first interview: re-validates the requested slot
// server-side (never trusts the client-sent time blindly), creates the
// Google Calendar event with a Meet link, and records the booking in the
// "Estado de Cliente" sheet so the dashboard reflects it immediately.
import { corsHeaders } from '../_shared/cors.ts';
import { getAuthenticatedUser } from '../_shared/verify-user.ts';
import { queryFreeBusy, createEvent } from '../_shared/calendar.ts';
import { CALENDAR_ID, isLegalSlot, getSlotEnd, formatSlotLabel } from '../_shared/availability.ts';
import { getRows, updateRowCells, appendRow } from '../_shared/sheets.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  const user = await getAuthenticatedUser(req);
  if (!user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  const { startIso } = await req.json();
  if (!startIso || !isLegalSlot(startIso)) {
    return new Response(JSON.stringify({ error: 'invalid-slot' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const endIso = getSlotEnd(startIso);

  // Re-check right before booking to close the race between when the
  // client loaded the slot list and when they clicked it.
  const busy = await queryFreeBusy(CALENDAR_ID, startIso, endIso);
  const stillFree = !busy.some((b) => new Date(startIso) < new Date(b.end) && new Date(b.start) < new Date(endIso));
  if (!stillFree) {
    return new Response(JSON.stringify({ error: 'slot-taken' }), {
      status: 409,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  await createEvent(CALENDAR_ID, {
    summary: `Entrevista inicial — ${user.name}`,
    description: 'Primera llamada — El Código del Guerrero.',
    startIso,
    endIso,
    attendeeEmail: user.email,
  });

  const spreadsheetId = Deno.env.get('REGISTRO_INICIAL_SHEET_ID')!;
  const sheetName = 'Estado de Cliente';
  const { headers, rows } = await getRows(spreadsheetId, sheetName);
  const existingRow = rows.find(
    (r) => (r.values['Correo'] ?? '').trim().toLowerCase() === user.email.trim().toLowerCase()
  );

  const updates = { 'Entrevista agendada (fecha y hora)': formatSlotLabel(startIso) };
  if (existingRow) {
    await updateRowCells(spreadsheetId, sheetName, existingRow.rowNumber, headers, updates);
  } else {
    await appendRow(spreadsheetId, sheetName, headers, { Correo: user.email, Nombre: user.name, ...updates });
  }

  return new Response(JSON.stringify({ ok: true, startIso }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
