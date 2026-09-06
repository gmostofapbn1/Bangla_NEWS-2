"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { can, type SectionKey } from "@/lib/permissions";
import { hasServiceRole } from "@/lib/env";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin, LOGO_BUCKET } from "@/lib/supabase/admin";
import { deleteUploadedImage } from "@/lib/uploads";
import { outletInput, categoryInput, postInput } from "@/lib/validation";
import { slugify } from "@/lib/seed-data";
import { toSlug } from "@/lib/utils";
import { DEFAULT_HOME_LIMIT } from "@/lib/site-config";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

/**
 * Guard for every write below. Server Actions are reachable by direct POST, so
 * the permission check lives here rather than only on the page that renders the
 * form. Returns an error string, or null when the write may proceed.
 */
async function ensureCanWrite(section: SectionKey): Promise<string | null> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (!can(admin, section)) {
    return "এই কাজটি করার অনুমতি আপনার নেই।";
  }
  if (!hasServiceRole()) {
    return "Supabase রাইট কনফিগার করা নেই। NEXT_PUBLIC_SUPABASE_URL এবং SUPABASE_SERVICE_ROLE_KEY সেট করুন।";
  }
  return null;
}

function bool(formData: FormData, key: string): boolean {
  const v = formData.get(key);
  return v === "on" || v === "true" || v === "1";
}

function num(formData: FormData, key: string, fallback = 0): number {
  // A missing or blank box means "unchanged/default", not zero — `Number("")`
  // is 0, which would silently reset a field the form never rendered.
  const raw = formData.get(key);
  if (raw === null || String(raw).trim() === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * The slug to save: the slug box if it holds anything usable, otherwise the
 * title. Both are pushed through `toSlug`, so "Khulna Division News" and
 * "khulna-division-news" are equivalent and a blank box is not an error.
 */
function derivedSlug(formData: FormData, titleField: string): string {
  const typed = toSlug(String(formData.get("slug") ?? ""));
  if (typed) return typed;
  return toSlug(String(formData.get(titleField) ?? ""));
}

function collectFieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}

/*
 * Revalidation.
 *
 * `revalidatePath("/", "layout")` purges EVERY prerendered page — the homepage,
 * all 22 category pages, the divisions, the blog and the content pages. The
 * admin used to call it on every single action, so adding one outlet (of 487)
 * invalidated the whole site and every page then re-rendered on its next hit,
 * each one re-querying Supabase. That is a large burst of cache writes and
 * function invocations per click, and it is what overwhelms the platform.
 *
 * So: purge the whole tree only for changes that genuinely affect every page,
 * and otherwise touch just the pages that actually show the changed row.
 */

/** Everything — for changes that alter the shared header, footer or branding. */
function refreshEverything() {
  revalidatePath("/", "layout");
}

/**
 * The pages that show one outlet: the homepage section it appears in, its
 * category page, and the divisional page when it belongs to a division.
 */
function refreshOutlet(categorySlug?: string | null) {
  revalidatePath("/");
  if (categorySlug) {
    revalidatePath(`/category/${categorySlug}`);
    revalidatePath(`/local/${categorySlug}`);
  }
}

/** The pages that show a blog post. */
function refreshPosts(slug?: string | null) {
  revalidatePath("/");
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
}

/**
 * Where to send the admin after a list action. The outlet list is reachable
 * from several sections (all outlets, divisions, international), so each form
 * posts the page it came from and we return there instead of always bouncing
 * to /admin/outlets. Only same-origin admin paths are accepted.
 */
function returnTo(formData: FormData, fallback: string): string {
  const raw = String(formData.get("return_to") ?? "");
  return raw.startsWith("/admin") ? raw : fallback;
}

/* -------------------------------------------------------------------------- */
/* Outlets                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A free `outlets.slug`, derived from the name (or whatever the admin typed).
 *
 * `outlets_slug_idx` is unique, and two papers can legitimately share a name
 * across categories, so a taken slug gets -2, -3, … appended. Returns null when
 * there is nothing sluggable — the column is nullable and /read/[slug] falls
 * back to the uuid, so a null is safe rather than fatal.
 */
async function uniqueOutletSlug(
  sb: SupabaseClient,
  desired: string,
  excludeId?: string,
): Promise<string | null> {
  const base = toSlug(desired);
  if (!base) return null;

  const query = sb.from("outlets").select("slug").like("slug", `${base}%`);
  const { data } = excludeId ? await query.neq("id", excludeId) : await query;

  const taken = new Set(
    (data ?? []).map((r) => (r as { slug: string | null }).slug).filter(Boolean),
  );
  if (!taken.has(base)) return base;
  for (let n = 2; n < 500; n++) {
    if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

async function uploadLogoIfPresent(formData: FormData): Promise<string | null> {
  const file = formData.get("logo_file");
  if (!(file instanceof File) || file.size === 0) return null;
  const sb = supabaseAdmin();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ""))}.${ext}`;
  const { error } = await sb.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: true });
  if (error) throw error;
  return sb.storage.from(LOGO_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function upsertOutlet(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const blocked = await ensureCanWrite("outlets");
  if (blocked) return { error: blocked };

  const parsed = outletInput.safeParse({
    name: formData.get("name"),
    name_bn: formData.get("name_bn") ?? "",
    url: formData.get("url"),
    category_slug: formData.get("category_slug"),
    logo_url: formData.get("logo_url") ?? "",
    description: formData.get("description") ?? "",
    is_featured: bool(formData, "is_featured"),
    is_active: bool(formData, "is_active"),
    open_external: bool(formData, "open_external"),
    sort_order: num(formData, "sort_order"),
  });
  if (!parsed.success) {
    return { error: "নিচের ভুলগুলো ঠিক করুন।", fieldErrors: collectFieldErrors(parsed.error.issues) };
  }
  const data = parsed.data;
  const sb = supabaseAdmin();

  try {
    const { data: cat, error: catErr } = await sb
      .from("categories")
      .select("id")
      .eq("slug", data.category_slug)
      .single();
    if (catErr || !cat) return { error: "নির্বাচিত ক্যাটাগরিটি আর নেই।" };

    const uploaded = await uploadLogoIfPresent(formData);
    const logo_url = uploaded ?? (data.logo_url || null);

    const id = String(formData.get("id") ?? "");

    // New outlet with no explicit order → append to the end of its category so
    // it lands predictably instead of colliding at sort_order 0.
    let sortOrder = data.sort_order;
    if (!id && !sortOrder) {
      const { data: last } = await sb
        .from("outlets")
        .select("sort_order")
        .eq("category_id", cat.id)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      sortOrder = (last?.sort_order ?? 0) + 10;
    }

    const row: Record<string, unknown> = {
      category_id: cat.id,
      name: data.name,
      name_bn: data.name_bn || null,
      url: data.url,
      logo_url,
      description: data.description || null,
      is_featured: data.is_featured,
      is_active: data.is_active,
      open_external: data.open_external,
      sort_order: sortOrder,
    };

    // Give every outlet a readable /read/[slug] handle. Admin-created rows used
    // to be saved with slug = null and fell back to the raw uuid in the URL.
    // On edit the slug is only rewritten when the admin actually typed one, so
    // renaming a paper never silently breaks its existing link.
    const typedSlug = String(formData.get("slug") ?? "");
    if (!id) {
      row.slug = await uniqueOutletSlug(sb, typedSlug || data.name);
    } else if (toSlug(typedSlug)) {
      row.slug = await uniqueOutletSlug(sb, typedSlug, id);
    }

    if (id) {
      const { error } = await sb.from("outlets").update(row).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await sb.from("outlets").insert(row);
      if (error) throw error;
    }
  } catch (e) {
    console.error("[admin] upsertOutlet failed:", e);
    return { error: "আউটলেটটি সংরক্ষণ করা যায়নি। সার্ভার লগ দেখুন।" };
  }

  refreshOutlet(data.category_slug);
  redirect(returnTo(formData, "/admin/outlets"));
}

/** Move an outlet up/down within its own category (reassigns sort_order). */
export async function moveOutlet(formData: FormData) {
  const blocked = await ensureCanWrite("outlets");
  if (blocked) return;
  const back = returnTo(formData, "/admin/outlets");
  const id = String(formData.get("id") ?? "");
  const dir = String(formData.get("dir") ?? "");
  if (!id || (dir !== "up" && dir !== "down")) redirect(back);

  const sb = supabaseAdmin();
  const { data: cur } = await sb
    .from("outlets")
    .select("id, category_id")
    .eq("id", id)
    .single();
  if (!cur) redirect(back);

  const { data } = await sb
    .from("outlets")
    .select("id, sort_order")
    .eq("category_id", cur.category_id)
    .order("sort_order", { ascending: true });

  const list = data ?? [];
  const idx = list.findIndex((o: { id: string }) => o.id === id);
  const swap = dir === "up" ? idx - 1 : idx + 1;

  if (idx >= 0 && swap >= 0 && swap < list.length) {
    const moved = [...list];
    const [item] = moved.splice(idx, 1);
    moved.splice(swap, 0, item);
    await Promise.all(
      moved.map((o, i) =>
        sb.from("outlets").update({ sort_order: (i + 1) * 10 }).eq("id", o.id),
      ),
    );
    // Reordering only changes the category this outlet sits in.
    const { data: cat } = await sb
      .from("categories")
      .select("slug")
      .eq("id", cur.category_id)
      .maybeSingle();
    refreshOutlet((cat as { slug?: string } | null)?.slug);
  }
  redirect(back);
}

export async function deleteOutlet(formData: FormData) {
  const blocked = await ensureCanWrite("outlets");
  if (blocked) return;
  const id = String(formData.get("id") ?? "");
  if (id) {
    const sb = supabaseAdmin();
    // Read the logo before the row goes, then drop the stored file too, so a
    // deleted newspaper leaves nothing behind in the project.
    const { data: row } = await sb
      .from("outlets")
      .select("logo_url, category:categories(slug)")
      .eq("id", id)
      .maybeSingle();

    const { error } = await sb.from("outlets").delete().eq("id", id);
    if (!error) {
      await deleteUploadedImage((row as { logo_url?: string | null } | null)?.logo_url);
      refreshOutlet(
        (row as { category?: { slug?: string } | null } | null)?.category?.slug,
      );
    } else {
      console.error("[admin] deleteOutlet failed:", error);
    }
  }
  redirect(returnTo(formData, "/admin/outlets"));
}

/* -------------------------------------------------------------------------- */
/* Categories                                                                  */
/* -------------------------------------------------------------------------- */

export async function upsertCategory(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const blocked = await ensureCanWrite("categories");
  if (blocked) return { error: blocked };

  // The slug box is optional and free-form: whatever is typed gets normalised,
  // and an empty box inherits the title.
  const parsed = categoryInput.safeParse({
    slug: derivedSlug(formData, "title"),
    title: formData.get("title"),
    title_bn: formData.get("title_bn") ?? "",
    description: formData.get("description") ?? "",
    group_key: formData.get("group_key"),
    section_type: formData.get("section_type") ?? "outlet_grid",
    parent_slug: formData.get("parent_slug") ?? "",
    accent: formData.get("accent") ?? "",
    sort_order: num(formData, "sort_order"),
    show_on_home: bool(formData, "show_on_home"),
    home_limit: num(formData, "home_limit", DEFAULT_HOME_LIMIT),
    is_active: bool(formData, "is_active"),
  });
  if (!parsed.success) {
    return { error: "নিচের ভুলগুলো ঠিক করুন।", fieldErrors: collectFieldErrors(parsed.error.issues) };
  }
  const d = parsed.data;
  let missingHomeLimit = false;

  try {
    const sb = supabaseAdmin();
    const row = {
      slug: d.slug,
      title: d.title,
      title_bn: d.title_bn || null,
      description: d.description || null,
      group_key: d.group_key,
      section_type: d.section_type,
      parent_slug: d.parent_slug || null,
      accent: d.accent || null,
      sort_order: d.sort_order,
      show_on_home: d.show_on_home,
      home_limit: d.home_limit,
      is_active: d.is_active,
    };
    const originalSlug = String(formData.get("original_slug") ?? "");

    const write = (values: Record<string, unknown>) =>
      originalSlug
        ? sb.from("categories").update(values).eq("slug", originalSlug)
        : sb.from("categories").insert(values);

    const { error } = await write(row);
    if (error) {
      // `home_limit` arrives with migration 0009. On a database that has not
      // run it yet, save everything else rather than losing the whole edit,
      // and tell the client why the homepage cap did not stick.
      if (!/home_limit/i.test(error.message)) throw error;
      const withoutLimit: Record<string, unknown> = { ...row };
      delete withoutLimit.home_limit;
      const retry = await write(withoutLimit);
      if (retry.error) throw retry.error;
      missingHomeLimit = true;
    }
  } catch (e) {
    console.error("[admin] upsertCategory failed:", e);
    return { error: "ক্যাটাগরিটি সংরক্ষণ করা যায়নি (slug হয়তো আগে থেকেই আছে)।" };
  }

  refreshEverything();
  if (missingHomeLimit) {
    return {
      error:
        "ক্যাটাগরিটি সংরক্ষণ হয়েছে, কিন্তু “হোমপেজে সর্বোচ্চ কতটি সাইট দেখাবে” সংখ্যাটি সংরক্ষণ করা যায়নি। Supabase-এ supabase/migrations/0009_category_home_limit.sql মাইগ্রেশনটি চালান, তারপর আবার চেষ্টা করুন।",
    };
  }
  redirect("/admin/categories");
}

export async function deleteCategory(formData: FormData) {
  const blocked = await ensureCanWrite("categories");
  if (blocked) return;
  const slug = String(formData.get("slug") ?? "");
  if (slug) {
    await supabaseAdmin().from("categories").delete().eq("slug", slug);
    // A category appears in the header menu and footer, so this one is global.
    refreshEverything();
  }
  redirect("/admin/categories");
}

/** Move a top-level category up/down in the homepage order (reassigns sort_order). */
export async function moveCategory(formData: FormData) {
  const blocked = await ensureCanWrite("categories");
  if (blocked) return;
  const slug = String(formData.get("slug") ?? "");
  const dir = String(formData.get("dir") ?? "");
  if (!slug || (dir !== "up" && dir !== "down")) redirect("/admin/categories");

  const sb = supabaseAdmin();
  const { data } = await sb
    .from("categories")
    .select("slug, sort_order, parent_slug")
    .order("sort_order", { ascending: true });

  const list = (data ?? []).filter(
    (c: { parent_slug: string | null }) => !c.parent_slug,
  );
  const idx = list.findIndex((c: { slug: string }) => c.slug === slug);
  const swap = dir === "up" ? idx - 1 : idx + 1;

  if (idx >= 0 && swap >= 0 && swap < list.length) {
    const moved = [...list];
    const [item] = moved.splice(idx, 1);
    moved.splice(swap, 0, item);
    // Reassign clean sequential order (robust regardless of current values).
    // Run the updates concurrently — sequential awaits to a remote DB are slow.
    await Promise.all(
      moved.map((c, i) =>
        sb.from("categories").update({ sort_order: (i + 1) * 10 }).eq("slug", c.slug),
      ),
    );
    refreshEverything();
  }
  redirect("/admin/categories");
}

/* -------------------------------------------------------------------------- */
/* Submissions                                                                 */
/* -------------------------------------------------------------------------- */

export async function approveSubmission(formData: FormData) {
  const blocked = await ensureCanWrite("submissions");
  if (blocked) return;

  const id = String(formData.get("id") ?? "");
  const categorySlug = String(formData.get("category_slug") ?? "");
  if (!id || !categorySlug) redirect("/admin/submissions");

  const sb = supabaseAdmin();
  try {
    const { data: sub } = await sb.from("submissions").select("*").eq("id", id).single();
    const { data: cat } = await sb.from("categories").select("id").eq("slug", categorySlug).single();
    if (sub && cat) {
      await sb.from("outlets").insert({
        category_id: cat.id,
        name: sub.outlet_name,
        url: sub.url,
        // Carry over the logo the submitter uploaded, if any.
        logo_url: sub.logo_url ?? null,
        is_active: true,
        sort_order: 999,
      });
      await sb.from("submissions").update({ status: "approved" }).eq("id", id);
      refreshOutlet(categorySlug);
    }
  } catch (e) {
    console.error("[admin] approveSubmission failed:", e);
  }
  redirect("/admin/submissions");
}

export async function rejectSubmission(formData: FormData) {
  const blocked = await ensureCanWrite("submissions");
  if (blocked) return;
  const id = String(formData.get("id") ?? "");
  if (id) {
    await supabaseAdmin().from("submissions").update({ status: "rejected" }).eq("id", id);
  }
  redirect("/admin/submissions");
}

/**
 * Erase a submission for good — the row *and* the logo the sender uploaded.
 *
 * Distinct from `rejectSubmission`, which only flips the status and keeps the
 * row in the review history. This leaves nothing behind in Supabase, so it also
 * clears the storage object; skipping that would slowly fill the media bucket
 * with files no row references any more.
 */
export async function deleteSubmission(formData: FormData) {
  const blocked = await ensureCanWrite("submissions");
  if (blocked) return;
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/submissions");

  const sb = supabaseAdmin();
  try {
    // Read the logo first: after the row is gone the URL is unrecoverable.
    const { data: row } = await sb
      .from("submissions")
      .select("logo_url")
      .eq("id", id)
      .maybeSingle();

    const { error } = await sb.from("submissions").delete().eq("id", id);
    if (error) throw error;

    await deleteUploadedImage((row as { logo_url?: string | null } | null)?.logo_url);
  } catch (e) {
    console.error("[admin] deleteSubmission failed:", e);
  }
  redirect("/admin/submissions");
}

/* -------------------------------------------------------------------------- */
/* Posts                                                                       */
/* -------------------------------------------------------------------------- */

export async function upsertPost(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const blocked = await ensureCanWrite("posts");
  if (blocked) return { error: blocked };

  const parsed = postInput.safeParse({
    title: formData.get("title"),
    slug: derivedSlug(formData, "title"),
    excerpt: formData.get("excerpt") ?? "",
    content: formData.get("content"),
    cover_image: formData.get("cover_image") ?? "",
    published: bool(formData, "published"),
    featured: bool(formData, "featured"),
    sort_order: num(formData, "sort_order"),
  });
  if (!parsed.success) {
    return { error: "নিচের ভুলগুলো ঠিক করুন।", fieldErrors: collectFieldErrors(parsed.error.issues) };
  }
  const d = parsed.data;

  try {
    const sb = supabaseAdmin();
    const now = new Date().toISOString();
    const row = {
      title: d.title,
      slug: d.slug,
      excerpt: d.excerpt || null,
      content: d.content,
      cover_image: d.cover_image || null,
      published: d.published,
      featured: d.featured,
      sort_order: d.sort_order,
      published_at: d.published ? now : null,
      updated_at: now,
    };
    const id = String(formData.get("id") ?? "");
    if (id) {
      const { error } = await sb.from("posts").update(row).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await sb.from("posts").insert(row);
      if (error) throw error;
    }
  } catch (e) {
    console.error("[admin] upsertPost failed:", e);
    return { error: "পোস্টটি সংরক্ষণ করা যায়নি (slug হয়তো আগে থেকেই আছে)।" };
  }

  refreshPosts(d.slug);
  redirect("/admin/posts");
}

export async function deletePost(formData: FormData) {
  const blocked = await ensureCanWrite("posts");
  if (blocked) return;
  const id = String(formData.get("id") ?? "");
  if (id) {
    const sb = supabaseAdmin();
    const { data: row } = await sb.from("posts").select("slug").eq("id", id).maybeSingle();
    await sb.from("posts").delete().eq("id", id);
    refreshPosts((row as { slug?: string } | null)?.slug);
  }
  redirect("/admin/posts");
}

/** Toggle whether a post is featured on the homepage grid. */
export async function togglePostFeatured(formData: FormData) {
  const blocked = await ensureCanWrite("posts");
  if (blocked) return;
  const id = String(formData.get("id") ?? "");
  const next = bool(formData, "next");
  if (id) {
    await supabaseAdmin().from("posts").update({ featured: next }).eq("id", id);
    refreshPosts();
  }
  redirect("/admin/posts");
}

/** Move a post up/down in the homepage order (reassigns sort_order). */
export async function movePost(formData: FormData) {
  const blocked = await ensureCanWrite("posts");
  if (blocked) return;
  const id = String(formData.get("id") ?? "");
  const dir = String(formData.get("dir") ?? "");
  if (!id || (dir !== "up" && dir !== "down")) redirect("/admin/posts");

  const sb = supabaseAdmin();
  const { data } = await sb
    .from("posts")
    .select("id, sort_order, created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const list = data ?? [];
  const idx = list.findIndex((p: { id: string }) => p.id === id);
  const swap = dir === "up" ? idx - 1 : idx + 1;

  if (idx >= 0 && swap >= 0 && swap < list.length) {
    const moved = [...list];
    const [item] = moved.splice(idx, 1);
    moved.splice(swap, 0, item);
    await Promise.all(
      moved.map((p, i) =>
        sb.from("posts").update({ sort_order: (i + 1) * 10 }).eq("id", p.id),
      ),
    );
    refreshPosts();
  }
  redirect("/admin/posts");
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                    */
/* -------------------------------------------------------------------------- */

export async function updateGlobalSetting(formData: FormData) {
  const blocked = await ensureCanWrite("settings");
  if (blocked) return;
  const key = String(formData.get("key") ?? "");
  const value = String(formData.get("value") ?? "");
  if (key) {
    await supabaseAdmin()
      .from("settings")
      .upsert({ key, value, updated_at: new Date().toISOString() });
    // Card behaviour is read by every outlet tile on every page.
    refreshEverything();
  }
}
