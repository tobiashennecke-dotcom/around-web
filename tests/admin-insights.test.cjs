"use strict";

/** Admin Insights: aggregation of saves per destination, item and account. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

function loadTs(file) {
  const source = readFileSync(file, "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const mod = new Module(path.resolve(file));
  mod.filename = path.resolve(file);
  mod.paths = Module._nodeModulePaths(path.dirname(mod.filename));
  mod._compile(outputText, mod.filename);
  return mod.exports;
}

const { buildInsights } = loadTs("lib/admin/insights-aggregate.ts");
const save = (user_id, source_id, source_type, created_at, source_role = null) =>
  ({ user_id, source_id, source_type, source_role, title_snapshot: source_id.toUpperCase(), slug_snapshot: source_id, created_at });

const input = {
  saves: [
    save("u1", "soma", "destination", "2026-11-10T10:00:00Z"),
    save("u2", "soma", "destination", "2026-11-11T10:00:00Z"),
    save("u1", "cove", "place", "2026-11-12T10:00:00Z", "play"),
    save("u2", "mars", "story", "2026-11-12T11:00:00Z"),
    save("u2", "tobi", "person", "2026-01-01T11:00:00Z")
  ],
  trips: [{ id: "t1", user_id: "u1", created_at: "2026-11-12T10:00:00Z" }],
  accounts: [
    { id: "u1", email: "a@x.de", created_at: "2026-11-01T00:00:00Z", last_sign_in_at: null, provider: "email" },
    { id: "u2", email: "b@x.de", created_at: "2026-11-02T00:00:00Z", last_sign_in_at: null, provider: "google" },
    { id: "u3", email: "c@x.de", created_at: "2026-11-03T00:00:00Z", last_sign_in_at: null, provider: "email" }
  ],
  context: [
    { id: "cove", destinationIds: ["soma"] },
    { id: "mars", destinationIds: ["soma", "soma"] }
  ],
  destinations: [{ id: "soma", title: "Soma Bay", slug: "soma-bay" }],
  now: new Date("2026-11-13T12:00:00Z")
};

test("places and stories roll up into their destination, counted once per save", () => {
  const { destinations, unassignedSaves } = buildInsights(input);
  assert.equal(destinations.length, 1);
  assert.deepEqual(
    { ...destinations[0] },
    { id: "soma", title: "Soma Bay", slug: "soma-bay", total: 4, direct: 2, places: 1, stories: 1, accounts: 2 }
  );
  assert.equal(unassignedSaves, 1);
});

test("totals, account ranking and recent list", () => {
  const insights = buildInsights(input);
  assert.deepEqual(insights.totals, { accounts: 3, accountsWithSaves: 2, saves: 5, trips: 1, savesLast7Days: 4 });
  assert.equal(insights.accounts[0].email, "b@x.de");
  assert.equal(insights.accounts[0].saves, 3);
  assert.equal(insights.accounts[1].trips, 1);
  assert.equal(insights.accounts[2].saves, 0);
  assert.equal(insights.recent[0].title, "MARS");
  assert.equal(insights.recent[0].email, "b@x.de");
  assert.equal(insights.topPlaces[0].sourceRole, "play");
  assert.equal(insights.topOther[0].sourceType, "person");
});
