// Verifies the caller's Supabase session (the JWT from the site's
// Authorization header) and returns their email. Every function that reads
// or writes per-user data calls this first — nothing trusts a client-supplied
// email/id without this check.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.2';

export interface AuthenticatedUser {
  email: string;
  name: string;
}

export async function getAuthenticatedUser(req: Request): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) return null;
  return {
    email: data.user.email,
    name: (data.user.user_metadata?.full_name as string | undefined) ?? data.user.email,
  };
}

export async function getAuthenticatedEmail(req: Request): Promise<string | null> {
  const user = await getAuthenticatedUser(req);
  return user?.email ?? null;
}
