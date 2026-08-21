import { createClient } from "./client";
import type { SavePayload } from "./saves";

export type UserCollection = {
  id: string;
  title: string;
  description?: string;
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
  items: SavePayload[];
};

export type CollectionList = {
  collections: UserCollection[];
  mode: "guest" | "account";
  userEmail?: string;
};

const LOCAL_KEY = "around-guest-collections-v1";
export const COLLECTIONS_CHANGED_EVENT = "around:collections-changed";

function dbType(type: string) {
  return type === "product" ? "object" : type;
}

function uiType(type: string) {
  return type === "object" ? "product" : type;
}

function readLocal(): UserCollection[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(collections: UserCollection[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(collections));
  notifyCollectionChange();
}

function clearLocal() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCAL_KEY);
}

export function notifyCollectionChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(COLLECTIONS_CHANGED_EVENT));
  }
}

async function getAuthenticatedUser() {
  const supabase = createClient();
  if (!supabase) return { supabase: null, user: null };
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

async function mergeGuestCollectionsIntoAccount(
  supabase: NonNullable<ReturnType<typeof createClient>>,
  userId: string
) {
  const local = readLocal();
  if (!local.length) return;

  for (const collection of local) {
    const { error: collectionError } = await supabase.from("user_collections").upsert({
      id: collection.id,
      user_id: userId,
      title: collection.title,
      description: collection.description || null,
      is_public: Boolean(collection.isPublic),
      created_at: collection.createdAt,
      updated_at: collection.updatedAt
    }, { onConflict: "id" });

    if (collectionError) return;

    if (collection.items.length) {
      const rows = collection.items.map((item, index) => ({
        collection_id: collection.id,
        source_id: item.sourceId,
        source_type: dbType(item.sourceType),
        sort_order: index
      }));

      const { error: itemError } = await supabase
        .from("user_collection_items")
        .upsert(rows, { onConflict: "collection_id,source_id", ignoreDuplicates: true });

      if (itemError) return;
    }
  }

  clearLocal();
}

async function fetchAccountCollections(
  supabase: NonNullable<ReturnType<typeof createClient>>,
  userId: string
): Promise<UserCollection[]> {
  const { data: collections, error } = await supabase
    .from("user_collections")
    .select("id,title,description,is_public,created_at,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !collections) return [];

  const ids = collections.map(collection => collection.id);
  let itemRows: Array<{
    collection_id: string;
    source_id: string;
    source_type: string;
    sort_order: number;
  }> = [];

  if (ids.length) {
    const { data } = await supabase
      .from("user_collection_items")
      .select("collection_id,source_id,source_type,sort_order")
      .in("collection_id", ids)
      .order("sort_order", { ascending: true });
    itemRows = data || [];
  }

  const sourceIds = [...new Set(itemRows.map(item => item.source_id))];
  const snapshots = new Map<string, SavePayload>();

  if (sourceIds.length) {
    const { data } = await supabase
      .from("saved_items")
      .select("source_id,source_type,title_snapshot,slug_snapshot")
      .eq("user_id", userId)
      .in("source_id", sourceIds);

    for (const row of data || []) {
      snapshots.set(row.source_id, {
        sourceId: row.source_id,
        sourceType: uiType(row.source_type),
        title: row.title_snapshot || "Gespeicherter Inhalt",
        slug: row.slug_snapshot || ""
      });
    }
  }

  return collections.map(collection => ({
    id: collection.id,
    title: collection.title,
    description: collection.description || undefined,
    isPublic: collection.is_public,
    createdAt: collection.created_at,
    updatedAt: collection.updated_at,
    items: itemRows
      .filter(item => item.collection_id === collection.id)
      .map(item => snapshots.get(item.source_id) || {
        sourceId: item.source_id,
        sourceType: uiType(item.source_type),
        title: "Gespeicherter Inhalt",
        slug: ""
      })
  }));
}

export async function listUserCollections(): Promise<CollectionList> {
  const { supabase, user } = await getAuthenticatedUser();

  if (!supabase || !user) {
    return { collections: readLocal(), mode: "guest" };
  }

  await mergeGuestCollectionsIntoAccount(supabase, user.id);
  const collections = await fetchAccountCollections(supabase, user.id);
  return { collections, mode: "account", userEmail: user.email || undefined };
}

export async function createUserCollection(title: string, description = "") {
  const cleanTitle = title.trim();
  if (!cleanTitle) throw new Error("Titel fehlt");
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const collection: UserCollection = {
    id,
    title: cleanTitle,
    description: description.trim() || undefined,
    createdAt: now,
    updatedAt: now,
    items: []
  };

  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) {
    writeLocal([collection, ...readLocal()]);
    return collection;
  }

  const { error } = await supabase.from("user_collections").insert({
    id,
    user_id: user.id,
    title: collection.title,
    description: collection.description || null,
    is_public: false,
    created_at: now,
    updated_at: now
  });
  if (error) throw error;
  notifyCollectionChange();
  return collection;
}

export async function renameUserCollection(id: string, title: string) {
  const cleanTitle = title.trim();
  if (!cleanTitle) return;
  const now = new Date().toISOString();
  const { supabase, user } = await getAuthenticatedUser();

  if (!supabase || !user) {
    writeLocal(readLocal().map(collection => collection.id === id
      ? { ...collection, title: cleanTitle, updatedAt: now }
      : collection));
    return;
  }

  const { error } = await supabase
    .from("user_collections")
    .update({ title: cleanTitle, updated_at: now })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  notifyCollectionChange();
}

export async function deleteUserCollection(id: string) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) {
    writeLocal(readLocal().filter(collection => collection.id !== id));
    return;
  }

  const { error } = await supabase
    .from("user_collections")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  notifyCollectionChange();
}

export async function addItemToCollection(collectionId: string, item: SavePayload) {
  const now = new Date().toISOString();
  const { supabase, user } = await getAuthenticatedUser();

  if (!supabase || !user) {
    const collections = readLocal();
    const next = collections.map(collection => {
      if (collection.id !== collectionId) return collection;
      if (collection.items.some(existing => existing.sourceId === item.sourceId)) return collection;
      return { ...collection, items: [...collection.items, item], updatedAt: now };
    });
    writeLocal(next);
    return;
  }

  const { count } = await supabase
    .from("user_collection_items")
    .select("id", { count: "exact", head: true })
    .eq("collection_id", collectionId);

  const { error } = await supabase.from("user_collection_items").upsert({
    collection_id: collectionId,
    source_id: item.sourceId,
    source_type: dbType(item.sourceType),
    sort_order: count || 0
  }, { onConflict: "collection_id,source_id", ignoreDuplicates: true });
  if (error) throw error;

  await supabase
    .from("user_collections")
    .update({ updated_at: now })
    .eq("id", collectionId)
    .eq("user_id", user.id);
  notifyCollectionChange();
}

export async function removeItemFromCollection(collectionId: string, sourceId: string) {
  const now = new Date().toISOString();
  const { supabase, user } = await getAuthenticatedUser();

  if (!supabase || !user) {
    writeLocal(readLocal().map(collection => collection.id === collectionId
      ? { ...collection, items: collection.items.filter(item => item.sourceId !== sourceId), updatedAt: now }
      : collection));
    return;
  }

  const { error } = await supabase
    .from("user_collection_items")
    .delete()
    .eq("collection_id", collectionId)
    .eq("source_id", sourceId);
  if (error) throw error;

  await supabase
    .from("user_collections")
    .update({ updated_at: now })
    .eq("id", collectionId)
    .eq("user_id", user.id);
  notifyCollectionChange();
}

export async function getUserCollection(id: string) {
  const result = await listUserCollections();
  return {
    collection: result.collections.find(collection => collection.id === id) || null,
    mode: result.mode,
    userEmail: result.userEmail
  };
}
