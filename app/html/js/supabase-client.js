// Single Supabase client for the whole site. Loaded from a pinned CDN
// version (not vendored locally) to avoid reintroducing a bundler just for
// one dependency — see docs/AUTH_AND_AGENDAMIENTO.md for the CSP trade-off
// this requires (script-src/connect-src allow esm.sh and *.supabase.co).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
