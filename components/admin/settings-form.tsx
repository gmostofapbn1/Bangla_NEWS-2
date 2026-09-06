"use client";

import { useActionState } from "react";
import {
  Building2,
  Search,
  Mail,
  Megaphone,
  Share2,
  FileText,
  Loader2,
} from "lucide-react";
import { saveSiteSettings, type SettingsState } from "@/lib/actions/settings";
import {
  Field,
  TextArea,
  Select,
  ErrorBanner,
  SuccessBanner,
  ImageField,
} from "./form-kit";
import { ColorField } from "./color-field";
import { RichEditor } from "./rich-editor";
import { toRichTextHtml } from "@/lib/utils";
import { Card, FormSection } from "./ui";
import type { Settings } from "@/lib/settings";

/**
 * One footer page (About / Disclaimer / Privacy) with the same rich-text
 * toolbar the blog editor uses — headings, bold, numbered and bulleted lists,
 * alignment and justify. These used to be plain textareas, so none of that
 * formatting was reachable; the HTML posts through a hidden input under `name`.
 */
function PageEditor({
  label,
  name,
  defaultValue,
  placeholder,
  error,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder: string;
  error?: string;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[0.8125rem] font-semibold text-a-ink-soft">
        {label}
      </span>
      <RichEditor
        name={name}
        // Copy written before this was a rich-text field is plain text; convert
        // its blank-line paragraphs to real <p> tags or TipTap collapses them
        // all into one and the next save persists the damage.
        defaultValue={toRichTextHtml(defaultValue)}
        placeholder={placeholder}
        minHeight={240}
      />
      {error && <p className="mt-1.5 text-xs font-medium text-accent">{error}</p>}
    </div>
  );
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    saveSiteSettings,
    {},
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      <ErrorBanner message={state.error} />
      <SuccessBanner message={state.success} />

      {/* ---------------- General ---------------- */}
      <Card>
        <div id="general" className="scroll-mt-24">
          <FormSection
            title="সাধারণ"
            description="ওয়েবসাইটের পরিচয় — নাম, লোগো এবং ব্র্যান্ড রং।"
            icon={Building2}
          >
            <Field
              label="ওয়েবসাইটের নাম"
              name="site_name"
              required
              defaultValue={settings.site_name}
              error={fe.site_name}
              placeholder="All Newspaper List"
              hint="হেডার, ফুটার, ব্রাউজার ট্যাব এবং ইমেইলে এই নামটি ব্যবহৃত হবে।"
            />

            <ImageField
              label="ওয়েবসাইটের লোগো (JPG / PNG / WEBP / GIF, সর্বোচ্চ ৮ MB)"
              name="logo_file"
              currentUrl={settings.site_logo || null}
              removable="logo"
              preview="wide"
              hint="লোগো আপলোড না করলে হেডারে ডিফল্ট আইকনটি দেখানো হবে। প্রস্থ×উচ্চতা ১৮০×৫০ পিক্সেলের কাছাকাছি ট্রান্সপারেন্ট PNG সবচেয়ে ভালো দেখায় — ছোট/বড় হলেও হেডারে নিজে থেকেই ফিট হয়ে যাবে।"
            />

            <ImageField
              label="Favicon (ব্রাউজার ট্যাবের ছোট আইকন)"
              name="favicon_file"
              currentUrl={settings.site_favicon || null}
              removable="favicon"
              preview="square"
              hint="বর্গাকার ছবি দিন — ৫১২×৫১২ পিক্সেল হলে সবচেয়ে ভালো (কমপক্ষে ৩২×৩২)। সাধারণত লোগোর শুধু আইকন অংশটুকু ব্যবহার করলে ছোট সাইজে বেশি স্পষ্ট দেখায়।"
            />

            <ColorField
              name="primary_color"
              label="ওয়েবসাইটের প্রাইমারি রং (হেডার, বাটন ইত্যাদির রং)"
              defaultValue={settings.primary_color}
              error={fe.primary_color}
              hint="ডিফল্ট রং লাল (#c8102e)। পরিবর্তন করলে পুরো ওয়েবসাইট এবং এই এডমিন প্যানেলের রংও বদলে যাবে।"
            />
          </FormSection>
        </div>
      </Card>

      {/* ---------------- SEO ---------------- */}
      <Card>
        <div id="seo" className="scroll-mt-24">
          <FormSection
            title="এসইও (SEO)"
            description="সার্চ ইঞ্জিনে ওয়েবসাইটটি কীভাবে দেখাবে।"
            icon={Search}
          >
            <Field
              label="মেটা টাইটেল (হোমপেজের ডিফল্ট টাইটেল ট্যাগ)"
              name="meta_title"
              defaultValue={settings.meta_title}
              error={fe.meta_title}
              placeholder="যেমন: All Newspaper List - বাংলাদেশের সব পত্রিকার তালিকা"
            />
            <TextArea
              label="মেটা ডেসক্রিপশন"
              name="meta_description"
              defaultValue={settings.meta_description}
              error={fe.meta_description}
              rows={3}
              placeholder="সার্চ ইঞ্জিনে যেভাবে ওয়েবসাইটের বর্ণনা দেখাবে (সর্বোচ্চ ১৬০ ক্যারেক্টার সুপারিশকৃত)"
            />
            <Field
              label="মেটা কীওয়ার্ড (কমা দিয়ে আলাদা করুন)"
              name="meta_keywords"
              defaultValue={settings.meta_keywords}
              error={fe.meta_keywords}
              placeholder="যেমন: বাংলা পত্রিকা, বাংলাদেশ নিউজ, অনলাইন নিউজ পোর্টাল"
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Google Analytics ID (ঐচ্ছিক)"
                name="google_analytics_id"
                dir="ltr"
                defaultValue={settings.google_analytics_id}
                error={fe.google_analytics_id}
                placeholder="G-XXXXXXXXXX"
                hint="দিলে প্রতিটি পেজে Analytics স্ক্রিপ্ট যুক্ত হবে।"
              />
              <Field
                label="Google Site Verification কোড (ঐচ্ছিক)"
                name="google_site_verification"
                dir="ltr"
                defaultValue={settings.google_site_verification}
                error={fe.google_site_verification}
                placeholder="Google Search Console থেকে পাওয়া verification কোড"
              />
            </div>
          </FormSection>
        </div>
      </Card>

      {/* ---------------- SMTP ---------------- */}
      <Card>
        <div id="email" className="scroll-mt-24">
          <FormSection
            title="ইমেইল কনফিগারেশন (SMTP)"
            description="এডমিন “পাসওয়ার্ড ভুলে গেছেন” ব্যবহার করলে ভেরিফিকেশন কোডটি এই সার্ভার দিয়েই পাঠানো হবে।"
            icon={Mail}
          >
            <Field
              label="SMTP Host"
              name="smtp_host"
              dir="ltr"
              defaultValue={settings.smtp_host}
              error={fe.smtp_host}
              placeholder="যেমন: smtp.gmail.com"
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="SMTP Port"
                name="smtp_port"
                dir="ltr"
                defaultValue={settings.smtp_port}
                error={fe.smtp_port}
                placeholder="587"
              />
              <Select
                label="এনক্রিপশন"
                name="smtp_encryption"
                defaultValue={settings.smtp_encryption}
                error={fe.smtp_encryption}
                options={[
                  { value: "tls", label: "TLS (সাধারণত পোর্ট ৫৮৭)" },
                  { value: "ssl", label: "SSL (সাধারণত পোর্ট ৪৬৫)" },
                  { value: "none", label: "কোনোটিই নয়" },
                ]}
              />
            </div>
            <Field
              label="SMTP ইউজারনেম (সাধারণত ইমেইল ঠিকানা)"
              name="smtp_username"
              dir="ltr"
              autoComplete="off"
              defaultValue={settings.smtp_username}
              error={fe.smtp_username}
              placeholder="you@example.com"
            />
            <Field
              label="SMTP পাসওয়ার্ড"
              name="smtp_password"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              error={fe.smtp_password}
              placeholder={settings.smtp_password ? "•••••••• (সংরক্ষিত আছে)" : "পাসওয়ার্ড দিন"}
              hint={
                settings.smtp_password
                  ? "পাসওয়ার্ড সংরক্ষিত আছে। বদলাতে না চাইলে ঘরটি ফাঁকা রাখুন।"
                  : "Gmail ব্যবহার করলে সাধারণ পাসওয়ার্ড নয় — App Password লাগবে।"
              }
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="From ইমেইল"
                name="smtp_from_email"
                dir="ltr"
                defaultValue={settings.smtp_from_email}
                error={fe.smtp_from_email}
                placeholder="you@example.com"
              />
              <Field
                label="From নাম"
                name="smtp_from_name"
                defaultValue={settings.smtp_from_name}
                error={fe.smtp_from_name}
                placeholder="যেমন: All Newspaper List"
              />
            </div>
          </FormSection>
        </div>
      </Card>

      {/* ---------------- AdSense ---------------- */}
      <Card>
        <div id="ads" className="scroll-mt-24">
          <FormSection
            title="Google AdSense"
            description="আপনার Google AdSense অ্যাকাউন্ট থেকে পাওয়া কোডটি নিচে পেস্ট করে সংরক্ষণ করুন। সেভ করার সাথে সাথে এটি ওয়েবসাইটের প্রতিটি পেজের <head> অংশে বসে যাবে এবং Google Ads দেখানো শুরু হবে।"
            icon={Megaphone}
          >
            <TextArea
              label="AdSense কোড"
              name="adsense_code"
              defaultValue={settings.adsense_code}
              error={fe.adsense_code}
              rows={5}
              mono
              placeholder={`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>`}
              hint="ফাঁকা রাখলে সাইটে কোনো AdSense কোড বসবে না। AdSense অ্যাকাউন্ট এখনো রিভিউ/অনুমোদিত না হলে ads দেখাতে কিছুদিন সময় লাগতে পারে — এটা সম্পূর্ণ Google এর পক্ষ থেকে।"
            />
          </FormSection>
        </div>
      </Card>

      {/* ---------------- Social ---------------- */}
      <Card>
        <div id="social" className="scroll-mt-24">
          <FormSection
            title="ফুটার সোশ্যাল মিডিয়া লিংক"
            description="যে লিংকগুলো দেবেন শুধু সেগুলোর আইকনই ফুটারে দেখাবে। ফাঁকা রাখা আইকন ফুটারে দেখানো হবে না।"
            icon={Share2}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Facebook পেজ/প্রোফাইল লিংক"
                name="social_facebook"
                dir="ltr"
                defaultValue={settings.social_facebook}
                error={fe.social_facebook}
                placeholder="https://www.facebook.com/yourpage"
              />
              <Field
                label="X (Twitter) লিংক"
                name="social_x"
                dir="ltr"
                defaultValue={settings.social_x}
                error={fe.social_x}
                placeholder="https://x.com/yourhandle"
              />
              <Field
                label="Instagram লিংক"
                name="social_instagram"
                dir="ltr"
                defaultValue={settings.social_instagram}
                error={fe.social_instagram}
                placeholder="https://www.instagram.com/yourprofile"
              />
              <Field
                label="Pinterest লিংক"
                name="social_pinterest"
                dir="ltr"
                defaultValue={settings.social_pinterest}
                error={fe.social_pinterest}
                placeholder="https://www.pinterest.com/yourprofile"
              />
              <Field
                label="YouTube লিংক"
                name="social_youtube"
                dir="ltr"
                defaultValue={settings.social_youtube}
                error={fe.social_youtube}
                placeholder="https://youtube.com/@yourchannel"
              />
              <Field
                label="যোগাযোগের ইমেইল (ঐচ্ছিক)"
                name="contact_email"
                dir="ltr"
                defaultValue={settings.contact_email}
                error={fe.contact_email}
                placeholder="contact@example.com"
                hint="দিলে ফুটারে একটি “যোগাযোগ” লিংক দেখাবে।"
              />
            </div>
            <Field
              label="অ্যাপ ডাউনলোড লিংক (Google Play/অন্য কোনো লিংক)"
              name="app_download_url"
              dir="ltr"
              defaultValue={settings.app_download_url}
              error={fe.app_download_url}
              placeholder="https://play.google.com/store/apps/details?id=..."
              hint="ফাঁকা রাখলে ফুটারে “Download App” বাটনটি দেখানো হবে না।"
            />
          </FormSection>
        </div>
      </Card>

      {/* ---------------- Footer pages ---------------- */}
      <Card>
        <div id="pages" className="scroll-mt-24">
          <FormSection
            title="ফুটার পেজের কনটেন্ট"
            description="About Us, Disclaimer ও Privacy Policy পেজের লেখা। ব্লগ পোস্টের মতোই টুলবার দিয়ে হেডিং, বোল্ড, ইটালিক, নাম্বার লিস্ট, বুলেট লিস্ট, মাঝ বরাবর (Align Center), দুই পাশ সমান (Justify), লিংক ও ছবি যোগ করা যাবে। ঘরটি ফাঁকা রাখলে ওয়েবসাইটের ডিফল্ট লেখা দেখাবে।"
            icon={FileText}
          >
            <PageEditor
              label="About Us পেজের কনটেন্ট"
              name="page_about"
              defaultValue={settings.page_about}
              error={fe.page_about}
              placeholder="আমাদের সম্পর্কে লিখুন — এই ডিরেক্টরিটি কী এবং কাদের জন্য।"
            />
            <PageEditor
              label="Disclaimer পেজের কনটেন্ট"
              name="page_disclaimer"
              defaultValue={settings.page_disclaimer}
              error={fe.page_disclaimer}
              placeholder="দায়মুক্তি বিজ্ঞপ্তি লিখুন — লিংকগুলো কেন এবং কীভাবে সংকলন করা হয়েছে।"
            />
            <PageEditor
              label="Privacy Policy পেজের কনটেন্ট"
              name="page_privacy"
              defaultValue={settings.page_privacy}
              error={fe.page_privacy}
              placeholder="গোপনীয়তা নীতি লিখুন — কী তথ্য সংগ্রহ করা হয় এবং কীভাবে ব্যবহৃত হয়।"
            />
          </FormSection>
        </div>
      </Card>

      {/* Sticky save bar — a settings page this long should never make the
          client scroll to the bottom to find the button. */}
      <div className="sticky bottom-4 z-20">
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-a)] border border-a-line bg-a-surface/95 px-4 py-3 shadow-a-pop backdrop-blur">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark active:translate-y-px disabled:pointer-events-none disabled:opacity-55"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
          </button>
          <p className="text-xs text-a-muted">
            সব সেকশনের পরিবর্তন একসাথে সংরক্ষিত হবে।
          </p>
        </div>
      </div>
    </form>
  );
}
