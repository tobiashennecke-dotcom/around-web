export type ContentRole = "play" | "stay" | "eat" | "do";

export function normalizeContentRole(value?: string | null): ContentRole | undefined {
  const role = (value || "").trim().toLowerCase();
  if (role === "course" || role === "play") return "play";
  if (role === "stay") return "stay";
  if (role === "eat" || role === "drink") return "eat";
  if (role === "do" || role === "culture") return "do";
  return undefined;
}

export function contentTypeLabel(sourceType: string, sourceRole?: string | null) {
  if (sourceType === "destination") return "DESTINATION";
  if (sourceType === "place") return normalizeContentRole(sourceRole)?.toUpperCase() || "PLACE";
  if (sourceType === "story") return "STORY";
  if (sourceType === "person") return "PEOPLE";
  if (sourceType === "product" || sourceType === "object") return "OBJECT";
  if (sourceType === "collection") return "COLLECTION";
  return sourceType ? sourceType.toUpperCase() : "CONTENT";
}
