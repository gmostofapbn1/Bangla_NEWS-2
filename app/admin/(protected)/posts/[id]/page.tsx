import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { adminGetPost } from "@/lib/admin-queries";
import { PostForm } from "@/components/admin/post-form";
import { requireSection } from "@/lib/auth";
import { bnNum, formatDateBn } from "@/lib/utils";
import { Badge, PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSection("posts");

  const { id } = await params;
  const post = await adminGetPost(id);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/posts"
        className="mb-3 inline-flex items-center gap-1 text-[0.8125rem] font-medium text-a-muted transition hover:text-accent"
      >
        <ChevronLeft className="h-4 w-4" /> ব্লগ পোস্ট
      </Link>
      <PageHeader
        title={post.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={post.published ? "ok" : "muted"} dot>
              {post.published ? "প্রকাশিত" : "খসড়া"}
            </Badge>
            <Badge tone="neutral">{bnNum(post.click_count ?? 0)} ভিউ</Badge>
            <span className="text-xs text-a-faint">{formatDateBn(post.created_at)}</span>
            {post.published && (
              <a
                href={`/blog/${post.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                সাইটে দেখুন <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </span>
        }
      />
      <PostForm post={post} />
    </div>
  );
}
