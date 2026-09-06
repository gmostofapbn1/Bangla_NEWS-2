-- Migration 0011 — capture a phone number with public site submissions.
--
-- The submit form already had somewhere to put a logo (`submissions.logo_url`,
-- present since the original schema) but never offered the upload; this adds
-- the one column it was missing. Metadata-only: adding a nullable text column
-- writes a catalogue entry and touches no existing row.
--
-- No index. `submissions` is read by one screen, the moderation queue, which
-- filters on status and orders by created_at — both already covered by
-- submissions_status_created_idx from 0007. A phone number is never a search
-- key here, so an index on it would only cost writes.
--
-- Idempotent; safe to re-run.

alter table public.submissions
  add column if not exists submitter_phone text;
