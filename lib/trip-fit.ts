/**
 * AROUND Trip Fit Engine V0.
 *
 * PLACE INTELLIGENCE + ACTUAL TRIP CONTEXT + GEOGRAPHY = TRIP INTELLIGENCE.
 *
 * This is a deterministic calculator, not a recommender and not an LLM. It decides
 * whether and why a candidate Place plausibly fits into a concrete day of an
 * existing trip, using only:
 * - the candidate's own editorial/planning metadata (Sanity Place Intelligence)
 * - the trip's actual items for that day (real fixed times/durations only)
 * - geography supplied by the caller (this module never resolves coordinates)
 *
 * Deliberately not implemented here (see AROUND v1.24b spec):
 * - Arrival Day recommendations
 * - weather forecasts / opening hours / live drive times
 * - any AI/LLM reasoning
 * - user-preference scoring
 *
 * This module is intentionally dependency-free (no imports at all): no network
 * requests, no Supabase client, no Sanity client, no mutation of its inputs. That
 * keeps it trivially reusable from Trip Quick Add, Trip Planner, Place Detail,
 * Destination Detail and Concierge without dragging in any runtime coupling.
 * Retrieval/adapters (resolving coordinates, fetching trip items, etc.) live
 * outside this module, in whichever caller needs them.
 */

// ---------------------------------------------------------------------------
// Shared vocabulary (kept structurally identical to lib/types.ts / the Supabase
// trip model, but redeclared locally so this module stays import-free).
// ---------------------------------------------------------------------------

export type TripFitDaypart = "morning" | "midday" | "afternoon" | "evening" | "all_day";
export type TripFitPlanningMode = "flexible" | "fixed";
export type TripFitEffortLevel = "low" | "medium" | "high";
export type TripFitEnvironment = "indoor" | "outdoor" | "mixed";
export type TripFitWeatherSensitivity = "low" | "medium" | "high";
/** Normalized content role, matching lib/content-role.ts's ContentRole. */
export type TripFitRole = "play" | "stay" | "eat" | "do";

/** The subset of Place/ContentCard planning metadata the engine actually reads. */
export type TripFitCandidate = {
  /** Must equal the sourceId used when this Place is added to a trip. */
  id: string;
  role?: TripFitRole;
  defaultPlanningMode?: TripFitPlanningMode;
  suggestedDurationMinutes?: number;
  suggestedDaypart?: TripFitDaypart;
  compatibleDayparts?: TripFitDaypart[];
  effortLevel?: TripFitEffortLevel;
  environment?: TripFitEnvironment;
  weatherSensitivity?: TripFitWeatherSensitivity;
  priority?: number;
  featured?: boolean;
  aroundSelected?: boolean;
  // Deliberately no commercialPartner field - the engine cannot read a flag it
  // doesn't accept, which is the strongest guarantee that it can never influence score.
};

/** The subset of an existing TripItem the engine needs for a given day. */
export type TripFitItem = {
  sourceId: string;
  role?: TripFitRole;
  dayIndex?: number;
  isFixed?: boolean;
  /** Local clock time, "HH:MM". */
  fixedTime?: string;
  durationMinutes?: number;
};

export type TripFitGeo = {
  /** The existing global geographic-eligibility gate (lib/relevance.ts), pre-computed by the caller. */
  eligible: boolean;
  /** Straight-line km from the candidate to specific existing TripItems, keyed by their sourceId. */
  distanceToItemKm?: Record<string, number>;
};

export type TripFitInput = {
  candidate: TripFitCandidate;
  dayIndex: number;
  tripItems: TripFitItem[];
  geo: TripFitGeo;
  /**
   * "HH:MM", only when a real reservation/tee time is known. Never invent one -
   * see NEVER USE UI DEFAULT TIMES AS EVIDENCE below.
   */
  candidateStartTime?: string;
};

export type TripFitReasonCode =
  | "GEO_PLAUSIBLE"
  | "DAYPART_MATCH"
  | "PREFERRED_DAYPART_MATCH"
  | "FITS_AVAILABLE_WINDOW"
  | "AFTER_MORNING_GOLF"
  | "AFTER_GOLF"
  | "BEFORE_FIXED_DINNER"
  | "BETWEEN_FIXED_POINTS"
  | "FIXED_TIME_REQUIRED"
  | "MISSING_DURATION"
  | "GEO_NOT_ELIGIBLE"
  | "DAYPART_MISMATCH"
  | "INSUFFICIENT_TIME"
  | "TIME_CONFLICT"
  | "ALREADY_IN_TRIP";

export type TripFitRecommendationType = "after_golf" | "before_dinner" | "fits_available_window";

export type TripFitResult = {
  eligible: boolean;
  /** 0-100. Hard gates are decided before this is computed; a failing gate always yields 0. */
  score: number;
  recommendationType?: TripFitRecommendationType;
  reasonCodes: TripFitReasonCode[];
  blockerCodes: TripFitReasonCode[];
  window?: { startMinutes: number; endMinutes: number };
  related?: { previousSourceId?: string; nextSourceId?: string };
};

// ---------------------------------------------------------------------------
// Day time model
// ---------------------------------------------------------------------------

const MINUTES_PER_HOUR = 60;

function hm(hours: number, minutes: number) {
  return hours * MINUTES_PER_HOUR + minutes;
}

/** Overlap between daypart windows is intentional - see AROUND v1.24b spec section 6. */
const DAYPART_WINDOWS: Record<TripFitDaypart, { start: number; end: number }> = {
  morning: { start: hm(6, 0), end: hm(11, 30) },
  midday: { start: hm(11, 0), end: hm(14, 30) },
  afternoon: { start: hm(13, 30), end: hm(18, 0) },
  evening: { start: hm(17, 0), end: hm(23, 0) },
  all_day: { start: hm(6, 0), end: hm(23, 0) }
};

const DAY_START_MINUTES = DAYPART_WINDOWS.all_day.start; // 06:00
const DAY_END_MINUTES = DAYPART_WINDOWS.all_day.end; // 23:00

/**
 * Planning safety buffer around fixed points. This is NOT a drive-time estimate -
 * it exists only so a candidate isn't placed to start the instant a fixed point
 * ends. Never display this value to the user as travel time.
 */
export const TRANSITION_BUFFER_MINUTES = 30;

const MORNING_GOLF_CUTOFF_MINUTES = hm(11, 0);

function parseTimeToMinutes(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * MINUTES_PER_HOUR + Number(match[2]);
}

// ---------------------------------------------------------------------------
// Fixed points and available windows
// ---------------------------------------------------------------------------

type FixedPoint = {
  sourceId: string;
  role?: TripFitRole;
  startMinutes: number;
  endMinutes: number;
};

type AvailableWindow = {
  startMinutes: number;
  endMinutes: number;
  previousSourceId?: string;
  nextSourceId?: string;
};

/**
 * A TripItem counts as an actual timed point only when isFixed, fixedTime AND
 * durationMinutes all exist - see NEVER USE UI DEFAULT TIMES AS EVIDENCE. A role
 * default like "PLAY -> 09:00" that was never turned into a real fixedTime is
 * simply invisible to this engine.
 */
function getFixedPointsForDay(tripItems: TripFitItem[], dayIndex: number): FixedPoint[] {
  const points: FixedPoint[] = [];
  for (const item of tripItems) {
    if (item.dayIndex !== dayIndex) continue;
    if (!item.isFixed) continue;
    if (!item.fixedTime) continue;
    if (typeof item.durationMinutes !== "number" || item.durationMinutes <= 0) continue;
    const start = parseTimeToMinutes(item.fixedTime);
    if (start === null) continue;
    points.push({ sourceId: item.sourceId, role: item.role, startMinutes: start, endMinutes: start + item.durationMinutes });
  }
  return points.sort((a, b) => a.startMinutes - b.startMinutes);
}

/**
 * Free windows carved from ACTUAL fixed points only (day start -> first fixed
 * point, fixed point -> fixed point, last fixed point -> day end), each
 * conservatively shrunk by TRANSITION_BUFFER_MINUTES around every fixed point.
 */
function computeAvailableWindows(fixedPoints: FixedPoint[]): AvailableWindow[] {
  const windows: AvailableWindow[] = [];
  let cursor = DAY_START_MINUTES;
  let previousSourceId: string | undefined;

  for (const point of fixedPoints) {
    const windowEnd = point.startMinutes - TRANSITION_BUFFER_MINUTES;
    if (windowEnd > cursor) {
      windows.push({ startMinutes: cursor, endMinutes: windowEnd, previousSourceId, nextSourceId: point.sourceId });
    }
    cursor = Math.max(cursor, point.endMinutes + TRANSITION_BUFFER_MINUTES);
    previousSourceId = point.sourceId;
  }

  if (DAY_END_MINUTES > cursor) {
    windows.push({ startMinutes: cursor, endMinutes: DAY_END_MINUTES, previousSourceId, nextSourceId: undefined });
  }

  return windows;
}

// ---------------------------------------------------------------------------
// Daypart resolution
// ---------------------------------------------------------------------------

/**
 * compatibleDayparts wins when present; otherwise fall back to suggestedDaypart.
 * An empty result means "no daypart metadata" - callers must not hard-fail on
 * that alone, and this engine treats it as daypart-agnostic (no bonus, no gate).
 */
function resolveCandidateDayparts(candidate: TripFitCandidate): TripFitDaypart[] {
  if (candidate.compatibleDayparts?.length) return candidate.compatibleDayparts;
  if (candidate.suggestedDaypart) return [candidate.suggestedDaypart];
  return [];
}

function intersectLength(a: { start: number; end: number }, b: { start: number; end: number }): number {
  return Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start));
}

type QualifyingSlot = { startMinutes: number; endMinutes: number; daypartMatch: TripFitDaypart | null };

/** The earliest slot within `window` that both fits `duration` and lies inside an allowed daypart (if any are declared). */
function findQualifyingSlot(window: AvailableWindow, dayparts: TripFitDaypart[], duration: number): QualifyingSlot | null {
  if (!dayparts.length) {
    if (window.endMinutes - window.startMinutes >= duration) {
      return { startMinutes: window.startMinutes, endMinutes: window.startMinutes + duration, daypartMatch: null };
    }
    return null;
  }

  let best: QualifyingSlot | null = null;
  for (const daypart of dayparts) {
    const range = DAYPART_WINDOWS[daypart];
    const overlapStart = Math.max(window.startMinutes, range.start);
    const overlapEnd = Math.min(window.endMinutes, range.end);
    if (overlapEnd - overlapStart >= duration) {
      if (!best || overlapStart < best.startMinutes) {
        best = { startMinutes: overlapStart, endMinutes: overlapStart + duration, daypartMatch: daypart };
      }
    }
  }
  return best;
}

/** Which allowed daypart (if any) fully contains an already-known slot - used on the explicit-time path. */
function matchDaypartForSlot(slot: { startMinutes: number; endMinutes: number }, dayparts: TripFitDaypart[]): TripFitDaypart | null {
  for (const daypart of dayparts) {
    const range = DAYPART_WINDOWS[daypart];
    if (slot.startMinutes >= range.start && slot.endMinutes <= range.end) return daypart;
  }
  return null;
}

/**
 * Explicit-time fallback, used only when no allowed daypart fully contains the
 * whole slot (matchDaypartForSlot found nothing) - e.g. a real 08:30 tee time
 * whose 270-minute round runs past "morning"'s 11:30 end. A known ACTUAL start
 * time can still validate the daypart on its own: if the start itself falls
 * inside an allowed window, that daypart is a valid match even though the full
 * activity extends beyond it. Never used when no explicit time is known (the
 * search path always requires full-slot containment via findQualifyingSlot).
 * Prefers candidate.suggestedDaypart when it's among the matches, so an
 * overlapping-window start time doesn't get an arbitrary classification.
 */
function matchDaypartForStartTime(startMinutes: number, dayparts: TripFitDaypart[], preferredDaypart: TripFitDaypart | undefined): TripFitDaypart | null {
  const matches = dayparts.filter(daypart => {
    const range = DAYPART_WINDOWS[daypart];
    return startMinutes >= range.start && startMinutes <= range.end;
  });
  if (!matches.length) return null;
  if (preferredDaypart && matches.includes(preferredDaypart)) return preferredDaypart;
  return matches[0];
}

// ---------------------------------------------------------------------------
// Context detection (after_golf / before_dinner)
// ---------------------------------------------------------------------------

type WindowContext = {
  playPoint?: FixedPoint;
  dinnerPoint?: FixedPoint;
  isAfterGolf: boolean;
  isAfterMorningGolf: boolean;
  isBeforeDinner: boolean;
  isBetweenFixedPoints: boolean;
};

/**
 * AFTER_GOLF requires an actual fixed PLAY item immediately before this window,
 * with geography to it proven via geo.distanceToItemKm - never inferred merely
 * because a PLAY item exists somewhere else in the trip.
 */
function detectContext(window: AvailableWindow, fixedPoints: FixedPoint[], geo: TripFitGeo, candidateRole?: TripFitRole): WindowContext {
  const playPoint = fixedPoints.find(point => point.sourceId === window.previousSourceId && point.role === "play");
  const dinnerPoint = fixedPoints.find(point => point.sourceId === window.nextSourceId && point.role === "eat");

  const isAfterGolf = Boolean(playPoint) && geo.distanceToItemKm?.[playPoint!.sourceId] !== undefined;
  const isAfterMorningGolf = isAfterGolf && playPoint!.startMinutes < MORNING_GOLF_CUTOFF_MINUTES;
  // candidateRole must be KNOWN and not "eat" (drink is already normalized to "eat"
  // by content-role.ts). An undefined role is not proof of anything - never treat
  // "we don't know" as "not eat", or this would invent a contextual dinner claim.
  const isBeforeDinner =
    Boolean(dinnerPoint) &&
    geo.distanceToItemKm?.[dinnerPoint!.sourceId] !== undefined &&
    Boolean(candidateRole) &&
    candidateRole !== "eat";

  return {
    playPoint,
    dinnerPoint,
    isAfterGolf,
    isAfterMorningGolf,
    isBeforeDinner,
    isBetweenFixedPoints: Boolean(window.previousSourceId) && Boolean(window.nextSourceId)
  };
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function scoreGeo(distanceKm: number | undefined): number {
  if (typeof distanceKm !== "number") return 10; // geo.eligible is true here, but no specific proximity known
  if (distanceKm <= 5) return 25;
  if (distanceKm <= 15) return 22;
  if (distanceKm <= 30) return 18;
  if (distanceKm <= 40) return 14;
  return 10;
}

function scoreDaypart(daypartMatch: TripFitDaypart | null, candidate: TripFitCandidate): number {
  if (!daypartMatch) return 0;
  return daypartMatch === candidate.suggestedDaypart ? 15 : 10;
}

function scoreContext(isAfterGolf: boolean, isBeforeDinner: boolean): number {
  return isAfterGolf || isBeforeDinner ? 15 : 8;
}

/**
 * Conservative editorial signal. aroundSelected/priority/featured can only rank
 * already-eligible candidates relative to each other - they can never make an
 * ineligible candidate eligible (hard gates are resolved before this runs), and
 * commercialPartner is not even a field on TripFitCandidate, so it structurally
 * cannot reach this score.
 */
function scoreEditorial(candidate: TripFitCandidate): number {
  let score = 0;
  if (typeof candidate.priority === "number") {
    score += Math.round((Math.max(0, Math.min(100, candidate.priority)) / 100) * 6);
  }
  if (candidate.aroundSelected) score += 3;
  if (candidate.featured) score += 1;
  return Math.min(10, score);
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

function emptyResult(blockerCodes: TripFitReasonCode[]): TripFitResult {
  return { eligible: false, score: 0, reasonCodes: [], blockerCodes };
}

export function evaluateTripFit(input: TripFitInput): TripFitResult {
  const { candidate, dayIndex, tripItems, geo, candidateStartTime } = input;

  // Hard gate: candidate already placed anywhere in this trip.
  if (tripItems.some(item => item.sourceId === candidate.id)) {
    return emptyResult(["ALREADY_IN_TRIP"]);
  }

  const blockers: TripFitReasonCode[] = [];
  if (!geo.eligible) blockers.push("GEO_NOT_ELIGIBLE");

  const duration = candidate.suggestedDurationMinutes;
  const hasValidDuration = typeof duration === "number" && duration > 0;
  if (!hasValidDuration) blockers.push("MISSING_DURATION");

  // NEVER USE UI DEFAULT TIMES AS EVIDENCE: a "fixed" candidate without a real,
  // supplied start time gets no invented fallback - it's simply not contextually
  // placeable yet. This is the Alte Schmiede case.
  let candidateStartMinutes: number | null = null;
  if (candidate.defaultPlanningMode === "fixed") {
    if (!candidateStartTime) {
      blockers.push("FIXED_TIME_REQUIRED");
    } else {
      candidateStartMinutes = parseTimeToMinutes(candidateStartTime);
      if (candidateStartMinutes === null) blockers.push("FIXED_TIME_REQUIRED");
    }
  } else if (candidateStartTime) {
    candidateStartMinutes = parseTimeToMinutes(candidateStartTime);
  }

  // Hard gates happen BEFORE score. Editorial priority never overrides them.
  if (!hasValidDuration || blockers.includes("FIXED_TIME_REQUIRED")) {
    return emptyResult(blockers);
  }
  if (!geo.eligible) {
    return emptyResult(blockers);
  }

  const dayItems = tripItems.filter(item => item.dayIndex === dayIndex);
  const fixedPoints = getFixedPointsForDay(dayItems, dayIndex);
  const windows = computeAvailableWindows(fixedPoints);
  const dayparts = resolveCandidateDayparts(candidate);

  let chosenWindow: AvailableWindow | null = null;
  let chosenSlot: QualifyingSlot | null = null;

  if (candidateStartMinutes !== null) {
    // Explicit-time path: an actual reservation/tee time is known. Check it
    // against real fixed points instead of searching for an open slot.
    const slotEnd = candidateStartMinutes + (duration as number);
    const containingWindow = windows.find(window => candidateStartMinutes! >= window.startMinutes && slotEnd <= window.endMinutes);
    if (!containingWindow) {
      return emptyResult(["TIME_CONFLICT"]);
    }
    // Full-slot containment is still the first choice (e.g. Winklmoos 14:00-18:00
    // matching "afternoon" exactly). Only when that finds nothing does an actual
    // start time get to validate the daypart on its own - never for the search
    // path below, which always requires the whole chosen slot to fit.
    const daypartMatch =
      matchDaypartForSlot({ startMinutes: candidateStartMinutes, endMinutes: slotEnd }, dayparts) ??
      matchDaypartForStartTime(candidateStartMinutes, dayparts, candidate.suggestedDaypart);
    if (dayparts.length && !daypartMatch) {
      return emptyResult(["DAYPART_MISMATCH"]);
    }
    chosenWindow = containingWindow;
    chosenSlot = { startMinutes: candidateStartMinutes, endMinutes: slotEnd, daypartMatch };
  } else {
    // Search path: no explicit time - find the best-fitting free slot across the
    // day's windows, preferring after_golf, then before_dinner, then any fit.
    let bestPriority = -1;
    for (const window of windows) {
      const slot = findQualifyingSlot(window, dayparts, duration as number);
      if (!slot) continue;
      const context = detectContext(window, fixedPoints, geo, candidate.role);
      const priority = context.isAfterGolf ? 2 : context.isBeforeDinner ? 1 : 0;
      if (priority > bestPriority) {
        bestPriority = priority;
        chosenWindow = window;
        chosenSlot = slot;
      }
    }
    if (!chosenWindow || !chosenSlot) {
      // Distinguish "wrong time of day" from "not enough time anywhere": if some
      // window has enough raw minutes once daypart restrictions are ignored, the
      // problem is specifically the daypart, not the day's overall availability.
      const rawWindowLongEnough = windows.some(window => window.endMinutes - window.startMinutes >= (duration as number));
      return emptyResult([rawWindowLongEnough ? "DAYPART_MISMATCH" : "INSUFFICIENT_TIME"]);
    }
  }

  const context = detectContext(chosenWindow, fixedPoints, geo, candidate.role);
  const recommendationType: TripFitRecommendationType = context.isAfterGolf
    ? "after_golf"
    : context.isBeforeDinner
      ? "before_dinner"
      : "fits_available_window";

  const reasonCodes: TripFitReasonCode[] = ["GEO_PLAUSIBLE", "FITS_AVAILABLE_WINDOW"];
  if (context.isAfterGolf) reasonCodes.push(context.isAfterMorningGolf ? "AFTER_MORNING_GOLF" : "AFTER_GOLF");
  if (context.isBeforeDinner) reasonCodes.push("BEFORE_FIXED_DINNER");
  if (context.isBetweenFixedPoints) reasonCodes.push("BETWEEN_FIXED_POINTS");
  if (chosenSlot.daypartMatch) {
    reasonCodes.push(chosenSlot.daypartMatch === candidate.suggestedDaypart ? "PREFERRED_DAYPART_MATCH" : "DAYPART_MATCH");
  }

  const contextSourceId = context.isAfterGolf ? context.playPoint?.sourceId : context.isBeforeDinner ? context.dinnerPoint?.sourceId : undefined;
  const distanceKm = contextSourceId ? geo.distanceToItemKm?.[contextSourceId] : undefined;

  const score = Math.max(
    0,
    Math.min(
      100,
      35 /* time fit - only reached once a qualifying slot was actually found */ +
        scoreGeo(distanceKm) +
        scoreDaypart(chosenSlot.daypartMatch, candidate) +
        scoreContext(context.isAfterGolf, context.isBeforeDinner) +
        scoreEditorial(candidate)
    )
  );

  return {
    eligible: true,
    score,
    recommendationType,
    reasonCodes,
    blockerCodes: [],
    window: { startMinutes: chosenSlot.startMinutes, endMinutes: chosenSlot.endMinutes },
    related: { previousSourceId: chosenWindow.previousSourceId, nextSourceId: chosenWindow.nextSourceId }
  };
}

// ---------------------------------------------------------------------------
// Presentation copy (mapping only - never rendered in product UI yet)
// ---------------------------------------------------------------------------

const REASON_LABELS: Partial<Record<TripFitReasonCode, string>> = {
  AFTER_MORNING_GOLF: "GOOD AFTER YOUR MORNING ROUND",
  AFTER_GOLF: "GOOD AFTER YOUR ROUND",
  BEFORE_FIXED_DINNER: "FITS BEFORE YOUR DINNER"
};

const RECOMMENDATION_LABELS: Record<TripFitRecommendationType, string> = {
  after_golf: "GOOD AFTER YOUR ROUND",
  before_dinner: "FITS BEFORE YOUR DINNER",
  fits_available_window: "FITS YOUR DAY"
};

/**
 * Deterministic label mapping only - no AI-generated copy. Not rendered in the
 * product UI yet; kept separate from the calculation above on purpose.
 */
export function formatTripFitLabel(result: TripFitResult): string | undefined {
  if (!result.eligible) return undefined;
  if (result.reasonCodes.includes("AFTER_MORNING_GOLF")) return REASON_LABELS.AFTER_MORNING_GOLF;
  if (result.recommendationType) return RECOMMENDATION_LABELS[result.recommendationType];
  return undefined;
}
