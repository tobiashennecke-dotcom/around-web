export type ContentType =
  | "destination"
  | "place"
  | "story"
  | "person"
  | "product"
  | "collection";

export type Accent = "lime" | "blue" | "pink";

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

export type Place = ContentCard & SeoFields & {
  type: "place";
  destinationId: string;
  destination?: ContentCard;
  placeType: PlaceType;
  whyWeLikeIt: string;
  aroundTake?: string;
  goodToKnow?: GoodToKnow[];
  address?: string;
  website?: string;
  instagram?: string;
  latitude?: number;
  longitude?: number;
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
