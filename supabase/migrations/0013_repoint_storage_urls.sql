-- Migration 0013 — repoint stored file URLs at the new Supabase project.
--
-- The row data was copied verbatim, so every uploaded asset still carries an
-- absolute URL pointing at the OLD project's storage host. The files themselves
-- were copied across, but nothing rewrote the references, so the site would
-- keep loading images from a project we no longer control — and they would all
-- break the moment it is paused or deleted.
--
-- Covers the obvious columns and one easy-to-miss place: images the rich-text
-- editor embedded inside `posts.content` as raw HTML.
--
-- Idempotent: the WHERE clauses only match rows that still hold the old host.

do $$
declare
  old_host constant text := 'sekuhazfyjbdktmoepzb.supabase.co';
  new_host constant text := 'uzyhosbhdiijodyftxil.supabase.co';
begin
  update public.outlets
     set logo_url = replace(logo_url, old_host, new_host)
   where logo_url like '%' || old_host || '%';

  update public.posts
     set cover_image = replace(cover_image, old_host, new_host)
   where cover_image like '%' || old_host || '%';

  -- Inline <img> tags written by the TipTap editor.
  update public.posts
     set content = replace(content, old_host, new_host)
   where content like '%' || old_host || '%';

  update public.settings
     set value = replace(value, old_host, new_host)
   where value like '%' || old_host || '%';

  update public.admins
     set avatar_url = replace(avatar_url, old_host, new_host)
   where avatar_url like '%' || old_host || '%';

  update public.submissions
     set logo_url = replace(logo_url, old_host, new_host)
   where logo_url like '%' || old_host || '%';
end $$;

-- Report anything still pointing at the old project.
select 'outlets.logo_url'   as column, count(*) as remaining from public.outlets    where logo_url    like '%sekuhazfyjbdktmoepzb%'
union all select 'posts.cover_image',   count(*) from public.posts       where cover_image like '%sekuhazfyjbdktmoepzb%'
union all select 'posts.content',       count(*) from public.posts       where content     like '%sekuhazfyjbdktmoepzb%'
union all select 'settings.value',      count(*) from public.settings    where value       like '%sekuhazfyjbdktmoepzb%'
union all select 'admins.avatar_url',   count(*) from public.admins      where avatar_url  like '%sekuhazfyjbdktmoepzb%'
union all select 'submissions.logo_url',count(*) from public.submissions where logo_url    like '%sekuhazfyjbdktmoepzb%';
