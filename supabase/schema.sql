-- ============================================================================
-- AllNewspaperBangla — database schema
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query).
-- Then run supabase/seed.sql to load the directory content.
-- ============================================================================

-- ---------- Tables ----------------------------------------------------------

create table if not exists public.categories (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  title_bn     text,
  description  text,
  section_type text not null default 'outlet_grid'
               check (section_type in ('outlet_grid', 'division_grid')),
  parent_slug  text,
  group_key    text not null default 'portals',
  sort_order   int  not null default 0,
  show_on_home boolean not null default false,
  -- How many outlets this category previews on the homepage. Set per category
  -- from the admin; 0 means "no cap — show every outlet". smallint because the
  -- value is a display cap in the low hundreds, never an identifier.
  home_limit   smallint not null default 12
               check (home_limit >= 0 and home_limit <= 9999),
  accent       text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.outlets (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references public.categories(id) on delete cascade,
  name          text not null,
  name_bn       text,
  slug          text,
  url           text not null,
  logo_url      text,
  description   text,
  is_featured   boolean not null default false,
  is_active     boolean not null default true,
  open_external boolean not null default false,
  sort_order    int  not null default 0,
  click_count   bigint not null default 0,
  created_at    timestamptz not null default now(),
  unique (category_id, name)
);

-- ---------- Global settings (key-value) -------------------------------------

-- `is_public` gates the anon-key read policy below: SMTP credentials live in
-- this table and must never be readable from the browser.
create table if not exists public.settings (
  key        text primary key,
  value      text not null,
  is_public  boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Seed the default card-open behaviour
insert into public.settings (key, value)
values ('default_open_external', 'false')
on conflict (key) do nothing;
-- One composite index serves both the admin listing (all outlets in a category,
-- in order) and the public listing (the same, filtered to active). Do not add a
-- standalone is_active index: ~99% of rows are active, so it can never be
-- selective enough for the planner to use.
create index if not exists outlets_category_sort_idx on public.outlets(category_id, sort_order);
create index if not exists outlets_sort_order_idx    on public.outlets(sort_order);
create index if not exists outlets_click_count_idx   on public.outlets(click_count desc);

create table if not exists public.submissions (
  id                 uuid primary key default gen_random_uuid(),
  outlet_name        text not null,
  url                text not null,
  category_suggestion text,
  logo_url           text,
  submitter_email    text,
  submitter_phone    text,
  notes              text,
  status             text not null default 'pending'
                     check (status in ('pending', 'approved', 'rejected')),
  created_at         timestamptz not null default now()
);
create index if not exists submissions_status_created_idx on public.submissions(status, created_at desc);
create index if not exists submissions_created_idx on public.submissions(created_at desc);

create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  excerpt      text,
  content      text not null,
  cover_image  text,
  published    boolean not null default false,
  featured     boolean not null default false,
  sort_order   int not null default 0,
  -- Drives the "Popular posts" ranking; bumped by increment_post_click below.
  click_count  bigint not null default 0,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
-- Partial: only published rows are ever listed publicly, so drafts stay out of
-- the index entirely.
create index if not exists posts_published_at_live_idx on public.posts(published_at desc) where published;
create index if not exists posts_sort_created_idx      on public.posts(sort_order, created_at desc);
create index if not exists posts_click_count_idx       on public.posts(click_count desc);

-- ---------- Admin accounts (roles + per-section permissions) -----------------
-- Service-role only. The first login accepts ADMIN_PASSWORD and bootstraps it
-- into the owner row, so a fresh install is never locked out.

create table if not exists public.admins (
  id            uuid primary key default gen_random_uuid(),
  username      text not null,
  name          text,
  email         text,
  avatar_url    text,
  password_hash text not null,
  role          text not null default 'admin'
                check (role in ('owner', 'admin', 'author')),
  permissions   text[] not null default '{}',
  is_active     boolean not null default true,
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Usernames/emails are stored lower-cased, so login is an indexed equality
-- match. The lower() indexes are a correctness backstop against mixed-case rows
-- inserted from outside the app.
create unique index if not exists admins_username_idx on public.admins (username);
create unique index if not exists admins_username_lower_idx on public.admins (lower(username));
create unique index if not exists admins_email_idx on public.admins (email)
  where email is not null and email <> '';
create unique index if not exists admins_email_lower_idx on public.admins (lower(email))
  where email is not null and email <> '';
create unique index if not exists admins_single_owner_idx on public.admins ((role))
  where role = 'owner';

create table if not exists public.admin_reset_codes (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid not null references public.admins(id) on delete cascade,
  code_hash  text not null,
  expires_at timestamptz not null,
  used_at    timestamptz,
  attempts   int not null default 0,
  created_at timestamptz not null default now()
);

-- The only hot query is "newest unused code for this admin".
create index if not exists admin_reset_codes_lookup_idx
  on public.admin_reset_codes (admin_id, created_at desc) where used_at is null;
create index if not exists admin_reset_codes_expiry_idx on public.admin_reset_codes(expires_at);

-- ---------- Click counter (SECURITY DEFINER so anon can increment) ----------

create or replace function public.increment_click(outlet_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.outlets set click_count = click_count + 1 where id = outlet_id;
$$;

grant execute on function public.increment_click(uuid) to anon, authenticated;

create or replace function public.increment_post_click(post_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.posts set click_count = click_count + 1 where id = post_id;
$$;

grant execute on function public.increment_post_click(uuid) to anon, authenticated;

-- ---------- Row Level Security ----------------------------------------------
-- The service-role key (server-only) bypasses RLS for all admin writes.
-- These policies expose only safe public reads to the anon key.

alter table public.categories        enable row level security;
alter table public.outlets           enable row level security;
alter table public.posts             enable row level security;
alter table public.submissions       enable row level security;
alter table public.settings          enable row level security;
-- No policies on these two: password hashes and reset codes are service-role only.
alter table public.admins            enable row level security;
alter table public.admin_reset_codes enable row level security;

drop policy if exists "public read settings" on public.settings;
create policy "public read settings" on public.settings
  for select using (is_public = true);

drop policy if exists "public read active categories" on public.categories;
create policy "public read active categories" on public.categories
  for select using (is_active = true);

drop policy if exists "public read active outlets" on public.outlets;
create policy "public read active outlets" on public.outlets
  for select using (is_active = true);

drop policy if exists "public read published posts" on public.posts;
create policy "public read published posts" on public.posts
  for select using (published = true);

-- submissions: no anon read/write. All inserts go through the service role.

-- ---------- Admin aggregates -------------------------------------------------
-- Keeps the dashboard to a single round-trip instead of seven, and lets
-- Postgres do the counting rather than shipping every row to the app.

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

revoke all on function public.admin_dashboard_stats() from public, anon, authenticated;
grant execute on function public.admin_dashboard_stats() to service_role;

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

-- ---------- Logo storage bucket (public read) -------------------------------

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "public read logos" on storage.objects;
create policy "public read logos" on storage.objects
  for select using (bucket_id = 'logos');

drop policy if exists "public read media" on storage.objects;
create policy "public read media" on storage.objects
  for select using (bucket_id = 'media');
