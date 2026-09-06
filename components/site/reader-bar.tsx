import { ExternalLink } from "lucide-react";
import { faviconUrl } from "@/lib/utils";
import { ReaderBackButton } from "./reader-back-button";

/** The single slim nav bar shown above a framed outlet — the only chrome. */
export function ReaderBar({
  name,
  name_bn,
  url,
  siteName,
}: {
  name: string;
  name_bn?: string | null;
  url: string;
  /** From Settings → General, so the back button carries the live brand. */
  siteName?: string;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-3 sm:px-4">
      <ReaderBackButton siteName={siteName} />

      <div className="flex min-w-0 items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={faviconUrl(url, 64)}
          alt=""
          width={20}
          height={20}
          className="h-5 w-5 shrink-0 rounded"
        />
        <span className="truncate text-sm font-semibold text-ink">
          {name}
          {name_bn && (
            <span className="ml-1.5 font-bangla text-xs font-normal text-muted">
              {name_bn}
            </span>
          )}
        </span>
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-accent-dark"
      >
        <span className="hidden sm:inline">Open original</span>
        <ExternalLink className="h-4 w-4" />
      </a>
    </header>
  );
}
