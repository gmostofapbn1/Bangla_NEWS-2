-- Migration 0015 — stop two outlet rows linking out to the sister site.
--
-- 0014 rewrote the brand in settings and posts but missed outlets.url. Two
-- ePaper entries ("e Dainik Janata", "e Sangbad Konika") carried
-- https://www.allbanglapaper.com/epaper as their link.
--
-- On the source site those were internal placeholders — rows with no real
-- publisher URL pointed back at that site's own ePaper index. Copied here they
-- became outbound links to a site listing the same 488 outlets, which is
-- exactly the signal Google uses to decide which of two near-identical
-- directories is the original. They are repointed to this site's own ePaper
-- index, preserving the original placeholder intent without the leak.
--
-- These two still need real publisher URLs — set them in Admin → Outlets.
--
-- Idempotent — the WHERE clause stops matching once it has run.

update public.outlets
   set url = 'https://www.allnewspaperlist.com/epaper'
 where url ilike '%allbanglapaper%';

select count(*) as outlets_still_linking_out
  from public.outlets
 where url ilike '%allbanglapaper%';
