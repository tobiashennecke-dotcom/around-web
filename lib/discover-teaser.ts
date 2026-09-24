import type { ContentCard } from "@/lib/types";

// Approved launch copy for the existing published Story. CMS fields take
// precedence, so editors can replace it without changing the article title.
const launchCopy: Record<string, { title: string; description: string }> = {
  "heimatrefugium-zwei-laender-runde": {
    title: "Zwei Länder. Eine Runde.",
    description: "Golf zwischen Bayern und Tirol, eine Auszeit auf Gut Steinbach – und gute Gründe, länger zu bleiben."
  }
};

export function discoverTeaser(item: ContentCard) {
  const fallback = item.type === "story" ? launchCopy[item.slug] : undefined;
  return {
    title: item.teaserTitle?.trim() || fallback?.title || item.title,
    description: item.teaserDescription?.trim() || fallback?.description || item.description
  };
}
