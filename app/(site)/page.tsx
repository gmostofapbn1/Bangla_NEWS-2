import {
  getHomeSections,
  getHomePosts,
  getDefaultOpenExternal,
  getOutletTotal,
  getAllCategories,
} from "@/lib/queries";
import { getSiteSettings } from "@/lib/settings";
import { homeFaqs } from "@/lib/faq";
import { HomeIntro } from "@/components/site/home-intro";
import { FaqList } from "@/components/site/faq";
import { JsonLd } from "@/components/site/json-ld";
import { collectionSchema, faqSchema, jsonLdGraph } from "@/lib/seo";
import { SITE } from "@/lib/site-config";
import { SectionHeader } from "@/components/site/section-header";
import { OutletGrid } from "@/components/site/outlet-grid";
import { DivisionTiles } from "@/components/site/division-tiles";
import { BlogGrid } from "@/components/site/blog-grid";

export const revalidate = 3600;

export default async function HomePage() {
  const [sections, homePosts, globalOpenExternal, outletTotal, cats, settings] =
    await Promise.all([
      getHomeSections(),
      getHomePosts(3),
      getDefaultOpenExternal(),
      getOutletTotal(),
      getAllCategories(),
      getSiteSettings(),
    ]);

  const siteName = settings.site_name || SITE.name;
  // Divisions are children of Local Newspaper; counting them alongside their
  // parent would inflate the figure the intro copy quotes.
  const categoryCount = cats.filter((c) => !c.parent_slug).length;
  const faqs = homeFaqs(outletTotal, categoryCount);

  // The outlets actually on the page, in the order they appear. Schema that
  // lists items the visitor cannot see is the kind Google discounts.
  const listed = sections.flatMap((s) =>
    s.outlets.map((o) => ({ name: o.name, url: o.url })),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <JsonLd
        data={jsonLdGraph(
          collectionSchema({
            name: `${siteName} — complete newspaper list of Bangladesh`,
            description: settings.meta_description || SITE.description,
            path: "/",
            items: listed,
          }),
          faqSchema(faqs),
        )}
      />

      <HomeIntro
        siteName={siteName}
        outletCount={outletTotal}
        categoryCount={categoryCount}
      />
      {sections.map(({ category, outlets, total, children }) => {
        // Division row (Local Newspapers)
        if (category.section_type === "division_grid") {
          return (
            <section key={category.slug} id={category.slug} className="scroll-mt-24">
              <SectionHeader
                title={category.title}
                titleBn={category.title_bn}
                href="/local"
                hrefLabel="All divisions"
              />
              <div className="mt-5">
                <DivisionTiles divisions={children ?? []} />
              </div>
            </section>
          );
        }

        // Category with its newspapers shown as small boxes directly below.
        // `outlets` is already capped to the category's own `home_limit`
        // (admin → Categories; 0 means "show them all"), and `total` is how
        // many the category holds in all — the query never loads the rest.
        if (outlets.length === 0) return null;
        const allCount = total ?? outlets.length;
        return (
          <section key={category.slug} id={category.slug} className="scroll-mt-24">
            <SectionHeader
              title={category.title}
              titleBn={category.title_bn}
              href={`/category/${category.slug}`}
              hrefLabel={`View all ${allCount}`}
            />
            <div className="mt-5">
              <OutletGrid
                outlets={outlets}
                compact
                globalOpenExternal={globalOpenExternal}
              />
            </div>
          </section>
        );
      })}

      {/* From the Blog — a short preview; full list lives at /blog */}
      {homePosts.length > 0 && (
        <section id="blog" className="scroll-mt-24">
          <SectionHeader
            title="From the Blog"
            titleBn="ব্লগ"
            description="News, guides and updates on the Bangla media landscape."
            href="/blog"
            hrefLabel="All articles"
          />
          <div className="mt-5">
            <BlogGrid posts={homePosts} />
          </div>
        </section>
      )}

      <FaqList items={faqs} heading="Frequently asked questions" />
    </div>
  );
}
