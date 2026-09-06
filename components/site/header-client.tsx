"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X, ArrowUpRight } from "lucide-react";
import { Logo } from "./logo";
import { PRIMARY_NAV, TRAILING_NAV } from "@/lib/site-config";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

type NavCat = Pick<Category, "slug" | "title" | "title_bn" | "accent">;

export function HeaderClient({
  mainCategories,
  divisions,
  logoSrc,
  siteName,
}: {
  mainCategories: NavCat[];
  divisions: NavCat[];
  /** Branding from Settings → General. */
  logoSrc?: string | null;
  siteName?: string;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<null | "papers" | "local">(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Collapse the mobile menu and any dropdown on navigation. Adjusting state
  // during render avoids the cascading re-render an effect would cause.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
    setOpenMenu(null);
  }

  // Close open dropdowns on outside click or Escape.
  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest("[data-dropdown]")) setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenMenu(null);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  const toggleMenu = (key: "papers" | "local") =>
    setOpenMenu((m) => (m === key ? null : key));

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-md transition-shadow",
        scrolled && "shadow-[0_1px_0_rgba(23,19,13,0.04),0_8px_24px_-16px_rgba(23,19,13,0.25)]",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo src={logoSrc} name={siteName} />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {PRIMARY_NAV.map((item) => (
            <NavLink key={item.href} href={item.href} active={isActive(pathname, item.href)}>
              {item.label}
            </NavLink>
          ))}

          <Dropdown
            label="All Bangla Newspapers"
            open={openMenu === "papers"}
            onToggle={() => toggleMenu("papers")}
          >
            <div className="grid w-[34rem] grid-cols-2 gap-1 p-2">
              {mainCategories.map((c) => (
                <MenuItem key={c.slug} href={`/category/${c.slug}`} title={c.title} subtitle={c.title_bn} />
              ))}
            </div>
          </Dropdown>

          <Dropdown
            label="Local Newspaper"
            open={openMenu === "local"}
            onToggle={() => toggleMenu("local")}
          >
            <div className="grid w-[30rem] grid-cols-2 gap-1 p-2">
              {divisions.map((d) => (
                <MenuItem
                  key={d.slug}
                  href={`/local/${d.slug}`}
                  title={d.title}
                  subtitle={d.title_bn}
                  dot={d.accent ?? undefined}
                />
              ))}
            </div>
          </Dropdown>

          {TRAILING_NAV.map((item) => (
            <NavLink key={item.href} href={item.href} active={isActive(pathname, item.href)}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/submit"
            className="hidden rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark sm:inline-flex sm:items-center sm:gap-1.5"
          >
            Submit Site
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-surface text-ink lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="border-t border-line bg-paper lg:hidden">
          <div className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:px-6">
            <div className="flex flex-col">
              {PRIMARY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border-b border-line/70 py-3 text-[15px] font-medium text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <MobileGroup title="All Bangla Newspapers" items={mainCategories} base="/category" />
            <MobileGroup title="Local Newspaper" items={divisions} base="/local" />
            <div className="flex flex-col">
              {TRAILING_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border-b border-line/70 py-3 text-[15px] font-medium text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <Link
              href="/submit"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white"
            >
              Submit Site <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
        active ? "text-accent" : "text-ink-soft hover:text-ink hover:bg-band",
      )}
    >
      {children}
    </Link>
  );
}

function Dropdown({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative" data-dropdown>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
          open ? "text-accent bg-band" : "text-ink-soft hover:text-ink hover:bg-band",
        )}
      >
        {label}
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")} />
      </button>
      <div
        className={cn(
          "absolute left-1/2 top-[calc(100%+8px)] -translate-x-1/2 origin-top overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-24px_rgba(23,19,13,0.3)] transition duration-200 ease-out",
          open
            ? "visible scale-100 opacity-100"
            : "pointer-events-none invisible -translate-y-1 scale-95 opacity-0",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function MenuItem({
  href,
  title,
  subtitle,
  dot,
}: {
  href: string;
  title: string;
  subtitle?: string | null;
  dot?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-band"
    >
      {dot ? (
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: dot }} />
      ) : (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70" />
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-ink group-hover:text-accent">
          {title}
        </span>
        {subtitle && (
          <span className="block truncate font-bangla text-xs text-muted">{subtitle}</span>
        )}
      </span>
    </Link>
  );
}

function MobileGroup({
  title,
  items,
  base,
}: {
  title: string;
  items: NavCat[];
  base: string;
}) {
  return (
    <details className="group rounded-xl border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-ink">
        {title}
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="grid grid-cols-2 gap-1 px-2 pb-2">
        {items.map((c) => (
          <Link
            key={c.slug}
            href={`${base}/${c.slug}`}
            className="truncate rounded-lg px-2.5 py-2 text-[13px] text-ink-soft hover:bg-band"
          >
            {c.title}
          </Link>
        ))}
      </div>
    </details>
  );
}
