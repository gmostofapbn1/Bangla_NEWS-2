import { OutletCard, COMPACT_GRID } from "./outlet-card";
import type { Outlet } from "@/lib/types";

/**
 * Responsive tile grid. `limit` caps how many render (for homepage previews).
 * `compact` packs more, smaller tiles per row (homepage category previews).
 * `globalOpenExternal` passes the admin-configured default to each card.
 */
export function OutletGrid({
  outlets,
  limit,
  compact = false,
  globalOpenExternal = false,
}: {
  outlets: Outlet[];
  limit?: number;
  compact?: boolean;
  globalOpenExternal?: boolean;
}) {
  const list = limit ? outlets.slice(0, limit) : outlets;
  if (list.length === 0) {
    return (
      <p className="rounded-tile border border-dashed border-line bg-surface px-4 py-10 text-center text-sm text-muted">
        Nothing here yet.
      </p>
    );
  }

  // Six newspapers per row on desktop. The count steps down on narrower
  // screens (2 → 3 → 4 → 6) because a sixth of a phone viewport is unreadable.
  if (compact) {
    return (
      <div className={COMPACT_GRID}>
        {list.map((outlet) => (
          <OutletCard
            key={outlet.id}
            outlet={outlet}
            compact
            shouldOpenExternal={globalOpenExternal}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-xl border-l border-t border-line bg-surface sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {list.map((outlet) => (
        <OutletCard
          key={outlet.id}
          outlet={outlet}
          shouldOpenExternal={globalOpenExternal}
        />
      ))}
    </div>
  );
}
