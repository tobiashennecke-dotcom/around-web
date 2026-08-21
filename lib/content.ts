import { sanity } from "@/lib/sanity/client";
import {
  COLLECTION_QUERY,
  DESTINATION_QUERY,
  PLACE_QUERY,
  STORY_QUERY
} from "@/lib/sanity/queries";
import {
  cityGolf,
  content,
  lisbon,
  places,
  stories
} from "@/lib/sample-content";
import type {
  AroundCollection,
  ContentCard,
  ContentType,
  Destination,
  Place,
  Story
} from "@/lib/types";

function accentFor(type: ContentType, placeType?: string): ContentCard["accent"] {
  if (type === "story") return "blue";
  if (type === "person") return "pink";
  if (type === "product") return "blue";
  if (type === "place" && placeType === "eat") return "pink";
  return "lime";
}

function normalizeType(type: string): ContentType | null {
  if (type === "destination") return "destination";
  if (type === "place") return "place";
  if (type === "story") return "story";
  if (type === "person") return "person";
  if (type === "product") return "product";
  if (type === "collection") return "collection";
  return null;
}

function toCard(doc: any): ContentCard | null {
  if (!doc?._id || !doc?.title || !doc?.slug?.current) return null;
  const type = normalizeType(doc._type);
  if (!type) return null;

  return {
    id: doc._id,
    type,
    slug: doc.slug.current,
    title: doc.title,
    kicker: doc.kicker || undefined,
    description: doc.summary || "",
    accent: accentFor(type, doc.placeType)
  };
}

function compactCards(items: any[] | null | undefined): ContentCard[] {
  return (items || []).map(toCard).filter((item): item is ContentCard => Boolean(item));
}

export async function getDestination(slug: string): Promise<Destination | null> {
  if (sanity) {
    const doc = await sanity.fetch(DESTINATION_QUERY, { slug });
    if (doc) {
      const linkedPlaces = compactCards(doc.places as any[] | undefined);
      const linkedStories = compactCards(doc.stories as any[] | undefined);

      return {
        id: doc._id,
        type: "destination",
        slug: doc.slug.current,
        title: doc.title,
        kicker: doc.kicker || undefined,
        description: doc.summary || "",
        accent: "lime",
        country: doc.country || "",
        latitude: doc.coordinates?.lat,
        longitude: doc.coordinates?.lng,
        whyGo: doc.whyGo || "",
        placeIds: linkedPlaces.map(x => x.id),
        storyIds: linkedStories.map(x => x.id),
        places: linkedPlaces,
        stories: linkedStories
      };
    }
  }

  if (slug !== lisbon.slug) return null;
  return {
    ...lisbon,
    places: places.filter(item => lisbon.placeIds.includes(item.id)),
    stories: stories.filter(item => lisbon.storyIds.includes(item.id))
  };
}

export async function getPlace(slug: string): Promise<Place | null> {
  if (sanity) {
    const doc = await sanity.fetch(PLACE_QUERY, { slug });
    if (doc) {
      const destination = toCard(doc.destination);
      return {
        id: doc._id,
        type: "place",
        slug: doc.slug.current,
        title: doc.title,
        kicker: doc.kicker || undefined,
        description: doc.summary || "",
        accent: doc.placeType === "eat" ? "pink" : "lime",
        destinationId: destination?.id || "",
        destination: destination || undefined,
        placeType: doc.placeType || "do",
        whyWeLikeIt: doc.whyWeLikeIt || ""
      };
    }
  }

  const place = places.find(x => x.slug === slug);
  if (!place) return null;
  return {
    ...place,
    destination: place.destinationId === lisbon.id ? lisbon : undefined
  };
}

export async function getStory(slug: string): Promise<Story | null> {
  if (sanity) {
    const doc = await sanity.fetch(STORY_QUERY, { slug });
    if (doc) {
      const related = compactCards(doc.related as any[] | undefined);
      return {
        id: doc._id,
        type: "story",
        slug: doc.slug.current,
        title: doc.title,
        kicker: doc.kicker || undefined,
        description: doc.deck || "",
        accent: "blue",
        deck: doc.deck || "",
        body: Array.isArray(doc.body)
          ? doc.body
              .filter((block: any) => block?._type === "block")
              .map((block: any) => (block.children || []).map((child: any) => child.text).join(""))
              .filter(Boolean)
          : [],
        relatedIds: related.map(x => x.id),
        related
      };
    }
  }

  const story = stories.find(x => x.slug === slug);
  if (!story) return null;
  const related = story.relatedIds
    .map(id => content.find(item => item.id === id))
    .filter((item): item is ContentCard => Boolean(item));
  return { ...story, related };
}

export async function getCollection(slug: string): Promise<AroundCollection | null> {
  if (sanity) {
    const doc = await sanity.fetch(COLLECTION_QUERY, { slug });
    if (doc) {
      const items = compactCards(doc.items as any[] | undefined);
      return {
        id: doc._id,
        type: "collection",
        slug: doc.slug.current,
        title: doc.title,
        kicker: doc.kicker || undefined,
        description: doc.summary || "",
        accent: "lime",
        itemIds: items.map(x => x.id),
        items
      };
    }
  }

  if (slug !== cityGolf.slug) return null;
  const items = cityGolf.itemIds
    .map(id => content.find(item => item.id === id))
    .filter((item): item is ContentCard => Boolean(item));
  return { ...cityGolf, items };
}
