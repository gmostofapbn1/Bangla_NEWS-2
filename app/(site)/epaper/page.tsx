import type { Metadata } from "next";
import { getCategory, getOutletsByCategory } from "@/lib/queries";
import { PageHero } from "@/components/site/page-hero";
import { CategoryFilter } from "@/components/site/category-filter";
import { canonical } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: canonical("/epaper"),
  title: "Bangla ePaper Editions",
  description:
    "Digital replica ePaper editions of the leading Bangla daily newspapers — read the printed paper online.",
};

export default async function EpaperPage() {
  const [category, outlets] = await Promise.all([
    getCategory("epaper"),
    getOutletsByCategory("epaper"),
  ]);

  return (
    <>
      <PageHero
        title={category?.title ?? "Bangla ePaper Editions"}
        titleBn={category?.title_bn}
        description={category?.description}
      />
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <CategoryFilter outlets={outlets} />
      </div>
    </>
  );
}
