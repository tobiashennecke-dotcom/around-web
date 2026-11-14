import "server-only";
import { createClient } from "@/lib/supabase/server";
import { profileFromRow } from "@/lib/profile/profile";
import type { FitContext, FitProfile } from "./score";

/** Profile + context of the signed-in user, or null for guests. */
export async function loadFitProfile(): Promise<{ profile: FitProfile; context: FitContext; savedIds: Set<string> } | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [{ data: row }, { data: saves }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("saved_items").select("source_id,source_type").eq("user_id", user.id)
  ]);
  const profile = profileFromRow(row);
  const savedIds = new Set((saves || []).map(save => save.source_id as string));
  const savedDestinationIds = new Set((saves || []).filter(save => save.source_type === "destination").map(save => save.source_id as string));
  return { profile, context: { savedDestinationIds }, savedIds };
}
