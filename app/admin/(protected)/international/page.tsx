import Link from "next/link";
import { Globe2, Plus, Pencil, ExternalLink } from "lucide-react";
import { adminListCategories, adminListOutletsByCategory } from "@/lib/admin-queries";
import { categoryForGroup } from "@/lib/category-roles";
import { OutletGroup } from "@/components/admin/outlet-group";
import { requireSection } from "@/lib/auth";
import { hasServiceRole } from "@/lib/env";
import { bnNum } from "@/lib/utils";
import { Alert, Card, CardHeader, EmptyState, PageHeader, btn } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const RETURN_TO = "/admin/international";

/**
 * International Newspaper — a dedicated section for one category, because the
 * client manages it as its own workstream rather than as another row in the
 * long category list.
 */
export default async function InternationalPage() {
  await requireSection("international");

  // Found by group, not slug: the client renames slugs for SEO, and this page
  // went blank the last time a hardcoded one stopped matching.
  const category = categoryForGroup(await adminListCategories(), "international") ?? null;
  const slug = category?.slug ?? "";

  const outlets = category ? await adminListOutletsByCategory(slug) : [];
  const active = outlets.filter((o) => o.is_active).length;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="ডিরেক্টরি"
        title="International Newspaper"
        description={
          <>
            আন্তর্জাতিক সংবাদপত্র ও গ্লোবাল নিউজ সোর্স — মোট {bnNum(outlets.length)} টি,{" "}
            {bnNum(active)} টি সক্রিয়।
          </>
        }
        actions={
          <Link
            href={`/admin/outlets/new?category=${slug}&return_to=${encodeURIComponent(RETURN_TO)}`}
            className={btn.primary}
          >
            <Plus className="h-4 w-4" /> নতুন সংবাদপত্র
          </Link>
        }
      />

      {!hasServiceRole() ? (
        <Alert tone="warn" title="Supabase যুক্ত করুন">
          এই সেকশনটি ব্যবহার করতে Supabase সংযোগ প্রয়োজন।
        </Alert>
      ) : !category ? (
        <EmptyState
          icon={Globe2}
          title="ক্যাটাগরিটি এখনো তৈরি হয়নি"
          description={
            <>
              গ্রুপ <code dir="ltr">international</code> এর কোনো ক্যাটাগরি পাওয়া যায়নি।
              একটি ক্যাটাগরি তৈরি করে তার গ্রুপ &ldquo;International Newspapers&rdquo; দিন
              — slug যা খুশি রাখতে পারেন।
            </>
          }
          action={
            <Link href="/admin/categories/new" className={btn.primary}>
              <Plus className="h-4 w-4" /> ক্যাটাগরি তৈরি করুন
            </Link>
          }
        />
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader
              title={category.title}
              description={
                category.description ??
                "এই ক্যাটাগরিতে যোগ করা সাইটগুলো হেডারের “International Newspaper” মেনুতে দেখা যাবে।"
              }
              icon={Globe2}
              actions={
                <div className="flex items-center gap-2">
                  <a
                    href={`/category/${slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-a-muted transition hover:text-accent"
                  >
                    সাইটে দেখুন <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <Link
                    href={`/admin/categories/${slug}`}
                    className="inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-accent transition hover:underline"
                  >
                    <Pencil className="h-3.5 w-3.5" /> সেটিং
                  </Link>
                </div>
              }
            />
          </Card>

          <OutletGroup
            slug={slug}
            title="সংবাদপত্রের তালিকা"
            items={outlets}
            returnTo={RETURN_TO}
            emptyHint="এখনো কোনো আন্তর্জাতিক সংবাদপত্র যোগ করা হয়নি। উপরের বোতাম দিয়ে শুরু করুন।"
          />
        </>
      )}
    </div>
  );
}
