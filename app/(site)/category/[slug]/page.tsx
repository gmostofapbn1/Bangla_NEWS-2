import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllCategories,
  getCategory,
  getOutletsByCategory,
  getDefaultOpenExternal,
} from "@/lib/queries";
import { PageHero } from "@/components/site/page-hero";
import { JsonLd } from "@/components/site/json-ld";
import {
  breadcrumbSchema,
  canonical,
  collectionSchema,
  jsonLdGraph,
} from "@/lib/seo";
import { CategoryFilter } from "@/components/site/category-filter";

export const revalidate = 3600;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const cats = await getAllCategories();
  return cats
    .filter((c) => c.section_type !== "division_grid")
    .map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Category" };
  return {
    title: category.title,
    description: category.description ?? undefined,
    alternates: canonical(`/category/${slug}`),
  };
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  if (category.section_type === "division_grid") redirect("/local");

  const [outlets, globalOpenExternal] = await Promise.all([
    getOutletsByCategory(slug),
    getDefaultOpenExternal(),
  ]);

  const path = `/category/${slug}`;

  return (
    <>
      {/* Tells Google this page is a list of named outlets, and where it sits
          in the site hierarchy — both help it surface as a sitelink. */}
      <JsonLd
        data={jsonLdGraph(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: category.title, path },
          ]),
          collectionSchema({
            name: category.title,
            description: category.description,
            path,
            items: outlets.map((o) => ({
              name: o.name,
              url: o.url,
            })),
          }),
        )}
      />
      <PageHero
        title={category.title}
        titleBn={category.title_bn}
        description={category.description}
      />
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <CategoryFilter outlets={outlets} globalOpenExternal={globalOpenExternal} />
      </div>
    </>
  );
}
