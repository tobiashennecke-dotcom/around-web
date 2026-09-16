/**
 * AROUND v1.26d - MY AROUND Home.
 *
 * Pure, dependency-free selection/formatting helpers for the personal
 * dashboard. selectFocusTrip() is the one piece of real logic here and must
 * stay independently testable: given a list of Trips and "now", it decides
 * which single Trip the dashboard leads with, and whether that counts as an
 * actual upcoming journey or just "still being planned". It never guesses
 * travel intent beyond the Trip's own dates/status.
 */

import type { UserTrip, TripStatus } from "@/lib/supabase/trips";
import type { UserCollection } from "@/lib/supabase/collections";

export type FocusTripHeading = "next-trip" | "continue-planning";

export type FocusTripSelection = {
  trip: UserTrip;
  /** true only when the Trip has a real, parseable startDate today or later. */
  heading: FocusTripHeading;
};

/**
 * Parses a "YYYY-MM-DD" Trip date as a local calendar date, not a UTC
 * instant. Rejects impossible calendar dates (e.g. 2026-02-31) instead of
 * allowing JS Date's silent rollover (which would otherwise resolve that to
 * 2026-03-03) - an invalid date means "no date", not "some other date".
 */
function toCalendarDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function byMostRecentlyUpdated(a: UserTrip, b: UserTrip): number {
  return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
}

/**
 * Deterministic priority:
 * 1. Upcoming Trip with startDate >= today - earliest startDate first.
 *    A future date always wins here regardless of status (test case A):
 *    a dated "idea" still outranks an undated "planning" Trip.
 * 2. Trip with status booked/planning - most recently updated first.
 * 3. Any non-completed Trip - most recently updated first.
 * 4. Any Trip at all - most recently updated first.
 * Returns null only for an empty list.
 */
export function selectFocusTrip(trips: UserTrip[], now: Date = new Date()): FocusTripSelection | null {
  if (!trips.length) return null;
  const today = startOfDay(now).getTime();

  const upcoming = trips
    .map(trip => ({ trip, startDate: trip.startDate ? toCalendarDate(trip.startDate) : null }))
    .filter((entry): entry is { trip: UserTrip; startDate: Date } => Boolean(entry.startDate) && entry.startDate!.getTime() >= today);

  if (upcoming.length) {
    upcoming.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    return { trip: upcoming[0].trip, heading: "next-trip" };
  }

  const activePlanningStatuses: TripStatus[] = ["booked", "planning"];
  const activePlanning = trips.filter(trip => activePlanningStatuses.includes(trip.status));
  if (activePlanning.length) {
    return { trip: [...activePlanning].sort(byMostRecentlyUpdated)[0], heading: "continue-planning" };
  }

  const nonCompleted = trips.filter(trip => trip.status !== "completed");
  if (nonCompleted.length) {
    return { trip: [...nonCompleted].sort(byMostRecentlyUpdated)[0], heading: "continue-planning" };
  }

  return { trip: [...trips].sort(byMostRecentlyUpdated)[0], heading: "continue-planning" };
}

const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  idea: "Idee",
  planning: "Planung",
  booked: "Gebucht",
  completed: "Erlebt"
};

export function tripStatusLabel(status: TripStatus): string {
  return TRIP_STATUS_LABELS[status] || status;
}

/** Compact date-range label consistent with the Trip Planner's own formatting. */
export function formatTripDateRange(start?: string, end?: string): string {
  if (!start && !end) return "Termin offen";
  const format = (value: string) => new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short" }).format(new Date(`${value}T12:00:00`));
  if (start && end) return `${format(start)} – ${format(end)}`;
  return start ? `ab ${format(start)}` : `bis ${format(end as string)}`;
}

/**
 * MY AROUND Home's Collections preview must always mean "most recently
 * updated first" - listUserCollections()'s own array order is not relied
 * upon here, since guest (localStorage) storage does not guarantee
 * updatedAt ordering after edits (only account/Supabase mode is queried
 * pre-sorted). Ties fall back to id for a stable, deterministic order. Does
 * not affect the Collections workspace's own ordering.
 */
export function sortCollectionsByRecentlyUpdated(collections: UserCollection[]): UserCollection[] {
  return [...collections].sort((a, b) => {
    const diff = Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    if (diff !== 0) return diff;
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });
}
