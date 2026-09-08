import { SITE } from "@/lib/site-config";
import { profileLinks, type Settings } from "@/lib/settings";

/**
 * Canonical URLs and JSON-LD structured data.
 *
 * Two jobs. Canonicals stop the apex/www pair and any query-string variant from
 * being treated as separate pages, which is what splits ranking signals for a
 * brand term. The schema tells Google what the site *is* — an organisation with
 * a name, a logo and social profiles — which is what a brand-name search needs
 * in order to resolve to this site rather than to the newspapers it links to.
 */

/** Absolute URL for a path, based on NEXT_PUBLIC_SITE_URL. */
export function absoluteUrl(path = "/"): string {
  const base = SITE.url.replace(/\/+$/, "");
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * `alternates.canonical` for a page's metadata. Next resolves this against
 * `metadataBase`, so a root-relative path is enough and stays correct if the
 * domain changes in Settings.
 */
export function canonical(path = "/") {
  return { canonical: path } as const;
}

/* -------------------------------------------------------------------------- */
/* JSON-LD builders                                                            */
/* -------------------------------------------------------------------------- */

type Json = Record<string, unknown>;

/** Stable @id so the graph nodes can reference each other. */
const ORG_ID = () => `${absoluteUrl()}/#organization`;
const SITE_ID = () => `${absoluteUrl()}/#website`;

export function organizationSchema(s: Settings): Json {
  const sameAs = profileLinks(s).map((l) => l.href);
  return {
    "@type": "Organization",
    "@id": ORG_ID(),
    name: s.site_name || SITE.name,
    url: absoluteUrl(),
    ...(s.site_logo
      ? { logo: { "@type": "ImageObject", url: s.site_logo }, image: s.site_logo }
      : {}),
    ...(s.meta_description ? { description: s.meta_description } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(s.contact_email
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            email: s.contact_email,
            contactType: "customer support",
          },
        }
      : {}),
  };
}

export function websiteSchema(s: Settings): Json {
  return {
    "@type": "WebSite",
    "@id": SITE_ID(),
    name: s.site_name || SITE.name,
    url: absoluteUrl(),
    publisher: { "@id": ORG_ID() },
    inLanguage: "en-BD",
    ...(s.meta_description ? { description: s.meta_description } : {}),
    // No `potentialAction`/SearchAction: the site has no /search route, and
    // pointing one at a URL that 404s is worse than omitting it.
  };
}

export type Crumb = { name: string; path: string };

export function breadcrumbSchema(crumbs: Crumb[]): Json {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

export function articleSchema(opts: {
  title: string;
  description?: string | null;
  image?: string | null;
  path: string;
  publishedAt?: string | null;
  updatedAt?: string | null;
  settings: Settings;
}): Json {
  return {
    "@type": "BlogPosting",
    headline: opts.title,
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.image ? { image: [opts.image] } : {}),
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(opts.path) },
    url: absoluteUrl(opts.path),
    ...(opts.publishedAt ? { datePublished: opts.publishedAt } : {}),
    ...(opts.updatedAt ? { dateModified: opts.updatedAt } : {}),
    author: { "@id": ORG_ID() },
    publisher: { "@id": ORG_ID() },
    inLanguage: "en-BD",
  };
}

/** A directory listing page — the outlets it holds, in display order. */
export function collectionSchema(opts: {
  name: string;
  description?: string | null;
  path: string;
  items: { name: string; url: string }[];
}): Json {
  return {
    "@type": "CollectionPage",
    name: opts.name,
    ...(opts.description ? { description: opts.description } : {}),
    url: absoluteUrl(opts.path),
    isPartOf: { "@id": SITE_ID() },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: opts.items.length,
      itemListElement: opts.items.slice(0, 100).map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        url: it.url,
      })),
    },
  };
}

/**
 * A Q&A block. Google and the AI answer engines both read this, but only when
 * the same text is visible on the page — schema that answers a question the
 * page itself does not answer is a structured-data violation, so this is always
 * rendered from the same source as the visible <Faq> list.
 */
export function faqSchema(items: { q: string; a: string }[]): Json {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

/**
 * Wrap nodes in a single `@graph` document. One script tag per page keeps the
 * cross-references (`@id`) resolvable and is what Google prefers.
 */
export function jsonLdGraph(...nodes: Json[]): string {
  return serialize({ "@context": "https://schema.org", "@graph": nodes });
}

/**
 * `<` is escaped so a stray "</script>" inside admin-authored text (a site name
 * or description) cannot terminate the script tag early.
 */
function serialize(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
