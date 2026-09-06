import Link from "next/link";
import { Plus, Pencil, ExternalLink, Star } from "lucide-react";
import type { AdminOutlet } from "@/lib/admin-queries";
import { deleteOutlet, moveOutlet } from "@/lib/actions/admin";
import { DeleteButton } from "@/components/admin/delete-button";
import { ReorderCell } from "@/components/admin/reorder";
import { bnNum, hostname } from "@/lib/utils";
import { Badge, Card, TableShell, Td, Th, Tr } from "@/components/admin/ui";

/**
 * One category's outlets as an ordered table. Shared by the full outlet list,
 * the divisional section and the international section — all three manage the
 * same rows, so they get the same controls and the same server actions.
 *
 * `returnTo` is posted with every action so editing an outlet from, say, the
 * divisional page comes back to the divisional page.
 */
export function OutletGroup({
  slug,
  title,
  subtitle,
  items,
  returnTo = "/admin/outlets",
  emptyHint,
  headingLevel = "h2",
}: {
  slug: string;
  title: string;
  subtitle?: string | null;
  items: AdminOutlet[];
  returnTo?: string;
  emptyHint?: string;
  headingLevel?: "h2" | "h3";
}) {
  const canAdd = slug !== "__uncategorized";
  const Heading = headingLevel;

  return (
    <section>
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 px-0.5">
        <Heading className="flex items-center gap-2 text-[0.9375rem] font-bold text-a-ink">
          {title}
          {subtitle && <span className="font-normal text-a-faint">{subtitle}</span>}
          <Badge tone="muted">{bnNum(items.length)}</Badge>
        </Heading>
        {canAdd && (
          <Link
            href={`/admin/outlets/new?category=${slug}&return_to=${encodeURIComponent(returnTo)}`}
            className="inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-accent transition hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> এখানে যোগ করুন
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="py-8 text-center">
          <p className="text-sm text-a-muted">{emptyHint ?? "এই ক্যাটাগরিতে এখনো কিছু নেই।"}</p>
        </Card>
      ) : (
        <TableShell>
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr>
                <Th align="center" className="w-14">ক্রম</Th>
                <Th align="left">নাম</Th>
                <Th align="left" className="w-40">অবস্থা</Th>
                <Th align="right" className="w-20">ক্লিক</Th>
                <Th align="right" className="w-44">অ্যাকশন</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((o, i) => (
                <Tr key={o.id}>
                  <Td align="center">
                    <ReorderCell
                      action={moveOutlet}
                      hidden={{ id: o.id }}
                      first={i === 0}
                      last={i === items.length - 1}
                      returnTo={returnTo}
                    />
                  </Td>
                  <Td>
                    <p className="font-semibold text-a-ink">{o.name}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-a-faint">
                      {o.name_bn && <span className="text-a-muted">{o.name_bn}</span>}
                      <span dir="ltr">{hostname(o.url)}</span>
                    </p>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone={o.is_active ? "ok" : "muted"} dot>
                        {o.is_active ? "সক্রিয়" : "লুকানো"}
                      </Badge>
                      {o.is_featured && (
                        <Badge tone="accent">
                          <Star className="h-3 w-3 fill-current" /> টপ
                        </Badge>
                      )}
                      {o.open_external && <Badge tone="info">সরাসরি</Badge>}
                    </div>
                  </Td>
                  <Td align="right" className="font-semibold text-a-ink">
                    {bnNum(o.click_count)}
                  </Td>
                  <Td align="right">
                    <div className="admin-row-actions flex items-center justify-end gap-0.5">
                      <a
                        href={o.url}
                        target="_blank"
                        rel="noreferrer"
                        title="সাইটে যান"
                        className="grid h-8 w-8 place-items-center rounded-[9px] text-a-faint transition hover:bg-a-sunken hover:text-a-ink"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <Link
                        href={`/admin/outlets/${o.id}?return_to=${encodeURIComponent(returnTo)}`}
                        className="inline-flex items-center gap-1.5 rounded-[9px] px-2.5 py-1.5 text-xs font-semibold text-a-ink-soft transition hover:bg-a-sunken"
                      >
                        <Pencil className="h-3.5 w-3.5" /> সম্পাদনা
                      </Link>
                      <DeleteButton
                        action={deleteOutlet}
                        hidden={{ id: o.id, return_to: returnTo }}
                        confirmText={`“${o.name}” মুছে ফেলবেন?`}
                      />
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}
    </section>
  );
}
