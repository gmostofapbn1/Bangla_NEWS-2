import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Chrome shared by every signed-out screen (login, forgot, reset): a dark
 * brand panel beside the form on desktop, a compact card on mobile.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  backHref,
  backLabel,
  siteName,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  siteName: string;
}) {
  return (
    <div className="admin-root grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="admin-rail relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        {/* Soft accent bloom, kept low-contrast so the type stays crisp. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full opacity-[0.16] blur-3xl"
          style={{ background: "var(--color-accent)" }}
        />
        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-[13px] bg-accent text-sm font-bold text-white">
            AN
          </span>
          <span>
            <span className="block text-[1.05rem] font-bold leading-tight text-white">
              Admin Panel
            </span>
            <span className="block text-xs text-a-nav-muted">{siteName}</span>
          </span>
        </div>

        <div className="relative max-w-sm">
          <p className="text-[1.6rem] font-bold leading-snug text-white">
            বাংলা মিডিয়ার সবচেয়ে গোছানো ডিরেক্টরি — এক জায়গা থেকে নিয়ন্ত্রণ করুন।
          </p>
          <p className="mt-3 text-sm leading-relaxed text-a-nav-muted">
            পত্রিকা, ক্যাটাগরি, বিভাগীয় সংবাদপত্র, ব্লগ, সাবমিশন এবং সাইটের সব সেটিংস —
            সবকিছুই এক প্যানেলে।
          </p>
        </div>

        <p className="relative text-xs text-a-nav-muted">
          © {new Date().getFullYear()} {siteName}
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-[380px]">
          <div className="mb-7 lg:hidden">
            <span className="grid h-11 w-11 place-items-center rounded-[13px] bg-accent text-sm font-bold text-white">
              AN
            </span>
          </div>

          {backHref && (
            <Link
              href={backHref}
              className="mb-4 inline-flex items-center gap-1 text-[0.8125rem] font-medium text-a-muted transition hover:text-accent"
            >
              <ArrowLeft className="h-4 w-4" /> {backLabel ?? "ফিরে যান"}
            </Link>
          )}

          <h1 className="text-[1.5rem] font-bold leading-tight text-a-ink">{title}</h1>
          <p className="mb-6 mt-1.5 text-sm leading-relaxed text-a-muted">{subtitle}</p>

          {children}

          {footer && <div className="mt-6 text-center text-xs text-a-faint">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
