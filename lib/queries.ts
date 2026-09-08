import { cache } from "react";
import { supabasePublic } from "@/lib/supabase/public";
import {
  CATEGORIES as SEED_CATEGORIES,
  OUTLETS as SEED_OUTLETS,
} from "@/lib/seed-data";
import type { Category, Outlet, HomeSection, Post, PostCard } from "@/lib/types";
import { DEFAULT_HOME_LIMIT, type GroupKey } from "@/lib/site-config";

/**
 * Column lists for the public reads.
 *
 * These used to be `select *`. The public site never renders an outlet's
 * `description` or `click_count`, nor a post's `content` outside the article
 * page itself — but every render was pulling them across the wire and turning
 * them into JavaScript objects. Naming the columns keeps the working set
 * proportional to what is on screen rather than to the size of the tables.
 */
const OUTLET_PUBLIC_COLS =
  "id, slug, name, name_bn, url, logo_url, is_featured, open_external, sort_order, is_active, category:categories(slug)";

/** Same columns, but an inner join so the category slug can be filtered on. */
const OUTLET_CATEGORY_COLS =
  "id, slug, name, name_bn, url, logo_url, is_featured, open_external, sort_order, is_active, category:categories!inner(slug)";

const POST_CARD_COLS =
  "id, slug, title, excerpt, cover_image, published, featured, sort_order, click_count, published_at, created_at, updated_at";

/*
 * Reads hit Supabase when configured, else fall back to bundled seed data.
 * Caching is handled at the page level via `export const revalidate` (ISR);
 * admin writes call revalidatePath("/", "layout") to refresh immediately.
 */

/* -------------------------------------------------------------------------- */
/* Normalisers                                                                 */
/* -------------------------------------------------------------------------- */

function normCategory(row: Record<string, unknown>): Category {
  return {
    slug: row.slug as string,
    title: row.title as string,
    title_bn: (row.title_bn as string) ?? null,
    description: (row.description as string) ?? null,
    section_type: (row.section_type as Category["section_type"]) ?? "outlet_grid",
    parent_slug: (row.parent_slug as string) ?? null,
    group: (row.group_key as GroupKey) ?? "portals",
    sort_order: (row.sort_order as number) ?? 0,
    home: (row.show_on_home as boolean) ?? false,
    home_limit: (row.home_limit as number) ?? DEFAULT_HOME_LIMIT,
    accent: (row.accent as string) ?? null,
    is_active: (row.is_active as boolean) ?? true,
  };
}

function normOutlet(row: Record<string, unknown>): Outlet {
  const category = row.category as { slug?: string } | undefined;
  return {
    id: row.id as string,
    slug: (row.slug as string) ?? null,
    category_slug: category?.slug ?? (row.category_slug as string) ?? "",
    name: row.name as string,
    name_bn: (row.name_bn as string) ?? null,
    url: row.url as string,
    logo_url: (row.logo_url as string) ?? null,
    description: (row.description as string) ?? null,
    is_featured: (row.is_featured as boolean) ?? false,
    open_external: (row.open_external as boolean) ?? false,
    click_count: (row.click_count as number) ?? 0,
    sort_order: (row.sort_order as number) ?? 0,
    is_active: (row.is_active as boolean) ?? true,
  };
}

/* -------------------------------------------------------------------------- */
/* Cached base fetchers (DB with seed fallback)                                */
/* -------------------------------------------------------------------------- */

async function fetchCategories(): Promise<Category[]> {
  const db = supabasePublic();
  if (db) {
    try {
      const { data, error } = await db
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) return data.map(normCategory);
    } catch (e) {
      console.warn("[queries] categories DB read failed, using seed:", e);
    }
  }
  return SEED_CATEGORIES.filter((c) => c.is_active !== false);
}

async function fetchOutlets(): Promise<Outlet[]> {
  const db = supabasePublic();
  if (db) {
    try {
      const { data, error } = await db
        .from("outlets")
        .select(OUTLET_PUBLIC_COLS)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) return data.map(normOutlet);
    } catch (e) {
      console.warn("[queries] outlets DB read failed, using seed:", e);
    }
  }
  return SEED_OUTLETS.filter((o) => o.is_active !== false);
}

// Deduped per-request: header, footer and the page share one round-trip.
export const getAllCategories = cache(fetchCategories);
export const getAllOutlets = cache(fetchOutlets);

/* -------------------------------------------------------------------------- */
/* Derived selectors                                                           */
/* -------------------------------------------------------------------------- */

export async function getCategory(slug: string): Promise<Category | undefined> {
  return (await getAllCategories()).find((c) => c.slug === slug);
}

/**
 * Active outlets in one category, in display order.
 *
 * A single indexed query on `outlets(category_id, sort_order)` via an inner
 * join on the category slug. This used to load every outlet in the directory
 * (487 and growing) and filter in JavaScript, on each of the 22 category pages.
 */
export async function getOutletsByCategory(slug: string): Promise<Outlet[]> {
  const db = supabasePublic();
  if (db) {
    try {
      const { data, error } = await db
        .from("outlets")
        .select(OUTLET_CATEGORY_COLS)
        .eq("is_active", true)
        .eq("category.slug", slug)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      if (data) return data.map(normOutlet);
    } catch (e) {
      console.warn("[queries] outlets-by-category read failed, using seed:", e);
    }
  }
  return SEED_OUTLETS.filter((o) => o.is_active !== false && o.category_slug === slug).sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
}

export async function getDivisions(): Promise<Category[]> {
  return (await getAllCategories())
    .filter((c) => c.parent_slug === "local-newspaper")
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function getOutletById(id: string): Promise<Outlet | undefined> {
  return (await getAllOutlets()).find((o) => o.id === id);
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Fetch one outlet by pretty slug (or uuid) — fast targeted query. */
export async function getOutletByHandle(
  handle: string,
): Promise<Outlet | undefined> {
  const db = supabasePublic();
  if (db) {
    try {
      const col = UUID_RE.test(handle) ? "id" : "slug";
      const { data } = await db
        .from("outlets")
        .select(OUTLET_PUBLIC_COLS)
        .eq(col, handle)
        .maybeSingle();
      if (data) return normOutlet(data);
    } catch (e) {
      console.warn("[queries] getOutletByHandle failed:", e);
    }
  }
  return SEED_OUTLETS.find((o) => o.id === handle || o.slug === handle);
}

/** Fast single-outlet fetch (targeted query, not the whole table). */
export async function getOutletLight(id: string): Promise<Outlet | undefined> {
  const db = supabasePublic();
  if (db) {
    try {
      const { data } = await db
        .from("outlets")
        .select(OUTLET_PUBLIC_COLS)
        .eq("id", id)
        .maybeSingle();
      if (data) return normOutlet(data);
    } catch (e) {
      console.warn("[queries] getOutletLight failed:", e);
    }
  }
  return SEED_OUTLETS.find((o) => o.id === id);
}

export type ViewData = {
  outlet: Outlet;
  categoryTitle: string | null;
  categorySlug: string | null;
  related: Outlet[];
};

/** Everything the /view page needs in two targeted queries (fast). */
export async function getViewData(id: string): Promise<ViewData | null> {
  const db = supabasePublic();
  if (db) {
    try {
      const { data: o } = await db
        .from("outlets")
        .select("*, category:categories(slug,title)")
        .eq("id", id)
        .maybeSingle();
      if (o) {
        const { data: rel } = await db
          .from("outlets")
          .select("*, category:categories(slug)")
          .eq("category_id", (o as Record<string, unknown>).category_id as string)
          .eq("is_active", true)
          .neq("id", id)
          .order("sort_order", { ascending: true })
          .limit(10);
        const cat = (o as Record<string, unknown>).category as
          | { slug?: string; title?: string }
          | undefined;
        return {
          outlet: normOutlet(o),
          categoryTitle: cat?.title ?? null,
          categorySlug: cat?.slug ?? null,
          related: (rel ?? []).map(normOutlet),
        };
      }
    } catch (e) {
      console.warn("[queries] getViewData failed:", e);
    }
  }
  // Seed fallback
  const outlet = SEED_OUTLETS.find((o) => o.id === id);
  if (!outlet) return null;
  const cat = SEED_CATEGORIES.find((c) => c.slug === outlet.category_slug);
  return {
    outlet,
    categoryTitle: cat?.title ?? null,
    categorySlug: outlet.category_slug,
    related: SEED_OUTLETS.filter(
      (o) => o.category_slug === outlet.category_slug && o.id !== id,
    ).slice(0, 10),
  };
}

type HomeSectionRow = {
  category_slug: string;
  category_total: number | null;
  id: string;
  slug: string | null;
  name: string;
  name_bn: string | null;
  url: string;
  logo_url: string | null;
  is_featured: boolean | null;
  open_external: boolean | null;
  sort_order: number | null;
};

type HomeGroup = { outlets: Outlet[]; total: number };

/**
 * Homepage tiles straight from `home_section_outlets` (migration 0010): the
 * top `home_limit` active outlets per homepage category, chosen in Postgres.
 *
 * Returns null when there is no database, or when the view is missing because
 * the migration has not been run — the caller then falls back to the old
 * fetch-everything-and-slice path so the page still renders.
 */
const fetchHomeGroups = cache(async (): Promise<Map<string, HomeGroup> | null> => {
  const db = supabasePublic();
  if (!db) return null;
  try {
    const { data, error } = await db
      .from("home_section_outlets")
      .select("*")
      .order("category_sort", { ascending: true })
      .order("sort_order", { ascending: true });
    if (error) throw error;
    if (!data) return null;

    const map = new Map<string, HomeGroup>();
    for (const row of data as HomeSectionRow[]) {
      let group = map.get(row.category_slug);
      if (!group) {
        group = { outlets: [], total: row.category_total ?? 0 };
        map.set(row.category_slug, group);
      }
      group.outlets.push({
        id: row.id,
        slug: row.slug,
        category_slug: row.category_slug,
        name: row.name,
        name_bn: row.name_bn,
        url: row.url,
        logo_url: row.logo_url,
        is_featured: row.is_featured ?? false,
        open_external: row.open_external ?? false,
        sort_order: row.sort_order ?? 0,
        is_active: true,
      });
    }
    return map;
  } catch (e) {
    console.warn(
      "[queries] home_section_outlets unavailable (run migration 0010), using full-table path:",
      e,
    );
    return null;
  }
});

/**
 * Homepage sections in order. `outlets` is already capped to each category's
 * `home_limit`; `total` is the full count behind the "View all N" link.
 */
export async function getHomeSections(): Promise<HomeSection[]> {
  const [cats, groups] = await Promise.all([getAllCategories(), fetchHomeGroups()]);
  // Only reached when the view is unavailable; otherwise the whole outlets
  // table is never loaded at all.
  const all = groups ? null : await getAllOutlets();

  const sections = cats
    .filter((c) => c.home && !c.parent_slug)
    .sort((a, b) => a.sort_order - b.sort_order);

  return sections.map((category) => {
    if (category.section_type === "division_grid") {
      const children = cats
        .filter((c) => c.parent_slug === category.slug)
        .sort((a, b) => a.sort_order - b.sort_order);
      return { category, outlets: [], children };
    }

    if (groups) {
      const group = groups.get(category.slug);
      return {
        category,
        outlets: group?.outlets ?? [],
        total: group?.total ?? 0,
      };
    }

    const list = (all ?? [])
      .filter((o) => o.category_slug === category.slug)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const limit = category.home_limit ?? DEFAULT_HOME_LIMIT;
    return {
      category,
      outlets: limit > 0 ? list.slice(0, limit) : list,
      total: list.length,
    };
  });
}

/** Categories grouped for the header mega-menu. */
export async function getCategoriesByGroup(): Promise<Record<string, Category[]>> {
  const cats = await getAllCategories();
  const map: Record<string, Category[]> = {};
  for (const c of cats) {
    if (c.parent_slug) continue; // divisions handled separately
    (map[c.group] ??= []).push(c);
  }
  return map;
}

export async function searchOutlets(query: string): Promise<Outlet[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return (await getAllOutlets()).filter(
    (o) =>
      o.name.toLowerCase().includes(q) ||
      (o.name_bn ?? "").toLowerCase().includes(q) ||
      o.category_slug.includes(q),
  );
}

/* -------------------------------------------------------------------------- */
/* Blog                                                                        */
/* -------------------------------------------------------------------------- */

async function fetchPosts(): Promise<PostCard[]> {
  const db = supabasePublic();
  if (!db) return [];
  try {
    const { data, error } = await db
      .from("posts")
      .select(POST_CARD_COLS)
      .eq("published", true)
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as PostCard[];
  } catch (e) {
    console.warn("[queries] posts DB read failed:", e);
    return [];
  }
}

export const getPublishedPosts = cache(fetchPosts);

/**
 * The one article being rendered, body included. Targeted by slug rather than
 * scanning the cached list: that list no longer carries `content`, and pulling
 * every article's body to render one of them was the blog's worst read.
 */
export async function getPost(slug: string): Promise<Post | undefined> {
  const db = supabasePublic();
  if (!db) return undefined;
  try {
    const { data } = await db
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    return (data as Post) ?? undefined;
  } catch (e) {
    console.warn("[queries] getPost failed:", e);
    return undefined;
  }
}

/** Blog cards for the homepage: featured (admin-ordered) first, else latest. */
export async function getHomePosts(limit = 6): Promise<PostCard[]> {
  const posts = await getPublishedPosts();
  const featured = posts
    .filter((p) => p.featured)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const base = featured.length > 0 ? featured : posts;
  return base.slice(0, limit);
}

/** Newest published posts (fetchPosts already orders by published_at desc). */
export async function getRecentPosts(
  limit = 5,
  excludeSlug?: string,
): Promise<PostCard[]> {
  const posts = await getPublishedPosts();
  return posts.filter((p) => p.slug !== excludeSlug).slice(0, limit);
}

/** Most-viewed published posts — popularity is the click_count set by the beacon. */
export async function getPopularPosts(
  limit = 5,
  excludeSlug?: string,
): Promise<PostCard[]> {
  const posts = await getPublishedPosts();
  return [...posts]
    .filter((p) => p.slug !== excludeSlug)
    .sort((a, b) => (b.click_count ?? 0) - (a.click_count ?? 0))
    .slice(0, limit);
}

export type CategoryCount = {
  slug: string;
  title: string;
  title_bn?: string | null;
  group: GroupKey;
  count: number;
};

/**
 * How many active outlets the directory holds, counted by Postgres.
 *
 * `head: true` with an exact count returns the number in the Content-Range
 * header without shipping a single row — the home page needs the figure for its
 * intro copy and FAQ, not the records. Falls back to the seed data so the page
 * still renders a truthful number when the database is unreachable.
 */
export const getOutletTotal = cache(async (): Promise<number> => {
  const db = supabasePublic();
  if (db) {
    try {
      const { count, error } = await db
        .from("outlets")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);
      if (error) throw error;
      if (typeof count === "number") return count;
    } catch (e) {
      console.warn("[queries] outlet total read failed, falling back:", e);
    }
  }
  return SEED_OUTLETS.length;
});

/** Main (non-division) categories with active-outlet counts, for shortcuts + sidebar. */
/**
 * Outlet count per category slug, aggregated by Postgres.
 *
 * Reads the `category_outlet_counts` view rather than pulling every outlet row
 * back to count them here — the blog sidebar renders this on every article.
 */
const fetchOutletCounts = cache(async (): Promise<Map<string, number>> => {
  const out = new Map<string, number>();
  const db = supabasePublic();
  if (db) {
    try {
      const { data, error } = await db
        .from("category_outlet_counts")
        .select("slug, active_count");
      if (error) throw error;
      for (const r of (data ?? []) as { slug: string; active_count: number }[]) {
        out.set(r.slug, r.active_count ?? 0);
      }
      return out;
    } catch (e) {
      console.warn("[queries] outlet counts read failed, falling back:", e);
    }
  }
  for (const o of SEED_OUTLETS.filter((x) => x.is_active !== false)) {
    out.set(o.category_slug, (out.get(o.category_slug) ?? 0) + 1);
  }
  return out;
});

export async function getCategoriesWithCounts(): Promise<CategoryCount[]> {
  const [cats, counts] = await Promise.all([getAllCategories(), fetchOutletCounts()]);
  return cats
    .filter((c) => !c.parent_slug && c.slug !== "local-newspaper")
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => ({
      slug: c.slug,
      title: c.title,
      title_bn: c.title_bn,
      group: c.group,
      count: counts.get(c.slug) ?? 0,
    }));
}

/* -------------------------------------------------------------------------- */
/* Global Settings                                                             */
/* -------------------------------------------------------------------------- */

export type SiteSettings = { default_open_external: boolean };

export async function getGlobalSettings(): Promise<SiteSettings> {
  const db = supabasePublic();
  if (db) {
    try {
      const { data } = await db
        .from("settings")
        .select("key, value")
        .in("key", ["default_open_external"]);
      const map: Record<string, string> = {};
      for (const row of data ?? []) map[row.key] = row.value;
      return {
        default_open_external: map.default_open_external === "true",
      };
    } catch (e) {
      console.warn("[queries] settings read failed:", e);
    }
  }
  return { default_open_external: false };
}

export async function getDefaultOpenExternal(): Promise<boolean> {
  return (await getGlobalSettings()).default_open_external;
}
