/**
 * "Passt zu" vocabulary for Places (Sanity) and the matching profile
 * answers. Used by the Studio schema, the card projection and
 * lib/personalization. Values are stable IDs; labels are German.
 */

export const SUITABILITY = [
  { value: "kids_friendly", label: "Kinderfreundlich" },
  { value: "kids_care", label: "Kinderbetreuung" },
  { value: "dog_friendly", label: "Hundefreundlich" },
  { value: "groups", label: "Gruppentauglich (ab 8 Personen, Mannschaften)" },
  { value: "training", label: "Trainingsanlage / trainingslager-geeignet" },
  { value: "short_course", label: "Kurzplatz / 9 Löcher" }
] as const;

/** Same values as the profile's "Was gehört neben Golf dazu?" (TRIP_EXTRAS). */
export const ACTIVITIES_NEARBY = [
  { value: "hiking", label: "Wandern" },
  { value: "cycling", label: "Rad / E-Bike" },
  { value: "tennis_padel", label: "Tennis / Padel" },
  { value: "ski", label: "Skifahren / Winter" },
  { value: "beach_water", label: "Baden, Strand, Wassersport" },
  { value: "spa", label: "Spa / Wellness" },
  { value: "food_wine", label: "Gutes Essen und Wein" },
  { value: "culture_city", label: "Kultur und Stadt" },
  { value: "kids_program", label: "Kinderprogramm" },
  { value: "nightlife", label: "Bar und Nachtleben" }
] as const;

/** Same values as the profile's budget per night (room, not per person). */
export const PRICE_LEVEL = [
  { value: "under_150", label: "Bis 150 € pro Nacht (Zimmer)" },
  { value: "150_300", label: "150–300 €" },
  { value: "300_500", label: "300–500 €" },
  { value: "over_500", label: "Über 500 €" }
] as const;

export type SuitabilityTag = (typeof SUITABILITY)[number]["value"];
export type ActivityTag = (typeof ACTIVITIES_NEARBY)[number]["value"];
export type PriceLevel = (typeof PRICE_LEVEL)[number]["value"];

function known<T extends string>(values: unknown, list: readonly { value: T }[]): T[] {
  if (!Array.isArray(values)) return [];
  const allowed = new Set<string>(list.map(item => item.value));
  return [...new Set(values.filter((value): value is T => typeof value === "string" && allowed.has(value)))];
}

export function readSuitability(values: unknown) { return known(values, SUITABILITY); }
export function readActivities(values: unknown) { return known(values, ACTIVITIES_NEARBY); }
export function readStayPriceBand(value: unknown): PriceLevel | undefined {
  return PRICE_LEVEL.some(item => item.value === value) ? (value as PriceLevel) : undefined;
}
