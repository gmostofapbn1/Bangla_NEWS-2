import { Check, X, ExternalLink, Inbox, Mail, Phone, CalendarDays } from "lucide-react";
import { adminListSubmissions, adminListCategories } from "@/lib/admin-queries";
import { approveSubmission, rejectSubmission, deleteSubmission } from "@/lib/actions/admin";
import { DeleteButton } from "@/components/admin/delete-button";
import { requireSection } from "@/lib/auth";
import { hasServiceRole } from "@/lib/env";
import { bnNum, formatDateBn, hostname } from "@/lib/utils";
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  PageHeader,
  TableShell,
  Td,
  Th,
  Tr,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  await requireSection("submissions");

  const [subs, cats] = await Promise.all([
    adminListSubmissions(),
    adminListCategories(),
  ]);
  const catOptions = cats.filter((c) => c.section_type !== "division_grid");
  const pending = subs.filter((s) => s.status === "pending");
  const handled = subs.filter((s) => s.status !== "pending");

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="কনটেন্ট"
        title="সাইট সাবমিশন"
        description={
          <>
            {bnNum(pending.length)} টি অপেক্ষমাণ, {bnNum(handled.length)} টি রিভিউ হয়ে গেছে।
            অনুমোদন করলে সাইটটি নির্বাচিত ক্যাটাগরিতে যুক্ত হয়ে সাথে সাথেই লাইভ হবে।
          </>
        }
      />

      {!hasServiceRole() ? (
        <Alert tone="warn" title="Supabase যুক্ত করুন">
          সাবমিশন গ্রহণ ও মডারেশনের জন্য Supabase সংযোগ প্রয়োজন।
        </Alert>
      ) : pending.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="রিভিউর অপেক্ষায় কিছু নেই"
          description="পাঠকেরা “Submit your site” ফর্ম দিয়ে নতুন সাইট পাঠালে সেগুলো এখানে দেখা যাবে।"
        />
      ) : (
        <div className="space-y-3">
          {pending.map((s) => (
            <Card key={s.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                {s.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.logo_url}
                    alt=""
                    className="h-[52px] w-[120px] shrink-0 rounded-[var(--radius-a-sm)] border border-a-line bg-a-sunken object-contain"
                  />
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[0.9375rem] font-bold text-a-ink">{s.outlet_name}</h2>
                    {s.category_suggestion && (
                      <Badge tone="info">প্রস্তাবিত: {s.category_suggestion}</Badge>
                    )}
                  </div>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    dir="ltr"
                    className="mt-1 inline-flex items-center gap-1 text-[0.8125rem] font-medium text-accent hover:underline"
                  >
                    {hostname(s.url)} <ExternalLink className="h-3 w-3" />
                  </a>
                  {s.notes && (
                    <p className="mt-2.5 rounded-[var(--radius-a-sm)] bg-a-sunken px-3 py-2 text-[0.8125rem] leading-relaxed text-a-ink-soft">
                      {s.notes}
                    </p>
                  )}
                  <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-a-faint">
                    {s.submitter_email && (
                      <span className="inline-flex items-center gap-1" dir="ltr">
                        <Mail className="h-3.5 w-3.5" /> {s.submitter_email}
                      </span>
                    )}
                    {s.submitter_phone && (
                      <a
                        href={`tel:${s.submitter_phone.replace(/[^\d+]/g, "")}`}
                        className="inline-flex items-center gap-1 hover:text-accent"
                        dir="ltr"
                      >
                        <Phone className="h-3.5 w-3.5" /> {s.submitter_phone}
                      </a>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" /> {formatDateBn(s.created_at)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-a-line-soft pt-4">
                <form action={approveSubmission} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={s.id} />
                  <select
                    name="category_slug"
                    required
                    defaultValue=""
                    aria-label="ক্যাটাগরি বাছুন"
                    className="admin-input w-auto min-w-[220px] py-2"
                  >
                    <option value="" disabled>
                      কোন ক্যাটাগরিতে যাবে…
                    </option>
                    {catOptions.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-[10px] bg-a-ok px-4 py-2.5 text-sm font-semibold text-white shadow-a-card transition hover:brightness-95 active:translate-y-px"
                  >
                    <Check className="h-4 w-4" /> অনুমোদন
                  </button>
                </form>
                <form action={rejectSubmission}>
                  <input type="hidden" name="id" value={s.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-[10px] border border-a-line bg-a-surface px-4 py-2.5 text-sm font-semibold text-a-muted transition hover:border-accent-ring hover:bg-accent-soft hover:text-accent"
                  >
                    <X className="h-4 w-4" /> বাতিল
                  </button>
                </form>
                <div className="ml-auto">
                  <DeleteButton
                    action={deleteSubmission}
                    hidden={{ id: s.id }}
                    label="স্থায়ীভাবে মুছুন"
                    confirmText={`“${s.outlet_name}” সাবমিশনটি স্থায়ীভাবে মুছে ফেলবেন? সাবমিশনটি এবং এর সাথে আপলোড করা লোগো ডেটাবেজ থেকে একেবারে মুছে যাবে — ফিরিয়ে আনা যাবে না।`}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {handled.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-2.5 px-0.5 text-[0.9375rem] font-bold text-a-ink">
            রিভিউ ইতিহাস <span className="font-normal text-a-faint">({bnNum(handled.length)})</span>
          </h2>
          <TableShell>
            <table className="w-full min-w-[520px] border-collapse">
              <thead>
                <tr>
                  <Th align="left">সাইট</Th>
                  <Th align="left" className="w-40">তারিখ</Th>
                  <Th align="right" className="w-32">ফলাফল</Th>
                  <Th align="right" className="w-28">অ্যাকশন</Th>
                </tr>
              </thead>
              <tbody>
                {handled.map((s) => (
                  <Tr key={s.id}>
                    <Td>
                      <p className="font-semibold text-a-ink">{s.outlet_name}</p>
                      <p className="text-xs text-a-faint" dir="ltr">
                        {hostname(s.url)}
                      </p>
                    </Td>
                    <Td className="text-a-muted">{formatDateBn(s.created_at)}</Td>
                    <Td align="right">
                      <Badge tone={s.status === "approved" ? "ok" : "muted"}>
                        {s.status === "approved" ? "অনুমোদিত" : "বাতিল"}
                      </Badge>
                    </Td>
                    <Td align="right">
                      <div className="admin-row-actions flex justify-end">
                        <DeleteButton
                          action={deleteSubmission}
                          hidden={{ id: s.id }}
                          confirmText={`“${s.outlet_name}” সাবমিশনটি স্থায়ীভাবে মুছে ফেলবেন? ডেটাবেজ থেকে একেবারে মুছে যাবে — ফিরিয়ে আনা যাবে না।`}
                        />
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        </div>
      )}
    </div>
  );
}
