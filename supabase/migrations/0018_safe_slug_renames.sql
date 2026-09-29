-- Migration 0018 - make category slugs safe to rename.
--
-- The client renames slugs from Admin -> Categories for SEO. In September they
-- renamed 21, and three things broke:
--
--   1. The eight divisions still said parent_slug = 'local-newspaper' after the
--      regional hub became 'local', so the homepage regional section and
--      /local lost every division. parent_slug was plain text with no foreign
--      key, so nothing carried the rename across.
--   2. Every old URL - the ones in the submitted sitemap, some already
--      indexed - began returning 404.
--   3. The app looked sections up by literal slug (fixed in code, not here).
--
-- After this the database carries renames itself: renaming a parent rewrites
-- its children in the same statement, and a renamed category's old URL keeps
-- resolving. No index on parent_slug: the table has ~25 rows, and an index
-- there would cost writes to save nothing.

-- ---------- repair the orphans the rename left ------------------------------
update public.categories c
   set parent_slug = hub.slug
  from public.categories hub
 where c.parent_slug = 'local-newspaper'
   and hub.section_type = 'division_grid'
   and hub.parent_slug is null
   and not exists (select 1 from public.categories x where x.slug = 'local-newspaper');

-- Any other dangling parent would make the constraint below fail to add.
do $$
declare n int;
begin
  select count(*) into n from public.categories c
   where c.parent_slug is not null
     and not exists (select 1 from public.categories p where p.slug = c.parent_slug);
  if n > 0 then
    raise exception '% categories point at a parent_slug that does not exist', n;
  end if;
end $$;

-- ---------- slug renames are safe ------------------------------------------
-- parent_slug is a real foreign key that follows its parent's renames, and
-- every slug a category has had is kept so its old URL can 308 to the new one.

alter table public.categories
  drop constraint if exists categories_parent_slug_fkey;
alter table public.categories
  add constraint categories_parent_slug_fkey
  foreign key (parent_slug) references public.categories(slug)
  on update cascade on delete set null;

create table if not exists public.category_slug_history (
  old_slug    text primary key,
  category_id uuid not null references public.categories(id) on delete cascade,
  renamed_at  timestamptz not null default now()
);

alter table public.category_slug_history enable row level security;
drop policy if exists "slug history is public" on public.category_slug_history;
create policy "slug history is public" on public.category_slug_history
  for select using (true);

create or replace function public.record_category_slug_change()
returns trigger language plpgsql as $$
begin
  if new.slug is distinct from old.slug then
    insert into public.category_slug_history (old_slug, category_id)
    values (old.slug, old.id)
    on conflict (old_slug) do update
      set category_id = excluded.category_id, renamed_at = now();
    -- The new slug is live; it must not also act as a redirect.
    delete from public.category_slug_history where old_slug = new.slug;
  end if;
  return new;
end $$;

drop trigger if exists categories_slug_history on public.categories;
create trigger categories_slug_history
  after update of slug on public.categories
  for each row execute function public.record_category_slug_change();

-- ---------- backfill the renames that already happened --------------------
insert into public.category_slug_history (old_slug, category_id)
select v.old_slug, v.id::uuid
  from (values
    ('international-newspapers', 'cbd1c6fa-7ef4-4d23-9b97-ec1fce4ff3be'),
    ('sylhet-division', 'be8b921f-d871-47e5-a89b-5ddd4c7b7d67'),
    ('barisal-division', '0ee79da2-ed85-43bb-bf51-457345a1db54'),
    ('rajshahi-division', '209a626f-bf6b-4588-90fa-7aa4ec28dd06'),
    ('dhaka-division', '4c6c5eed-de16-4683-a73c-4521aba8cffd'),
    ('tv-news', 'b3c87a96-142b-4e9e-aa7c-0c9dfcdfa1d0'),
    ('online-portals', '9e87937d-4801-4795-8dbc-6293f7d2ae2d'),
    ('national-newspapers', '23cfa74c-4096-4fd9-8b08-8c42114d8493'),
    ('chattogram-division', '2c24fd5c-4b67-408c-8f7a-293cb06fa127'),
    ('mymensingh-division', '468d99c3-9f29-4966-ba5f-eb0034400b49'),
    ('rangpur-division', '4720e159-d62b-424e-8498-87dfb1d144b8'),
    ('khulna-division', '94b8a08b-765e-4a6e-99ea-fe4cc4e76336'),
    ('english-newspapers', 'e5bb10ba-15d9-40b0-9442-d87aaff2f2a6'),
    ('bangla-magazine', '929bcc55-e17c-4da0-a5ab-85809b7fa672'),
    ('india-newspapers', 'f64c75c7-aab6-426a-bb53-36e33c8ad159'),
    ('stock-market', '7225cba5-0e03-4d7d-945c-debf056ca55a'),
    ('epaper', '7b912b22-d982-47ea-a3e9-9c75ca2ff308'),
    ('top-newspaper-in-the-world', '3914e3f3-58fc-4e96-bbb0-ad6eba9e4f17'),
    ('local-newspaper', '6a12a127-a3ce-4d20-aab7-552c90e408e9'),
    ('job-portals', 'de85bb3c-b3f3-4848-8eaa-c056f7773df8'),
    ('fm-radio', 'a29bb25d-9155-49ad-ab8f-eee354786250')
  ) as v(old_slug, id)
  join public.categories c on c.id = v.id::uuid
 where not exists (select 1 from public.categories x where x.slug = v.old_slug)
on conflict (old_slug) do nothing;
