import { defineQuery } from "next-sanity";

/**
 * AROUND visibility switch (Destination Online/Offline).
 *
 * - destination.isOnline: editor switch. Missing field (all documents created
 *   before the switch existed) counts as ONLINE, so nothing changes until an
 *   editor deliberately switches a destination off. New destinations get
 *   isOnline=false as initial value in the Studio.
 * - place.visibility: "inherit" (default) follows its destination; "offline"
 *   hides a single Place even when its destination is online.
 * - story: visible when it relates to no destination/place at all (e.g. the
 *   manifest) OR when at least one related destination/place is visible.
 *
 * Offline means "not on the website", NOT confidential: the dataset stays
 * publicly readable via the Sanity API.
 *
 * Every public query must use these fragments - tests/visibility.test.cjs
 * checks that.
 */
export const DESTINATION_ONLINE = `coalesce(isOnline, true) == true`;
export const PLACE_ONLINE = `(coalesce(visibility, "inherit") != "offline" && coalesce(destination->isOnline, true) == true)`;
const STORY_RELATION_FLAGS = `coalesce(array::compact(related[]->{"on": select(_type == "destination" => coalesce(isOnline, true), _type == "place" => coalesce(visibility, "inherit") != "offline" && coalesce(destination->isOnline, true), null)}.on), [])`;
export const STORY_ONLINE = `(count(${STORY_RELATION_FLAGS}) == 0 || true in ${STORY_RELATION_FLAGS})`;
/** Type-aware visibility for mixed-type lists (home, discover, search, collections). */
export const CONTENT_ONLINE = `select(_type == "destination" => ${DESTINATION_ONLINE}, _type == "place" => ${PLACE_ONLINE}, _type == "story" => ${STORY_ONLINE}, true)`;

const CARD_FIELDS = `
  "aroundHidden": !${CONTENT_ONLINE},
  _id,_type,title,slug,kicker,teaserTitle,teaserDescription,placeType,featured,aroundSelected,priority,accessTier,
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
 * accessTier is metadata only here (drives the card's PREMIUM marker) - it
 * never affects which Stories are selected or how they're ranked.
 */
const STORY_CARD_FIELDS = `
  "aroundHidden": !${STORY_ONLINE},
  _id,_type,title,slug,kicker,
  "summary": coalesce(deck, ""),
  format,publishedAt,readingTime,featured,aroundSelected,priority,accessTier,
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
  *[_type == "story" && count(related[_ref in $ids]) > 0 && ${STORY_ONLINE}]{${STORY_CARD_FIELDS}}
`);

/**
 * READ BEFORE YOU GO (v1.26c): same reverse Story Graph edge as
 * STORIES_RELATED_TO_IDS_QUERY, plus the raw related[] ref ids so the caller
 * can compute exactly which Trip Places/Destinations a Story matches and
 * rank accordingly. Kept as its own query rather than widening the general
 * one, since relatedRefs is only needed for Trip-aware match explanation.
 */
export const TRIP_STORIES_RELATED_TO_IDS_QUERY = defineQuery(`
  *[_type == "story" && count(related[_ref in $ids]) > 0 && ${STORY_ONLINE}]{
    ${STORY_CARD_FIELDS},
    "relatedRefs": related[]._ref
  }
`);

/**
 * Place ids belonging to a Destination - used to roll up Place-level Stories
 * transitively. Checks the explicit destination._ref field only, not
 * document-wide references($destinationId), so this can never widen to match
 * an unrelated reference field on Place.
 */
export const PLACE_IDS_FOR_DESTINATION_QUERY = defineQuery(`
  *[_type == "place" && destination._ref == $destinationId && ${PLACE_ONLINE}]._id
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
    "stories": *[_type == "story" && defined(slug.current) && ${STORY_ONLINE}]{
      _id,_type,title,slug,kicker,
      "summary": coalesce(deck, ""),
      format,publishedAt,readingTime,featured,aroundSelected,priority,accessTier,
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
      "featuredDestinationIds": featuredDestinations[coalesce(@->isOnline, true) == true]->_id
    },
    "allDestinations": *[_type == "destination" && defined(slug.current) && ${DESTINATION_ONLINE}]{
      _id,title,slug,kicker,country,priority,
      "image": heroImage.asset->url
    }
  }
`);

export const HOME_QUERY = defineQuery(`
  {
    "featured": *[
      _type in ["destination","place","story","person","product","collection"] &&
      featured == true && defined(slug.current) && ${CONTENT_ONLINE}
    ] | order(priority desc, _updatedAt desc)[0...6]{${CARD_FIELDS}},
    "latest": *[
      _type in ["destination","place","story","person","product","collection"] &&
      defined(slug.current) && ${CONTENT_ONLINE}
    ] | order(priority desc, _updatedAt desc)[0...12]{${CARD_FIELDS}}
  }
`);

/**
 * Homepage hero art direction only (v1 - Homepage Hero Media). Reads ONLY the
 * deterministic singleton document around-homepage, never a list. Returns the
 * raw image value (asset ref + hotspot + crop) rather than a resolved URL, so
 * the frontend can build hotspot-aware, width-specific Sanity CDN URLs via
 * @sanity/image-url instead of downloading one fixed-size original. Entirely
 * independent of HOME_QUERY - never touches editorial content selection.
 */
export const HOMEPAGE_SETTINGS_QUERY = defineQuery(`
  *[_type == "homepageSettings" && _id == "around-homepage"][0]{
    enableHeroImage,
    heroOverlay,
    heroImage{ asset, hotspot, crop, alt },
    mobileHeroImage{ asset, hotspot, crop, alt }
  }
`);

export const DISCOVER_QUERY = defineQuery(`
  *[
    _type in ["destination","place","story","person","product","collection"] &&
    defined(slug.current) && ${CONTENT_ONLINE}
  ] | order(priority desc, _updatedAt desc)[0...36]{${CARD_FIELDS}}
`);

/** Search must consider the full published content pool before role/text filtering.
 * Discovery deliberately remains capped to its curated first 36 cards.
 */
export const SEARCH_QUERY = defineQuery(`
  *[
    _type in ["destination","place","story","person","product","collection"] &&
    defined(slug.current) && ${CONTENT_ONLINE}
  ] | order(priority desc, _updatedAt desc){${CARD_FIELDS}}
`);

export const DESTINATION_QUERY = defineQuery(`
  *[_type == "destination" && slug.current == $slug && ${DESTINATION_ONLINE}][0]{
    _id,title,slug,kicker,summary,country,coordinates,whyGo,aroundTake,bestFor,
    featured,aroundSelected,priority,seoTitle,seoDescription,
    "image": heroImage.asset->url,
    "socialImage": socialImage.asset->url,
    gallery[]{
      alt,caption,credit,hotspot,
      "url": asset->url,
      "width": asset->metadata.dimensions.width,
      "height": asset->metadata.dimensions.height,
      "aspectRatio": asset->metadata.dimensions.aspectRatio
    },
    itinerary{title,intro,durationAdvice,paceAdvice,alternatives[]{_key,reason,"place":place->{${CARD_FIELDS}}},days[]{_key,label,summary,stops[]{_key,period,slot,copy,"place":place->{${CARD_FIELDS}}}}},
    "places": places[]->{${CARD_FIELDS}},
    "stories": stories[]->{${CARD_FIELDS}}
  }
`);

export const PLACE_QUERY = defineQuery(`
  *[_type == "place" && slug.current == $slug && ${PLACE_ONLINE}][0]{
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
  *[_type == "place" && defined(slug.current) && _id != $excludeId && ${PLACE_ONLINE}]{${CARD_FIELDS}}
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
  *[_type == "story" && slug.current == $slug && ${STORY_ONLINE}][0]{
    _id,title,slug,kicker,deck,format,publishedAt,readingTime,featured,aroundSelected,priority,
    accessTier,
    seoTitle,seoDescription,
    "image": heroImage.asset->url,
    "imageAlt": heroImage.alt,
    "imageCaption": heroImage.caption,
    "imageCredit": heroImage.credit,
    disclosure,
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
      },
      _type == "storyVideo" => {
        ...,
        "posterUrl": poster.asset->url,
        "posterAlt": poster.alt
      },
      _type == "storyOTon" => {
        ...,
        "person": person->{_id,title,role,slug}
      },
      _type == "storyHoleLine" => {
        ...,
        "place": place->{${CARD_FIELDS}}
      },
      _type == "premiumGate" => {
        _type
      }
    },
    "author": author->{_id,title,slug,role,"image":portrait.asset->url},
    "related": related[]->{${CARD_FIELDS}}
  }
`);

/** Which of the given content ids are currently switched offline (Saved Library hint). */
export const OFFLINE_CONTENT_IDS_QUERY = defineQuery(`
  *[_id in $ids && !(${CONTENT_ONLINE})]._id
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

/**
 * Shared shape for every card-like content slot in PARTNER_PREVIEW_QUERY
 * (Product Journey steps, From the Field cards, Around It anchor/
 * connections, Save demo card): dereferences the optional `reference` into
 * a CARD_FIELDS projection - the exact same shape toCard() (lib/content.ts)
 * already normalizes elsewhere in the app - alongside the editor's raw
 * override fields. Resolution/merging happens in lib/partner-preview.ts,
 * never here.
 */
const PARTNER_PREVIEW_TEASER_FIELDS = `
  "ref": reference->{${CARD_FIELDS}},
  titleOverride,
  kickerOverride,
  descriptionOverride,
  accent,
  image{asset,hotspot,crop,alt,caption,credit},
  placeholderLabel
`;

/**
 * The /preview partner onepager's singleton (around-partner-preview). Every
 * field is optional - lib/partner-preview.ts falls back to the local static
 * config in lib/preview-content.ts per-field when a value is empty, so this
 * document never needs to be fully filled in to be useful.
 */
export const PARTNER_PREVIEW_QUERY = defineQuery(`
  *[_type == "partnerPreview" && _id == "around-partner-preview"][0]{
    seo{
      title, description, noindex,
      ogImage{asset,hotspot,crop,alt}
    },
    hero{
      eyebrow, headlineLines, subline, intro, scrollCue,
      desktopImage{asset,hotspot,crop,alt,caption,credit},
      mobileImage{asset,hotspot,crop,alt,caption,credit}
    },
    intro{
      eyebrow, headlineLines, body,
      chapters[]{ key, label, caption, image{asset,hotspot,crop,alt,caption,credit} }
    },
    productJourney{
      eyebrow, headlineLines, closing,
      steps[]{
        label, copy, kind, filters,
        item{ ${PARTNER_PREVIEW_TEASER_FIELDS} }
      }
    },
    editorialPrinciples{
      eyebrow, headlineLines, intro,
      principles[]{ number, label, headline, copy }
    },
    stories{
      eyebrow, headlineLines,
      cards[]{ role, ${PARTNER_PREVIEW_TEASER_FIELDS} }
    },
    aroundIt{
      eyebrow, headlineLines, body,
      anchor{ ${PARTNER_PREVIEW_TEASER_FIELDS} },
      connections[]{ role, teaser{ ${PARTNER_PREVIEW_TEASER_FIELDS} } }
    },
    saveDemo{
      eyebrow, headlineLines, body,
      card{ ${PARTNER_PREVIEW_TEASER_FIELDS} },
      destinationLabel, baseSavedCount
    },
    editorialUniverse{ ticker, headlineLines },
    pr{
      eyebrow, headlineLines, body, topics, subheading, helpItems, independenceLine
    },
    contact{ headlineLines, body, person, role, email, ctaLabel },
    status{ eyebrow, headlineLines, body },
    footer{ tagline, instagramLabel, instagramHref, closing }
  }
`);

/** Every public, online detail page for app/sitemap.ts. */
export const SITEMAP_QUERY = defineQuery(`
  *[_type in ["destination","place","story","person","product","collection"] && defined(slug.current) && ${CONTENT_ONLINE}]{
    _type,"slug": slug.current,_updatedAt
  }
`);
