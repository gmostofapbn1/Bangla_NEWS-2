-- Migration 0016 — masthead branding.
--
-- The client supplied a gold wordmark and a favicon, and asked for a blue
-- header bar. The bar gets its own setting rather than reusing primary_color:
-- primary_color drives buttons, links and category dots site-wide, so pointing
-- the header at it would turn all of those blue too.
--
-- Idempotent — re-running just rewrites the same three values.

insert into public.settings (key, value, is_public) values
  ('header_color',  '#1B7CC4', true),
  ('site_logo',     'https://vjqhilqlappgnmemywrg.supabase.co/storage/v1/object/public/logos/brand/all-newspaper-logo.png', true),
  ('site_favicon',  'https://vjqhilqlappgnmemywrg.supabase.co/storage/v1/object/public/logos/brand/favicon.ico', true)
on conflict (key) do update set value = excluded.value;
