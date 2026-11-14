/**
 * Profile vocabulary: stored values (match the DB check constraints in
 * supabase/migrations/20261113_profile_preferences.sql) and German labels.
 */
export type Option<T extends string = string> = { value: T; label: string };

export const PLAY_FREQUENCY = [
  { value: "rarely", label: "Selten" },
  { value: "few_per_year", label: "Ein paar Mal im Jahr" },
  { value: "monthly", label: "1–2 Mal im Monat" },
  { value: "weekly", label: "Jede Woche" },
  { value: "almost_daily", label: "Fast täglich" }
] as const satisfies readonly Option[];

export const TRIP_EXTRAS = [
  { value: "hiking", label: "Wandern" },
  { value: "cycling", label: "Rad oder E-Bike" },
  { value: "tennis_padel", label: "Tennis oder Padel" },
  { value: "ski", label: "Skifahren und Winter" },
  { value: "beach_water", label: "Baden, Strand, Wassersport" },
  { value: "spa", label: "Spa und Wellness" },
  { value: "food_wine", label: "Gutes Essen und Wein" },
  { value: "culture_city", label: "Kultur und Stadt" },
  { value: "kids_program", label: "Kinderprogramm und -betreuung" },
  { value: "nightlife", label: "Bar und Nachtleben" },
  { value: "do_nothing", label: "Einfach nichts tun" }
] as const satisfies readonly Option[];

export const HANDICAP_BAND = [
  { value: "beginner", label: "Platzreife oder Anfänger" },
  { value: "36_plus", label: "Über 36" },
  { value: "20_36", label: "20 bis 36" },
  { value: "10_20", label: "10 bis 20" },
  { value: "under_10", label: "Unter 10" }
] as const satisfies readonly Option[];

export const COURSE_PREFERENCES = [
  { value: "links", label: "Links" },
  { value: "parkland", label: "Parkland" },
  { value: "mountain", label: "Berge" },
  { value: "sea_view", label: "Meerblick" },
  { value: "championship", label: "Championship" },
  { value: "hidden", label: "Kleine, versteckte Plätze" },
  { value: "practice_facility", label: "Gute Übungsanlage" },
  { value: "short_course", label: "Kurzplatz oder 9 Löcher" }
] as const satisfies readonly Option[];

export const TRIP_LENGTH = [
  { value: "weekend", label: "Wochenende" },
  { value: "4_5_days", label: "4–5 Tage" },
  { value: "week", label: "Eine Woche" },
  { value: "longer", label: "Länger" }
] as const satisfies readonly Option[];

export const TRAVEL_MODES = [
  { value: "car", label: "Auto" },
  { value: "train", label: "Bahn" },
  { value: "flight", label: "Flug" },
  { value: "camper", label: "Wohnmobil" }
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

export const TRIP_PURPOSES = [
  { value: "couple", label: "Urlaub zu zweit" },
  { value: "friends_weekend", label: "Golf-Wochenende mit Freunden" },
  { value: "family", label: "Familienurlaub mit Golf" },
  { value: "team_trip", label: "Mannschaftsreise" },
  { value: "club_seniors_outing", label: "Club- oder Seniorenausflug" },
  { value: "training_camp", label: "Trainingslager oder Golfkurs" },
  { value: "tournament", label: "Turnierreise" },
  { value: "active_holiday", label: "Aktivurlaub: Golf plus Wandern, Rad, Tennis" },
  { value: "corporate", label: "Firmenreise oder Incentive" }
] as const satisfies readonly Option[];

export const ORGANIZER_ROLE = [
  { value: "none", label: "Nein, nur für mich oder uns" },
  { value: "friends", label: "Ja, für Freunde" },
  { value: "captain_men", label: "Ja, als Captain einer Herrenmannschaft" },
  { value: "captain_women", label: "Ja, als Captain einer Damenmannschaft" },
  { value: "captain_seniors", label: "Ja, als Captain einer Senioren- oder Seniorinnenmannschaft" },
  { value: "captain_youth_mixed", label: "Ja, als Captain einer Jugend- oder Mixed-Mannschaft" },
  { value: "club", label: "Ja, für den Club" },
  { value: "professional", label: "Ja, beruflich" }
] as const satisfies readonly Option[];

export const GROUP_SIZE = [
  { value: "2_4", label: "2–4" },
  { value: "5_8", label: "5–8" },
  { value: "9_16", label: "9–16" },
  { value: "17_plus", label: "17 und mehr" }
] as const satisfies readonly Option[];

export const TRAVEL_COMPANIONS = [
  { value: "solo", label: "Niemand, ich reise allein" },
  { value: "partner_golfs", label: "Partner, golft auch" },
  { value: "partner_non_golfer", label: "Partner, golft nicht" },
  { value: "friends", label: "Freunde oder Flight" },
  { value: "team_club", label: "Mannschaft oder Club" },
  { value: "toddlers", label: "Kleinkinder (0–5)" },
  { value: "kids", label: "Kinder (6–12)" },
  { value: "teens", label: "Teenager (13–17)" },
  { value: "kids_play_golf", label: "Kinder spielen selbst Golf" },
  { value: "dog", label: "Hund" }
] as const satisfies readonly Option[];

export const ROUNDS_PER_TRIP = [
  { value: "1_2", label: "1–2" },
  { value: "3_4", label: "3–4" },
  { value: "5_plus", label: "5 und mehr" },
  { value: "daily", label: "Jeden Tag, so viel wie geht" }
] as const satisfies readonly Option[];

export const TRIPS_PER_YEAR = [
  { value: "1", label: "1" },
  { value: "2_3", label: "2–3" },
  { value: "4_plus", label: "4 und mehr" }
] as const satisfies readonly Option[];

export const ACCOMMODATION_STYLES = [
  { value: "golf_hotel", label: "Golfhotel direkt am Platz" },
  { value: "spa_hotel", label: "Wellness- oder Spa-Hotel" },
  { value: "boutique", label: "Boutique- oder Designhotel" },
  { value: "family_hotel", label: "Familienhotel" },
  { value: "chalet_apartment", label: "Chalet oder Ferienwohnung" },
  { value: "simple", label: "Einfach und gut, nah am Platz" }
] as const satisfies readonly Option[];

export const BUDGET_PER_NIGHT = [
  { value: "under_150", label: "Bis 150 €" },
  { value: "150_300", label: "150–300 €" },
  { value: "300_500", label: "300–500 €" },
  { value: "over_500", label: "Über 500 €" }
] as const satisfies readonly Option[];

export const BOOKING_CHANNEL = [
  { value: "direct", label: "Selbst, direkt beim Hotel oder Club" },
  { value: "portals", label: "Über Buchungsportale" },
  { value: "tour_operator", label: "Über Golfreise-Veranstalter oder Reisebüro" },
  { value: "club_team", label: "Club oder Mannschaft organisiert" }
] as const satisfies readonly Option[];

export const AGE_BAND = [
  { value: "under_30", label: "Unter 30" },
  { value: "30_44", label: "30–44" },
  { value: "45_59", label: "45–59" },
  { value: "60_69", label: "60–69" },
  { value: "70_plus", label: "70+" }
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

/** "Nein" (none) excludes every other organizer answer. */
export function organizerRoles(value: unknown): string[] {
  const roles = pickKnown<string>(value, ORGANIZER_ROLE);
  return roles.includes("none") && roles.length > 1 ? roles.filter(role => role !== "none") : roles;
}


/* ---------- Steckbrief (fun) ---------- */

export const PLAYER_TYPE = [
  { value: "early_starter", label: "Der Frühstarter" },
  { value: "range_philosopher", label: "Der Driving-Range-Philosoph" },
  { value: "short_game_artist", label: "Der Kurzspiel-Künstler" },
  { value: "long_hitter", label: "Der Longhitter mit Folgen" },
  { value: "rules_expert", label: "Der Regelkundige" },
  { value: "nineteenth_hole_pro", label: "Der 19.-Loch-Profi" }
] as const satisfies readonly Option[];

export const NEMESIS = [
  { value: "bunker", label: "Bunker" },
  { value: "water", label: "Wasser" },
  { value: "short_putts", label: "Ein-Meter-Putts" },
  { value: "first_tee", label: "Der erste Abschlag" },
  { value: "wind", label: "Wind" },
  { value: "flight_partner", label: "Mein Flightpartner" }
] as const satisfies readonly Option[];

export const TEE_TIME_PREFERENCE = [
  { value: "first_tee_time", label: "Erste Startzeit (7:04)" },
  { value: "morning", label: "Vormittag" },
  { value: "midday", label: "Mittag" },
  { value: "twilight", label: "Twilight" }
] as const satisfies readonly Option[];

export const WEATHER_TOLERANCE = [
  { value: "sun_only", label: "Nur bei Sonne" },
  { value: "clouds_ok", label: "Wolken gehen" },
  { value: "drizzle_ok", label: "Nieselregen ist Golfwetter" },
  { value: "always", label: "Immer, auch im Winter" }
] as const satisfies readonly Option[];

export const COURSE_TRANSPORT = [
  { value: "carry", label: "Tragebag" },
  { value: "trolley", label: "Trolley" },
  { value: "e_trolley", label: "E-Trolley" },
  { value: "cart", label: "Cart" }
] as const satisfies readonly Option[];

export const GAME_FORMAT = [
  { value: "strokeplay", label: "Zählspiel" },
  { value: "stableford", label: "Stableford" },
  { value: "matchplay", label: "Matchplay" },
  { value: "scramble", label: "Scramble" },
  { value: "no_counting", label: "Hauptsache nicht zählen" }
] as const satisfies readonly Option[];

export const NINETEENTH_ORDER = [
  { value: "weissbier", label: "Weißbier" },
  { value: "radler", label: "Radler" },
  { value: "spritz", label: "Spritz" },
  { value: "gin_tonic", label: "Gin Tonic" },
  { value: "coffee", label: "Kaffee" },
  { value: "water_driving", label: "Wasser, ich fahre" }
] as const satisfies readonly Option[];

export type Memories = {
  holeInOne?: { course?: string; hole?: number; date?: string; club?: string };
  bestRound?: { course?: string; score?: string; date?: string };
  favoriteHole?: { course?: string; hole?: number };
  mostBeautifulCourse?: string;
};

export type Bag = { driver?: string; irons?: string; putter?: string; ball?: string };

function str(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, max);
  return trimmed || undefined;
}

function hole(value: unknown): number | undefined {
  const number = typeof value === "string" ? Number(value) : value;
  return typeof number === "number" && Number.isInteger(number) && number >= 1 && number <= 27 ? number : undefined;
}

function isoDate(value: unknown): string | undefined {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function compact<T extends Record<string, unknown>>(value: T): T | undefined {
  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  return entries.length ? (Object.fromEntries(entries) as T) : undefined;
}

/** Keeps only known memory fields with sane values. */
export function cleanMemories(value: unknown): Memories {
  const input = (value && typeof value === "object" ? value : {}) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const result: Memories = {};
  const hio = compact({ course: str(input.holeInOne?.course, 120), hole: hole(input.holeInOne?.hole), date: isoDate(input.holeInOne?.date), club: str(input.holeInOne?.club, 40) });
  if (hio) result.holeInOne = hio;
  const best = compact({ course: str(input.bestRound?.course, 120), score: str(input.bestRound?.score, 20), date: isoDate(input.bestRound?.date) });
  if (best) result.bestRound = best;
  const fav = compact({ course: str(input.favoriteHole?.course, 120), hole: hole(input.favoriteHole?.hole) });
  if (fav) result.favoriteHole = fav;
  const beautiful = str(input.mostBeautifulCourse, 120);
  if (beautiful) result.mostBeautifulCourse = beautiful;
  return result;
}

export function cleanBag(value: unknown): Bag {
  const input = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return compact({ driver: str(input.driver, 80), irons: str(input.irons, 80), putter: str(input.putter, 80), ball: str(input.ball, 80) }) || {};
}
