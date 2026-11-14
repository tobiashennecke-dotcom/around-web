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

/**
 * Price band per room night, same values as the profile's budget.
 * Measuring rule (also shown in the Studio): standard double room, one
 * night, with breakfast, in the destination's main golf season; price for
 * the room, not per person. Half board / all-inclusive houses: take the
 * price as offered and set STAY_BOARD accordingly.
 */
export const PRICE_LEVEL = [
  { value: "under_150", label: "€ · Einfach & gut · bis 150 €", symbol: "€", name: "Einfach & gut" },
  { value: "150_300", label: "€€ · Komfort · 150–300 €", symbol: "€€", name: "Komfort" },
  { value: "300_500", label: "€€€ · Gehoben · 300–500 €", symbol: "€€€", name: "Gehoben" },
  { value: "over_500", label: "€€€€ · Luxus · über 500 €", symbol: "€€€€", name: "Luxus" }
] as const;

export const PRICE_RULE = "Standard-Doppelzimmer, eine Nacht, mit Frühstück, in der Golf-Hauptsaison der Destination. Preis fürs Zimmer, nicht pro Person.";

/** What the price band includes. */
export const STAY_BOARD = [
  { value: "room_only", label: "Ohne Verpflegung" },
  { value: "breakfast", label: "Frühstück" },
  { value: "half_board", label: "Halbpension" },
  { value: "all_inclusive", label: "All-inclusive" }
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

export function readStayBoard(value: unknown) {
  return STAY_BOARD.some(item => item.value === value) ? (value as (typeof STAY_BOARD)[number]["value"]) : undefined;
}

/** "€€€ · Halbpension" for display; undefined without a band. */
export function stayPriceLabel(band?: string, board?: string) {
  const level = PRICE_LEVEL.find(item => item.value === band);
  if (!level) return undefined;
  const meal = STAY_BOARD.find(item => item.value === board);
  return [`${level.symbol} ${level.name}`, meal && meal.value !== "breakfast" ? meal.label : undefined].filter(Boolean).join(" · ");
}
