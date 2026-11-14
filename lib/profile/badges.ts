/**
 * Abzeichen are computed, never stored: they follow from the profile, the
 * AROUND Pass and trips. Pure, so it can be tested and reused on the
 * profile, the Pass page and the shareable Steckbrief.
 */

export type BadgeInput = {
  profile: {
    coursePreferences: string[];
    teeTimePreference: string | null;
    weatherTolerance: string | null;
    organizerRoles: string[];
    memories: { holeInOne?: { course?: string } };
    playerType: string | null;
    nemesis: string | null;
    nineteenthOrder: string | null;
    golfMotto: string;
  };
  marks: { sourceId: string; kind: "played" | "bucket"; country?: string; destinationId?: string }[];
  tripCount: number;
};

export type Badge = { id: string; label: string; description: string; earned: boolean };

export function passStats(marks: BadgeInput["marks"]) {
  const played = marks.filter(mark => mark.kind === "played");
  const playedIds = new Set(played.map(mark => mark.sourceId));
  const bucket = marks.filter(mark => mark.kind === "bucket");
  return {
    courses: playedIds.size,
    countries: new Set(played.map(mark => mark.country?.trim().toLowerCase()).filter(Boolean)).size,
    destinations: new Set(played.map(mark => mark.destinationId).filter(Boolean)).size,
    bucketTotal: bucket.length,
    bucketDone: bucket.filter(mark => playedIds.has(mark.sourceId)).length
  };
}

export function computeBadges({ profile, marks, tripCount }: BadgeInput): Badge[] {
  const stats = passStats(marks);
  const steckbriefDone = Boolean(profile.playerType && profile.nemesis && profile.nineteenthOrder && profile.golfMotto.trim());
  return [
    { id: "first_trip", label: "Erster Trip", description: "Den ersten Trip in AROUND geplant.", earned: tripCount >= 1 },
    { id: "first_stamp", label: "Erster Stempel", description: "Den ersten Platz in den AROUND Pass gestempelt.", earned: stats.courses >= 1 },
    { id: "ten_courses", label: "Zehn Plätze", description: "Zehn Plätze im AROUND Pass.", earned: stats.courses >= 10 },
    { id: "five_countries", label: "Fünf Länder", description: "In fünf Ländern gespielt.", earned: stats.countries >= 5 },
    { id: "bucket_hunter", label: "Bucket-List-Jäger", description: "Drei Plätze von der Bucket List gespielt.", earned: stats.bucketDone >= 3 },
    { id: "links_lover", label: "Links-Liebhaber", description: "Links steht ganz oben.", earned: profile.coursePreferences.includes("links") },
    { id: "early_bird", label: "Frühstarter", description: "Am liebsten die erste Startzeit.", earned: profile.teeTimePreference === "first_tee_time" },
    { id: "winter_golfer", label: "Wintergolfer", description: "Spielt bei jedem Wetter.", earned: profile.weatherTolerance === "always" },
    { id: "captain", label: "Captain", description: "Organisiert Reisen für eine Mannschaft.", earned: profile.organizerRoles.some(role => role.startsWith("captain_")) },
    { id: "hole_in_one", label: "Hole-in-One-Club", description: "Einmal eingelocht mit einem Schlag.", earned: Boolean(profile.memories.holeInOne?.course) },
    { id: "steckbrief", label: "Steckbrief komplett", description: "Spielertyp, Nemesis, Order und Motto ausgefüllt.", earned: steckbriefDone }
  ];
}
