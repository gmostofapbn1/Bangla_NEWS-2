import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { adminGetCategory, adminOutletCounts } from "@/lib/admin-queries";
import { CategoryForm } from "@/components/admin/category-form";
import { requireSection } from "@/lib/auth";
import { bnNum } from "@/lib/utils";
import { Badge, PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireSection("categories");

  const { slug } = await params;
  const [category, counts] = await Promise.all([
    adminGetCategory(slug),
    adminOutletCounts(),
  ]);
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/categories"
        className="mb-3 inline-flex items-center gap-1 text-[0.8125rem] font-medium text-a-muted transition hover:text-accent"
      >
        <ChevronLeft className="h-4 w-4" /> ক্যাটাগরি
      </Link>
      <PageHeader
        title={category.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{bnNum(counts[category.slug] ?? 0)} টি সাইট</Badge>
            {category.home && <Badge tone="ok">হোমপেজে দেখানো হচ্ছে</Badge>}
          </span>
        }
      />
      <CategoryForm category={category} />
    </div>
  );
}
