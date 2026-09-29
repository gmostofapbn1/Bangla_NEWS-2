import { notFound, permanentRedirect } from "next/navigation";
import { getAllCategories } from "@/lib/queries";
import { categoryForGroup } from "@/lib/category-roles";

export const revalidate = 3600;

/**
 * /epaper predates the ePaper category having an editable URL of its own. It
 * rendered exactly the outlets /category/<epaper slug> renders, so two URLs
 * competed for one listing, and it looked the category up by the literal slug
 * "epaper" — which stopped matching, and emptied the page, the moment the
 * client renamed it. It now forwards to wherever that category currently
 * lives, so old links and bookmarks keep working.
 */
export default async function EpaperPage() {
  const epaper = categoryForGroup(await getAllCategories(), "epaper");
  if (!epaper) notFound();
  permanentRedirect(`/category/${epaper.slug}`);
}
