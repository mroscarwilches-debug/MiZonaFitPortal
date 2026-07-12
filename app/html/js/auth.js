// Thin wrapper around Supabase Auth — the only place that touches
// supabase.auth directly, so every page shares the same behavior.
import { supabase } from './supabase-client.js';

export async function signUp({ name, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });
  // session is null when the Supabase project requires email confirmation
  // before a user can sign in — the caller uses this to decide what to show.
  return { user: data?.user ?? null, session: data?.session ?? null, error };
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { session: data?.session ?? null, error };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
}

// Call at the top of any protected page. Redirects to login.html (keeping
// the original destination) when there's no active session, and otherwise
// resolves with the session.
export async function requireSession() {
  const session = await getSession();
  if (!session) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`login.html?next=${next}`);
    return null;
  }
  return session;
}
