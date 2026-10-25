"use strict";

/**
 * Destination Online/Offline switch: every public content query must apply
 * the visibility rule. This is a static guard on lib/sanity/queries.ts, so a
 * new query cannot silently show offline content.
 */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");

const source = readFileSync("lib/sanity/queries.ts", "utf8");

function queryBody(name) {
  const start = source.indexOf(`export const ${name} = defineQuery(\``);
  assert.notEqual(start, -1, `${name} not found`);
  const end = source.indexOf("`);", start);
  return source.slice(start, end);
}

const PUBLIC_QUERIES = {
  HOME_QUERY: "${CONTENT_ONLINE}",
  DISCOVER_QUERY: "${CONTENT_ONLINE}",
  SEARCH_QUERY: "${CONTENT_ONLINE}",
  DESTINATION_QUERY: "${DESTINATION_ONLINE}",
  PLACE_QUERY: "${PLACE_ONLINE}",
  PLACE_RELEVANCE_CANDIDATES_QUERY: "${PLACE_ONLINE}",
  PLACE_IDS_FOR_DESTINATION_QUERY: "${PLACE_ONLINE}",
  STORY_QUERY: "${STORY_ONLINE}",
  STORIES_RELATED_TO_IDS_QUERY: "${STORY_ONLINE}",
  TRIP_STORIES_RELATED_TO_IDS_QUERY: "${STORY_ONLINE}",
  STORIES_HUB_QUERY: "${STORY_ONLINE}",
  OFFLINE_CONTENT_IDS_QUERY: "${CONTENT_ONLINE}",
  SITEMAP_QUERY: "${CONTENT_ONLINE}"
};

for (const [name, fragment] of Object.entries(PUBLIC_QUERIES)) {
  test(`${name} applies the visibility rule`, () => {
    assert.ok(queryBody(name).includes(fragment), `${name} must include ${fragment}`);
  });
}

test("HOME_QUERY filters both featured and latest lists", () => {
  const body = queryBody("HOME_QUERY");
  assert.equal(body.split("${CONTENT_ONLINE}").length - 1, 2);
});

test("stories hub only lists online destinations", () => {
  const body = queryBody("STORIES_HUB_QUERY");
  assert.ok(body.includes("${DESTINATION_ONLINE}"));
  assert.ok(body.includes("featuredDestinations[coalesce(@->isOnline, true) == true]"));
});

test("card projections carry the hidden flag so nested references drop offline content", () => {
  assert.match(source, /const CARD_FIELDS = `\s*"aroundHidden": !\$\{CONTENT_ONLINE\}/);
  assert.match(source, /const STORY_CARD_FIELDS = `\s*"aroundHidden": !\$\{STORY_ONLINE\}/);
  const content = readFileSync("lib/content.ts", "utf8");
  assert.match(content, /if \(doc\.aroundHidden === true\) return null;/);
});

test("missing switch values count as online (backwards compatible)", () => {
  assert.match(source, /DESTINATION_ONLINE = `coalesce\(isOnline, true\) == true`/);
  assert.match(source, /coalesce\(visibility, "inherit"\) != "offline"/);
});

test("sample content never replaces real content when Sanity is configured", () => {
  const content = readFileSync("lib/content.ts", "utf8");
  const guards = content.match(/if \(sanity\) return null;/g) || [];
  assert.ok(guards.length >= 5, "detail fallbacks must be guarded");
});
