import { createClient } from "./client";

export type SavePayload = {
  sourceId: string;
  sourceType: string;
  title: string;
  slug: string;
};

export type SaveMode = "guest" | "account";

export type SavedList = {
  items: SavePayload[];
  mode: SaveMode;
  userEmail?: string;
};

const LOCAL_KEY = "around-guest-saves-v1";
export const SAVES_CHANGED_EVENT = "around:saves-changed";

let savedIdsPromise: Promise<Set<string>> | null = null;

function readLocal(): SavePayload[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(items: SavePayload[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
}

function clearLocal() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCAL_KEY);
}

function dbType(type: string) {
  return type === "product" ? "object" : type;
}

function uiType(type: string) {
  return type === "object" ? "product" : type;
}

function invalidateSaveCache() {
  savedIdsPromise = null;
}

export function notifySaveChange() {
  invalidateSaveCache();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SAVES_CHANGED_EVENT));
  }
}

async function getAuthenticatedUser() {
  const supabase = createClient();
  if (!supabase) return { supabase: null, user: null };
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

async function mergeGuestSavesIntoAccount(
  supabase: NonNullable<ReturnType<typeof createClient>>,
  userId: string
) {
  const guestItems = readLocal();
  if (!guestItems.length) return;

  const rows = guestItems.map(item => ({
    user_id: userId,
    source_id: item.sourceId,
    source_type: dbType(item.sourceType),
    title_snapshot: item.title,
    slug_snapshot: item.slug
  }));

  const { error } = await supabase
    .from("saved_items")
    .upsert(rows, { onConflict: "user_id,source_id", ignoreDuplicates: true });

  if (!error) {
    clearLocal();
    invalidateSaveCache();
  }
}

async function fetchAccountItems(
  supabase: NonNullable<ReturnType<typeof createClient>>,
  userId: string
): Promise<SavePayload[]> {
  const { data, error } = await supabase
    .from("saved_items")
    .select("source_id,source_type,title_snapshot,slug_snapshot,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map(row => ({
    sourceId: row.source_id,
    sourceType: uiType(row.source_type),
    title: row.title_snapshot || "Gespeicherter Inhalt",
    slug: row.slug_snapshot || ""
  }));
}

export async function listSaves(): Promise<SavedList> {
  const { supabase, user } = await getAuthenticatedUser();

  if (!supabase || !user) {
    return { items: readLocal().slice().reverse(), mode: "guest" };
  }

  await mergeGuestSavesIntoAccount(supabase, user.id);
  const items = await fetchAccountItems(supabase, user.id);
  return { items, mode: "account", userEmail: user.email || undefined };
}

export async function getSavedIds(): Promise<Set<string>> {
  if (savedIdsPromise) return savedIdsPromise;

  savedIdsPromise = (async () => {
    const result = await listSaves();
    return new Set(result.items.map(item => item.sourceId));
  })();

  return savedIdsPromise;
}

export async function isSaved(sourceId: string) {
  const ids = await getSavedIds();
  return ids.has(sourceId);
}

export async function getSaveCount() {
  const ids = await getSavedIds();
  return ids.size;
}

export async function toggleSave(payload: SavePayload) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!supabase || !user) {
    const items = readLocal();
    const exists = items.some(item => item.sourceId === payload.sourceId);
    const next = exists
      ? items.filter(item => item.sourceId !== payload.sourceId)
      : [...items, payload];
    writeLocal(next);
    notifySaveChange();
    return { saved: !exists, mode: "guest" as const };
  }

  await mergeGuestSavesIntoAccount(supabase, user.id);

  const { data: existing } = await supabase
    .from("saved_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("source_id", payload.sourceId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("saved_items").delete().eq("id", existing.id);
    if (error) throw error;
    notifySaveChange();
    return { saved: false, mode: "account" as const };
  }

  const { error } = await supabase.from("saved_items").insert({
    user_id: user.id,
    source_id: payload.sourceId,
    source_type: dbType(payload.sourceType),
    title_snapshot: payload.title,
    slug_snapshot: payload.slug
  });
  if (error) throw error;

  notifySaveChange();
  return { saved: true, mode: "account" as const };
}

export async function removeSave(sourceId: string) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!supabase || !user) {
    writeLocal(readLocal().filter(item => item.sourceId !== sourceId));
    notifySaveChange();
    return;
  }

  const { error } = await supabase
    .from("saved_items")
    .delete()
    .eq("user_id", user.id)
    .eq("source_id", sourceId);
  if (error) throw error;
  notifySaveChange();
}

export function getGuestSaves() {
  return readLocal();
}
