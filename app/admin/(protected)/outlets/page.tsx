import Link from "next/link";
import { Plus, Newspaper } from "lucide-react";
import { adminListOutlets, adminListCategories } from "@/lib/admin-queries";
import type { AdminOutlet } from "@/lib/admin-queries";
import { OutletGroup } from "@/components/admin/outlet-group";
import { requireSection } from "@/lib/auth";
import { hasServiceRole } from "@/lib/env";
import { bnNum } from "@/lib/utils";
import { Alert, EmptyState, PageHeader, btn } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function OutletsPage() {
  await requireSection("outlets");

  const [outlets, categories] = await Promise.all([
    adminListOutlets(),
    adminListCategories(),
  ]);

  // Group outlets by category (outlets already come sorted by sort_order asc).
  const groups = new Map<string, AdminOutlet[]>();
  for (const o of outlets) {
    const key = o.category_slug ?? "__uncategorized";
    const arr = groups.get(key) ?? [];
    arr.push(o);
    groups.set(key, arr);
  }

  // Order the groups by the category list; append any leftover keys at the end.
  const ordered = categories
    .filter((c) => c.section_type !== "division_grid" && groups.has(c.slug))
    .map((c) => ({ slug: c.slug, title: c.title, items: groups.get(c.slug)! }));
  const known = new Set(ordered.map((g) => g.slug));
  for (const [slug, items] of groups) {
    if (!known.has(slug)) {
      const title =
        categories.find((c) => c.slug === slug)?.title ??
        (slug === "__uncategorized" ? "ক্যাটাগরিবিহীন" : slug);
      ordered.push({ slug, title, items });
    }
  }

  const activeCount = outlets.filter((o) => o.is_active).length;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="ডিরেক্টরি"
        title="নিউজপেপার / সাইট"
        description={
          <>
            মোট {bnNum(outlets.length)} টি সাইট, তার মধ্যে {bnNum(activeCount)} টি সক্রিয়।
            ক্যাটাগরি অনুযায়ী সাজানো — ↑ ↓ দিয়ে একই ক্যাটাগরির ভেতরে ক্রম বদলান।
          </>
        }
        actions={
          <Link href="/admin/outlets/new" className={btn.primary}>
            <Plus className="h-4 w-4" /> নতুন সাইট
          </Link>
        }
      />

      {!hasServiceRole() ? (
        <Alert tone="warn" title="Supabase যুক্ত করুন">
          সাইট পরিচালনা করতে <code>SUPABASE_SERVICE_ROLE_KEY</code> সেট করুন। পাবলিক সাইটটি
          এখন বান্ডিল করা ডেটা দিয়ে চলছে।
        </Alert>
      ) : outlets.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="এখনো কোনো সাইট যোগ করা হয়নি"
          description="supabase/seed.sql চালিয়ে শুরু করুন, অথবা নিচের বোতাম থেকে প্রথম সাইটটি যোগ করুন।"
          action={
            <Link href="/admin/outlets/new" className={btn.primary}>
              <Plus className="h-4 w-4" /> নতুন সাইট
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {ordered.map((group) => (
            <OutletGroup
              key={group.slug}
              slug={group.slug}
              title={group.title}
              items={group.items}
            />
          ))}
        </div>
      )}
    </div>
  );
}
