-- Migration: pretty per-outlet slugs for /read/[slug]. Safe to re-run.

alter table public.outlets add column if not exists slug text;

-- Base slug from the name
update public.outlets
set slug = regexp_replace(
             lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g')),
             '^-+|-+$', '', 'g')
where slug is null or slug = '';

-- De-duplicate: keep the first, suffix the rest (-2, -3, …)
with ranked as (
  select id, slug, row_number() over (partition by slug order by created_at, id) as rn
  from public.outlets
)
update public.outlets o
set slug = o.slug || '-' || r.rn
from ranked r
where o.id = r.id and r.rn > 1;

create unique index if not exists outlets_slug_idx on public.outlets(slug);
