import Link from "next/link";
import {
  Newspaper,
  FolderTree,
  Inbox,
  FileText,
  AlertTriangle,
  ArrowRight,
  Globe,
  MonitorSmartphone,
  MousePointerClick,
  Plus,
  Settings2,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import {
  adminStats,
  adminListSubmissions,
  adminGetSetting,
  adminTopOutlets,
} from "@/lib/admin-queries";
import { updateGlobalSetting } from "@/lib/actions/admin";
import { requireSection, getCurrentAdmin } from "@/lib/auth";
import { can, sectionLabel } from "@/lib/permissions";
import { formatDateBn, bnNum, hostname } from "@/lib/utils";
import {
  Alert,
  Badge,
  Card,
  CardHeader,
  PageHeader,
  StatTile,
  btn,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const admin = await requireSection("dashboard");
  const { denied } = await searchParams;

  const stats = await adminStats();
  const [submissions, topOutlets] = await Promise.all([
    stats.configured ? adminListSubmissions() : Promise.resolve([]),
    stats.configured && can(admin, "outlets") ? adminTopOutlets(5) : Promise.resolve([]),
  ]);

  const pending = submissions.filter((s) => s.status === "pending").slice(0, 5);
  const defaultOpenExternal = stats.configured
    ? (await adminGetSetting("default_open_external")) === "true"
    : false;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "শুভ সকাল" : hour < 17 ? "শুভ অপরাহ্ন" : "শুভ সন্ধ্যা";

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={greeting}
        title={`${admin.name || admin.username}, স্বাগতম`}
        description="ডিরেক্টরি, সাবমিশন এবং ব্লগের সবকিছু এখান থেকে দেখুন ও পরিচালনা করুন।"
        actions={
          can(admin, "outlets") ? (
            <Link href="/admin/outlets/new" className={btn.primary}>
              <Plus className="h-4 w-4" /> নতুন সাইট
            </Link>
          ) : null
        }
      />

      {denied && (
        <div className="mb-6">
          <Alert tone="warn" icon={ShieldAlert} title="অনুমতি নেই">
            “{sectionLabel(denied)}” সেকশনটি দেখার অনুমতি আপনার অ্যাকাউন্টে নেই। প্রয়োজন হলে
            মালিকের সাথে যোগাযোগ করুন।
          </Alert>
        </div>
      )}

      {!stats.configured && (
        <div className="mb-6">
          <Alert tone="warn" icon={AlertTriangle} title="Supabase এখনো যুক্ত হয়নি">
            পাবলিক সাইটটি বান্ডিল করা ডেটা দিয়ে চলছে। সম্পাদনা, সাবমিশন এবং ক্লিক ট্র্যাকিং
            চালু করতে <code className="rounded bg-black/5 px-1">NEXT_PUBLIC_SUPABASE_URL</code> ও{" "}
            <code className="rounded bg-black/5 px-1">SUPABASE_SERVICE_ROLE_KEY</code> সেট করে{" "}
            <code className="rounded bg-black/5 px-1">supabase/schema.sql</code> চালান।
          </Alert>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label="মোট সাইট"
          value={bnNum(stats.outlets)}
          sub={`${bnNum(stats.activeOutlets)} টি সক্রিয়`}
          icon={Newspaper}
          href={can(admin, "outlets") ? "/admin/outlets" : undefined}
        />
        <StatTile
          label="ক্যাটাগরি"
          value={bnNum(stats.categories)}
          sub="ডিরেক্টরি সেকশন"
          icon={FolderTree}
          href={can(admin, "categories") ? "/admin/categories" : undefined}
        />
        <StatTile
          label="অপেক্ষমাণ সাবমিশন"
          value={bnNum(stats.pendingSubmissions)}
          sub={stats.pendingSubmissions > 0 ? "রিভিউ প্রয়োজন" : "সব রিভিউ হয়ে গেছে"}
          icon={Inbox}
          tone={stats.pendingSubmissions > 0 ? "warn" : "ok"}
          href={can(admin, "submissions") ? "/admin/submissions" : undefined}
        />
        <StatTile
          label="ব্লগ পোস্ট"
          value={bnNum(stats.posts)}
          sub={`${bnNum(stats.publishedPosts)} টি প্রকাশিত`}
          icon={FileText}
          href={can(admin, "posts") ? "/admin/posts" : undefined}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        {/* Pending submissions */}
        <Card className="lg:col-span-3" padded={false}>
          <div className="p-5 sm:p-6">
            <CardHeader
              title="অপেক্ষমাণ সাবমিশন"
              description="পাঠকদের পাঠানো নতুন সাইটগুলো এখানে রিভিউর জন্য জমা হয়।"
              icon={Inbox}
              actions={
                can(admin, "submissions") ? (
                  <Link
                    href="/admin/submissions"
                    className="inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-accent hover:underline"
                  >
                    সবগুলো <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : null
              }
            />
          </div>
          {pending.length === 0 ? (
            <p className="border-t border-a-line-soft px-6 py-10 text-center text-sm text-a-muted">
              রিভিউর অপেক্ষায় কিছু নেই। 🎉
            </p>
          ) : (
            <ul className="border-t border-a-line-soft">
              {pending.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 border-b border-a-line-soft px-5 py-3 last:border-0 sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-a-ink">{s.outlet_name}</p>
                    <p className="truncate text-xs text-a-faint" dir="ltr">
                      {hostname(s.url)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-a-faint">
                    {formatDateBn(s.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Most opened */}
        <Card className="lg:col-span-2" padded={false}>
          <div className="p-5 sm:p-6">
            <CardHeader
              title="সবচেয়ে বেশি ক্লিক"
              description={`সব সাইট মিলিয়ে মোট ${bnNum(stats.totalClicks)} বার খোলা হয়েছে।`}
              icon={TrendingUp}
            />
          </div>
          {topOutlets.length === 0 ? (
            <p className="border-t border-a-line-soft px-6 py-10 text-center text-sm text-a-muted">
              এখনো কোনো ক্লিক রেকর্ড হয়নি।
            </p>
          ) : (
            <ol className="border-t border-a-line-soft">
              {topOutlets.map((o, i) => (
                <li
                  key={o.id}
                  className="flex items-center gap-3 border-b border-a-line-soft px-5 py-2.5 last:border-0 sm:px-6"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-a-sunken text-[11px] font-bold text-a-muted">
                    {bnNum(i + 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] font-semibold text-a-ink">
                      {o.name}
                    </span>
                    <span className="block truncate text-[11px] text-a-faint">
                      {o.category_title ?? "—"}
                    </span>
                  </span>
                  <span className="shrink-0 text-[0.8125rem] font-bold text-a-ink">
                    {bnNum(o.click_count)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      {/* Global card behaviour */}
      {stats.configured && can(admin, "outlets") && (
        <Card className="mt-4">
          <CardHeader
            title="কার্ডে ক্লিক করলে কী হবে"
            description="পাঠক কোনো সাইটের কার্ডে ট্যাপ করলে সাইটটি ভেতরের ভিউয়ারে খুলবে, নাকি সরাসরি ঐ ওয়েবসাইটে চলে যাবে। প্রতিটি সাইটের নিজস্ব সেটিং এটিকে ওভাররাইড করতে পারে।"
            icon={MousePointerClick}
          />
          <div className="mt-5 flex flex-wrap gap-3">
            <BehaviourOption
              value="false"
              active={!defaultOpenExternal}
              icon={MonitorSmartphone}
              title="ইন-সাইট ভিউয়ারে খুলবে"
              hint="পাঠক আপনার সাইটেই থাকবে"
            />
            <BehaviourOption
              value="true"
              active={defaultOpenExternal}
              icon={Globe}
              title="সরাসরি ওয়েবসাইটে যাবে"
              hint="নতুন ট্যাবে মূল সাইট খুলবে"
            />
          </div>
        </Card>
      )}

      {/* Quick links */}
      <QuickLinks />
    </div>
  );
}

function BehaviourOption({
  value,
  active,
  icon: Icon,
  title,
  hint,
}: {
  value: string;
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint: string;
}) {
  return (
    <form action={updateGlobalSetting} className="flex-1 basis-64">
      <input type="hidden" name="key" value="default_open_external" />
      <input type="hidden" name="value" value={value} />
      <button
        type="submit"
        aria-pressed={active}
        className={`flex w-full items-start gap-3 rounded-[var(--radius-a-sm)] border px-4 py-3.5 text-left transition ${
          active
            ? "border-accent bg-accent-soft/60 shadow-a-card"
            : "border-a-line bg-a-surface hover:border-a-faint/50 hover:bg-a-sunken"
        }`}
      >
        <Icon className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${active ? "text-accent" : "text-a-faint"}`} />
        <span className="min-w-0">
          <span className={`block text-[0.8125rem] font-semibold ${active ? "text-accent-dark" : "text-a-ink"}`}>
            {title}
          </span>
          <span className="mt-0.5 block text-xs text-a-muted">{hint}</span>
        </span>
        {active && (
          <span className="ml-auto shrink-0">
            <Badge tone="accent">চালু</Badge>
          </span>
        )}
      </button>
    </form>
  );
}

async function QuickLinks() {
  const admin = await getCurrentAdmin();
  const links = [
    { key: "outlets", href: "/admin/outlets/new", label: "নতুন সাইট যোগ করুন", icon: Newspaper },
    { key: "posts", href: "/admin/posts/new", label: "নতুন ব্লগ পোস্ট লিখুন", icon: FileText },
    { key: "categories", href: "/admin/categories/new", label: "নতুন ক্যাটাগরি", icon: FolderTree },
    { key: "settings", href: "/admin/settings", label: "সাইট সেটিংস", icon: Settings2 },
  ] as const;

  const visible = links.filter((l) => can(admin, l.key));
  if (visible.length === 0) return null;

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {visible.map((l) => {
        const Icon = l.icon;
        return (
          <Link
            key={l.href}
            href={l.href}
            className="group flex items-center gap-3 rounded-[var(--radius-a)] border border-a-line bg-a-surface px-4 py-3.5 shadow-a-card transition hover:-translate-y-0.5 hover:shadow-a-raised"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-a-sunken text-a-muted ring-1 ring-a-line transition group-hover:bg-accent-soft group-hover:text-accent group-hover:ring-accent-ring/60">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold text-a-ink">
              {l.label}
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-a-faint transition group-hover:translate-x-0.5 group-hover:text-accent" />
          </Link>
        );
      })}
    </div>
  );
}
