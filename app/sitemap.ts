import type { MetadataRoute } from "next";
import { getAllCategories, getPublishedPosts } from "@/lib/queries";
import { SITE } from "@/lib/site-config";
import { divisionsOf } from "@/lib/category-roles";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;
  const [cats, posts] = await Promise.all([
    getAllCategories(),
    getPublishedPosts(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/local",
    "/converter",
    "/blog",
    "/submit",
    "/about",
    "/disclaimer",
    "/privacy",
  ].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));

  const catRoutes: MetadataRoute.Sitemap = cats
    .filter((c) => c.section_type !== "division_grid" && !c.parent_slug)
    .map((c) => ({
      url: `${base}/category/${c.slug}`,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  // /epaper is gone from the static list: it now 308s to the ePaper category,
  // which is already listed below, and a sitemap must not list redirects.
  const divRoutes: MetadataRoute.Sitemap = divisionsOf(cats).map((c) => ({
      url: `${base}/local/${c.slug}`,
      changeFrequency: "monthly",
      priority: 0.5,
    }));

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...catRoutes, ...divRoutes, ...postRoutes];
}
