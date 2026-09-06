import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "@/lib/env";

/**
 * Anon Supabase client for public reads. RLS restricts this to active/published
 * rows. Returns null when Supabase isn't configured (caller falls back to seed).
 */
export function supabasePublic(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  return createClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    auth: { persistSession: false },
  });
}
