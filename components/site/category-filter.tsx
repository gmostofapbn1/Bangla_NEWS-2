"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { OutletCard, COMPACT_GRID } from "./outlet-card";
import type { Outlet } from "@/lib/types";

export function CategoryFilter({
  outlets,
  globalOpenExternal = false,
}: {
  outlets: Outlet[];
  globalOpenExternal?: boolean;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return outlets;
    return outlets.filter(
      (o) =>
        o.name.toLowerCase().includes(term) ||
        (o.name_bn ?? "").toLowerCase().includes(term),
    );
  }, [q, outlets]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 sm:w-80">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter this category…"
            aria-label="Filter category"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
          />
        </div>
        <p className="text-sm text-muted">
          {filtered.length} {filtered.length === 1 ? "result" : "results"}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-tile border border-dashed border-line bg-surface px-4 py-12 text-center text-sm text-muted">
          No outlets match “{q}”.
        </p>
      ) : (
        <div className={COMPACT_GRID}>
          {filtered.map((o) => (
            <OutletCard
              key={o.id}
              outlet={o}
              compact
              shouldOpenExternal={globalOpenExternal}
            />
          ))}
        </div>
      )}
    </div>
  );
}
