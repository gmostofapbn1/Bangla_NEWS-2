import { requireAdmin } from "@/lib/auth";
import { adminsTableReady, ENV_OWNER_ID } from "@/lib/admins";
import { ProfileForm } from "@/components/admin/profile-form";
import { Alert, Avatar, Badge, PageHeader } from "@/components/admin/ui";
import { ROLES, ROLE_HINTS } from "@/lib/permissions";
import { formatDateBn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const me = await requireAdmin();
  const ready = await adminsTableReady();
  const bootstrapped = me.id === ENV_OWNER_ID || !ready;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="আমার অ্যাকাউন্ট" title="আমার প্রোফাইল" />

      {/* Identity card */}
      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-[var(--radius-a)] border border-a-line bg-a-surface p-5 shadow-a-card">
        <Avatar src={me.avatar_url} name={me.name || me.username} size={56} />
        <div className="min-w-0 flex-1">
          <p className="text-[1.05rem] font-bold text-a-ink">{me.name || me.username}</p>
          <p className="text-[0.8125rem] text-a-muted" dir="ltr">
            @{me.username}
            {me.email ? ` · ${me.email}` : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge tone="accent">{ROLES[me.role]}</Badge>
          <span className="text-xs text-a-faint">
            {me.last_login_at ? `সর্বশেষ লগইন ${formatDateBn(me.last_login_at)}` : ROLE_HINTS[me.role]}
          </span>
        </div>
      </div>

      {bootstrapped && (
        <div className="mb-5">
          <Alert tone="warn" title="অ্যাকাউন্ট এখনো ডাটাবেসে তৈরি হয়নি">
            আপনি এখন <code>ADMIN_PASSWORD</code> দিয়ে লগইন করে আছেন। প্রোফাইল সংরক্ষণ ও
            পাসওয়ার্ড পরিবর্তন করতে <code dir="ltr">supabase/migrations/0006_admin_accounts_settings.sql</code>{" "}
            ফাইলটি Supabase SQL এডিটরে চালান, তারপর একবার লগআউট করে আবার লগইন করুন — তখন
            মালিক অ্যাকাউন্টটি নিজে থেকেই তৈরি হয়ে যাবে।
          </Alert>
        </div>
      )}

      <ProfileForm
        username={me.username}
        name={me.name ?? ""}
        email={me.email ?? ""}
        avatar={me.avatar_url}
        role={me.role}
      />
    </div>
  );
}
