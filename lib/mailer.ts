import "server-only";
import nodemailer from "nodemailer";
import { adminGetSettings } from "@/lib/admin-queries";

/**
 * SMTP transport built from the credentials saved in Settings → Email.
 * Nothing is read from the environment, so the client can change mail servers
 * from the admin panel without a redeploy.
 */

export type MailResult = { ok: true } | { ok: false; error: string };

export type SmtpConfig = {
  host: string;
  port: number;
  encryption: "tls" | "ssl" | "none";
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
};

export async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const s = await adminGetSettings();
  const host = s.smtp_host.trim();
  const fromEmail = (s.smtp_from_email || s.smtp_username).trim();
  if (!host || !fromEmail) return null;

  const port = Number(s.smtp_port) || 587;
  const enc = s.smtp_encryption as SmtpConfig["encryption"];
  return {
    host,
    port,
    encryption: enc === "ssl" || enc === "none" ? enc : "tls",
    username: s.smtp_username.trim(),
    password: s.smtp_password,
    fromEmail,
    fromName: s.smtp_from_name.trim() || s.site_name,
  };
}

function buildTransport(cfg: SmtpConfig) {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    // Implicit TLS on 465; STARTTLS is negotiated on 587 when available.
    secure: cfg.encryption === "ssl" || cfg.port === 465,
    requireTLS: cfg.encryption === "tls",
    ignoreTLS: cfg.encryption === "none",
    auth: cfg.username ? { user: cfg.username, pass: cfg.password } : undefined,
  });
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<MailResult> {
  const cfg = await getSmtpConfig();
  if (!cfg) {
    return {
      ok: false,
      error: "SMTP কনফিগার করা নেই। সেটিংস → ইমেইল কনফিগারেশন পূরণ করুন।",
    };
  }
  try {
    const transport = buildTransport(cfg);
    await transport.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text ?? opts.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    });
    return { ok: true };
  } catch (e) {
    console.error("[mailer] send failed:", e);
    const msg = e instanceof Error ? e.message : "Unknown SMTP error";
    return { ok: false, error: msg };
  }
}

/** Verifies the credentials without sending anything. */
export async function verifySmtp(): Promise<MailResult> {
  const cfg = await getSmtpConfig();
  if (!cfg) {
    return { ok: false, error: "SMTP host এবং From ইমেইল পূরণ করুন।" };
  }
  try {
    await buildTransport(cfg).verify();
    return { ok: true };
  } catch (e) {
    console.error("[mailer] verify failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Unknown SMTP error" };
  }
}

/* -------------------------------------------------------------------------- */
/* Templates                                                                   */
/* -------------------------------------------------------------------------- */

function shell(siteName: string, accent: string, body: string): string {
  return `<div style="margin:0;padding:32px 16px;background:#f4f5f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e6e8ec">
    <div style="padding:20px 28px;background:${accent};color:#fff;font-size:16px;font-weight:600">${siteName}</div>
    <div style="padding:28px;color:#1a1c22;font-size:15px;line-height:1.65">${body}</div>
    <div style="padding:16px 28px;background:#fafbfc;border-top:1px solid #eef0f3;color:#7a8089;font-size:12px">
      This is an automated message from ${siteName}.
    </div>
  </div>
</div>`;
}

export function resetCodeEmail(opts: {
  siteName: string;
  accent: string;
  code: string;
  minutes: number;
}): string {
  return shell(
    opts.siteName,
    opts.accent,
    `<p style="margin:0 0 14px">You asked to reset your admin password.</p>
     <p style="margin:0 0 8px">Your verification code is:</p>
     <p style="margin:0 0 18px;font-size:32px;font-weight:700;letter-spacing:8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">${opts.code}</p>
     <p style="margin:0;color:#616770">This code expires in ${opts.minutes} minutes. If you did not request it, you can safely ignore this email — your password will not change.</p>`,
  );
}

export function testEmail(opts: { siteName: string; accent: string }): string {
  return shell(
    opts.siteName,
    opts.accent,
    `<p style="margin:0 0 12px;font-weight:600">SMTP is working. ✅</p>
     <p style="margin:0;color:#616770">This is a test message sent from your admin panel. Password reset codes will be delivered through this same server.</p>`,
  );
}
