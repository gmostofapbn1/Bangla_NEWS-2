-- Migration 0008 — consolidate overlapping indexes. Idempotent; safe to re-run.
--
-- After 0005 and 0007 the `outlets` table carried ten indexes, several of them
-- redundant. Every one of them has to be written on each insert/update, so an
-- over-indexed table is its own kind of slow — and the directory grows by
-- outlets, so this is the table that matters.
--
-- Nothing here can make a read slower: each dropped index is either an exact
-- leading-column prefix of an index that remains, or a standalone boolean
-- column so lopsided that the planner would never choose it.

-- ---------- outlets ----------------------------------------------------------

-- One index serves both hot paths:
--   admin : where category_id = ? order by sort_order          (all outlets)
--   public: where category_id = ? and is_active order by sort_order
-- The public variant filters is_active from the heap, which costs almost
-- nothing because ~99% of rows are active.
create index if not exists outlets_category_sort_idx
  on public.outlets (category_id, sort_order);

-- Redundant: exact prefix of outlets_category_sort_idx.
drop index if exists public.outlets_category_idx;

-- Redundant: (category_id, is_active, sort_order) cannot produce sorted output
-- for the admin query because is_active sits between the two columns it needs,
-- and the public query is served by outlets_category_sort_idx above.
drop index if exists public.outlets_category_active_idx;

-- Redundant: added in 0007, superseded by outlets_category_sort_idx.
drop index if exists public.outlets_active_category_sort_idx;

-- Useless: is_active is true for ~99% of rows, so this index can never be
-- selective enough for the planner to prefer it over a scan.
drop index if exists public.outlets_active_idx;

-- ---------- posts ------------------------------------------------------------

-- Useless for the same reason: a standalone boolean column.
drop index if exists public.posts_published_idx;

-- Superseded by the partial posts_published_at_live_idx from 0007, which
-- indexes only published rows and answers the public blog list directly.
drop index if exists public.posts_published_at_idx;

-- ---------- submissions ------------------------------------------------------

-- Exact prefix of submissions_status_created_idx.
drop index if exists public.submissions_status_idx;

analyze public.outlets;
analyze public.posts;
analyze public.submissions;
