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

Deterministic IDs, minimal fields only (title, slug, kicker, summary,
destination relationship, coordinates where confidently verified, website,
basic publishing metadata). No utility facts (holes/par/course character/
planning fields/goodToKnow) were invented — these are graph/reference
objects, not full Place Detail V2 content.

**Destinations**
- `around-destination-soma-bay` — Soma Bay, Egypt (26.8456, 33.9711)
- `around-destination-soell-wilder-kaiser` — Söll / Wilder Kaiser, Austria (47.50361, 12.19194)
- `around-destination-portugal-silver-coast` — Portugal Silver Coast, anchored near Óbidos (39.35806, -9.15778)
- `around-destination-tallinn` — Tallinn, Estonia (59.4370, 24.7536)
- `around-destination-parnu` — Pärnu, Estonia (58.3859, 24.4971)

**Places** (coordinates intentionally left unset — see "What was left out")
- `around-place-somabay-golf-gary-player-course` (course) → Soma Bay
- `around-place-the-cascades` (stay) → Soma Bay
- `around-place-der-postwirt` (stay) → Söll / Wilder Kaiser
- `around-place-west-cliffs-golf-course` (course) → Portugal Silver Coast
- `around-place-parnu-bay-golf-links` (course) → Pärnu

`destination.places[]` (the existing curated relation, separate from the
Story Graph) was also populated for each of these five, so the Destination
pages render a coherent AROUND IT section.

### What was left out on purpose

- **Place-level coordinates**: only regional/city-level Destination
  coordinates were set, using well-corroborated public reference values.
  Property-level coordinates (e.g. the exact Cascades clubhouse pin) were
  **not** set, because a confidently precise pin wasn't independently
  verified in this pass — better to leave a field empty than to assert false
  precision that could later feed into geographic relevance/Trip Fit logic.
- **PLAY/STAY/EAT utility fields** (`holes`, `par`, `courseCharacter`,
  `whyWeLikeIt`, `theFeel`, `goodToKnow`, planning fields, etc.) on all five
  Places — explicitly out of scope per the pilot brief ("do NOT attempt to
  build full Place Detail V2 content").
- **`aroundTake`** on the five new Destinations — the Destination page
  already has a sensible fallback pull-quote when this is empty; adding one
  would have meant writing five more pieces of editorial opinion beyond the
  pilot's actual scope.
- **`author`** on all six Stories — no `person` documents exist in this
  dataset yet, and the brief explicitly forbids inventing people/quotes.

## Factual sources

- **Soma Bay**: [somabaygolf.com](https://somabaygolf.com/), [somabaygolf.com/Gallery](https://somabaygolf.com/Gallery), [somabay.com](https://somabay.com/), [somabay.com/explore-somabay/cascades](https://somabay.com/explore-somabay/cascades/), [thecascadeshotel.com](https://thecascadeshotel.com/) (official Cascades hotel site, found via search — not in the original brief's link list). Course par/holes/opening-era cross-checked against [top100golfcourses.com](https://www.top100golfcourses.com/golf-course/cascades-at-somabay) and [leadingcourses.com](https://www.leadingcourses.com/clubs/africa+egypt/somabay-golf) — opening year is reported inconsistently (1998 vs. 1999) across secondary sources, so it was omitted from the Story rather than guessed.
- **Der Postwirt**: [derpostwirt.at](https://www.derpostwirt.at/), [derpostwirt.at/bildergalerie](https://www.derpostwirt.at/bildergalerie), and specifically the first-party history page [derpostwirt.at/en/hotel-soell-wilder-kaiser/history](https://www.derpostwirt.at/en/hotel-soell-wilder-kaiser/history) for the 1281 first mention, the Andreas Hofer / Josef Rainer / Bliem family lineage, and the 7 May 1945 surrender in the hotel's Bierstube.
- **West Cliffs**: [westcliffs.com/en/west-cliffs-golf-course](https://westcliffs.com/en/west-cliffs-golf-course/), [westcliffs.com/en/gallery](https://westcliffs.com/en/gallery/) for architect, par/holes, terrain and awards. Opening year (2017) corroborated across [golfbreaks.com](https://www.golfbreaks.com/), [1golf.eu](https://www.1golf.eu/) and [portugalgolf.net](https://www.portugalgolf.net/) — not stated on the first-party page itself, so phrased as reported rather than a first-party fact.
- **Estonia**: [visitestonia.com](https://visitestonia.com/), [visitestonia.com/en/parnu-bay-golf-links](https://visitestonia.com/en/parnu-bay-golf-links) for the course; [en.wikipedia.org/wiki/Tallinn](https://en.wikipedia.org/wiki/Tallinn) and the UNESCO listing for the Old Town's 1997 World Heritage designation; [en.wikipedia.org/wiki/Pärnu](https://en.wikipedia.org/wiki/P%C3%A4rnu) for the "Summer Capital since 1996", 1838 first bathing facility and 1927 mud-bath building, and the 128 km distance to Tallinn. Pärnu Bay Golf Links' designer (Lassi Pekka Tilander) and lead shaper (Mick McShane) plus its 2015 opening were found via web search and appear consistently across [parnubay.com](https://parnubay.com/) and third-party golf-travel sources; its exact multi-year World Golf Awards list differs slightly between sources, so the Story says "mehrfach" (repeatedly) rather than listing specific years.

## Image rights status

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
