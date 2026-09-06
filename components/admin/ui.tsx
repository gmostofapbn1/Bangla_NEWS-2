import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared primitives for the admin panel. Server components by default so pages
 * can compose them without shipping JavaScript; anything interactive lives in
 * its own "use client" file.
 */

/* -------------------------------------------------------------------------- */
/* Page header                                                                 */
/* -------------------------------------------------------------------------- */

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-a-faint">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[1.4rem] font-bold leading-tight text-a-ink">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-a-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius-a)] border border-a-line bg-a-surface shadow-a-card",
        padded && "p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: {
  title: string;
  description?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-a-sunken text-a-muted ring-1 ring-a-line">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-[0.95rem] font-semibold text-a-ink">{title}</h2>
          {description && (
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-a-muted">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Full-bleed divider inside a padded card. */
export function CardDivider({ className }: { className?: string }) {
  return <div className={cn("-mx-5 my-5 border-t border-a-line-soft sm:-mx-6 sm:my-6", className)} />;
}

/* -------------------------------------------------------------------------- */
/* Stat tile                                                                   */
/* -------------------------------------------------------------------------- */

export function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  href,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ComponentType<{ className?: string }>;
  href?: string;
  tone?: "neutral" | "accent" | "ok" | "warn";
}) {
  const iconTone = {
    neutral: "bg-a-sunken text-a-muted ring-a-line",
    accent: "bg-accent-soft text-accent ring-accent-ring/60",
    ok: "bg-a-ok-soft text-a-ok ring-a-ok/15",
    warn: "bg-a-warn-soft text-a-warn ring-a-warn/15",
  }[tone];

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[0.8125rem] font-medium text-a-muted">{label}</span>
        <span className={cn("grid h-8 w-8 place-items-center rounded-[10px] ring-1", iconTone)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-[1.75rem] font-bold leading-none tracking-tight text-a-ink">
        {value}
      </p>
      {sub && <p className="mt-2 text-xs text-a-faint">{sub}</p>}
    </>
  );

  const base =
    "block rounded-[var(--radius-a)] border border-a-line bg-a-surface p-4 shadow-a-card transition duration-200";

  if (!href) return <div className={base}>{body}</div>;
  return (
    <Link
      href={href}
      className={cn(base, "hover:-translate-y-0.5 hover:border-a-line hover:shadow-a-raised")}
    >
      {body}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Badge                                                                       */
/* -------------------------------------------------------------------------- */

export function Badge({
  tone = "neutral",
  children,
  dot,
}: {
  tone?: "neutral" | "ok" | "warn" | "accent" | "info" | "muted";
  children: ReactNode;
  dot?: boolean;
}) {
  const cls = {
    neutral: "bg-a-sunken text-a-ink-soft ring-a-line",
    muted: "bg-a-sunken text-a-faint ring-a-line",
    ok: "bg-a-ok-soft text-a-ok ring-a-ok/15",
    warn: "bg-a-warn-soft text-a-warn ring-a-warn/15",
    info: "bg-a-info-soft text-a-info ring-a-info/15",
    accent: "bg-accent-soft text-accent ring-accent-ring/60",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ring-1 ring-inset whitespace-nowrap",
        cls,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Buttons (links + non-interactive shells; forms use their own submit)        */
/* -------------------------------------------------------------------------- */

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-[10px] bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-a-card transition hover:bg-accent-dark active:translate-y-px disabled:opacity-55 disabled:pointer-events-none",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-[10px] border border-a-line bg-a-surface px-4 py-2.5 text-sm font-semibold text-a-ink-soft transition hover:border-a-faint/50 hover:bg-a-sunken active:translate-y-px disabled:opacity-55 disabled:pointer-events-none",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-[10px] px-3 py-2 text-sm font-medium text-a-muted transition hover:bg-a-sunken hover:text-a-ink",
  danger:
    "inline-flex items-center justify-center gap-2 rounded-[10px] border border-a-line bg-a-surface px-3 py-2 text-sm font-medium text-a-muted transition hover:border-accent-ring hover:bg-accent-soft hover:text-accent",
  iconGhost:
    "grid h-8 w-8 place-items-center rounded-[9px] text-a-faint transition hover:bg-a-sunken hover:text-a-ink",
} as const;

/* -------------------------------------------------------------------------- */
/* Alerts                                                                      */
/* -------------------------------------------------------------------------- */

export function Alert({
  tone = "info",
  title,
  children,
  icon: Icon,
}: {
  tone?: "info" | "warn" | "ok" | "danger";
  title?: string;
  children?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
}) {
  const cls = {
    info: "border-a-info/20 bg-a-info-soft text-a-info",
    warn: "border-a-warn/25 bg-a-warn-soft text-a-warn",
    ok: "border-a-ok/20 bg-a-ok-soft text-a-ok",
    danger: "border-accent-ring bg-accent-soft text-accent-dark",
  }[tone];

  return (
    <div className={cn("flex items-start gap-3 rounded-[var(--radius-a)] border px-4 py-3.5 text-sm", cls)}>
      {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0" />}
      <div className="min-w-0 leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-1", "opacity-90")}>{children}</div>}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                 */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-a)] border border-dashed border-a-line bg-a-surface px-6 py-14 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-a-sunken text-a-faint ring-1 ring-a-line">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-[0.95rem] font-semibold text-a-ink">{title}</p>
      {description && (
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-a-muted">{description}</p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Table                                                                       */
/* -------------------------------------------------------------------------- */

export function TableShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-a)] border border-a-line bg-a-surface shadow-a-card",
        className,
      )}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function Th({
  children,
  align = "right",
  className,
}: {
  children?: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <th
      className={cn(
        "whitespace-nowrap border-b border-a-line bg-a-sunken px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-a-faint",
        align === "left" && "text-left",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  align,
}: {
  children?: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-middle text-sm text-a-ink-soft",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

/** Row with hover affordance; pairs with `.admin-row-actions`. */
export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr className={cn("admin-row border-b border-a-line-soft transition-colors last:border-0 hover:bg-a-sunken/60", className)}>
      {children}
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* Misc                                                                        */
/* -------------------------------------------------------------------------- */

/** Small monogram avatar used for admins and outlets without an image. */
export function Avatar({
  src,
  name,
  size = 36,
  className,
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const initials = name.trim().slice(0, 1).toUpperCase() || "?";
  if (src) {
    return (
      // Avatars come from arbitrary Supabase/storage URLs and are tiny, so a
      // plain <img> avoids the optimiser round-trip for no visual benefit.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full object-cover ring-1 ring-a-line", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-accent font-semibold text-white",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

/** Label above a group of fields inside a long form. */
export function FormSection({
  title,
  description,
  children,
  icon: Icon,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <section className="scroll-mt-24">
      <CardHeader title={title} description={description} icon={Icon} />
      <div className="mt-5 grid gap-5">{children}</div>
    </section>
  );
}
