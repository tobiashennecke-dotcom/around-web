# AROUND — Editorial Pilot Pack v0.1

Six real editorial pilot Stories plus the minimal Destination/Place reference
objects needed to exercise the Story Graph shipped in v1.25a. This is
**content + graph test data only** — no Trip Intelligence, no commerce, no
Story Distribution UI work happened here.

Seed tool: `sanity/tools/EditorialPilotSeedTool.tsx` (Studio → tool
"Editorial Pilot Pack v0.1"). It creates missing documents, patches existing
pilot documents on every run, and never writes to `heroImage` / `gallery` /
`socialImage` on any document — so any image a human adds later in Studio is
safe forever, on every future reseed. A Story's `body` is written once
(`setIfMissing`), so it can later be hand-enriched with real editorial images
without a reseed wiping that work out.

## v0.1.1 — fact + public page hardening

A follow-up pass fixed three confirmed factual errors and closed a "hollow
page" gap:

1. **West Cliffs is Par 72, not Par 70** — corrected in the Story body,
   verified directly against the hole-by-hole par table on
   [westcliffs.com/en/west-cliffs-golf-course](https://westcliffs.com/en/west-cliffs-golf-course/)
   (4+3+4+4+3+5+5+4+4 + 4+4+3+5+4+5+3+4+4 = 72) and independently corroborated
   by GolfDigest.
2. **Hidden Coves is the Gary Player course's planned expansion, not a third
   course** — the Story previously described a "second championship course by
   Tim Lobb" and a separate "third course, Hidden Coves" as if they were two
   different projects. They are the same project: Hidden Coves is Somabay's
   new 18-hole championship course, designed by Lobb & Partners, with its
   front nine open since November 2025 and the full 18 expected end of
   2026/early 2027 (source: [somabaygolf.com's Hidden Coves page](https://somabaygolf.com/en/Hidden-Coves-Course)).
   The Story no longer claims the existing Championship + Par-3 courses
   already total 36 holes.
3. **Volatile/conflicting counts removed**: Soma Bay's spa is described
   editorially now (no exact treatment-room count or square-meter figure),
   because current first-party pages disagree on the number (some say 65
   rooms / 7,500 m², at least one dedicated page phrasing suggested a
   different total) — rather than picking one, the Story avoids the number
   entirely. `"sechs Hotels"` ("six hotels") was replaced everywhere with
   `"mehrere Hotels und Resorts"` ("several hotels and resorts"), since the
   Soma Bay hotel inventory is stated to be evolving.
4. A West Cliffs "currently ranked #2 in Portugal" line was removed — a live
   ranking position is exactly the kind of volatile claim that can go stale
   between this pass and publication, unlike the dated, already-happened
   awards (2017/2018/2019) which stay factually true regardless of today's
   date.
5. Every new Place now has a minimal, verified editorial foundation
   (`whyWeLikeIt`, `aroundTake`, plus course/stay-specific facts) and every
   new Destination has `whyGo`/`aroundTake`, so "IN THIS STORY" never lands
   on an obviously empty production page. See "Minimal editorial foundation"
   below.
6. `publishedAt` moved from a placeholder February 2026 sequence into a
   realistic September 2026 sequence (2026-09-04 → 2026-09-14), preserving
   the original relative order, since these are meant to behave as fresh
   pilot content under v1.25a's `publishedAt DESC` automatic ordering.

**Important safety note on the body corrections**: `upsertStory()` writes
`body` via `setIfMissing` only — by design, so a human's manually-enriched
Story body is never silently overwritten. That protection has a trade-off:
if this seed tool was already run once in production *before* this v0.1.1
pass, the six Stories already have a non-empty `body`, and re-running the
tool will **not** apply these factual corrections to that already-seeded
text — the tool cannot tell a stale auto-seeded body apart from a
hand-edited one, so it never guesses and never overwrites either. The tool
now explicitly logs this: for each Story, it reports either "Body war
bereits gesetzt - NICHT überschrieben" (already set, not overwritten) or
"Body inkl. Fakten-Korrekturen v0.1.1 geschrieben" (written fresh, including
the fix). If you see the former for a Story that shouldn't yet contain any
real human edits, either clear that Story's `body` field once in Studio and
re-run the tool, or apply the same corrections by hand in the block editor.

## The six Stories

| # | Format | Title | Subject |
|---|---|---|---|
| 1 | Worth the Trip | ZWISCHEN WÜSTE UND ROTEM MEER. | Soma Bay, Egypt — why the destination works because golf is only one part of it |
| 2 | After 18 | WENN NACH DER 18 NOCH EIN GANZER TAG ÜBRIG IST. | Soma Bay — diving, kitesurfing, spa, doing nothing |
| 3 | Story | EIN HOTEL MITTEN IM DORF. UND GENAU DESHALB INTERESSANT. | Der Postwirt, Söll / Wilder Kaiser — a hotel in the middle of the village |
| 4 | Course Correction | DER PLATZ, DER AUSSIEHT, ALS WÄRE ER IMMER SCHON DA GEWESEN. | West Cliffs Golf Course, Portugal — restraint in golf architecture |
| 5 | 48 Hours | TALLINN. PÄRNU. LINKS GOLF. REPEAT. | Estonia — Tallinn → Pärnu → Pärnu Bay Golf Links |
| 6 | Manifest | DIE BESTE GOLFREISE BEGINNT NICHT AM ERSTEN ABSCHLAG. | AROUND's point of view, using the other four as illustrations |

Each Story targets ~700–1,300 words of real, source-checked editorial copy
(see "Factual sources" below). No invented quotes, no invented rankings, no
fabricated personal experiences. Where a fact could not be verified with
confidence (e.g. West Cliffs' exact opening date is reported inconsistently
across secondary sources, Pärnu Bay Golf Links' full multi-year award list
differs slightly between two sources), the copy either omits it or states it
in a hedged, honest way rather than presenting an uncertain number as fact.

## Story Graph relations (`story.related[]`)

All relations use the canonical `story.related[]` field — no new relation
fields were added, per the v1.25a rule that this field is the single Story
Graph edge.

- **Story 1** → Destination *Soma Bay*, Place *Somabay Golf – Gary Player
  Championship Course*, Place *The Cascades*
- **Story 2** → Destination *Soma Bay*, Place *Somabay Golf*, Place *The
  Cascades* (no DO-type Place was created in this pilot, so none is
  referenced)
- **Story 3** → Place *Der Postwirt*, Destination *Söll / Wilder Kaiser*
- **Story 4** → Place *West Cliffs Golf Course*, Destination *Portugal Silver
  Coast*
- **Story 5** → Destination *Tallinn*, Destination *Pärnu*, Place *Pärnu Bay
  Golf Links*
- **Story 6 (Manifest)** → one representative object per other pilot Story:
  Place *The Cascades*, Place *Der Postwirt*, Place *West Cliffs Golf
  Course*, Destination *Tallinn*, Place *Pärnu Bay Golf Links*

### Deliberate test coverage for v1.25a

- **Soma Bay** destination has **no curated `destination.stories[]`** set —
  both pilot Stories reach it purely through the automatic Story Graph
  (direct Destination reference + transitive Place → Destination rollup via
  *Somabay Golf* / *The Cascades*). This is the pure-automatic path,
  complementing the curated+automatic Reit im Winkl case from v1.25a.
- **Söll / Wilder Kaiser**, **Portugal Silver Coast**, **Tallinn** and
  **Pärnu** are single-Story destinations, useful for the simplest possible
  direct-reference case.
- No pilot Story references a Destination transitively through a Place that
  ISN'T also meant to show it — e.g. Story 1/2 never reference a "DO" Place
  in Soma Bay, so the graph rule "a broad Destination Story must not
  automatically appear on every Place in that Destination" stays easy to
  verify (there simply isn't a DO Place to leak onto).

## Created Destination / Place reference objects

Deterministic IDs. Destinations carry `whyGo`/`aroundTake` plus the original
minimal fields; Places carry a minimal *verified* editorial foundation
(below) — deliberately still not full Place Detail V2 content, since these
remain primarily graph/reference objects, but no longer obviously hollow
pages either.

**Destinations** (all now have `whyGo` + `aroundTake`)
- `around-destination-soma-bay` — Soma Bay, Egypt (26.8456, 33.9711)
- `around-destination-soell-wilder-kaiser` — Söll / Wilder Kaiser, Austria (47.50361, 12.19194)
- `around-destination-portugal-silver-coast` — Portugal Silver Coast, anchored near Óbidos (39.35806, -9.15778)
- `around-destination-tallinn` — Tallinn, Estonia (59.4370, 24.7536)
- `around-destination-parnu` — Pärnu, Estonia (58.3859, 24.4971)

**Places**
- `around-place-somabay-golf-gary-player-course` (course) → Soma Bay — `whyWeLikeIt`, `aroundTake`, `holes: 18`, `par: 72`, `courseCharacter`, `season: "Ganzjährig bespielbar"`. **No coordinates** (see below).
- `around-place-the-cascades` (stay) → Soma Bay — `whyWeLikeIt`, `aroundTake`, `stayCharacter`, 3 `goodToKnow` facts (room count, position, golf access). **No coordinates** (see below).
- `around-place-der-postwirt` (stay) → Söll / Wilder Kaiser — `whyWeLikeIt`, `aroundTake`, `stayCharacter`, 3 `goodToKnow` facts (1281 first mention, Familie Bliem, the Panorama Spa). **No coordinates** (see below).
- `around-place-west-cliffs-golf-course` (course) → Portugal Silver Coast — `whyWeLikeIt`, `aroundTake`, `holes: 18`, `par: 72`, `courseCharacter`, **coordinates 39.41708, -9.24097**.
- `around-place-parnu-bay-golf-links` (course) → Pärnu — `whyWeLikeIt`, `aroundTake`, `holes: 18`, `par: 72`, `courseCharacter`, `season: "April–Oktober (Winter nur nach Vereinbarung)"`, **coordinates 58.331308, 24.582076**.

`destination.places[]` (the existing curated relation, separate from the
Story Graph) was also populated for each of these five, so the Destination
pages render a coherent AROUND IT section.

### Coordinates: added vs. intentionally omitted

Per the hardening brief: research exact Place coordinates, only set them
when confident, and never fake a Place's location with its Destination's
centre point.

- **Added** — West Cliffs Golf Course (39.41708, -9.24097): the exact
  address (`Estrada do Rio Cortiço, 4, 2510-665 VAU - Óbidos`) and this
  coordinate pair are corroborated across two independent golf-travel
  sources (GolfPass, a French golf-travel site), distinctly different from
  the Óbidos town-centre point used for the Destination.
- **Added** — Pärnu Bay Golf Links (58.331308, 24.582076): sourced from
  Estonia's official sports-facility registry
  ([spordiregister.ee](https://www.spordiregister.ee/en/ehitis/4496/parnu_bay_golf_links)),
  a government record for this specific facility — distinctly different from
  both the Pärnu city-centre Destination point and the wider Reiu village
  point.
- **Omitted** — Somabay Golf / Gary Player Championship Course and The
  Cascades: multiple golf-database and hotel-listing pages were checked, but
  none published an exact clubhouse/property coordinate distinct from the
  general Soma Bay area — only the same regional point already used for the
  Destination. Rather than reuse that (which the brief explicitly forbids),
  both Places were left without coordinates.
- **Omitted** — Der Postwirt: several hotel-listing and regional-tourism
  pages confirm the address (`Dorf 82, 6306 Söll`) but none exposed a precise
  geocoded pin. Left without coordinates rather than guessed.

### What was left out on purpose

- **Full PLAY/STAY utility fields** beyond the minimal set above (e.g.
  `theFeel`, `bestFor`, `aroundMoment`, `knowBeforeYouGo`, full `goodToKnow`
  lists, planning/Trip Fit fields like `suggestedDaypart`) — still out of
  scope; the brief asked for "a minimal verified editorial foundation," not
  full Place Detail V2 content.
- **`author`** on all six Stories — no `person` documents exist in this
  dataset yet, and the brief explicitly forbids inventing people/quotes.

## Factual sources

- **Soma Bay**: [somabaygolf.com](https://somabaygolf.com/), [somabaygolf.com/Gallery](https://somabaygolf.com/Gallery), [somabaygolf.com/en/Hidden-Coves-Course](https://somabaygolf.com/en/Hidden-Coves-Course) (first-party: Hidden Coves designer Lobb & Partners, 18-hole championship course, front 9 open Nov 2025, full 18 end 2026/early 2027), [somabay.com](https://somabay.com/), [somabay.com/explore-somabay/cascades](https://somabay.com/explore-somabay/cascades/), [thecascadeshotel.com](https://thecascadeshotel.com/) (official Cascades hotel site, found via search — not in the original brief's link list), [thecascadesspa.com](https://thecascadesspa.com/) and [somabay.com/spa-thalasso](https://somabay.com/spa-thalasso/) (both state 65 rooms/7,500 m² at the time of checking; per the hardening brief, this pass does not assert an exact number either way since other Somabay sources are reported to conflict). Course par/holes/opening-era cross-checked against [top100golfcourses.com](https://www.top100golfcourses.com/golf-course/cascades-at-somabay) and [leadingcourses.com](https://www.leadingcourses.com/clubs/africa+egypt/somabay-golf) — opening year is reported inconsistently (1998 vs. 1999) across secondary sources, so it was omitted from the Story rather than guessed.
- **Der Postwirt**: [derpostwirt.at](https://www.derpostwirt.at/), [derpostwirt.at/bildergalerie](https://www.derpostwirt.at/bildergalerie), and specifically the first-party history page [derpostwirt.at/en/hotel-soell-wilder-kaiser/history](https://www.derpostwirt.at/en/hotel-soell-wilder-kaiser/history) for the 1281 first mention, the Andreas Hofer / Josef Rainer / Bliem family lineage, and the 7 May 1945 surrender in the hotel's Bierstube.
- **West Cliffs**: [westcliffs.com/en/west-cliffs-golf-course](https://westcliffs.com/en/west-cliffs-golf-course/) — **Par 72** confirmed directly from this page's own hole-by-hole par table (v0.1.1 fix; the pilot pack originally and incorrectly stated Par 70), [westcliffs.com/en/gallery](https://westcliffs.com/en/gallery/), [westcliffs.com/en/discover-the-west-cliffs-old](https://westcliffs.com/en/discover-the-west-cliffs-old/) (first-party: course + clubhouse restaurant opened 2017), independently corroborated on both par and opening year by GolfDigest and by [golfbreaks.com](https://www.golfbreaks.com/), [1golf.eu](https://www.1golf.eu/) and [portugalgolf.net](https://www.portugalgolf.net/). The full designer name, Cynthia Dye McGarey, is confirmed by GolfDigest. A previously live "currently ranked #2 in Portugal" claim was removed in v0.1.1 as a volatile ranking position.
- **Estonia**: [visitestonia.com](https://visitestonia.com/), [visitestonia.com/en/parnu-bay-golf-links](https://visitestonia.com/en/parnu-bay-golf-links) for the course; [en.wikipedia.org/wiki/Tallinn](https://en.wikipedia.org/wiki/Tallinn) and the UNESCO listing for the Old Town's 1997 World Heritage designation; [en.wikipedia.org/wiki/Pärnu](https://en.wikipedia.org/wiki/P%C3%A4rnu) for the "Summer Capital since 1996", 1838 first bathing facility and 1927 mud-bath building, and the 128 km distance to Tallinn. Pärnu Bay Golf Links' designer (Lassi Pekka Tilander) and lead shaper (Mick McShane) plus its 2015 opening were found via web search and appear consistently across [parnubay.com](https://parnubay.com/) and third-party golf-travel sources; its exact multi-year World Golf Awards list differs slightly between sources, so the Story says "mehrfach" (repeatedly) rather than listing specific years. Its operating season (April 1–Oct 31 daily, Nov–Mar by advance booking) and facility coordinates (58.331308, 24.582076) come from [visitestonia.com/en/parnu-bay-golf-links](https://visitestonia.com/en/parnu-bay-golf-links) and Estonia's official [spordiregister.ee](https://www.spordiregister.ee/en/ehitis/4496/parnu_bay_golf_links) facility registry respectively.

## Image rights status

This section is split deliberately into two questions that must never be
conflated: what images have we *found as candidates*, and what images are
*actually live in Sanity*.

**A) Image candidates**: `media-manifest.json` lists 24 candidates across the
six Stories (one hero + 2–5 inline/gallery each), each with `sourceUrl`,
`credit`, `rightsStatus` and `termsUrl`. This is a research/sourcing list,
not a statement that anything is cleared or in use.

**B) Images actually live in Sanity**: **zero.** No `heroImage`, `gallery`,
`socialImage`, or in-body editorial image exists on any of the six Stories or
five Places created by this pilot. This stays true after the v0.1.1 pass —
nothing changed here; it is restated because it is easy to assume a
"hardening" pass quietly added something. It should read as **B = 0** until
a specific candidate in (A) is confirmed `cleared_editorial` and manually
uploaded per the workflow below — at which point that one item's
`rightsStatus` should be updated in the manifest and this section's B count
should be updated accordingly.

**No image was imported into Sanity in this pilot pass.** All six Stories
and all ten reference objects were seeded with empty `heroImage`/`gallery`
fields, exactly like the existing Reit im Winkl content before its own
photography was added by hand in Studio.

This was a deliberate, conservative reading of the strict image-rights rule:
an image may only be auto-ingested once (1) the source explicitly permits
editorial reuse, (2) the exact required credit/photographer is known, and
(3) the intended use complies with the source's terms. For every candidate
researched in this pass, at least one of those three wasn't fully closed:

- **Soma Bay, Der Postwirt, West Cliffs**: their official galleries are
  sourcing *references* only. None of the three sites states an explicit
  editorial-reuse grant, so every candidate is `permission_required` — a
  human needs to request licensed/press imagery (or use approved operator
  photography) before anything is uploaded.
- **Estonia (Visit Estonia)**: genuinely more promising. Their media centre
  states assets "can be used to promote Estonia" with required credit to the
  author *and* Visit Estonia — but explicitly forbids use "in advertising
  campaigns and marketing activities that are directed to sell a certain
  product or service." AROUND's own core loop (Story → Trip → Book) makes it
  worth a direct confirmation from Visit Estonia (brand@estonia.ee) before
  relying on this exemption, and no single asset + named photographer was
  pinned down in this pass — so these are also `permission_required` for
  now, but flagged as the fastest realistic path to an actual clearance.
- **The Manifest** doesn't belong to one operator's property at all;
  `media-manifest.json` recommends original AROUND photography for it
  (matching the credit convention already used elsewhere on the site, e.g.
  `credit: "Tobias Hennecke"`) rather than sourcing third-party imagery for
  the flagship piece.

See `media-manifest.json` for the full per-Story candidate list (one hero +
2–5 inline/gallery candidates per Story), each with `sourceUrl`, `credit`,
`rightsStatus`, `termsUrl` and `notes`.

## How to add real imagery safely later

This mirrors the existing, already-proven workflow used for Reit im Winkl
(see `sanity/tools/BayernSeedTool.tsx`, which references pre-uploaded Sanity
asset IDs rather than pulling from the web):

1. Obtain the actual image file through a channel that clears rights —
   licensed/press imagery from the operator, an approved Visit Estonia asset
   with its exact photographer credit confirmed, or original AROUND
   photography.
2. Upload it once, by hand, in Sanity Studio on the specific Story or Place
   document (Hero image / Gallery / inline editorial image in the Story
   body), filling in `alt`, `caption` and `credit`.
3. Re-running the Editorial Pilot Pack seed tool afterwards is safe: it never
   writes to `heroImage`/`gallery`/`socialImage`, and a Story's `body` is
   only written when it's still empty — so the image and any hand-added
   inline image blocks survive every future reseed.
4. Update `media-manifest.json`'s `rightsStatus` to `cleared_editorial` for
   the item actually used, so the manifest stays an accurate record of what
   is (and isn't) rights-cleared.

## Not part of this release

Per the pilot brief, this pack intentionally does **not** touch: Trip
Intelligence (`lib/trip-fit.ts` and friends), the Trip Planner, Quick Add,
Conflict Intelligence, Supabase, commerce, the Sanity schema (no new fields
were added — `story.related[]` and `destination.places[]`/`stories[]`
already existed), or the Story Distribution UI (`StoryRail`, contextual
placement on Place/Destination/People pages) shipped separately in v1.25a.
This pack only adds the content and graph test data those features will
render.
