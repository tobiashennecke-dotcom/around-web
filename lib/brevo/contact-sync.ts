import "server-only";
import { brevoRequest, isBrevoConfigured } from "@/lib/brevo/server";
import { getBrevoListId } from "@/lib/brevo/lists";
import {
  COMMUNICATION_PREFERENCE_KEYS,
  type CommunicationPreferences
} from "@/lib/communication/preferences";

export type BrevoSyncResult = "synced" | "disabled" | "failed";

type SyncInput = {
  userId: string;
  email: string;
  preferences: CommunicationPreferences;
};

function contactUpdatePath(email: string): string {
  return `/contacts/${encodeURIComponent(email)}?identifierType=email_id`;
}

/**
 * Supabase communication_preferences is authoritative; this only makes
 * Brevo's AROUND-managed list membership match it. Only ever touches the
 * four AROUND-owned lists via listIds/unlinkListIds - never an unrelated
 * list, never emailBlacklisted (a global Brevo unsubscribe must never be
 * silently reversed here), never any other contact attribute, and never
 * deletes the contact. Missing list configuration for one preference just
 * skips that list; it never blocks syncing the others.
 */
export async function syncCommunicationPreferencesToBrevo(input: SyncInput): Promise<BrevoSyncResult> {
  if (!isBrevoConfigured()) return "disabled";

  const listIds: number[] = [];
  const unlinkListIds: number[] = [];

  for (const key of COMMUNICATION_PREFERENCE_KEYS) {
    const listId = getBrevoListId(key);
    if (!listId) continue;
    if (input.preferences[key]) listIds.push(listId);
    else unlinkListIds.push(listId);
  }

  if (!listIds.length) {
    // Every preference is false (for the lists we can actually manage): do
    // not create a contact just to represent four false flags. If one
    // already exists, only unlink AROUND-managed lists from it.
    if (!unlinkListIds.length) return "synced";

    const result = await brevoRequest(contactUpdatePath(input.email), {
      method: "PUT",
      body: { unlinkListIds }
    });
    // A 404 means there was never a contact to unlink from - a successful no-op.
    return result.ok || result.status === 404 ? "synced" : "failed";
  }

  // At least one true preference: update-first. A contact may already
  // exist from an earlier sync, so try PUT before ever considering a create.
  const updated = await brevoRequest(contactUpdatePath(input.email), {
    method: "PUT",
    body: {
      ext_id: input.userId,
      listIds,
      ...(unlinkListIds.length ? { unlinkListIds } : {})
    }
  });
  if (updated.ok) return "synced";

  // Only a 404 (contact genuinely does not exist yet) justifies creating
  // one - any other update error must not blindly fall through to create.
  // A brand-new contact cannot already belong to an AROUND-managed list it
  // shouldn't, so there is nothing to unlink on creation.
  if (updated.status !== 404) return "failed";

  const created = await brevoRequest("/contacts", {
    method: "POST",
    body: {
      email: input.email,
      ext_id: input.userId,
      listIds
    }
  });
  return created.ok ? "synced" : "failed";
}
