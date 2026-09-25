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
