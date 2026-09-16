import "server-only";
import type { CommunicationPreferenceKey } from "@/lib/communication/preferences";

/**
 * AROUND uses four Brevo Lists as delivery audiences, one per communication
 * preference. Numeric list ids are environment-specific and never
 * hardcoded - they live in deployment environment variables, created
 * manually in Brevo per environment.
 */
const LIST_ENV_VARS: Record<CommunicationPreferenceKey, string> = {
  aroundJournal: "BREVO_LIST_AROUND_JOURNAL_ID",
  myAroundUpdates: "BREVO_LIST_MY_AROUND_UPDATES_ID",
  tripIntelligence: "BREVO_LIST_TRIP_INTELLIGENCE_ID",
  aroundDrops: "BREVO_LIST_AROUND_DROPS_ID"
};

/** Numeric Brevo list id for a preference, or undefined if unconfigured. Missing config must never crash the app - callers simply skip that list. */
export function getBrevoListId(key: CommunicationPreferenceKey): number | undefined {
  const raw = process.env[LIST_ENV_VARS[key]];
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
