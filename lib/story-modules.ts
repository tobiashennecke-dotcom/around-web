/**
 * Story 2.0 helpers shared by the Story page and its body renderer.
 * Pure functions, safe on the server.
 */
import { audioEmbed, type ParsedEmbed } from "@/lib/embeds";

export type StoryChapter = { id: string; title: string };

export type ReadAloudInfo = {
  embed: ParsedEmbed;
  title: string;
  speaker?: string;
  duration?: string;
  transcript?: string;
  alsoUrl?: string;
};

export function chapterId(key: unknown) {
  return `kapitel-${String(key || "").replace(/[^A-Za-z0-9_-]/g, "")}`;
}

export function blockText(block: any): string {
  if (!Array.isArray(block?.children)) return "";
  return block.children.map((child: any) => (typeof child?.text === "string" ? child.text : "")).join("").trim();
}

/** Chapters are the Story's H2 headings - no extra field for editors. */
export function getStoryChapters(body: unknown[]): StoryChapter[] {
  if (!Array.isArray(body)) return [];
  return body
    .filter((block: any) => block?._type === "block" && block?.style === "h2" && block?._key)
    .map((block: any) => ({ id: chapterId(block._key), title: blockText(block) }))
    .filter(chapter => chapter.title);
}

/** Chapter navigation only appears once a Story has real structure. */
export const MIN_CHAPTERS = 3;

export function getReadAloud(body: unknown[]): ReadAloudInfo | null {
  if (!Array.isArray(body)) return null;
  const block: any = body.find((item: any) => item?._type === "storyAudio" && item?.kind === "readAloud");
  if (!block) return null;
  const embed = audioEmbed(block.platform, block.url);
  if (!embed) return null;
  return {
    embed,
    title: block.title || "Vorlesefassung",
    speaker: block.speaker || undefined,
    duration: block.duration || undefined,
    transcript: block.transcript || undefined,
    alsoUrl: block.alsoUrl || undefined
  };
}

export type HoleStation = { name: string; distance: number; elevation?: number; text: string };

/** Keeps only well-formed stations, sorted by distance, for "Das Loch". */
export function normalizeHoleStations(raw: unknown, length: number): HoleStation[] {
  if (!Array.isArray(raw) || !(length > 0)) return [];
  return raw
    .filter((s: any) => typeof s?.distance === "number" && s.distance >= 0 && s.distance <= length && s?.name)
    .map((s: any) => ({
      name: String(s.name),
      distance: s.distance,
      elevation: typeof s.elevation === "number" ? s.elevation : undefined,
      text: typeof s.text === "string" ? s.text : ""
    }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Height profile for the line: y (0 = top, 1 = bottom) at each station.
 * Without at least two heights the line stays flat (y = 0.5).
 */
export function holeProfile(stations: HoleStation[]): number[] {
  const heights = stations.map(s => s.elevation).filter((h): h is number => typeof h === "number");
  if (heights.length < 2) return stations.map(() => 0.5);
  const max = Math.max(...heights);
  const min = Math.min(...heights);
  const span = max - min || 1;
  let last = stations.find(s => typeof s.elevation === "number")!.elevation as number;
  return stations.map(s => {
    if (typeof s.elevation === "number") last = s.elevation;
    return 0.12 + 0.76 * ((max - last) / span);
  });
}
