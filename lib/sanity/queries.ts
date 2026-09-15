import { defineQuery } from "next-sanity";

const CARD_FIELDS = `
  _id,_type,title,slug,kicker,placeType,featured,aroundSelected,priority,
  defaultPlanningMode,suggestedDurationMinutes,suggestedDaypart,suggestedTime,
  compatibleDayparts,effortLevel,environment,weatherSensitivity,
  coordinates,
  "destinationId": destination->_id,
  "summary": coalesce(summary, deck, ""),
  "image": coalesce(heroImage.asset->url, portrait.asset->url, image.asset->url)
`;

/**
 * Minimal Story-card projection for contextual rails (Place/Destination/Person
 * pages) - enough for ContentCard/StoryRail, deliberately no Story body.
 */
const STORY_CARD_FIELDS = `
  _id,_type,title,slug,kicker,
  "summary": coalesce(deck, ""),
  format,publishedAt,readingTime,featured,aroundSelected,priority,
  "image": heroImage.asset->url
`;

/**
 * Stories whose related[] references any of $ids - the reverse Story Graph edge.
 * Deliberately checks related[]._ref membership only, NOT document-wide
 * references($ids): a Story also references its author (a person) and may
 * carry other reference fields in future, and none of those may drive Story
 * distribution - only the canonical related[] field may.
 */
export const STORIES_RELATED_TO_IDS_QUERY = defineQuery(`
  *[_type == "story" && count(related[_ref in $ids]) > 0]{${STORY_CARD_FIELDS}}
`);

/**
 * Place ids belonging to a Destination - used to roll up Place-level Stories
 * transitively. Checks the explicit destination._ref field only, not
 * document-wide references($destinationId), so this can never widen to match
 * an unrelated reference field on Place.
 */
export const PLACE_IDS_FOR_DESTINATION_QUERY = defineQuery(`
  *[_type == "place" && destination._ref == $destinationId]._id
`);

/**
 * Everything /stories needs in one round trip: every Story card (no body),
 * minimal Story Graph context per Story (just enough to compute direct +
 * transitive Destination matches - never full Place documents), the
 * storiesHub singleton (editorial curation, may not exist yet), and every
 * Destination (minimal fields) as the fallback pool for "Explore by Place"
 * when no/insufficient curation exists. Deliberately one query rather than
 * fetching every Story body and filtering in React.
 */
export const STORIES_HUB_QUERY = defineQuery(`
  {
    "stories": *[_type == "story" && defined(slug.current)]{
      _id,_type,title,slug,kicker,
      "summary": coalesce(deck, ""),
      format,publishedAt,readingTime,featured,aroundSelected,priority,
      "image": heroImage.asset->url,
      "relatedRefs": related[]->{
        "type": _type,
        "id": _id,
        "destinationId": destination->_id
      }
    },
    "hub": *[_type == "storiesHub" && _id == "around-stories-hub"][0]{
      editionLabel,
      intro,
      "leadStoryId": leadStory->_id,
      "secondaryStoryIds": secondaryStories[]->_id,
      "featuredDestinationIds": featuredDestinations[]->_id
    },
    "allDestinations": *[_type == "destination" && defined(slug.current)]{
      _id,title,slug,kicker,country,priority,
      "image": heroImage.asset->url
    }
  }
`);

export const HOME_QUERY = defineQuery(`
  {
    "featured": *[
      _type in ["destination","place","story","person","product","collection"] &&
      featured == true && defined(slug.current)
    ] | order(priority desc, _updatedAt desc)[0...6]{${CARD_FIELDS}},
    "latest": *[
      _type in ["destination","place","story","person","product","collection"] &&
      defined(slug.current)
    ] | order(priority desc, _updatedAt desc)[0...12]{${CARD_FIELDS}}
  }
`);

export const DISCOVER_QUERY = defineQuery(`
  *[
    _type in ["destination","place","story","person","product","collection"] &&
    defined(slug.current)
  ] | order(priority desc, _updatedAt desc)[0...36]{${CARD_FIELDS}}
`);

export const DESTINATION_QUERY = defineQuery(`
  *[_type == "destination" && slug.current == $slug][0]{
    _id,title,slug,kicker,summary,country,coordinates,whyGo,aroundTake,bestFor,
    featured,aroundSelected,priority,seoTitle,seoDescription,
    "image": heroImage.asset->url,
    "socialImage": socialImage.asset->url,
    "places": places[]->{${CARD_FIELDS}},
    "stories": stories[]->{${CARD_FIELDS}}
  }
`);

export const PLACE_QUERY = defineQuery(`
  *[_type == "place" && slug.current == $slug][0]{
    _id,title,slug,kicker,summary,placeType,defaultPlanningMode,suggestedDurationMinutes,suggestedDaypart,suggestedTime,whyWeLikeIt,aroundTake,goodToKnow,
    compatibleDayparts,effortLevel,environment,weatherSensitivity,
    theFeel,bestFor,aroundMoment,knowBeforeYouGo,
    holes,par,courseCharacter,walkability,cartAvailability,practiceFacilities,guestPlay,season,
    stayCharacter,accommodationTypes,roomSummary,spaSummary,foodSummary,breakfastSummary,parkingSummary,dogPolicy,
    checkIn,checkOut,openAllYear,recommendedNightsMin,recommendedNightsMax,golfBaseWhy,
    eatCharacter,mealTypes,cuisine,priceLevel,reservationAdvice,dietaryNotes,setting,
    experienceType,experienceDurationLabel,bookingAdvice,
    address,website,instagram,coordinates,featured,aroundSelected,priority,
    bookingUrl,bookingLabel,operatorStatus,commercialPartner,
    seoTitle,seoDescription,
    "image": heroImage.asset->url,
    "socialImage": socialImage.asset->url,
    gallery[]{
      alt,caption,credit,layout,hotspot,
      "url": asset->url,
      "width": asset->metadata.dimensions.width,
      "height": asset->metadata.dimensions.height,
      "aspectRatio": asset->metadata.dimensions.aspectRatio
    },
    "destination": destination->{${CARD_FIELDS}}
  }
`);

export const PLACE_RELEVANCE_CANDIDATES_QUERY = defineQuery(`
  *[_type == "place" && defined(slug.current) && _id != $excludeId]{${CARD_FIELDS}}
`);

export const PLACES_BY_IDS_QUERY = defineQuery(`
  *[_type == "place" && _id in $ids]{
    _id,
    coordinates,
    "destinationId": destination->_id
  }
`);

/** Minimal Place Intelligence for lib/trip-fit-adapter.ts - no media/editorial prose. */
export const TRIP_FIT_CANDIDATES_QUERY = defineQuery(`
  *[_type == "place" && _id in $ids]{
    _id,
    placeType,
    defaultPlanningMode,
    suggestedDurationMinutes,
    suggestedDaypart,
    compatibleDayparts,
    effortLevel,
    environment,
    weatherSensitivity,
    priority,
    featured,
    aroundSelected,
    coordinates,
    "destinationId": destination->_id
  }
`);

export const DESTINATION_GEO_QUERY = defineQuery(`
  *[_type == "destination" && _id == $id][0]{
    _id,
    coordinates
  }
`);

export const STORY_QUERY = defineQuery(`
  *[_type == "story" && slug.current == $slug][0]{
    _id,title,slug,kicker,deck,format,publishedAt,readingTime,featured,aroundSelected,priority,
    seoTitle,seoDescription,
    "image": heroImage.asset->url,
    "socialImage": socialImage.asset->url,
    body[]{
      ...,
      _type == "image" => {
        ...,
        "url": asset->url,
        "dimensions": asset->metadata.dimensions
      },
      _type == "mediaGallery" => {
        ...,
        images[]{
          alt,caption,credit,hotspot,
          "url": asset->url,
          "width": asset->metadata.dimensions.width,
          "height": asset->metadata.dimensions.height,
          "aspectRatio": asset->metadata.dimensions.aspectRatio
        }
      },
      _type == "placeModule" => {
        layout,
        editorialLine,
        "place": place->{${CARD_FIELDS}}
      }
    },
    "author": author->{_id,title,slug,role,"image":portrait.asset->url},
    "related": related[]->{${CARD_FIELDS}}
  }
`);

export const PERSON_QUERY = defineQuery(`
  *[_type == "person" && slug.current == $slug][0]{
    _id,title,slug,role,location,summary,bio,website,instagram,featured,priority,
    "image": portrait.asset->url
  }
`);

export const PRODUCT_QUERY = defineQuery(`
  *[_type == "product" && slug.current == $slug][0]{
    _id,title,slug,brand,category,summary,whyItMatters,url,featured,aroundSelected,priority,
    "image": image.asset->url
  }
`);

export const COLLECTION_QUERY = defineQuery(`
  *[_type == "collection" && slug.current == $slug][0]{
    _id,title,slug,kicker,summary,featured,priority,seoTitle,seoDescription,
    "image": heroImage.asset->url,
    "socialImage": socialImage.asset->url,
    "items": items[]->{${CARD_FIELDS}}
  }
`);
