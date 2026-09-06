import type { Metadata } from "next";
import { getPublishedPosts } from "@/lib/queries";
import { PageHero } from "@/components/site/page-hero";
import { BlogGrid } from "@/components/site/blog-grid";
import { Pagination } from "@/components/site/pagination";
import { canonical } from "@/lib/seo";

export const revalidate = 300;

/** 9 fills the 3-column grid exactly, so no half-empty last row. */
const PER_PAGE = 9;

export const metadata: Metadata = {
  alternates: canonical("/blog"),
  title: "Blog",
  description:
    "News, updates and guides about Bangla newspapers, online portals and media.",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ page: rawPage }, posts] = await Promise.all([
    searchParams,
    getPublishedPosts(),
  ]);

  const totalPages = Math.max(1, Math.ceil(posts.length / PER_PAGE));
  // Clamp rather than 404: a stale link to ?page=5 should still show something.
  const page = Math.min(Math.max(1, Number(rawPage) || 1), totalPages);
  const visible = posts.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <PageHero
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Blog" }]}
        title="From the Blog"
        titleBn="ব্লগ"
        description="News, updates and guides on the Bangla media landscape."
      />

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <BlogGrid posts={visible} />
        <Pagination basePath="/blog" page={page} totalPages={totalPages} />
      </div>
    </>
  );
}
