/** Centralised env access + capability flags. Server-only secrets are read lazily. */

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  get supabaseServiceKey() {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  },
  get adminPassword() {
    return process.env.ADMIN_PASSWORD;
  },
  get adminSessionSecret() {
    return process.env.ADMIN_SESSION_SECRET;
  },
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

/** True when public Supabase creds exist (enough for read queries). */
export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

/** True when the service-role key exists (required for admin writes). */
export function hasServiceRole(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseServiceKey);
}
