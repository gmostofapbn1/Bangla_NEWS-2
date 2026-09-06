import Link from "next/link";
import { MapPin, ArrowUpRight } from "lucide-react";
import type { Category } from "@/lib/types";

/** The 8-division grid — compact directory tiles. */
export function DivisionTiles({ divisions }: { divisions: Category[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-8">
      {divisions.map((d) => {
        const accent = d.accent ?? "#c8102e";
        return (
          <Link
            key={d.slug}
            href={`/local/${d.slug}`}
            className="group relative flex items-center gap-2 overflow-hidden rounded-lg border border-line p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-16px_rgba(23,19,13,0.4)]"
            style={{
              background: `linear-gradient(150deg, ${accent}12, ${accent}04)`,
            }}
          >
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white shadow-sm"
              style={{ background: accent }}
            >
              <MapPin className="h-3.5 w-3.5" strokeWidth={2.2} />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1 text-[13px] font-semibold leading-tight text-ink">
                <span className="truncate">{d.title.replace(" Division", "")}</span>
                <ArrowUpRight className="h-3 w-3 shrink-0 text-muted transition group-hover:text-ink group-hover:translate-x-0.5" />
              </span>
              {d.title_bn && (
                <span className="block truncate font-bangla text-[10.5px] leading-tight text-muted">
                  {d.title_bn}
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
