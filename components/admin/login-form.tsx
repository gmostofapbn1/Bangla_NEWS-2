"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2, LogIn } from "lucide-react";
import { login, type LoginState } from "@/lib/actions/auth";

export function LoginForm({
  next,
  justReset,
}: {
  next: string;
  justReset?: boolean;
}) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="w-full">
      {justReset && (
        <div className="admin-flash mb-4 flex items-start gap-2.5 rounded-[var(--radius-a)] border border-a-ok/20 bg-a-ok-soft px-4 py-3 text-sm text-a-ok">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>পাসওয়ার্ড পরিবর্তন হয়েছে। এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।</span>
        </div>
      )}

      {state.error && (
        <div className="admin-flash mb-4 flex items-start gap-2.5 rounded-[var(--radius-a)] border border-accent-ring bg-accent-soft px-4 py-3 text-sm text-accent-dark">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="leading-relaxed">{state.error}</span>
        </div>
      )}

      <input type="hidden" name="next" value={next} />

      <label htmlFor="username" className="mb-1.5 block text-[0.8125rem] font-semibold text-a-ink-soft">
        ইউজারনেম
      </label>
      <input
        id="username"
        name="username"
        dir="ltr"
        autoFocus
        autoComplete="username"
        defaultValue="admin"
        placeholder="admin"
        className="admin-input"
      />

      <div className="mb-1.5 mt-4 flex items-baseline justify-between gap-2">
        <label htmlFor="password" className="text-[0.8125rem] font-semibold text-a-ink-soft">
          পাসওয়ার্ড
        </label>
        <Link
          href="/admin/forgot"
          className="text-xs font-medium text-accent transition hover:underline"
        >
          পাসওয়ার্ড ভুলে গেছেন?
        </Link>
      </div>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        className="admin-input"
      />

      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark active:translate-y-px disabled:pointer-events-none disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        {pending ? "যাচাই করা হচ্ছে…" : "লগইন করুন"}
      </button>
    </form>
  );
}
