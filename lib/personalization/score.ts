/**
 * "Für dich": how well a Place fits a profile. Pure and explainable:
 * every point comes with a reason the user can read. Editorial order stays
 * the default everywhere; this only picks and lightly boosts.
 */

export type FitProfile = {
  travelCompanions: string[];
  organizerRoles: string[];
  groupSize: string | null;
  tripPurposes: string[];
  coursePreferences: string[];
  handicapBand: string | null;
  tripExtras: string[];
  budgetPerNight: string | null;
  interests: string[];
};

export type FitItem = {
  id: string;
  type: string;
  placeType?: string;
  suitability?: string[];
  activitiesNearby?: string[];
  stayPriceBand?: string;
  destinationId?: string;
  aroundSelected?: boolean;
};

export type FitContext = { savedDestinationIds?: Set<string> };

export type FitResult = { score: number; reasons: string[] };

const PRICE_ORDER = ["under_150", "150_300", "300_500", "over_500"];
const ACTIVITY_LABEL: Record<string, string> = {
  hiking: "Wandern in der Nähe", cycling: "Radfahren in der Nähe", tennis_padel: "Tennis & Padel", ski: "Ski in der Nähe",
  beach_water: "Strand & Wasser", spa: "Spa", food_wine: "Gutes Essen & Wein", culture_city: "Kultur & Stadt",
  kids_program: "Kinderprogramm", nightlife: "Bar & Nachtleben"
};
const ROLE_OF: Record<string, string> = { course: "play", play: "play", stay: "stay", eat: "eat", drink: "eat", do: "do", culture: "do", shop: "do" };

export function wantsGroups(profile: FitProfile) {
  return profile.travelCompanions.includes("team_club")
    || profile.organizerRoles.some(role => role.startsWith("captain_") || role === "club" || role === "professional")
    || profile.groupSize === "9_16" || profile.groupSize === "17_plus"
    || profile.tripPurposes.some(purpose => ["team_trip", "club_seniors_outing", "corporate"].includes(purpose));
}

/** True once the profile says anything personalization can use. */
export function hasFitSignals(profile: FitProfile) {
  return Boolean(
    profile.travelCompanions.length || profile.organizerRoles.some(role => role !== "none") || profile.tripPurposes.length
    || profile.coursePreferences.length || profile.handicapBand || profile.tripExtras.length || profile.budgetPerNight || profile.interests.length
  );
}

export function scoreFit(item: FitItem, profile: FitProfile, context: FitContext = {}): FitResult {
  if (item.type !== "place") return { score: 0, reasons: [] };
  const tags = new Set(item.suitability || []);
  const reasons: { points: number; text: string }[] = [];
  const add = (points: number, text: string) => reasons.push({ points, text });

  const companions = new Set(profile.travelCompanions);
  if (companions.has("toddlers")) {
    if (tags.has("kids_care")) add(3, "Kinderbetreuung");
    else if (tags.has("kids_friendly")) add(2, "Kinderfreundlich");
  } else if ((companions.has("kids") || companions.has("teens")) && tags.has("kids_friendly")) {
    add(2, "Kinderfreundlich");
  }
  if (companions.has("dog") && tags.has("dog_friendly")) add(3, "Hund willkommen");
  if (wantsGroups(profile) && tags.has("groups")) add(3, "Für Gruppen & Mannschaften");
  if ((profile.tripPurposes.includes("training_camp") || profile.coursePreferences.includes("practice_facility")) && tags.has("training")) {
    add(3, "Trainingsanlage");
  }
  if ((profile.coursePreferences.includes("short_course") || profile.handicapBand === "beginner" || companions.has("kids_play_golf")) && tags.has("short_course")) {
    add(2, "Kurzplatz");
  }

  const activities = (item.activitiesNearby || []).filter(activity => profile.tripExtras.includes(activity)).slice(0, 3);
  for (const activity of activities) add(1, ACTIVITY_LABEL[activity] || activity);

  if (item.placeType === "stay" && item.stayPriceBand && profile.budgetPerNight) {
    const distance = Math.abs(PRICE_ORDER.indexOf(item.stayPriceBand) - PRICE_ORDER.indexOf(profile.budgetPerNight));
    if (distance === 0) add(2, "Passt zu deinem Budget");
    else if (distance === 1) add(0.5, "");
    else add(-1.5, "");
  }

  const role = ROLE_OF[item.placeType || ""];
  if (role && profile.interests.includes(role)) add(1, "");
  if (item.destinationId && context.savedDestinationIds?.has(item.destinationId)) add(1.5, "Bei einer Destination, die du dir gemerkt hast");
  if (item.aroundSelected) add(0.5, "");

  const score = reasons.reduce((sum, reason) => sum + reason.points, 0);
  const visible = reasons.filter(reason => reason.text && reason.points > 0).sort((a, b) => b.points - a.points).map(reason => reason.text);
  return { score, reasons: [...new Set(visible)].slice(0, 3) };
}

/** A real match needs at least one concrete reason, not just interest or selection bonuses. */
export function isRecommendation(result: FitResult) {
  return result.score >= 2 && result.reasons.length > 0;
}

/** Mild search boost: a strong fit moves up a few places, never to the top by force. */
export function personalizeOrder<T extends FitItem>(items: T[], profile: FitProfile, context: FitContext = {}): T[] {
  return items
    .map((item, index) => ({ item, key: index - Math.max(0, scoreFit(item, profile, context).score) * 1.5 }))
    .sort((a, b) => a.key - b.key)
    .map(entry => entry.item);
}
