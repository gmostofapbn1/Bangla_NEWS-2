/**
 * Home page masthead.
 *
 * The page had no <h1> at all — every heading on it was a section <h2>. For the
 * one page most likely to rank for "newspaper list", that left the strongest
 * on-page signal unused and gave assistive tech no document title to anchor to.
 *
 * The paragraph is not filler: a directory whose body text is almost entirely
 * outlet names reads as thin to both search engines and answer engines, which
 * need a sentence they can actually quote back.
 */
export function HomeIntro({
  siteName,
  outletCount,
  categoryCount,
}: {
  siteName: string;
  outletCount: number;
  categoryCount: number;
}) {
  return (
    <section className="border-b border-line pb-8">
      <h1 className="font-serif text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
        {siteName} — every newspaper in Bangladesh, in one list
      </h1>
      <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-muted">
        A complete newspaper list of Bangladesh: {outletCount} national dailies,
        online news portals, ePapers, magazines, TV news channels, FM radio
        stations and job sites, sorted into {categoryCount} categories and
        regional listings for all eight divisions. Every link opens the
        publisher&rsquo;s own official website — free to read, nothing to sign up
        for.
      </p>
    </section>
  );
}
