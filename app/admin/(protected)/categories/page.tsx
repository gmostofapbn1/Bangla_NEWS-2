import Link from "next/link";
import { Plus, Pencil, FolderTree, Home, LayoutGrid, MapPinned } from "lucide-react";
import { adminListCategories, adminOutletCounts } from "@/lib/admin-queries";
import { deleteCategory, moveCategory } from "@/lib/actions/admin";
import { DeleteButton } from "@/components/admin/delete-button";
import { ReorderCell } from "@/components/admin/reorder";
import { requireSection } from "@/lib/auth";
import { hasServiceRole } from "@/lib/env";
import { GROUPS } from "@/lib/site-config";
import { bnNum } from "@/lib/utils";
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

export default async function CategoriesPage() {
  await requireSection("categories");

  const [categories, counts] = await Promise.all([
    adminListCategories(),
    adminOutletCounts(),
  ]);

  const topLevel = categories.filter((c) => !c.parent_slug);
  const orderIndex = new Map(topLevel.map((c, i) => [c.slug, i]));
  const homeCount = categories.filter((c) => c.home).length;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="ডিরেক্টরি"
        title="ক্যাটাগরি"
        description={
          <>
            মোট {bnNum(categories.length)} টি ক্যাটাগরি, {bnNum(homeCount)} টি হোমপেজে দেখানো
            হচ্ছে। ↑ ↓ দিয়ে হোমপেজে কোনটি আগে আসবে তা ঠিক করুন।
          </>
        }
        actions={
          <Link href="/admin/categories/new" className={btn.primary}>
            <Plus className="h-4 w-4" /> নতুন ক্যাটাগরি
          </Link>
        }
      />

      {!hasServiceRole() ? (
        <Alert tone="warn" title="Supabase যুক্ত করুন">
          ক্যাটাগরি পরিচালনা করতে Supabase সংযোগ প্রয়োজন।
        </Alert>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="কোনো ক্যাটাগরি নেই"
          description="ডিরেক্টরির প্রথম সেকশনটি তৈরি করুন।"
          action={
            <Link href="/admin/categories/new" className={btn.primary}>
              <Plus className="h-4 w-4" /> নতুন ক্যাটাগরি
            </Link>
          }
        />
      ) : (
        <TableShell>
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr>
                <Th align="center" className="w-20">ক্রম</Th>
                <Th align="left">শিরোনাম</Th>
                <Th align="left" className="w-52">গ্রুপ</Th>
                <Th align="center" className="w-24">সাইট</Th>
                <Th align="left" className="w-32">হোমপেজ</Th>
                <Th align="right" className="w-40">অ্যাকশন</Th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => {
                const pos = orderIndex.get(c.slug);
                const isTop = pos !== undefined;
                const isDivision = c.section_type === "division_grid";
                return (
                  <Tr key={c.slug}>
                    <Td align="center">
                      {isTop ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="w-5 text-xs font-bold text-a-faint">
                            {bnNum(pos + 1)}
                          </span>
                          <ReorderCell
                            action={moveCategory}
                            hidden={{ slug: c.slug }}
                            first={pos === 0}
                            last={pos === topLevel.length - 1}
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-a-faint">—</span>
                      )}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] text-white"
                          style={{ background: c.accent || "var(--color-a-faint)" }}
                        >
                          {isDivision ? (
                            <MapPinned className="h-3.5 w-3.5" />
                          ) : (
                            <LayoutGrid className="h-3.5 w-3.5" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-a-ink">
                            {c.title}
                          </span>
                          <span className="block truncate text-xs text-a-faint" dir="ltr">
                            /{c.slug}
                            {c.parent_slug ? ` · ${c.parent_slug}` : ""}
                          </span>
                        </span>
                      </div>
                    </Td>
                    <Td className="text-a-muted">{GROUPS[c.group] ?? c.group}</Td>
                    <Td align="center" className="font-semibold text-a-ink">
                      {bnNum(counts[c.slug] ?? 0)}
                    </Td>
                    <Td>
                      {c.home ? (
                        <Badge tone="ok">
                          <Home className="h-3 w-3" /> দেখানো হচ্ছে
                        </Badge>
                      ) : (
                        <span className="text-xs text-a-faint">—</span>
                      )}
                    </Td>
                    <Td align="right">
                      <div className="admin-row-actions flex items-center justify-end gap-0.5">
                        <Link
                          href={`/admin/categories/${c.slug}`}
                          className="inline-flex items-center gap-1.5 rounded-[9px] px-2.5 py-1.5 text-xs font-semibold text-a-ink-soft transition hover:bg-a-sunken"
                        >
                          <Pencil className="h-3.5 w-3.5" /> সম্পাদনা
                        </Link>
                        <DeleteButton
                          action={deleteCategory}
                          hidden={{ slug: c.slug }}
                          confirmText={`“${c.title}” মুছে ফেলবেন? এই ক্যাটাগরির ${bnNum(
                            counts[c.slug] ?? 0,
                          )} টি সাইটও একসাথে মুছে যাবে।`}
                        />
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>
      )}
    </div>
  );
}
