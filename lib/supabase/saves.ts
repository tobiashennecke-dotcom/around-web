import { createClient } from "./client";

export type SavePayload = {
  sourceId: string;
  sourceType: string;
  title: string;
  slug: string;
};

const LOCAL_KEY = "around-guest-saves-v1";

function readLocal(): SavePayload[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); }
  catch { return []; }
}

function writeLocal(items: SavePayload[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
}

export async function toggleSave(payload: SavePayload) {
  const supabase = createClient();

  if (!supabase) {
    const items = readLocal();
    const exists = items.some(x => x.sourceId === payload.sourceId);
    const next = exists
      ? items.filter(x => x.sourceId !== payload.sourceId)
      : [...items, payload];
    writeLocal(next);
    return { saved: !exists, mode: "guest" as const };
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const items = readLocal();
    const exists = items.some(x => x.sourceId === payload.sourceId);
    const next = exists
      ? items.filter(x => x.sourceId !== payload.sourceId)
      : [...items, payload];
    writeLocal(next);
    return { saved: !exists, mode: "guest" as const };
  }

  const { data: existing } = await supabase
    .from("saved_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("source_id", payload.sourceId)
    .maybeSingle();

  if (existing) {
    await supabase.from("saved_items").delete().eq("id", existing.id);
    return { saved: false, mode: "account" as const };
  }

  await supabase.from("saved_items").insert({
    user_id: user.id,
    source_id: payload.sourceId,
    source_type: payload.sourceType,
    title_snapshot: payload.title,
    slug_snapshot: payload.slug
  });
  return { saved: true, mode: "account" as const };
}

export function getGuestSaves() {
  return readLocal();
}
