import { getAllCategories } from "@/lib/queries";
import { getSiteSettings } from "@/lib/settings";
import { HeaderClient } from "./header-client";
import { PRIMARY_NAV, TRAILING_NAV } from "@/lib/site-config";
import { divisionsOf, isDirectorySection, resolveNav } from "@/lib/category-roles";

export async function SiteHeader() {
  const [cats, settings] = await Promise.all([getAllCategories(), getSiteSettings()]);

  const mainCategories = cats
    .filter(isDirectorySection)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => ({ slug: c.slug, title: c.title, title_bn: c.title_bn, accent: c.accent }));
  const divisions = divisionsOf(cats).map((c) => ({ slug: c.slug, title: c.title, title_bn: c.title_bn, accent: c.accent }));

  return (
    <HeaderClient
      mainCategories={mainCategories}
      divisions={divisions}
      logoSrc={settings.site_logo || null}
      siteName={settings.site_name}
      headerColor={settings.header_color}
      primaryNav={resolveNav(PRIMARY_NAV, cats)}
      trailingNav={resolveNav(TRAILING_NAV, cats)}
    />
  );
}
