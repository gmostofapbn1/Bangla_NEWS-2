import Link from "next/link";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/site-config";

/**
 * Site wordmark. Renders the logo uploaded in Settings → General when there is
 * one, and otherwise falls back to the built-in peak mark plus the site name,
 * so the header never looks broken before the client uploads anything.
 */
export function Logo({
  className,
  compact = false,
  src,
  name = SITE.name,
}: {
  className?: string;
  compact?: boolean;
  src?: string | null;
  name?: string;
}) {
  if (src) {
    return (
      <Link
        href="/"
        aria-label={`${name} home`}
        className={cn("group inline-flex items-center", className)}
      >
        {/* Uploaded logos are arbitrary sizes; cap the height and let the width
            follow so a 180×50 or a square mark both sit correctly. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name}
          className="h-9 w-auto max-w-[190px] object-contain transition-transform duration-300 group-hover:-translate-y-0.5"
        />
      </Link>
    );
  }

  // Split the name so the tail can carry the accent, as the original mark did.
  const words = name.trim().split(/\s+/);
  const head = words.length > 1 ? words.slice(0, -1).join(" ") + " " : name;
  const tail = words.length > 1 ? words[words.length - 1] : "";

  return (
    <Link
      href="/"
      aria-label={`${name} home`}
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-accent shadow-sm ring-1 ring-accent-dark/30 transition-transform duration-300 group-hover:-translate-y-0.5">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            d="M4 17.5 12 5l8 12.5H4Z"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M9.2 17.5 12 12.9l2.8 4.6" fill="#fff" opacity="0.9" />
        </svg>
      </span>
      {!compact && (
        <span className="font-serif text-[1.15rem] font-semibold leading-none tracking-tight text-ink">
          {head}
          {tail && <span className="text-accent">{tail}</span>}
        </span>
      )}
    </Link>
  );
}
