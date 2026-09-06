"use server";

import { redirect } from "next/navigation";
import { startSession, endSession } from "@/lib/auth";
import {
  authenticate,
  getAdminByLogin,
  adminsTableReady,
  updateAdmin,
} from "@/lib/admins";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateResetCode, hashResetCode, verifyResetCode } from "@/lib/password";
import { sendMail, resetCodeEmail } from "@/lib/mailer";
import { adminGetSettings } from "@/lib/admin-queries";
import { landingSection, SECTION_HREF } from "@/lib/permissions";
import { loginInput } from "@/lib/validation";

export type LoginState = { error?: string };

const RESET_TTL_MINUTES = 15;
const MAX_CODE_ATTEMPTS = 5;

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginInput.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "ইউজারনেম এবং পাসওয়ার্ড দুটোই দিন।" };
  }

  const result = await authenticate(parsed.data.username, parsed.data.password);
  if (!result.ok) {
    if (result.reason === "inactive") {
      return { error: "এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে। মালিকের সাথে যোগাযোগ করুন।" };
    }
    // Same message for unknown user and wrong password — do not leak which
    // usernames exist.
    return { error: "ইউজারনেম বা পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।" };
  }

  await startSession(result.admin);

  const requested = String(formData.get("next") ?? "");
  if (requested.startsWith("/admin")) redirect(requested);
  redirect(SECTION_HREF[landingSection(result.admin)]);
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

/* -------------------------------------------------------------------------- */
/* Forgot password                                                             */
/* -------------------------------------------------------------------------- */

export type ForgotState = { error?: string; sent?: boolean; login?: string };

/**
 * Emails a short-lived code. Always reports success, so the form cannot be used
 * to discover which usernames or addresses are registered.
 */
export async function requestPasswordReset(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const login = String(formData.get("login") ?? "").trim();
  if (!login) return { error: "ইউজারনেম বা ইমেইল দিন।" };

  if (!(await adminsTableReady())) {
    return {
      error:
        "পাসওয়ার্ড রিসেট করতে হলে ডাটাবেস মাইগ্রেশন (0006) চালাতে হবে। ততক্ষণ ADMIN_PASSWORD দিয়ে লগইন করুন।",
    };
  }

  const admin = await getAdminByLogin(login);

  if (admin?.email) {
    try {
      const code = generateResetCode();
      const expires = new Date(Date.now() + RESET_TTL_MINUTES * 60_000).toISOString();
      const sb = supabaseAdmin();

      // Invalidate any earlier outstanding codes for this account.
      await sb
        .from("admin_reset_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("admin_id", admin.id)
        .is("used_at", null);

      await sb.from("admin_reset_codes").insert({
        admin_id: admin.id,
        code_hash: await hashResetCode(code),
        expires_at: expires,
      });

      const settings = await adminGetSettings();
      const sent = await sendMail({
        to: admin.email,
        subject: `${settings.site_name} — password reset code`,
        html: resetCodeEmail({
          siteName: settings.site_name,
          accent: settings.primary_color,
          code,
          minutes: RESET_TTL_MINUTES,
        }),
      });
      if (!sent.ok) {
        return { error: `ইমেইল পাঠানো যায়নি: ${sent.error}` };
      }
    } catch (e) {
      console.error("[auth] reset request failed:", e);
      return { error: "কোড পাঠানো যায়নি। সার্ভার লগ দেখুন।" };
    }
  }

  return { sent: true, login };
}

export type ResetState = { error?: string };

export async function resetPassword(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const login = String(formData.get("login") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!login || !code) return { error: "কোডটি লিখুন।" };
  if (password.length < 8) return { error: "নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।" };
  if (password !== confirm) return { error: "দুটি পাসওয়ার্ড মিলছে না।" };

  const admin = await getAdminByLogin(login);
  if (!admin) return { error: "কোডটি সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে।" };

  const sb = supabaseAdmin();
  const { data: rows } = await sb
    .from("admin_reset_codes")
    .select("*")
    .eq("admin_id", admin.id)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  const row = (rows ?? [])[0];
  if (!row) return { error: "কোডটি সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে।" };

  if ((row.attempts ?? 0) >= MAX_CODE_ATTEMPTS) {
    await sb
      .from("admin_reset_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", row.id);
    return { error: "অনেকবার ভুল কোড দেওয়া হয়েছে। নতুন কোড চেয়ে নিন।" };
  }

  const ok = await verifyResetCode(code, String(row.code_hash));
  if (!ok) {
    await sb
      .from("admin_reset_codes")
      .update({ attempts: (row.attempts ?? 0) + 1 })
      .eq("id", row.id);
    return { error: "কোডটি সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে।" };
  }

  try {
    await updateAdmin(admin.id, { password });
    await sb
      .from("admin_reset_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", row.id);
  } catch (e) {
    console.error("[auth] password reset failed:", e);
    return { error: "পাসওয়ার্ড পরিবর্তন করা যায়নি। আবার চেষ্টা করুন।" };
  }

  redirect("/admin/login?reset=1");
}
