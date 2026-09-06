import { PageHero } from "./page-hero";
import { toParagraphs } from "@/lib/settings";
import { isBlankRichText, isHtmlContent } from "@/lib/utils";

/**
 * Prose styling for the footer pages. Mirrors the blog article recipe so a
 * heading, list or justified paragraph written in the admin looks the same
 * wherever it is published.
 */
const PROSE =
  "prose prose-neutral max-w-none " +
  "prose-headings:font-serif prose-headings:tracking-tight prose-headings:text-ink " +
  "prose-h1:text-3xl prose-h2:mt-10 prose-h2:mb-3 prose-h2:text-2xl " +
  "prose-h3:mt-8 prose-h3:mb-2 prose-h3:text-xl " +
  "prose-p:text-[1.0625rem] prose-p:leading-[1.75] prose-p:text-ink-soft " +
  "prose-li:text-[1.0625rem] prose-li:leading-[1.75] prose-li:text-ink-soft " +
  "prose-a:font-medium prose-a:text-accent prose-a:no-underline hover:prose-a:underline " +
  "prose-strong:text-ink " +
  "prose-blockquote:rounded-r-xl prose-blockquote:border-l-[3px] prose-blockquote:border-accent prose-blockquote:bg-band prose-blockquote:px-5 prose-blockquote:py-1 prose-blockquote:font-normal prose-blockquote:not-italic prose-blockquote:text-ink " +
  "prose-img:rounded-xl prose-img:border prose-img:border-line prose-img:mx-auto " +
  "prose-hr:border-line";

/**
 * Renders one of the footer content pages (About / Disclaimer / Privacy).
 *
 * The admin now writes these in the rich-text editor, so saved content arrives
 * as HTML and is rendered as-is — headings, bold, numbered and bulleted lists,
 * centred and justified text all survive. Plain text saved before the editor
 * landed still splits into paragraphs on blank lines, and an empty box falls
 * back to the built-in copy so the page is never blank.
 */
export function ContentPage({
  title,
  content,
  fallback,
}: {
  title: string;
  content: string;
  fallback: string[];
}) {
  const empty = isBlankRichText(content);
  const rich = !empty && isHtmlContent(content);
  const paragraphs = empty ? fallback : toParagraphs(content);

  return (
    <>
      {/* narrow: the title sat in a 7xl container above a 3xl body column, so
          it hung well to the left of its own text. */}
      <PageHero title={title} narrow />
      <div className="mx-auto max-w-3xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        {rich ? (
          <div className={PROSE} dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <div className="space-y-5">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-[1.0625rem] leading-[1.75] text-ink-soft">
                {p}
              </p>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
