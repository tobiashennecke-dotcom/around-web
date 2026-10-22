"use strict";

/**
 * Story draft preview: drafts are only ever read with draft mode enabled AND
 * a viewer token. Normal visitors always get the published client.
 */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");

test("draft client requires both draft mode and SANITY_VIEWER_TOKEN", () => {
  const source = readFileSync("lib/sanity/read-client.ts", "utf8");
  assert.match(source, /if \(!sanity \|\| !process\.env\.SANITY_VIEWER_TOKEN\) return false;/);
  assert.match(source, /return \(await draftMode\(\)\)\.isEnabled;/);
  assert.match(source, /if \(await isDraftPreview\(\)\) \{\s*return sanity\.withConfig\(\{ token: process\.env\.SANITY_VIEWER_TOKEN, perspective: "drafts"/);
  assert.match(source, /return sanity;\s*\}\s*$/);
});

test("getStory reads through the draft-aware client, the published client stays default", () => {
  const content = readFileSync("lib/content.ts", "utf8");
  assert.match(content, /const client = \(await storyReadClient\(\)\) \|\| sanity;\s*const doc = await client\.fetch\(STORY_QUERY/);
  const client = readFileSync("lib/sanity/client.ts", "utf8");
  assert.match(client, /perspective: "published"/);
});

test("the Studio opens Stories in the preview at their real route", () => {
  const config = readFileSync("sanity.config.ts", "utf8");
  assert.match(config, /route: "\/stories\/:slug"/);
  assert.match(config, /href: `\/stories\/\$\{doc\.slug\}`/);
});
