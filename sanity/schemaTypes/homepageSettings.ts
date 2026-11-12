import { defineField, defineType } from "sanity";

/**
 * Singleton editorial control panel for the AROUND homepage (deterministic id
 * around-homepage, enforced by sanity/structure.ts which opens this exact
 * document id directly rather than a list - the same convention as
 * storiesHub/around-stories-hub).
 *
 * Two jobs:
 * - Startseite (curation): editors pick which content sits on which homepage
 *   position. Every slot is optional; any empty slot is filled automatically by
 *   HOME_QUERY's featured/priority/recency logic in lib/sanity/queries.ts.
 * - Hero: art direction only (image, focal point, overlay).
 */
const CONTENT_REF_TYPES = [
  { type: "destination" },
  { type: "place" },
  { type: "story" },
  { type: "person" },
  { type: "product" },
  { type: "collection" }
];

const FALLBACK_NOTE = "Leer lassen = Automatik (Featured, dann höchste Priority, dann zuletzt bearbeitet).";

export const homepageSettings = defineType({
  name: "homepageSettings",
  title: "Homepage",
  type: "document",
  groups: [
    { name: "curation", title: "Startseite", default: true },
    { name: "hero", title: "Hero" }
  ],
  fields: [
    defineField({
      name: "editLead",
      title: "THE EDIT – Position 1 (große Kachel)",
      type: "reference",
      group: "curation",
      to: CONTENT_REF_TYPES,
      description: `Der Aufmacher direkt unter dem Hero. ${FALLBACK_NOTE}`
    }),
    defineField({
      name: "editSupporting",
      title: "THE EDIT – Position 2 und 3",
      type: "array",
      group: "curation",
      of: [{ type: "reference", to: CONTENT_REF_TYPES }],
      validation: Rule => Rule.max(2).unique(),
      description: `Die zwei kleinen Kacheln neben dem Aufmacher, in dieser Reihenfolge. Fehlende Plätze füllt die Automatik.`
    }),
    defineField({
      name: "travelItems",
      title: "WORTH THE TRIP – Go somewhere.",
      type: "array",
      group: "curation",
      of: [{ type: "reference", to: [{ type: "destination" }, { type: "place" }] }],
      validation: Rule => Rule.max(3).unique(),
      description: `Bis zu 3 Destinationen oder Places, in dieser Reihenfolge. Fehlende Plätze füllt die Automatik.`
    }),
    defineField({
      name: "storyItems",
      title: "STORIES – Read beyond the round.",
      type: "array",
      group: "curation",
      of: [{ type: "reference", to: [{ type: "story" }] }],
      validation: Rule => Rule.max(3).unique(),
      description: `Bis zu 3 Stories. Die erste wird groß gezeigt. Fehlende Plätze füllt die Automatik.`
    }),
    defineField({
      name: "selectedItems",
      title: "AROUND SELECTED – Handverlesen.",
      type: "array",
      group: "curation",
      of: [{ type: "reference", to: CONTENT_REF_TYPES, options: { filter: "aroundSelected == true" } }],
      validation: Rule => Rule.max(3).unique(),
      description: `Bis zu 3 Inhalte mit AROUND-Selected-Siegel. Fehlende Plätze füllt die Automatik.`
    }),
    defineField({
      name: "enableHeroImage",
      group: "hero",
      title: "Show hero image",
      type: "boolean",
      initialValue: false,
      description:
        "Show the selected hero image on the AROUND homepage. When disabled, the original ink-colored hero remains."
    }),
    defineField({
      name: "heroImage",
      group: "hero",
      title: "Desktop hero image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          description: "Describe the image for accessibility and SEO."
        }),
        defineField({ name: "caption", title: "Caption", type: "string" }),
        defineField({ name: "credit", title: "Credit", type: "string" })
      ]
    }),
    defineField({
      name: "mobileHeroImage",
      group: "hero",
      title: "Mobile hero image",
      type: "image",
      options: { hotspot: true },
      description: "Optional. If absent, the desktop hero image is reused on mobile with a responsive crop.",
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          description: "Describe the image for accessibility and SEO."
        }),
        defineField({ name: "caption", title: "Caption", type: "string" }),
        defineField({ name: "credit", title: "Credit", type: "string" })
      ]
    }),
    defineField({
      name: "heroOverlay",
      group: "hero",
      title: "Overlay darkness (%)",
      type: "number",
      initialValue: 45,
      description:
        "Controls how dark the background image appears behind the headline, as a percentage (0-100). Suggested range: 25-75. Lower values show more of the photograph; higher values favour text legibility.",
      // Hard constraint (blocks publish): 0-100, whole number. Kept as its own
      // rule so it always errors, never just warns - a value outside this
      // range would otherwise reach the frontend, which clamps it defensively
      // (lib/homepage-hero.ts's clampOverlay), but the CMS itself should
      // refuse to store an unsafe value in the first place. 25-75 is a
      // separate, independent soft recommendation only.
      validation: Rule => [
        Rule.min(0).max(100).integer().error("Overlay darkness must be a whole number between 0 and 100."),
        Rule.custom((value: number | undefined) => {
          if (typeof value !== "number") return true;
          if (value < 25 || value > 75) return "Values outside 25-75 may hurt legibility or hide the photograph.";
          return true;
        }).warning()
      ]
    })
  ],
  preview: {
    select: { enabled: "enableHeroImage", media: "heroImage", lead: "editLead.title" },
    prepare({ enabled, media, lead }) {
      return {
        title: "Homepage",
        subtitle: `${lead ? `Aufmacher: ${lead}` : "Aufmacher: automatisch"} · ${enabled ? "Hero image enabled" : "Hero image disabled"}`,
        media
      };
    }
  }
});
