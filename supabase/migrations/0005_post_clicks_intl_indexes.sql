-- Migration 0005 — blog click tracking, International Newspapers category,
-- and query indexes across every table. Idempotent; safe to re-run.

-- ---------- Blog click tracking ---------------------------------------------

alter table public.posts
  add column if not exists click_count bigint not null default 0;

-- SECURITY DEFINER so the anon key can bump the counter through the beacon,
-- mirroring public.increment_click for outlets.
create or replace function public.increment_post_click(post_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.posts set click_count = click_count + 1 where id = post_id;
$$;

grant execute on function public.increment_post_click(uuid) to anon, authenticated;

-- ---------- International Newspapers category -------------------------------
-- Empty to start; outlets are added from the admin panel.

insert into public.categories
  (slug, title, title_bn, description, section_type, group_key, sort_order, show_on_home, is_active)
values
  ('international-newspapers', 'International Newspapers', 'আন্তর্জাতিক সংবাদপত্র',
   'Major international newspapers and global news sources in one place.',
   'outlet_grid', 'international', 95, false, true)
on conflict (slug) do nothing;

-- ---------- Indexes (query speed) -------------------------------------------

-- posts: list newest first, rank by popularity, and the homepage feature order.
create index if not exists posts_published_at_idx on public.posts(published_at desc);
create index if not exists posts_click_count_idx  on public.posts(click_count desc);
create index if not exists posts_featured_sort_idx on public.posts(featured, sort_order);

-- outlets: the hot path is "active outlets in a category, in order".
create index if not exists outlets_slug_idx           on public.outlets(slug);
create index if not exists outlets_category_active_idx on public.outlets(category_id, is_active, sort_order);
create index if not exists outlets_click_count_idx     on public.outlets(click_count desc);

-- categories: nav/home selectors filter by parent, group, home flag and order.
create index if not exists categories_parent_idx on public.categories(parent_slug);
create index if not exists categories_group_idx  on public.categories(group_key);
create index if not exists categories_home_idx   on public.categories(show_on_home);
create index if not exists categories_sort_idx   on public.categories(sort_order);

-- submissions: admin lists newest first.
create index if not exists submissions_created_idx on public.submissions(created_at desc);
