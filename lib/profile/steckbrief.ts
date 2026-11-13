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
