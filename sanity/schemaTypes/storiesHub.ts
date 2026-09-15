import { defineField, defineType } from "sanity";

/**
 * Singleton editorial control panel for /stories (deterministic id
 * around-stories-hub, enforced by the seed tool - Sanity itself doesn't
 * restrict document count for a normal document type, but only one instance
 * is ever created/read). Deliberately holds curation references only - no
 * Story title/deck/media is duplicated here; that stays on the Story
 * documents themselves.
 */
export const storiesHub = defineType({
  name: "storiesHub",
  title: "Stories Hub",
  type: "document",
  fields: [
    defineField({
      name: "editionLabel",
      title: "Edition label",
      type: "string",
      description: "e.g. AROUND / ISSUE 01 · SEPTEMBER 2026",
      validation: r => r.required()
    }),
    defineField({
      name: "intro",
      title: "Intro",
      type: "text",
      rows: 3,
      description: "Optional short editorial intro shown near the edition label."
    }),
    defineField({
      name: "leadStory",
      title: "Lead Story",
      type: "reference",
      to: [{ type: "story" }],
      description: "The single Story featured as EDITORIAL NOW's lead."
    }),
    defineField({
      name: "secondaryStories",
      title: "Secondary Stories",
      type: "array",
      of: [{ type: "reference", to: [{ type: "story" }] }],
      validation: r => r.max(2)
    }),
    defineField({
      name: "featuredDestinations",
      title: "Featured Destinations",
      type: "array",
      of: [{ type: "reference", to: [{ type: "destination" }] }],
      validation: r => r.max(4)
    })
  ],
  preview: {
    select: { title: "editionLabel" },
    prepare({ title }) {
      return { title: title || "Stories Hub" };
    }
  }
});
