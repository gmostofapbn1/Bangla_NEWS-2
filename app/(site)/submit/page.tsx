import type { Metadata } from "next";
import { getAllCategories } from "@/lib/queries";
import { PageHero } from "@/components/site/page-hero";
import { SubmitForm } from "@/components/site/submit-form";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: canonical("/submit"),
  title: "Submit a Site",
  description:
    "Suggest a Bangla newspaper, online portal, radio station or ePaper for the directory. Submissions are reviewed before publishing.",
};

export default async function SubmitPage() {
  const cats = await getAllCategories();
  const categories = cats
    .filter((c) => c.section_type !== "division_grid")
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => ({ slug: c.slug, title: c.title }));

  return (
    <>
      <PageHero
        title="Submit your site"
      />
      <div className="mx-auto max-w-3xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <SubmitForm categories={categories} />
      </div>
    </>
  );
}
