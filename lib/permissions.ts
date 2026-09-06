/**
 * Admin roles and per-section permissions.
 *
 * Edge-safe: no Node APIs and no DB access, so `proxy.ts` and client components
 * can both import it. The section list is the single source of truth for the
 * sidebar, the permissions checkboxes and every server-side guard.
 */

export const ROLES = {
  owner: "মালিক",
  admin: "এডমিন",
  author: "লেখক",
} as const;

export type Role = keyof typeof ROLES;

export const ROLE_HINTS: Record<Role, string> = {
  owner: "সম্পূর্ণ অ্যাক্সেস — কোনো সীমা নেই",
  admin: "নির্বাচিত সেকশনগুলোতে অ্যাক্সেস",
  author: "শুধু ব্লগ পোস্ট লেখা ও সম্পাদনা",
};

/** Every guardable area of the panel, in sidebar order. */
export const SECTIONS = [
  { key: "dashboard", label: "ড্যাশবোর্ড", hint: "পরিসংখ্যান ও সারসংক্ষেপ" },
  { key: "categories", label: "ক্যাটাগরি", hint: "ডিরেক্টরি সেকশন তৈরি ও সাজানো" },
  { key: "outlets", label: "নিউজপেপার / সাইট", hint: "পত্রিকা ও সাইট যোগ, সম্পাদনা, মুছে ফেলা" },
  { key: "divisions", label: "বিভাগীয় পত্রিকা", hint: "৮ বিভাগের আঞ্চলিক পত্রিকা" },
  { key: "international", label: "International Newspaper", hint: "আন্তর্জাতিক সংবাদপত্র" },
  { key: "posts", label: "ব্লগ পোস্ট", hint: "আর্টিকেল লেখা ও প্রকাশ" },
  { key: "submissions", label: "সাইট সাবমিশন", hint: "পাঠকের পাঠানো সাইট অনুমোদন" },
  { key: "admins", label: "এডমিন ম্যানেজমেন্ট", hint: "এডমিন/লেখক যুক্ত ও পারমিশন" },
  { key: "settings", label: "সেটিংস", hint: "সাইটের নাম, লোগো, SEO, ইমেইল, বিজ্ঞাপন" },
] as const;

export type SectionKey = (typeof SECTIONS)[number]["key"];

export const ALL_SECTIONS: SectionKey[] = SECTIONS.map((s) => s.key);

/** Sections a freshly created account of each role starts with. */
export const DEFAULT_PERMISSIONS: Record<Role, SectionKey[]> = {
  owner: [...ALL_SECTIONS],
  admin: ["dashboard", "categories", "outlets", "divisions", "international", "posts", "submissions"],
  author: ["dashboard", "posts"],
};

/**
 * Sections only the owner may ever touch — handing out admin management or
 * settings would let an account escalate itself to full control.
 */
export const OWNER_ONLY: SectionKey[] = ["admins", "settings"];

export function sectionLabel(key: string): string {
  return SECTIONS.find((s) => s.key === key)?.label ?? key;
}

/** Sections that can be granted to a given role in the permissions UI. */
export function grantableSections(role: Role): SectionKey[] {
  if (role === "owner") return [...ALL_SECTIONS];
  return ALL_SECTIONS.filter((s) => !OWNER_ONLY.includes(s));
}

export type PermissionHolder = {
  role: Role;
  permissions: string[];
};

/** Whether an account may open a section. Owners always may. */
export function can(holder: PermissionHolder | null, section: SectionKey): boolean {
  if (!holder) return false;
  if (holder.role === "owner") return true;
  if (OWNER_ONLY.includes(section)) return false;
  return holder.permissions.includes(section);
}

/** First section the account is allowed to land on, for post-login redirects. */
export function landingSection(holder: PermissionHolder): SectionKey {
  return ALL_SECTIONS.find((s) => can(holder, s)) ?? "dashboard";
}

/** Route each section lives at. Used by the sidebar and the landing redirect. */
export const SECTION_HREF: Record<SectionKey, string> = {
  dashboard: "/admin",
  categories: "/admin/categories",
  outlets: "/admin/outlets",
  divisions: "/admin/divisions",
  international: "/admin/international",
  posts: "/admin/posts",
  submissions: "/admin/submissions",
  admins: "/admin/admins",
  settings: "/admin/settings",
};
