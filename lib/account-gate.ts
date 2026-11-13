/**
 * Guest limits and the "please create an account" moment.
 *
 * Guests can keep GUEST_SAVE_LIMIT saves in their browser. The save before
 * the limit shows a gentle hint, the one after it opens the login sheet
 * (components/LoginGate.tsx) instead of failing. That blocked save is kept
 * as "pending" and lands in the account right after login. Trips need an
 * account from the start; already existing local guest trips keep working.
 */

export const GUEST_SAVE_LIMIT = 5;
export const LOGIN_REQUIRED_EVENT = "around:login-required";
export const SAVE_HINT_EVENT = "around:save-hint";

export type LoginReason = "save_limit" | "trip" | "pass";

export type GuestSaveDecision = "remove" | "add" | "add_with_hint" | "limit";

/** Pure decision for a guest toggling a save, given how many saves they already have. */
export function guestSaveDecision(currentCount: number, alreadySaved: boolean, limit = GUEST_SAVE_LIMIT): GuestSaveDecision {
  if (alreadySaved) return "remove";
  if (currentCount >= limit) return "limit";
  if (currentCount + 1 === limit - 1) return "add_with_hint";
  return "add";
}

export class LoginRequiredError extends Error {
  reason: LoginReason;
  constructor(reason: LoginReason) {
    super("login_required");
    this.name = "LoginRequiredError";
    this.reason = reason;
  }
}

export function isLoginRequiredError(error: unknown): error is LoginRequiredError {
  return error instanceof Error && error.message === "login_required";
}

/** Opens the login sheet. Safe to call on the server (no-op). */
export function requestLogin(reason: LoginReason) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(LOGIN_REQUIRED_EVENT, { detail: { reason } }));
}

export function announceSaveHint(remaining: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SAVE_HINT_EVENT, { detail: { remaining } }));
}
