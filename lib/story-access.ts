export type StoryAccessTier = "free" | "premium";

/** Stories without an explicit accessTier (all existing Stories) behave as Free. */
export function normalizeStoryAccessTier(value?: string | null): StoryAccessTier {
  return value === "premium" ? "premium" : "free";
}
