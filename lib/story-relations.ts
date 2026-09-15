import type { ContentCard } from "@/lib/types";

export type StoryRelationGroups = {
  places: ContentCard[];
  destinations: ContentCard[];
  people: ContentCard[];
  others: ContentCard[];
};

/**
 * Splits the canonical story.related[] into the groups Story Detail renders
 * differently (Place Bridge, Destination continuation, People continuation,
 * everything else stays in the compact index only). Pure partition: the
 * exact editorial order from related[] is preserved within every group, and
 * no ranking/commercial/geo logic is applied anywhere here.
 */
export function splitStoryRelations(related: ContentCard[] | undefined): StoryRelationGroups {
  const places: ContentCard[] = [];
  const destinations: ContentCard[] = [];
  const people: ContentCard[] = [];
  const others: ContentCard[] = [];

  for (const item of related || []) {
    if (item.type === "place") places.push(item);
    else if (item.type === "destination") destinations.push(item);
    else if (item.type === "person") people.push(item);
    else others.push(item);
  }

  return { places, destinations, people, others };
}
