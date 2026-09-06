import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./permissions";

/**
 * Edge-safe admin session token helpers (jose only — no Node APIs, no
 * next/headers). Safe to import from proxy.ts.
 *
 * The token carries who is signed in so the shell can render without a lookup,
 * but it is never trusted for authorisation: `lib/auth.ts` re-reads the account
 * from the database on every request, so revoking or demoting an admin takes
 * effect immediately instead of when their 7-day cookie expires.
 */

export const SESSION_COOKIE = "anb_admin";

export type SessionPayload = {
  /** admins.id */
  sub: string;
  username: string;
  role: Role;
};

function getSecret(): Uint8Array {
  const s = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!s) {
    throw new Error(
      "ADMIN_SESSION_SECRET (or ADMIN_PASSWORD) must be set for admin auth.",
    );
  }
  return new TextEncoder().encode(s);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ username: payload.username, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

/** Decode + signature check only. Returns null when absent, expired or forged. */
export async function readSession(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || typeof payload.username !== "string") return null;
    return {
      sub: payload.sub,
      username: payload.username,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

/** Cheap boolean gate for the proxy — a valid signature, nothing more. */
export async function verifySession(
  token: string | undefined | null,
): Promise<boolean> {
  return (await readSession(token)) !== null;
}
