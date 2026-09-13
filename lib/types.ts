export type ContentType =
  | "destination"
  | "place"
  | "story"
  | "person"
  | "product"
  | "collection";

export type Accent = "lime" | "blue" | "pink";

export type PlanningMode = "flexible" | "fixed";
export type PlanningDaypart = "morning" | "midday" | "afternoon" | "evening" | "all_day";
export type EffortLevel = "low" | "medium" | "high";
export type PlaceEnvironment = "indoor" | "outdoor" | "mixed";
export type WeatherSensitivity = "low" | "medium" | "high";
export type PriceLevel = "€" | "€€" | "€€€" | "€€€€";

export type ContentCard = {
  id: string;
  type: ContentType;
  slug: string;
  title: string;
  kicker?: string;
  description: string;
  accent: Accent;
  image?: string;
  featured?: boolean;
  aroundSelected?: boolean;
  priority?: number;
  /** Semantic role for place cards: course/stay/eat/do. */
  placeType?: string;
  /** Editorial planning intelligence used by Trip Quick Add. */
  defaultPlanningMode?: PlanningMode;
  suggestedDurationMinutes?: number;
  suggestedDaypart?: PlanningDaypart;
  suggestedTime?: string;
  /** Geographic relevance inputs, used by lib/relevance.ts. Absent for content types without a location. */
  destinationId?: string;
  latitude?: number;
  longitude?: number;
};

export type SeoFields = {
  seoTitle?: string;
  seoDescription?: string;
  socialImage?: string;
};

export type Destination = ContentCard & SeoFields & {
  type: "destination";
  country: string;
  latitude?: number;
  longitude?: number;
  whyGo: string;
  aroundTake?: string;
  bestFor?: string[];
  placeIds: string[];
  storyIds: string[];
  places?: ContentCard[];
  stories?: ContentCard[];
};

export type PlaceType = "course" | "stay" | "eat" | "drink" | "do" | "shop" | "culture";

export type GoodToKnow = {
  label: string;
  value: string;
};

export type MediaHotspot = { x: number; y: number };

/** Generic media item for the shared MediaGallery/MediaLightbox system (place galleries, story galleries, later destinations). */
export type MediaItem = {
  url: string;
  alt?: string;
  caption?: string;
  credit?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  /** Sanity hotspot (0-1 range), used as the tile grid's crop focal point. Never applied in fullscreen. */
  hotspot?: MediaHotspot;
};

/** @deprecated kept for the old stage/thumbnail gallery; the tile grid ignores it. */
export type PlaceMediaLayout = "auto" | "wide" | "portrait" | "full" | "detail";

export type PlaceMediaItem = MediaItem & {
  layout?: PlaceMediaLayout;
};

export type OperatorStatus = {
  source?: "around" | "operator";
  lastVerifiedAt?: string;
};

export type Place = ContentCard & SeoFields & {
  type: "place";
  destinationId: string;
  destination?: ContentCard;
  placeType: PlaceType;
  whyWeLikeIt: string;
  aroundTake?: string;
  goodToKnow?: GoodToKnow[];
  gallery?: PlaceMediaItem[];
  address?: string;
  website?: string;
  instagram?: string;
  latitude?: number;
  longitude?: number;
  /** Geographically + editorially relevant places, computed by lib/relevance.ts. */
  aroundIt?: ContentCard[];
  /** STAY only - nearby PLAY courses sorted by straight-line distance, for WHY IT WORKS FOR GOLF. Never invented drive times. */
  nearbyCourses?: (ContentCard & { distanceKm: number })[];

  /** WHY PLAY IT - independent AROUND editorial judgement, never operator-controlled. */
  theFeel?: string[];
  bestFor?: string[];
  aroundMoment?: string;
  knowBeforeYouGo?: string;

  /** PLAY utility / planning facts. Stable information only, never live pricing/availability. */
  holes?: number;
  par?: number;
  courseCharacter?: string;
  walkability?: string;
  cartAvailability?: string;
  practiceFacilities?: string[];
  guestPlay?: string;
  season?: string;

  /** Official operator info, structurally separate from editorial content. */
  bookingUrl?: string;
  bookingLabel?: string;
  operatorStatus?: OperatorStatus;

  /**
   * Commerce foundation only. Must never influence aroundSelected, priority,
   * WHY PLAY IT, or AROUND IT relevance - see sanity/schemaTypes/place.ts.
   */
  commercialPartner?: boolean;

  /** STAY utility facts. Stable information only, never live prices/availability or invented drive times. */
  stayCharacter?: string;
  accommodationTypes?: string[];
  roomSummary?: string;
  spaSummary?: string;
  foodSummary?: string;
  breakfastSummary?: string;
  parkingSummary?: string;
  dogPolicy?: string;
  checkIn?: string;
  checkOut?: string;
  openAllYear?: boolean;
  recommendedNightsMin?: number;
  recommendedNightsMax?: number;
  golfBaseWhy?: string;

  /**
   * Common trip-intelligence planning metadata (all Place types). Factual/planning
   * only - must never carry personalized/marketing claims like "good after golf";
   * that belongs to the future Trip Fit Engine, not this data model.
   */
  compatibleDayparts?: PlanningDaypart[];
  effortLevel?: EffortLevel;
  environment?: PlaceEnvironment;
  weatherSensitivity?: WeatherSensitivity;

  /** EAT/DRINK utility facts. No live menus, item prices or opening hours. */
  eatCharacter?: string;
  mealTypes?: string[];
  cuisine?: string[];
  priceLevel?: PriceLevel;
  reservationAdvice?: string;
  dietaryNotes?: string;
  setting?: string;

  /** DO/CULTURE/SHOP utility facts. Duration display only - suggestedDurationMinutes stays authoritative for planning. */
  experienceType?: string;
  experienceDurationLabel?: string;
  bookingAdvice?: string;
};

export type Person = ContentCard & {
  type: "person";
  role?: string;
  location?: string;
  bio?: unknown[];
  website?: string;
  instagram?: string;
};

export type Product = ContentCard & {
  type: "product";
  brand?: string;
  category?: string;
  whyItMatters?: string;
  url?: string;
};

export type StoryAuthor = {
  id: string;
  title: string;
  slug?: string;
  role?: string;
  image?: string;
};

export type Story = ContentCard & SeoFields & {
  type: "story";
  format?: string;
  deck: string;
  body: unknown[];
  author?: StoryAuthor;
  publishedAt?: string;
  readingTime?: number;
  relatedIds: string[];
  related?: ContentCard[];
};

export type AroundCollection = ContentCard & SeoFields & {
  type: "collection";
  itemIds: string[];
  items?: ContentCard[];
};
