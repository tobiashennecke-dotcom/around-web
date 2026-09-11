import { sanity } from "@/lib/sanity/client";
import { normalizeContentRole } from "@/lib/content-role";
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
    placeType: type === "place" ? (doc.placeType || undefined) : undefined,
    defaultPlanningMode: type === "place" ? (doc.defaultPlanningMode || undefined) : undefined,
    suggestedDurationMinutes: type === "place" && typeof doc.suggestedDurationMinutes === "number" ? doc.suggestedDurationMinutes : undefined,
    suggestedDaypart: type === "place" ? (doc.suggestedDaypart || undefined) : undefined,
    suggestedTime: type === "place" ? (doc.suggestedTime || undefined) : undefined,
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
        defaultPlanningMode: doc.defaultPlanningMode || undefined,
        suggestedDurationMinutes: typeof doc.suggestedDurationMinutes === "number" ? doc.suggestedDurationMinutes : undefined,
        suggestedDaypart: doc.suggestedDaypart || undefined,
        suggestedTime: doc.suggestedTime || undefined,
        whyWeLikeIt: doc.whyWeLikeIt || "",
        aroundTake: doc.aroundTake || undefined,
        goodToKnow: Array.isArray(doc.goodToKnow) ? doc.goodToKnow.filter((x:any)=>x?.label && x?.value) : [],
        gallery: Array.isArray(doc.gallery) ? doc.gallery.filter((x:any)=>x?.url).map((x:any)=>({
          url:x.url,
          alt:x.alt || undefined,
          caption:x.caption || undefined,
          credit:x.credit || undefined,
          layout:x.layout || "auto",
          width:typeof x.width === "number" ? x.width : undefined,
          height:typeof x.height === "number" ? x.height : undefined,
          aspectRatio:typeof x.aspectRatio === "number" ? x.aspectRatio : undefined
        })) : [],
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

export async function getSearchContent(query:string,type?:string,role?:string):Promise<ContentCard[]> {
  const cards=await getDiscoverContent();
  const q=query.trim().toLowerCase();
  const terms=q.split(/\s+/).filter(Boolean);
  const normalizedRole=normalizeContentRole(role);

  function relevance(item: ContentCard) {
    const title=item.title.toLowerCase();
    const kicker=(item.kicker || "").toLowerCase();
    const description=(item.description || "").toLowerCase();
    const placeType=(item.placeType || "").toLowerCase();
    const haystack=`${title} ${kicker} ${description} ${placeType}`;
    let score=0;

    if (q) {
      if (title === q) score+=180;
      else if (title.startsWith(q)) score+=120;
      else if (title.includes(q)) score+=90;
      if (kicker.includes(q)) score+=42;
      if (description.includes(q)) score+=24;
      for (const term of terms) {
        if (title.includes(term)) score+=24;
        else if (kicker.includes(term)) score+=12;
        else if (description.includes(term)) score+=6;
      }
      if (!terms.every(term=>haystack.includes(term))) return -1;
    }

    if (item.aroundSelected) score+=22;
    if (item.featured) score+=12;
    if (typeof item.priority === "number") score+=Math.max(-10,Math.min(20,item.priority));
    return score;
  }

  return cards
    .filter(item=>{
      const typeOk=!type || type === "all" || item.type === type;
      const roleOk=!normalizedRole || (item.type === "place" && normalizeContentRole(item.placeType) === normalizedRole);
      return typeOk && roleOk && relevance(item) >= 0;
    })
    .sort((a,b)=>relevance(b)-relevance(a));
}
