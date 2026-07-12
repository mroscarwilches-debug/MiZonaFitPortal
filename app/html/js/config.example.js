// Copy this file to config.js (gitignored) and fill in real values.
// Every value here is safe to expose in the browser — none of these are
// secrets. Real secrets (Supabase service_role key, Wompi private key,
// Wompi events secret, Google service account credentials) only ever live
// as environment variables on the Supabase Edge Functions — never here.
// See docs/AUTH_AND_AGENDAMIENTO.md for where each value comes from.

export const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR-SUPABASE-ANON-PUBLIC-KEY';

// Wompi sandbox public key (starts with "pub_test_"). Switch to a
// "pub_prod_" key only once real Wompi production onboarding is complete.
export const WOMPI_PUBLIC_KEY = 'pub_test_YOUR_SANDBOX_PUBLIC_KEY';
export const WOMPI_CHECKOUT_URL = 'https://checkout.wompi.co/p/';

// Public Google Drive link to the "toma de medidas" measurement guide PDF.
export const MEASUREMENT_GUIDE_URL = 'https://drive.google.com/file/d/REPLACE_ME/view';

// Base published form URLs (from Google Forms) + the entry IDs for the
// "Nombre" and "Correo" fields, obtained by running
// google-workspace/setup-forms.gs and reading the sample pre-filled URL it
// logs. Used to build a pre-filled link so clients don't retype what they
// already gave us.
export const VALORACION_FORM = {
  baseUrl: 'https://docs.google.com/forms/d/e/REPLACE_ME/viewform',
  entryNombre: 'entry.REPLACE_ME',
  entryCorreo: 'entry.REPLACE_ME',
};

export const SEGUIMIENTO_FORM = {
  baseUrl: 'https://docs.google.com/forms/d/e/REPLACE_ME/viewform',
  entryNombre: 'entry.REPLACE_ME',
  entryCorreo: 'entry.REPLACE_ME',
};

// Plan catalog — prices in USD, matching what index.html displays. Wompi
// charges in COP, so checkout.js converts at the moment of payment using
// the day's official exchange rate (see trm.js) — the client is always
// charged the COP equivalent of this USD price, never a separately
// maintained COP figure.
export const PLANS = {
  consultoria: { name: 'Consultoría Express', priceUSD: 25 },
  estandar: { name: 'Protocolo Estándar', priceUSD: 90 },
  black: { name: 'Protocolo Black', priceUSD: 115 },
};

// Colombia's official daily exchange rate (TRM), published as open data by
// the national government. See app/html/js/trm.js.
export const TRM_API_URL =
  'https://www.datos.gov.co/resource/32sa-8pi3.json?$select=valor,vigenciadesde&$order=vigenciadesde%20DESC&$limit=1';

// Used only if the TRM API above is unreachable at checkout time. Update
// this occasionally so it stays a reasonable approximation.
export const FALLBACK_USD_TO_COP = 4000;
