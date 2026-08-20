import { defineQuery } from "next-sanity";

export const DESTINATION_QUERY = defineQuery(`
  *[_type == "destination" && slug.current == $slug][0]{
    _id,title,slug,kicker,summary,country,coordinates,whyGo,
    "places": places[]->{_id,_type,title,slug,kicker,summary,placeType},
    "stories": stories[]->{_id,_type,title,slug,kicker,summary}
  }
`);

export const PLACE_QUERY = defineQuery(`
  *[_type == "place" && slug.current == $slug][0]{
    _id,title,slug,kicker,summary,placeType,whyWeLikeIt,
    "destination": destination->{_id,title,slug}
  }
`);

export const STORY_QUERY = defineQuery(`
  *[_type == "story" && slug.current == $slug][0]{
    _id,title,slug,kicker,deck,body,
    "related": related[]->{_id,_type,title,slug,kicker,summary}
  }
`);

export const COLLECTION_QUERY = defineQuery(`
  *[_type == "collection" && slug.current == $slug][0]{
    _id,title,slug,kicker,summary,
    "items": items[]->{_id,_type,title,slug,kicker,summary}
  }
`);
