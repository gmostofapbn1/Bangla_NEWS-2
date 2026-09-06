-- Migration 0013 — first-run setup for this project.
--
-- The directory content was seeded by copying it from the sister site, so two
-- things still refer to that site and have to be corrected before launch:
--
--   1. Uploaded assets carry absolute URLs pointing at the source project's
--      storage host. The files were copied across, but nothing rewrote the
--      references, so images would keep loading from a project this site does
--      not control — and would break the moment it is paused or deleted.
--      Includes images the rich-text editor embedded inside posts.content.
--
--   2. The settings rows carry the old brand name and its SEO copy. This site
--      targets a different keyword, so the name, title, description and
--      keywords are reset here rather than left for someone to notice later.
--
-- Idempotent: every statement is a no-op once it has run.

do $$
declare
  old_host constant text := 'uzyhosbhdiijodyftxil.supabase.co';
  new_host constant text := 'vjqhilqlappgnmemywrg.supabase.co';
begin
  update public.outlets     set logo_url    = replace(logo_url,    old_host, new_host) where logo_url    like '%' || old_host || '%';
  update public.posts       set cover_image = replace(cover_image, old_host, new_host) where cover_image like '%' || old_host || '%';
  update public.posts       set content     = replace(content,     old_host, new_host) where content     like '%' || old_host || '%';
  update public.settings    set value       = replace(value,       old_host, new_host) where value       like '%' || old_host || '%';
  update public.admins      set avatar_url  = replace(avatar_url,  old_host, new_host) where avatar_url  like '%' || old_host || '%';
  update public.submissions set logo_url    = replace(logo_url,    old_host, new_host) where logo_url    like '%' || old_host || '%';
end $$;

-- ---------- Brand + SEO ------------------------------------------------------
-- The logo and favicon are cleared rather than reused: they are the other
-- site's wordmark. The header falls back to the built-in mark plus the site
-- name until the client uploads this brand's own artwork.

insert into public.settings (key, value, is_public) values
  ('site_name',        'All Newspaper List', true),
  ('site_logo',        '',                   true),
  ('site_favicon',     '',                   true),
  ('meta_title',       'All Newspaper List — Complete Newspaper List of Bangladesh', true),
  ('meta_description', 'All Newspaper List is the complete newspaper list of Bangladesh — every national daily, online news portal, TV channel, ePaper, FM radio, job site and regional newspaper in one place.', true),
  ('meta_keywords',    'all newspaper list, newspaper list, bangladesh newspaper list, bangla newspaper list, online news portal list, bangla epaper, bd newspaper', true),
  -- Verification and analytics belong to the other property; clear them so
  -- this site is verified on its own.
  ('google_site_verification', '', true),
  ('google_analytics_id',      '', true),
  -- Social links point at the other brand's profiles.
  ('social_facebook',  '', true),
  ('social_x',         '', true),
  ('social_instagram', '', true),
  ('social_pinterest', '', true),
  ('social_youtube',   '', true)
on conflict (key) do update set value = excluded.value;
