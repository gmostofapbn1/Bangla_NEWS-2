import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronRight } from "lucide-react";
import {
  getPublishedPosts,
  getPost,
  getRecentPosts,
  getPopularPosts,
  getCategoriesWithCounts,
} from "@/lib/queries";
import { ReadingProgress } from "@/components/site/reading-progress";
import { BlogSidebar } from "@/components/site/blog-sidebar";
import { PostClickBeacon } from "@/components/site/post-click-beacon";
import { formatDate, isHtmlContent } from "@/lib/utils";
import { SITE } from "@/lib/site-config";
import { getSiteSettings } from "@/lib/settings";
import { JsonLd } from "@/components/site/json-ld";
import { articleSchema, breadcrumbSchema, canonical, jsonLdGraph } from "@/lib/seo";

export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post" };
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: canonical(`/blog/${slug}`),
    openGraph: {
      type: "article",
      publishedTime: post.published_at ?? post.created_at,
      modifiedTime: post.updated_at,
      ...(post.cover_image ? { images: [post.cover_image] } : {}),
    },
  };
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const [post, recent, popular, categories, settings] = await Promise.all([
    getPost(slug),
    getRecentPosts(6, slug),
    getPopularPosts(5, slug),
    getCategoriesWithCounts(),
    getSiteSettings(),
  ]);
  if (!post) notFound();

  const dateLabel = formatDate(post.published_at ?? post.created_at);
  const readMins = Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200));
  const shareUrl = `${SITE.url}/blog/${post.slug}`;

  return (
    <>
      {/* BlogPosting + breadcrumb: what lets an article show a date and
          headline in results rather than a bare blue link. */}
      <JsonLd
        data={jsonLdGraph(
          articleSchema({
            title: post.title,
            description: post.excerpt,
            image: post.cover_image,
            path: `/blog/${post.slug}`,
            publishedAt: post.published_at ?? post.created_at,
            updatedAt: post.updated_at,
            settings,
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        )}
      />
      <ReadingProgress />
      {/* Count this view (non-blocking, once per load). */}
      <PostClickBeacon id={post.id} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
            <li className="flex items-center gap-1">
              <Link href="/" className="hover:text-accent">Home</Link>
              <ChevronRight className="h-3.5 w-3.5 text-faint" />
            </li>
            <li className="flex items-center gap-1">
              <Link href="/blog" className="hover:text-accent">Blog</Link>
              <ChevronRight className="h-3.5 w-3.5 text-faint" />
            </li>
            <li className="min-w-0 truncate text-ink-soft">{post.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
          {/* Article */}
          <article className="min-w-0">
            <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              {post.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line pb-5">
              <time className="text-sm font-medium text-accent">{dateLabel}</time>
              <span className="text-sm text-muted">{readMins} min read</span>
              <div className="flex items-center gap-2 sm:ml-auto">
                <span className="text-xs font-medium uppercase tracking-wide text-faint">
                  Share
                </span>
                <ShareLink
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  label="Share on Facebook"
                  icon={FacebookIcon}
                />
                <ShareLink
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
                  label="Share on X"
                  icon={XIcon}
                />
                <ShareLink
                  href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${shareUrl}`)}`}
                  label="Share on WhatsApp"
                  icon={WhatsAppIcon}
                />
              </div>
            </div>

            {post.cover_image && (
              <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-line bg-band">
                <Image
                  src={post.cover_image}
                  alt={post.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 700px"
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {post.excerpt && (
              <p className="mt-6 text-lg leading-relaxed text-muted">{post.excerpt}</p>
            )}

            <div className="mt-6">
              {isHtmlContent(post.content) ? (
                <div className={PROSE} dangerouslySetInnerHTML={{ __html: post.content }} />
              ) : (
                <div className={PROSE}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: (props) => (
                        <div className="my-6 overflow-x-auto rounded-xl border border-line">
                          <table className="!my-0 w-full text-sm">{props.children}</table>
                        </div>
                      ),
                    }}
                  >
                    {post.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </article>

          {/* Sidebar */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <BlogSidebar popular={popular} recent={recent} categories={categories} />
          </div>
        </div>
      </div>
    </>
  );
}

function ShareLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="grid h-8 w-8 place-items-center rounded-full bg-accent text-white transition hover:bg-accent-dark"
    >
      <Icon className="h-3.5 w-3.5" />
    </a>
  );
}

/* Inline brand marks — lucide v1 dropped its social icons. */
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H16.7V3.6c-.3 0-1.3-.1-2.45-.1-2.42 0-4.08 1.48-4.08 4.2v2.3H7.5V13h2.67v8h3.33Z" />
    </svg>
  );
}
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.53 3h3.02l-6.6 7.54L21.75 21h-6.08l-4.76-6.22L5.46 21H2.44l7.06-8.07L2.25 3h6.24l4.3 5.69L17.53 3Zm-1.06 16.2h1.67L7.6 4.71H5.8L16.47 19.2Z" />
    </svg>
  );
}
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.16c-.25.69-1.44 1.32-1.98 1.36-.53.05-1.02.24-3.44-.72-2.9-1.14-4.75-4.1-4.9-4.29-.14-.19-1.17-1.56-1.17-2.97 0-1.41.74-2.11 1-2.39.25-.28.55-.35.73-.35.18 0 .37 0 .53.01.17.01.4-.06.62.48.25.6.85 2.06.92 2.21.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.16-.29.36-.42.49-.14.14-.28.28-.12.56.16.28.72 1.18 1.54 1.92 1.06.94 1.95 1.24 2.23 1.38.28.14.44.12.6-.07.18-.19.69-.8.87-1.08.18-.28.37-.23.62-.14.25.09 1.6.76 1.87.9.28.14.46.21.53.32.07.12.07.66-.18 1.35Z" />
    </svg>
  );
}

const PROSE =
  "prose prose-neutral max-w-none " +
  "prose-headings:font-serif prose-headings:tracking-tight prose-headings:text-ink " +
  "prose-h1:text-3xl prose-h2:mt-10 prose-h2:mb-3 prose-h2:text-2xl " +
  "prose-h3:mt-8 prose-h3:mb-2 prose-h3:text-xl " +
  "prose-p:text-[17px] prose-p:leading-8 prose-p:text-ink-soft " +
  "prose-a:font-medium prose-a:text-accent prose-a:no-underline hover:prose-a:underline " +
  "prose-strong:text-ink " +
  "prose-blockquote:rounded-r-xl prose-blockquote:border-l-[3px] prose-blockquote:border-accent prose-blockquote:bg-band prose-blockquote:px-5 prose-blockquote:py-1 prose-blockquote:font-normal prose-blockquote:not-italic prose-blockquote:text-ink " +
  "prose-img:rounded-xl prose-img:border prose-img:border-line prose-img:mx-auto " +
  "prose-hr:border-line " +
  "prose-code:rounded prose-code:bg-band prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[13px] prose-code:font-normal prose-code:before:content-[''] prose-code:after:content-[''] " +
  "prose-pre:rounded-xl prose-pre:border prose-pre:border-line " +
  "prose-li:marker:text-accent prose-li:text-ink-soft";
