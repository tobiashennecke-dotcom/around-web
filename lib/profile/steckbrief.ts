import {
  COURSE_TRANSPORT, GAME_FORMAT, NEMESIS, NINETEENTH_ORDER, PLAYER_TYPE, TEE_TIME_PREFERENCE, WEATHER_TOLERANCE, HANDICAP_BAND,
  type Option
} from "./options";
import type { Profile } from "./profile";
import type { Badge } from "./badges";

function label(options: readonly Option[], value: string | null) {
  return value ? options.find(option => option.value === value)?.label || null : null;
}

export type SteckbriefData = {
  name: string;
  avatarUrl?: string | null;
  motto: string;
  facts: { label: string; value: string }[];
  stats: { courses: number; countries: number; bucketDone: number; bucketTotal: number };
  stamps: string[];
  badges: string[];
};

/** What the shareable card shows. Only the user's own answers, nothing about others. */
export function buildSteckbrief(profile: Profile, stats: SteckbriefData["stats"], stamps: string[], badges: Badge[]): SteckbriefData {
  const facts = [
    { label: "Spielertyp", value: label(PLAYER_TYPE, profile.playerType) },
    { label: "Nemesis", value: label(NEMESIS, profile.nemesis) },
    { label: "Order am 19. Loch", value: label(NINETEENTH_ORDER, profile.nineteenthOrder) },
    { label: "Startzeit", value: label(TEE_TIME_PREFERENCE, profile.teeTimePreference) },
    { label: "Wetter", value: label(WEATHER_TOLERANCE, profile.weatherTolerance) },
    { label: "Spielform", value: label(GAME_FORMAT, profile.gameFormat) },
    { label: "Unterwegs mit", value: label(COURSE_TRANSPORT, profile.courseTransport) },
    { label: "Handicap", value: label(HANDICAP_BAND, profile.handicapBand) },
    { label: "Schönster Platz", value: profile.memories.mostBeautifulCourse || null },
    { label: "Hole-in-One", value: profile.memories.holeInOne?.course ? `${profile.memories.holeInOne.course}${profile.memories.holeInOne.hole ? `, Loch ${profile.memories.holeInOne.hole}` : ""}` : null }
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value)).slice(0, 6);

  return {
    name: profile.displayName.trim() || "Golfer",
    motto: profile.golfMotto.trim(),
    facts,
    stats,
    stamps: stamps.slice(0, 6),
    badges: badges.filter(badge => badge.earned).map(badge => badge.label).slice(0, 6)
  };
}

/**
 * Greedy line wrap by character count. Words longer than a line are cut
 * with a hyphen, so nothing can run off the card. At most maxLines lines;
 * the last one ends with "…" if text was dropped.
 */
export function wrapText(text: string, maxChars: number, maxLines = Infinity): string[] {
  const width = Math.max(4, Math.floor(maxChars));
  const words = text.trim().split(/\s+/).filter(Boolean).flatMap(word => {
    if (word.length <= width) return [word];
    const parts: string[] = [];
    for (let i = 0; i < word.length; i += width - 1) {
      const rest = word.slice(i);
      parts.push(rest.length > width ? `${word.slice(i, i + width - 1)}-` : rest);
      if (rest.length <= width) break;
    }
    return parts;
  });
  const lines: string[] = [];
  for (const word of words) {
    const last = lines[lines.length - 1];
    if (last !== undefined && !last.endsWith("-") && (last + " " + word).length <= width) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  const tail = kept[maxLines - 1].replace(/-$/, "");
  kept[maxLines - 1] = (tail.length >= width ? tail.slice(0, width - 1) : tail) + "…";
  return kept;
}

/**
 * Largest name size that fits in at most three lines (two for the big
 * sizes). Prefers sizes where no word has to be cut; only very long single
 * words fall back to hyphenation at the smallest size.
 */
export function nameLayout(name: string, usableWidth = 920): { size: number; lines: string[] } {
  const upper = name.toUpperCase().trim();
  const sizes = [150, 120, 100, 84, 72, 62, 54];
  const longestWord = Math.max(0, ...upper.split(/\s+/).map(word => word.length));
  for (const size of sizes) {
    const perLine = usableWidth / (size * 0.55);
    if (longestWord > perLine) continue;
    const lines = wrapText(upper, perLine);
    if (lines.length <= (size >= 120 ? 2 : 3)) return { size, lines };
  }
  return { size: 54, lines: wrapText(upper, usableWidth / (54 * 0.62), 3) };
}
