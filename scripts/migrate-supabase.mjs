/**
 * One-off: copy every row and stored file from one Supabase project to another.
 *
 *   SRC_URL=… SRC_KEY=… DST_URL=… DST_KEY=… node scripts/migrate-supabase.mjs
 *
 * Both keys must be service-role: RLS would otherwise hide most rows on read
 * and reject every write.
 *
 * Order matters. `outlets.category_id` references `categories.id`, and
 * `admin_reset_codes.admin_id` references `admins.id`, so parents go first.
 * Ids are copied verbatim rather than regenerated, which keeps those references
 * intact and — just as importantly — keeps every /read/<uuid> link and every
 * stored logo URL working.
 */
import { createClient } from "@supabase/supabase-js";

const need = (k) => {
  const v = process.env[k];
  if (!v) throw new Error(`${k} is required`);
  return v;
};

const src = createClient(need("SRC_URL"), need("SRC_KEY"), { auth: { persistSession: false } });
const dst = createClient(need("DST_URL"), need("DST_KEY"), { auth: { persistSession: false } });

/** Parents before children. */
const TABLES = [
  "categories",
  "outlets",
  "posts",
  "submissions",
  "settings",
  "admins",
  "admin_reset_codes",
];

const PAGE = 500;

async function readAll(table) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await src.from(table).select("*").range(from, from + PAGE - 1);
    if (error) throw new Error(`read ${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

async function copyTable(table) {
  let rows;
  try {
    rows = await readAll(table);
  } catch (e) {
    console.log(`  ${table.padEnd(18)} SKIP (${e.message})`);
    return;
  }
  if (rows.length === 0) {
    console.log(`  ${table.padEnd(18)} 0 rows`);
    return;
  }

  let written = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    // upsert, not insert: makes a re-run safe rather than a duplicate-key wall.
    const { error } = await dst.from(table).upsert(chunk, { onConflict: "id" });
    if (error) {
      // `settings` is keyed by `key`, not `id`.
      const retry = await dst.from(table).upsert(chunk, { onConflict: "key" });
      if (retry.error) throw new Error(`write ${table}: ${error.message}`);
    }
    written += chunk.length;
  }
  console.log(`  ${table.padEnd(18)} ${written}/${rows.length} rows`);
}

/** Copy every object in a storage bucket, preserving its path. */
async function copyBucket(bucket) {
  const { data: buckets } = await dst.storage.listBuckets();
  if (!buckets?.some((b) => b.name === bucket)) {
    await dst.storage.createBucket(bucket, { public: true });
    console.log(`  created bucket "${bucket}"`);
  }

  // Storage list() is per-prefix, so walk directories breadth-first.
  const files = [];
  const queue = [""];
  while (queue.length) {
    const prefix = queue.shift();
    const { data, error } = await src.storage.from(bucket).list(prefix, { limit: 1000 });
    if (error) {
      console.log(`  ${bucket}: list "${prefix}" failed — ${error.message}`);
      continue;
    }
    for (const entry of data ?? []) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) queue.push(path); // a folder
      else files.push(path);
    }
  }

  let ok = 0;
  let failed = 0;
  for (const path of files) {
    const { data, error } = await src.storage.from(bucket).download(path);
    if (error || !data) {
      failed++;
      continue;
    }
    const buf = Buffer.from(await data.arrayBuffer());
    const up = await dst.storage
      .from(bucket)
      .upload(path, buf, { contentType: data.type || undefined, upsert: true });
    if (up.error) failed++;
    else ok++;
  }
  console.log(`  ${bucket.padEnd(18)} ${ok} files copied${failed ? `, ${failed} failed` : ""}`);
}

/*
 * Clear the destination first.
 *
 * schema.sql and migration 0005 seed a few rows (the international category,
 * the default_open_external setting). Those collide on the UNIQUE slug/key
 * while holding different ids, and upserting on the natural key instead would
 * renumber ids and break outlets.category_id. Wiping is the only way to end up
 * with an exact clone. Children before parents.
 */
async function wipeDestination() {
  const order = [...TABLES].reverse();
  for (const table of order) {
    const keyed = table === "settings" ? "key" : "id";
    const { error } = await dst.from(table).delete().not(keyed, "is", null);
    console.log(`  ${table.padEnd(18)} ${error ? "skip (" + error.message + ")" : "cleared"}`);
  }
}

console.log("=== clearing destination ===");
await wipeDestination();

console.log("\n=== tables ===");
for (const t of TABLES) await copyTable(t);

console.log("\n=== storage ===");
for (const b of ["logos", "media"]) await copyBucket(b);

console.log("\n=== verify (destination counts) ===");
for (const t of TABLES) {
  const { count, error } = await dst.from(t).select("*", { count: "exact", head: true });
  console.log(`  ${t.padEnd(18)} ${error ? "ERR " + error.message : count}`);
}
