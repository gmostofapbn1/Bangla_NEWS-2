import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hasServiceRole, env } from "@/lib/env";
import { hashPassword, verifyPasswordHash } from "@/lib/password";
import {
  ALL_SECTIONS,
  DEFAULT_PERMISSIONS,
  type Role,
  type SectionKey,
} from "@/lib/permissions";

export type AdminAccount = {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: Role;
  permissions: SectionKey[];
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
};

/**
 * Identity used when Supabase (or the 0006 migration) is not available yet.
 * Keeps `ADMIN_PASSWORD` working so a deployment can never lock itself out
 * mid-migration — it just cannot manage other accounts until the table exists.
 */
export const ENV_OWNER_ID = "env-owner";

function envOwner(): AdminAccount {
  return {
    id: ENV_OWNER_ID,
    username: "admin",
    name: "Owner",
    email: null,
    avatar_url: null,
    role: "owner",
    permissions: [...ALL_SECTIONS],
    is_active: true,
    last_login_at: null,
    created_at: new Date(0).toISOString(),
  };
}

type Row = Record<string, unknown>;

function mapAdmin(r: Row): AdminAccount {
  const perms = Array.isArray(r.permissions) ? (r.permissions as string[]) : [];
  return {
    id: r.id as string,
    username: r.username as string,
    name: (r.name as string) ?? null,
    email: (r.email as string) ?? null,
    avatar_url: (r.avatar_url as string) ?? null,
    role: ((r.role as Role) ?? "admin") as Role,
    permissions: perms.filter((p): p is SectionKey =>
      (ALL_SECTIONS as string[]).includes(p),
    ),
    is_active: (r.is_active as boolean) ?? true,
    last_login_at: (r.last_login_at as string) ?? null,
    created_at: (r.created_at as string) ?? new Date().toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/* Table availability                                                          */
/* -------------------------------------------------------------------------- */

let tableReady = false;
let lastProbe = 0;

/** How long a negative probe result is trusted before re-checking. */
const PROBE_TTL_MS = 15_000;

/**
 * True once `public.admins` exists.
 *
 * A positive result is cached forever (a table does not un-create itself), but
 * a negative one is only trusted for a few seconds. Caching "missing" for the
 * process lifetime meant that applying migration 0006 against a running server
 * left it permanently in ADMIN_PASSWORD-only mode — the owner account would
 * never bootstrap and the panel kept insisting the migration had not been run,
 * until someone restarted the server.
 */
export async function adminsTableReady(): Promise<boolean> {
  if (!hasServiceRole()) return false;
  if (tableReady) return true;
  if (Date.now() - lastProbe < PROBE_TTL_MS) return false;

  lastProbe = Date.now();
  try {
    // A real row select — a `head: true` count request does NOT report a
    // missing table, which would make this probe wrongly answer "ready" and
    // break the ADMIN_PASSWORD fallback before migration 0006 is applied.
    const { error } = await supabaseAdmin().from("admins").select("id").limit(1);
    tableReady = !error;
  } catch {
    tableReady = false;
  }
  return tableReady;
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

export async function listAdmins(): Promise<AdminAccount[]> {
  if (!(await adminsTableReady())) return [envOwner()];
  const { data } = await supabaseAdmin()
    .from("admins")
    .select("*")
    .order("role", { ascending: true })
    .order("created_at", { ascending: true });
  const rows = (data ?? []).map(mapAdmin);
  // Owner first, then everyone else by creation date.
  return rows.sort((a, b) =>
    a.role === "owner" ? -1 : b.role === "owner" ? 1 : a.created_at.localeCompare(b.created_at),
  );
}

export async function getAdminById(id: string): Promise<AdminAccount | null> {
  if (id === ENV_OWNER_ID) return envOwner();
  if (!(await adminsTableReady())) return null;
  const { data } = await supabaseAdmin().from("admins").select("*").eq("id", id).maybeSingle();
  return data ? mapAdmin(data) : null;
}

/**
 * Look up by username or email.
 *
 * Usernames and emails are stored lower-cased (see `normalise` below), so this
 * is an equality match that uses the unique btree indexes from migration 0006.
 * An `ilike` comparison here would force a sequential scan of the table.
 */
async function findByLogin(login: string): Promise<Row | null> {
  const value = normalise(login);
  if (!value) return null;
  // Commas and dots are PostgREST filter syntax; a value containing them would
  // corrupt the `or` expression, so those logins are matched one column at a time.
  const sb = supabaseAdmin();
  if (/[,()]/.test(value)) {
    const byUser = await sb.from("admins").select("*").eq("username", value).limit(1);
    if ((byUser.data ?? []).length > 0) return byUser.data![0];
    const byEmail = await sb.from("admins").select("*").eq("email", value).limit(1);
    return (byEmail.data ?? [])[0] ?? null;
  }
  const { data } = await sb
    .from("admins")
    .select("*")
    .or(`username.eq.${value},email.eq.${value}`)
    .limit(1);
  return (data ?? [])[0] ?? null;
}

/** Login identifiers are stored and compared in a single canonical casing. */
function normalise(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export async function getAdminByLogin(login: string): Promise<AdminAccount | null> {
  if (!(await adminsTableReady())) return null;
  const row = await findByLogin(login);
  return row ? mapAdmin(row) : null;
}

export async function countAdmins(): Promise<number> {
  if (!(await adminsTableReady())) return 1;
  const { count } = await supabaseAdmin()
    .from("admins")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

/* -------------------------------------------------------------------------- */
/* Authentication                                                              */
/* -------------------------------------------------------------------------- */

export type AuthResult =
  | { ok: true; admin: AdminAccount }
  | { ok: false; reason: "not_found" | "bad_password" | "inactive" };

/**
 * Verify a login. When the admins table is empty, the very first successful
 * `ADMIN_PASSWORD` login is promoted into a real owner row, so an existing
 * deployment upgrades itself on the next sign-in with no manual seeding.
 */
export async function authenticate(
  login: string,
  password: string,
): Promise<AuthResult> {
  const ready = await adminsTableReady();

  // No table yet (or no Supabase at all) → env password is the only credential.
  if (!ready) {
    return matchesEnvPassword(password)
      ? { ok: true, admin: envOwner() }
      : { ok: false, reason: "bad_password" };
  }

  const sb = supabaseAdmin();
  const row = await findByLogin(login);

  if (!row) {
    // Bootstrap: first ever login with the env password creates the owner.
    if ((await countAdmins()) === 0 && matchesEnvPassword(password)) {
      const created = await createAdmin({
        username: normalise(login) || "admin",
        name: "Owner",
        email: null,
        password,
        role: "owner",
        permissions: [...ALL_SECTIONS],
      });
      if (created) return { ok: true, admin: created };
    }
    return { ok: false, reason: "not_found" };
  }

  const admin = mapAdmin(row);
  if (!admin.is_active) return { ok: false, reason: "inactive" };

  const ok = await verifyPasswordHash(password, String(row.password_hash ?? ""));
  if (!ok) return { ok: false, reason: "bad_password" };

  await sb
    .from("admins")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", admin.id);

  return { ok: true, admin };
}

/** Constant-time-ish compare against ADMIN_PASSWORD (bootstrap only). */
function matchesEnvPassword(input: string): boolean {
  const expected = env.adminPassword?.trim();
  if (!expected) return false;
  const a = input.trim();
  if (a.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/** Re-check a password (used before a self-service password change). */
export async function checkPassword(id: string, password: string): Promise<boolean> {
  if (id === ENV_OWNER_ID) return matchesEnvPassword(password);
  if (!(await adminsTableReady())) return false;
  const { data } = await supabaseAdmin()
    .from("admins")
    .select("password_hash")
    .eq("id", id)
    .maybeSingle();
  if (!data) return false;
  return verifyPasswordHash(password, String(data.password_hash ?? ""));
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                      */
/* -------------------------------------------------------------------------- */

export type CreateAdminInput = {
  username: string;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  password: string;
  role: Role;
  permissions?: SectionKey[];
};

export async function createAdmin(input: CreateAdminInput): Promise<AdminAccount | null> {
  if (!(await adminsTableReady())) return null;
  const permissions =
    input.role === "owner"
      ? [...ALL_SECTIONS]
      : (input.permissions ?? DEFAULT_PERMISSIONS[input.role]);

  const { data, error } = await supabaseAdmin()
    .from("admins")
    .insert({
      username: normalise(input.username),
      name: input.name?.trim() || null,
      email: normalise(input.email) || null,
      avatar_url: input.avatar_url || null,
      password_hash: await hashPassword(input.password),
      role: input.role,
      permissions,
      is_active: true,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data ? mapAdmin(data) : null;
}

export type UpdateAdminInput = {
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  role?: Role;
  permissions?: SectionKey[];
  is_active?: boolean;
  password?: string;
};

export async function updateAdmin(id: string, input: UpdateAdminInput): Promise<void> {
  if (!(await adminsTableReady())) {
    throw new Error("Admin accounts are not available until migration 0006 is applied.");
  }
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.name !== undefined) patch.name = input.name?.trim() || null;
  if (input.email !== undefined) patch.email = normalise(input.email) || null;
  if (input.avatar_url !== undefined) patch.avatar_url = input.avatar_url || null;
  if (input.role !== undefined) patch.role = input.role;
  if (input.is_active !== undefined) patch.is_active = input.is_active;
  if (input.permissions !== undefined) {
    patch.permissions = input.role === "owner" ? [...ALL_SECTIONS] : input.permissions;
  }
  if (input.password) patch.password_hash = await hashPassword(input.password);

  const { error } = await supabaseAdmin().from("admins").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteAdmin(id: string): Promise<void> {
  if (!(await adminsTableReady())) return;
  // The owner row is the recovery account — never removable through the UI.
  const { error } = await supabaseAdmin()
    .from("admins")
    .delete()
    .eq("id", id)
    .neq("role", "owner");
  if (error) throw error;
}
