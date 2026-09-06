/**
 * Global site metadata + static navigation config.
 *
 * These are FALLBACKS only. The live name, description and branding come from
 * Settings → General/SEO in the admin, so the client can rename the site
 * without a deploy. Nothing user-facing should hard-code a brand name — that is
 * what left the old "AllNewspaperBangla" wording on the 404 and reader pages.
 */

export const SITE = {
  name: "All Newspaper List",
  shortName: "ANL",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  description:
    "All Newspaper List is a complete newspaper list of Bangladesh — every national daily, online news portal, TV channel, ePaper, FM radio, job site and regional newspaper, listed in one place.",
  locale: "en_BD",
} as const;

/**
 * Ordered groups. Each directory category belongs to a group; groups control
 * how categories are organised in the header mega-menu and on the homepage.
 */
export const GROUPS = {
  newspapers: "National Newspapers",
  portals: "Online News Portals",
  tv: "TV News Channels",
  english: "English Newspapers",
  stock: "Stock Market News",
  epaper: "Bangla ePaper",
  radio: "FM Radio",
  jobs: "Job Portals",
  government: "Government Portals",
  assam: "Assam Newspapers",
  international: "International Newspapers",
  regional: "Local Newspapers",
} as const;

export type GroupKey = keyof typeof GROUPS;

/**
 * Fallback for a category that has never had its homepage cap set (a row from
 * before migration 0009, or the bundled seed dataset). Each category overrides
 * it from the admin — `0` there means "show every outlet".
 */
export const DEFAULT_HOME_LIMIT = 12;

/** Header links shown before the category dropdowns. */
export const PRIMARY_NAV = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: "Bangla ePaper", href: "/epaper" },
] as const;

/**
 * Header links shown *after* the dropdowns, so they sit to the right of
 * "Local Newspaper" rather than ahead of it.
 */
export const TRAILING_NAV = [
  { label: "International Newspaper", href: "/category/international-newspapers" },
] as const;

/** Groups surfaced inside the "All Bangla Newspapers" mega-menu. */
export const NEWSPAPERS_MENU_GROUPS: GroupKey[] = [
  "newspapers",
  "portals",
  "tv",
  "english",
  "stock",
  "radio",
  "jobs",
  "government",
  "assam",
];
