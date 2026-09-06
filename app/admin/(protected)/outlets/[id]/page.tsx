import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { adminGetOutlet, adminListCategories } from "@/lib/admin-queries";
import { OutletForm } from "@/components/admin/outlet-form";
import { requireSection } from "@/lib/auth";
import { bnNum } from "@/lib/utils";
import { Badge, PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function EditOutletPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ return_to?: string }>;
}) {
  await requireSection("outlets");

  const [{ id }, { return_to }] = await Promise.all([params, searchParams]);
  const [outlet, cats] = await Promise.all([
    adminGetOutlet(id),
    adminListCategories(),
  ]);
  if (!outlet) notFound();

  const backTo = return_to?.startsWith("/admin") ? return_to : "/admin/outlets";

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={backTo}
        className="mb-3 inline-flex items-center gap-1 text-[0.8125rem] font-medium text-a-muted transition hover:text-accent"
      >
        <ChevronLeft className="h-4 w-4" /> ফিরে যান
      </Link>
      <PageHeader
        title={outlet.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={outlet.is_active ? "ok" : "muted"} dot>
              {outlet.is_active ? "সক্রিয়" : "লুকানো"}
            </Badge>
            <Badge tone="neutral">{bnNum(outlet.click_count)} বার খোলা হয়েছে</Badge>
            <a
              href={outlet.url}
              target="_blank"
              rel="noreferrer"
              dir="ltr"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              সাইটে যান <ExternalLink className="h-3 w-3" />
            </a>
          </span>
        }
      />
      <OutletForm
        outlet={outlet}
        categories={cats
          .filter((c) => c.section_type !== "division_grid")
          .map((c) => ({ slug: c.slug, title: c.title }))}
        returnTo={backTo}
      />
    </div>
  );
}
