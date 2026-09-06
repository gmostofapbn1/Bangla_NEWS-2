/**
 * Renders a pre-serialised JSON-LD document.
 *
 * The string is built by `lib/seo.ts`, which already escapes `<`, so a site
 * name or description written in the admin cannot break out of the script tag.
 * A plain <script> (not next/script) keeps it in the server-rendered HTML,
 * which is what crawlers read.
 */
export function JsonLd({ data }: { data: string }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: data }}
    />
  );
}
