/**
 * AROUND v1.26f - pure Story Premium access logic.
 *
 * AROUND SELECTED is editorial judgment and can never be bought. PREMIUM is
 * an access/product entitlement and never influences editorial ranking.
 * These two concepts must never be conflated - this module only ever
 * decides ACCESS, never quality or ranking.
 *
 * No React, no Supabase, no Sanity - pure and independently testable.
 */

export type StoryAccessTier = "free" | "premium";

/** Stories without an explicit accessTier (all existing Stories) behave as Free. */
export function normalizeStoryAccessTier(value?: string | null): StoryAccessTier {
  return value === "premium" ? "premium" : "free";
}

export type StoryAccessState = "free" | "premium-unlocked" | "premium-locked";

/**
 * The only question that decides Story body access. Entitlement, never
 * plan/subscriptionStatus:
 *
 * free                        -> "free" (entitlement is irrelevant)
 * premium + entitlement       -> "premium-unlocked"
 * premium + no entitlement    -> "premium-locked"
 */
export function resolveStoryAccessState(input: {
  accessTier: StoryAccessTier;
  hasPremiumEntitlement: boolean;
}): StoryAccessState {
  if (input.accessTier !== "premium") return "free";
  return input.hasPremiumEntitlement ? "premium-unlocked" : "premium-locked";
}

export type StoryBodySplit = {
  beforeGate: unknown[];
  afterGate: unknown[];
  hasGate: boolean;
};

/**
 * Splits a Story body at its first premiumGate block, preserving exact
 * editorial block order on both sides. The gate marker itself belongs to
 * neither segment. Never modifies Place Modules or media blocks, never
 * infers a gate position - if editorial data carries more than one gate
 * (malformed / external data), the first one is used deterministically and
 * every later one silently ends up inside afterGate, unrendered while
 * locked.
 */
export function splitStoryBodyAtPremiumGate(body: unknown[]): StoryBodySplit {
  const gateIndex = body.findIndex((block: any) => block?._type === "premiumGate");

  if (gateIndex === -1) {
    return { beforeGate: body, afterGate: [], hasGate: false };
  }

  return {
    beforeGate: body.slice(0, gateIndex),
    afterGate: body.slice(gateIndex + 1),
    hasGate: true
  };
}
