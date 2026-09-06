-- Migration 0010 — stop shipping the whole directory to the app to render the
-- homepage. Idempotent; safe to re-run.
--
-- Why this exists
-- ---------------
-- `getHomeSections()` fetched every active outlet (`select *`, plus an embedded
-- category join), handed all of them to Node, grouped them in JavaScript and
-- then threw most of them away — the homepage only ever renders `home_limit`
-- tiles per section. Every one of those rows became a JavaScript object with a
-- dozen string fields, several of which (description, click_count) the public
-- site never reads at all. The cost scaled with the size of the directory
-- rather than with what was on screen, and it was paid again on every ISR
-- regeneration.
--
-- This view does the top-N-per-category selection in Postgres, so the app
-- receives exactly the rows it paints.
--
-- Why LATERAL ... LIMIT rather than a window function
-- ---------------------------------------------------
-- `row_number() over (partition by category_id)` would have to sort every
-- active outlet before discarding the tail. The correlated LATERAL below lets
-- the planner walk `outlets_category_sort_idx (category_id, sort_order)` — the
-- index migration 0008 consolidated to — and stop after `home_limit` rows per
-- category. Bounded work per section instead of a full sort of the table.
--
-- `security_invoker = true` keeps the caller's RLS in force, exactly as
-- `category_outlet_counts` does: the anon key still sees only active rows.

create or replace view public.home_section_outlets
with (security_invoker = true)
as
  select
    c.slug        as category_slug,
    c.sort_order  as category_sort,
    -- Total active outlets in the category, for the "View all N" link. Counted
    -- here so the app never needs the rows it is not going to show.
    n.total       as category_total,
    o.id,
    o.slug,
    o.name,
    o.name_bn,
    o.url,
    o.logo_url,
    o.is_featured,
    o.open_external,
    o.sort_order
  from public.categories c
  cross join lateral (
    select count(*)::int as total
    from public.outlets x
    where x.category_id = c.id
      and x.is_active
  ) n
  cross join lateral (
    select y.id, y.slug, y.name, y.name_bn, y.url, y.logo_url,
           y.is_featured, y.open_external, y.sort_order
    from public.outlets y
    where y.category_id = c.id
      and y.is_active
    order by y.sort_order, y.id
    -- LIMIT NULL is "no limit", which is how home_limit = 0 means "show all".
    limit case when c.home_limit = 0 then null else c.home_limit end
  ) o
  where c.is_active
    and c.show_on_home
    and c.parent_slug is null
    and c.section_type = 'outlet_grid';

grant select on public.home_section_outlets to anon, authenticated, service_role;

analyze public.outlets;
analyze public.categories;
