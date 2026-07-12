// Receives Wompi's payment confirmation (server-to-server, never trusted
// from the browser). Verifies the event signature, then writes the payment
// status into the "Registro Inicial" Google Sheet — this is the only place
// that ever marks a payment as approved.
import { corsHeaders } from '../_shared/cors.ts';
import { getRows, updateRowCells, appendRow } from '../_shared/sheets.ts';

interface WompiEvent {
  data: { transaction: Record<string, unknown> };
  signature: { properties: string[]; checksum: string };
  timestamp: number;
}

async function verifySignature(payload: WompiEvent, eventsSecret: string): Promise<boolean> {
  let concatenated = '';
  for (const propertyPath of payload.signature.properties) {
    const value = propertyPath
      .split('.')
      .slice(1) // drop the leading "transaction" segment; we index from payload.data.transaction
      .reduce((obj: unknown, key: string) => (obj as Record<string, unknown>)?.[key], payload.data.transaction);
    concatenated += value;
  }
  concatenated += payload.timestamp;
  concatenated += eventsSecret;

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(concatenated));
  const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return hex.toUpperCase() === payload.signature.checksum.toUpperCase();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const payload = (await req.json()) as WompiEvent;
  const eventsSecret = Deno.env.get('WOMPI_EVENTS_SECRET');
  if (!eventsSecret) return new Response('Server misconfigured', { status: 500 });

  const valid = await verifySignature(payload, eventsSecret);
  if (!valid) return new Response('Invalid signature', { status: 401 });

  const transaction = payload.data.transaction as {
    id: string;
    reference: string;
    status: string;
    customer_email?: string;
  };

  // Reference format from checkout.js: "<planSlug>_<userId>_<timestamp>"
  const [planSlug] = transaction.reference.split('_');
  const status = transaction.status === 'APPROVED' ? 'approved' : 'declined';
  const email = transaction.customer_email;

  if (!email) {
    return new Response(JSON.stringify({ ok: false, reason: 'missing customer_email' }), {
      status: 200, // acknowledge receipt so Wompi doesn't retry indefinitely
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const spreadsheetId = Deno.env.get('REGISTRO_INICIAL_SHEET_ID')!;
  const sheetName = 'Estado de Cliente';
  const { headers, rows } = await getRows(spreadsheetId, sheetName);
  const existingRow = rows.find(
    (r) => (r.values['Correo'] ?? '').trim().toLowerCase() === email.trim().toLowerCase()
  );

  const updates: Record<string, string> = {
    'Estado de pago': status,
    'Plan comprado': planSlug,
    'Fecha de pago': new Date().toISOString(),
    'Referencia Wompi': transaction.id,
  };

  if (existingRow) {
    await updateRowCells(spreadsheetId, sheetName, existingRow.rowNumber, headers, updates);
  } else {
    await appendRow(spreadsheetId, sheetName, headers, { Correo: email, ...updates });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
