"use strict";

/**
 * Story 2.0 (spec 14): link recognition for external players and the
 * "Das Loch" helpers, plus static guards for privacy and visibility.
 */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

function loadTs(file, overrides = {}) {
  const source = readFileSync(file, "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const mod = new Module(path.resolve(file));
  mod.filename = path.resolve(file);
  mod.paths = Module._nodeModulePaths(path.dirname(mod.filename));
  const originalRequire = mod.require.bind(mod);
  mod.require = id => (id in overrides ? overrides[id] : originalRequire(id));
  mod._compile(outputText, mod.filename);
  return mod.exports;
}

const embeds = loadTs("lib/embeds.ts");
const modules = loadTs("lib/story-modules.ts", { "@/lib/embeds": embeds });

test("YouTube: share, watch, shorts and embed links", () => {
  assert.equal(embeds.parseYouTube("https://youtu.be/dQw4w9WgXcQ").id, "dQw4w9WgXcQ");
  assert.equal(embeds.parseYouTube("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=90").start, 90);
  assert.equal(embeds.parseYouTube("https://youtu.be/dQw4w9WgXcQ?t=1m30s").start, 90);
  assert.equal(embeds.parseYouTube("https://www.youtube.com/shorts/dQw4w9WgXcQ").id, "dQw4w9WgXcQ");
  assert.equal(embeds.parseYouTube("https://m.youtube.com/watch?v=dQw4w9WgXcQ").id, "dQw4w9WgXcQ");
  assert.equal(embeds.parseYouTube("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ").id, "dQw4w9WgXcQ");
  assert.equal(embeds.parseYouTube("https://vimeo.com/123456"), null);
  assert.equal(embeds.parseYouTube("https://youtube.com/watch?v=short"), null);
  assert.equal(embeds.parseYouTube("not a url"), null);
});

test("YouTube embeds use the privacy-enhanced domain", () => {
  const embed = embeds.videoEmbed("youtube", "https://youtu.be/dQw4w9WgXcQ?t=42");
  assert.match(embed.src, /^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?/);
  assert.match(embed.src, /start=42/);
  assert.equal(embed.provider, "YouTube");
});

test("Vimeo: public, unlisted and player links, always with dnt=1", () => {
  assert.deepEqual(embeds.parseVimeo("https://vimeo.com/76979871"), { id: "76979871", hash: undefined });
  assert.deepEqual(embeds.parseVimeo("https://vimeo.com/76979871/abc123def4"), { id: "76979871", hash: "abc123def4" });
  assert.deepEqual(embeds.parseVimeo("https://player.vimeo.com/video/76979871?h=abc123"), { id: "76979871", hash: "abc123" });
  assert.equal(embeds.parseVimeo("https://vimeo.com/channels/staffpicks/76979871").id, "76979871");
  assert.equal(embeds.parseVimeo("https://youtu.be/dQw4w9WgXcQ"), null);
  assert.match(embeds.videoEmbed("vimeo", "https://vimeo.com/76979871/abc123def4").src, /dnt=1.*h=abc123def4|h=abc123def4.*dnt=1/);
});

test("Spotify: episodes, shows and tracks incl. locale links", () => {
  const id = "4rOoJ6Egrf8K2IrywzwOMk";
  assert.deepEqual(embeds.parseSpotify(`https://open.spotify.com/episode/${id}?si=abc`), { kind: "episode", id });
  assert.deepEqual(embeds.parseSpotify(`https://open.spotify.com/intl-de/episode/${id}`), { kind: "episode", id });
  assert.deepEqual(embeds.parseSpotify(`https://open.spotify.com/show/${id}`), { kind: "show", id });
  assert.equal(embeds.parseSpotify(`https://open.spotify.com/user/${id}`), null);
  assert.equal(embeds.parseSpotify("https://spotify.com/episode/123"), null);
  const embed = embeds.audioEmbed("spotify", `https://open.spotify.com/episode/${id}`);
  assert.equal(embed.src, `https://open.spotify.com/embed/episode/${id}`);
  assert.equal(embed.height, 152);
});

test("Apple: podcast episodes and music, rewritten to the embed host", () => {
  const episode = embeds.audioEmbed("apple", "https://podcasts.apple.com/de/podcast/some-show/id1234567890?i=1000123456789");
  assert.equal(episode.src, "https://embed.podcasts.apple.com/de/podcast/some-show/id1234567890?i=1000123456789");
  assert.equal(episode.provider, "Apple Podcasts");
  assert.equal(episode.height, 175);
  const show = embeds.audioEmbed("apple", "https://podcasts.apple.com/de/podcast/some-show/id1234567890");
  assert.equal(show.height, 450);
  const album = embeds.audioEmbed("apple", "https://music.apple.com/de/album/some-album/1440857781");
  assert.equal(album.src, "https://embed.music.apple.com/de/album/some-album/1440857781");
  assert.equal(album.provider, "Apple Music");
  assert.equal(embeds.audioEmbed("apple", "https://apple.com/de/podcast/x/id1"), null);
  assert.equal(embeds.audioEmbed("spotify", "https://podcasts.apple.com/de/podcast/x/id1"), null);
});

test("chapters come from H2 headings only", () => {
  const body = [
    { _type: "block", _key: "a1", style: "h2", children: [{ text: "Die Gondel" }] },
    { _type: "block", _key: "a2", style: "normal", children: [{ text: "Text" }] },
    { _type: "block", _key: "a3", style: "h3", children: [{ text: "Unter" }] },
    { _type: "block", _key: "a4", style: "h2", children: [{ text: "Die 13" }] }
  ];
  assert.deepEqual(modules.getStoryChapters(body), [
    { id: "kapitel-a1", title: "Die Gondel" },
    { id: "kapitel-a4", title: "Die 13" }
  ]);
});

test("read-aloud is taken from the first valid readAloud audio block", () => {
  const body = [
    { _type: "storyAudio", kind: "feature", platform: "spotify", url: "https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk" },
    { _type: "storyAudio", kind: "readAloud", platform: "apple", url: "https://podcasts.apple.com/de/podcast/x/id123?i=456", title: "Vorgelesen" }
  ];
  const info = modules.getReadAloud(body);
  assert.equal(info.title, "Vorgelesen");
  assert.equal(info.embed.provider, "Apple Podcasts");
  assert.equal(modules.getReadAloud([{ _type: "storyAudio", kind: "readAloud", platform: "spotify", url: "https://example.com" }]), null);
});

test("hole stations are sorted, bounded and the profile follows the heights", () => {
  const stations = modules.normalizeHoleStations([
    { name: "Grün", distance: 380, text: "" },
    { name: "Abschlag", distance: 0, elevation: 996, text: "" },
    { name: "Landezone", distance: 230, elevation: 896, text: "" },
    { name: "Kaputt", distance: 999, text: "" }
  ], 380);
  assert.deepEqual(stations.map(s => s.name), ["Abschlag", "Landezone", "Grün"]);
  const profile = modules.holeProfile(stations);
  assert.ok(profile[0] < profile[1], "downhill: the landing zone sits lower than the tee");
  assert.equal(profile[1], profile[2], "green without height stays on the last known level");
  assert.deepEqual(modules.holeProfile(modules.normalizeHoleStations([{ name: "A", distance: 0 }, { name: "B", distance: 300 }], 300)), [0.5, 0.5]);
});

test("external players never load before a click", () => {
  const source = readFileSync("components/ExternalEmbed.tsx", "utf8");
  assert.match(source, /useState\(false\)/);
  for (const match of source.matchAll(/<iframe/g)) {
    const before = source.slice(Math.max(0, match.index - 60), match.index);
    assert.match(before, /loaded \? \(/, "every iframe must sit behind the loaded flag");
  }
  const dock = readFileSync("components/StoryReadAloud.tsx", "utf8");
  assert.match(dock, /\{loaded \? \(\s*<iframe/);
  const body = readFileSync("components/StoryBody.tsx", "utf8");
  assert.ok(!body.includes("<iframe"), "StoryBody must only use ExternalEmbed");
});

test("Das Loch respects the destination online switch", () => {
  const queries = readFileSync("lib/sanity/queries.ts", "utf8");
  assert.match(queries, /_type == "storyHoleLine" => \{\s*\.\.\.,\s*"place": place->\{\$\{CARD_FIELDS\}\}/);
  const content = readFileSync("lib/content.ts", "utf8");
  assert.match(content, /block\?\._type === "storyHoleLine" && !block\.place/);
});

test("story schema registers all Story 2.0 modules and limits read-aloud and facts to one", () => {
  const schema = readFileSync("sanity/schemaTypes/story.ts", "utf8");
  for (const name of ["storyVideo", "storyAudio", "storyOTon", "storyFacts", "storyHoleLine"]) {
    assert.match(schema, new RegExp(`\\n\\s+${name},`), `${name} missing in story.body`);
  }
  assert.match(schema, /höchstens eine Vorlesefassung/);
  assert.match(schema, /höchstens einen Kasten/);
  const modulesSource = readFileSync("sanity/schemaTypes/storyModules.ts", "utf8");
  assert.ok(!/type:\s*"file"/.test(modulesSource), "no uploads: Story 2.0 uses external players only");
});
