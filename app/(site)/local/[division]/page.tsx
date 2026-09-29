import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllCategories,
  getCategory,
  getOutletsByCategory,
  getDefaultOpenExternal,
  getRenamedCategorySlug,
} from "@/lib/queries";
import { divisionsOf, regionalHub } from "@/lib/category-roles";
import { PageHero } from "@/components/site/page-hero";
import { CategoryFilter } from "@/components/site/category-filter";
import { canonical } from "@/lib/seo";

export const revalidate = 3600;

type Params = { params: Promise<{ division: string }> };

export async function generateStaticParams() {
  return divisionsOf(await getAllCategories()).map((c) => ({ division: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { division } = await params;
  const category = await getCategory(division);
  if (!category) return { title: "Division" };
  return {
    alternates: canonical(`/local/${division}`),
    title: `${category.title} Newspapers`,
    description:
      category.description ?? `Local newspapers of ${category.title}.`,
  };
}

export default async function DivisionPage({ params }: Params) {
  const { division } = await params;
  const [category, cats] = await Promise.all([getCategory(division), getAllCategories()]);
  if (!category) {
    const moved = await getRenamedCategorySlug(division);
    if (moved) permanentRedirect(`/local/${moved}`);
    notFound();
  }
  if (category.parent_slug !== regionalHub(cats)?.slug) notFound();

  const [outlets, globalOpenExternal] = await Promise.all([
    getOutletsByCategory(division),
    getDefaultOpenExternal(),
  ]);

  return (
    <>
      <PageHero
        title={category.title}
        titleBn={category.title_bn}
        description={
          category.description ??
          `Local and regional newspapers published across ${category.title}.`
        }
      />
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <CategoryFilter outlets={outlets} globalOpenExternal={globalOpenExternal} />
      </div>
    </>
  );
}
