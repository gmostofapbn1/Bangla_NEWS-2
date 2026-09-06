-- Migration: let admin feature + order blog posts on the homepage. Safe to re-run.

alter table public.posts
  add column if not exists featured boolean not null default false;

alter table public.posts
  add column if not exists sort_order int not null default 0;
