import { sanity } from "@/lib/sanity/client";
import { normalizeContentRole } from "@/lib/content-role";
import {
  COLLECTION_QUERY,
  DESTINATION_GEO_QUERY,
  DESTINATION_QUERY,
  DISCOVER_QUERY,
  HOME_QUERY,
  PERSON_QUERY,
  PLACE_QUERY,
  PLACE_RELEVANCE_CANDIDATES_QUERY,
  PLACES_BY_IDS_QUERY,
  PRODUCT_QUERY,
  STORY_QUERY
} from "@/lib/sanity/queries";
import {
  bestAnchorRelevance,
  filterGeographicallyEligible,
  getAroundItRecommendations,
  type AroundItAnchor,
  type AroundItCandidate,
  type AroundItSubject
} from "@/lib/relevance";
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
    destinationId: doc.destinationId || undefined,
    latitude: doc.coordinates?.lat,
    longitude: doc.coordinates?.lng,
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

type RelevanceCandidateDoc = AroundItCandidate & { doc: any };

function toRelevanceCandidate(doc: any): RelevanceCandidateDoc | null {
  if (!doc?._id || !doc?.title || !doc?.slug?.current) return null;
  return {
    id: doc._id,
    placeType: doc.placeType || undefined,
    destinationId: doc.destinationId || undefined,
    latitude: doc.coordinates?.lat,
    longitude: doc.coordinates?.lng,
    priority: typeof doc.priority === "number" ? doc.priority : undefined,
    featured: Boolean(doc.featured),
    aroundSelected: Boolean(doc.aroundSelected),
    doc
  };
}

async function getAroundItForPlace(doc: any, destinationId: string | undefined): Promise<ContentCard[]> {
  if (!sanity) return [];
  const candidateDocs = await sanity.fetch(PLACE_RELEVANCE_CANDIDATES_QUERY, { excludeId: doc._id });
  const candidates = (candidateDocs as any[] | undefined || [])
    .map(toRelevanceCandidate)
    .filter((item): item is RelevanceCandidateDoc => Boolean(item));

  const subject: AroundItSubject = {
    id: doc._id,
    placeType: doc.placeType || undefined,
    destinationId,
    latitude: doc.coordinates?.lat,
    longitude: doc.coordinates?.lng
  };

  return getAroundItRecommendations(subject, candidates)
    .map(item => toCard(item.doc))
    .filter((item): item is ContentCard => Boolean(item));
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
      const aroundIt = await getAroundItForPlace(doc, destination?.id);
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
        theFeel: Array.isArray(doc.theFeel) ? doc.theFeel.filter((x:unknown): x is string => Boolean(x)) : [],
        bestFor: Array.isArray(doc.bestFor) ? doc.bestFor.filter((x:unknown): x is string => Boolean(x)) : [],
        aroundMoment: doc.aroundMoment || undefined,
        knowBeforeYouGo: doc.knowBeforeYouGo || undefined,
        holes: typeof doc.holes === "number" ? doc.holes : undefined,
        par: typeof doc.par === "number" ? doc.par : undefined,
        courseCharacter: doc.courseCharacter || undefined,
        walkability: doc.walkability || undefined,
        cartAvailability: doc.cartAvailability || undefined,
        practiceFacilities: Array.isArray(doc.practiceFacilities) ? doc.practiceFacilities.filter((x:unknown): x is string => Boolean(x)) : [],
        guestPlay: doc.guestPlay || undefined,
        season: doc.season || undefined,
        bookingUrl: doc.bookingUrl || undefined,
        bookingLabel: doc.bookingLabel || undefined,
        operatorStatus: doc.operatorStatus?.source ? {
          source: doc.operatorStatus.source,
          lastVerifiedAt: doc.operatorStatus.lastVerifiedAt || undefined
        } : undefined,
        commercialPartner: Boolean(doc.commercialPartner),
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
        aroundIt,
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
    destination: place.destinationId === lisbon.id ? lisbon : undefined,
    aroundIt: []
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

/**
 * Text/role/editorial ranking shared by the global search and any trip-aware
 * variant of it, so the two never drift into two different scoring functions.
 */
export function rankSearchResults(
  cards: ContentCard[],
  query: string,
  type?: string,
  role?: string,
  geoScore?: (item: ContentCard) => number
): ContentCard[] {
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
    if (geoScore) score+=geoScore(item);
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

export async function getSearchContent(query:string,type?:string,role?:string):Promise<ContentCard[]> {
  const cards=await getDiscoverContent();
  return rankSearchResults(cards, query, type, role);
}

export type TripSearchContext = {
  /** Sanity place IDs already in the trip; their coordinates become geographic anchors. */
  anchorPlaceIds?: string[];
  /** Trip-level destination, used only when no anchor place has coordinates. */
  destinationId?: string;
};

async function resolveTripAnchors(context: TripSearchContext): Promise<AroundItAnchor[]> {
  if (!sanity) return [];

  const anchorPlaceIds = (context.anchorPlaceIds || []).filter(Boolean);
  if (anchorPlaceIds.length) {
    const docs = await sanity.fetch(PLACES_BY_IDS_QUERY, { ids: anchorPlaceIds });
    const anchors = (docs as any[] | undefined || [])
      .filter(doc => typeof doc.coordinates?.lat === "number" && typeof doc.coordinates?.lng === "number")
      .map((doc): AroundItAnchor => ({
        destinationId: doc.destinationId || undefined,
        latitude: doc.coordinates.lat,
        longitude: doc.coordinates.lng
      }));
    if (anchors.length) return anchors;
  }

  if (context.destinationId) {
    const doc = await sanity.fetch(DESTINATION_GEO_QUERY, { id: context.destinationId });
    if (typeof doc?.coordinates?.lat === "number" && typeof doc?.coordinates?.lng === "number") {
      return [{ destinationId: context.destinationId, latitude: doc.coordinates.lat, longitude: doc.coordinates.lng }];
    }
  }

  return [];
}

/**
 * Trip-aware variant of getSearchContent for Quick Add default recommendations.
 *
 * Pipeline: uncapped place candidate pool -> geographic eligibility -> each
 * eligible candidate's geographic relevance score (via its best/nearest
 * applicable anchor) -> combined with the same role/text/editorial ranking as
 * global search, via rankSearchResults' optional geoScore bonus -> (caller
 * applies the final display limit, same as getSearchContent does today).
 * Geography is not just a pass/fail gate here: a candidate 2km from a trip
 * anchor should outrank one 70km away even if the latter has a somewhat
 * higher editorial priority, so its distance-based score is folded into the
 * same ranking pass rather than discarded after the eligibility check.
 *
 * Deliberately does NOT go through getDiscoverContent()/DISCOVER_QUERY: that
 * query caps at the top 36 documents across all content types by priority,
 * which could drop a geographically relevant but lower-priority place before
 * geographic eligibility is ever checked. Quick Add candidates are always
 * places (role is always set), so this queries the full, uncapped place pool
 * directly instead.
 */
export async function getTripAwareSearchContent(
  query: string,
  type: string | undefined,
  role: string | undefined,
  context: TripSearchContext
): Promise<ContentCard[]> {
  if (!sanity) return getSearchContent(query, type, role);

  const anchors = await resolveTripAnchors(context);
  if (!anchors.length) return getSearchContent(query, type, role);

  const placeDocs = await sanity.fetch(PLACE_RELEVANCE_CANDIDATES_QUERY, { excludeId: "" });
  const placeCards = (placeDocs as any[] | undefined || [])
    .map(toCard)
    .filter((item): item is ContentCard => Boolean(item));

  const eligible = filterGeographicallyEligible(anchors, placeCards);

  const geoScores = new Map<string, number>();
  for (const candidate of eligible) {
    const best = bestAnchorRelevance(anchors, candidate);
    if (best) geoScores.set(candidate.id, best.score);
  }

  return rankSearchResults(eligible, query, type, role, item => geoScores.get(item.id) ?? 0);
}
