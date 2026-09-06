import { NextResponse } from "next/server";
import { supabasePublic } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

/** Lightweight click counter hit by the client beacon (non-blocking). */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = supabasePublic();
  if (db) {
    try {
      await db.rpc("increment_click", { outlet_id: id });
    } catch {
      /* ignore */
    }
  }
  return NextResponse.json({ ok: true });
}
