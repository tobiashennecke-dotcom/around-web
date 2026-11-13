import { createClient } from "./client";
import { requestLogin } from "@/lib/account-gate";
import { track } from "@/lib/analytics/track";

export type MarkKind = "played" | "bucket";

export type PlaceMarkPayload = {
  sourceId: string;
  title: string;
  slug: string;
  destinationId?: string;
  destinationTitle?: string;
  destinationSlug?: string;
  country?: string;
};

export type PlaceMark = PlaceMarkPayload & {
  kind: MarkKind;
  playedOn?: string;
  createdAt: string;
};

export const PLACE_MARKS_CHANGED_EVENT = "around:place-marks-changed";

async function session() {
  const supabase = createClient();
  if (!supabase) return { supabase: null, user: null };
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(PLACE_MARKS_CHANGED_EVENT));
}

/** All marks of the signed-in user, or null for guests. */
export async function listPlaceMarks(): Promise<PlaceMark[] | null> {
  const { supabase, user } = await session();
  if (!supabase || !user) return null;
  const { data, error } = await supabase
    .from("user_place_marks")
    .select("source_id,kind,title_snapshot,slug_snapshot,destination_id,destination_title,destination_slug,country,played_on,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(row => ({
    sourceId: row.source_id,
    kind: row.kind as MarkKind,
    title: row.title_snapshot || "Platz",
    slug: row.slug_snapshot || "",
    destinationId: row.destination_id || undefined,
    destinationTitle: row.destination_title || undefined,
    destinationSlug: row.destination_slug || undefined,
    country: row.country || undefined,
    playedOn: row.played_on || undefined,
    createdAt: row.created_at
  }));
}

/** Toggles a mark. Guests get the login sheet and nothing is stored. */
export async function togglePlaceMark(kind: MarkKind, payload: PlaceMarkPayload): Promise<boolean | null> {
  const { supabase, user } = await session();
  if (!supabase || !user) {
    requestLogin("pass");
    return null;
  }

  const { data: existing } = await supabase
    .from("user_place_marks")
    .select("id")
    .eq("user_id", user.id)
    .eq("source_id", payload.sourceId)
    .eq("kind", kind)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("user_place_marks").delete().eq("id", existing.id);
    if (error) throw error;
    notify();
    return false;
  }

  const { error } = await supabase.from("user_place_marks").insert({
    user_id: user.id,
    source_id: payload.sourceId,
    kind,
    title_snapshot: payload.title,
    slug_snapshot: payload.slug,
    destination_id: payload.destinationId || null,
    destination_title: payload.destinationTitle || null,
    destination_slug: payload.destinationSlug || null,
    country: payload.country || null,
    played_on: kind === "played" ? new Date().toISOString().slice(0, 10) : null
  });
  if (error) throw error;
  track(kind === "played" ? "place_played" : "place_bucketed", { sourceId: payload.sourceId, sourceType: "place", sourceRole: "play", slug: payload.slug });
  notify();
  return true;
}

export async function setPlayedOn(sourceId: string, playedOn: string | null) {
  const { supabase, user } = await session();
  if (!supabase || !user) return;
  await supabase
    .from("user_place_marks")
    .update({ played_on: playedOn && /^\d{4}-\d{2}-\d{2}$/.test(playedOn) ? playedOn : null })
    .eq("user_id", user.id)
    .eq("source_id", sourceId)
    .eq("kind", "played");
  notify();
}
