import Link from "next/link";
import { Plus, Pencil, ShieldCheck, UserPlus } from "lucide-react";
import { requireSection } from "@/lib/auth";
import { listAdmins, adminsTableReady } from "@/lib/admins";
import { deleteAdminAccount } from "@/lib/actions/accounts";
import { DeleteButton } from "@/components/admin/delete-button";
import { getCurrentAdmin } from "@/lib/auth";
import { ROLES, ROLE_HINTS, sectionLabel, ALL_SECTIONS } from "@/lib/permissions";
import { bnNum, formatDateBn } from "@/lib/utils";
import {
  Alert,
  Avatar,
  Badge,
  EmptyState,
  PageHeader,
  TableShell,
  Td,
  Th,
  Tr,
  btn,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  // Section is owner-only via OWNER_ONLY, so this also enforces the role.
  await requireSection("admins");

  const [admins, me, ready] = await Promise.all([
    listAdmins(),
    getCurrentAdmin(),
    adminsTableReady(),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="ব্যবস্থাপনা"
        title="এডমিন ম্যানেজমেন্ট"
        description={
          <>
            মোট {bnNum(admins.length)} টি অ্যাকাউন্ট। প্রত্যেকের জন্য আলাদা করে ঠিক করে দিন
            তিনি কোন সেকশনগুলোতে ঢুকতে পারবেন।
          </>
        }
        actions={
          ready ? (
            <Link href="/admin/admins/new" className={btn.primary}>
              <Plus className="h-4 w-4" /> নতুন এডমিন/লেখক যুক্ত করুন
            </Link>
          ) : null
        }
      />

      {!ready ? (
        <Alert tone="warn" title="মাইগ্রেশন চালাতে হবে">
          একাধিক এডমিন অ্যাকাউন্ট ব্যবহার করতে Supabase SQL এডিটরে{" "}
          <code dir="ltr">supabase/migrations/0006_admin_accounts_settings.sql</code> ফাইলটি
          চালান। এরপর একবার লগআউট করে <code>ADMIN_PASSWORD</code> দিয়ে লগইন করলেই মালিক
          অ্যাকাউন্টটি নিজে থেকে তৈরি হয়ে যাবে।
        </Alert>
      ) : admins.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="কোনো অ্যাকাউন্ট নেই"
          description="প্রথম এডমিন অ্যাকাউন্টটি যোগ করুন।"
          action={
            <Link href="/admin/admins/new" className={btn.primary}>
              <UserPlus className="h-4 w-4" /> নতুন অ্যাকাউন্ট
            </Link>
          }
        />
      ) : (
        <TableShell>
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr>
                <Th align="left">নাম / ইউজারনেম</Th>
                <Th align="left" className="w-40">পদবি</Th>
                <Th align="left">পারমিশন</Th>
                <Th align="right" className="w-44">অ্যাকশন</Th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => {
                const isOwner = a.role === "owner";
                const isSelf = a.id === me?.id;
                const perms = isOwner ? ALL_SECTIONS : a.permissions;
                return (
                  <Tr key={a.id}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar src={a.avatar_url} name={a.name || a.username} size={34} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-a-ink">
                            {a.name || a.username}
                            {isSelf && (
                              <span className="ml-1.5 text-xs font-normal text-a-faint">
                                (আপনি)
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-a-faint" dir="ltr">
                            @{a.username}
                            {a.email ? ` · ${a.email}` : ""}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col items-start gap-1">
                        <Badge tone={isOwner ? "accent" : a.role === "admin" ? "info" : "neutral"}>
                          {ROLES[a.role]}
                        </Badge>
                        {!a.is_active && <Badge tone="muted">নিষ্ক্রিয়</Badge>}
                      </div>
                    </Td>
                    <Td>
                      {isOwner ? (
                        <Badge tone="warn">সম্পূর্ণ অ্যাক্সেস (মালিক)</Badge>
                      ) : perms.length === 0 ? (
                        <span className="text-xs text-a-faint">কোনো সেকশন নয়</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {perms.slice(0, 4).map((p) => (
                            <span
                              key={p}
                              className="rounded-md bg-a-sunken px-1.5 py-0.5 text-[11px] font-medium text-a-muted ring-1 ring-inset ring-a-line"
                            >
                              {sectionLabel(p)}
                            </span>
                          ))}
                          {perms.length > 4 && (
                            <span className="rounded-md bg-a-sunken px-1.5 py-0.5 text-[11px] font-medium text-a-faint ring-1 ring-inset ring-a-line">
                              +{bnNum(perms.length - 4)}
                            </span>
                          )}
                        </div>
                      )}
                      <p className="mt-1 text-[11px] text-a-faint">
                        {a.last_login_at
                          ? `সর্বশেষ লগইন ${formatDateBn(a.last_login_at)}`
                          : ROLE_HINTS[a.role]}
                      </p>
                    </Td>
                    <Td align="right">
                      <div className="admin-row-actions flex items-center justify-end gap-0.5">
                        <Link
                          href={`/admin/admins/${a.id}`}
                          className="inline-flex items-center gap-1.5 rounded-[9px] px-2.5 py-1.5 text-xs font-semibold text-a-ink-soft transition hover:bg-a-sunken"
                        >
                          <Pencil className="h-3.5 w-3.5" /> সম্পাদনা
                        </Link>
                        {!isOwner && !isSelf && (
                          <DeleteButton
                            action={deleteAdminAccount}
                            hidden={{ id: a.id }}
                            confirmText={`“${a.name || a.username}” অ্যাকাউন্টটি মুছে ফেলবেন?`}
                          />
                        )}
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>
      )}
    </div>
  );
}
