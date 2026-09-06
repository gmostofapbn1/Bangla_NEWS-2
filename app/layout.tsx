import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Newsreader, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site-config";
import { getSiteSettings } from "@/lib/settings";
import { canonical, jsonLdGraph, organizationSchema, websiteSchema } from "@/lib/seo";
import { JsonLd } from "@/components/site/json-ld";
import { accentStyle } from "@/lib/utils";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
});

const hind = Hind_Siliguri({
  variable: "--font-hind",
  weight: ["400", "500", "600", "700"],
  subsets: ["bengali", "latin"],
  display: "swap",
});

/**
 * Metadata is generated rather than static so the title, description, keywords,
 * favicon and Search Console verification all come from Settings → SEO.
 */
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();

  const name = s.site_name || SITE.name;
  const title = s.meta_title || `${name} — All Bangla Newspapers, Online Portals, Radio & More`;
  const description = s.meta_description || SITE.description;
  const keywords = s.meta_keywords
    ? s.meta_keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : [
        "all newspaper list",
        "newspaper list",
        "bangladesh newspaper list",
        "bangla newspaper list",
        "online news portal list",
        "bangla epaper",
        "bd newspaper",
      ];

  return {
    metadataBase: new URL(SITE.url),
    title: { default: title, template: `%s · ${name}` },
    description,
    keywords,
    // Stops the apex/www pair and any ?query variant being indexed as separate
    // pages, which splits the ranking signal for the brand term.
    alternates: canonical("/"),
    // A custom favicon replaces app/favicon.ico when one is uploaded.
    ...(s.site_favicon ? { icons: { icon: s.site_favicon, shortcut: s.site_favicon } } : {}),
    ...(s.google_site_verification
      ? { verification: { google: s.google_site_verification } }
      : {}),
    openGraph: {
      type: "website",
      siteName: name,
      locale: SITE.locale,
      title,
      description,
      url: SITE.url,
      ...(s.site_logo ? { images: [{ url: s.site_logo }] } : {}),
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const s = await getSiteSettings();

  // The AdSense snippet the client pastes is a full <script> tag. Pull the src
  // out so it can be loaded through next/script instead of dangerouslySetInnerHTML.
  const adsenseSrc = s.adsense_code.match(/src=["']([^"']+)["']/i)?.[1] ?? null;

  return (
    <html
      lang="en"
      className={`${inter.variable} ${newsreader.variable} ${hind.variable} h-full antialiased`}
      // Brand colour from Settings → General cascades to every accent token.
      style={accentStyle(s.primary_color)}
    >
      <body className="min-h-full bg-paper text-ink">
        {/* Identity of the site itself. Present on every page so a brand-name
            search has an unambiguous organisation to resolve to. */}
        <JsonLd data={jsonLdGraph(organizationSchema(s), websiteSchema(s))} />
        {children}

        {/* Google Analytics */}
        {s.google_analytics_id && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${s.google_analytics_id}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${s.google_analytics_id}');`}
            </Script>
          </>
        )}

        {/* Google AdSense */}
        {adsenseSrc && (
          <Script src={adsenseSrc} crossOrigin="anonymous" strategy="afterInteractive" />
        )}
      </body>
    </html>
  );
}
