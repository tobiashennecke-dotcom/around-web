import { createClient } from "next-sanity";

export const sanityConfigured =
  Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) &&
  Boolean(process.env.NEXT_PUBLIC_SANITY_DATASET);

export const sanity = sanityConfigured
  ? createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
      apiVersion: "2026-07-01",
      // Published editorial content should be fetched from the Content Lake API.
      // Next.js route-level ISR below handles the frontend cache deliberately.
      useCdn: false,
      perspective: "published",
      stega: {
        studioUrl: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || "/studio"
      }
    })
  : null;
