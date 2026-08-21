import { defineQuery } from "next-sanity";

const CARD_FIELDS = `
  _id,_type,title,slug,kicker,
  "summary": coalesce(summary, deck, ""),
  placeType
`;

export const DESTINATION_QUERY = defineQuery(`
  *[_type == "destination" && slug.current == $slug][0]{
    _id,title,slug,kicker,summary,country,coordinates,whyGo,
    "places": places[]->{${CARD_FIELDS}},
    "stories": stories[]->{${CARD_FIELDS}}
  }
`);

export const PLACE_QUERY = defineQuery(`
  *[_type == "place" && slug.current == $slug][0]{
    _id,title,slug,kicker,summary,placeType,whyWeLikeIt,
    "destination": destination->{${CARD_FIELDS}}
  }
`);

export const STORY_QUERY = defineQuery(`
  *[_type == "story" && slug.current == $slug][0]{
    _id,title,slug,kicker,deck,body,
    "related": related[]->{${CARD_FIELDS}}
  }
`);

export const COLLECTION_QUERY = defineQuery(`
  *[_type == "collection" && slug.current == $slug][0]{
    _id,title,slug,kicker,summary,
    "items": items[]->{${CARD_FIELDS}}
  }
`);
