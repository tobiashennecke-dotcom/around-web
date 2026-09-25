"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const ts = require("typescript");

/** Load only intentionally dependency-free TS helpers for focused unit tests. */
function loadPureTs(path) {
  const source = readFileSync(path, "utf8");
  const js = ts.transpileModule(source, {
    fileName: path,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  assert.doesNotMatch(js, /\brequire\(/, path + " gained a runtime dependency");
  const module = { exports: {} };
  new Function("module", "exports", js)(module, module.exports);
  return module.exports;
}

const stories = loadPureTs("lib/story-access.ts");
const consent = loadPureTs("lib/communication/preferences.ts");
const events = loadPureTs("lib/brevo/event-policy.ts");
const conflicts = loadPureTs("lib/trip-conflict.ts");

test("missing or unknown story tier defaults to free", () => {
  for (const tier of [undefined, null, "", "Premium", "other"]) {
    assert.equal(stories.normalizeStoryAccessTier(tier), "free");
  }
  assert.equal(stories.normalizeStoryAccessTier("premium"), "premium");
});

test("free stories do not require entitlement", () => {
  assert.equal(stories.resolveStoryAccessState({ accessTier: "free", hasPremiumEntitlement: false }), "free");
});

test("premium content remains locked without entitlement", () => {
  assert.equal(stories.resolveStoryAccessState({ accessTier: "premium", hasPremiumEntitlement: false }), "premium-locked");
  assert.equal(stories.resolveStoryAccessState({ accessTier: "premium", hasPremiumEntitlement: true }), "premium-unlocked");
});

test("premium gate split keeps only the content before the first gate", () => {
  const first = { _type: "block", text: "public" };
  const paid = { _type: "block", text: "paid" };
  const result = stories.splitStoryBodyAtPremiumGate([first, { _type: "premiumGate" }, paid]);
  assert.deepEqual(result, { beforeGate: [first], afterGate: [paid], hasGate: true });
});

test("ungated premium body is distinguishable for fail-closed rendering", () => {
  const body = [{ _type: "block" }];
  assert.deepEqual(stories.splitStoryBodyAtPremiumGate(body), {
    beforeGate: body, afterGate: [], hasGate: false
  });
});

test("all marketing preferences default to false", () => {
  assert.deepEqual(Object.values(consent.DEFAULT_COMMUNICATION_PREFERENCES), [false, false, false, false]);
  assert.deepEqual(consent.communicationPreferencesFromRow(null), consent.DEFAULT_COMMUNICATION_PREFERENCES);
});

test("communication preference conversion preserves explicit booleans", () => {
  const input = { aroundJournal: true, myAroundUpdates: false, tripIntelligence: true, aroundDrops: false };
  assert.deepEqual(consent.communicationPreferencesFromRow(consent.communicationPreferencesToRow(input)), input);
});

test("untrusted consent updates require four real booleans", () => {
  assert.equal(consent.isValidCommunicationPreferences(null), false);
  assert.equal(consent.isValidCommunicationPreferences({ aroundJournal: true }), false);
  assert.equal(consent.isValidCommunicationPreferences({
    aroundJournal: "true", myAroundUpdates: false, tripIntelligence: false, aroundDrops: false
  }), false);
  assert.equal(consent.isValidCommunicationPreferences(consent.DEFAULT_COMMUNICATION_PREFERENCES), true);
});

test("only explicitly consent-gated lifecycle events are forwardable", () => {
  assert.equal(events.getBrevoEventPolicy("account_created"), null);
  assert.equal(events.getBrevoEventPolicy("content_viewed"), null);
  assert.equal(events.getBrevoEventPolicy("booking_clicked"), null);
  assert.deepEqual(events.getBrevoEventPolicy("trip_created"), {
    providerEventName: "around_trip_created", requiresPreference: "tripIntelligence"
  });
});

test("blocker priority reports time conflict first", () => {
  assert.equal(conflicts.formatBlockerLabel(["MISSING_DURATION", "TIME_CONFLICT"]), "OVERLAPS ANOTHER FIXED POINT");
  assert.equal(conflicts.formatBlockerLabel(["ALREADY_IN_TRIP"]), undefined);
});


const fit = loadPureTs("lib/trip-fit.ts");

test("Trip Fit never scores a geographically ineligible place", () => {
  const result = fit.evaluateTripFit({
    candidate: { id: "new", role: "play", suggestedDurationMinutes: 240, priority: 100, aroundSelected: true, featured: true },
    dayIndex: 0,
    tripItems: [],
    geo: { eligible: false }
  });
  assert.equal(result.eligible, false);
  assert.equal(result.score, 0);
  assert.deepEqual(result.blockerCodes, ["GEO_NOT_ELIGIBLE"]);
});

test("Trip Fit rejects an item already present in the trip", () => {
  const result = fit.evaluateTripFit({
    candidate: { id: "existing", suggestedDurationMinutes: 90 },
    dayIndex: 1,
    tripItems: [{ sourceId: "existing", dayIndex: 0 }],
    geo: { eligible: true }
  });
  assert.deepEqual(result.blockerCodes, ["ALREADY_IN_TRIP"]);
});

test("Trip Fit rejects missing duration", () => {
  const result = fit.evaluateTripFit({
    candidate: { id: "new", role: "do" },
    dayIndex: 0, tripItems: [], geo: { eligible: true }
  });
  assert.equal(result.eligible, false);
  assert.deepEqual(result.blockerCodes, ["MISSING_DURATION"]);
});

test("fixed candidates require a real supplied start time", () => {
  const result = fit.evaluateTripFit({
    candidate: { id: "new", role: "play", defaultPlanningMode: "fixed", suggestedDurationMinutes: 240 },
    dayIndex: 0, tripItems: [], geo: { eligible: true }
  });
  assert.equal(result.score, 0);
  assert.deepEqual(result.blockerCodes, ["FIXED_TIME_REQUIRED"]);
});

test("known fixed-time overlaps are a hard Trip Fit blocker", () => {
  const result = fit.evaluateTripFit({
    candidate: { id: "tee", role: "play", defaultPlanningMode: "fixed", suggestedDurationMinutes: 120 },
    candidateStartTime: "14:00", dayIndex: 0,
    tripItems: [{ sourceId: "dinner", role: "eat", dayIndex: 0, isFixed: true, fixedTime: "14:30", durationMinutes: 60 }],
    geo: { eligible: true }
  });
  assert.equal(result.eligible, false);
  assert.deepEqual(result.blockerCodes, ["TIME_CONFLICT"]);
});

test("an ordinary flexible stop with available time remains eligible", () => {
  const result = fit.evaluateTripFit({
    candidate: { id: "walk", role: "do", suggestedDurationMinutes: 90 },
    dayIndex: 0, tripItems: [], geo: { eligible: true }
  });
  assert.equal(result.eligible, true);
  assert.ok(result.score > 0);
  assert.deepEqual(result.blockerCodes, []);
});

test("after-golf recommendation needs an actual golf fixed point and geo context", () => {
  const result = fit.evaluateTripFit({
    candidate: { id: "spa", role: "do", suggestedDurationMinutes: 90, suggestedDaypart: "afternoon" },
    dayIndex: 0,
    tripItems: [{ sourceId: "golf", role: "play", dayIndex: 0, isFixed: true, fixedTime: "08:00", durationMinutes: 240 }],
    geo: { eligible: true, distanceToItemKm: { golf: 8 } }
  });
  assert.equal(result.eligible, true);
  assert.equal(result.recommendationType, "after_golf");
  assert.ok(result.reasonCodes.includes("AFTER_MORNING_GOLF"));
});
