import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, signSession, readSession } from "./auth-token";
import { getAdminById, type AdminAccount } from "./admins";
import { can, type SectionKey } from "./permissions";

/**
 * Session helpers. The cookie proves *who* is signed in; authorisation is
 * always re-read from the database, so deactivating or demoting an account
 * takes effect on the next request rather than when the cookie expires.
 */

export async function startSession(admin: AdminAccount): Promise<void> {
  const token = await signSession({
    sub: admin.id,
    username: admin.username,
    role: admin.role,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * The signed-in admin, or null. Deduped per request so the layout, the page and
 * any server action in the same render share a single lookup.
 */
export const getCurrentAdmin = cache(async (): Promise<AdminAccount | null> => {
  const store = await cookies();
  const session = await readSession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const admin = await getAdminById(session.sub);
  if (!admin || !admin.is_active) return null;
  return admin;
});

/** Whether the current request carries a valid, active admin session. */
export async function isAdmin(): Promise<boolean> {
  return (await getCurrentAdmin()) !== null;
}

/** Redirects to the login page when signed out. */
export async function requireAdmin(): Promise<AdminAccount> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/**
 * Guard for a page or server action. Redirects signed-out users to login and
 * anyone lacking the permission to the dashboard with a notice.
 */
export async function requireSection(section: SectionKey): Promise<AdminAccount> {
  const admin = await requireAdmin();
  if (!can(admin, section)) redirect("/admin?denied=" + section);
  return admin;
}

/** Non-redirecting check, for conditionally rendering UI. */
export async function currentCan(section: SectionKey): Promise<boolean> {
  return can(await getCurrentAdmin(), section);
}
