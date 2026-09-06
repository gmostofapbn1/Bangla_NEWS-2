import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { slugify } from "@/lib/seed-data";

/**
 * Image upload helper shared by the account and settings actions.
 *
 * Deliberately NOT in a "use server" module: every export of one of those is
 * reachable as a public POST endpoint, and this function writes to storage. It
 * lives here so it can only be called from server code that has already checked
 * the caller's permissions.
 */

const BUCKET = "media";
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Delete an uploaded asset given its public URL.
 *
 * Only touches files this app uploaded: the URL has to point at one of our own
 * storage buckets, so a row holding an external logo URL (or a hand-typed one)
 * is left alone. Best-effort — a storage failure must not block the database
 * delete that follows it, or the row becomes undeletable.
 */
export async function deleteUploadedImage(publicUrl: string | null | undefined) {
  if (!publicUrl) return;

  // .../storage/v1/object/public/<bucket>/<path>
  const m = publicUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!m) return;
  const [, bucket, rawPath] = m;
  if (bucket !== BUCKET && bucket !== "logos") return;

  const path = decodeURIComponent(rawPath.split("?")[0]);
  try {
    const { error } = await supabaseAdmin().storage.from(bucket).remove([path]);
    if (error) throw error;
  } catch (e) {
    console.warn(`[uploads] could not remove ${bucket}/${path}:`, e);
  }
}

export async function uploadImageField(
  formData: FormData,
  field: string,
  folder: string,
): Promise<string | null> {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) return null;
  if (!file.type.startsWith("image/")) {
    throw new Error("শুধু ছবি ফাইল আপলোড করা যাবে।");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("ছবির সাইজ ৮ MB এর বেশি হতে পারবে না।");
  }

  const sb = supabaseAdmin();
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const base = slugify(file.name.replace(/\.[^.]+$/, "")).slice(0, 40) || "image";
  const path = `${folder}/${Date.now()}-${base}.${ext}`;

  const { error } = await sb.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw error;

  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
