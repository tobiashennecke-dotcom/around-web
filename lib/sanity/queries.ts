import { defineQuery } from "next-sanity";

const CARD_FIELDS = `
  _id,_type,title,slug,kicker,placeType,featured,aroundSelected,priority,
  defaultPlanningMode,suggestedDurationMinutes,suggestedDaypart,suggestedTime,
  coordinates,
  "destinationId": destination->_id,
  "summary": coalesce(summary, deck, ""),
  "image": coalesce(heroImage.asset->url, portrait.asset->url, image.asset->url)
`;

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
    theFeel,bestFor,aroundMoment,knowBeforeYouGo,
    holes,par,courseCharacter,walkability,cartAvailability,practiceFacilities,guestPlay,season,
    address,website,instagram,coordinates,featured,aroundSelected,priority,
    bookingUrl,bookingLabel,operatorStatus,commercialPartner,
    seoTitle,seoDescription,
    "image": heroImage.asset->url,
    "socialImage": socialImage.asset->url,
    gallery[]{
      alt,caption,credit,layout,
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
