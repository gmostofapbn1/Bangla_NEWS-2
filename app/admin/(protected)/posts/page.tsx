import Link from "next/link";
import { Plus, Pencil, ExternalLink, Star, FileText, Eye } from "lucide-react";
import { adminListPosts } from "@/lib/admin-queries";
import { deletePost, movePost, togglePostFeatured } from "@/lib/actions/admin";
import { DeleteButton } from "@/components/admin/delete-button";
import { ReorderCell } from "@/components/admin/reorder";
import { requireSection } from "@/lib/auth";
import { hasServiceRole } from "@/lib/env";
import { bnNum, formatDateBn } from "@/lib/utils";
import {
  Alert,
  Badge,
  EmptyState,
  PageHeader,
  TableShell,
  Td,
  Th,
  Tr,
  btn,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  await requireSection("posts");
  const posts = await adminListPosts();
  const published = posts.filter((p) => p.published).length;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="কনটেন্ট"
        title="ব্লগ পোস্ট"
        description={
          <>
            মোট {bnNum(posts.length)} টি পোস্ট, {bnNum(published)} টি প্রকাশিত। ★ চাপলে পোস্টটি
            হোমপেজে দেখানো হবে, আর ↑ ↓ দিয়ে হোমপেজে দেখানোর ক্রম ঠিক করা যায়।
          </>
        }
        actions={
          <Link href="/admin/posts/new" className={btn.primary}>
            <Plus className="h-4 w-4" /> নতুন পোস্ট
          </Link>
        }
      />

      {!hasServiceRole() ? (
        <Alert tone="warn" title="Supabase যুক্ত করুন">
          পোস্ট লিখতে এবং প্রকাশ করতে Supabase সংযোগ প্রয়োজন।
        </Alert>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="এখনো কোনো পোস্ট নেই"
          description="প্রথম আর্টিকেলটি লিখে ফেলুন — টুলবার দিয়ে হেডিং, ছবি, লিস্ট সবই যোগ করা যাবে।"
          action={
            <Link href="/admin/posts/new" className={btn.primary}>
              <Plus className="h-4 w-4" /> নতুন পোস্ট
            </Link>
          }
        />
      ) : (
        <TableShell>
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr>
                <Th align="center" className="w-14">ক্রম</Th>
                <Th align="center" className="w-14">ফিচার</Th>
                <Th align="left">শিরোনাম</Th>
                <Th align="left" className="w-32">অবস্থা</Th>
                <Th align="right" className="w-20">ভিউ</Th>
                <Th align="right" className="w-40">অ্যাকশন</Th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p, i) => (
                <Tr key={p.id}>
                  <Td align="center">
                    <ReorderCell
                      action={movePost}
                      hidden={{ id: p.id }}
                      first={i === 0}
                      last={i === posts.length - 1}
                    />
                  </Td>
                  <Td align="center">
                    <form action={togglePostFeatured}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="next" value={p.featured ? "false" : "true"} />
                      <button
                        type="submit"
                        title={
                          p.featured
                            ? "হোমপেজে দেখানো হচ্ছে — সরাতে ক্লিক করুন"
                            : "হোমপেজে দেখান"
                        }
                        aria-pressed={!!p.featured}
                        className={`grid h-8 w-8 place-items-center rounded-[9px] transition ${
                          p.featured
                            ? "bg-accent-soft text-accent"
                            : "text-a-faint hover:bg-a-sunken hover:text-a-ink"
                        }`}
                      >
                        <Star className={`h-4 w-4 ${p.featured ? "fill-current" : ""}`} />
                      </button>
                    </form>
                  </Td>
                  <Td>
                    <p className="font-semibold text-a-ink">{p.title}</p>
                    <p className="mt-0.5 text-xs text-a-faint">
                      <span dir="ltr">/{p.slug}</span> · {formatDateBn(p.created_at)}
                    </p>
                  </Td>
                  <Td>
                    <Badge tone={p.published ? "ok" : "muted"} dot>
                      {p.published ? "প্রকাশিত" : "খসড়া"}
                    </Badge>
                  </Td>
                  <Td align="right" className="font-semibold text-a-ink">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5 text-a-faint" />
                      {bnNum(p.click_count ?? 0)}
                    </span>
                  </Td>
                  <Td align="right">
                    <div className="admin-row-actions flex items-center justify-end gap-0.5">
                      {p.published && (
                        <a
                          href={`/blog/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          title="সাইটে দেখুন"
                          className="grid h-8 w-8 place-items-center rounded-[9px] text-a-faint transition hover:bg-a-sunken hover:text-a-ink"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <Link
                        href={`/admin/posts/${p.id}`}
                        className="inline-flex items-center gap-1.5 rounded-[9px] px-2.5 py-1.5 text-xs font-semibold text-a-ink-soft transition hover:bg-a-sunken"
                      >
                        <Pencil className="h-3.5 w-3.5" /> সম্পাদনা
                      </Link>
                      <DeleteButton
                        action={deletePost}
                        hidden={{ id: p.id }}
                        confirmText={`“${p.title}” মুছে ফেলবেন?`}
                      />
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}
    </div>
  );
}
