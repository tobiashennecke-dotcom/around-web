import { defineField, defineType } from "sanity";

/**
 * Singleton editorial control panel for the AROUND homepage hero (deterministic
 * id around-homepage, enforced by sanity/structure.ts which opens this exact
 * document id directly rather than a list - the same convention as
 * storiesHub/around-stories-hub). Deliberately scoped to hero art direction
 * only (image, focal point, overlay) - it never touches homepage content
 * selection, which stays driven entirely by HOME_QUERY in lib/sanity/queries.ts.
 */
export const homepageSettings = defineType({
  name: "homepageSettings",
  title: "Homepage",
  type: "document",
  fields: [
    defineField({
      name: "enableHeroImage",
      title: "Show hero image",
      type: "boolean",
      initialValue: false,
      description:
        "Show the selected hero image on the AROUND homepage. When disabled, the original ink-colored hero remains."
    }),
    defineField({
      name: "heroImage",
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
      title: "Overlay darkness (%)",
      type: "number",
      initialValue: 45,
      description:
        "Controls how dark the background image appears behind the headline, as a percentage (0-100). Suggested range: 25-75. Lower values show more of the photograph; higher values favour text legibility.",
      validation: r => r.min(0).max(100).integer().warning("Values outside 25-75 may hurt legibility or hide the photograph.")
    })
  ],
  preview: {
    select: { enabled: "enableHeroImage", media: "heroImage" },
    prepare({ enabled, media }) {
      return {
        title: "Homepage",
        subtitle: enabled ? "Hero image enabled" : "Hero image disabled",
        media
      };
    }
  }
});
