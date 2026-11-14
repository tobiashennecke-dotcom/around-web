import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const OWN_TABLES: { table: string; column: string }[] = [
  { table: "profiles", column: "id" },
  { table: "communication_preferences", column: "user_id" },
  { table: "saved_items", column: "user_id" },
  { table: "user_collections", column: "user_id" },
  { table: "trips", column: "user_id" },
  { table: "user_place_marks", column: "user_id" },
  { table: "user_events", column: "user_id" }
];

/** DSGVO Art. 15/20: everything AROUND stores for the signed-in account, as JSON. */
export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at, provider: user.app_metadata?.provider ?? null }
  };

  for (const { table, column } of OWN_TABLES) {
    const { data } = await supabase.from(table).select("*").eq(column, user.id);
    result[table] = data ?? [];
  }

  const tripIds = ((result.trips as { id: string }[]) || []).map(trip => trip.id);
  if (tripIds.length) {
    const { data } = await supabase.from("trip_items").select("*").in("trip_id", tripIds);
    result.trip_items = data ?? [];
  }
  const collectionIds = ((result.user_collections as { id: string }[]) || []).map(collection => collection.id);
  if (collectionIds.length) {
    const { data } = await supabase.from("user_collection_items").select("*").in("collection_id", collectionIds);
    result.user_collection_items = data ?? [];
  }

  const admin = createAdminClient();
  if (admin) {
    const { data } = await admin.from("analytics_events").select("*").eq("user_id", user.id).order("occurred_at", { ascending: false }).limit(10000);
    result.analytics_events = data ?? [];
  }

  return new NextResponse(JSON.stringify(result, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="around-daten-${new Date().toISOString().slice(0, 10)}.json"`
    }
  });
}
