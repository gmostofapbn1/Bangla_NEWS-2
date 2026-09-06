"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderTree,
  Newspaper,
  MapPinned,
  Globe2,
  FileText,
  Inbox,
  ShieldCheck,
  Settings2,
  UserRound,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { ROLES, type Role, type SectionKey } from "@/lib/permissions";
import { Avatar } from "./ui";

/* Icon per section — kept here so `lib/permissions.ts` stays edge-safe. */
const ICONS: Record<SectionKey, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  categories: FolderTree,
  outlets: Newspaper,
  divisions: MapPinned,
  international: Globe2,
  posts: FileText,
  submissions: Inbox,
  admins: ShieldCheck,
  settings: Settings2,
};

/* Sections are grouped so a 9-item rail still scans in one glance. */
const GROUPS: { label: string; keys: SectionKey[] }[] = [
  { label: "সারসংক্ষেপ", keys: ["dashboard"] },
  { label: "ডিরেক্টরি", keys: ["categories", "outlets", "divisions", "international"] },
  { label: "কনটেন্ট", keys: ["posts", "submissions"] },
  { label: "ব্যবস্থাপনা", keys: ["admins", "settings"] },
];

export type NavItem = {
  key: SectionKey;
  label: string;
  href: string;
  badge?: number;
};

export type ShellUser = {
  name: string;
  username: string;
  role: Role;
  avatar: string | null;
};

export function AdminShell({
  children,
  nav,
  user,
  siteName,
}: {
  children: React.ReactNode;
  nav: NavItem[];
  user: ShellUser;
  /** From Settings → General, so the rail brands itself with the client's name. */
  siteName: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the drawer when navigation happens. Adjusting state during render
  // (rather than in an effect) avoids the extra render pass that would briefly
  // paint the drawer over the new page.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
  }

  // Lock body scroll behind the drawer.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const byKey = new Map(nav.map((n) => [n.key, n]));
  const groups = GROUPS.map((g) => ({
    label: g.label,
    items: g.keys.map((k) => byKey.get(k)).filter((n): n is NavItem => Boolean(n)),
  })).filter((g) => g.items.length > 0);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const current = nav.find((n) => isActive(n.href));

  return (
    <div className="admin-root min-h-screen">
      {/* ---------------- Desktop rail ---------------- */}
      <aside className="admin-rail fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col lg:flex">
        <div className="admin-rail-edge absolute inset-y-0 right-0 w-px" />
        <RailContent groups={groups} user={user} isActive={isActive} siteName={siteName} />
      </aside>

      {/* ---------------- Mobile drawer ---------------- */}
      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="মেনু বন্ধ করুন"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-a-nav-deep/55 backdrop-blur-[2px] lg:hidden"
          />
          <aside className="admin-rail fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col shadow-a-pop lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="বন্ধ করুন"
              className="absolute right-3 top-3.5 grid h-8 w-8 place-items-center rounded-lg text-a-nav-muted transition hover:bg-a-nav-hover hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <RailContent groups={groups} user={user} isActive={isActive} siteName={siteName} />
          </aside>
        </>
      )}

      {/* ---------------- Main column ---------------- */}
      <div className="flex min-h-screen flex-col lg:ml-[264px]">
        <header className="admin-topbar sticky top-0 z-30 border-b border-a-line">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="মেনু খুলুন"
              className="grid h-9 w-9 place-items-center rounded-[10px] border border-a-line bg-a-surface text-a-ink-soft transition hover:bg-a-sunken lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Breadcrumb — "Admin Panel / <section>" */}
            <nav aria-label="ব্রেডক্রাম্ব" className="flex min-w-0 items-center gap-1.5 text-sm">
              <Link href="/admin" className="shrink-0 font-medium text-a-muted transition hover:text-a-ink">
                এডমিন
              </Link>
              {current && current.href !== "/admin" && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-a-faint" />
                  <span className="truncate font-semibold text-a-ink">{current.label}</span>
                </>
              )}
            </nav>

            <div className="ml-auto flex items-center gap-1.5">
              <Link
                href="/"
                target="_blank"
                className="hidden items-center gap-1.5 rounded-[10px] border border-a-line bg-a-surface px-3 py-1.5 text-[0.8125rem] font-medium text-a-ink-soft transition hover:bg-a-sunken sm:inline-flex"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                সাইট দেখুন
              </Link>
              <Link
                href="/admin/profile"
                title="আমার প্রোফাইল"
                className="flex items-center gap-2 rounded-full border border-a-line bg-a-surface py-1 pl-1 pr-3 transition hover:bg-a-sunken"
              >
                <Avatar src={user.avatar} name={user.name || user.username} size={26} />
                <span className="max-w-[9rem] truncate text-[0.8125rem] font-semibold text-a-ink">
                  {user.name || user.username}
                </span>
              </Link>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function RailContent({
  groups,
  user,
  isActive,
  siteName,
}: {
  groups: { label: string; items: NavItem[] }[];
  user: ShellUser;
  isActive: (href: string) => boolean;
  siteName: string;
}) {
  return (
    <div className="relative flex h-full flex-col overflow-y-auto">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 pb-4 pt-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-accent text-[13px] font-bold text-white shadow-[0_2px_10px_-2px_var(--color-accent)]">
          AN
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[0.9375rem] font-bold leading-tight text-white">
            Admin Panel
          </span>
          <span className="block truncate text-[11px] text-a-nav-muted">{siteName}</span>
        </span>
      </div>

      {/* Signed-in account */}
      <Link
        href="/admin/profile"
        className="mx-3 flex items-center gap-2.5 rounded-[12px] border border-a-nav-line bg-white/[0.03] px-3 py-2.5 transition hover:bg-a-nav-hover"
      >
        <Avatar src={user.avatar} name={user.name || user.username} size={32} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.8125rem] font-semibold text-a-nav-ink">
            {user.name || user.username}
          </span>
          <span className="block truncate text-[11px] text-a-nav-muted">@{user.username}</span>
        </span>
        <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10.5px] font-semibold text-accent-ring">
          {ROLES[user.role]}
        </span>
      </Link>

      {/* Sections */}
      <nav className="mt-5 flex-1 px-3 pb-4">
        {groups.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            <p className="mb-1.5 px-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-a-nav-muted/70">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = ICONS[item.key];
                const active = isActive(item.href);
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[0.8438rem] font-medium transition",
                        active
                          ? "admin-nav-active"
                          : "text-a-nav-muted hover:bg-a-nav-hover hover:text-a-nav-ink",
                      )}
                    >
                      <Icon className={cn("h-[17px] w-[17px] shrink-0", active && "text-accent")} />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.badge ? (
                        <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer actions */}
      <div className="mt-auto border-t border-a-nav-line px-3 py-3">
        <Link
          href="/admin/profile"
          className="flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[0.8438rem] font-medium text-a-nav-muted transition hover:bg-a-nav-hover hover:text-a-nav-ink"
        >
          <UserRound className="h-[17px] w-[17px]" /> আমার প্রোফাইল
        </Link>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[0.8438rem] font-medium text-a-nav-muted transition hover:bg-a-nav-hover hover:text-a-nav-ink"
        >
          <ExternalLink className="h-[17px] w-[17px]" /> সাইট দেখুন
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-[0.8438rem] font-medium text-accent-ring transition hover:bg-accent/12 hover:text-white"
          >
            <LogOut className="h-[17px] w-[17px]" /> লগআউট
          </button>
        </form>
      </div>
    </div>
  );
}
