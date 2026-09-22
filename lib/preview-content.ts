/**
 * Central copy/data config for the /preview partner onepager (see
 * docs handoff: AROUND_ONEPAGER_CLAUDE_HANDOFF.md). Structural copy lives
 * here as typed config; product entities referenced below (Lisbon, Oitavos
 * Dunes, Prado, Reit im Winkl…) match the real slugs in lib/sample-content.ts
 * and the Sanity Bayern seed tools — nothing here is invented. Assets that
 * don't exist in the repo are marked with an explicit `assetNeeded` id
 * instead of a stock substitute (see components/preview/PreviewMedia.tsx).
 */

export type PreviewImage = { src: string; alt: string };
export type PreviewPlaceholder = { assetNeeded: string; label: string };
export type PreviewMedia = PreviewImage | PreviewPlaceholder;

export const previewContent = {
  seo: {
    title: "AROUND — Golf is where the journey starts.",
    description:
      "A private preview of AROUND — an independent editorial platform for golf, travel and the places worth going for.",
    ogImage: "/around-seed/bayern/golfclub-reit-im-winkl-hero.webp",
    noindex: false
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
    } as PreviewMedia
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
        media: {
          src: "/around-seed/bayern/golfclub-reit-im-winkl-wide.jpg",
          alt: "Fairway at Golfclub Reit im Winkl-Kössen"
        } as PreviewMedia
      },
      {
        key: "STAY",
        label: "STAY",
        caption: "Gut Steinbach Hotel & Chalets",
        media: {
          src: "/around-seed/bayern/gut-steinbach-chalets.webp",
          alt: "Chalets at Gut Steinbach Hotel"
        } as PreviewMedia
      },
      {
        key: "EAT",
        label: "EAT",
        caption: "Restaurant HEIMAT",
        media: {
          src: "/around-seed/bayern/restaurant-heimat.jpg",
          alt: "Interior of Restaurant HEIMAT at Gut Steinbach"
        } as PreviewMedia
      },
      {
        key: "DO",
        label: "DO",
        caption: "Grenzübergang, Tee 18",
        media: {
          src: "/around-seed/bayern/grenzuebergang-tee18.jpg",
          alt: "Border crossing at the 18th tee between Germany and Austria"
        } as PreviewMedia
      }
    ]
  },

  productJourney: {
    eyebrow: "THE PRODUCT",
    headlineLines: ["ONE PLACE LEADS", "TO ANOTHER."],
    closing: "DISCOVER → SAVE → GO",
    steps: [
      {
        key: "discover",
        label: "01 · DISCOVER",
        copy: "Find destinations, stories and places worth the trip.",
        kind: "discover" as const,
        filters: ["PLAY", "STAY", "EAT", "DO", "STORIES"]
      },
      {
        key: "destination",
        label: "02 · DESTINATION",
        copy: "Understand a place beyond a list of golf courses.",
        kind: "card" as const,
        card: {
          stamp: "DESTINATION",
          kicker: "Portugal / 38.7223° N",
          title: "Lisbon",
          description: "Atlantic golf. City nights. Food worth staying for.",
          accent: "lime" as const
        }
      },
      {
        key: "place",
        label: "03 · PLACE",
        copy: "Know why a course, hotel or restaurant deserves your time.",
        kind: "card" as const,
        card: {
          stamp: "PLAY",
          kicker: "AROUND Selected / Cascais",
          title: "Oitavos Dunes",
          description: "Golf zwischen Dünen, Pinien und Atlantik.",
          accent: "lime" as const
        }
      },
      {
        key: "story",
        label: "04 · STORY",
        copy: "Go deeper through people, experiences and local perspective.",
        kind: "story" as const,
        story: {
          kicker: "WORTH THE TRIP",
          title: "Warum Lissabon mehr ist als Golf.",
          deck: "Die interessantesten Golfreisen beginnen dort, wo der Platz nicht mehr der einzige Programmpunkt ist."
        }
      },
      {
        key: "save",
        label: "05 · SAVE",
        copy: "Keep what matters and turn discovery into your next trip.",
        kind: "save" as const,
        card: {
          stamp: "PLAY",
          kicker: "AROUND Selected / Cascais",
          title: "Oitavos Dunes",
          description: "Golf zwischen Dünen, Pinien und Atlantik.",
          accent: "lime" as const
        }
      }
    ]
  },

  editorialPrinciples: {
    eyebrow: "NOT A DIRECTORY",
    headlineLines: ["NOT EVERYTHING", "MAKES THE CUT."],
    intro: [
      "AROUND isn't built to catalogue everything.",
      "It's built to find what is worth knowing."
    ],
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
        key: "lisbon",
        role: "lead" as const,
        category: "DESTINATION · PORTUGAL",
        title: "Atlantic golf. City energy. And plenty worth stopping for in between.",
        media: { assetNeeded: "lisbon-portugal-story", label: "Lisbon / Portugal" } as PreviewMedia,
        accent: "lime" as const
      },
      {
        key: "bavaria",
        role: "secondary" as const,
        category: "BAVARIA · GOLF & TRAVEL",
        title: "Heimatrefugium und Zwei-Länder-Runde.",
        media: {
          src: "/around-seed/bayern/gut-steinbach-aerial.jpg",
          alt: "Aerial view of Gut Steinbach estate, Reit im Winkl"
        } as PreviewMedia,
        accent: "blue" as const
      },
      {
        key: "allgau",
        role: "secondary" as const,
        category: "FIELD NOTES",
        title: "A golf day between fairways, mountains and the Allgäu way of life.",
        media: { assetNeeded: "allgau-field-notes", label: "Allgäu" } as PreviewMedia,
        accent: "pink" as const
      }
    ]
  },

  aroundIt: {
    eyebrow: "AROUND IT",
    headlineLines: ["THE BEST PLACE", "MIGHT BE FIVE MINUTES AWAY."],
    body: "Every place is connected to what surrounds it. AROUND turns individual recommendations into a journey.",
    anchor: {
      stamp: "PLAY",
      kicker: "AROUND Selected / Cascais",
      title: "Oitavos Dunes",
      accent: "lime" as const
    },
    connections: [
      { role: "STAY", title: "Lisbon Design Stay", note: "Urban, ruhig, nah genug am Abend.", accent: "lime" as const },
      { role: "EAT", title: "Prado", note: "Modernes Portugal ohne Folklore.", accent: "pink" as const },
      { role: "STORY", title: "Warum Lissabon mehr ist als Golf.", note: "WORTH THE TRIP", accent: "blue" as const }
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
      accent: "lime" as const
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
