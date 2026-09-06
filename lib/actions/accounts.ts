"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import {
  ENV_OWNER_ID,
  adminsTableReady,
  checkPassword,
  createAdmin,
  deleteAdmin,
  getAdminById,
  updateAdmin,
} from "@/lib/admins";
import { hasServiceRole } from "@/lib/env";
import { uploadImageField } from "@/lib/uploads";
import {
  ALL_SECTIONS,
  DEFAULT_PERMISSIONS,
  grantableSections,
  type Role,
  type SectionKey,
} from "@/lib/permissions";
import { adminCreateInput, adminUpdateInput, profileInput } from "@/lib/validation";

export type AccountState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

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

/* -------------------------------------------------------------------------- */
/* My profile — any signed-in admin edits their own record                     */
/* -------------------------------------------------------------------------- */

export async function updateProfile(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const me = await getCurrentAdmin();
  if (!me) redirect("/admin/login");

  const parsed = profileInput.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    current_password: formData.get("current_password") ?? "",
    new_password: formData.get("new_password") ?? "",
    confirm_password: formData.get("confirm_password") ?? "",
  });
  if (!parsed.success) {
    return {
      error: "নিচের ভুলগুলো ঠিক করুন।",
      fieldErrors: collectFieldErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;

  if (me.id === ENV_OWNER_ID || !(await adminsTableReady())) {
    return {
      error:
        "প্রোফাইল সংরক্ষণ করতে ডাটাবেস মাইগ্রেশন (0006) চালাতে হবে। তারপর একবার লগআউট করে আবার লগইন করুন।",
    };
  }

  // Password change is optional, but when requested it must be complete.
  if (d.new_password) {
    if (!d.current_password) {
      return {
        error: "বর্তমান পাসওয়ার্ড দিন।",
        fieldErrors: { current_password: "বর্তমান পাসওয়ার্ড দিন" },
      };
    }
    if (d.new_password !== d.confirm_password) {
      return {
        error: "নতুন পাসওয়ার্ড দুটি মিলছে না।",
        fieldErrors: { confirm_password: "পাসওয়ার্ড দুটি মিলছে না" },
      };
    }
    const ok = await checkPassword(me.id, d.current_password);
    if (!ok) {
      return {
        error: "বর্তমান পাসওয়ার্ড ভুল।",
        fieldErrors: { current_password: "পাসওয়ার্ড ভুল" },
      };
    }
  }

  try {
    const avatar = await uploadImageField(formData, "avatar_file", "avatars");
    await updateAdmin(me.id, {
      name: d.name,
      email: d.email,
      ...(avatar ? { avatar_url: avatar } : {}),
      ...(d.new_password ? { password: d.new_password } : {}),
    });
  } catch (e) {
    console.error("[accounts] updateProfile failed:", e);
    const msg = e instanceof Error ? e.message : "";
    return { error: msg || "প্রোফাইল সংরক্ষণ করা যায়নি।" };
  }

  revalidatePath("/admin", "layout");
  return {
    success: d.new_password
      ? "প্রোফাইল ও পাসওয়ার্ড আপডেট হয়েছে।"
      : "প্রোফাইল আপডেট হয়েছে।",
  };
}

/* -------------------------------------------------------------------------- */
/* Admin management — owner only                                               */
/* -------------------------------------------------------------------------- */

async function requireOwner(): Promise<AccountState | null> {
  const me = await getCurrentAdmin();
  if (!me) redirect("/admin/login");
  if (me.role !== "owner") {
    return { error: "শুধু মালিক এডমিন অ্যাকাউন্ট পরিচালনা করতে পারেন।" };
  }
  if (!hasServiceRole()) {
    return { error: "Supabase কনফিগার করা নেই।" };
  }
  if (!(await adminsTableReady())) {
    return {
      error: "এডমিন অ্যাকাউন্ট ব্যবহার করতে ডাটাবেস মাইগ্রেশন (0006) চালান।",
    };
  }
  return null;
}

/** Checked permission boxes, filtered to what the role is allowed to hold. */
function readPermissions(formData: FormData, role: Role): SectionKey[] {
  if (role === "owner") return [...ALL_SECTIONS];
  const allowed = grantableSections(role);
  const picked = formData
    .getAll("permissions")
    .map(String)
    .filter((p): p is SectionKey => allowed.includes(p as SectionKey));
  // An account with no sections at all could not use the panel; fall back.
  return picked.length > 0 ? picked : DEFAULT_PERMISSIONS[role];
}

export async function createAdminAccount(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const blocked = await requireOwner();
  if (blocked) return blocked;

  const parsed = adminCreateInput.safeParse({
    username: formData.get("username"),
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
    role: formData.get("role") ?? "admin",
    is_active: String(formData.get("is_active") ?? "") !== "",
  });
  if (!parsed.success) {
    return {
      error: "নিচের ভুলগুলো ঠিক করুন।",
      fieldErrors: collectFieldErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;

  // There is only ever one owner — the account that bootstrapped the panel.
  if (d.role === "owner") {
    return { error: "নতুন মালিক অ্যাকাউন্ট তৈরি করা যায় না।" };
  }

  try {
    const avatar = await uploadImageField(formData, "avatar_file", "avatars");
    await createAdmin({
      username: d.username,
      name: d.name,
      email: d.email,
      avatar_url: avatar,
      password: d.password,
      role: d.role,
      permissions: readPermissions(formData, d.role),
    });
  } catch (e) {
    console.error("[accounts] createAdminAccount failed:", e);
    const msg = e instanceof Error ? e.message : "";
    if (/duplicate|unique/i.test(msg)) {
      return {
        error: "এই ইউজারনেম বা ইমেইল আগে থেকেই ব্যবহার হচ্ছে।",
        fieldErrors: { username: "আগে থেকেই ব্যবহৃত" },
      };
    }
    return { error: msg || "অ্যাকাউন্টটি তৈরি করা যায়নি।" };
  }

  revalidatePath("/admin/admins");
  redirect("/admin/admins");
}

export async function updateAdminAccount(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const blocked = await requireOwner();
  if (blocked) return blocked;

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।" };

  const target = await getAdminById(id);
  if (!target) return { error: "অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।" };

  const parsed = adminUpdateInput.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    role: formData.get("role") ?? target.role,
    is_active: String(formData.get("is_active") ?? "") !== "",
    password: formData.get("password") ?? "",
  });
  if (!parsed.success) {
    return {
      error: "নিচের ভুলগুলো ঠিক করুন।",
      fieldErrors: collectFieldErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;

  // The owner row is the recovery account: it cannot be demoted or disabled,
  // and no other account can be promoted into a second owner.
  const role: Role = target.role === "owner" ? "owner" : d.role === "owner" ? target.role : d.role;
  const isActive = target.role === "owner" ? true : d.is_active;

  try {
    const avatar = await uploadImageField(formData, "avatar_file", "avatars");
    await updateAdmin(id, {
      name: d.name,
      email: d.email,
      ...(avatar ? { avatar_url: avatar } : {}),
      role,
      permissions: readPermissions(formData, role),
      is_active: isActive,
      ...(d.password ? { password: d.password } : {}),
    });
  } catch (e) {
    console.error("[accounts] updateAdminAccount failed:", e);
    const msg = e instanceof Error ? e.message : "";
    if (/duplicate|unique/i.test(msg)) {
      return { error: "এই ইমেইল আগে থেকেই ব্যবহার হচ্ছে।" };
    }
    return { error: msg || "পরিবর্তন সংরক্ষণ করা যায়নি।" };
  }

  revalidatePath("/admin/admins");
  redirect("/admin/admins");
}

export async function deleteAdminAccount(formData: FormData) {
  const blocked = await requireOwner();
  if (blocked) return;

  const id = String(formData.get("id") ?? "");
  const me = await getCurrentAdmin();
  // Never let an owner delete themselves out of the panel.
  if (id && id !== me?.id) {
    try {
      await deleteAdmin(id);
    } catch (e) {
      console.error("[accounts] deleteAdminAccount failed:", e);
    }
  }
  revalidatePath("/admin/admins");
  redirect("/admin/admins");
}
