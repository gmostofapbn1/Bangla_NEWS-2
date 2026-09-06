// Runs a SQL file against a Supabase project via the Management API query
// endpoint. Requires SB_TOKEN, SB_REF. Usage: node scripts/sb-run-sql.mjs <file>
import { readFileSync } from "node:fs";

const token = process.env.SB_TOKEN;
const ref = process.env.SB_REF;
const file = process.argv[2];
if (!token || !ref || !file) {
  console.error("Usage: SB_TOKEN=.. SB_REF=.. node scripts/sb-run-sql.mjs <file>");
  process.exit(1);
}

const query = readFileSync(file, "utf8");
const res = await fetch(
  `https://api.supabase.com/v1/projects/${ref}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  },
);

const text = await res.text();
if (!res.ok) {
  console.error(`SQL failed (${res.status}) for ${file}:`, text.slice(0, 1000));
  process.exit(1);
}
console.log(`OK: ran ${file} (${res.status})`);
