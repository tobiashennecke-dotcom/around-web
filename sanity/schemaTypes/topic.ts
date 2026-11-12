import { defineField, defineType } from "sanity";

/**
 * AROUND taxonomy: one type for both editorial entry points ("Themen", e.g.
 * Golf & Wein) and lightweight cross-links ("Schlagwörter", e.g. Linksgolf).
 * Content opts in via its own topics[] field, so meaning lives on the content,
 * not in the frontend. Nothing is public until "Im Frontend zeigen" is on -
 * hidden topics can be prepared and assigned long before they go live.
 */
export const topic = defineType({
  name: "topic",
  title: "Thema / Schlagwort",
  type: "document",
  fields: [
    defineField({
      name: "kind", title: "Art", type: "string", initialValue: "tag",
      options: { list: [
        { title: "Thema (eigener Einstieg mit Seite und Intro)", value: "theme" },
        { title: "Schlagwort (Querverbindung)", value: "tag" }
      ], layout: "radio" },
      validation: r => r.required()
    }),
    defineField({
      name: "isVisible", title: "Im Frontend zeigen", type: "boolean", initialValue: false,
      description: "Aus = nur im CMS. Zuordnungen bleiben erhalten, die Seite /themen/… ist nicht erreichbar und nirgends verlinkt."
    }),
    defineField({ name: "title", title: "Titel", type: "string", validation: r => r.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title" }, validation: r => r.required() }),
    defineField({ name: "kicker", title: "Kicker", type: "string", description: "Kleine Zeile über dem Titel, z. B. GOLF & GENUSS." }),
    defineField({
      name: "intro", title: "Intro", type: "text", rows: 4,
      description: "Warum dieses Thema? 2–4 Sätze, mit Haltung. Bei Schlagwörtern optional.",
      hidden: ({ document }) => document?.kind !== "theme"
    }),
    defineField({
      name: "heroImage", title: "Bild", type: "image", options: { hotspot: true },
      hidden: ({ document }) => document?.kind !== "theme",
      fields: [
        defineField({ name: "alt", title: "Alt text", type: "string" }),
        defineField({ name: "credit", title: "Credit", type: "string" })
      ]
    }),
    defineField({ name: "priority", title: "Reihenfolge / Priority", type: "number", initialValue: 50, validation: r => r.min(0).max(100) })
  ],
  orderings: [{ title: "Priority", name: "priorityDesc", by: [{ field: "priority", direction: "desc" }] }],
  preview: {
    select: { title: "title", kind: "kind", visible: "isVisible", media: "heroImage" },
    prepare({ title, kind, visible, media }) {
      return {
        title,
        subtitle: `${kind === "theme" ? "Thema" : "Schlagwort"} · ${visible ? "sichtbar" : "versteckt"}`,
        media
      };
    }
  }
});

/** Shared field for every editorial content type that can carry topics. */
export const topicsField = (group: string) => defineField({
  name: "topics",
  title: "Themen & Schlagwörter",
  type: "array",
  group,
  of: [{ type: "reference", to: [{ type: "topic" }] }],
  validation: r => r.unique(),
  description: "Ordnet den Inhalt Themen-Einstiegen und Schlagwörtern zu. Versteckte Themen erscheinen nicht im Frontend."
});
