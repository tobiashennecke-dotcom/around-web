import { defineField, defineType } from "sanity";

/**
 * Singleton editorial control panel for the /preview partner onepager
 * (docs handoff: AROUND_ONEPAGER_CLAUDE_HANDOFF.md), enforced by
 * sanity/structure.ts opening this exact document id directly - same
 * convention as homepageSettings/around-homepage. Structure mirrors the
 * onepager's actual sections 1:1 (see lib/partner-preview.ts, which maps
 * this document onto the same shape lib/preview-content.ts's local fallback
 * uses), not a generic page builder: sections themselves are fixed, only
 * the content and ordering *within* each section is editorial.
 *
 * Every field is optional and falls back to the local static config in
 * lib/preview-content.ts when empty - editors can fill in one field at a
 * time rather than needing to complete this document before anything shows.
 */

const REFERENCE_TYPES = [{ type: "destination" }, { type: "place" }, { type: "story" }, { type: "person" }, { type: "product" }];

function imageSubFields() {
  return [
    defineField({ name: "alt", title: "Alt text", type: "string", description: "Describe the image for accessibility and SEO." }),
    defineField({ name: "caption", title: "Caption", type: "string" }),
    defineField({ name: "credit", title: "Credit", type: "string" })
  ];
}

function imageField(name: string, title: string, description?: string) {
  return defineField({ name, title, type: "image", options: { hotspot: true }, description, fields: imageSubFields() });
}

function headlineLinesField(description?: string) {
  return defineField({
    name: "headlineLines",
    title: "Headline (one line per entry)",
    type: "array",
    of: [{ type: "string" }],
    validation: Rule => Rule.max(4),
    description
  });
}

function paragraphsField(name: string, title: string) {
  return defineField({ name, title, type: "array", of: [{ type: "text", rows: 2 }] });
}

/**
 * Reused across every card-like content slot (Product Journey steps, From
 * the Field cards, Around It anchor/connections, Save demo card): either
 * pick a published Destination/Place/Story/Person/Object and optionally
 * override its teaser copy or image, or skip the reference entirely and
 * enter everything manually. See lib/partner-preview.ts's resolveTeaser()
 * for the exact fallback order (override > referenced doc > local config).
 */
function editorialTeaserFields() {
  return [
    defineField({
      name: "reference",
      title: "Use existing content",
      type: "reference",
      to: REFERENCE_TYPES,
      description:
        "Pick a published Destination, Place, Story, Person or Object. Its title, teaser text and image are used unless overridden below."
    }),
    defineField({
      name: "titleOverride",
      title: "Title / Headline",
      type: "string",
      description: "Required if no existing content is selected above. Overrides the selected content's title otherwise.",
      validation: Rule =>
        Rule.custom((value, context) => {
          const parent = context.parent as { reference?: { _ref?: string } } | undefined;
          if (!parent?.reference?._ref && !value) return "Enter a title, or select existing content above.";
          return true;
        })
    }),
    defineField({ name: "kickerOverride", title: "Kicker / Category", type: "string" }),
    defineField({ name: "descriptionOverride", title: "Description", type: "text", rows: 2 }),
    defineField({
      name: "accent",
      title: "Accent color",
      type: "string",
      options: {
        list: [
          { title: "Acid Lime", value: "lime" },
          { title: "Blue", value: "blue" },
          { title: "Pink", value: "pink" }
        ]
      },
      description: "Leave empty to use the selected content's own color."
    }),
    imageField("image", "Image (override)", "Leave empty to use the selected content's own image, or set a placeholder label below."),
    defineField({
      name: "placeholderLabel",
      title: "Placeholder label (if no image yet)",
      type: "string",
      description: 'Shown in a tasteful placeholder box when no image is available anywhere. E.g. "Lisbon / Portugal". Never a stock photo.'
    })
  ];
}

export const partnerPreview = defineType({
  name: "partnerPreview",
  title: "Partner Preview",
  type: "document",
  groups: [
    { name: "hero", title: "Hero & Intro", default: true },
    { name: "product", title: "Product Journey" },
    { name: "editorial", title: "Editorial" },
    { name: "conversion", title: "Save, Universe & Partner" },
    { name: "contact", title: "Contact, Status & Footer" },
    { name: "seo", title: "SEO" }
  ],
  fields: [
    defineField({
      name: "seo",
      title: "SEO",
      type: "object",
      group: "seo",
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({ name: "title", title: "Page title", type: "string" }),
        defineField({ name: "description", title: "Meta description", type: "text", rows: 2 }),
        imageField("ogImage", "Social share image (Open Graph)"),
        defineField({
          name: "noindex",
          title: "Hide from search engines (noindex)",
          type: "boolean",
          initialValue: true,
          description: "Keep this on while AROUND is in private preview. Also excluded from robots.txt regardless of this setting."
        })
      ]
    }),

    defineField({
      name: "hero",
      title: "Hero",
      type: "object",
      group: "hero",
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
        headlineLinesField(),
        defineField({ name: "subline", title: "Subline", type: "string", description: "e.g. PLAY · STAY · EAT · DO" }),
        defineField({ name: "intro", title: "Intro text", type: "text", rows: 3 }),
        defineField({ name: "scrollCue", title: "Scroll cue", type: "string" }),
        imageField("desktopImage", "Desktop image", "Full-bleed hero image, LCP-critical - kept as a single hotspot-aware source with a responsive srcSet."),
        imageField("mobileImage", "Mobile image", "Optional. If empty, the desktop image is reused with a responsive mobile crop.")
      ]
    }),

    defineField({
      name: "intro",
      title: "This Is AROUND",
      type: "object",
      group: "hero",
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
        headlineLinesField(),
        paragraphsField("body", "Body paragraphs (one per entry)"),
        defineField({
          name: "chapters",
          title: "PLAY / STAY / EAT / DO chapters",
          type: "array",
          validation: Rule => Rule.max(6),
          of: [
            {
              type: "object",
              name: "chapter",
              fields: [
                defineField({
                  name: "key",
                  title: "Category",
                  type: "string",
                  options: {
                    list: [
                      { title: "PLAY", value: "PLAY" },
                      { title: "STAY", value: "STAY" },
                      { title: "EAT", value: "EAT" },
                      { title: "DO", value: "DO" }
                    ]
                  },
                  validation: Rule => Rule.required()
                }),
                defineField({ name: "label", title: "Label", type: "string" }),
                defineField({ name: "caption", title: "Caption", type: "string" }),
                imageField("image", "Image")
              ],
              preview: { select: { title: "label", subtitle: "caption", media: "image" } }
            }
          ]
        })
      ]
    }),

    defineField({
      name: "productJourney",
      title: "Product Journey",
      type: "object",
      group: "product",
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
        headlineLinesField(),
        defineField({ name: "closing", title: "Closing statement", type: "string", description: "e.g. DISCOVER → SAVE → GO" }),
        defineField({
          name: "steps",
          title: "Steps",
          type: "array",
          validation: Rule => Rule.max(8),
          of: [
            {
              type: "object",
              name: "step",
              fields: [
                defineField({ name: "label", title: "Step label", type: "string", description: "e.g. 01 · DISCOVER" }),
                defineField({ name: "copy", title: "Copy", type: "text", rows: 2 }),
                defineField({
                  name: "kind",
                  title: "Preview type",
                  type: "string",
                  options: {
                    list: [
                      { title: "Search / Discover UI", value: "discover" },
                      { title: "Content card", value: "card" },
                      { title: "Story teaser", value: "story" },
                      { title: "Save demo", value: "save" }
                    ]
                  },
                  initialValue: "card",
                  validation: Rule => Rule.required()
                }),
                defineField({
                  name: "filters",
                  title: "Filter pills",
                  type: "array",
                  of: [{ type: "string" }],
                  hidden: ({ parent }) => (parent as { kind?: string })?.kind !== "discover",
                  description: "Shown only for the Search / Discover preview type."
                }),
                defineField({
                  name: "item",
                  title: "Content",
                  type: "object",
                  hidden: ({ parent }) => (parent as { kind?: string })?.kind === "discover",
                  fields: editorialTeaserFields()
                })
              ],
              preview: { select: { title: "label", subtitle: "copy" } }
            }
          ]
        })
      ]
    }),

    defineField({
      name: "editorialPrinciples",
      title: "Not A Directory",
      type: "object",
      group: "editorial",
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
        headlineLinesField(),
        paragraphsField("intro", "Intro paragraphs"),
        defineField({
          name: "principles",
          title: "Principles",
          type: "array",
          validation: Rule => Rule.max(5),
          of: [
            {
              type: "object",
              name: "principle",
              fields: [
                defineField({ name: "number", title: "Number", type: "string", description: "e.g. 01" }),
                defineField({ name: "label", title: "Label", type: "string" }),
                defineField({ name: "headline", title: "Headline", type: "string" }),
                defineField({ name: "copy", title: "Copy", type: "text", rows: 2 })
              ],
              preview: { select: { title: "headline", subtitle: "label" } }
            }
          ]
        })
      ]
    }),

    defineField({
      name: "stories",
      title: "From The Field",
      type: "object",
      group: "editorial",
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
        headlineLinesField(),
        defineField({
          name: "cards",
          title: "Story cards",
          type: "array",
          validation: Rule => Rule.max(5),
          of: [
            {
              type: "object",
              name: "fieldStoryCard",
              fields: [
                defineField({
                  name: "role",
                  title: "Layout role",
                  type: "string",
                  options: { list: [{ title: "Lead (large)", value: "lead" }, { title: "Secondary", value: "secondary" }] },
                  initialValue: "secondary",
                  validation: Rule => Rule.required()
                }),
                ...editorialTeaserFields()
              ],
              preview: { select: { title: "titleOverride", subtitle: "role", media: "image" } }
            }
          ]
        })
      ]
    }),

    defineField({
      name: "aroundIt",
      title: "Around It",
      type: "object",
      group: "editorial",
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
        headlineLinesField(),
        defineField({ name: "body", title: "Body", type: "text", rows: 2 }),
        defineField({ name: "anchor", title: "Anchor place", type: "object", fields: editorialTeaserFields() }),
        defineField({
          name: "connections",
          title: "Connections",
          type: "array",
          validation: Rule => Rule.max(6),
          of: [
            {
              type: "object",
              name: "connection",
              fields: [
                defineField({ name: "role", title: "Relationship", type: "string", description: "e.g. STAY, EAT, STORY" }),
                defineField({ name: "teaser", title: "Content", type: "object", fields: editorialTeaserFields() })
              ],
              preview: { select: { title: "teaser.titleOverride", subtitle: "role" } }
            }
          ]
        })
      ]
    }),

    defineField({
      name: "saveDemo",
      title: "Save The Good Stuff",
      type: "object",
      group: "conversion",
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
        headlineLinesField(),
        paragraphsField("body", "Body paragraphs"),
        defineField({ name: "card", title: "Demo content", type: "object", fields: editorialTeaserFields() }),
        defineField({ name: "destinationLabel", title: "Destination label", type: "string", description: "e.g. Lisbon" }),
        defineField({ name: "baseSavedCount", title: "Starting saved count", type: "number", initialValue: 3 })
      ]
    }),

    defineField({
      name: "editorialUniverse",
      title: "Editorial Universe",
      type: "object",
      group: "conversion",
      options: { collapsible: true, collapsed: true },
      fields: [defineField({ name: "ticker", title: "Ticker text", type: "string" }), headlineLinesField()]
    }),

    defineField({
      name: "pr",
      title: "For PR & Destinations",
      type: "object",
      group: "conversion",
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
        headlineLinesField(),
        paragraphsField("body", "Body paragraphs"),
        defineField({ name: "topics", title: "Topics", type: "array", of: [{ type: "string" }], options: { layout: "tags" } }),
        defineField({ name: "subheading", title: "Subheading", type: "string" }),
        defineField({ name: "helpItems", title: "What helps us most", type: "array", of: [{ type: "string" }] }),
        defineField({ name: "independenceLine", title: "Editorial independence line", type: "text", rows: 2 })
      ]
    }),

    defineField({
      name: "contact",
      title: "Contact",
      type: "object",
      group: "contact",
      options: { collapsible: true, collapsed: false },
      fields: [
        headlineLinesField(),
        paragraphsField("body", "Body paragraphs"),
        defineField({ name: "person", title: "Person", type: "string" }),
        defineField({ name: "role", title: "Role", type: "string" }),
        defineField({ name: "email", title: "Contact email", type: "string", validation: Rule => Rule.email() }),
        defineField({ name: "ctaLabel", title: "CTA label", type: "string" })
      ]
    }),

    defineField({
      name: "status",
      title: "Private Preview Status",
      type: "object",
      group: "contact",
      options: { collapsible: true, collapsed: true },
      fields: [defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }), headlineLinesField(), paragraphsField("body", "Body paragraphs")]
    }),

    defineField({
      name: "footer",
      title: "Footer",
      type: "object",
      group: "contact",
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: "tagline", title: "Tagline", type: "string" }),
        defineField({ name: "instagramLabel", title: "Instagram label", type: "string" }),
        defineField({ name: "instagramHref", title: "Instagram URL", type: "url" }),
        defineField({ name: "closing", title: "Closing phrase", type: "string" })
      ]
    })
  ],
  preview: {
    prepare() {
      return { title: "Partner Preview" };
    }
  }
});
