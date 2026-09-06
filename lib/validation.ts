import { z } from "zod";

/**
 * Slugs are normalised with `toSlug()` before they reach validation, so this
 * only guards the result. It is never what the admin has to type: they may
 * enter "Khulna Division News" or leave the box empty to inherit the title.
 * Unicode letters are allowed so Bangla titles produce a usable slug.
 */
const slugRule = z
  .string()
  .trim()
  .min(1, "একটি slug দিন, অথবা শিরোনাম লিখুন — slug নিজে থেকেই তৈরি হবে")
  .max(90)
  // \p{M} keeps Bengali vowel signs, which are combining marks, not letters.
  .regex(/^[\p{L}\p{N}\p{M}-]+$/u, "Slug can only contain letters, numbers and hyphens");

export const loginInput = z.object({
  username: z.string().trim().min(1, "ইউজারনেম দিন").max(80),
  password: z.string().min(1, "পাসওয়ার্ড দিন"),
});

/** Usernames are the login handle, so keep them tight and predictable. */
const usernameRule = z
  .string()
  .trim()
  .min(3, "ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে")
  .max(40)
  .regex(/^[a-zA-Z0-9._-]+$/, "শুধু ইংরেজি অক্ষর, সংখ্যা এবং . _ - ব্যবহার করুন");

const optionalEmail = z
  .union([z.literal(""), z.email("সঠিক ইমেইল ঠিকানা দিন").max(160)])
  .optional()
  .default("");

export const adminCreateInput = z.object({
  username: usernameRule,
  name: z.string().trim().max(120).optional().default(""),
  email: optionalEmail,
  password: z.string().min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে").max(200),
  role: z.enum(["owner", "admin", "author"]),
  is_active: z.boolean().default(true),
});

export const adminUpdateInput = z.object({
  name: z.string().trim().max(120).optional().default(""),
  email: optionalEmail,
  role: z.enum(["owner", "admin", "author"]),
  is_active: z.boolean().default(true),
  password: z
    .union([z.literal(""), z.string().min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে").max(200)])
    .optional()
    .default(""),
});

export const profileInput = z.object({
  name: z.string().trim().max(120).optional().default(""),
  email: optionalEmail,
  current_password: z.string().optional().default(""),
  new_password: z
    .union([z.literal(""), z.string().min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে").max(200)])
    .optional()
    .default(""),
  confirm_password: z.string().optional().default(""),
});

export const submissionInput = z.object({
  outlet_name: z.string().trim().min(2, "Please enter the site name").max(160),
  url: z.url("Enter a valid URL including https://").max(400),
  category_suggestion: z.string().trim().max(120).optional().default(""),
  submitter_email: z
    .union([z.literal(""), z.email("Enter a valid email").max(160)])
    .optional()
    .default(""),
  // Deliberately loose: submitters write +880, 01x, spaces, dashes and
  // brackets, and rejecting any of those buys nothing for a field a human
  // reads off the moderation queue.
  submitter_phone: z
    .union([
      z.literal(""),
      z
        .string()
        .trim()
        .min(6, "Enter a valid mobile number")
        .max(32)
        .regex(/^[0-9+()\-.\s]+$/, "Use digits, spaces and + ( ) - only"),
    ])
    .optional()
    .default(""),
  notes: z.string().trim().max(1000).optional().default(""),
});

export const outletInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(160),
  name_bn: z.string().trim().max(160).optional().default(""),
  url: z.url("Enter a valid URL").max(400),
  category_slug: z.string().trim().min(1, "Choose a category"),
  logo_url: z.string().trim().max(600).optional().default(""),
  description: z.string().trim().max(1000).optional().default(""),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  open_external: z.boolean().default(false),
  sort_order: z.number().int().min(0).max(99999).default(0),
});

export const categoryInput = z.object({
  slug: slugRule,
  title: z.string().trim().min(1, "Title is required").max(160),
  title_bn: z.string().trim().max(160).optional().default(""),
  description: z.string().trim().max(1200).optional().default(""),
  group_key: z.string().trim().min(1, "Group is required"),
  section_type: z.enum(["outlet_grid", "division_grid"]).default("outlet_grid"),
  parent_slug: z.string().trim().max(90).optional().default(""),
  accent: z.string().trim().max(20).optional().default(""),
  sort_order: z.number().int().min(0).max(99999).default(0),
  show_on_home: z.boolean().default(false),
  /**
   * Homepage cap for this category; 0 = show every outlet it contains. Bounded
   * at 9999 to match the smallint column and its CHECK (migration 0009).
   */
  home_limit: z.number().int().min(0).max(9999).default(12),
  is_active: z.boolean().default(true),
});

export const postInput = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: slugRule,
  excerpt: z.string().trim().max(400).optional().default(""),
  content: z.string().trim().min(1, "Content is required"),
  cover_image: z.string().trim().max(600).optional().default(""),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  sort_order: z.number().int().min(0).max(99999).default(0),
});

export const settingsInput = z.object({
  site_name: z.string().trim().min(1, "ওয়েবসাইটের নাম দিন").max(120),
  primary_color: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "সঠিক হেক্স কালার দিন, যেমন #c8102e"),
  meta_title: z.string().trim().max(200).optional().default(""),
  meta_description: z.string().trim().max(400).optional().default(""),
  meta_keywords: z.string().trim().max(600).optional().default(""),
  google_analytics_id: z.string().trim().max(60).optional().default(""),
  google_site_verification: z.string().trim().max(200).optional().default(""),
  adsense_code: z.string().trim().max(4000).optional().default(""),
  smtp_host: z.string().trim().max(160).optional().default(""),
  smtp_port: z.string().trim().max(6).optional().default("587"),
  smtp_encryption: z.enum(["tls", "ssl", "none"]).default("tls"),
  smtp_username: z.string().trim().max(160).optional().default(""),
  smtp_password: z.string().max(200).optional().default(""),
  smtp_from_email: z
    .union([z.literal(""), z.email("সঠিক ইমেইল ঠিকানা দিন").max(160)])
    .optional()
    .default(""),
  smtp_from_name: z.string().trim().max(120).optional().default(""),
  social_facebook: z.string().trim().max(400).optional().default(""),
  social_x: z.string().trim().max(400).optional().default(""),
  social_instagram: z.string().trim().max(400).optional().default(""),
  social_pinterest: z.string().trim().max(400).optional().default(""),
  social_youtube: z.string().trim().max(400).optional().default(""),
  app_download_url: z.string().trim().max(600).optional().default(""),
  contact_email: z
    .union([z.literal(""), z.email("সঠিক ইমেইল ঠিকানা দিন").max(160)])
    .optional()
    .default(""),
  // Rich text — the editor posts HTML, so the tag overhead needs headroom well
  // beyond what the same copy would take as plain paragraphs.
  page_about: z.string().trim().max(60000).optional().default(""),
  page_disclaimer: z.string().trim().max(60000).optional().default(""),
  page_privacy: z.string().trim().max(60000).optional().default(""),
});

export type SubmissionInput = z.infer<typeof submissionInput>;
export type AdminCreateInput = z.infer<typeof adminCreateInput>;
export type AdminUpdateInput = z.infer<typeof adminUpdateInput>;
export type ProfileInput = z.infer<typeof profileInput>;
export type SettingsInput = z.infer<typeof settingsInput>;
export type OutletInput = z.infer<typeof outletInput>;
export type CategoryInput = z.infer<typeof categoryInput>;
export type PostInput = z.infer<typeof postInput>;
