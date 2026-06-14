import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client for privileged server-only operations:
 *  - reading/writing auth user_metadata (role assignment)
 *  - storage uploads that bypass RLS
 *
 * NEVER import this into a client component. Service role key must stay server-side.
 */
export function createSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
