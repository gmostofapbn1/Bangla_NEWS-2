import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CategoryForm } from "@/components/admin/category-form";
import { requireSection } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function NewCategoryPage() {
  await requireSection("categories");

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/categories"
        className="mb-3 inline-flex items-center gap-1 text-[0.8125rem] font-medium text-a-muted transition hover:text-accent"
      >
        <ChevronLeft className="h-4 w-4" /> ক্যাটাগরি
      </Link>
      <PageHeader
        title="নতুন ক্যাটাগরি"
        description="ডিরেক্টরির একটি নতুন সেকশন তৈরি করুন — যেমন “অনলাইন পোর্টাল” বা “টিভি চ্যানেল”।"
      />
      <CategoryForm category={null} />
    </div>
  );
}
