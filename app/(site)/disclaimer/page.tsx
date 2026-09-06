import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import { ContentPage } from "@/components/site/content-page";
import { canonical } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: canonical("/disclaimer"),
  title: "Disclaimer",
  description: "Terms under which the links and information on this site are provided.",
};

export default async function DisclaimerPage() {
  const s = await getSiteSettings();
  return (
    <ContentPage
      title="Disclaimer"
      content={s.page_disclaimer}
      fallback={[
        "All newspaper, news portal, and channel links listed on this website are compiled purely for the convenience of readers. The content, logo, and information of each site belong to the respective organization. We do not guarantee the accuracy or correctness of any third-party content.",
        "Links may change or stop working without notice. If you find an outdated or incorrect listing, please let us know so we can update it.",
      ]}
    />
  );
}
