/**
 * AROUND v1.26e - provider-neutral communication preferences.
 *
 * Supabase's public.communication_preferences table is canonical; Brevo is
 * a downstream delivery layer that must never become the source of truth.
 * This file knows nothing about Brevo - it only converts between the DB's
 * snake_case row shape and the application's camelCase shape, and validates
 * an untrusted preferences object at a request boundary.
 */

export type CommunicationPreferenceKey =
  | "aroundJournal"
  | "myAroundUpdates"
  | "tripIntelligence"
  | "aroundDrops";

export type CommunicationPreferences = {
  /** Editorial newsletter / journal communication. */
  aroundJournal: boolean;
  /** Communication related to saved editorial content and MY AROUND activity. */
  myAroundUpdates: boolean;
  /** Communication generated from an actual Trip (e.g. future pre-trip briefings). */
  tripIntelligence: boolean;
  /** Explicitly commercial / partner / offer communication. Never inferred from anything else. */
  aroundDrops: boolean;
};

export const COMMUNICATION_PREFERENCE_KEYS: CommunicationPreferenceKey[] = [
  "aroundJournal",
  "myAroundUpdates",
  "tripIntelligence",
  "aroundDrops"
];

/** Account creation != marketing consent - the only safe default. */
export const DEFAULT_COMMUNICATION_PREFERENCES: CommunicationPreferences = {
  aroundJournal: false,
  myAroundUpdates: false,
  tripIntelligence: false,
  aroundDrops: false
};

export type CommunicationPreferencesRow = {
  around_journal: boolean;
  my_around_updates: boolean;
  trip_intelligence: boolean;
  around_drops: boolean;
};

/** A missing/null row safely resolves to all-false, never to a silently opted-in flag. */
export function communicationPreferencesFromRow(
  row: Partial<CommunicationPreferencesRow> | null | undefined
): CommunicationPreferences {
  return {
    aroundJournal: Boolean(row?.around_journal),
    myAroundUpdates: Boolean(row?.my_around_updates),
    tripIntelligence: Boolean(row?.trip_intelligence),
    aroundDrops: Boolean(row?.around_drops)
  };
}

export function communicationPreferencesToRow(preferences: CommunicationPreferences): CommunicationPreferencesRow {
  return {
    around_journal: preferences.aroundJournal,
    my_around_updates: preferences.myAroundUpdates,
    trip_intelligence: preferences.tripIntelligence,
    around_drops: preferences.aroundDrops
  };
}

/** Strict boundary validation for an untrusted request body - all four keys must be actual booleans. */
export function isValidCommunicationPreferences(value: unknown): value is CommunicationPreferences {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return COMMUNICATION_PREFERENCE_KEYS.every(key => typeof record[key] === "boolean");
}
