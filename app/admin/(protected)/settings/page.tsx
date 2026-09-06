import { Building2, Search, Mail, Megaphone, Share2, FileText } from "lucide-react";
import { adminGetSettings } from "@/lib/admin-queries";
import { requireSection, getCurrentAdmin } from "@/lib/auth";
import { hasServiceRole } from "@/lib/env";
import { SettingsForm } from "@/components/admin/settings-form";
import { TestEmailCard } from "@/components/admin/test-email-card";
import { Alert, PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const JUMP = [
  { id: "general", label: "সাধারণ", icon: Building2 },
  { id: "seo", label: "এসইও", icon: Search },
  { id: "email", label: "ইমেইল (SMTP)", icon: Mail },
  { id: "ads", label: "Google AdSense", icon: Megaphone },
  { id: "social", label: "সোশ্যাল লিংক", icon: Share2 },
  { id: "pages", label: "ফুটার পেজ", icon: FileText },
];

export default async function SettingsPage() {
  await requireSection("settings");
  const [settings, me] = await Promise.all([adminGetSettings(), getCurrentAdmin()]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="ব্যবস্থাপনা"
        title="সেটিংস"
        description="ওয়েবসাইটের নাম, লোগো, রং, SEO, ইমেইল সার্ভার, বিজ্ঞাপন এবং ফুটারের সব কনটেন্ট এখান থেকে নিয়ন্ত্রণ করুন।"
      />

      {!hasServiceRole() && (
        <div className="mb-5">
          <Alert tone="warn" title="Supabase যুক্ত করুন">
            সেটিংস সংরক্ষণ করতে <code>SUPABASE_SERVICE_ROLE_KEY</code> প্রয়োজন।
          </Alert>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[190px_minmax(0,1fr)]">
        {/* Jump nav — a settings page this long needs a map. */}
        <nav className="hidden lg:block">
          <div className="sticky top-20">
            <p className="mb-2 px-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-a-faint">
              সেকশন
            </p>
            <ul className="space-y-0.5">
              {JUMP.map((j) => {
                const Icon = j.icon;
                return (
                  <li key={j.id}>
                    <a
                      href={`#${j.id}`}
                      className="flex items-center gap-2.5 rounded-[9px] px-3 py-2 text-[0.8125rem] font-medium text-a-muted transition hover:bg-a-surface hover:text-a-ink"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {j.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <div className="min-w-0 space-y-5">
          <SettingsForm settings={settings} />
          <TestEmailCard defaultTo={me?.email ?? settings.smtp_from_email ?? ""} />
        </div>
      </div>
    </div>
  );
}
