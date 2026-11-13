import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client with the project's secret (service role) key.
 * Bypasses RLS, so it must only ever be used behind an admin check
 * (see lib/admin/access.ts). Never import this from a client component.
 *
 * Accepts the new `sb_secret_…` key (SUPABASE_SECRET_KEY) or a legacy
 * service_role JWT (SUPABASE_SERVICE_ROLE_KEY).
 */
export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      // New sb_secret_ keys are not JWTs: send them only as `apikey`, never as Bearer.
      fetch: (input, init) => {
        if (!key.startsWith("sb_")) return fetch(input, init);
        const headers = new Headers(init?.headers);
        if (headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        return fetch(input, { ...init, headers });
      }
    }
  });
}
