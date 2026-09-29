import type { Category } from "@/lib/types";
import type { GroupKey, NavSpec } from "@/lib/site-config";

/**
 * Finding the special sections by what they are, never by their slug.
 *
 * Slugs are edited from Admin → Categories, and the client renames them for
 * SEO. Code that looked for the literal "local-newspaper" or "epaper" broke the
 * first time they did: the regional section lost all eight divisions and two
 * header links went dead. Section type and group describe a category's role,
 * so they survive a rename.
 */

export type NavItem = { label: string; href: string };

/** The regional hub: the one top-level category laid out as a division grid. */
export function regionalHub(cats: readonly Category[]): Category | undefined {
  return cats.find((c) => c.section_type === "division_grid" && !c.parent_slug);
}

/** The divisions under the regional hub, in display order. */
export function divisionsOf(cats: readonly Category[]): Category[] {
  const hub = regionalHub(cats);
  if (!hub) return [];
  return cats
    .filter((c) => c.parent_slug === hub.slug)
    .sort((a, b) => a.sort_order - b.sort_order);
}

/** A top-level category listed in its own right — everything but the hub. */
export function isDirectorySection(c: Category): boolean {
  return !c.parent_slug && c.section_type !== "division_grid";
}

/** The first top-level category in a group, e.g. the ePaper section. */
export function categoryForGroup(
  cats: readonly Category[],
  group: GroupKey,
): Category | undefined {
  return cats
    .filter((c) => c.group === group && !c.parent_slug)
    .sort((a, b) => a.sort_order - b.sort_order)[0];
}

/**
 * Turn the static nav spec into links. A group entry points at wherever that
 * category lives today; if the client deletes the category outright, the link
 * is dropped rather than left pointing at a 404.
 */
export function resolveNav(specs: readonly NavSpec[], cats: readonly Category[]): NavItem[] {
  const out: NavItem[] = [];
  for (const s of specs) {
    if ("href" in s) {
      out.push({ label: s.label, href: s.href });
      continue;
    }
    const cat = categoryForGroup(cats, s.group);
    if (cat) out.push({ label: s.label, href: `/category/${cat.slug}` });
  }
  return out;
}
