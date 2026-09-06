import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import { ContentPage } from "@/components/site/content-page";
import { canonical } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    alternates: canonical("/about"),
    title: "About Us",
    description: `About ${s.site_name} — what this directory is and who it is for.`,
  };
}

export default async function AboutPage() {
  const s = await getSiteSettings();
  return (
    <ContentPage
      title="About Us"
      content={s.page_about}
      fallback={[
        `${s.site_name} is a directory site that compiles Bangla-language newspapers, online news portals, TV channels, e-papers, and many other kinds of sites from Bangladesh and India in one place, so readers can easily find what they need.`,
        "Every listing is organised by category and region, kept up to date, and linked directly to the publisher's own website — no clutter, no detours.",
      ]}
    />
  );
}
