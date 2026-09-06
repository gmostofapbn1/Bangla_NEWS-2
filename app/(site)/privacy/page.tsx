import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import { ContentPage } from "@/components/site/content-page";
import { canonical } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: canonical("/privacy"),
  title: "Privacy Policy",
  description: "What information this site collects, and how it is used.",
};

export default async function PrivacyPage() {
  const s = await getSiteSettings();
  return (
    <ContentPage
      title="Privacy Policy"
      content={s.page_privacy}
      fallback={[
        "All information shown on this site is compiled for educational and directory purposes only. We do not collect any personal information, other than what is submitted through the contact form, which is used only as needed.",
        "Third-party sites you open from here have their own privacy policies, which we do not control.",
      ]}
    />
  );
}
