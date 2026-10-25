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
  // OutletLogo is a client component, so its props are serialised into the
  // page payload once per tile. Passing the whole outlet row shipped every
  // column ~200 times; it reads only these three.
  const logoProps = { name: outlet.name, logo_url: outlet.logo_url, url: outlet.url };

  // Homepage tile: 88px box with a 68px logo frame; the name sits in the strip
  // below. Width comes from the grid track (six per row on desktop).
  // The compact tile's utilities live in globals.css (.tile*): the homepage
  // repeats this markup ~200 times and every byte of it is stored three times
  // per cached page (HTML, inline RSC, .rsc), so the long class lists were a
  // third of what each homepage refresh wrote.
  const className = compact
    ? "group tile"
    : "group relative flex flex-col border-b border-r border-line bg-surface transition duration-200 hover:z-10 hover:ring-1 hover:ring-accent-ring";

  const body = compact ? (
    <>
      {outlet.is_featured && (
        <span className="tile-badge">Top</span>
      )}
      <div className="tile-logo">
        <OutletLogo outlet={logoProps} compact />
      </div>
      <div className="tile-foot">
        <p className="tile-name">{outlet.name}</p>
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
        <OutletLogo outlet={logoProps} />
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
    // No prefetch: the reader is rendered per request, so prefetching would
    // run a server render for every tile scrolled past, not just the one clicked.
    <Link href={`/read/${handle}`} prefetch={false} className={className}>
      {body}
    </Link>
  );
}
