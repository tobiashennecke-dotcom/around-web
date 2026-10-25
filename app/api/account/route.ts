import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { brevoRequest } from "@/lib/brevo/server";
import { isAccountDeleteConfirmed } from "@/lib/account-deletion";

/**
 * Deletes the signed-in user's own account. The user id is always taken
 * from the authenticated session, never from the request body.
 *
 * Deleting the auth user removes profiles, saves, collections, trips,
 * preferences, entitlements and user_events through their
 * `on delete cascade` foreign keys. The Brevo contact is removed first
 * (best effort): a provider failure must not keep a user from leaving.
 */
export async function DELETE(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (!isAccountDeleteConfirmed(body)) {
    return NextResponse.json({ error: "confirmation_required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "deletion_unavailable" }, { status: 503 });

  if (user.email) {
    // 404 means Brevo never knew this contact - that is fine.
    await brevoRequest(`/contacts/${encodeURIComponent(user.email)}?identifierType=email_id`, { method: "DELETE" });
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: "delete_failed" }, { status: 500 });

  // Clear this browser's session cookies; the user no longer exists.
  await supabase.auth.signOut().catch(() => undefined);

  return NextResponse.json({ deleted: true });
}
