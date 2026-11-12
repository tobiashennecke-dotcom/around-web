"use strict";
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync, writeFileSync, mkdtempSync } = require("node:fs");
const { join } = require("node:path");
const { tmpdir } = require("node:os");

// Load the TS helper without a build step: strip the few type annotations.
function load() {
  const ts = readFileSync("lib/travel-facts.ts", "utf8");
  const ts2 = require("typescript");
  const js = ts2.transpileModule(ts, { compilerOptions: { module: ts2.ModuleKind.CommonJS, target: ts2.ScriptTarget.ES2022 } }).outputText;
  const dir = mkdtempSync(join(tmpdir(), "tf-"));
  const file = join(dir, "travel-facts.cjs");
  writeFileSync(file, js);
  return require(file);
}
const tf = load();

test("time difference follows DST on both sides", () => {
  const jan = new Date(Date.UTC(2027, 0, 20, 12));
  const jul = new Date(Date.UTC(2027, 6, 20, 12));
  assert.equal(tf.timeDifference("Indian/Mauritius", jan).label, "+3 Std.");
  assert.equal(tf.timeDifference("Indian/Mauritius", jul).label, "+2 Std.");
  assert.equal(tf.timeDifference("Indian/Mauritius", jan).note, "Winter +3 Std. · Sommer +2 Std.");
  assert.equal(tf.timeDifference("Europe/Lisbon", jan).label, "−1 Std.");
  assert.equal(tf.timeDifference("Europe/Lisbon", jan).note, undefined);
  assert.equal(tf.timeDifference("Europe/Vienna", jan).label, "Keine");
  assert.equal(tf.timeDifference("Africa/Johannesburg", jul).note, "Winter +1 Std. · Sommer gleich");
  assert.equal(tf.timeDifference(undefined), null);
  assert.equal(tf.timeDifference("Not/AZone"), null);
});

test("best months compress into wrapped ranges", () => {
  assert.equal(tf.formatMonthRanges([10, 11, 12, 1, 2, 3, 4]), "Okt – Apr");
  assert.equal(tf.formatMonthRanges([5, 6, 9, 10]), "Mai – Jun, Sep – Okt");
  assert.equal(tf.formatMonthRanges([7]), "Jul");
  assert.equal(tf.formatMonthRanges([1,2,3,4,5,6,7,8,9,10,11,12]), "Ganzjährig");
  assert.equal(tf.formatMonthRanges([]), null);
});

test("transfer minutes read naturally", () => {
  assert.equal(tf.formatTransfer(45), "ca. 45 Min.");
  assert.equal(tf.formatTransfer(60), "ca. 1 Std.");
  assert.equal(tf.formatTransfer(90), "ca. 1,5 Std.");
  assert.equal(tf.formatTransfer(0), null);
});
