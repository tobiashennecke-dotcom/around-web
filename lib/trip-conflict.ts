/**
 * Presentation-only mapping for Planner Conflict Intelligence V0. Deterministic
 * label lookup, no AI-generated copy, no reason-code strings ever reach the UI.
 * Kept outside lib/trip-fit.ts on purpose - this is presentation, not engine logic.
 */

import type { TripFitReasonCode } from "@/lib/trip-fit";

const BLOCKER_LABELS: Partial<Record<TripFitReasonCode, string>> = {
  TIME_CONFLICT: "OVERLAPS ANOTHER FIXED POINT",
  INSUFFICIENT_TIME: "THIS DAY IS TOO TIGHT",
  DAYPART_MISMATCH: "WRONG TIME WINDOW FOR THIS STOP",
  GEO_NOT_ELIGIBLE: "BETTER IN ANOTHER PART OF YOUR TRIP",
  MISSING_DURATION: "DURATION NEEDED TO CHECK THIS",
  FIXED_TIME_REQUIRED: "TIME NEEDED TO CHECK THIS"
};

/**
 * Display priority when multiple blockers exist. ALREADY_IN_TRIP is
 * deliberately absent - the adapter always excludes a Planner candidate's own
 * TripItem before evaluating it, so it should never appear for a Planner row;
 * even if it somehow did, this helper must never present it as Conflict
 * Intelligence (falls through to "no label" instead).
 */
const BLOCKER_PRIORITY: TripFitReasonCode[] = [
  "TIME_CONFLICT",
  "INSUFFICIENT_TIME",
  "DAYPART_MISMATCH",
  "GEO_NOT_ELIGIBLE",
  "FIXED_TIME_REQUIRED",
  "MISSING_DURATION"
];

export function formatBlockerLabel(blockerCodes: TripFitReasonCode[]): string | undefined {
  for (const code of BLOCKER_PRIORITY) {
    if (blockerCodes.includes(code)) return BLOCKER_LABELS[code];
  }
  return undefined;
}
