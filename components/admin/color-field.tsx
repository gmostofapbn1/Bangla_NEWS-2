"use client";

import { useState } from "react";
import { accentPalette } from "@/lib/utils";

const PRESETS = ["#c8102e", "#0f766e", "#1d4ed8", "#7c3aed", "#b45309", "#0f172a"];

/**
 * Brand colour picker. The native swatch and the hex box stay in sync, and the
 * preview shows the derived tints so the client can see what the choice does to
 * hovers and tinted surfaces before saving.
 */
export function ColorField({
  name,
  label,
  defaultValue,
  error,
  hint,
}: {
  name: string;
  label: string;
  defaultValue: string;
  error?: string;
  hint?: React.ReactNode;
}) {
  const [value, setValue] = useState(defaultValue || "#c8102e");
  const palette = accentPalette(value);

  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-[0.8125rem] font-semibold text-a-ink-soft">
        {label}
      </label>

      <div className="flex flex-wrap items-center gap-2.5">
        <label
          className="relative h-10 w-14 shrink-0 cursor-pointer overflow-hidden rounded-[10px] border border-a-line shadow-a-card"
          style={{ background: palette.accent }}
          title="রং বাছুন"
        >
          <input
            type="color"
            value={palette.accent}
            onChange={(e) => setValue(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={label}
          />
        </label>

        <input
          id={name}
          name={name}
          value={value}
          dir="ltr"
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={!!error}
          placeholder="#c8102e"
          className="admin-input w-36 font-mono text-[13px] uppercase"
        />

        <div className="flex items-center gap-1">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setValue(p)}
              aria-label={`রং ${p}`}
              className="h-7 w-7 rounded-full border border-a-line transition hover:scale-110"
              style={{ background: p }}
            />
          ))}
        </div>
      </div>

      {/* Derived tints — exactly what the panel and the site will use. */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-a-faint">প্রিভিউ:</span>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold text-white"
          style={{ background: palette.accent }}
        >
          বাটন
        </span>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: palette.soft, color: palette.dark }}
        >
          ব্যাজ
        </span>
        <span
          className="rounded-full border px-3 py-1 text-xs font-semibold"
          style={{ borderColor: palette.ring, color: palette.dark }}
        >
          বর্ডার
        </span>
      </div>

      {error ? (
        <p className="mt-1.5 text-xs font-medium text-accent">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs leading-relaxed text-a-faint">{hint}</p>
      ) : null}
    </div>
  );
}
