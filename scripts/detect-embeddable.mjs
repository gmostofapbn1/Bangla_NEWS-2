/**
 * Checks every outlet's X-Frame-Options / CSP frame-ancestors and sets
 * open_external = true (redirect) for sites that block embedding, false
 * (fullscreen framed viewer) for sites that allow it.
 * Run: SB_TOKEN=.. SB_REF=.. node scripts/detect-embeddable.mjs
 */
const token = process.env.SB_TOKEN;
const ref = process.env.SB_REF;
if (!token || !ref) {
  console.error("Missing SB_TOKEN or SB_REF");
  process.exit(1);
}

async function sql(query) {
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
  if (!res.ok) throw new Error(`SQL ${res.status}: ${await res.text()}`);
  return res.json();
}

function blocks(headers) {
  const xfo = headers.get("x-frame-options");
  if (xfo && /deny|sameorigin/i.test(xfo)) return true;
  const csp = headers.get("content-security-policy") || "";
  const m = csp.match(/frame-ancestors([^;]*)/i);
  if (m && !m[1].includes("*")) return true;
  return false;
}

async function embeddable(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
      },
    });
    clearTimeout(t);
    return !blocks(res.headers);
  } catch {
    return false; // unknown → safest to redirect
  }
}

const rows = await sql("select id, url, name from public.outlets");
console.log(`Checking ${rows.length} sites…`);

const good = [];
const CONC = 12;
for (let i = 0; i < rows.length; i += CONC) {
  const batch = rows.slice(i, i + CONC);
  const results = await Promise.all(
    batch.map(async (r) => ({ id: r.id, ok: await embeddable(r.url) })),
  );
  for (const r of results) if (r.ok) good.push(r.id);
  process.stdout.write(".");
}
console.log(`\nEmbeddable (framed): ${good.length}/${rows.length}`);

await sql("update public.outlets set open_external = true");
if (good.length) {
  const ids = good.map((id) => `'${id}'`).join(",");
  await sql(`update public.outlets set open_external = false where id in (${ids})`);
}
console.log("Done — open_external flags updated.");
