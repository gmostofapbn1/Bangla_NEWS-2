-- Migration 0007 — push admin aggregates into Postgres and cover the remaining
-- hot query paths with indexes. Idempotent; safe to re-run.
--
-- Why: the Supabase project is in ap-southeast-2 while the admin works from
-- Bangladesh, so every round-trip costs ~150-450ms. The dashboard was issuing
-- seven separate queries (one of them streaming all outlet click_counts back
-- just to add them up). Both problems are fixed below: one call, aggregated
-- server-side, reading only index/heap tuples it actually needs.

-- ---------- Dashboard statistics (single round-trip) -------------------------

create or replace function public.admin_dashboard_stats()
returns table (
  outlets             bigint,
  active_outlets      bigint,
  categories          bigint,
  pending_submissions bigint,
  posts               bigint,
  published_posts     bigint,
  total_clicks        bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.outlets),
    (select count(*) from public.outlets where is_active),
    (select count(*) from public.categories),
    (select count(*) from public.submissions where status = 'pending'),
    (select count(*) from public.posts),
    (select count(*) from public.posts where published),
    (select coalesce(sum(click_count), 0) from public.outlets);
$$;

-- Admin-only data: the anon key must not be able to call this.
revoke all on function public.admin_dashboard_stats() from public, anon, authenticated;
grant execute on function public.admin_dashboard_stats() to service_role;

-- ---------- Outlet counts per category ---------------------------------------
-- Replaces fetching every outlet row (with an embedded category join) into the
-- app just to count them. Postgres aggregates over the category_id index.

create or replace view public.category_outlet_counts
with (security_invoker = true)
as
  select
    c.slug,
    count(o.id)::int as outlet_count,
    count(o.id) filter (where o.is_active)::int as active_count
  from public.categories c
  left join public.outlets o on o.category_id = c.id
  group by c.slug;

-- ---------- Indexes for the remaining hot paths ------------------------------

-- /admin/outlets and /admin/divisions list every outlet ordered by sort_order.
-- Migration 0005 indexed (category_id, is_active, sort_order), which cannot
-- serve a global ORDER BY sort_order.
create index if not exists outlets_sort_order_idx on public.outlets (sort_order);

-- Submissions: the moderation queue filters by status and shows newest first.
create index if not exists submissions_status_created_idx
  on public.submissions (status, created_at desc);

-- Posts: the admin list orders by sort_order then created_at desc.
create index if not exists posts_sort_created_idx
  on public.posts (sort_order, created_at desc);

-- Public blog list: published posts, newest first — a partial index keeps
-- drafts out of the index entirely.
create index if not exists posts_published_at_live_idx
  on public.posts (published_at desc)
  where published;

-- Public directory: active outlets in a category, in display order.
-- Partial (is_active) so hidden outlets do not bloat the index.
create index if not exists outlets_active_category_sort_idx
  on public.outlets (category_id, sort_order)
  where is_active;

-- Public category/nav selectors read active categories in sort order.
create index if not exists categories_active_sort_idx
  on public.categories (sort_order)
  where is_active;

-- Settings is read on every page render through the root layout. It is tiny,
-- but the public path filters on is_public, so index that predicate.
create index if not exists settings_public_idx on public.settings (key) where is_public;

-- ---------- Keep the planner honest ------------------------------------------
analyze public.outlets;
analyze public.categories;
analyze public.posts;
analyze public.submissions;
analyze public.settings;
