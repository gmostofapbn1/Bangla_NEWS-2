import type { Metadata } from "next";
import { AuthShell } from "@/components/admin/auth-shell";
import { ForgotForm } from "@/components/admin/forgot-form";
import { getSiteSettings } from "@/lib/settings";
import { accentStyle } from "@/lib/utils";

export const metadata: Metadata = {
  title: "পাসওয়ার্ড রিসেট",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const settings = await getSiteSettings();

  return (
    <div style={accentStyle(settings.primary_color)}>
      <AuthShell
        siteName={settings.site_name}
        title="পাসওয়ার্ড রিসেট"
        subtitle="আপনার ইউজারনেম বা ইমেইল দিন — ইমেইলে একটি ভেরিফিকেশন কোড পাঠানো হবে।"
        backHref="/admin/login"
        backLabel="লগইনে ফিরে যান"
        footer={
          <>
            ইমেইল পাঠাতে সেটিংস → ইমেইল কনফিগারেশন (SMTP) ঠিকভাবে পূরণ করা থাকতে হবে।
          </>
        }
      >
        <ForgotForm />
      </AuthShell>
    </div>
  );
}
