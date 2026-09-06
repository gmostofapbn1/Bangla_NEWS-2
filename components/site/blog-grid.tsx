import { Newspaper } from "lucide-react";
import { BlogCard } from "@/components/site/blog-card";
import type { PostCard } from "@/lib/types";

/** Grid of blog cards. Each card links to its full article page. */
export function BlogGrid({ posts }: { posts: PostCard[] }) {
  if (posts.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-band">
          <Newspaper className="h-6 w-6 text-muted" />
        </div>
        <h2 className="font-serif text-xl font-semibold text-ink">No posts yet</h2>
        <p className="mt-2 text-sm text-muted">
          Articles published from the admin panel will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <BlogCard key={post.id} post={post} />
      ))}
    </div>
  );
}
