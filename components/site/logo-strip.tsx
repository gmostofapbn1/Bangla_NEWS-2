import Link from "next/link";
import { faviconUrl } from "@/lib/utils";
import type { Outlet } from "@/lib/types";

/** A row of real brand favicons for featured outlets — adds imagery + credibility. */
export function LogoStrip({ outlets }: { outlets: Outlet[] }) {
  if (outlets.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-faint">
        Featured
      </span>
      {outlets.map((o) => (
        <Link
          key={o.id}
          href={`/read/${o.slug ?? o.id}`}
          title={o.name}
          className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface transition hover:-translate-y-0.5 hover:border-accent-ring hover:shadow-sm"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={faviconUrl(o.url, 64)}
            alt={o.name}
            width={22}
            height={22}
            loading="lazy"
            className="h-5 w-5 rounded"
          />
        </Link>
      ))}
    </div>
  );
}
