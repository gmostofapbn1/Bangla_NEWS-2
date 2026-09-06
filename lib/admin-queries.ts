import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/env";
import {
  SETTING_KEYS,
  defaultSettings,
  isPublicSetting,
  mergeSettings,
  type SettingKey,
  type Settings,
} from "@/lib/settings";
import { DEFAULT_HOME_LIMIT } from "@/lib/site-config";
import type { Category, Post, Submission } from "@/lib/types";

export type AdminOutlet = {
  id: string;
  slug: string | null;
  name: string;
  name_bn: string | null;
  url: string;
  logo_url: string | null;
  description: string | null;
  is_featured: boolean;
  is_active: boolean;
  open_external: boolean;
  sort_order: number;
  click_count: number;
  category_slug: string | null;
  category_title: string | null;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapOutlet(r: Record<string, any>): AdminOutlet {
  return {
    id: r.id,
    slug: r.slug ?? null,
    name: r.name,
    name_bn: r.name_bn,
    url: r.url,
    logo_url: r.logo_url,
    description: r.description,
    is_featured: r.is_featured,
    is_active: r.is_active,
    open_external: r.open_external ?? false,
    sort_order: r.sort_order ?? 0,
    click_count: r.click_count ?? 0,
    category_slug: r.category?.slug ?? null,
    category_title: r.category?.title ?? null,
  };
}

export async function adminListOutlets(): Promise<AdminOutlet[]> {
  if (!hasServiceRole()) return [];
  const { data } = await supabaseAdmin()
    .from("outlets")
    .select("*, category:categories(slug,title)")
    .order("sort_order", { ascending: true });
  return (data ?? []).map(mapOutlet);
}

/** Outlets in one category, in display order — powers the scoped sections. */
export async function adminListOutletsByCategory(slug: string): Promise<AdminOutlet[]> {
  return (await adminListOutletsByCategories([slug]))[slug] ?? [];
}

/**
 * Outlets for a set of categories, grouped by slug and in display order.
 *
 * Two indexed queries (unique slug lookup, then `outlets(category_id, sort_order)`)
 * instead of fetching the whole outlets table and filtering in JavaScript —
 * the divisional section only needs ~30 of 160+ rows.
 */
export async function adminListOutletsByCategories(
  slugs: string[],
): Promise<Record<string, AdminOutlet[]>> {
  const grouped: Record<string, AdminOutlet[]> = {};
  for (const s of slugs) grouped[s] = [];
  if (!hasServiceRole() || slugs.length === 0) return grouped;

  const sb = supabaseAdmin();
  const { data: cats } = await sb
    .from("categories")
    .select("id, slug")
    .in("slug", slugs);
  if (!cats || cats.length === 0) return grouped;

  const slugById = new Map<string, string>(
    (cats as { id: string; slug: string }[]).map((c) => [c.id, c.slug]),
  );

  const { data } = await sb
    .from("outlets")
    .select("*, category:categories(slug,title)")
    .in("category_id", [...slugById.keys()])
    .order("sort_order", { ascending: true });

  for (const row of data ?? []) {
    const slug = slugById.get((row as { category_id: string }).category_id);
    if (slug) grouped[slug].push(mapOutlet(row));
  }
  return grouped;
}

export async function adminGetOutlet(id: string): Promise<AdminOutlet | null> {
  if (!hasServiceRole()) return null;
  const { data: r } = await supabaseAdmin()
    .from("outlets")
    .select("*, category:categories(slug,title)")
    .eq("id", id)
    .maybeSingle();
  return r ? mapOutlet(r) : null;
}

export async function adminListCategories(): Promise<Category[]> {
  if (!hasServiceRole()) return [];
  const { data } = await supabaseAdmin()
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data ?? []).map((r: Record<string, any>) => ({
    slug: r.slug,
    title: r.title,
    title_bn: r.title_bn,
    description: r.description,
    section_type: r.section_type ?? "outlet_grid",
    parent_slug: r.parent_slug,
    group: r.group_key,
    sort_order: r.sort_order ?? 0,
    home: r.show_on_home ?? false,
    home_limit: r.home_limit ?? DEFAULT_HOME_LIMIT,
    accent: r.accent,
    is_active: r.is_active ?? true,
  }));
}

export async function adminGetCategory(slug: string): Promise<Category | null> {
  const all = await adminListCategories();
  return all.find((c) => c.slug === slug) ?? null;
}

/**
 * How many outlets sit in each category, keyed by slug. Reads the
 * `category_outlet_counts` view (migration 0007) so Postgres does the GROUP BY
 * over its category_id index instead of shipping every outlet row — with an
 * embedded join — to the app to be counted in JavaScript.
 */
export async function adminOutletCounts(): Promise<Record<string, number>> {
  if (!hasServiceRole()) return {};
  const { data, error } = await supabaseAdmin()
    .from("category_outlet_counts")
    .select("slug, outlet_count");
  if (error) {
    console.warn("[admin] outlet counts failed:", error.message);
    return {};
  }
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { slug: string; outlet_count: number }[]) {
    counts[row.slug] = row.outlet_count ?? 0;
  }
  return counts;
}

export async function adminListSubmissions(): Promise<Submission[]> {
  if (!hasServiceRole()) return [];
  const { data } = await supabaseAdmin()
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Submission[];
}

export async function adminListPosts(): Promise<Post[]> {
  if (!hasServiceRole()) return [];
  const { data } = await supabaseAdmin()
    .from("posts")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  return (data ?? []) as Post[];
}

export async function adminGetPost(id: string): Promise<Post | null> {
  if (!hasServiceRole()) return null;
  const { data } = await supabaseAdmin().from("posts").select("*").eq("id", id).single();
  return (data as Post) ?? null;
}

export type AdminStats = {
  outlets: number;
  activeOutlets: number;
  categories: number;
  pendingSubmissions: number;
  posts: number;
  publishedPosts: number;
  totalClicks: number;
  configured: boolean;
};

export async function adminStats(): Promise<AdminStats> {
  if (!hasServiceRole()) {
    return {
      outlets: 0,
      activeOutlets: 0,
      categories: 0,
      pendingSubmissions: 0,
      posts: 0,
      publishedPosts: 0,
      totalClicks: 0,
      configured: false,
    };
  }
  // One round-trip, aggregated in Postgres (migration 0007). The previous
  // version issued seven queries and streamed every outlet's click_count back
  // just to sum it — expensive against a Sydney database.
  const { data, error } = await supabaseAdmin().rpc("admin_dashboard_stats").maybeSingle();

  if (error || !data) {
    if (error) console.warn("[admin] stats rpc failed:", error.message);
    return {
      outlets: 0,
      activeOutlets: 0,
      categories: 0,
      pendingSubmissions: 0,
      posts: 0,
      publishedPosts: 0,
      totalClicks: 0,
      configured: true,
    };
  }

  const row = data as Record<string, number | string | null>;
  const n = (v: number | string | null | undefined) => Number(v ?? 0);

  return {
    outlets: n(row.outlets),
    activeOutlets: n(row.active_outlets),
    categories: n(row.categories),
    pendingSubmissions: n(row.pending_submissions),
    posts: n(row.posts),
    publishedPosts: n(row.published_posts),
    totalClicks: n(row.total_clicks),
    configured: true,
  };
}

/** Top outlets by click count — the dashboard "most opened" list. */
export async function adminTopOutlets(limit = 6): Promise<AdminOutlet[]> {
  if (!hasServiceRole()) return [];
  const { data } = await supabaseAdmin()
    .from("outlets")
    .select("*, category:categories(slug,title)")
    .order("click_count", { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapOutlet);
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                    */
/* -------------------------------------------------------------------------- */

export async function adminGetSetting(key: string): Promise<string | null> {
  if (!hasServiceRole()) return null;
  const { data } = await supabaseAdmin()
    .from("settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return data?.value ?? null;
}

export async function adminUpdateSetting(key: string, value: string): Promise<void> {
  if (!hasServiceRole()) return;
  await supabaseAdmin()
    .from("settings")
    .upsert({ key, value, is_public: isPublicSetting(key), updated_at: new Date().toISOString() });
}

/**
 * Every setting, including the private SMTP block. Service-role only — never
 * call this from anything that renders for the public site.
 */
export const adminGetSettings = cache(async (): Promise<Settings> => {
  if (!hasServiceRole()) return defaultSettings();
  const { data, error } = await supabaseAdmin().from("settings").select("key, value");
  if (error) {
    console.warn("[admin] settings read failed, using defaults:", error);
    return defaultSettings();
  }
  return mergeSettings(data ?? []);
});

/**
 * Upsert a batch of settings, tagging each row with its public/private flag.
 *
 * Degrades when migration 0006 has not been applied yet: without the
 * `is_public` column the anon read policy is still `using (true)`, so writing
 * SMTP credentials would expose them to the browser. Public settings are saved
 * anyway and the private ones are reported back as skipped.
 */
export async function adminSaveSettings(
  values: Partial<Settings>,
): Promise<{ skippedPrivate: boolean }> {
  if (!hasServiceRole()) return { skippedPrivate: false };
  const now = new Date().toISOString();

  const entries = Object.entries(values).filter(([key]) =>
    SETTING_KEYS.includes(key as SettingKey),
  );
  if (entries.length === 0) return { skippedPrivate: false };

  const rows = entries.map(([key, value]) => ({
    key,
    value: value ?? "",
    is_public: isPublicSetting(key),
    updated_at: now,
  }));

  const sb = supabaseAdmin();
  const { error } = await sb.from("settings").upsert(rows);
  if (!error) return { skippedPrivate: false };

  // Column missing → pre-0006 schema.
  if (!/is_public/i.test(error.message)) throw error;

  const publicRows = rows
    .filter((r) => r.is_public)
    .map(({ key, value, updated_at }) => ({ key, value, updated_at }));
  const hadPrivate = rows.length !== publicRows.length;

  if (publicRows.length > 0) {
    const retry = await sb.from("settings").upsert(publicRows);
    if (retry.error) throw retry.error;
  }
  return { skippedPrivate: hadPrivate };
}
