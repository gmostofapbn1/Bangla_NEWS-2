import Link from "next/link";
import Image from "next/image";
import { Newspaper, Eye, Clock, Flame, FolderOpen } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { PostCard } from "@/lib/types";
import type { CategoryCount } from "@/lib/queries";

/**
 * Right-hand column for the blog: Popular posts (by click count), Recent posts,
 * and the directory categories with their outlet counts. Presentational only —
 * the page fetches the data and passes it in.
 */
export function BlogSidebar({
  popular,
  recent,
  categories,
}: {
  popular: PostCard[];
  recent: PostCard[];
  categories: CategoryCount[];
}) {
  return (
    <aside className="space-y-6">
      {popular.length > 0 && (
        <Widget title="Popular Posts" titleBn="জনপ্রিয় পোস্ট" icon={Flame}>
          <ul className="divide-y divide-line">
            {popular.map((p) => (
              <PostRow key={p.id} post={p} showViews />
            ))}
          </ul>
        </Widget>
      )}

      {recent.length > 0 && (
        <Widget title="Recent Posts" titleBn="সাম্প্রতিক পোস্ট" icon={Clock}>
          <ul className="divide-y divide-line">
            {recent.map((p) => (
              <PostRow key={p.id} post={p} />
            ))}
          </ul>
        </Widget>
      )}

      {categories.length > 0 && (
        <Widget title="Categories" titleBn="ক্যাটাগরি" icon={FolderOpen}>
          <ul className="divide-y divide-line">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/category/${c.slug}`}
                  className="group flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-band"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink-soft group-hover:text-accent">
                      {c.title}
                    </span>
                    {c.title_bn && (
                      <span className="block truncate font-bangla text-xs text-muted">
                        {c.title_bn}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 rounded-full bg-band px-2 py-0.5 text-xs font-semibold text-muted group-hover:bg-accent-soft group-hover:text-accent">
                    {c.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Widget>
      )}
    </aside>
  );
}

function Widget({
  title,
  titleBn,
  icon: Icon,
  children,
}: {
  title: string;
  titleBn?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface">
      <header className="flex items-center gap-2 border-b border-line bg-band/60 px-4 py-3">
        <Icon className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-ink">
          {title}
          {titleBn && (
            <span className="ml-1.5 font-bangla text-xs font-normal text-muted">
              {titleBn}
            </span>
          )}
        </h2>
      </header>
      {children}
    </section>
  );
}

function PostRow({ post, showViews }: { post: PostCard; showViews?: boolean }) {
  return (
    <li>
      <Link
        href={`/blog/${post.slug}`}
        className="group flex gap-3 px-4 py-3 transition-colors hover:bg-band"
      >
        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-line bg-band">
          {post.cover_image ? (
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-muted">
              <Newspaper className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink transition-colors group-hover:text-accent">
            {post.title}
          </p>
          <p className="mt-1 flex items-center gap-2 text-[11px] text-faint">
            <span>{formatDate(post.published_at ?? post.created_at)}</span>
            {showViews && (post.click_count ?? 0) > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Eye className="h-3 w-3" />
                {post.click_count}
              </span>
            )}
          </p>
        </div>
      </Link>
    </li>
  );
}
