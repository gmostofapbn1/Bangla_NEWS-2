import type { MetadataRoute } from "next";
import { getAllCategories, getPublishedPosts } from "@/lib/queries";
import { SITE } from "@/lib/site-config";

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
    "/epaper",
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

  const divRoutes: MetadataRoute.Sitemap = cats
    .filter((c) => c.parent_slug === "local-newspaper")
    .map((c) => ({
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
