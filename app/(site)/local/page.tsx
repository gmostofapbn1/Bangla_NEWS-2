import type { Metadata } from "next";
import { getDivisions, getCategory } from "@/lib/queries";
import { PageHero } from "@/components/site/page-hero";
import { DivisionTiles } from "@/components/site/division-tiles";
import { canonical } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: canonical("/local"),
  title: "Local Newspapers by Division",
  description:
    "Regional newspapers across Bangladesh's eight divisions — Dhaka, Mymensingh, Sylhet, Chattogram, Rangpur, Khulna, Rajshahi and Barisal.",
};

export default async function LocalPage() {
  const [divisions, parent] = await Promise.all([
    getDivisions(),
    getCategory("local-newspaper"),
  ]);

  return (
    <>
      <PageHero
        title={parent?.title ?? "Local Newspaper by Division"}
        titleBn={parent?.title_bn}
        description={parent?.description}
      />
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <DivisionTiles divisions={divisions} />
      </div>
    </>
  );
}
