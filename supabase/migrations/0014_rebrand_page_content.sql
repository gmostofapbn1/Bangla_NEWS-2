-- Migration 0014 — replace the sister site's brand in copied page content.
--
-- The About, Disclaimer and Privacy copy was seeded from AllBanglaPaper and
-- still opens "Welcome to AllBanglaPaper.com" — naming a different website on
-- this one. Blog bodies may carry the same reference.
--
-- Deliberately narrow. It rewrites the BRAND ("AllBanglaPaper", "All Bangla
-- Paper" and the .com form) and nothing else. It does NOT touch phrases like
-- "All Bangla Newspapers" or "All Bangla E-Papers": those are category titles
-- and article subjects describing what the directory actually lists, and they
-- are the keywords this site ranks for. A blanket find/replace of "bangla
-- paper" would have mangled real editorial content and thrown away search
-- terms the site wants to keep.
--
-- Idempotent — the WHERE clauses stop matching once it has run.

do $$
begin
  -- regexp_replace with the 'gi' flags, not replace(): replace() is
  -- case-sensitive, so it silently skipped the lowercase domain inside <a href>
  -- links while the case-insensitive WHERE still matched those rows.
  --
  -- The domain goes first and includes the scheme+host, so links land on this
  -- site's equivalent page — both directories share the same paths, and a
  -- sister site linking out on the same keywords is how Google decides one of
  -- them is the duplicate.
  update public.settings
     set value = regexp_replace(
                   regexp_replace(
                     regexp_replace(value, '(https?://)?(www\.)?allbanglapaper\.com', 'https://www.allnewspaperlist.com', 'gi'),
                     'AllBanglaPaper', 'All Newspaper List', 'gi'),
                   'All Bangla Paper', 'All Newspaper List', 'gi')
   where key in ('page_about', 'page_disclaimer', 'page_privacy')
     and (value ilike '%allbanglapaper%' or value ilike '%all bangla paper%');

  update public.posts
     set content = regexp_replace(
                     regexp_replace(
                       regexp_replace(content, '(https?://)?(www\.)?allbanglapaper\.com', 'https://www.allnewspaperlist.com', 'gi'),
                       'AllBanglaPaper', 'All Newspaper List', 'gi'),
                     'All Bangla Paper', 'All Newspaper List', 'gi'),
         excerpt = regexp_replace(
                     regexp_replace(
                       regexp_replace(coalesce(excerpt, ''), '(https?://)?(www\.)?allbanglapaper\.com', 'https://www.allnewspaperlist.com', 'gi'),
                       'AllBanglaPaper', 'All Newspaper List', 'gi'),
                     'All Bangla Paper', 'All Newspaper List', 'gi')
   where content ilike '%allbanglapaper%' or content ilike '%all bangla paper%'
      or excerpt ilike '%allbanglapaper%' or excerpt ilike '%all bangla paper%';
end $$;

-- Report anything still naming the other brand.
select 'settings' as source, count(*) as remaining
  from public.settings
 where key in ('page_about', 'page_disclaimer', 'page_privacy')
   and (value ilike '%allbanglapaper%' or value ilike '%all bangla paper%')
union all
select 'posts', count(*)
  from public.posts
 where content ilike '%allbanglapaper%' or content ilike '%all bangla paper%'
    or excerpt ilike '%allbanglapaper%' or excerpt ilike '%all bangla paper%';
