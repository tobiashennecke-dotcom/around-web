import type { CollectionDay, ContentCard } from "@/lib/types";

type RawDay = { key?: string; label?: string; title?: string; text?: string; items: ContentCard[] };

/**
 * Collection as a route (spec 16): keeps the editorial order, drops days
 * whose entries are all offline or missing, and caps a day at six entries.
 */
export function normalizeCollectionDays(days: RawDay[] | null | undefined): CollectionDay[] {
  return (days || [])
    .map((day, index) => ({
      key: day.key || `tag-${index + 1}`,
      label: (day.label || "").trim() || `Tag ${index + 1}`,
      title: day.title?.trim() || undefined,
      text: day.text?.trim() || undefined,
      items: (day.items || []).slice(0, 6)
    }))
    .filter(day => day.items.length > 0);
}

/** A route needs at least one visible day; otherwise the selection grid is shown. */
export function showsAsRoute(format: string | undefined, days: CollectionDay[]): boolean {
  return format === "route" && days.length > 0;
}

/** Places of all days, in order and without duplicates - the input for "Als Trip übernehmen". */
export function routePlaces(days: CollectionDay[]): ContentCard[] {
  const seen = new Set<string>();
  const places: ContentCard[] = [];
  for (const day of days) {
    for (const item of day.items) {
      if (item.type !== "place" || seen.has(item.id)) continue;
      seen.add(item.id);
      places.push(item);
    }
  }
  return places;
}
