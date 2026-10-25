import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for the few server actions RLS cannot cover (account
 * deletion). This is the ONLY file that reads SUPABASE_SERVICE_ROLE_KEY.
 * Returns null when the key is not configured, so callers can degrade.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
