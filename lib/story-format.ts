/**
 * Single source of truth for Story format labels/descriptors/order. Used by
 * the Stories Hub (format index, format shelves, Story cards) so the
 * label/descriptor mapping never has to be duplicated across components.
 */

export const STORY_FORMAT_ORDER = [
  "worth-the-trip",
  "48-hours",
  "after-18",
  "course-correction",
  "local-knowledge",
  "people-to-know",
  "the-good-stuff",
  "next",
  "manifest",
  "story"
] as const;

export type StoryFormat = (typeof STORY_FORMAT_ORDER)[number];

const LABELS: Record<StoryFormat, string> = {
  "worth-the-trip": "WORTH THE TRIP",
  "48-hours": "48 HOURS",
  "after-18": "AFTER 18",
  "course-correction": "COURSE CORRECTION",
  "local-knowledge": "LOCAL KNOWLEDGE",
  "people-to-know": "PEOPLE TO KNOW",
  "the-good-stuff": "THE GOOD STUFF",
  next: "NEXT",
  manifest: "MANIFEST",
  story: "STORY"
};

const DESCRIPTORS: Record<StoryFormat, string> = {
  "worth-the-trip": "Places worth building a journey around.",
  "48-hours": "Short trips. No filler.",
  "after-18": "Where the day goes after the final putt.",
  "course-correction": "Golf architecture worth understanding.",
  "local-knowledge": "The things you only learn by knowing the place.",
  "people-to-know": "The people shaping where and how we play.",
  "the-good-stuff": "Food, design, hotels and things worth noticing.",
  next: "Places and ideas worth watching.",
  manifest: "How AROUND thinks about golf and travel.",
  story: "Stories that do not need a box."
};

function isKnownFormat(format?: string | null): format is StoryFormat {
  return Boolean(format) && Object.prototype.hasOwnProperty.call(LABELS, format as string);
}

export function storyFormatLabel(format?: string | null): string {
  if (isKnownFormat(format)) return LABELS[format];
  return format ? format.toUpperCase() : LABELS.story;
}

export function storyFormatDescriptor(format?: string | null): string | undefined {
  return isKnownFormat(format) ? DESCRIPTORS[format] : undefined;
}

/** Anchor id for a format's shelf, e.g. #worth-the-trip. */
export function storyFormatAnchor(format?: string | null): string {
  return isKnownFormat(format) ? format : "story";
}
