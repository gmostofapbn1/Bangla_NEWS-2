"use client";

import { useState } from "react";
import { monogram, hueFromString, brandLogo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Outlet } from "@/lib/types";

/**
 * Premium logo rendering on a clean white canvas:
 *  1. Admin-uploaded logo (logo_url) — the real masthead, fills the space.
 *  2. Best-available brand logo (icon.horse) — real, recognizable.
 *  3. Tinted serif monogram if both fail.
 *
 * `compact` trims the inner padding so the logo still reads well inside the
 * short fixed-height frame used by the homepage tiles.
 */
export function OutletLogo({
  outlet,
  compact,
}: {
  outlet: Pick<Outlet, "name" | "logo_url" | "url">;
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = outlet.logo_url || brandLogo(outlet.url);

  if (src && !failed) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-white",
          compact ? "p-2" : "p-4",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`${outlet.name} logo`}
          loading="lazy"
          onError={() => setFailed(true)}
          className={
            outlet.logo_url || compact
              ? "max-h-full max-w-full object-contain"
              : "max-h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          }
        />
      </div>
    );
  }

  const hue = hueFromString(outlet.name);
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 45% 98%), hsl(${(hue + 34) % 360} 42% 95%))`,
      }}
    >
      <span
        className={cn(
          "font-serif font-semibold tracking-tight",
          compact ? "text-lg" : "text-2xl",
        )}
        style={{ color: `hsl(${hue} 42% 42%)` }}
      >
        {monogram(outlet.name)}
      </span>
    </div>
  );
}
