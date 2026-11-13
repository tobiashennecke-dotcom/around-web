import { createClient } from "@/lib/supabase/client";
import {
  BUDGET_LEVEL, COURSE_PREFERENCES, HANDICAP_BAND, INTERESTS, PLAY_FREQUENCY,
  TRAVEL_MODES, TRAVEL_PARTY, TRIP_EXTRAS, TRIP_LENGTH, WISHLIST_REGIONS,
  pickKnown, pickOne
} from "./options";

export type Profile = {
  displayName: string;
  homeRegion: string;
  homeAirport: string;
  handicapBand: string | null;
  homeClub: string;
  playFrequency: string | null;
  coursePreferences: string[];
  travelParty: string | null;
  tripLength: string | null;
  preferredMonths: number[];
  budgetLevel: string | null;
  travelModes: string[];
  wishlistRegions: string[];
  tripExtras: string[];
  interests: string[];
  consentPartnerOffers: boolean;
  consentMarketResearch: boolean;
  onboardingCompletedAt: string | null;
  onboardingDismissedAt: string | null;
};

export const EMPTY_PROFILE: Profile = {
  displayName: "", homeRegion: "", homeAirport: "", handicapBand: null, homeClub: "",
  playFrequency: null, coursePreferences: [], travelParty: null, tripLength: null,
  preferredMonths: [], budgetLevel: null, travelModes: [], wishlistRegions: [],
  tripExtras: [], interests: [], consentPartnerOffers: false, consentMarketResearch: false,
  onboardingCompletedAt: null, onboardingDismissedAt: null
};

const COLUMNS = [
  "display_name", "home_region", "home_airport", "handicap_band", "home_club", "play_frequency",
  "course_preferences", "travel_party", "trip_length", "preferred_months", "budget_level",
  "travel_modes", "wishlist_regions", "trip_extras", "interests", "consent_partner_offers",
  "consent_market_research", "onboarding_completed_at", "onboarding_dismissed_at"
].join(",");

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function profileFromRow(row: any): Profile {
  if (!row) return { ...EMPTY_PROFILE };
  return {
    displayName: row.display_name || "",
    homeRegion: row.home_region || "",
    homeAirport: row.home_airport || "",
    handicapBand: pickOne(row.handicap_band, HANDICAP_BAND),
    homeClub: row.home_club || "",
    playFrequency: pickOne(row.play_frequency, PLAY_FREQUENCY),
    coursePreferences: pickKnown(row.course_preferences, COURSE_PREFERENCES),
    travelParty: pickOne(row.travel_party, TRAVEL_PARTY),
    tripLength: pickOne(row.trip_length, TRIP_LENGTH),
    preferredMonths: Array.isArray(row.preferred_months) ? row.preferred_months.filter((m: unknown) => typeof m === "number" && m >= 1 && m <= 12) : [],
    budgetLevel: pickOne(row.budget_level, BUDGET_LEVEL),
    travelModes: pickKnown(row.travel_modes, TRAVEL_MODES),
    wishlistRegions: pickKnown(row.wishlist_regions, WISHLIST_REGIONS),
    tripExtras: pickKnown(row.trip_extras, TRIP_EXTRAS),
    interests: pickKnown(row.interests, INTERESTS),
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
  if ("handicapBand" in patch) row.handicap_band = pickOne(patch.handicapBand, HANDICAP_BAND);
  if ("playFrequency" in patch) row.play_frequency = pickOne(patch.playFrequency, PLAY_FREQUENCY);
  if ("travelParty" in patch) row.travel_party = pickOne(patch.travelParty, TRAVEL_PARTY);
  if ("tripLength" in patch) row.trip_length = pickOne(patch.tripLength, TRIP_LENGTH);
  if ("budgetLevel" in patch) row.budget_level = pickOne(patch.budgetLevel, BUDGET_LEVEL);
  if ("coursePreferences" in patch) row.course_preferences = pickKnown(patch.coursePreferences, COURSE_PREFERENCES);
  if ("travelModes" in patch) row.travel_modes = pickKnown(patch.travelModes, TRAVEL_MODES);
  if ("wishlistRegions" in patch) row.wishlist_regions = pickKnown(patch.wishlistRegions, WISHLIST_REGIONS);
  if ("tripExtras" in patch) row.trip_extras = pickKnown(patch.tripExtras, TRIP_EXTRAS);
  if ("interests" in patch) row.interests = pickKnown(patch.interests, INTERESTS);
  if ("preferredMonths" in patch) {
    row.preferred_months = [...new Set((patch.preferredMonths || []).filter(m => Number.isInteger(m) && m >= 1 && m <= 12))].sort((a, b) => a - b);
  }
  if ("consentPartnerOffers" in patch) {
    row.consent_partner_offers = Boolean(patch.consentPartnerOffers);
    if (Boolean(patch.consentPartnerOffers) !== Boolean(previous?.consentPartnerOffers)) row.consent_partner_offers_at = now;
  }
  if ("consentMarketResearch" in patch) {
    row.consent_market_research = Boolean(patch.consentMarketResearch);
    if (Boolean(patch.consentMarketResearch) !== Boolean(previous?.consentMarketResearch)) row.consent_market_research_at = now;
  }
  if ("onboardingCompletedAt" in patch) row.onboarding_completed_at = patch.onboardingCompletedAt;
  if ("onboardingDismissedAt" in patch) row.onboarding_dismissed_at = patch.onboardingDismissedAt;
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
