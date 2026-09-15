import { createClient } from "@/lib/supabase/server";

export type EntitlementKey =
  | "read_premium_stories"
  | "advanced_trip_planning"
  | "personal_travel_briefing"
  | "smart_day_planning";

export type UserPlan = "free" | "premium";
export type SubscriptionStatus = "none" | "trialing" | "active" | "past_due" | "cancelled";

export type UserAccess = {
  plan: UserPlan;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd?: string;
};

export type UserEntitlement = {
  key: EntitlementKey;
  startsAt?: string;
  endsAt?: string;
};

/**
 * An entitlement is active when it has started (or has no start) and has
 * not yet ended (or has no end). Pure and DB-independent so it can be
 * exercised directly against fixed dates.
 */
export function isEntitlementActive(
  entitlement: Pick<UserEntitlement, "startsAt" | "endsAt">,
  now: Date = new Date()
): boolean {
  const started = !entitlement.startsAt || new Date(entitlement.startsAt) <= now;
  const notEnded = !entitlement.endsAt || new Date(entitlement.endsAt) > now;
  return started && notEnded;
}

/**
 * Account/plan metadata for the signed-in user, or null for guests. `plan`
 * is informational account context - it must never be used to decide
 * whether a capability is available. Use hasEntitlement() for that.
 */
export async function getUserAccess(): Promise<UserAccess | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_access")
    .select("plan,subscription_status,current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    plan: data.plan === "premium" ? "premium" : "free",
    subscriptionStatus: (data.subscription_status || "none") as SubscriptionStatus,
    currentPeriodEnd: data.current_period_end || undefined
  };
}

/** All entitlement rows for the signed-in user, active or not. Empty for guests. */
export async function getUserEntitlements(): Promise<UserEntitlement[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_entitlements")
    .select("entitlement_key,starts_at,ends_at")
    .eq("user_id", user.id);

  if (error || !data) return [];

  return data.map(row => ({
    key: row.entitlement_key as EntitlementKey,
    startsAt: row.starts_at || undefined,
    endsAt: row.ends_at || undefined
  }));
}

/**
 * The one question components should ask for a premium capability:
 * hasEntitlement("read_premium_stories") - never user.plan === "premium".
 */
export async function hasEntitlement(key: EntitlementKey): Promise<boolean> {
  const entitlements = await getUserEntitlements();
  const now = new Date();
  return entitlements.some(entitlement => entitlement.key === key && isEntitlementActive(entitlement, now));
}
