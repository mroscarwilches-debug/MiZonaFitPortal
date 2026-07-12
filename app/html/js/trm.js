// Converts USD to COP using Colombia's official daily exchange rate (TRM —
// Tasa Representativa del Mercado), published by datos.gov.co. Falls back to
// a fixed rate (config.js) if the API is unreachable, so checkout never
// breaks entirely because of it — just becomes slightly less precise.
import { TRM_API_URL, FALLBACK_USD_TO_COP } from './config.js';

const FETCH_TIMEOUT_MS = 4000;

export async function getUsdToCopRate() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const response = await fetch(TRM_API_URL, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`TRM API ${response.status}`);

    const [latest] = await response.json();
    const rate = Number(latest?.valor);
    if (!rate || Number.isNaN(rate)) throw new Error('TRM API returned no usable rate');
    return { rate, isLive: true };
  } catch {
    return { rate: FALLBACK_USD_TO_COP, isLive: false };
  }
}
