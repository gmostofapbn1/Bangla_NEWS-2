"use client";

import { useActionState } from "react";
import { Loader2, Send, MailCheck } from "lucide-react";
import { sendTestEmail, type TestMailState } from "@/lib/actions/settings";
import { ErrorBanner, SuccessBanner } from "./form-kit";
import { Card, CardHeader } from "./ui";

/**
 * Lives outside the settings form (forms cannot nest) so the client can verify
 * SMTP delivery without leaving the page. Save first, then test.
 */
export function TestEmailCard({ defaultTo }: { defaultTo: string }) {
  const [state, action, pending] = useActionState<TestMailState, FormData>(
    sendTestEmail,
    {},
  );

  return (
    <Card>
      <CardHeader
        title="SMTP পরীক্ষা করুন"
        description="উপরের ইমেইল সেটিংস সংরক্ষণ করার পর এখান থেকে একটি টেস্ট ইমেইল পাঠিয়ে দেখে নিন সব ঠিকভাবে কাজ করছে কি না।"
        icon={MailCheck}
      />
      <form action={action} className="mt-4">
        <ErrorBanner message={state.error} />
        <SuccessBanner message={state.success} />
        <div className="flex flex-wrap items-end gap-2.5">
          <div className="min-w-[240px] flex-1">
            <label
              htmlFor="test_to"
              className="mb-1.5 block text-[0.8125rem] font-semibold text-a-ink-soft"
            >
              কোন ঠিকানায় পাঠাব?
            </label>
            <input
              id="test_to"
              name="to"
              type="email"
              dir="ltr"
              required
              defaultValue={defaultTo}
              placeholder="you@example.com"
              className="admin-input"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-a-line bg-a-surface px-4 py-2.5 text-sm font-semibold text-a-ink-soft transition hover:bg-a-sunken active:translate-y-px disabled:pointer-events-none disabled:opacity-55"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {pending ? "পাঠানো হচ্ছে…" : "টেস্ট ইমেইল পাঠান"}
          </button>
        </div>
      </form>
    </Card>
  );
}
