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
  const sql = readFileSync("supabase/migrations/20261113_analytics_events.sql", "utf8");
  for (const name of ANALYTICS_EVENT_NAMES) assert.ok(sql.includes(`'${name}'`), name);
});

test("profile values are validated against the vocabulary and the DB constraints", () => {
  const sql = readFileSync("supabase/migrations/20261113_profile_preferences.sql", "utf8")
    + readFileSync("supabase/migrations/20261113_profile_preferences_v2.sql", "utf8")
    + readFileSync("supabase/migrations/20261113_profile_preferences_v3.sql", "utf8");
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
});
