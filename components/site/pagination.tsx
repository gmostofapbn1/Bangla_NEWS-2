import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
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
            className="grid h-9 min-w-9 place-items-center rounded-full bg-accent px-3 text-sm font-semibold text-white"
          >
            {n}
          </span>
        ) : (
          <Link
            key={n}
            href={href(n)}
            className={cn(
              "grid h-9 min-w-9 place-items-center rounded-full border border-line px-3 text-sm font-medium text-ink-soft transition",
              "hover:border-accent hover:text-accent",
            )}
          >
            {n}
          </Link>
        ),
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
