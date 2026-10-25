import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * /preview is a blind, link-only partner page (see AROUND_ONEPAGER_CLAUDE_HANDOFF.md
 * §6): kept out of crawling here in addition to its own per-page noindex
 * meta (lib/partner-preview.ts / the Sanity singleton's seo.noindex field).
 * Personal areas and the Studio carry no public content and stay out too.
 * app/sitemap.ts never lists any of these paths.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: ["/preview", "/studio", "/account", "/saved", "/my-around", "/api/"]
    },
    sitemap: new URL("/sitemap.xml", siteUrl()).toString()
  };
}
