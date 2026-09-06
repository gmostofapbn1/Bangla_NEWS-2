import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { adminStats } from "@/lib/admin-queries";
import { getSiteSettings } from "@/lib/settings";
import { AdminShell, type NavItem } from "@/components/admin/admin-shell";
import { SECTIONS, SECTION_HREF, can } from "@/lib/permissions";
import { accentStyle } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  const [settings, stats] = await Promise.all([getSiteSettings(), adminStats()]);

  // The rail only ever shows what this account may actually open; the pages
  // themselves re-check, so a hidden link is not the security boundary.
  const nav: NavItem[] = SECTIONS.filter((s) => can(admin, s.key)).map((s) => ({
    key: s.key,
    label: s.label,
    href: SECTION_HREF[s.key],
    badge: s.key === "submissions" ? stats.pendingSubmissions : undefined,
  }));

  return (
    // The admin's chosen brand colour drives the accent tokens for the whole
    // panel, so the client sees their palette everywhere, not just on the site.
    <div style={accentStyle(settings.primary_color)}>
      <AdminShell
        nav={nav}
        siteName={settings.site_name}
        user={{
          name: admin.name ?? "",
          username: admin.username,
          role: admin.role,
          avatar: admin.avatar_url,
        }}
      >
        {children}
      </AdminShell>
    </div>
  );
}
