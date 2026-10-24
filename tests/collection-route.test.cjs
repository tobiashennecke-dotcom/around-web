"use strict";

/** Spec 16: Collection als Route. */
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

const route = loadTs("lib/collection-route.ts");
const place = (id) => ({ id, type: "place", slug: id, title: id, description: "", accent: "lime" });
const story = (id) => ({ id, type: "story", slug: id, title: id, description: "", accent: "pink" });

test("days keep their order, empty days disappear, a day shows at most six entries", () => {
  const days = route.normalizeCollectionDays([
    { key: "a", label: "Tag 1 · Radstadt", items: [story("s1"), place("p1")] },
    { key: "b", label: "Tag 2", items: [] },
    { key: "c", label: " ", items: [1, 2, 3, 4, 5, 6, 7].map(n => place(`x${n}`)) }
  ]);
  assert.deepEqual(days.map(d => d.key), ["a", "c"]);
  assert.equal(days[1].label, "Tag 3");
  assert.equal(days[1].items.length, 6);
  assert.deepEqual(route.normalizeCollectionDays(undefined), []);
});

test("route only when the format says so and a day is visible", () => {
  const days = route.normalizeCollectionDays([{ key: "a", label: "Tag 1", items: [place("p1")] }]);
  assert.equal(route.showsAsRoute("route", days), true);
  assert.equal(route.showsAsRoute("selection", days), false);
  assert.equal(route.showsAsRoute(undefined, days), false);
  assert.equal(route.showsAsRoute("route", []), false);
});

test("trip takes places only, in order, without duplicates", () => {
  const days = route.normalizeCollectionDays([
    { key: "a", label: "Tag 1", items: [story("s1"), place("p1"), place("p2")] },
    { key: "b", label: "Tag 2", items: [place("p2"), place("p3")] }
  ]);
  assert.deepEqual(route.routePlaces(days).map(p => p.id), ["p1", "p2", "p3"]);
});

test("query loads days with the visibility-aware card fields, schema stays additive", () => {
  const queries = readFileSync("lib/sanity/queries.ts", "utf8");
  assert.match(queries, /"days": days\[\]\{_key,label,title,text,"items": items\[\]->\{\$\{CARD_FIELDS\}\}\}/);
  const schema = readFileSync("sanity/schemaTypes/collection.ts", "utf8");
  for (const field of ['name:"format"', 'name:"intro"', 'name:"days"', 'name:"items"']) assert.ok(schema.includes(field), field);
  assert.match(schema, /initialValue:"selection"/);
});
