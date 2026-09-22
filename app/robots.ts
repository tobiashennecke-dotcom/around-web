import type { MetadataRoute } from "next";

/**
 * /preview is a blind, link-only partner page (see AROUND_ONEPAGER_CLAUDE_HANDOFF.md
 * §6): kept out of crawling here in addition to its own per-page noindex
 * meta (lib/partner-preview.ts / the Sanity singleton's seo.noindex field).
 * No sitemap currently exists in this repo, so there's nothing to exclude
 * it from separately. Scoped to /preview only - not the place to introduce
 * unrelated crawling rules for the rest of the site.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: ["/preview"]
    }
  };
}
