import Link from "next/link";
import Image from "next/image";
import { Newspaper } from "lucide-react";
import type { PostCard } from "@/lib/types";

/** Premium blog card — links to the full article page at /blog/[slug]. */
export function BlogCard({ post }: { post: PostCard }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-surface text-left transition-colors duration-200 hover:border-accent-ring"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-band">
        {post.cover_image ? (
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, 380px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-muted">
            <Newspaper className="h-8 w-8" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {/* No date or view count: the client wants readership figures seen
            only in the admin panel, and a visible date makes evergreen
            directory guides look stale. datePublished stays in the article's
            JSON-LD, where search engines still read it. */}
        <h3 className="font-serif text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-accent">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
            {post.excerpt}
          </p>
        )}
        <div className="mt-auto pt-4">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent">
            Read more
            <svg
              className="h-3 w-3 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
