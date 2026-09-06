// Fetches Supabase anon + service_role keys via the Management API and writes
// them into .env.local. Prints only non-secret info. Requires SB_TOKEN, SB_REF.
import { writeFileSync } from "node:fs";

const token = process.env.SB_TOKEN;
const ref = process.env.SB_REF;
if (!token || !ref) {
  console.error("Missing SB_TOKEN or SB_REF");
  process.exit(1);
}

const res = await fetch(
  `https://api.supabase.com/v1/projects/${ref}/api-keys?reveal=true`,
  { headers: { Authorization: `Bearer ${token}` } },
);
if (!res.ok) {
  console.error("api-keys failed:", res.status, await res.text());
  process.exit(1);
}
const keys = await res.json();
console.log("Key names returned:", keys.map((k) => k.name).join(", "));

const byName = (n) => keys.find((k) => k.name === n)?.api_key;
const anon = byName("anon");
const service = byName("service_role");

if (!anon || !service) {
  console.error("Could not find anon/service_role keys. Got:", keys.map((k) => k.name));
  process.exit(1);
}

const url = `https://${ref}.supabase.co`;
const env = `# Local dev — NOT committed. Auto-written by scripts/sb-write-env.mjs
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Admin (change these before production!)
ADMIN_PASSWORD=test-admin-pass
ADMIN_SESSION_SECRET=local-dev-session-secret-change-in-production-1234567890

# Supabase (project: ${ref})
NEXT_PUBLIC_SUPABASE_URL=${url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}
SUPABASE_SERVICE_ROLE_KEY=${service}
`;

writeFileSync(new URL("../.env.local", import.meta.url), env, "utf8");
console.log(`Wrote .env.local — url=${url}, anon len=${anon.length}, service len=${service.length}`);
