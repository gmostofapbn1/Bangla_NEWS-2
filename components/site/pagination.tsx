import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** How many consecutive page numbers the bar shows at once. */
const WINDOW = 6;

/**
 * Page links for a paginated list.
 *
 * Real <Link>s rather than buttons, so every page is a crawlable URL and the
 * list still works without JavaScript. Page 1 is the bare path — no `?page=1`
 * duplicate for search engines to index alongside it.
 */
export function Pagination({
  basePath,
  page,
  totalPages,
}: {
  basePath: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const href = (n: number) => (n <= 1 ? basePath : `${basePath}?page=${n}`);

  // A fixed window of WINDOW pages that starts at the current one, then the
  // last page: 1 2 3 4 5 6 … 14 on page 1, 6 7 8 9 10 11 … 14 on page 6.
  // Listing every page grew the bar past the screen once the blog reached 14
  // pages. Near the end the window is pulled back rather than shrinking, so
  // page 12 of 14 still shows six numbers (9–14) instead of three.
  const start = Math.max(1, Math.min(page, totalPages - WINDOW + 1));
  const end = Math.min(totalPages, start + WINDOW - 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const showLast = end < totalPages;
  const gapBeforeLast = end < totalPages - 1;

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex flex-wrap items-center justify-center gap-1 sm:gap-1.5"
    >
      {page > 1 && (
        <Link
          href={href(page - 1)}
          rel="prev"
          aria-label="Previous page"
          className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition hover:border-accent hover:text-accent"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}

      {pages.map((n) =>
        n === page ? (
          <span
            key={n}
            aria-current="page"
            className="grid h-8 min-w-8 place-items-center rounded-full bg-accent px-2.5 text-sm font-semibold text-white sm:h-9 sm:min-w-9 sm:px-3"
          >
            {n}
          </span>
        ) : (
          <PageLink key={n} href={href(n)} n={n} />
        ),
      )}

      {showLast && (
        <>
          {gapBeforeLast && (
            <span aria-hidden="true" className="px-1 text-sm text-faint">
              …
            </span>
          )}
          <PageLink href={href(totalPages)} n={totalPages} label={`Last page, ${totalPages}`} />
        </>
      )}

      {page < totalPages && (
        <Link
          href={href(page + 1)}
          rel="next"
          aria-label="Next page"
          className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition hover:border-accent hover:text-accent"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}

function PageLink({ href, n, label }: { href: string; n: number; label?: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "grid h-8 min-w-8 place-items-center rounded-full border border-line px-2.5 text-sm font-medium text-ink-soft transition sm:h-9 sm:min-w-9 sm:px-3",
        "hover:border-accent hover:text-accent",
      )}
    >
      {n}
    </Link>
  );
}
