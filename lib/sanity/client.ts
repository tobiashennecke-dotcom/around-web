import "server-only";
import { createClient } from "next-sanity";
import { isSanityAuthenticatedReadsRequired } from "@/lib/sanity/security";

export const sanityConfigured =
  Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) &&
  Boolean(process.env.NEXT_PUBLIC_SANITY_DATASET);

// v1.27a: two-stage migration toward a private Content Lake dataset (see
// docs/SANITY_SECURITY.md for the full cutover runbook).
//
// Stage 1 (now): SANITY_API_READ_TOKEN is optional. The production dataset
// is still public, so reads work with or without it - the app must not
// break while the token is being configured in deployment.
//
// Stage 2 (after cutover): once SANITY_REQUIRE_AUTHENTICATED_READS=true is
// set (only done deliberately, after the token exists and the dataset is
// private), a missing token becomes a hard configuration error instead of
// a silent anonymous read. A private dataset returning nothing must never
// be allowed to masquerade as "there is genuinely no content" - so this
// throws at module load rather than letting `sanity` quietly become a
// client that can no longer actually read anything.
if (sanityConfigured && isSanityAuthenticatedReadsRequired() && !process.env.SANITY_API_READ_TOKEN) {
  throw new Error(
    "Sanity configuration error: SANITY_REQUIRE_AUTHENTICATED_READS is enabled but SANITY_API_READ_TOKEN is not set."
  );
}

export const sanity = sanityConfigured
  ? createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
      apiVersion: "2026-07-01",
      // Published editorial content should be fetched from the Content Lake API.
      // Next.js route-level dynamic rendering / ISR handles frontend caching deliberately.
      useCdn: false,
      perspective: "published",
      // Server-only read token (lib/sanity/security.ts). Optional today while
      // the production dataset is still public; required once it becomes
      // private. NEVER NEXT_PUBLIC_, never logged, never sent to the browser -
      // this module itself is server-only (see the import at the top).
      token: process.env.SANITY_API_READ_TOKEN || undefined,
      stega: {
        studioUrl: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || "/studio"
      }
    })
  : null;
