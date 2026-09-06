import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type DirectoryItem = {
  slug: string;
  title: string;
  title_bn?: string | null;
  href: string;
  count: number;
};

/** Clean numbered directory of every category — newspaper-directory style. */
export function CategoryDirectory({ items }: { items: DirectoryItem[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <ol className="grid sm:grid-cols-2">
        {items.map((c, i) => (
          <li key={c.slug} className="border-b border-line sm:even:border-l">
            <Link
              href={c.href}
              className="group flex items-center gap-3.5 px-4 py-3 transition-colors hover:bg-band sm:px-5"
            >
              <span className="w-6 shrink-0 text-sm font-semibold tabular-nums text-faint">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink group-hover:text-accent">
                  {c.title}
                </span>
                {c.title_bn && (
                  <span className="block truncate font-bangla text-xs text-muted">
                    {c.title_bn}
                  </span>
                )}
              </span>
              <span className="shrink-0 rounded-full bg-band px-2 py-0.5 text-xs font-medium tabular-nums text-muted group-hover:bg-accent-soft group-hover:text-accent">
                {c.count}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-faint transition group-hover:translate-x-0.5 group-hover:text-accent" />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
