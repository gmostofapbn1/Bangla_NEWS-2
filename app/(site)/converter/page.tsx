import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Converter } from "@/components/converter/converter";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: canonical("/converter"),
  title: "Bangla Converter",
  description:
    "Free Bangla Converter — English to Bangla phonetic typing, Bijoy ⇌ Unicode conversion, and English ⇌ Bangla digit conversion. Runs entirely in your browser.",
};

export default function ConverterPage() {
  return (
    <>
      <PageHero
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Bangla Converter" }]}
        title="Bangla Converter"
        titleBn="বাংলা কনভার্টার"
        description="Type in English and get Bangla, convert between Bijoy and Unicode, and switch digits between ১২৩ and 123 — instantly, right in your browser."
      />
      <div className="mx-auto max-w-4xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <Converter />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Tip title="Phonetic typing">
            Write Banglish the way it sounds — type “bangladesh” and read
            বাংলাদেশ, or “songbad” for সংবাদ.
          </Tip>
          <Tip title="Bijoy ⇌ Unicode">
            Move text between the legacy Bijoy layout and modern Unicode for web
            and print workflows.
          </Tip>
          <Tip title="Digits">
            Convert numbers between English and Bangla numerals for dates, prices
            and headlines.
          </Tip>
        </div>
      </div>
    </>
  );
}

function Tip({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">{children}</p>
    </div>
  );
}
