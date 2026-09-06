// Create or reset an admin account directly, for when you are locked out.
//
//   node scripts/set-admin-password.mjs <username> <password> [email]
//
// Creates the account as `owner` if no owner exists yet, otherwise updates the
// named account's password. Reads Supabase credentials from .env.local.
//
// The password is passed as an argument, so it lands in your shell history —
// clear it afterwards if that matters to you (`history -d` / clear the buffer).

import { readFileSync } from "node:fs";
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";
import { createClient } from "@supabase/supabase-js";

const scrypt = promisify(scryptCb);

/* Must match lib/password.ts exactly, or the app will not accept the hash. */
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;
const MAXMEM = 64 * 1024 * 1024;

async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password.normalize("NFKC"), salt, KEYLEN, {
    N,
    r: R,
    p: P,
    maxmem: MAXMEM,
  });
  return ["scrypt", N, R, P, salt.toString("base64"), hash.toString("base64")].join("$");
}

const [, , usernameArg, passwordArg, emailArg] = process.argv;
if (!usernameArg || !passwordArg) {
  console.error("Usage: node scripts/set-admin-password.mjs <username> <password> [email]");
  process.exit(1);
}
if (passwordArg.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const username = usernameArg.trim().toLowerCase();
const email = emailArg ? emailArg.trim().toLowerCase() : null;

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  if (!line.trim() || line.trim().startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i > 0) env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  process.exit(1);
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const probe = await sb.from("admins").select("id").limit(1);
if (probe.error) {
  console.error(
    "The `admins` table does not exist. Run supabase/migrations/0006_admin_accounts_settings.sql first.\n" +
      probe.error.message,
  );
  process.exit(1);
}

const password_hash = await hashPassword(passwordArg);

const existing = await sb.from("admins").select("id, role").eq("username", username).maybeSingle();
const owner = await sb.from("admins").select("id").eq("role", "owner").maybeSingle();

if (existing.data) {
  const { error } = await sb
    .from("admins")
    .update({ password_hash, is_active: true, updated_at: new Date().toISOString() })
    .eq("id", existing.data.id);
  if (error) {
    console.error("Update failed:", error.message);
    process.exit(1);
  }
  console.log(`Password reset for existing ${existing.data.role} account "${username}".`);
} else {
  const role = owner.data ? "admin" : "owner";
  const ALL = [
    "dashboard", "categories", "outlets", "divisions", "international",
    "posts", "submissions", "admins", "settings",
  ];
  const { error } = await sb.from("admins").insert({
    username,
    name: role === "owner" ? "Owner" : username,
    email,
    password_hash,
    role,
    permissions: ALL,
    is_active: true,
  });
  if (error) {
    console.error("Insert failed:", error.message);
    process.exit(1);
  }
  console.log(`Created ${role} account "${username}".`);
}

console.log("Sign in at /admin/login with that username and password.");
