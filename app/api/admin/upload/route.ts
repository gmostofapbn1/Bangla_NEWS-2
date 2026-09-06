import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/env";
import { slugify } from "@/lib/seed-data";

export const dynamic = "force-dynamic";

const MEDIA_BUCKET = "media";
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

/** Admin-only image upload for the blog editor → Supabase 'media' bucket. */
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasServiceRole()) {
    return NextResponse.json(
      { error: "Storage is not configured (SUPABASE_SERVICE_ROLE_KEY missing)." },
      { status: 500 },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is larger than 8 MB." }, { status: 400 });
  }

  try {
    const sb = supabaseAdmin();
    const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
    const base = slugify(file.name.replace(/\.[^.]+$/, "")).slice(0, 40) || "image";
    const path = `blog/${Date.now()}-${base}.${ext}`;
    const { error } = await sb.storage
      .from(MEDIA_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: true });
    if (error) throw error;
    const url = sb.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[upload] failed:", e);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
