import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * After login (and only with full consent, checked in the browser before
 * calling): attaches the browser's earlier anonymous-ID events to the
 * signed-in account, so the path from first visit to account is visible.
 * Only rows that are not yet linked to any account are touched.
 */
export async function POST(request: Request) {
  const admin = createAdminClient();
  const supabase = await createClient();
  if (!admin || !supabase) return NextResponse.json({ linked: 0 });

  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ linked: 0 }, { status: 401 });

  let anonId: unknown;
  try {
    anonId = (await request.json())?.anonId;
  } catch {
    anonId = null;
  }
  if (typeof anonId !== "string" || !UUID.test(anonId)) return NextResponse.json({ linked: 0 }, { status: 400 });

  const { count } = await admin
    .from("analytics_events")
    .update({ user_id: data.user.id }, { count: "exact" })
    .eq("anon_id", anonId.toLowerCase())
    .eq("consent", "full")
    .is("user_id", null);

  return NextResponse.json({ linked: count ?? 0 });
}
