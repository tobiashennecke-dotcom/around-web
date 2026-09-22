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
const SINGLETON_TYPES = new Set(["homepageSettings", "partnerPreview"]);
const HOMEPAGE_SETTINGS_DOC_ID = "around-homepage";
const PARTNER_PREVIEW_DOC_ID = "around-partner-preview";

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
      S.divider(),
      ...S.documentTypeListItems().filter(item => !SINGLETON_TYPES.has(item.getId() ?? ""))
    ]);
