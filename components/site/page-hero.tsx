import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

/**
 * Page header for category, division, blog and content pages.
 *
 * Matches `SectionHeader` (the home page section titles) exactly, so a heading
 * is the same size wherever it appears. There is no kicker: an eyebrow label
 * above the title ("Journal", "Legal", "Digital Editions") restated the page
 * name in smaller type and cost a line above the fold on every page.
 */
export function PageHero({
  breadcrumb,
  title,
  titleBn,
  description,
  narrow = false,
}: {
  breadcrumb?: Crumb[];
  title: string;
  titleBn?: string | null;
  description?: string | null;
  /** Match a narrower body column so the heading is not stranded far left. */
  narrow?: boolean;
}) {
  return (
    <section className="border-b border-line bg-surface">
      <div className={`mx-auto ${narrow ? "max-w-3xl" : "max-w-7xl"} px-4 py-6 sm:px-6 sm:py-7 lg:px-8`}>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-3">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
              {breadcrumb.map((c, i) => (
                <li key={i} className="flex items-center gap-1">
                  {c.href ? (
                    <Link href={c.href} className="hover:text-accent">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="text-ink-soft">{c.label}</span>
                  )}
                  {i < breadcrumb.length - 1 && (
                    <ChevronRight className="h-3.5 w-3.5 text-faint" />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <h1 className="font-serif text-xl font-semibold leading-tight tracking-tight text-ink sm:text-2xl">
          {title}
          {titleBn && (
            <span className="ml-2 align-middle font-bangla text-base font-normal text-muted">
              {titleBn}
            </span>
          )}
        </h1>

        {description && (
          <p className="mt-2.5 text-sm leading-relaxed text-muted">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
