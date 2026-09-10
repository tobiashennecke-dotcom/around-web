import { createClient } from "./client";
import type { SavePayload } from "./saves";
import { normalizeContentRole } from "@/lib/content-role";

export type TripStatus = "idea" | "planning" | "booked" | "completed";
export type TripSlot = "flex" | "morning" | "midday" | "afternoon" | "evening" | "stay";

export type TripItemPatch = {
  dayIndex?: number;
  slot?: TripSlot;
  note?: string;
  stayStartDay?: number;
  stayEndDay?: number;
  stayFullTrip?: boolean;
};

export type TripItem = SavePayload & {
  dayIndex?: number;
  slot?: TripSlot;
  note?: string;
  sortOrder: number;
  /** STAY-only: check-in day index within the trip. */
  stayStartDay?: number;
  /** STAY-only: checkout day index within the trip (exclusive night boundary). */
  stayEndDay?: number;
  /** STAY-only: automatically span from trip start to trip end. */
  stayFullTrip?: boolean;
};

export type UserTrip = {
  id: string;
  title: string;
  destinationSourceId?: string;
  startDate?: string;
  endDate?: string;
  status: TripStatus;
  /** Planning completion is separate from the travel lifecycle status. */
  planReady?: boolean;
  /** Night indexes intentionally marked as not requiring a STAY. */
  stayExemptNights?: number[];
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

let guestMutationQueue: Promise<void> = Promise.resolve();

async function mutateLocal(mutator: (trips: UserTrip[]) => UserTrip[]) {
  let result: UserTrip[] = [];
  const task = guestMutationQueue.then(() => {
    const current = readLocal();
    result = mutator(current);
    writeLocal(result);
  });
  guestMutationQueue = task.catch(() => undefined);
  await task;
  return result;
}

async function getAuthenticatedUser() {
  const supabase = createClient();
  if (!supabase) return { supabase: null, user: null };

  // Client-side product state does not need a network round-trip just to decide
  // whether to use guest storage. getSession() reads the current browser session
  // immediately; database writes remain protected by Supabase RLS.
  const { data: { session } } = await supabase.auth.getSession();
  return { supabase, user: session?.user || null };
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
      plan_ready: Boolean(trip.planReady),
      stay_exempt_nights: trip.stayExemptNights || [],
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
        source_role: item.sourceRole || null,
        day_index: item.dayIndex ?? null,
        slot: item.slot || "flex",
        note: item.note || null,
        stay_start_day: item.stayStartDay ?? null,
        stay_end_day: item.stayEndDay ?? null,
        stay_full_trip: Boolean(item.stayFullTrip),
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
    .select("id,title,destination_source_id,start_date,end_date,status,plan_ready,stay_exempt_nights,created_at,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !trips) return [];

  const tripIds = trips.map(trip => trip.id);
  let itemRows: Array<{
    trip_id: string;
    source_id: string;
    source_type: string;
    source_role: string | null;
    day_index: number | null;
    slot: string | null;
    note: string | null;
    stay_start_day: number | null;
    stay_end_day: number | null;
    stay_full_trip: boolean | null;
    sort_order: number;
  }> = [];

  if (tripIds.length) {
    const { data } = await supabase
      .from("trip_items")
      .select("trip_id,source_id,source_type,source_role,day_index,slot,note,stay_start_day,stay_end_day,stay_full_trip,sort_order")
      .in("trip_id", tripIds)
      .order("sort_order", { ascending: true });
    itemRows = data || [];
  }

  const sourceIds = [...new Set(itemRows.map(item => item.source_id))];
  const snapshots = new Map<string, SavePayload>();

  if (sourceIds.length) {
    const { data } = await supabase
      .from("saved_items")
      .select("source_id,source_type,source_role,title_snapshot,slug_snapshot")
      .eq("user_id", userId)
      .in("source_id", sourceIds);

    for (const row of data || []) {
      snapshots.set(row.source_id, {
        sourceId: row.source_id,
        sourceType: uiType(row.source_type),
        sourceRole: normalizeContentRole(row.source_role),
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
    planReady: Boolean(trip.plan_ready),
    stayExemptNights: Array.isArray(trip.stay_exempt_nights) ? trip.stay_exempt_nights.filter((value: unknown): value is number => typeof value === "number") : [],
    createdAt: trip.created_at,
    updatedAt: trip.updated_at,
    items: itemRows
      .filter(item => item.trip_id === trip.id)
      .map(item => {
        const snapshot = snapshots.get(item.source_id) || {
          sourceId: item.source_id,
          sourceType: uiType(item.source_type),
          sourceRole: normalizeContentRole(item.source_role),
          title: "Gespeicherter Inhalt",
          slug: ""
        };
        return {
          ...snapshot,
          dayIndex: item.day_index ?? undefined,
          slot: (item.slot || "flex") as TripSlot,
          note: item.note || undefined,
          stayStartDay: item.stay_start_day ?? undefined,
          stayEndDay: item.stay_end_day ?? undefined,
          stayFullTrip: Boolean(item.stay_full_trip),
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
    planReady: false,
    stayExemptNights: [],
    createdAt: now,
    updatedAt: now,
    items: []
  };

  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) {
    await mutateLocal(trips => [trip, ...trips.filter(existing => existing.id !== trip.id)]);
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
    plan_ready: false,
    stay_exempt_nights: [],
    created_at: now,
    updated_at: now
  });
  if (error) throw error;
  notifyTripChange();
  return trip;
}

export async function updateUserTrip(
  id: string,
  patch: Partial<Pick<UserTrip, "title" | "startDate" | "endDate" | "status" | "destinationSourceId" | "planReady" | "stayExemptNights">>
) {
  const now = new Date().toISOString();
  const { supabase, user } = await getAuthenticatedUser();

  if (!supabase || !user) {
    const updatedTrips = await mutateLocal(trips => {
      const current = trips.find(trip => trip.id === id);
      if (!current) throw new Error("Trip wurde lokal nicht gefunden.");

      const updated: UserTrip = {
        ...current,
        ...patch,
        title: patch.title !== undefined ? patch.title.trim() : current.title,
        startDate: patch.startDate !== undefined ? (patch.startDate || undefined) : current.startDate,
        endDate: patch.endDate !== undefined ? (patch.endDate || undefined) : current.endDate,
        destinationSourceId: patch.destinationSourceId !== undefined ? (patch.destinationSourceId || undefined) : current.destinationSourceId,
        planReady: patch.planReady !== undefined ? patch.planReady : current.planReady,
        stayExemptNights: patch.stayExemptNights !== undefined ? patch.stayExemptNights : current.stayExemptNights,
        updatedAt: now
      };

      return trips.map(trip => trip.id === id ? updated : trip);
    });

    const expected = updatedTrips.find(trip => trip.id === id);
    const persisted = readLocal().find(trip => trip.id === id);
    if (!expected || !persisted || persisted.title !== expected.title || persisted.startDate !== expected.startDate || persisted.endDate !== expected.endDate || persisted.status !== expected.status || Boolean(persisted.planReady) !== Boolean(expected.planReady)) {
      throw new Error("Trip-Änderungen konnten lokal nicht bestätigt werden.");
    }
    return;
  }

  const dbPatch: Record<string, string | boolean | number[] | null> = { updated_at: now };
  if (patch.title !== undefined) dbPatch.title = patch.title.trim();
  if (patch.startDate !== undefined) dbPatch.start_date = patch.startDate || null;
  if (patch.endDate !== undefined) dbPatch.end_date = patch.endDate || null;
  if (patch.status !== undefined) dbPatch.status = patch.status;
  if (patch.destinationSourceId !== undefined) dbPatch.destination_source_id = patch.destinationSourceId || null;
  if (patch.planReady !== undefined) dbPatch.plan_ready = patch.planReady;
  if (patch.stayExemptNights !== undefined) dbPatch.stay_exempt_nights = patch.stayExemptNights;

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
    await mutateLocal(trips => trips.filter(trip => trip.id !== id));
    return;
  }

  const { error } = await supabase.from("trips").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
  notifyTripChange();
}

export async function addItemToTrip(
  tripId: string,
  item: SavePayload,
  options: { stayStartDay?: number; stayEndDay?: number; stayFullTrip?: boolean } = {}
) {
  const now = new Date().toISOString();
  const { supabase, user } = await getAuthenticatedUser();

  if (!supabase || !user) {
    await mutateLocal(trips => trips.map(trip => {
      if (trip.id !== tripId || trip.items.some(existing => existing.sourceId === item.sourceId)) return trip;
      return {
        ...trip,
        planReady: false,
        updatedAt: now,
        items: [...trip.items, {
          ...item,
          slot: item.sourceRole === "stay" ? "stay" : "flex",
          stayStartDay: item.sourceRole === "stay" ? options.stayStartDay : undefined,
          stayEndDay: item.sourceRole === "stay" ? options.stayEndDay : undefined,
          stayFullTrip: item.sourceRole === "stay" ? Boolean(options.stayFullTrip) : false,
          sortOrder: trip.items.length
        }]
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
  if (existing) {
    const updatePayload: Record<string, string | number | boolean | null> = {};
    if (item.sourceRole) updatePayload.source_role = item.sourceRole;
    if (item.sourceRole === "stay") {
      if ("stayStartDay" in options) updatePayload.stay_start_day = options.stayStartDay ?? null;
      if ("stayEndDay" in options) updatePayload.stay_end_day = options.stayEndDay ?? null;
      if ("stayFullTrip" in options) updatePayload.stay_full_trip = Boolean(options.stayFullTrip);
      updatePayload.slot = "stay";
    }
    if (Object.keys(updatePayload).length) {
      await supabase.from("trip_items").update(updatePayload).eq("id", existing.id);
    }
    await supabase.from("trips").update({ updated_at: now, plan_ready: false }).eq("id", tripId).eq("user_id", user.id);
    notifyTripChange();
    return;
  }

  const { count } = await supabase
    .from("trip_items")
    .select("id", { count: "exact", head: true })
    .eq("trip_id", tripId);

  const { error } = await supabase.from("trip_items").insert({
    trip_id: tripId,
    source_id: item.sourceId,
    source_type: dbType(item.sourceType),
    source_role: item.sourceRole || null,
    slot: item.sourceRole === "stay" ? "stay" : "flex",
    stay_start_day: item.sourceRole === "stay" ? (options.stayStartDay ?? null) : null,
    stay_end_day: item.sourceRole === "stay" ? (options.stayEndDay ?? null) : null,
    stay_full_trip: item.sourceRole === "stay" ? Boolean(options.stayFullTrip) : false,
    sort_order: count || 0
  });
  if (error) throw error;

  await supabase.from("trips").update({ updated_at: now, plan_ready: false }).eq("id", tripId).eq("user_id", user.id);
  notifyTripChange();
}

export async function updateTripItem(
  tripId: string,
  sourceId: string,
  patch: TripItemPatch
) {
  const now = new Date().toISOString();
  const { supabase, user } = await getAuthenticatedUser();

  if (!supabase || !user) {
    await mutateLocal(trips => {
      const current = trips.find(trip => trip.id === tripId);
      if (!current) throw new Error("Trip wurde lokal nicht gefunden.");
      if (!current.items.some(item => item.sourceId === sourceId)) throw new Error("Trip-Inhalt wurde lokal nicht gefunden.");

      return trips.map(trip => trip.id === tripId ? {
        ...trip,
        planReady: false,
        updatedAt: now,
        items: trip.items.map(item => item.sourceId === sourceId ? {
          ...item,
          dayIndex: "dayIndex" in patch ? patch.dayIndex : item.dayIndex,
          slot: patch.slot ?? item.slot,
          note: patch.note ?? item.note,
          stayStartDay: "stayStartDay" in patch ? patch.stayStartDay : item.stayStartDay,
          stayEndDay: "stayEndDay" in patch ? patch.stayEndDay : item.stayEndDay,
          stayFullTrip: "stayFullTrip" in patch ? Boolean(patch.stayFullTrip) : item.stayFullTrip
        } : item)
      } : trip);
    });
    return;
  }

  const dbPatch: Record<string, string | number | boolean | null> = {};
  if ("dayIndex" in patch) dbPatch.day_index = patch.dayIndex ?? null;
  if (patch.slot !== undefined) dbPatch.slot = patch.slot;
  if (patch.note !== undefined) dbPatch.note = patch.note || null;
  if ("stayStartDay" in patch) dbPatch.stay_start_day = patch.stayStartDay ?? null;
  if ("stayEndDay" in patch) dbPatch.stay_end_day = patch.stayEndDay ?? null;
  if ("stayFullTrip" in patch) dbPatch.stay_full_trip = Boolean(patch.stayFullTrip);

  const { error } = await supabase.from("trip_items")
    .update(dbPatch)
    .eq("trip_id", tripId)
    .eq("source_id", sourceId);
  if (error) throw error;

  await supabase.from("trips").update({ updated_at: now, plan_ready: false }).eq("id", tripId).eq("user_id", user.id);
  notifyTripChange();
}

export async function removeItemFromTrip(tripId: string, sourceId: string) {
  const now = new Date().toISOString();
  const { supabase, user } = await getAuthenticatedUser();

  if (!supabase || !user) {
    await mutateLocal(trips => trips.map(trip => trip.id === tripId ? {
      ...trip,
      planReady: false,
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
  await supabase.from("trips").update({ updated_at: now, plan_ready: false }).eq("id", tripId).eq("user_id", user.id);
  notifyTripChange();
}
