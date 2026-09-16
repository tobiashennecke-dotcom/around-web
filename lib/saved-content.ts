import type { SavePayload } from "@/lib/supabase/saves";
import { normalizeContentRole } from "@/lib/content-role";

/**
 * Saved Library top-level filters (v1.26b). Deliberately does not include a
 * "collection" filter - saved_items rarely holds saved Collection documents
 * in a meaningful way, so a saved Collection (if one exists) is still
 * shown, just only under ALL.
 */
export type SavedLibraryFilter = "all" | "story" | "place" | "destination" | "person" | "object";

export const SAVED_LIBRARY_FILTERS: { value: SavedLibraryFilter; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "story", label: "STORIES" },
  { value: "place", label: "PLACES" },
  { value: "destination", label: "DESTINATIONS" },
  { value: "person", label: "PEOPLE" },
  { value: "object", label: "OBJECTS" }
];

/** Which top-level filter a saved item belongs to. Anything unrecognized (e.g. a saved Collection) only ever matches "all". */
export function savedLibraryFilterForItem(item: SavePayload): SavedLibraryFilter | null {
  if (item.sourceType === "story") return "story";
  if (item.sourceType === "place") return "place";
  if (item.sourceType === "destination") return "destination";
  if (item.sourceType === "person") return "person";
  if (item.sourceType === "product" || item.sourceType === "object") return "object";
  return null;
}

export function matchesSavedLibraryFilter(item: SavePayload, filter: SavedLibraryFilter): boolean {
  if (filter === "all") return true;
  return savedLibraryFilterForItem(item) === filter;
}

export function savedLibraryFilterEmptyMessage(filter: SavedLibraryFilter): string {
  switch (filter) {
    case "story": return "Noch keine Stories gespeichert.";
    case "place": return "Noch keine Places gespeichert.";
    case "destination": return "Noch keine Reisen gespeichert.";
    case "person": return "Noch keine Menschen gespeichert.";
    case "object": return "Noch keine Objects gespeichert.";
    default: return "In dieser Kategorie hast du noch nichts gespeichert.";
  }
}

export function savedLibraryHref(item: SavePayload): string {
  if (item.sourceType === "destination") return `/destinations/${item.slug}`;
  if (item.sourceType === "place") return `/places/${item.slug}`;
  if (item.sourceType === "story") return `/stories/${item.slug}`;
  if (item.sourceType === "person") return `/people/${item.slug}`;
  if (item.sourceType === "product" || item.sourceType === "object") return `/objects/${item.slug}`;
  if (item.sourceType === "collection") return `/collections/${item.slug}`;
  return "/discover";
}

/** Content-specific primary action label for a saved item's open/read link. */
export function savedItemPrimaryAction(item: SavePayload): string {
  if (item.sourceType === "story") return "READ →";
  if (item.sourceType === "place") return "VIEW PLACE →";
  if (item.sourceType === "destination") return "EXPLORE →";
  if (item.sourceType === "person") return "VIEW PROFILE →";
  if (item.sourceType === "product" || item.sourceType === "object") return "VIEW →";
  if (item.sourceType === "collection") return "OPEN →";
  return "OPEN →";
}

/**
 * MY AROUND SAVED is a library, not a Trip staging area: SAVE, COLLECTION
 * and TRIP stay independent layers. A saved Story or Person can be
 * organized into a Collection without ever becoming a Trip item - the
 * correct conversion path for a Story is Story -> related Place -> Trip,
 * never Story -> Trip item directly. Destination keeps its current
 * TripPicker behavior unchanged; this helper does not redesign it.
 */
export function isTripEligibleSavedItem(item: SavePayload): boolean {
  if (item.sourceType === "destination") return true;
  if (item.sourceType === "place") return Boolean(normalizeContentRole(item.sourceRole));
  return false;
}

/** CollectionPicker is available for everything except a saved Collection itself. */
export function isCollectionEligibleSavedItem(item: SavePayload): boolean {
  return item.sourceType !== "collection";
}
