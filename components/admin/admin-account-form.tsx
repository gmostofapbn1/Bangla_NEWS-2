"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { UserPlus, ShieldCheck, KeyRound, Loader2, Check } from "lucide-react";
import {
  createAdminAccount,
  updateAdminAccount,
  type AccountState,
} from "@/lib/actions/accounts";
import { Field, ErrorBanner, SuccessBanner, ImageField, Checkbox } from "./form-kit";
import { Card, CardDivider, FormSection } from "./ui";
import {
  DEFAULT_PERMISSIONS,
  ROLES,
  ROLE_HINTS,
  SECTIONS,
  grantableSections,
  type Role,
  type SectionKey,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";

export type AdminFormValues = {
  id?: string;
  username: string;
  name: string;
  email: string;
  avatar: string | null;
  role: Role;
  permissions: SectionKey[];
  is_active: boolean;
};

export function AdminAccountForm({
  account,
  isSelf = false,
}: {
  account: AdminFormValues | null;
  /** The signed-in owner editing their own row — role/active are locked. */
  isSelf?: boolean;
}) {
  const editing = Boolean(account?.id);
  const [state, action, pending] = useActionState<AccountState, FormData>(
    editing ? updateAdminAccount : createAdminAccount,
    {},
  );
  const fe = state.fieldErrors ?? {};

  const [role, setRole] = useState<Role>(account?.role ?? "admin");
  const [granted, setGranted] = useState<SectionKey[]>(
    account?.permissions ?? DEFAULT_PERMISSIONS[account?.role ?? "admin"],
  );

  const isOwnerRow = account?.role === "owner";
  const selectable = grantableSections(role);

  const onRoleChange = (next: Role) => {
    setRole(next);
    // Reset to that role's sensible defaults; the owner keeps everything.
    setGranted(DEFAULT_PERMISSIONS[next]);
  };

  const toggle = (key: SectionKey) =>
    setGranted((cur) =>
      cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key],
    );

  return (
    <form action={action}>
      <ErrorBanner message={state.error} />
      <SuccessBanner message={state.success} />
      {account?.id && <input type="hidden" name="id" value={account.id} />}

      <Card>
        <FormSection
          title="অ্যাকাউন্টের তথ্য"
          description={
            editing
              ? "ইউজারনেম পরিবর্তন করা যায় না — বাকি সব তথ্য বদলানো যাবে।"
              : "নতুন এডমিন বা লেখক এই ইউজারনেম ও পাসওয়ার্ড দিয়ে লগইন করবেন।"
          }
          icon={editing ? ShieldCheck : UserPlus}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {editing ? (
              <Field
                label="ইউজারনেম"
                name="username_display"
                dir="ltr"
                defaultValue={account?.username}
                disabled
              />
            ) : (
              <Field
                label="ইউজারনেম"
                name="username"
                dir="ltr"
                required
                autoComplete="off"
                error={fe.username}
                placeholder="যেমন: rahim"
                hint="ইংরেজি অক্ষর, সংখ্যা এবং . _ - ব্যবহার করা যাবে।"
              />
            )}
            <Field
              label="নাম"
              name="name"
              defaultValue={account?.name}
              error={fe.name}
              placeholder="পূর্ণ নাম"
            />
          </div>

          <Field
            label="ইমেইল"
            name="email"
            type="email"
            dir="ltr"
            defaultValue={account?.email}
            error={fe.email}
            placeholder="you@example.com"
            hint="পাসওয়ার্ড রিসেটের কোড এই ঠিকানায় যাবে, তাই দেওয়া ভালো।"
          />

          <Field
            label={editing ? "নতুন পাসওয়ার্ড" : "পাসওয়ার্ড"}
            name="password"
            type="password"
            autoComplete="new-password"
            required={!editing}
            error={fe.password}
            hint={
              editing
                ? "পাসওয়ার্ড বদলাতে না চাইলে ফাঁকা রাখুন। কমপক্ষে ৮ অক্ষর।"
                : "কমপক্ষে ৮ অক্ষর।"
            }
          />

          <ImageField
            label="প্রোফাইল ছবি"
            name="avatar_file"
            currentUrl={account?.avatar ?? null}
            preview="round"
            hint="ঐচ্ছিক — সর্বোচ্চ ৮ MB।"
          />
        </FormSection>

        <CardDivider />

        <FormSection
          title="পদবি ও পারমিশন"
          description="পদবি বাছলে সেই অনুযায়ী ডিফল্ট পারমিশন বসে যাবে, তারপর প্রয়োজনমতো বদলে নিন।"
          icon={KeyRound}
        >
          {isOwnerRow ? (
            <div className="rounded-[var(--radius-a-sm)] border border-accent-ring bg-accent-soft/60 px-4 py-3.5 text-sm text-accent-dark">
              এটি <strong>মালিক</strong> অ্যাকাউন্ট — সবসময় সম্পূর্ণ অ্যাক্সেস থাকে এবং পদবি
              পরিবর্তন বা নিষ্ক্রিয় করা যায় না।
              <input type="hidden" name="role" value="owner" />
              <input type="hidden" name="is_active" value="on" />
            </div>
          ) : (
            <>
              {/* Role picker as cards — clearer than a bare select. */}
              <div className="grid gap-2.5 sm:grid-cols-2">
                {(["admin", "author"] as const).map((r) => (
                  <label
                    key={r}
                    className={cn(
                      "cursor-pointer rounded-[var(--radius-a-sm)] border px-4 py-3.5 transition",
                      role === r
                        ? "border-accent bg-accent-soft/60 shadow-a-card"
                        : "border-a-line bg-a-surface hover:border-a-faint/50 hover:bg-a-sunken",
                    )}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={role === r}
                      onChange={() => onRoleChange(r)}
                      className="sr-only"
                    />
                    <span className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "text-[0.875rem] font-bold",
                          role === r ? "text-accent-dark" : "text-a-ink",
                        )}
                      >
                        {ROLES[r]}
                      </span>
                      {role === r && <Check className="h-4 w-4 text-accent" />}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-a-muted">
                      {ROLE_HINTS[r]}
                    </span>
                  </label>
                ))}
              </div>

              {/* Section permissions */}
              <div>
                <p className="mb-2 text-[0.8125rem] font-semibold text-a-ink-soft">
                  কোন সেকশনগুলোতে ঢুকতে পারবেন
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SECTIONS.filter((s) => selectable.includes(s.key)).map((s) => {
                    const on = granted.includes(s.key);
                    return (
                      <label
                        key={s.key}
                        className={cn(
                          "flex cursor-pointer items-start gap-2.5 rounded-[var(--radius-a-sm)] border px-3.5 py-2.5 transition",
                          on
                            ? "border-accent-ring bg-accent-soft/40"
                            : "border-a-line bg-a-surface hover:bg-a-sunken",
                        )}
                      >
                        <input
                          type="checkbox"
                          name="permissions"
                          value={s.key}
                          checked={on}
                          onChange={() => toggle(s.key)}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
                        />
                        <span className="min-w-0">
                          <span className="block text-[0.8125rem] font-medium text-a-ink">
                            {s.label}
                          </span>
                          <span className="block text-xs text-a-faint">{s.hint}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-a-faint">
                  “এডমিন ম্যানেজমেন্ট” এবং “সেটিংস” শুধু মালিকের জন্য সংরক্ষিত — অন্য কাউকে
                  দেওয়া যায় না।
                </p>
              </div>

              <Checkbox
                label="অ্যাকাউন্টটি সক্রিয়"
                name="is_active"
                defaultChecked={account?.is_active ?? true}
                hint="বন্ধ করলে এই ব্যক্তি আর লগইন করতে পারবেন না।"
              />
            </>
          )}
        </FormSection>

        <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-a-line-soft pt-6">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark active:translate-y-px disabled:pointer-events-none disabled:opacity-55"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending
              ? "সংরক্ষণ হচ্ছে…"
              : editing
                ? "পরিবর্তন সংরক্ষণ করুন"
                : "অ্যাকাউন্ট তৈরি করুন"}
          </button>
          <Link
            href="/admin/admins"
            className="inline-flex items-center rounded-[10px] border border-a-line bg-a-surface px-4 py-2.5 text-sm font-semibold text-a-ink-soft transition hover:bg-a-sunken"
          >
            বাতিল
          </Link>
          {isSelf && (
            <span className="text-xs text-a-faint">এটি আপনার নিজের অ্যাকাউন্ট।</span>
          )}
        </div>
      </Card>
    </form>
  );
}
