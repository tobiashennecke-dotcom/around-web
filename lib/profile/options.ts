/**
 * Profile vocabulary: stored values (match the DB check constraints in
 * supabase/migrations/20261113_profile_preferences.sql) and German labels.
 */
export type Option<T extends string = string> = { value: T; label: string };

export const PLAY_FREQUENCY = [
  { value: "rarely", label: "Selten" },
  { value: "few_per_year", label: "Ein paar Mal im Jahr" },
  { value: "weekly", label: "Jede Woche" },
  { value: "almost_daily", label: "Fast täglich" }
] as const satisfies readonly Option[];

export const TRAVEL_PARTY = [
  { value: "solo", label: "Allein" },
  { value: "couple_both_golf", label: "Zu zweit, beide golfen" },
  { value: "couple_one_golfs", label: "Zu zweit, einer golft" },
  { value: "friends", label: "Freunde / Flight" },
  { value: "family", label: "Familie" }
] as const satisfies readonly Option[];

export const TRIP_EXTRAS = [
  { value: "spa", label: "Spa" },
  { value: "food", label: "Gutes Essen" },
  { value: "nature", label: "Natur & Berge" },
  { value: "sea", label: "Meer" },
  { value: "culture", label: "Kultur & Stadt" },
  { value: "nightlife", label: "Nightlife" }
] as const satisfies readonly Option[];

export const HANDICAP_BAND = [
  { value: "under_10", label: "Unter 10" },
  { value: "10_20", label: "10 bis 20" },
  { value: "20_36", label: "20 bis 36" },
  { value: "36_plus", label: "Über 36" },
  { value: "none", label: "Ohne Handicap" }
] as const satisfies readonly Option[];

export const COURSE_PREFERENCES = [
  { value: "links", label: "Links" },
  { value: "parkland", label: "Parkland" },
  { value: "mountain", label: "Berge" },
  { value: "sea_view", label: "Meerblick" },
  { value: "championship", label: "Championship" },
  { value: "hidden", label: "Kleine, versteckte Plätze" }
] as const satisfies readonly Option[];

export const TRIP_LENGTH = [
  { value: "weekend", label: "Wochenende" },
  { value: "4_5_days", label: "4–5 Tage" },
  { value: "week", label: "Eine Woche" },
  { value: "longer", label: "Länger" }
] as const satisfies readonly Option[];

export const BUDGET_LEVEL = [
  { value: "relaxed", label: "Entspannt" },
  { value: "upscale", label: "Gehoben" },
  { value: "luxury", label: "Luxus" }
] as const satisfies readonly Option[];

export const TRAVEL_MODES = [
  { value: "car", label: "Auto" },
  { value: "train", label: "Bahn" },
  { value: "flight", label: "Flug" }
] as const satisfies readonly Option[];

export const WISHLIST_REGIONS = [
  { value: "alps", label: "Alpen" },
  { value: "north_baltic", label: "Nord- & Ostsee" },
  { value: "mediterranean", label: "Mittelmeer" },
  { value: "atlantic", label: "Atlantik" },
  { value: "uk_ireland", label: "UK & Irland" },
  { value: "scandinavia_baltics", label: "Skandinavien & Baltikum" },
  { value: "long_haul", label: "Fernreise" }
] as const satisfies readonly Option[];

export const INTERESTS = [
  { value: "play", label: "PLAY" },
  { value: "stay", label: "STAY" },
  { value: "eat", label: "EAT" },
  { value: "do", label: "DO" },
  { value: "stories", label: "STORIES" },
  { value: "people", label: "PEOPLE" },
  { value: "objects", label: "OBJECTS" }
] as const satisfies readonly Option[];

export const MONTHS = [
  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"
].map((label, index) => ({ value: index + 1, label }));

/** Keeps only known values (drops anything the browser made up). */
export function pickKnown<T extends string>(values: unknown, options: readonly Option<T>[]): T[] {
  if (!Array.isArray(values)) return [];
  const allowed = new Set<string>(options.map(option => option.value));
  return [...new Set(values.filter((value): value is T => typeof value === "string" && allowed.has(value)))];
}

export function pickOne<T extends string>(value: unknown, options: readonly Option<T>[]): T | null {
  return typeof value === "string" && options.some(option => option.value === value) ? (value as T) : null;
}
