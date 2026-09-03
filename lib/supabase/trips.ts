import { createClient } from "./client";
import type { SavePayload } from "./saves";

export type TripStatus = "idea" | "planning" | "booked" | "completed";
export type TripSlot = "flex" | "morning" | "midday" | "afternoon" | "evening" | "stay";

export type TripItem = SavePayload & {
  dayIndex?: number;
  slot?: TripSlot;
  note?: string;
  sortOrder: number;
};

export type UserTrip = {
  id: string;
  title: string;
  destinationSourceId?: string;
  startDate?: string;
  endDate?: string;
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
  items: TripItem[];
};

export type TripList = {
  trips: UserTrip[];
  mode: "guest" | "account";
  userEmail?: string;
};

const LOCAL_KEY = "around-guest-trips-v1";
export const TRIPS_CHANGED_EVENT = "around:trips-changed";

function dbType(type: string) {
  return type === "product" ? "object" : type;
}

function uiType(type: string) {
  return type === "object" ? "product" : type;
}

function readLocal(): UserTrip[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(trips: UserTrip[]) {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(trips);
  localStorage.setItem(LOCAL_KEY, serialized);
  if (localStorage.getItem(LOCAL_KEY) !== serialized) {
    throw new Error("Trip konnte lokal nicht gespeichert werden.");
  }
  notifyTripChange();
}

function clearLocal() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCAL_KEY);
}

export function notifyTripChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(TRIPS_CHANGED_EVENT));
  }
}

async function getAuthenticatedUser() {
  const supabase = createClient();
  if (!supabase) return { supabase: null, user: null };
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

async function mergeGuestTripsIntoAccount(
  supabase: NonNullable<ReturnType<typeof createClient>>,
  userId: string
) {
  const local = readLocal();
  if (!local.length) return;

  for (const trip of local) {
    const { error: tripError } = await supabase.from("trips").upsert({
      id: trip.id,
      user_id: userId,
      title: trip.title,
      destination_source_id: trip.destinationSourceId || null,
      start_date: trip.startDate || null,
      end_date: trip.endDate || null,
      status: trip.status,
      created_at: trip.createdAt,
      updated_at: trip.updatedAt
    }, { onConflict: "id" });

    if (tripError) return;

    for (const item of trip.items) {
      const { data: existing } = await supabase
        .from("trip_items")
        .select("id")
        .eq("trip_id", trip.id)
        .eq("source_id", item.sourceId)
        .maybeSingle();

      const payload = {
        trip_id: trip.id,
        source_id: item.sourceId,
        source_type: dbType(item.sourceType),
        day_index: item.dayIndex ?? null,
        slot: item.slot || "flex",
        note: item.note || null,
        sort_order: item.sortOrder
      };

      const result = existing
        ? await supabase.from("trip_items").update(payload).eq("id", existing.id)
        : await supabase.from("trip_items").insert(payload);

      if (result.error) return;
    }
  }

  clearLocal();
}

async function fetchAccountTrips(
  supabase: NonNullable<ReturnType<typeof createClient>>,
  userId: string
): Promise<UserTrip[]> {
  const { data: trips, error } = await supabase
    .from("trips")
    .select("id,title,destination_source_id,start_date,end_date,status,created_at,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !trips) return [];

  const tripIds = trips.map(trip => trip.id);
  let itemRows: Array<{
    trip_id: string;
    source_id: string;
    source_type: string;
    day_index: number | null;
    slot: string | null;
    note: string | null;
    sort_order: number;
  }> = [];

  if (tripIds.length) {
    const { data } = await supabase
      .from("trip_items")
      .select("trip_id,source_id,source_type,day_index,slot,note,sort_order")
      .in("trip_id", tripIds)
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

  return trips.map(trip => ({
    id: trip.id,
    title: trip.title,
    destinationSourceId: trip.destination_source_id || undefined,
    startDate: trip.start_date || undefined,
    endDate: trip.end_date || undefined,
    status: trip.status as TripStatus,
    createdAt: trip.created_at,
    updatedAt: trip.updated_at,
    items: itemRows
      .filter(item => item.trip_id === trip.id)
      .map(item => {
        const snapshot = snapshots.get(item.source_id) || {
          sourceId: item.source_id,
          sourceType: uiType(item.source_type),
          title: "Gespeicherter Inhalt",
          slug: ""
        };
        return {
          ...snapshot,
          dayIndex: item.day_index ?? undefined,
          slot: (item.slot || "flex") as TripSlot,
          note: item.note || undefined,
          sortOrder: item.sort_order
        };
      })
  }));
}

export async function listUserTrips(): Promise<TripList> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return { trips: readLocal(), mode: "guest" };

  await mergeGuestTripsIntoAccount(supabase, user.id);
  const trips = await fetchAccountTrips(supabase, user.id);
  return { trips, mode: "account", userEmail: user.email || undefined };
}

export async function getUserTrip(id: string) {
  const result = await listUserTrips();
  return {
    trip: result.trips.find(trip => trip.id === id) || null,
    mode: result.mode,
    userEmail: result.userEmail
  };
}

export async function createUserTrip(
  title: string,
  options: { startDate?: string; endDate?: string; destinationSourceId?: string } = {}
) {
  const cleanTitle = title.trim();
  if (!cleanTitle) throw new Error("Titel fehlt");
  const now = new Date().toISOString();
  const trip: UserTrip = {
    id: crypto.randomUUID(),
    title: cleanTitle,
    destinationSourceId: options.destinationSourceId,
    startDate: options.startDate,
    endDate: options.endDate,
    status: "idea",
    createdAt: now,
    updatedAt: now,
    items: []
  };

  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) {
    writeLocal([trip, ...readLocal()]);
    return trip;
  }

  const { error } = await supabase.from("trips").insert({
    id: trip.id,
    user_id: user.id,
    title: trip.title,
    destination_source_id: trip.destinationSourceId || null,
    start_date: trip.startDate || null,
    end_date: trip.endDate || null,
    status: trip.status,
    created_at: now,
    updated_at: now
  });
  if (error) throw error;
  notifyTripChange();
  return trip;
}

export async function updateUserTrip(
  id: string,
  patch: Partial<Pick<UserTrip, "title" | "startDate" | "endDate" | "status" | "destinationSourceId">>
) {
  const now = new Date().toISOString();
  const { supabase, user } = await getAuthenticatedUser();

  if (!supabase || !user) {
    const trips = readLocal();
    const current = trips.find(trip => trip.id === id);
    if (!current) throw new Error("Trip wurde lokal nicht gefunden.");

    const next: UserTrip = {
      ...current,
      ...patch,
      title: patch.title !== undefined ? patch.title.trim() : current.title,
      startDate: patch.startDate !== undefined ? (patch.startDate || undefined) : current.startDate,
      endDate: patch.endDate !== undefined ? (patch.endDate || undefined) : current.endDate,
      destinationSourceId: patch.destinationSourceId !== undefined ? (patch.destinationSourceId || undefined) : current.destinationSourceId,
      updatedAt: now
    };

    writeLocal(trips.map(trip => trip.id === id ? next : trip));
    const persisted = readLocal().find(trip => trip.id === id);
    if (!persisted || persisted.title !== next.title || persisted.startDate !== next.startDate || persisted.endDate !== next.endDate || persisted.status !== next.status) {
      throw new Error("Trip-Änderungen konnten lokal nicht bestätigt werden.");
    }
    return;
  }

  const dbPatch: Record<string, string | null> = { updated_at: now };
  if (patch.title !== undefined) dbPatch.title = patch.title.trim();
  if (patch.startDate !== undefined) dbPatch.start_date = patch.startDate || null;
  if (patch.endDate !== undefined) dbPatch.end_date = patch.endDate || null;
  if (patch.status !== undefined) dbPatch.status = patch.status;
  if (patch.destinationSourceId !== undefined) dbPatch.destination_source_id = patch.destinationSourceId || null;

  const { data, error } = await supabase.from("trips")
    .update(dbPatch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Trip konnte im Account nicht gespeichert werden.");
  notifyTripChange();
}

export async function deleteUserTrip(id: string) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) {
    writeLocal(readLocal().filter(trip => trip.id !== id));
    return;
  }

  const { error } = await supabase.from("trips").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
  notifyTripChange();
}

export async function addItemToTrip(tripId: string, item: SavePayload) {
  const now = new Date().toISOString();
  const { supabase, user } = await getAuthenticatedUser();

  if (!supabase || !user) {
    const trips = readLocal();
    writeLocal(trips.map(trip => {
      if (trip.id !== tripId || trip.items.some(existing => existing.sourceId === item.sourceId)) return trip;
      return {
        ...trip,
        updatedAt: now,
        items: [...trip.items, { ...item, slot: "flex", sortOrder: trip.items.length }]
      };
    }));
    return;
  }

  const { data: existing } = await supabase
    .from("trip_items")
    .select("id")
    .eq("trip_id", tripId)
    .eq("source_id", item.sourceId)
    .maybeSingle();
  if (existing) return;

  const { count } = await supabase
    .from("trip_items")
    .select("id", { count: "exact", head: true })
    .eq("trip_id", tripId);

  const { error } = await supabase.from("trip_items").insert({
    trip_id: tripId,
    source_id: item.sourceId,
    source_type: dbType(item.sourceType),
    slot: "flex",
    sort_order: count || 0
  });
  if (error) throw error;

  await supabase.from("trips").update({ updated_at: now }).eq("id", tripId).eq("user_id", user.id);
  notifyTripChange();
}

export async function updateTripItem(
  tripId: string,
  sourceId: string,
  patch: { dayIndex?: number; slot?: TripSlot; note?: string }
) {
  const now = new Date().toISOString();
  const { supabase, user } = await getAuthenticatedUser();

  if (!supabase || !user) {
    const trips = readLocal();
    const current = trips.find(trip => trip.id === tripId);
    if (!current) throw new Error("Trip wurde lokal nicht gefunden.");
    if (!current.items.some(item => item.sourceId === sourceId)) throw new Error("Trip-Inhalt wurde lokal nicht gefunden.");

    writeLocal(trips.map(trip => trip.id === tripId ? {
      ...trip,
      updatedAt: now,
      items: trip.items.map(item => item.sourceId === sourceId ? {
        ...item,
        dayIndex: "dayIndex" in patch ? patch.dayIndex : item.dayIndex,
        slot: patch.slot ?? item.slot,
        note: patch.note ?? item.note
      } : item)
    } : trip));
    return;
  }

  const dbPatch: Record<string, string | number | null> = {};
  if ("dayIndex" in patch) dbPatch.day_index = patch.dayIndex ?? null;
  if (patch.slot !== undefined) dbPatch.slot = patch.slot;
  if (patch.note !== undefined) dbPatch.note = patch.note || null;

  const { error } = await supabase.from("trip_items")
    .update(dbPatch)
    .eq("trip_id", tripId)
    .eq("source_id", sourceId);
  if (error) throw error;

  await supabase.from("trips").update({ updated_at: now }).eq("id", tripId).eq("user_id", user.id);
  notifyTripChange();
}

export async function removeItemFromTrip(tripId: string, sourceId: string) {
  const now = new Date().toISOString();
  const { supabase, user } = await getAuthenticatedUser();

  if (!supabase || !user) {
    writeLocal(readLocal().map(trip => trip.id === tripId ? {
      ...trip,
      updatedAt: now,
      items: trip.items.filter(item => item.sourceId !== sourceId)
    } : trip));
    return;
  }

  const { error } = await supabase.from("trip_items")
    .delete()
    .eq("trip_id", tripId)
    .eq("source_id", sourceId);
  if (error) throw error;
  await supabase.from("trips").update({ updated_at: now }).eq("id", tripId).eq("user_id", user.id);
  notifyTripChange();
}
