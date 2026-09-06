import { NextResponse } from "next/server";
import { getOutletLight } from "@/lib/queries";
import { supabasePublic } from "@/lib/supabase/public";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Click-tracking redirect: /go/[id] -> increment click_count -> outlet URL. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const outlet = await getOutletLight(id);

  if (!outlet) {
    return NextResponse.redirect(new URL("/", env.siteUrl));
  }

  const db = supabasePublic();
  if (db) {
    db.rpc("increment_click", { outlet_id: id }).then(
      () => {},
      () => {},
    ); // fire-and-forget; don't block the redirect
  }

  return NextResponse.redirect(outlet.url, { status: 302 });
}
