export type ContentType =
  | "destination"
  | "place"
  | "story"
  | "person"
  | "object"
  | "collection";

export type ContentCard = {
  id: string;
  type: ContentType;
  slug: string;
  title: string;
  kicker?: string;
  description: string;
  accent: "lime" | "blue" | "pink";
  image?: string;
};

export type Destination = ContentCard & {
  type: "destination";
  country: string;
  latitude?: number;
  longitude?: number;
  whyGo: string;
  placeIds: string[];
  storyIds: string[];
};

export type Place = ContentCard & {
  type: "place";
  destinationId: string;
  placeType: "course" | "stay" | "eat" | "do";
  whyWeLikeIt: string;
};

export type Story = ContentCard & {
  type: "story";
  deck: string;
  body: string[];
  relatedIds: string[];
};

export type AroundCollection = ContentCard & {
  type: "collection";
  itemIds: string[];
};
