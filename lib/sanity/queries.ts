import { defineQuery } from "next-sanity";

const CARD_FIELDS = `
  _id,_type,title,slug,kicker,placeType,featured,aroundSelected,priority,
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
    _id,title,slug,kicker,summary,placeType,whyWeLikeIt,aroundTake,goodToKnow,
    address,website,instagram,coordinates,featured,aroundSelected,priority,
    seoTitle,seoDescription,
    "image": heroImage.asset->url,
    "socialImage": socialImage.asset->url,
    "destination": destination->{${CARD_FIELDS}}
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
        "url": asset->url
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
