// Restrict this to the real site origin once it has a domain (see
// docs/AUTH_AND_AGENDAMIENTO.md) — '*' is a placeholder for local development.
const ALLOWED_ORIGIN = Deno.env.get('SITE_ORIGIN') ?? '*';

export const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
