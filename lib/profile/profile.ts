import { createClient } from "@/lib/supabase/client";
import {
  ACCOMMODATION_STYLES, AGE_BAND, BOOKING_CHANNEL, BUDGET_PER_NIGHT, COURSE_PREFERENCES, GROUP_SIZE, HANDICAP_BAND, INTERESTS, PLAY_FREQUENCY, ROUNDS_PER_TRIP, TRAVEL_COMPANIONS, TRAVEL_MODES, TRIPS_PER_YEAR, TRIP_EXTRAS, TRIP_LENGTH, TRIP_PURPOSES, WISHLIST_REGIONS,
  COURSE_TRANSPORT, GAME_FORMAT, NEMESIS, NINETEENTH_ORDER, PLAYER_TYPE, TEE_TIME_PREFERENCE, WEATHER_TOLERANCE,
  cleanBag, cleanMemories, organizerRoles, pickKnown, pickOne, type Bag, type Memories
} from "./options";

export type Profile = {
  displayName: string;
  homeRegion: string;
  homeAirport: string;
  homeClub: string;
  tripPurposes: string[];
  organizerRoles: string[];
  groupSize: string | null;
  travelCompanions: string[];
  tripExtras: string[];
  handicapBand: string | null;
  playFrequency: string | null;
  roundsPerTrip: string | null;
  coursePreferences: string[];
  tripsPerYear: string | null;
  preferredMonths: number[];
  monthsFlexible: boolean;
  tripLengths: string[];
  accommodationStyles: string[];
  budgetPerNight: string | null;
  travelModes: string[];
  bookingChannel: string | null;
  wishlistRegions: string[];
  interests: string[];
  ageBand: string | null;
  playerType: string | null;
  nemesis: string | null;
  teeTimePreference: string | null;
  weatherTolerance: string | null;
  courseTransport: string | null;
  gameFormat: string | null;
  nineteenthOrder: string | null;
  golfMotto: string;
  memories: Memories;
  bag: Bag;
  consentPartnerOffers: boolean;
  consentMarketResearch: boolean;
  onboardingCompletedAt: string | null;
  onboardingDismissedAt: string | null;
};

export const EMPTY_PROFILE: Profile = {
  displayName: "",
  homeRegion: "",
  homeAirport: "",
  homeClub: "",
  tripPurposes: [],
  organizerRoles: [],
  groupSize: null,
  travelCompanions: [],
  tripExtras: [],
  handicapBand: null,
  playFrequency: null,
  roundsPerTrip: null,
  coursePreferences: [],
  tripsPerYear: null,
  preferredMonths: [],
  monthsFlexible: false,
  tripLengths: [],
  accommodationStyles: [],
  budgetPerNight: null,
  travelModes: [],
  bookingChannel: null,
  wishlistRegions: [],
  interests: [],
  ageBand: null,
  playerType: null,
  nemesis: null,
  teeTimePreference: null,
  weatherTolerance: null,
  courseTransport: null,
  gameFormat: null,
  nineteenthOrder: null,
  golfMotto: "",
  memories: {},
  bag: {},
  consentPartnerOffers: false,
  consentMarketResearch: false,
  onboardingCompletedAt: null,
  onboardingDismissedAt: null
};

const COLUMNS = [
  "display_name",
  "home_region",
  "home_airport",
  "home_club",
  "trip_purposes",
  "organizer_roles",
  "group_size",
  "travel_companions",
  "trip_extras",
  "handicap_band",
  "play_frequency",
  "rounds_per_trip",
  "course_preferences",
  "trips_per_year",
  "preferred_months",
  "months_flexible",
  "trip_lengths",
  "accommodation_styles",
  "budget_per_night",
  "travel_modes",
  "booking_channel",
  "wishlist_regions",
  "interests",
  "age_band",
  "player_type",
  "nemesis",
  "tee_time_preference",
  "weather_tolerance",
  "course_transport",
  "game_format",
  "nineteenth_order",
  "golf_motto",
  "memories",
  "bag",
  "consent_partner_offers",
  "consent_market_research",
  "onboarding_completed_at",
  "onboarding_dismissed_at"
].join(",");

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function months(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((m): m is number => Number.isInteger(m) && m >= 1 && m <= 12))].sort((a, b) => a - b);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function profileFromRow(row: any): Profile {
  if (!row) return { ...EMPTY_PROFILE };
  return {
    displayName: row.display_name || "",
    homeRegion: row.home_region || "",
    homeAirport: row.home_airport || "",
    homeClub: row.home_club || "",
    tripPurposes: pickKnown(row.trip_purposes, TRIP_PURPOSES),
    organizerRoles: organizerRoles(row.organizer_roles),
    groupSize: pickOne(row.group_size, GROUP_SIZE),
    travelCompanions: pickKnown(row.travel_companions, TRAVEL_COMPANIONS),
    tripExtras: pickKnown(row.trip_extras, TRIP_EXTRAS),
    handicapBand: pickOne(row.handicap_band, HANDICAP_BAND),
    playFrequency: pickOne(row.play_frequency, PLAY_FREQUENCY),
    roundsPerTrip: pickOne(row.rounds_per_trip, ROUNDS_PER_TRIP),
    coursePreferences: pickKnown(row.course_preferences, COURSE_PREFERENCES),
    tripsPerYear: pickOne(row.trips_per_year, TRIPS_PER_YEAR),
    preferredMonths: months(row.preferred_months),
    monthsFlexible: Boolean(row.months_flexible),
    tripLengths: pickKnown(row.trip_lengths, TRIP_LENGTH),
    accommodationStyles: pickKnown(row.accommodation_styles, ACCOMMODATION_STYLES),
    budgetPerNight: pickOne(row.budget_per_night, BUDGET_PER_NIGHT),
    travelModes: pickKnown(row.travel_modes, TRAVEL_MODES),
    bookingChannel: pickOne(row.booking_channel, BOOKING_CHANNEL),
    wishlistRegions: pickKnown(row.wishlist_regions, WISHLIST_REGIONS),
    interests: pickKnown(row.interests, INTERESTS),
    ageBand: pickOne(row.age_band, AGE_BAND),
    playerType: pickOne(row.player_type, PLAYER_TYPE),
    nemesis: pickOne(row.nemesis, NEMESIS),
    teeTimePreference: pickOne(row.tee_time_preference, TEE_TIME_PREFERENCE),
    weatherTolerance: pickOne(row.weather_tolerance, WEATHER_TOLERANCE),
    courseTransport: pickOne(row.course_transport, COURSE_TRANSPORT),
    gameFormat: pickOne(row.game_format, GAME_FORMAT),
    nineteenthOrder: pickOne(row.nineteenth_order, NINETEENTH_ORDER),
    golfMotto: row.golf_motto || "",
    memories: cleanMemories(row.memories),
    bag: cleanBag(row.bag),
    consentPartnerOffers: Boolean(row.consent_partner_offers),
    consentMarketResearch: Boolean(row.consent_market_research),
    onboardingCompletedAt: row.onboarding_completed_at || null,
    onboardingDismissedAt: row.onboarding_dismissed_at || null
  };
}

/** Row patch for the fields present in `patch`; validates every value. */
export function profileToRow(patch: Partial<Profile>, previous?: Profile): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const now = new Date().toISOString();
  if ("displayName" in patch) row.display_name = clean(patch.displayName, 80) || null;
  if ("homeRegion" in patch) row.home_region = clean(patch.homeRegion, 80) || null;
  if ("homeAirport" in patch) row.home_airport = clean(patch.homeAirport, 80) || null;
  if ("homeClub" in patch) row.home_club = clean(patch.homeClub, 120) || null;
  if ("tripPurposes" in patch) row.trip_purposes = pickKnown(patch.tripPurposes, TRIP_PURPOSES);
  if ("organizerRoles" in patch) row.organizer_roles = organizerRoles(patch.organizerRoles);
  if ("groupSize" in patch) row.group_size = pickOne(patch.groupSize, GROUP_SIZE);
  if ("travelCompanions" in patch) row.travel_companions = pickKnown(patch.travelCompanions, TRAVEL_COMPANIONS);
  if ("tripExtras" in patch) row.trip_extras = pickKnown(patch.tripExtras, TRIP_EXTRAS);
  if ("handicapBand" in patch) row.handicap_band = pickOne(patch.handicapBand, HANDICAP_BAND);
  if ("playFrequency" in patch) row.play_frequency = pickOne(patch.playFrequency, PLAY_FREQUENCY);
  if ("roundsPerTrip" in patch) row.rounds_per_trip = pickOne(patch.roundsPerTrip, ROUNDS_PER_TRIP);
  if ("coursePreferences" in patch) row.course_preferences = pickKnown(patch.coursePreferences, COURSE_PREFERENCES);
  if ("tripsPerYear" in patch) row.trips_per_year = pickOne(patch.tripsPerYear, TRIPS_PER_YEAR);
  if ("preferredMonths" in patch) row.preferred_months = months(patch.preferredMonths);
  if ("monthsFlexible" in patch) row.months_flexible = Boolean(patch.monthsFlexible);
  if ("tripLengths" in patch) row.trip_lengths = pickKnown(patch.tripLengths, TRIP_LENGTH);
  if ("accommodationStyles" in patch) row.accommodation_styles = pickKnown(patch.accommodationStyles, ACCOMMODATION_STYLES);
  if ("budgetPerNight" in patch) row.budget_per_night = pickOne(patch.budgetPerNight, BUDGET_PER_NIGHT);
  if ("travelModes" in patch) row.travel_modes = pickKnown(patch.travelModes, TRAVEL_MODES);
  if ("bookingChannel" in patch) row.booking_channel = pickOne(patch.bookingChannel, BOOKING_CHANNEL);
  if ("wishlistRegions" in patch) row.wishlist_regions = pickKnown(patch.wishlistRegions, WISHLIST_REGIONS);
  if ("interests" in patch) row.interests = pickKnown(patch.interests, INTERESTS);
  if ("ageBand" in patch) row.age_band = pickOne(patch.ageBand, AGE_BAND);
  if ("playerType" in patch) row.player_type = pickOne(patch.playerType, PLAYER_TYPE);
  if ("nemesis" in patch) row.nemesis = pickOne(patch.nemesis, NEMESIS);
  if ("teeTimePreference" in patch) row.tee_time_preference = pickOne(patch.teeTimePreference, TEE_TIME_PREFERENCE);
  if ("weatherTolerance" in patch) row.weather_tolerance = pickOne(patch.weatherTolerance, WEATHER_TOLERANCE);
  if ("courseTransport" in patch) row.course_transport = pickOne(patch.courseTransport, COURSE_TRANSPORT);
  if ("gameFormat" in patch) row.game_format = pickOne(patch.gameFormat, GAME_FORMAT);
  if ("nineteenthOrder" in patch) row.nineteenth_order = pickOne(patch.nineteenthOrder, NINETEENTH_ORDER);
  if ("golfMotto" in patch) row.golf_motto = clean(patch.golfMotto, 120) || null;
  if ("memories" in patch) row.memories = cleanMemories(patch.memories);
  if ("bag" in patch) row.bag = cleanBag(patch.bag);
  if ("consentPartnerOffers" in patch) {
    row.consent_partner_offers = Boolean(patch.consentPartnerOffers);
    if (Boolean(patch.consentPartnerOffers) !== Boolean(previous?.consentPartnerOffers)) row.consent_partner_offers_at = now;
  }
  if ("consentMarketResearch" in patch) {
    row.consent_market_research = Boolean(patch.consentMarketResearch);
    if (Boolean(patch.consentMarketResearch) !== Boolean(previous?.consentMarketResearch)) row.consent_market_research_at = now;
  }
  if ("onboardingCompletedAt" in patch) row.onboarding_completed_at = patch.onboardingCompletedAt ?? null;
  if ("onboardingDismissedAt" in patch) row.onboarding_dismissed_at = patch.onboardingDismissedAt ?? null;
  return row;
}

export async function loadProfile(): Promise<{ userId: string; email: string | null; profile: Profile } | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("profiles").select(COLUMNS).eq("id", user.id).maybeSingle();
  if (error) throw error;
  return { userId: user.id, email: user.email ?? null, profile: profileFromRow(data) };
}

export async function saveProfile(patch: Partial<Profile>, previous?: Profile): Promise<Profile> {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase nicht verbunden");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht angemeldet");
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, ...profileToRow(patch, previous) }, { onConflict: "id" })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return profileFromRow(data);
}
