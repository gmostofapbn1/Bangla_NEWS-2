"use server";

import { submissionInput } from "@/lib/validation";
import { hasServiceRole } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { uploadImageField } from "@/lib/uploads";

/** Public uploads get a tighter cap than the admin's 8 MB. */
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export type SubmitState = {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function submitSite(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  // Honeypot: real users never fill a hidden "website" field.
  if (String(formData.get("website") ?? "").length > 0) {
    return { ok: true, message: "Thanks! Your submission is in the review queue." };
  }

  const parsed = submissionInput.safeParse({
    outlet_name: formData.get("outlet_name"),
    url: formData.get("url"),
    category_suggestion: formData.get("category_suggestion") ?? "",
    submitter_email: formData.get("submitter_email") ?? "",
    submitter_phone: formData.get("submitter_phone") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }

  const data = parsed.data;

  // This form is public and unauthenticated, so the logo is checked here rather
  // than trusting the browser: images only, and a tighter cap than the admin's
  // 8 MB. Anything rejected fails the submission instead of being dropped
  // silently, so the sender knows their logo did not arrive.
  const logo = formData.get("logo_file");
  if (logo instanceof File && logo.size > 0) {
    if (!logo.type.startsWith("image/")) {
      return {
        ok: false,
        error: "Please upload the logo as an image file.",
        fieldErrors: { logo_file: "Images only (PNG, JPG, WEBP or GIF)." },
      };
    }
    if (logo.size > MAX_LOGO_BYTES) {
      return {
        ok: false,
        error: "That logo is too large.",
        fieldErrors: { logo_file: "Maximum size is 2 MB." },
      };
    }
  }

  if (hasServiceRole()) {
    try {
      let logoUrl: string | null = null;
      try {
        logoUrl = await uploadImageField(formData, "logo_file", "submissions");
      } catch (e) {
        console.error("[submit] logo upload failed:", e);
        return {
          ok: false,
          error: "We couldn't upload that logo. Try a smaller file, or submit without one.",
          fieldErrors: { logo_file: "Upload failed." },
        };
      }

      const { error } = await supabaseAdmin()
        .from("submissions")
        .insert({
          outlet_name: data.outlet_name,
          url: data.url,
          category_suggestion: data.category_suggestion || null,
          logo_url: logoUrl,
          submitter_email: data.submitter_email || null,
          submitter_phone: data.submitter_phone || null,
          notes: data.notes || null,
          status: "pending",
        });
      if (error) throw error;
    } catch (e) {
      console.error("[submit] insert failed:", e);
      return {
        ok: false,
        error: "We couldn't save your submission right now. Please try again shortly.",
      };
    }
  } else {
    // No DB configured (fallback/demo mode) — accept gracefully.
    console.info("[submit] received (no DB configured):", data.outlet_name, data.url);
  }

  return {
    ok: true,
    message:
      "Thanks! Your site has been added to the review queue. We'll publish it after a quick check.",
  };
}
