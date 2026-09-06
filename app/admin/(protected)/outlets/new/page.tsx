import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { adminListCategories } from "@/lib/admin-queries";
import { OutletForm } from "@/components/admin/outlet-form";
import { requireSection } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function NewOutletPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; return_to?: string }>;
}) {
  await requireSection("outlets");

  const [{ category, return_to }, allCats] = await Promise.all([
    searchParams,
    adminListCategories(),
  ]);
  const cats = allCats.filter((c) => c.section_type !== "division_grid");
  const defaultCategory = cats.some((c) => c.slug === category) ? category : "";
  const backTo = return_to?.startsWith("/admin") ? return_to : "/admin/outlets";

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={backTo}
        className="mb-3 inline-flex items-center gap-1 text-[0.8125rem] font-medium text-a-muted transition hover:text-accent"
      >
        <ChevronLeft className="h-4 w-4" /> ফিরে যান
      </Link>
      <PageHeader
        title="নতুন সাইট"
        description="একটি পত্রিকা, নিউজ পোর্টাল, রেডিও স্টেশন বা ePaper যোগ করুন।"
      />
      <OutletForm
        outlet={null}
        categories={cats.map((c) => ({ slug: c.slug, title: c.title }))}
        defaultCategory={defaultCategory}
        returnTo={backTo}
      />
    </div>
  );
}
