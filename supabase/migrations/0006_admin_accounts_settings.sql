-- Migration 0006 — multi-admin accounts (roles + permissions), password reset
-- codes, and the full site-settings key/value registry. Idempotent; safe to re-run.

-- ---------- Admin accounts ---------------------------------------------------
-- Replaces the single shared ADMIN_PASSWORD env var. The first login still
-- accepts ADMIN_PASSWORD and bootstraps it into the owner row below, so an
-- existing deployment can never lock itself out.

create table if not exists public.admins (
  id            uuid primary key default gen_random_uuid(),
  username      text not null,
  name          text,
  email         text,
  avatar_url    text,
  password_hash text not null,
  role          text not null default 'admin'
                check (role in ('owner', 'admin', 'author')),
  -- Section keys this account may open. Ignored for 'owner' (always full access).
  permissions   text[] not null default '{}',
  is_active     boolean not null default true,
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Usernames and emails are stored already lower-cased (normalised on write),
-- so login can use a plain equality lookup that hits a btree index. The
-- lower() unique indexes stay as a correctness backstop against a row ever
-- being inserted with mixed case from outside the app.
create unique index if not exists admins_username_idx on public.admins (username);
create unique index if not exists admins_username_lower_idx on public.admins (lower(username));
create unique index if not exists admins_email_idx on public.admins (email)
  where email is not null and email <> '';
create unique index if not exists admins_email_lower_idx on public.admins (lower(email))
  where email is not null and email <> '';

-- Exactly one owner account may exist.
create unique index if not exists admins_single_owner_idx on public.admins ((role))
  where role = 'owner';

-- ---------- Password reset codes --------------------------------------------
-- Short-lived numeric codes emailed through the admin's own SMTP settings.
-- Only the hash is stored, so a database leak cannot be used to reset a password.

create table if not exists public.admin_reset_codes (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid not null references public.admins(id) on delete cascade,
  code_hash  text not null,
  expires_at timestamptz not null,
  used_at    timestamptz,
  attempts   int not null default 0,
  created_at timestamptz not null default now()
);

-- The only hot query is "newest unused, unexpired code for this admin", so a
-- partial composite index answers it without touching used/expired rows.
create index if not exists admin_reset_codes_lookup_idx
  on public.admin_reset_codes (admin_id, created_at desc)
  where used_at is null;

-- Supports periodic cleanup of expired rows.
create index if not exists admin_reset_codes_expiry_idx on public.admin_reset_codes(expires_at);

-- Both tables are service-role only: RLS on, and deliberately no policies, so
-- the anon key can never read password hashes or reset codes.
alter table public.admins            enable row level security;
alter table public.admin_reset_codes enable row level security;

drop policy if exists "no anon access to admins"      on public.admins;
drop policy if exists "no anon access to reset codes" on public.admin_reset_codes;

-- ---------- Settings: split public config from secrets -----------------------
-- The old policy exposed every row to the anon key. SMTP credentials live in
-- this table now, so reads are restricted to rows explicitly marked public.

alter table public.settings
  add column if not exists is_public boolean not null default true;

drop policy if exists "public read settings" on public.settings;
create policy "public read settings" on public.settings
  for select using (is_public = true);

-- ---------- Default settings rows -------------------------------------------
-- `on conflict do nothing` keeps any value the admin has already saved.

insert into public.settings (key, value, is_public) values
  -- General
  ('site_name',                'All Bangla Newspaper', true),
  ('site_logo',                '',                     true),
  ('site_favicon',             '',                     true),
  ('primary_color',            '#c8102e',              true),
  -- SEO
  ('meta_title',               '',                     true),
  ('meta_description',         '',                     true),
  ('meta_keywords',            '',                     true),
  ('google_analytics_id',      '',                     true),
  ('google_site_verification', '',                     true),
  -- Google AdSense
  ('adsense_code',             '',                     true),
  -- Footer social links
  ('social_facebook',          '',                     true),
  ('social_x',                 '',                     true),
  ('social_instagram',         '',                     true),
  ('social_pinterest',         '',                     true),
  ('social_youtube',           '',                     true),
  ('app_download_url',         '',                     true),
  -- Footer page content
  ('page_about',               '',                     true),
  ('page_disclaimer',          '',                     true),
  ('page_privacy',             '',                     true),
  -- Contact details shown in the footer
  ('contact_email',            '',                     true),
  -- SMTP — private: never exposed to the anon key
  ('smtp_host',                '',                     false),
  ('smtp_port',                '587',                  false),
  ('smtp_encryption',          'tls',                  false),
  ('smtp_username',            '',                     false),
  ('smtp_password',            '',                     false),
  ('smtp_from_email',          '',                     false),
  ('smtp_from_name',           '',                     false)
on conflict (key) do nothing;

-- Force the secrecy flag even if the rows already existed from an earlier run.
update public.settings set is_public = false
  where key like 'smtp\_%' and is_public is distinct from false;

-- ---------- Storage bucket for admin avatars & branding ----------------------
-- Reuses the existing public 'media' bucket; nothing to create.
