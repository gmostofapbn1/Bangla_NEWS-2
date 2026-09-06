import Link from "next/link";
import { MapPinned, Plus, Pencil } from "lucide-react";
import { adminListCategories, adminListOutletsByCategories } from "@/lib/admin-queries";
import { OutletGroup } from "@/components/admin/outlet-group";
import { requireSection } from "@/lib/auth";
import { hasServiceRole } from "@/lib/env";
import { bnNum } from "@/lib/utils";
import { Alert, Card, EmptyState, PageHeader, btn } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const RETURN_TO = "/admin/divisions";

/**
 * বিভাগীয় পত্রিকা — the eight divisions are categories parented to
 * "local-newspaper". This is a focused view of the same outlet rows the main
 * list holds, grouped one division per block so regional papers are managed
 * without scrolling past every national daily.
 */
export default async function DivisionsPage() {
  await requireSection("divisions");

  const categories = await adminListCategories();
  const divisions = categories
    .filter((c) => c.parent_slug === "local-newspaper")
    .sort((a, b) => a.sort_order - b.sort_order);

  // Fetch only the divisional outlets rather than the whole table.
  const byCategory = await adminListOutletsByCategories(divisions.map((d) => d.slug));

  const total = divisions.reduce(
    (sum, d) => sum + (byCategory[d.slug]?.length ?? 0),
    0,
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="ডিরেক্টরি"
        title="বিভাগীয় পত্রিকা"
        description={
          <>
            বাংলাদেশের {bnNum(divisions.length)} টি বিভাগের আঞ্চলিক পত্রিকা — মোট{" "}
            {bnNum(total)} টি। প্রতিটি বিভাগ আসলে একটি ক্যাটাগরি, তাই এখানকার পরিবর্তন
            “নিউজপেপার / সাইট” তালিকাতেও দেখা যাবে।
          </>
        }
        actions={
          <Link href="/admin/categories/new" className={btn.secondary}>
            <Plus className="h-4 w-4" /> নতুন বিভাগ
          </Link>
        }
      />

      {!hasServiceRole() ? (
        <Alert tone="warn" title="Supabase যুক্ত করুন">
          বিভাগীয় পত্রিকা পরিচালনা করতে Supabase সংযোগ প্রয়োজন।
        </Alert>
      ) : divisions.length === 0 ? (
        <EmptyState
          icon={MapPinned}
          title="কোনো বিভাগ পাওয়া যায়নি"
          description="বিভাগ তৈরি করতে একটি ক্যাটাগরি বানিয়ে তার প্যারেন্ট slug হিসেবে local-newspaper দিন।"
          action={
            <Link href="/admin/categories/new" className={btn.primary}>
              <Plus className="h-4 w-4" /> নতুন বিভাগ
            </Link>
          }
        />
      ) : (
        <>
          {/* Division overview strip */}
          <Card className="mb-6" padded={false}>
            <div className="grid grid-cols-2 divide-x divide-y divide-a-line-soft sm:grid-cols-4">
              {divisions.map((d) => {
                const count = byCategory[d.slug]?.length ?? 0;
                return (
                  <Link
                    key={d.slug}
                    href={`#${d.slug}`}
                    className="group flex items-center gap-2.5 p-3.5 transition hover:bg-a-sunken"
                  >
                    <span
                      className="h-8 w-1.5 shrink-0 rounded-full"
                      style={{ background: d.accent || "var(--color-accent)" }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[0.8125rem] font-semibold text-a-ink">
                        {d.title_bn || d.title}
                      </span>
                      <span className="block text-xs text-a-faint">
                        {bnNum(count)} টি পত্রিকা
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </Card>

          <div className="space-y-6">
            {divisions.map((d) => (
              <div key={d.slug} id={d.slug} className="scroll-mt-20">
                <OutletGroup
                  slug={d.slug}
                  title={d.title_bn || d.title}
                  subtitle={d.title_bn ? d.title : null}
                  items={byCategory[d.slug] ?? []}
                  returnTo={RETURN_TO}
                  emptyHint="এই বিভাগে এখনো কোনো পত্রিকা যোগ করা হয়নি।"
                />
                <div className="mt-2 px-0.5">
                  <Link
                    href={`/admin/categories/${d.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-a-faint transition hover:text-accent"
                  >
                    <Pencil className="h-3 w-3" /> বিভাগের সেটিং সম্পাদনা করুন
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
