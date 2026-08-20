import { sanity } from "@/lib/sanity/client";
import {
  COLLECTION_QUERY,
  DESTINATION_QUERY,
  PLACE_QUERY,
  STORY_QUERY
} from "@/lib/sanity/queries";
import {
  cityGolf,
  lisbon,
  places,
  stories
} from "@/lib/sample-content";
import type { AroundCollection, Destination, Place, Story } from "@/lib/types";

export async function getDestination(slug: string): Promise<Destination | null> {
  if (sanity) {
    const doc = await sanity.fetch(DESTINATION_QUERY, { slug });
    if (doc) {
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
        placeIds: (doc.places || []).map((x: any) => x._id),
        storyIds: (doc.stories || []).map((x: any) => x._id)
      };
    }
  }

  return slug === lisbon.slug ? lisbon : null;
}

export async function getPlace(slug: string): Promise<Place | null> {
  if (sanity) {
    const doc = await sanity.fetch(PLACE_QUERY, { slug });
    if (doc) {
      return {
        id: doc._id,
        type: "place",
        slug: doc.slug.current,
        title: doc.title,
        kicker: doc.kicker || undefined,
        description: doc.summary || "",
        accent: doc.placeType === "eat" ? "pink" : "lime",
        destinationId: doc.destination?._id || "",
        placeType: doc.placeType || "do",
        whyWeLikeIt: doc.whyWeLikeIt || ""
      };
    }
  }

  return places.find(x => x.slug === slug) || null;
}

export async function getStory(slug: string): Promise<Story | null> {
  if (sanity) {
    const doc = await sanity.fetch(STORY_QUERY, { slug });
    if (doc) {
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
              .filter((b: any) => b?._type === "block")
              .map((b: any) => (b.children || []).map((c: any) => c.text).join(""))
          : [],
        relatedIds: (doc.related || []).map((x: any) => x._id)
      };
    }
  }

  return stories.find(x => x.slug === slug) || null;
}

export async function getCollection(slug: string): Promise<AroundCollection | null> {
  if (sanity) {
    const doc = await sanity.fetch(COLLECTION_QUERY, { slug });
    if (doc) {
      return {
        id: doc._id,
        type: "collection",
        slug: doc.slug.current,
        title: doc.title,
        kicker: doc.kicker || undefined,
        description: doc.summary || "",
        accent: "lime",
        itemIds: (doc.items || []).map((x: any) => x._id)
      };
    }
  }

  return slug === cityGolf.slug ? cityGolf : null;
}
