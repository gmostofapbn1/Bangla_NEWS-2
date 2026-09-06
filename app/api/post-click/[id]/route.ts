import { NextResponse } from "next/server";
import { supabasePublic } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

/** Non-blocking blog view counter hit by the client beacon on the post page. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = supabasePublic();
  if (db) {
    try {
      await db.rpc("increment_post_click", { post_id: id });
    } catch {
      /* ignore */
    }
  }
  return NextResponse.json({ ok: true });
}
