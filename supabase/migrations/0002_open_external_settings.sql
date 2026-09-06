-- Migration: add per-outlet open_external flag + global settings table.
-- Safe to re-run.

alter table public.outlets
  add column if not exists open_external boolean not null default false;

create table if not exists public.settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

insert into public.settings (key, value)
values ('default_open_external', 'false')
on conflict (key) do nothing;

alter table public.settings enable row level security;
drop policy if exists "public read settings" on public.settings;
create policy "public read settings" on public.settings
  for select using (true);
