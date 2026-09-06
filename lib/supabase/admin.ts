import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, hasServiceRole } from "@/lib/env";

/**
 * Service-role Supabase client — bypasses RLS. SERVER ONLY. Never import this
 * into a client component. Used for admin writes and moderated inserts.
 */
export function supabaseAdmin(): SupabaseClient {
  if (!hasServiceRole()) {
    throw new Error(
      "Supabase service role is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return createClient(env.supabaseUrl!, env.supabaseServiceKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const LOGO_BUCKET = "logos";
