import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireSection, getCurrentAdmin } from "@/lib/auth";
import { getAdminById } from "@/lib/admins";
import { AdminAccountForm } from "@/components/admin/admin-account-form";
import { Avatar, Badge, PageHeader } from "@/components/admin/ui";
import { ROLES } from "@/lib/permissions";
import { formatDateBn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSection("admins");

  const { id } = await params;
  const [account, me] = await Promise.all([getAdminById(id), getCurrentAdmin()]);
  if (!account) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/admins"
        className="mb-3 inline-flex items-center gap-1 text-[0.8125rem] font-medium text-a-muted transition hover:text-accent"
      >
        <ChevronLeft className="h-4 w-4" /> এডমিন ম্যানেজমেন্ট
      </Link>

      <PageHeader title="অ্যাকাউন্ট সম্পাদনা" />

      <div className="mb-5 flex flex-wrap items-center gap-3.5 rounded-[var(--radius-a)] border border-a-line bg-a-surface p-4 shadow-a-card">
        <Avatar src={account.avatar_url} name={account.name || account.username} size={44} />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-a-ink">{account.name || account.username}</p>
          <p className="text-xs text-a-faint" dir="ltr">
            @{account.username}
            {account.email ? ` · ${account.email}` : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge tone={account.role === "owner" ? "accent" : "info"}>{ROLES[account.role]}</Badge>
          <span className="text-[11px] text-a-faint">
            {account.last_login_at
              ? `সর্বশেষ লগইন ${formatDateBn(account.last_login_at)}`
              : "এখনো লগইন করেননি"}
          </span>
        </div>
      </div>

      <AdminAccountForm
        account={{
          id: account.id,
          username: account.username,
          name: account.name ?? "",
          email: account.email ?? "",
          avatar: account.avatar_url,
          role: account.role,
          permissions: account.permissions,
          is_active: account.is_active,
        }}
        isSelf={account.id === me?.id}
      />
    </div>
  );
}
