"use strict";

/** v1.27: guest save limit, analytics intake, profile validation. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

// Compile .ts on require so modules with relative TS imports load.
Module._extensions[".ts"] = function (mod, filename) {
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  });
  mod._compile(outputText, filename);
};
const load = file => require(path.resolve(file));

const { guestSaveDecision, GUEST_SAVE_LIMIT } = load("lib/account-gate.ts");
const { sanitizeAnalyticsPayload, isBot } = load("lib/analytics/sanitize.ts");
const { contentFromPath, ANALYTICS_EVENT_NAMES } = load("lib/analytics/events.ts");

test("guests keep five saves, get a hint before the last one and the login sheet after", () => {
  assert.equal(GUEST_SAVE_LIMIT, 5);
  assert.equal(guestSaveDecision(0, false), "add");
  assert.equal(guestSaveDecision(2, false), "add");
  assert.equal(guestSaveDecision(3, false), "add_with_hint");
  assert.equal(guestSaveDecision(4, false), "add");
  assert.equal(guestSaveDecision(5, false), "limit");
  assert.equal(guestSaveDecision(5, true), "remove");
});

test("anonymous events never carry a browser ID or an account", () => {
  const row = sanitizeAnalyticsPayload({ name: "content_saved", consent: "anonymous", anonId: "6f1c2b8e-1d2a-4c3b-9a8e-0f1e2d3c4b5a", sourceType: "place", sourceRole: "stay" }, "user-1");
  assert.equal(row.consent, "anonymous");
  assert.equal(row.anon_id, null);
  assert.equal(row.user_id, null);
  assert.equal(row.source_role, "stay");
});

test("full consent keeps the browser ID and links the account", () => {
  const row = sanitizeAnalyticsPayload({ name: "page_viewed", consent: "full", anonId: "6F1C2B8E-1D2A-4C3B-9A8E-0F1E2D3C4B5A", path: "/stories/x" }, "user-1");
  assert.equal(row.anon_id, "6f1c2b8e-1d2a-4c3b-9a8e-0f1e2d3c4b5a");
  assert.equal(row.user_id, "user-1");
  assert.equal(row.path, "/stories/x");
});

test("intake rejects unknown events and cleans junk", () => {
  assert.equal(sanitizeAnalyticsPayload({ name: "drop_table" }, null), null);
  assert.equal(sanitizeAnalyticsPayload(null, null), null);
  const row = sanitizeAnalyticsPayload({ name: "page_viewed", consent: "full", anonId: "nope", path: "https://evil", sourceType: "user", sourceRole: "spa", query: "x" }, null);
  assert.equal(row.anon_id, null);
  assert.equal(row.path, null);
  assert.equal(row.source_type, null);
  assert.equal(row.source_role, null);
  assert.equal(row.query, null, "search terms only on search events");
  const search = sanitizeAnalyticsPayload({ name: "search_performed", query: "  Soma Bay  ", sourceType: "product" }, null);
  assert.equal(search.query, "Soma Bay");
  assert.equal(search.source_type, "object");
});

test("bots are ignored", () => {
  assert.equal(isBot("Googlebot/2.1"), true);
  assert.equal(isBot(""), true);
  assert.equal(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)"), false);
});

test("content routes map to content views", () => {
  assert.deepEqual(contentFromPath("/stories/soma-bay"), { sourceType: "story", slug: "soma-bay" });
  assert.deepEqual(contentFromPath("/places/gut-steinbach/"), { sourceType: "place", slug: "gut-steinbach" });
  assert.equal(contentFromPath("/my-around/trips"), null);
  assert.equal(contentFromPath("/stories"), null);
});

test("event vocabulary matches the DB constraint", () => {
  const sql = readFileSync("supabase/migrations/20261113_profile_fun.sql", "utf8");
  for (const name of ANALYTICS_EVENT_NAMES) assert.ok(sql.includes(`'${name}'`), name);
});

test("profile values are validated against the vocabulary and the DB constraints", () => {
  const sql = readFileSync("supabase/migrations/20261113_profile_preferences.sql", "utf8")
    + readFileSync("supabase/migrations/20261113_profile_preferences_v2.sql", "utf8")
    + readFileSync("supabase/migrations/20261113_profile_preferences_v3.sql", "utf8")
    + readFileSync("supabase/migrations/20261113_profile_preferences_v4.sql", "utf8");
  const options = load("lib/profile/options.ts");
  const single = [options.HANDICAP_BAND, options.PLAY_FREQUENCY, options.TRIP_LENGTH, options.ORGANIZER_ROLE, options.GROUP_SIZE,
    options.ROUNDS_PER_TRIP, options.TRIPS_PER_YEAR, options.BUDGET_PER_NIGHT, options.BOOKING_CHANNEL, options.AGE_BAND];
  for (const list of single) {
    for (const option of list) assert.ok(sql.includes(`'${option.value}'`), option.value);
  }
  assert.deepEqual(options.pickKnown(["spa", "casino", "spa"], options.TRIP_EXTRAS), ["spa"]);
  assert.equal(options.pickOne("bogus", options.BUDGET_PER_NIGHT), null);
  assert.ok(options.TRAVEL_COMPANIONS.some(option => option.value === "toddlers"));
  assert.ok(options.ORGANIZER_ROLE.some(option => option.value === "captain_women"));
  const { organizerRoles } = options;
  assert.deepEqual(organizerRoles(["none", "captain_women", "club"]), ["captain_women", "club"]);
  assert.deepEqual(organizerRoles(["none"]), ["none"]);
});

test("fun profile: answers match the DB, memories and bag are cleaned", () => {
  const sql = readFileSync("supabase/migrations/20261113_profile_fun.sql", "utf8");
  const options = load("lib/profile/options.ts");
  for (const list of [options.PLAYER_TYPE, options.NEMESIS, options.TEE_TIME_PREFERENCE, options.WEATHER_TOLERANCE, options.COURSE_TRANSPORT, options.GAME_FORMAT, options.NINETEENTH_ORDER]) {
    for (const option of list) assert.ok(sql.includes(`'${option.value}'`), option.value);
  }
  assert.deepEqual(
    options.cleanMemories({ holeInOne: { course: " Kössen ", hole: "7", date: "2025-06-01", club: "Eisen 8" }, bestRound: { course: "" }, junk: 1 }),
    { holeInOne: { course: "Kössen", hole: 7, date: "2025-06-01", club: "Eisen 8" } }
  );
  assert.deepEqual(options.cleanMemories({ favoriteHole: { course: "X", hole: 99 } }), { favoriteHole: { course: "X" } });
  assert.deepEqual(options.cleanBag({ driver: "  ", ball: "Pro V1", extra: "x" }), { ball: "Pro V1" });
});

test("pass counters and badges", () => {
  const { passStats, computeBadges } = load("lib/profile/badges.ts");
  const marks = [
    { sourceId: "a", kind: "played", country: "Österreich", destinationId: "d1" },
    { sourceId: "b", kind: "played", country: "österreich ", destinationId: "d1" },
    { sourceId: "c", kind: "played", country: "Ägypten", destinationId: "d2" },
    { sourceId: "a", kind: "bucket" },
    { sourceId: "z", kind: "bucket" }
  ];
  assert.deepEqual(passStats(marks), { courses: 3, countries: 2, destinations: 2, bucketTotal: 2, bucketDone: 1 });
  const profile = { coursePreferences: ["links"], teeTimePreference: "first_tee_time", weatherTolerance: null, organizerRoles: ["captain_women"], memories: {}, playerType: null, nemesis: null, nineteenthOrder: null, golfMotto: "" };
  const earned = computeBadges({ profile, marks, tripCount: 0 }).filter(badge => badge.earned).map(badge => badge.id);
  assert.deepEqual(earned.sort(), ["captain", "early_bird", "first_stamp", "links_lover"]);
});

test("steckbrief text never runs off the card", () => {
  const { wrapText, nameLayout } = load("lib/profile/steckbrief.ts");
  assert.deepEqual(wrapText("Fairway ist auch nur eine Meinung", 20), ["Fairway ist auch nur", "eine Meinung"]);
  for (const line of wrapText("Donaudampfschifffahrtsgesellschaftskapitän", 12)) assert.ok(line.length <= 12, line);
  assert.equal(wrapText("eins zwei drei vier fünf sechs", 9, 2).length, 2);
  assert.ok(wrapText("eins zwei drei vier fünf sechs", 9, 2)[1].endsWith("…"));
  assert.equal(nameLayout("Tobi").size, 150);
  const long = nameLayout("Maximilian Alexander von Hohenzollern-Sigmaringen der Dritte und noch viel mehr Namen");
  assert.ok(long.lines.length <= 3);
  assert.ok(long.size < 100);
});

test("Für dich: profile answers meet place tags, with readable reasons", () => {
  const { scoreFit, isRecommendation, hasFitSignals, personalizeOrder } = load("lib/personalization/score.ts");
  const empty = { travelCompanions: [], organizerRoles: [], groupSize: null, tripPurposes: [], coursePreferences: [], handicapBand: null, tripExtras: [], budgetPerNight: null, interests: [] };
  assert.equal(hasFitSignals(empty), false);
  const family = { ...empty, travelCompanions: ["partner_golfs", "toddlers"], tripExtras: ["spa", "hiking"], budgetPerNight: "150_300" };
  const hotel = { id: "h", type: "place", placeType: "stay", suitability: ["kids_friendly", "kids_care"], activitiesNearby: ["spa", "nightlife"], stayPriceBand: "150_300" };
  const fit = scoreFit(hotel, family);
  assert.ok(isRecommendation(fit));
  assert.deepEqual(fit.reasons, ["Kinderbetreuung", "Passt zu deinem Budget", "Spa"]);
  const luxury = { ...hotel, id: "l", suitability: [], activitiesNearby: [], stayPriceBand: "over_500" };
  assert.equal(isRecommendation(scoreFit(luxury, family)), false);
  const captain = { ...empty, organizerRoles: ["captain_women"] };
  assert.deepEqual(scoreFit({ id: "c", type: "place", placeType: "course", suitability: ["groups"] }, captain).reasons, ["Für Gruppen & Mannschaften"]);
  // Only interest/selection bonuses are not a recommendation.
  assert.equal(isRecommendation(scoreFit({ id: "x", type: "place", placeType: "course", aroundSelected: true }, { ...empty, interests: ["play"] })), false);
  const order = personalizeOrder([{ id: "a", type: "place" }, { id: "b", type: "place" }, hotel], family).map(item => item.id);
  assert.equal(order[0], "h");
});
