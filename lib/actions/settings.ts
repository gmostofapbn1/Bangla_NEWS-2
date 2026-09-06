"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { can } from "@/lib/permissions";
import { hasServiceRole } from "@/lib/env";
import { adminGetSettings, adminSaveSettings } from "@/lib/admin-queries";
import { uploadImageField } from "@/lib/uploads";
import { sendMail, testEmail, verifySmtp } from "@/lib/mailer";
import { settingsInput } from "@/lib/validation";
import type { Settings } from "@/lib/settings";

export type SettingsState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

async function guard(): Promise<string | null> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (!can(admin, "settings")) return "শুধু মালিক সেটিংস পরিবর্তন করতে পারেন।";
  if (!hasServiceRole()) {
    return "Supabase রাইট কনফিগার করা নেই। SUPABASE_SERVICE_ROLE_KEY সেট করুন।";
  }
  return null;
}

function collectFieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}

export async function saveSiteSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const blocked = await guard();
  if (blocked) return { error: blocked };

  const raw = Object.fromEntries(
    [
      "site_name",
      "primary_color",
      "meta_title",
      "meta_description",
      "meta_keywords",
      "google_analytics_id",
      "google_site_verification",
      "adsense_code",
      "smtp_host",
      "smtp_port",
      "smtp_encryption",
      "smtp_username",
      "smtp_password",
      "smtp_from_email",
      "smtp_from_name",
      "social_facebook",
      "social_x",
      "social_instagram",
      "social_pinterest",
      "social_youtube",
      "app_download_url",
      "contact_email",
      "page_about",
      "page_disclaimer",
      "page_privacy",
    ].map((k) => [k, formData.get(k) ?? ""]),
  );

  const parsed = settingsInput.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "নিচের ভুলগুলো ঠিক করুন।",
      fieldErrors: collectFieldErrors(parsed.error.issues),
    };
  }

  const values: Partial<Settings> = { ...parsed.data };

  // A blank SMTP password means "keep what is stored" — the form never renders
  // the saved secret back to the browser, so an empty box must not wipe it.
  if (!String(formData.get("smtp_password") ?? "")) {
    delete values.smtp_password;
  }

  try {
    const logo = await uploadImageField(formData, "logo_file", "branding");
    if (logo) values.site_logo = logo;

    const favicon = await uploadImageField(formData, "favicon_file", "branding");
    if (favicon) values.site_favicon = favicon;

    // Explicit "remove" checkboxes clear an uploaded asset.
    if (formData.get("remove_logo")) values.site_logo = "";
    if (formData.get("remove_favicon")) values.site_favicon = "";

    const { skippedPrivate } = await adminSaveSettings(values);

    // Branding, SEO and footer content all render on public pages.
    revalidatePath("/", "layout");
    revalidatePath("/admin", "layout");

    if (skippedPrivate) {
      return {
        error:
          "অন্য সব সেটিংস সংরক্ষণ হয়েছে, কিন্তু SMTP তথ্য সংরক্ষণ করা যায়নি। মাইগ্রেশন 0006 না চালানো পর্যন্ত SMTP পাসওয়ার্ড নিরাপদে রাখা যায় না, তাই সেটি বাদ দেওয়া হয়েছে।",
      };
    }
  } catch (e) {
    console.error("[settings] save failed:", e);
    const msg = e instanceof Error ? e.message : "";
    return { error: msg || "সেটিংস সংরক্ষণ করা যায়নি।" };
  }

  return { success: "সেটিংস সংরক্ষণ হয়েছে।" };
}

/* -------------------------------------------------------------------------- */
/* SMTP test                                                                   */
/* -------------------------------------------------------------------------- */

export type TestMailState = { error?: string; success?: string };

/**
 * Verifies the saved SMTP credentials and sends one message, so the client can
 * confirm delivery before relying on it for password resets.
 */
export async function sendTestEmail(
  _prev: TestMailState,
  formData: FormData,
): Promise<TestMailState> {
  const blocked = await guard();
  if (blocked) return { error: blocked };

  const to = String(formData.get("to") ?? "").trim();
  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return { error: "একটি সঠিক ইমেইল ঠিকানা দিন।" };
  }

  const verified = await verifySmtp();
  if (!verified.ok) return { error: `SMTP সংযোগ ব্যর্থ: ${verified.error}` };

  const settings = await adminGetSettings();
  const sent = await sendMail({
    to,
    subject: `${settings.site_name} — SMTP test`,
    html: testEmail({ siteName: settings.site_name, accent: settings.primary_color }),
  });
  if (!sent.ok) return { error: `পাঠানো যায়নি: ${sent.error}` };

  return { success: `টেস্ট ইমেইল ${to} ঠিকানায় পাঠানো হয়েছে।` };
}
