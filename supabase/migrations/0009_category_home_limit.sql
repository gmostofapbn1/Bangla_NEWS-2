-- Migration 0009 — per-category homepage cap.
--
-- The homepage used one hard-coded limit of 12 outlets for every section. This
-- column moves that decision into the admin, per category: 10 in one section,
-- 30 in the next, 50 in another. `0` means "no cap — show every outlet".
--
-- Written to stay cheap on a live database:
--
--   * ADD COLUMN with a constant DEFAULT is metadata-only on PostgreSQL 11+.
--     The default is recorded in the catalogue instead of being written into
--     every existing row, so there is no full-table rewrite to buffer through
--     shared_buffers and no table-sized spike in the backend's memory.
--
--   * smallint, not int. The value is a display cap in the low hundreds, so two
--     bytes per row is plenty; it also packs into the alignment padding that
--     already follows the boolean flags rather than widening the tuple.
--
--   * The CHECK is added NOT VALID and validated in a separate statement.
--     Adding a validated CHECK in one step holds ACCESS EXCLUSIVE while it
--     sequentially scans the whole table. NOT VALID takes that lock only long
--     enough to write the catalogue row; VALIDATE CONSTRAINT then does the scan
--     under SHARE UPDATE EXCLUSIVE, which readers and writers do not block on.
--
-- No index is created here, deliberately. `categories` holds 22 rows and is
-- read in full on every render for the header, footer and homepage — the
-- planner will sequentially scan it whatever we build. `home_limit` is never a
-- search predicate either; it is only ever read alongside the row it belongs
-- to, which a heap fetch already provides. Migration 0008 established the rule:
-- an index nothing uses is pure write amplification.
--
-- Idempotent; safe to re-run.

alter table public.categories
  add column if not exists home_limit smallint not null default 12;

-- Mirrors the application's own bounds (lib/validation.ts) so a bad write from
-- outside the app cannot produce a nonsensical cap.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.categories'::regclass
      and conname  = 'categories_home_limit_check'
  ) then
    alter table public.categories
      add constraint categories_home_limit_check
      check (home_limit >= 0 and home_limit <= 9999) not valid;
  end if;
end $$;

alter table public.categories validate constraint categories_home_limit_check;
