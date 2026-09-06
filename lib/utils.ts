import type { CSSProperties } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toBanglaDigits } from "./bangla";

/** Merge conditional class names, de-duplicating conflicting Tailwind classes. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** A stable initial-letters monogram for logo placeholders. */
export function monogram(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Deterministic hue from a string — used to tint placeholder logos consistently. */
export function hueFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

/* -------------------------------------------------------------------------- */
/* Brand colour                                                                */
/* -------------------------------------------------------------------------- */

function parseHex(hex: string): [number, number, number] | null {
  const m = hex.trim().replace(/^#/, "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

const toHex = (n: number) =>
  Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");

/** Blend toward white (t > 0) or black (t < 0). */
function shade([r, g, b]: [number, number, number], t: number): string {
  const target = t > 0 ? 255 : 0;
  const amt = Math.abs(t);
  return `#${toHex(r + (target - r) * amt)}${toHex(g + (target - g) * amt)}${toHex(
    b + (target - b) * amt,
  )}`;
}

export type AccentPalette = {
  accent: string;
  dark: string;
  soft: string;
  ring: string;
};

/**
 * Derive the four accent tokens from the single primary colour the admin picks,
 * so changing it in Settings re-tints hovers, tinted backgrounds and focus
 * rings coherently instead of leaving the old red behind.
 */
export function accentPalette(primary: string): AccentPalette {
  const rgb = parseHex(primary);
  if (!rgb) {
    return { accent: "#c8102e", dark: "#9c0c23", soft: "#fbe9ec", ring: "#f4c2ca" };
  }
  return {
    accent: `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`,
    dark: shade(rgb, -0.22),
    soft: shade(rgb, 0.92),
    ring: shade(rgb, 0.68),
  };
}

/** Inline `style` object that overrides the accent tokens for a whole subtree. */
export function accentStyle(primary: string): CSSProperties {
  const p = accentPalette(primary);
  return {
    "--color-accent": p.accent,
    "--color-accent-dark": p.dark,
    "--color-accent-soft": p.soft,
    "--color-accent-ring": p.ring,
  } as CSSProperties;
}

export function formatDate(input?: string | null): string {
  if (!input) return "";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const BN_MONTHS = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
];

/** "১২ মার্চ ২০২৫" — used throughout the Bangla admin panel. */
export function formatDateBn(input?: string | null): string {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return toBanglaDigits(`${d.getDate()} ${BN_MONTHS[d.getMonth()]} ${d.getFullYear()}`);
}

/** Numbers rendered in Bangla numerals, e.g. stat tiles and table counts. */
export function bnNum(n: number | string): string {
  return toBanglaDigits(String(n));
}

/**
 * Rich-text posts are stored as HTML (from the TipTap editor); older posts may
 * be Markdown. Detects a leading block-level HTML tag so we know to render the
 * content as raw HTML instead of piping it through the Markdown renderer.
 */
export function isHtmlContent(content: string): boolean {
  return /<(?:h[1-6]|p|ul|ol|li|blockquote|img|figure|pre|hr|strong|em|a|div|table)[\s>/]/i.test(
    content,
  );
}

/**
 * Normalise anything a human types into a URL slug.
 *
 * Accepts what people actually type — "Khulna Division News", mixed case,
 * punctuation — and returns "khulna-division-news". Unlike the ASCII-only
 * `slugify` in seed-data.ts this keeps Unicode letters, so a Bangla title
 * yields a Bangla slug instead of an empty string.
 *
 * Returns "" for input with no letters or digits at all, which callers treat
 * as "fall back to the title".
 */
export function toSlug(input: string): string {
  return input
    .normalize("NFC")
    .toLowerCase()
    .replace(/['’"]/g, "")
    // \p{M} matters as much as \p{L}: Bengali vowel signs are combining marks,
    // so without it "খুলনা বিভাগ" shreds into "খ-লন-ব-ভ-গ".
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Prepare stored page copy for the rich-text editor.
 *
 * Content saved before the editor existed is plain text whose paragraphs are
 * blank lines. TipTap parses its `content` as HTML, and HTML collapses
 * whitespace — handing it the raw string turns every page into one unbroken
 * block, and the next save writes that back. Wrapping the paragraphs in real
 * <p> tags first is what makes the upgrade lossless. Content that is already
 * HTML passes straight through.
 */
export function toRichTextHtml(value: string): string {
  if (!value.trim()) return "";
  if (isHtmlContent(value)) return value;
  return value
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    // A lone newline inside a block is a soft break, not a new paragraph.
    .map((block) => `<p>${escapeHtml(block).replace(/\r?\n/g, "<br>")}</p>`)
    .join("");
}

/**
 * Whether rich-text content is effectively empty. A cleared TipTap editor still
 * posts `<p></p>`, which is truthy — without this the footer pages would render
 * a blank article instead of falling back to their default copy.
 */
export function isBlankRichText(content: string): boolean {
  if (!content.trim()) return true;
  // Media counts as content even with no text around it.
  if (/<(?:img|iframe|hr|table)[\s>/]/i.test(content)) return false;
  return (
    content
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/gi, " ")
      .trim().length === 0
  );
}

export function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Small favicon for tiny contexts (hero strip, reader bar). */
export function faviconUrl(url: string, size = 128): string {
  let host = url;
  try {
    host = new URL(url).hostname;
  } catch {
    /* keep raw */
  }
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${size}`;
}

/** Higher-quality brand logo (best available icon) for outlet cards. */
export function brandLogo(url: string): string {
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    /* keep raw */
  }
  return `https://icon.horse/icon/${host}`;
}
