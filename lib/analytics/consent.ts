/**
 * Analytics consent, kept in the browser.
 *
 * - null: not decided yet. Counted like "essential" (anonymous, no ID).
 * - "essential": anonymous counting only. Nothing is stored on the device
 *   for analytics, events carry no browser ID and no account link.
 * - "full": a random browser ID (anon_id) is stored, so the path from first
 *   visit to account and trip can be followed. After login it is linked to
 *   the account (see /api/events/link).
 */

export type ConsentLevel = "full" | "essential";

const CONSENT_KEY = "around-consent-v1";
const ANON_KEY = "around-anon-id-v1";
export const CONSENT_CHANGED_EVENT = "around:consent-changed";
export const OPEN_CONSENT_EVENT = "around:open-consent";

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function getConsent(): ConsentLevel | null {
  const raw = storage()?.getItem(CONSENT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.level === "full" || parsed?.level === "essential" ? parsed.level : null;
  } catch {
    return null;
  }
}

export function setConsent(level: ConsentLevel) {
  const store = storage();
  if (!store) return;
  store.setItem(CONSENT_KEY, JSON.stringify({ level, at: new Date().toISOString() }));
  if (level !== "full") {
    store.removeItem(ANON_KEY);
    try { window.sessionStorage.removeItem("around-utm-v1"); } catch { /* ignore */ }
  }
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: { level } }));
}

export function openConsentSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_CONSENT_EVENT));
}

/** Browser ID, only with full consent. Created on first use. */
export function getAnonId(): string | null {
  if (getConsent() !== "full") return null;
  const store = storage();
  if (!store) return null;
  let id = store.getItem(ANON_KEY);
  if (!id) {
    id = crypto.randomUUID();
    store.setItem(ANON_KEY, id);
  }
  return id;
}
