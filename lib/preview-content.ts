import type { RawSanityImage } from "@/lib/homepage-hero";

/**
 * Shared content contract for the /preview partner onepager (see docs
 * handoff: AROUND_ONEPAGER_CLAUDE_HANDOFF.md). `previewContent` below is the
 * local, always-available fallback/initial dataset — product entities it
 * references (Lisbon, Oitavos Dunes, Prado, Reit im Winkl…) match the real
 * slugs in lib/sample-content.ts and the Sanity Bayern seed tools, nothing
 * here is invented. Assets that don't exist in the repo are marked with an
 * explicit `assetNeeded` id instead of a stock substitute (see
 * components/preview/PreviewMedia.tsx).
 *
 * lib/partner-preview.ts's getPartnerPreview() merges the editorial
 * `partnerPreview` Sanity singleton over this shape field-by-field, so
 * Sanity becomes the authoritative source once populated while this file
 * stays a safe, typed fallback — never a second competing content source.
 * Every exported type here is the contract both sides must conform to.
 */

export type PreviewImage = { src: string; alt: string };
export type PreviewPlaceholder = { assetNeeded: string; label: string };
export type PreviewMedia = PreviewImage | PreviewPlaceholder;

export type Accent = "lime" | "blue" | "pink";

/** A resolved, ready-to-render content card: PreviewCard's exact prop shape. */
export type ResolvedCard = {
  stamp: string;
  kicker: string;
  title: string;
  description?: string;
  accent: Accent;
  media?: PreviewMedia;
};

export type Chapter = { key: string; label: string; caption: string; media: PreviewMedia };

export type JourneyStep =
  | { label: string; copy: string; kind: "discover"; filters: string[] }
  | { label: string; copy: string; kind: "card" | "save"; card: ResolvedCard }
  | { label: string; copy: string; kind: "story"; story: { kicker: string; title: string; deck: string; media?: PreviewMedia } };

export type Principle = { number: string; label: string; headline: string; copy: string };

export type FieldStoryCard = { role: "lead" | "secondary"; category: string; title: string; media: PreviewMedia; accent: Accent };

export type AroundItConnection = { role: string; title: string; note: string; accent: Accent };

export type PartnerPreviewContent = {
  seo: { title: string; description: string; ogImage: string; noindex: boolean };
  hero: {
    eyebrow: string;
    headlineLines: string[];
    subline: string;
    intro: string;
    scrollCue: string;
    /** Local fallback image, used whenever desktopRaw is absent. */
    media: PreviewMedia;
    /** Raw Sanity image refs for the responsive, hotspot-aware <picture> — null unless Sanity provides one. */
    desktopRaw: RawSanityImage | null;
    mobileRaw: RawSanityImage | null;
  };
  intro: { eyebrow: string; headlineLines: string[]; body: string[]; chapters: Chapter[] };
  productJourney: { eyebrow: string; headlineLines: string[]; closing: string; steps: JourneyStep[] };
  editorialPrinciples: { eyebrow: string; headlineLines: string[]; intro: string[]; principles: Principle[] };
  stories: { eyebrow: string; headlineLines: string[]; cards: FieldStoryCard[] };
  aroundIt: { eyebrow: string; headlineLines: string[]; body: string; anchor: ResolvedCard; connections: AroundItConnection[] };
  saveDemo: {
    eyebrow: string;
    headlineLines: string[];
    body: string[];
    card: ResolvedCard;
    destinationLabel: string;
    baseSavedCount: number;
  };
  editorialUniverse: { ticker: string; headlineLines: string[] };
  pr: {
    eyebrow: string;
    headlineLines: string[];
    body: string[];
    topics: string[];
    subheading: string;
    helpItems: string[];
    independenceLine: string;
  };
  contact: { headlineLines: string[]; body: string[]; person: string; role: string; email: string; ctaLabel: string };
  status: { eyebrow: string; headlineLines: string[]; body: string[] };
  footer: { tagline: string; instagram: { label: string; href: string }; closing: string };
};

export const previewContent: PartnerPreviewContent = {
  seo: {
    title: "AROUND — Golf is where the journey starts.",
    description:
      "A private preview of AROUND — an independent editorial platform for golf, travel and the places worth going for.",
    ogImage: "/around-seed/bayern/golfclub-reit-im-winkl-hero.webp",
    noindex: true
  },

  hero: {
    eyebrow: "AROUND · PRIVATE PREVIEW",
    headlineLines: ["GOLF IS WHERE", "THE JOURNEY STARTS."],
    subline: "PLAY · STAY · EAT · DO",
    intro: "Independent editorial discovery for people who travel with golf — not just for golf.",
    scrollCue: "SCROLL TO DISCOVER",
    media: {
      src: "/around-seed/bayern/golfclub-reit-im-winkl-hero.webp",
      alt: "Golf course at Reit im Winkl, mountains behind the fairway"
    },
    desktopRaw: null,
    mobileRaw: null
  },

  intro: {
    eyebrow: "THIS IS AROUND",
    headlineLines: ["THE ROUND IS ONLY", "THE BEGINNING."],
    body: [
      "AROUND is an independent editorial platform for golf, travel and the places worth going for.",
      "We start with golf. Then we look around.",
      "The course. The hotel worth staying another night for. The restaurant you almost would have missed. The people shaping a place. The road there. The morning after.",
      "Because a great golf trip has never been only about golf."
    ],
    chapters: [
      {
        key: "PLAY",
        label: "PLAY",
        caption: "Golfclub Reit im Winkl-Kössen",
        media: { src: "/around-seed/bayern/golfclub-reit-im-winkl-wide.jpg", alt: "Fairway at Golfclub Reit im Winkl-Kössen" }
      },
      {
        key: "STAY",
        label: "STAY",
        caption: "Gut Steinbach Hotel & Chalets",
        media: { src: "/around-seed/bayern/gut-steinbach-chalets.webp", alt: "Chalets at Gut Steinbach Hotel" }
      },
      {
        key: "EAT",
        label: "EAT",
        caption: "Restaurant HEIMAT",
        media: { src: "/around-seed/bayern/restaurant-heimat.jpg", alt: "Interior of Restaurant HEIMAT at Gut Steinbach" }
      },
      {
        key: "DO",
        label: "DO",
        caption: "Grenzübergang, Tee 18",
        media: {
          src: "/around-seed/bayern/grenzuebergang-tee18.jpg",
          alt: "Border crossing at the 18th tee between Germany and Austria"
        }
      }
    ]
  },

  productJourney: {
    eyebrow: "THE PRODUCT",
    headlineLines: ["ONE PLACE LEADS", "TO ANOTHER."],
    closing: "DISCOVER → SAVE → GO",
    steps: [
      {
        label: "01 · DISCOVER",
        copy: "Find destinations, stories and places worth the trip.",
        kind: "discover",
        filters: ["PLAY", "STAY", "EAT", "DO", "STORIES"]
      },
      {
        label: "02 · DESTINATION",
        copy: "Understand a place beyond a list of golf courses.",
        kind: "card",
        card: {
          stamp: "DESTINATION",
          kicker: "Portugal / 38.7223° N",
          title: "Lisbon",
          description: "Atlantic golf. City nights. Food worth staying for.",
          accent: "lime"
        }
      },
      {
        label: "03 · PLACE",
        copy: "Know why a course, hotel or restaurant deserves your time.",
        kind: "card",
        card: {
          stamp: "PLAY",
          kicker: "AROUND Selected / Cascais",
          title: "Oitavos Dunes",
          description: "Golf zwischen Dünen, Pinien und Atlantik.",
          accent: "lime"
        }
      },
      {
        label: "04 · STORY",
        copy: "Go deeper through people, experiences and local perspective.",
        kind: "story",
        story: {
          kicker: "WORTH THE TRIP",
          title: "Warum Lissabon mehr ist als Golf.",
          deck: "Die interessantesten Golfreisen beginnen dort, wo der Platz nicht mehr der einzige Programmpunkt ist."
        }
      },
      {
        label: "05 · SAVE",
        copy: "Keep what matters and turn discovery into your next trip.",
        kind: "save",
        card: {
          stamp: "PLAY",
          kicker: "AROUND Selected / Cascais",
          title: "Oitavos Dunes",
          description: "Golf zwischen Dünen, Pinien und Atlantik.",
          accent: "lime"
        }
      }
    ]
  },

  editorialPrinciples: {
    eyebrow: "NOT A DIRECTORY",
    headlineLines: ["NOT EVERYTHING", "MAKES THE CUT."],
    intro: ["AROUND isn't built to catalogue everything.", "It's built to find what is worth knowing."],
    principles: [
      {
        number: "01",
        label: "LOCAL KNOWLEDGE",
        headline: "The things you won't find in the brochure.",
        copy: "People, recommendations and details that give a destination its character."
      },
      {
        number: "02",
        label: "EDITORIAL SELECTION",
        headline: "Relevance before coverage.",
        copy: "Stories and places are selected because they add something to the journey — not simply because they exist."
      },
      {
        number: "03",
        label: "FIRST-HAND PERSPECTIVE",
        headline: "Whenever possible, we go there.",
        copy: "We play. We stay. We talk to people. And we look beyond the obvious."
      }
    ]
  },

  stories: {
    eyebrow: "FROM THE FIELD",
    headlineLines: ["STORIES START", "ON THE GROUND."],
    cards: [
      {
        role: "lead",
        category: "DESTINATION · PORTUGAL",
        title: "Atlantic golf. City energy. And plenty worth stopping for in between.",
        media: { assetNeeded: "lisbon-portugal-story", label: "Lisbon / Portugal" },
        accent: "lime"
      },
      {
        role: "secondary",
        category: "BAVARIA · GOLF & TRAVEL",
        title: "Heimatrefugium und Zwei-Länder-Runde.",
        media: { src: "/around-seed/bayern/gut-steinbach-aerial.jpg", alt: "Aerial view of Gut Steinbach estate, Reit im Winkl" },
        accent: "blue"
      },
      {
        role: "secondary",
        category: "FIELD NOTES",
        title: "A golf day between fairways, mountains and the Allgäu way of life.",
        media: { assetNeeded: "allgau-field-notes", label: "Allgäu" },
        accent: "pink"
      }
    ]
  },

  aroundIt: {
    eyebrow: "AROUND IT",
    headlineLines: ["THE BEST PLACE", "MIGHT BE FIVE MINUTES AWAY."],
    body: "Every place is connected to what surrounds it. AROUND turns individual recommendations into a journey.",
    anchor: { stamp: "PLAY", kicker: "AROUND Selected / Cascais", title: "Oitavos Dunes", accent: "lime" },
    connections: [
      { role: "STAY", title: "Lisbon Design Stay", note: "Urban, ruhig, nah genug am Abend.", accent: "lime" },
      { role: "EAT", title: "Prado", note: "Modernes Portugal ohne Folklore.", accent: "pink" },
      { role: "STORY", title: "Warum Lissabon mehr ist als Golf.", note: "WORTH THE TRIP", accent: "blue" }
    ]
  },

  saveDemo: {
    eyebrow: "BUILT FOR DISCOVERY",
    headlineLines: ["FIND IT.", "SAVE IT.", "GO THERE."],
    body: [
      "Inspiration shouldn't disappear when you close a tab.",
      "Save places, collect ideas and start turning the things you discover into your next journey."
    ],
    card: {
      stamp: "PLAY",
      kicker: "AROUND Selected / Cascais",
      title: "Oitavos Dunes",
      description: "Golf zwischen Dünen, Pinien und Atlantik.",
      accent: "lime"
    },
    destinationLabel: "Lisbon",
    baseSavedCount: 3
  },

  editorialUniverse: {
    ticker: "COURSES · HOTELS · FOOD · PEOPLE · CULTURE · DESIGN · GEAR · ROAD TRIPS · STORIES · EXPERIENCES ·",
    headlineLines: ["GOLF OPENS THE DOOR.", "WE LOOK THROUGH IT."]
  },

  pr: {
    eyebrow: "WORK WITH AROUND",
    headlineLines: ["GOT SOMETHING", "WE SHOULD KNOW ABOUT?"],
    body: [
      "We are building AROUND together with people who know their places best.",
      "PR teams, destinations, golf clubs, hotels, brands and local experts are welcome to share relevant stories, openings, ideas and first-hand knowledge."
    ],
    topics: ["DESTINATION", "GOLF", "STAY", "EAT", "DO", "PEOPLE", "OBJECTS"],
    subheading: "WHAT HELPS US MOST",
    helpItems: [
      "Press releases",
      "New openings",
      "Story leads",
      "Local knowledge",
      "Interview opportunities",
      "Research material",
      "Invitations"
    ],
    independenceLine: "Sending something doesn't guarantee coverage. Finding something interesting definitely gets our attention."
  },

  contact: {
    headlineLines: ["LET'S TALK."],
    body: [
      "AROUND is currently being built from Bavaria with a growing network of people, places and stories beyond it.",
      "If you're working on something that feels like AROUND, I'd like to hear about it."
    ],
    person: "Tobias Hennecke",
    role: "Founder & Editor",
    email: "tobias@henneckemedia.de",
    ctaLabel: "GET IN TOUCH →"
  },

  status: {
    eyebrow: "CURRENT STATUS · SEPTEMBER 2026",
    headlineLines: ["AROUND IS CURRENTLY", "IN PRIVATE PREVIEW."],
    body: [
      "The platform, first destinations and editorial formats are currently being developed and tested ahead of the public release.",
      "This page offers partners and PR teams an early look at what we're building."
    ]
  },

  footer: {
    tagline: "GOLF IS WHERE THE JOURNEY STARTS.",
    instagram: { label: "Instagram", href: "https://instagram.com/thisisaround" },
    closing: "SEE YOU AROUND."
  }
};

export function isPlaceholderMedia(media: PreviewMedia): media is PreviewPlaceholder {
  return "assetNeeded" in media;
}
