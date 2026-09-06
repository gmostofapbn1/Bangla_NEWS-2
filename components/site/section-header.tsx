import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Home page section heading.
 *
 * Title and "View all" sit on one row at every width — on mobile the title
 * wraps and the button shrinks rather than dropping onto its own line, which
 * was pushing the newspaper tiles further down the screen.
 */
export function SectionHeader({
  kicker,
  title,
  titleBn,
  description,
  href,
  hrefLabel = "View all",
}: {
  kicker?: string;
  title: string;
  titleBn?: string | null;
  description?: string | null;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex flex-row items-center justify-between gap-3 border-b border-line pb-4 sm:pb-5">
      <div className="min-w-0 max-w-2xl">
        {kicker && (
          <div className="mb-2 flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-accent" />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              {kicker}
            </span>
          </div>
        )}
        <h2 className="font-serif text-xl font-semibold leading-tight tracking-tight text-ink sm:text-2xl">
          {title}
          {titleBn && (
            <span className="ml-2 align-middle font-bangla text-base font-normal text-muted">
              {titleBn}
            </span>
          )}
        </h2>
        {description && (
          <p className="mt-2.5 text-sm leading-relaxed text-muted">{description}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition hover:border-accent hover:text-accent sm:px-4 sm:py-2 sm:text-sm"
        >
          {hrefLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 sm:h-4 sm:w-4" />
        </Link>
      )}
    </div>
  );
}
