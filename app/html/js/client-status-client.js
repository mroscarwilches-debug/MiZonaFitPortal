// Calls the client-status Edge Function, which looks up the logged-in
// user's row (by email) across the Google Sheets and returns a single
// consolidated status object. Shared by dashboard.js and
// payment-confirmation.js so both read the same shape.
import { SUPABASE_URL } from './config.js';

export async function fetchClientStatus(session) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/client-status`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!response.ok) return null;
  return response.json();
}
