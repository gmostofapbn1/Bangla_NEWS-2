"use client";

import { useActionState } from "react";
import { UserRound, KeyRound, Loader2 } from "lucide-react";
import { updateProfile, type AccountState } from "@/lib/actions/accounts";
import { Field, ErrorBanner, SuccessBanner, ImageField } from "./form-kit";
import { Card, CardDivider, FormSection } from "./ui";
import { ROLES, type Role } from "@/lib/permissions";

export function ProfileForm({
  username,
  name,
  email,
  avatar,
  role,
}: {
  username: string;
  name: string;
  email: string;
  avatar: string | null;
  role: Role;
}) {
  const [state, action, pending] = useActionState<AccountState, FormData>(updateProfile, {});
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action}>
      <ErrorBanner message={state.error} />
      <SuccessBanner message={state.success} />

      <Card>
        <FormSection title="অ্যাকাউন্টের তথ্য" icon={UserRound}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="ইউজারনেম"
              name="username_display"
              dir="ltr"
              defaultValue={username}
              disabled
              hint="ইউজারনেম পরিবর্তন করা যায় না।"
            />
            <Field
              label="পদবি"
              name="role_display"
              defaultValue={ROLES[role]}
              disabled
              hint="পদবি শুধু মালিক পরিবর্তন করতে পারেন।"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="নাম"
              name="name"
              defaultValue={name}
              error={fe.name}
              placeholder="আপনার পূর্ণ নাম"
            />
            <Field
              label="ইমেইল"
              name="email"
              type="email"
              dir="ltr"
              defaultValue={email}
              error={fe.email}
              placeholder="you@example.com"
              hint="পাসওয়ার্ড ভুলে গেলে এই ঠিকানাতেই কোড পাঠানো হবে।"
            />
          </div>

          <ImageField
            label="প্রোফাইল ছবি"
            name="avatar_file"
            currentUrl={avatar}
            preview="round"
            hint="JPG, PNG, WEBP বা GIF — সর্বোচ্চ ৮ MB।"
          />
        </FormSection>

        <CardDivider />

        <FormSection
          title="পাসওয়ার্ড পরিবর্তন"
          description="পাসওয়ার্ড বদলাতে না চাইলে নিচের ঘরগুলো ফাঁকা রাখুন।"
          icon={KeyRound}
        >
          <Field
            label="বর্তমান পাসওয়ার্ড"
            name="current_password"
            type="password"
            autoComplete="current-password"
            error={fe.current_password}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="নতুন পাসওয়ার্ড"
              name="new_password"
              type="password"
              autoComplete="new-password"
              error={fe.new_password}
              hint="কমপক্ষে ৮ অক্ষর।"
            />
            <Field
              label="নতুন পাসওয়ার্ড আবার লিখুন"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              error={fe.confirm_password}
            />
          </div>
        </FormSection>

        <div className="mt-7 border-t border-a-line-soft pt-6">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark active:translate-y-px disabled:pointer-events-none disabled:opacity-55"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
          </button>
        </div>
      </Card>
    </form>
  );
}
