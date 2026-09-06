import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PostForm } from "@/components/admin/post-form";
import { requireSection } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  await requireSection("posts");

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/posts"
        className="mb-3 inline-flex items-center gap-1 text-[0.8125rem] font-medium text-a-muted transition hover:text-accent"
      >
        <ChevronLeft className="h-4 w-4" /> ব্লগ পোস্ট
      </Link>
      <PageHeader
        title="নতুন পোস্ট"
        description="লেখা শেষ হলে “প্রকাশিত” চালু করে সংরক্ষণ করুন। খসড়া হিসেবেও রেখে দিতে পারেন।"
      />
      <PostForm post={null} />
    </div>
  );
}
