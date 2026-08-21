import { createClient } from "next-sanity";

export const sanityConfigured =
  Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) &&
  Boolean(process.env.NEXT_PUBLIC_SANITY_DATASET);

export const sanity = sanityConfigured
  ? createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
      apiVersion: "2026-07-01",
      useCdn: true,
      stega: {
        studioUrl: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || "/studio"
      }
    })
  : null;
