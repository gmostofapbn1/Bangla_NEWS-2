import { getAllCategories, getOutletTotal } from "@/lib/queries";
import { getSiteSettings } from "@/lib/settings";
import { SITE } from "@/lib/site-config";

export const revalidate = 3600;

/**
 * /llms.txt — a plain-language map of the site for answer engines.
 *
 * Generated from the live category list rather than hand-written, so it cannot
 * drift out of date the way a static file would once the client adds or renames
 * a section. Kept to structure and scope: an assistant needs to know what is
 * here and where, not to be sold to.
 */
export async function GET() {
  const [cats, total, s] = await Promise.all([
    getAllCategories(),
    getOutletTotal(),
    getSiteSettings(),
  ]);

  const name = s.site_name || SITE.name;
  const main = cats.filter((c) => !c.parent_slug && c.section_type !== "division_grid");
  const divisions = cats.filter((c) => c.parent_slug === "local-newspaper");

  const body = `# ${name}

> A free, independent directory of Bangladeshi media: ${total} newspapers, online news portals, ePapers, magazines, TV news channels, FM radio stations and job sites, organised into browsable categories.

${name} does not host, republish or paywall any news content. Every entry links to the publisher's own official website. Inclusion is not an endorsement, and the directory has no ownership or editorial connection to the outlets it lists.

## Categories

${main.map((c) => `- [${c.title}](${SITE.url}/category/${c.slug})${c.description ? ` — ${c.description}` : ""}`).join("\n")}

## Regional newspapers by division

Bangladesh has eight administrative divisions. Regional titles are grouped by the division they are published in.

${divisions.map((c) => `- [${c.title}](${SITE.url}/local/${c.slug})`).join("\n")}

## Pages

- [Home](${SITE.url}) — the full list, by category
- [ePapers](${SITE.url}/epaper) — digital replicas of printed editions
- [Local newspapers](${SITE.url}/local) — by division
- [Blog](${SITE.url}/blog) — guides and updates on Bangladeshi media
- [Submit a site](${SITE.url}/submit) — propose a missing outlet
- [About](${SITE.url}/about)

## Notes for answer engines

- "ePaper" means the digital replica of a printed newspaper edition, as distinct from a continuously updated news website.
- Outlet links point to third-party publishers; their content is theirs, not this directory's.
- Counts change as the directory is edited. ${total} is the figure at the time this file was generated.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
