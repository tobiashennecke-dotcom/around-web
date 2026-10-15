import "server-only";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createSessionClient } from "@/lib/supabase/server";

/**
 * Fail closed: an authenticated AROUND user is not automatically a CRM operator.
 * IDs are Supabase auth.users UUIDs, never client-provided and never user_metadata.
 */
export async function getCommercialAccess() {
  const allowed = (process.env.COMMERCIAL_ADMIN_USER_IDS ?? "")
    .split(",").map(value => value.trim().toLowerCase()).filter(Boolean);
  if (allowed.length === 0) return null;
  const session = await createSessionClient();
  if (!session) return null;
  const { data: { user }, error } = await session.auth.getUser();
  if (error || !user || !allowed.includes(user.id.toLowerCase())) return null;
  return { userId: user.id };
}

export function getCommercialAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
