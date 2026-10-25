/**
 * Self-service account deletion (DSGVO Art. 17). Dependency-free so the
 * confirmation rule can be unit tested and shared by UI and API route.
 */
export const ACCOUNT_DELETE_CONFIRMATION = "LÖSCHEN";

/** Browser-only guest data that must not survive an account deletion. */
export const GUEST_STORAGE_KEYS = [
  "around-guest-saves-v1",
  "around-guest-collections-v1",
  "around-guest-trips-v1"
] as const;

export function isAccountDeleteConfirmed(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const value = (body as { confirmation?: unknown }).confirmation;
  return typeof value === "string" && value.trim().toUpperCase() === ACCOUNT_DELETE_CONFIRMATION;
}
