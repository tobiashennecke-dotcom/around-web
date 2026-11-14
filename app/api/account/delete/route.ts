import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * DSGVO Art. 17: deletes the signed-in account. All product rows reference
 * auth.users with on delete cascade (profiles, saves, collections, trips,
 * events, analytics_events), so deleting the auth user removes everything.
 * Requires the body { "confirm": "LÖSCHEN" }.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let confirm: unknown;
  try {
    confirm = (await request.json())?.confirm;
  } catch {
    confirm = null;
  }
  if (confirm !== "LÖSCHEN") return NextResponse.json({ error: "confirmation_required" }, { status: 400 });

  // Storage files are not covered by the database cascade.
  const { data: files } = await admin.storage.from("avatars").list(user.id);
  if (files?.length) await admin.storage.from("avatars").remove(files.map(file => `${user.id}/${file.name}`));

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: "delete_failed" }, { status: 500 });

  await supabase.auth.signOut();
  return NextResponse.json({ deleted: true });
}
