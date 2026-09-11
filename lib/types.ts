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

export type PlaceMediaLayout = "auto" | "wide" | "portrait" | "full" | "detail";

export type PlaceMediaItem = {
  url: string;
  alt?: string;
  caption?: string;
  credit?: string;
  layout?: PlaceMediaLayout;
  width?: number;
  height?: number;
  aspectRatio?: number;
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
