import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { AuthShell } from "@/components/admin/auth-shell";
import { getSiteSettings } from "@/lib/settings";
import { getCurrentAdmin } from "@/lib/auth";
import { accentStyle } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string }>;
}) {
  const [{ next, reset }, settings, existing] = await Promise.all([
    searchParams,
    getSiteSettings(),
    getCurrentAdmin(),
  ]);

  // Already signed in — no reason to show the form again.
  if (existing) redirect("/admin");

  const safeNext = next && next.startsWith("/admin") ? next : "/admin";

  return (
    <div style={accentStyle(settings.primary_color)}>
      <AuthShell
        siteName={settings.site_name}
        title="স্বাগতম"
        subtitle="এডমিন প্যানেলে ঢুকতে আপনার ইউজারনেম ও পাসওয়ার্ড দিন।"
      >
        <LoginForm next={safeNext} justReset={reset === "1"} />
      </AuthShell>
    </div>
  );
}
