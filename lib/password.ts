import "server-only";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/*
 * Password hashing for admin accounts.
 *
 * scrypt from node:crypto — no native dependency to install or keep compiled,
 * and it is memory-hard, which is what makes brute-forcing a leaked hash
 * expensive. Stored format:
 *
 *   scrypt$<N>$<r>$<p>$<salt-b64>$<hash-b64>
 *
 * The parameters live in the string, so raising the cost later does not
 * invalidate existing hashes — old ones keep verifying with their own values.
 */

const N = 16384; // CPU/memory cost
const R = 8; // block size
const P = 1; // parallelisation
const KEYLEN = 64;
const MAXMEM = 64 * 1024 * 1024; // scrypt needs ~128*N*r bytes; give it headroom

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password.normalize("NFKC"), salt, KEYLEN, {
    N,
    r: R,
    p: P,
    maxmem: MAXMEM,
  });
  return [
    "scrypt",
    N,
    R,
    P,
    salt.toString("base64"),
    hash.toString("base64"),
  ].join("$");
}

/** Constant-time verify. Returns false on any malformed stored value. */
export async function verifyPasswordHash(
  password: string,
  stored: string,
): Promise<boolean> {
  try {
    const parts = stored.split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") return false;
    const [, n, r, p, saltB64, hashB64] = parts;
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");
    const actual = await scrypt(password.normalize("NFKC"), salt, expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: MAXMEM,
    });
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** A 6-digit numeric code for the "forgot password" email. */
export function generateResetCode(): string {
  // rejection-free: read 4 bytes, map into 000000–999999
  const n = randomBytes(4).readUInt32BE(0) % 1_000_000;
  return String(n).padStart(6, "0");
}

/** Reset codes are stored hashed, so a DB leak cannot be replayed. */
export async function hashResetCode(code: string): Promise<string> {
  return hashPassword(code);
}

export async function verifyResetCode(
  code: string,
  stored: string,
): Promise<boolean> {
  return verifyPasswordHash(code, stored);
}
