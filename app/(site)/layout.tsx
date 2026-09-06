import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { BackToTop } from "@/components/site/back-to-top";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    // Full-height flex column: `main` takes the slack so the footer's `mt-auto`
    // always lands it at the bottom of the page, however short the content is.
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
