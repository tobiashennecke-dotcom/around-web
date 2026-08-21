import { sanity } from "@/lib/sanity/client";
import {
  COLLECTION_QUERY,
  DESTINATION_QUERY,
  DISCOVER_QUERY,
  HOME_QUERY,
  PERSON_QUERY,
  PLACE_QUERY,
  PRODUCT_QUERY,
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
  Person,
  Place,
  Product,
  Story
} from "@/lib/types";

function accentFor(type: ContentType, placeType?: string): ContentCard["accent"] {
  if (type === "story") return "blue";
  if (type === "person") return "pink";
  if (type === "product") return "blue";
  if (type === "place" && ["eat","drink","culture"].includes(placeType || "")) return "pink";
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
    accent: accentFor(type, doc.placeType),
    image: doc.image || undefined,
    featured: Boolean(doc.featured),
    aroundSelected: Boolean(doc.aroundSelected),
    priority: typeof doc.priority === "number" ? doc.priority : undefined
  };
}

function compactCards(items: any[] | null | undefined): ContentCard[] {
  return (items || []).map(toCard).filter((item): item is ContentCard => Boolean(item));
}

export async function getHomepageContent(): Promise<{featured:ContentCard[];latest:ContentCard[]}> {
  if (sanity) {
    const doc = await sanity.fetch(HOME_QUERY);
    const featured = compactCards(doc?.featured as any[] | undefined);
    const latest = compactCards(doc?.latest as any[] | undefined);
    if (featured.length || latest.length) return { featured, latest };
  }
  return { featured:[lisbon,cityGolf,stories[0]], latest:content.slice(0,12) };
}

export async function getDiscoverContent(): Promise<ContentCard[]> {
  if (sanity) {
    const docs = await sanity.fetch(DISCOVER_QUERY);
    const cards = compactCards(docs as any[] | undefined);
    if (cards.length) return cards;
  }
  return content;
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
        image: doc.image || undefined,
        featured: Boolean(doc.featured),
        aroundSelected: Boolean(doc.aroundSelected),
        priority: typeof doc.priority === "number" ? doc.priority : undefined,
        country: doc.country || "",
        latitude: doc.coordinates?.lat,
        longitude: doc.coordinates?.lng,
        whyGo: doc.whyGo || "",
        aroundTake: doc.aroundTake || undefined,
        bestFor: Array.isArray(doc.bestFor) ? doc.bestFor : [],
        placeIds: linkedPlaces.map(x => x.id),
        storyIds: linkedStories.map(x => x.id),
        places: linkedPlaces,
        stories: linkedStories,
        seoTitle: doc.seoTitle || undefined,
        seoDescription: doc.seoDescription || undefined,
        socialImage: doc.socialImage || undefined
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
        accent: accentFor("place", doc.placeType),
        image: doc.image || undefined,
        featured: Boolean(doc.featured),
        aroundSelected: Boolean(doc.aroundSelected),
        priority: typeof doc.priority === "number" ? doc.priority : undefined,
        destinationId: destination?.id || "",
        destination: destination || undefined,
        placeType: doc.placeType || "do",
        whyWeLikeIt: doc.whyWeLikeIt || "",
        aroundTake: doc.aroundTake || undefined,
        goodToKnow: Array.isArray(doc.goodToKnow) ? doc.goodToKnow.filter((x:any)=>x?.label && x?.value) : [],
        address: doc.address || undefined,
        website: doc.website || undefined,
        instagram: doc.instagram || undefined,
        latitude: doc.coordinates?.lat,
        longitude: doc.coordinates?.lng,
        seoTitle: doc.seoTitle || undefined,
        seoDescription: doc.seoDescription || undefined,
        socialImage: doc.socialImage || undefined
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
        image: doc.image || undefined,
        featured: Boolean(doc.featured),
        aroundSelected: Boolean(doc.aroundSelected),
        priority: typeof doc.priority === "number" ? doc.priority : undefined,
        format: doc.format || undefined,
        deck: doc.deck || "",
        body: Array.isArray(doc.body) ? doc.body : [],
        author: doc.author ? {
          id: doc.author._id,
          title: doc.author.title,
          slug: doc.author.slug?.current,
          role: doc.author.role || undefined,
          image: doc.author.image || undefined
        } : undefined,
        publishedAt: doc.publishedAt || undefined,
        readingTime: typeof doc.readingTime === "number" ? doc.readingTime : undefined,
        relatedIds: related.map(x => x.id),
        related,
        seoTitle: doc.seoTitle || undefined,
        seoDescription: doc.seoDescription || undefined,
        socialImage: doc.socialImage || undefined
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

export async function getPerson(slug: string): Promise<Person | null> {
  if (sanity) {
    const doc = await sanity.fetch(PERSON_QUERY, {slug});
    if (doc) return {
      id:doc._id,type:"person",slug:doc.slug.current,title:doc.title,
      kicker:doc.role || "People to Know",description:doc.summary || "",accent:"pink",
      image:doc.image || undefined,featured:Boolean(doc.featured),priority:doc.priority,
      role:doc.role || undefined,location:doc.location || undefined,bio:Array.isArray(doc.bio)?doc.bio:[],
      website:doc.website || undefined,instagram:doc.instagram || undefined
    };
  }
  const item = content.find(x=>x.type === "person" && x.slug === slug);
  return item ? {...item,type:"person"} as Person : null;
}

export async function getProduct(slug: string): Promise<Product | null> {
  if (sanity) {
    const doc = await sanity.fetch(PRODUCT_QUERY, {slug});
    if (doc) return {
      id:doc._id,type:"product",slug:doc.slug.current,title:doc.title,
      kicker:doc.brand || doc.category || "The Good Stuff",description:doc.summary || "",accent:"blue",
      image:doc.image || undefined,featured:Boolean(doc.featured),aroundSelected:Boolean(doc.aroundSelected),priority:doc.priority,
      brand:doc.brand || undefined,category:doc.category || undefined,whyItMatters:doc.whyItMatters || undefined,url:doc.url || undefined
    };
  }
  return null;
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
        image: doc.image || undefined,
        featured: Boolean(doc.featured),
        priority: typeof doc.priority === "number" ? doc.priority : undefined,
        itemIds: items.map(x => x.id),
        items,
        seoTitle: doc.seoTitle || undefined,
        seoDescription: doc.seoDescription || undefined,
        socialImage: doc.socialImage || undefined
      };
    }
  }

  if (slug !== cityGolf.slug) return null;
  const items = cityGolf.itemIds
    .map(id => content.find(item => item.id === id))
    .filter((item): item is ContentCard => Boolean(item));
  return { ...cityGolf, items };
}

export async function getSearchContent(query:string,type?:string):Promise<ContentCard[]> {
  const cards=await getDiscoverContent();
  const q=query.trim().toLowerCase();
  return cards.filter(item=>{
    const typeOk=!type || type === "all" || item.type === type;
    const haystack=`${item.title} ${item.kicker || ""} ${item.description}`.toLowerCase();
    return typeOk && (!q || haystack.includes(q));
  });
}
