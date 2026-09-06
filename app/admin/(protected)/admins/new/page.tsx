import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireSection } from "@/lib/auth";
import { adminsTableReady } from "@/lib/admins";
import { AdminAccountForm } from "@/components/admin/admin-account-form";
import { Alert, PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function NewAdminPage() {
  await requireSection("admins");
  const ready = await adminsTableReady();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/admins"
        className="mb-3 inline-flex items-center gap-1 text-[0.8125rem] font-medium text-a-muted transition hover:text-accent"
      >
        <ChevronLeft className="h-4 w-4" /> এডমিন ম্যানেজমেন্ট
      </Link>
      <PageHeader
        title="নতুন এডমিন/লেখক"
        description="নতুন একজনকে যুক্ত করুন এবং ঠিক করে দিন তিনি প্যানেলের কোন অংশগুলো ব্যবহার করতে পারবেন।"
      />

      {!ready ? (
        <Alert tone="warn" title="মাইগ্রেশন চালাতে হবে">
          অ্যাকাউন্ট তৈরি করার আগে Supabase SQL এডিটরে{" "}
          <code dir="ltr">supabase/migrations/0006_admin_accounts_settings.sql</code> চালান।
        </Alert>
      ) : (
        <AdminAccountForm account={null} />
      )}
    </div>
  );
}
