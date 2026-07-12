// Returns the logged-in client's consolidated status, read from the two
// tabs in the "Registro Inicial" spreadsheet: "Estado de Cliente" (payment,
// interview, guide) and "Registro Inicial" itself (did they submit the
// Valoración form). The dashboard uses this single response to decide which
// step to show next.
import { corsHeaders } from '../_shared/cors.ts';
import { getRows } from '../_shared/sheets.ts';
import { getAuthenticatedEmail } from '../_shared/verify-user.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const email = await getAuthenticatedEmail(req);
  if (!email) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  const spreadsheetId = Deno.env.get('REGISTRO_INICIAL_SHEET_ID')!;
  const needle = email.trim().toLowerCase();

  const [{ rows: estadoRows }, { rows: valoracionRows }] = await Promise.all([
    getRows(spreadsheetId, 'Estado de Cliente'),
    getRows(spreadsheetId, 'Registro Inicial'),
  ]);

  const estado = estadoRows.find((r) => (r.values['Correo'] ?? '').trim().toLowerCase() === needle);
  const valoracion = valoracionRows.find((r) => (r.values['Correo'] ?? '').trim().toLowerCase() === needle);

  const body = {
    paymentStatus: estado?.values['Estado de pago'] || null,
    plan: estado?.values['Plan comprado'] || null,
    valoracionCompleted: Boolean(valoracion),
    interviewScheduled: estado?.values['Entrevista agendada (fecha y hora)'] || null,
    guideUrl: estado?.values['Link de guía'] || null,
    lastMonthlyCheckin: estado?.values['Último seguimiento mensual'] || null,
  };

  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
