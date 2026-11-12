import type { StructureResolver } from "sanity/structure";

/**
 * Document types that are singletons in Studio navigation: pinned as a
 * direct-edit item (no "create new" / list-of-documents view) rather than
 * shown via the default per-type document list. storiesHub is deliberately
 * NOT included here, since it is already a singleton by convention (a seed
 * tool enforces the single around-stories-hub id) and is left exactly
 * as-is, shown via the normal document-type list like every other content
 * type.
 */
const SINGLETON_TYPES = new Set(["homepageSettings", "partnerPreview", "contactSettings"]);
const HOMEPAGE_SETTINGS_DOC_ID = "around-homepage";
const PARTNER_PREVIEW_DOC_ID = "around-partner-preview";
const CONTACT_DOC_ID = "around-contact";

export const structure: StructureResolver = S =>
  S.list()
    .title("AROUND Editorial")
    .items([
      S.listItem()
        .title("Homepage")
        .id("homepageSettings")
        .child(S.document().schemaType("homepageSettings").documentId(HOMEPAGE_SETTINGS_DOC_ID).title("Homepage")),
      S.listItem()
        .title("Partner Preview")
        .id("partnerPreview")
        .child(S.document().schemaType("partnerPreview").documentId(PARTNER_PREVIEW_DOC_ID).title("Partner Preview")),
      S.listItem()
        .title("Kontakt zur Redaktion")
        .id("contactSettings")
        .child(S.document().schemaType("contactSettings").documentId(CONTACT_DOC_ID).title("Kontakt zur Redaktion")),
      S.listItem()
        .title("Themen & Schlagwörter")
        .id("topics")
        .child(
          S.list().title("Themen & Schlagwörter").items([
            S.listItem().title("Themen").id("topicThemes").child(
              S.documentList().title("Themen").schemaType("topic").filter('_type == "topic" && kind == "theme"')
                .defaultOrdering([{ field: "priority", direction: "desc" }])
            ),
            S.listItem().title("Schlagwörter").id("topicTags").child(
              S.documentList().title("Schlagwörter").schemaType("topic").filter('_type == "topic" && kind != "theme"')
                .defaultOrdering([{ field: "title", direction: "asc" }])
            )
          ])
        ),
      S.divider(),
      S.listItem()
        .title("Destinationen online")
        .id("destinationsOnline")
        .child(
          S.documentList()
            .title("Destinationen online")
            .schemaType("destination")
            .filter('_type == "destination" && coalesce(isOnline, true) == true')
        ),
      S.listItem()
        .title("Destinationen offline / in Vorbereitung")
        .id("destinationsOffline")
        .child(
          S.documentList()
            .title("Destinationen offline / in Vorbereitung")
            .schemaType("destination")
            .filter('_type == "destination" && isOnline == false')
        ),
      S.divider(),
      ...S.documentTypeListItems().filter(item => !SINGLETON_TYPES.has(item.getId() ?? "") && item.getId() !== "topic")
    ]);
