-- Migration 0012 — give every outlet a readable /read/[slug] handle.
--
-- `upsertOutlet` never wrote the `slug` column, so every newspaper added from
-- the admin since migration 0003 was stored with slug = null and fell back to
-- its raw uuid in the URL: /read/c759272e-d975-418f-acf9-c5f0aed76968 instead
-- of /read/prothom-alo. The action now generates one; this backfills the rows
-- that missed out.
--
-- Existing uuid links keep working — getOutletByHandle() matches a uuid against
-- the id column before it tries slug — so nothing already linked breaks.
--
-- Done row by row rather than as one UPDATE ... row_number(): `outlets_slug_idx`
-- is unique and is enforced *during* the statement, so a set-based update trips
-- over its own collisions (a backfilled name can clash both with an existing
-- slug and with another backfilled row). Claiming one slug at a time and
-- probing for the next free suffix is the version that actually runs. A few
-- hundred indexed lookups is nothing.
--
-- Idempotent; safe to re-run — rows that already have a slug are skipped.

do $$
declare
  r         record;
  base_slug text;
  candidate text;
  n         int;
begin
  for r in
    select id, name
    from public.outlets
    where slug is null or slug = ''
    order by created_at, id
  loop
    -- Mirrors lib/utils.ts toSlug() for ASCII input.
    base_slug := nullif(
      regexp_replace(
        lower(regexp_replace(trim(r.name), '[^a-zA-Z0-9]+', '-', 'g')),
        '^-+|-+$', '', 'g'),
      '');

    -- A name with no ASCII letters at all (pure Bangla) yields nothing usable;
    -- leave it null and let the uuid URL stand, which still resolves.
    if base_slug is null then
      continue;
    end if;

    candidate := base_slug;
    n := 1;
    while exists (select 1 from public.outlets where slug = candidate) loop
      n := n + 1;
      candidate := base_slug || '-' || n;
    end loop;

    update public.outlets set slug = candidate where id = r.id;
  end loop;
end $$;

create unique index if not exists outlets_slug_idx on public.outlets(slug);

analyze public.outlets;
