import type { MetadataRoute } from "next";
import { sanity } from "@/lib/sanity/client";
import { SITEMAP_QUERY } from "@/lib/sanity/queries";
import { siteUrl } from "@/lib/site";

const ROUTE_BY_TYPE: Record<string, string> = {
  destination: "destinations",
  place: "places",
  story: "stories",
  person: "people",
  product: "objects",
  collection: "collections"
};

const STATIC_PATHS = ["/", "/discover", "/stories", "/premium", "/impressum", "/datenschutz"];

type SitemapDoc = { _type: string; slug: string; _updatedAt?: string };

/**
 * Public editorial pages only. Personal areas (/saved, /my-around, /account),
 * /search, /studio and the link-only /preview stay out. Offline content is
 * excluded by the same visibility rule the pages use.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map(path => ({ url: new URL(path, base).toString() }));

  if (!sanity) return entries;

  try {
    const docs = await sanity.fetch<SitemapDoc[]>(SITEMAP_QUERY);
    for (const doc of docs || []) {
      const segment = ROUTE_BY_TYPE[doc._type];
      if (!segment || !doc.slug) continue;
      entries.push({
        url: new URL(`/${segment}/${encodeURIComponent(doc.slug)}`, base).toString(),
        lastModified: doc._updatedAt
      });
    }
  } catch {
    // A Sanity outage must not break the sitemap; static pages stay listed.
  }

  return entries;
}

export const revalidate = 3600;
