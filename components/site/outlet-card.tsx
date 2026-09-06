import Link from "next/link";
import { OutletLogo } from "./outlet-logo";
import type { Outlet } from "@/lib/types";

/**
 * Track definition for every compact tile grid on the site: six newspapers per
 * row on desktop, stepping down on narrower screens because a sixth of a phone
 * viewport is unreadable. Shared by the homepage, the category and division
 * listings, and the loading skeleton so they all line up identically.
 */
export const COMPACT_GRID =
  "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6";

/**
 * Rectangular directory cell (no rounding, no gap — shares borders with
 * neighbours via the grid container).
 *
 * Embeddable outlets open in the in-site reader at /read/[slug]. Outlets that
 * block framing (`open_external`, or every outlet when the admin's global
 * default is on) can't be shown inside the site at all, so they open the
 * publisher directly in a **new tab** — via /go/[id], which counts the click
 * server-side and then redirects. Sending those to the same tab used to throw
 * the directory away.
 *
 * `compact` renders the smaller tile used by the homepage and category grids.
 */
export function OutletCard({
  outlet,
  compact,
  shouldOpenExternal = false,
}: {
  outlet: Outlet;
  shouldOpenExternal?: boolean;
  compact?: boolean;
}) {
  const handle = outlet.slug ?? outlet.id;
  const external = outlet.open_external || shouldOpenExternal;

  // Homepage tile: 88px box with a 68px logo frame; the name sits in the strip
  // below. Width comes from the grid track (six per row on desktop).
  const className = compact
    ? "group relative flex h-[88px] w-full flex-col overflow-hidden rounded-lg border border-line bg-surface transition duration-200 hover:border-accent-ring hover:shadow-sm"
    : "group relative flex flex-col border-b border-r border-line bg-surface transition duration-200 hover:z-10 hover:ring-1 hover:ring-accent-ring";

  const body = compact ? (
    <>
      {outlet.is_featured && (
        <span className="absolute left-1 top-1 z-10 rounded bg-accent px-1 py-px text-[7px] font-bold uppercase tracking-wider text-white">
          Top
        </span>
      )}
      <div className="h-[68px] w-full shrink-0">
        <OutletLogo outlet={outlet} compact />
      </div>
      <div className="flex flex-1 items-center justify-center border-t border-line px-1.5">
        <p className="truncate text-[9.5px] font-semibold leading-none text-ink transition-colors group-hover:text-accent">
          {outlet.name}
        </p>
      </div>
    </>
  ) : (
    <>
      {outlet.is_featured && (
        <span className="absolute left-1.5 top-1.5 z-10 rounded bg-accent px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
          Top
        </span>
      )}

      {/* Logo panel */}
      <div className="flex aspect-[16/10] items-center justify-center bg-white p-3">
        <OutletLogo outlet={outlet} />
      </div>

      {/* Name */}
      <div className="border-t border-line px-2 py-2 text-center">
        <p className="truncate text-[12.5px] font-semibold leading-tight text-ink transition-colors group-hover:text-accent">
          {outlet.name}
        </p>
        {outlet.name_bn && (
          <p className="mt-0.5 truncate font-bangla text-[10.5px] leading-tight text-muted">
            {outlet.name_bn}
          </p>
        )}
      </div>
    </>
  );

  if (external) {
    return (
      <a
        href={`/go/${outlet.id}`}
        target="_blank"
        rel="noopener noreferrer"
        title={`Opens ${outlet.name} in a new tab`}
        className={className}
      >
        {body}
      </a>
    );
  }

  return (
    <Link href={`/read/${handle}`} className={className}>
      {body}
    </Link>
  );
}
