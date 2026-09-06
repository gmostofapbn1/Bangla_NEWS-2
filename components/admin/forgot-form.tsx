"use client";

import { useActionState, useState } from "react";
import { Loader2, AlertCircle, MailCheck, KeyRound, Send } from "lucide-react";
import {
  requestPasswordReset,
  resetPassword,
  type ForgotState,
  type ResetState,
} from "@/lib/actions/auth";

/**
 * Two steps on one screen: request a code, then enter it with the new password.
 * Staying on one page means the login identifier does not have to be retyped.
 */
export function ForgotForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (sentTo) return <ResetStep login={sentTo} onBack={() => setSentTo(null)} />;
  return <RequestStep onSent={setSentTo} />;
}

function Banner({ message, tone }: { message: string; tone: "error" | "ok" }) {
  const cls =
    tone === "error"
      ? "border-accent-ring bg-accent-soft text-accent-dark"
      : "border-a-ok/20 bg-a-ok-soft text-a-ok";
  const Icon = tone === "error" ? AlertCircle : MailCheck;
  return (
    <div className={`admin-flash mb-4 flex items-start gap-2.5 rounded-[var(--radius-a)] border px-4 py-3 text-sm ${cls}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}

function RequestStep({ onSent }: { onSent: (login: string) => void }) {
  const [state, action, pending] = useActionState<ForgotState, FormData>(
    async (prev, formData) => {
      const result = await requestPasswordReset(prev, formData);
      if (result.sent && result.login) onSent(result.login);
      return result;
    },
    {},
  );

  return (
    <form action={action}>
      {state.error && <Banner tone="error" message={state.error} />}

      <label htmlFor="login" className="mb-1.5 block text-[0.8125rem] font-semibold text-a-ink-soft">
        ইউজারনেম বা ইমেইল
      </label>
      <input
        id="login"
        name="login"
        dir="ltr"
        autoFocus
        autoComplete="username"
        placeholder="admin অথবা you@example.com"
        className="admin-input"
      />
      <p className="mt-1.5 text-xs leading-relaxed text-a-faint">
        অ্যাকাউন্টে ইমেইল যোগ করা থাকলে সেখানে ৬ সংখ্যার একটি কোড পাঠানো হবে। কোডটি ১৫ মিনিট
        পর্যন্ত কাজ করবে।
      </p>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark active:translate-y-px disabled:pointer-events-none disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {pending ? "কোড পাঠানো হচ্ছে…" : "কোড পাঠান"}
      </button>
    </form>
  );
}

function ResetStep({ login, onBack }: { login: string; onBack: () => void }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(resetPassword, {});

  return (
    <form action={action}>
      <Banner
        tone="ok"
        message="অ্যাকাউন্টটি থাকলে এবং তাতে ইমেইল যোগ করা থাকলে একটি কোড পাঠানো হয়েছে। ইনবক্স (এবং স্প্যাম ফোল্ডার) দেখুন।"
      />
      {state.error && <Banner tone="error" message={state.error} />}

      <input type="hidden" name="login" value={login} />

      <label htmlFor="code" className="mb-1.5 block text-[0.8125rem] font-semibold text-a-ink-soft">
        ভেরিফিকেশন কোড
      </label>
      <input
        id="code"
        name="code"
        dir="ltr"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus
        placeholder="৬ সংখ্যার কোড"
        className="admin-input text-center font-mono text-lg tracking-[0.4em]"
      />

      <div className="mt-4 grid gap-4">
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-[0.8125rem] font-semibold text-a-ink-soft"
          >
            নতুন পাসওয়ার্ড
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            className="admin-input"
          />
          <p className="mt-1.5 text-xs text-a-faint">কমপক্ষে ৮ অক্ষর।</p>
        </div>
        <div>
          <label
            htmlFor="confirm"
            className="mb-1.5 block text-[0.8125rem] font-semibold text-a-ink-soft"
          >
            নতুন পাসওয়ার্ড আবার লিখুন
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            className="admin-input"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark active:translate-y-px disabled:pointer-events-none disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        {pending ? "পরিবর্তন হচ্ছে…" : "পাসওয়ার্ড পরিবর্তন করুন"}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="mt-3 w-full text-center text-xs font-medium text-a-muted transition hover:text-accent"
      >
        কোড আসেনি? আবার পাঠান
      </button>
    </form>
  );
}
