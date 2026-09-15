# AROUND — Editorial Pilot Pack v0.2

Six additional real editorial Stories (7–12) on top of the six from
[Editorial Pilot Pack v0.1](../editorial-pilot-pack/README.md), bringing the
total editorial library to **12 Stories** — preparation for v1.25b's Stories
Hub. Same discipline as v0.1: real, source-checked copy, no invented
quotes/rankings, and the Story Graph is driven entirely by the canonical
`story.related[]` field.

Seed tool: `sanity/tools/EditorialPilotV02SeedTool.tsx` (Studio → tool
"Editorial Pilot Pack v0.2"). It does **not** touch, recreate, or duplicate
the original six Stories or any existing Destination/Place — every new
Story's relations reference already-existing documents by their known,
deterministic IDs. It adds exactly one new document type: a `person` for
Cynthia Dye McGarey.

Safety model is identical to v0.1's tool: `createIfNotExists()` so a rerun
never duplicates; `.patch(id).set(...)` keeps text/relations in sync on every
run but never touches `gallery`/`socialImage`/`portrait`; `body` (Story),
`bio` (Person) and — new in this pack — `heroImage` (only set for Story 7)
all use `.setIfMissing()`, so a human's later edits or uploads are never
overwritten. The tool logs, per document, whether each of these was written
fresh or left untouched because it was already present.

## The six new Stories

| # | Format | Title | Subject |
|---|---|---|---|
| 7 | Worth the Trip | EIN GOLFPLATZ. ZWEI LÄNDER. | Golfclub Reit im Winkl-Kössen — Europe's only cross-border course |
| 8 | 48 Hours | 48 HOURS BETWEEN FAIRWAYS AND ALPS. | Reit im Winkl / Chiemgau — a complete Stay→Play→Do→Eat trip |
| 9 | Local Knowledge | WENN DIE ALM DUNKEL WIRD. | Winklmoos-Alm at night — its Dark Sky Park status |
| 10 | People to Know | DIE FRAU, DIE WEST CLIFFS NICHT ÜBERBAUEN WOLLTE. | Cynthia Dye McGarey, the architect behind West Cliffs |
| 11 | The Good Stuff | 80 KILOMETER. 80 PROZENT. | Gut Steinbach / Restaurant HEIMAT — regionality as a measurable number |
| 12 | Next | IS ESTONIA GOLF'S NEXT GREAT ROAD TRIP? | Estonia — a forward-looking argument, not a repeat of Story 5's itinerary |

Word counts range ~585–660 (checked via the same block-text word count used
for v0.1, which landed in a comparable 650–785 range). Formats deliberately use different rhythms: Story 7 opens
mid-scene rather than with a place-name lede; Story 8 is chronological
(Ankunft → Tag 1 → Tag 2, appropriate for a 48 Hours piece); Story 9 is
built as one continuous reflective voice with few, longer sections rather
than many short ones; Story 10 is a biographical profile; Story 11 opens on
a bare number before any context; Story 12 is structured as a rhetorical
argument (four questions/claims), not a geographic sequence — deliberately
distinct from Story 5's Tallinn→Pärnu route structure so the two Estonia
pieces don't read as the same article twice.

## Story Graph relations (`story.related[]`)

All new relations use the canonical `story.related[]` field — no new
relation types, no `relatedPeople`/`relatedPlaces` arrays.

- **Story 7** → Place *Golfclub Reit im Winkl-Kössen*, Destination *Reit im
  Winkl* (both already existed)
- **Story 8** → Place *Gut Steinbach*, Place *Golfclub Reit im
  Winkl-Kössen*, Place *Winklmoos-Alm*, Place *Grillhaus Alte Schmiede*,
  Place *Restaurant HEIMAT*, Destination *Reit im Winkl* — demonstrating
  STAY, PLAY, DO and EAT all inside one Story
- **Story 9** → Place *Winklmoos-Alm*, Place *Sternenpark Platzl* (the
  existing Place specifically about the Dark Sky context), Destination
  *Reit im Winkl*
- **Story 10** → Person *Cynthia Dye McGarey* (new), Place *West Cliffs
  Golf Course*, Destination *Portugal Silver Coast*
- **Story 11** → Place *Gut Steinbach*, Place *Restaurant HEIMAT* (already
  existed as a Place — related directly per the brief, no duplicate EAT
  object created), Destination *Reit im Winkl*
- **Story 12** → Destination *Tallinn*, Destination *Pärnu*, Place *Pärnu
  Bay Golf Links*

### Why no new Destination/Place was created

Every subject in Stories 7–12 already had a matching graph object from
v0.1/earlier releases. Before writing anything, each candidate ID was looked
up directly against production Sanity (by deterministic ID, slug and title)
to confirm this — see the object list below. The one place this could have
gone differently is Story 11: "Restaurant HEIMAT" already exists as its own
Place (`around-place-restaurant-heimat`, EAT type, part of the original Bayern
seed), so it is related directly rather than treated as covered only via Gut
Steinbach.

## New Person object

**Cynthia Dye McGarey** (`around-person-cynthia-dye-mcgarey`) — checked
against production first (`*[_type=="person"]` returned zero documents), so
this is a genuinely new object, not a duplicate. Minimal fields only: title,
slug, role ("Golf Course Architect, ASGCA / EIGCA"), location ("Denver,
Colorado, USA"), summary, website (`dyedesignsgroup.com`), and a three-
paragraph bio covering her family background, career, and current
memberships/portfolio — no portrait uploaded (none rights-cleared), no
speculative personal details.

## Reused existing graph objects (verified present before use)

Looked up by deterministic ID against production Sanity before writing any
relation:

- `around-destination-reit-im-winkl`, `around-destination-portugal-silver-coast`, `around-destination-tallinn`, `around-destination-parnu`
- `around-place-golfclub-reit-im-winkl-koessen`, `around-place-gut-steinbach`, `around-place-winklmoos-alm`, `around-place-grillhaus-alte-schmiede`, `around-place-restaurant-heimat`, `around-place-sternenpark-platzl`, `around-place-west-cliffs-golf-course`, `around-place-parnu-bay-golf-links`

None of these documents were modified — the seed tool only ever *references*
their existing IDs inside the new Stories' `related[]` arrays.

## Factual sources

- **Golfclub Reit im Winkl-Kössen (Story 7, 8)**: [gcreit.de](https://www.gcreit.de/) (club site — confirms Bavaria/Tyrol location, does not itself state the "first/only" claim); first-party confirmation of "the first and only cross-border golf course in Europe" comes from the destination tourism board, [reitimwinkl.de/en/golfplatz-reit-im-winkl-koessen](https://www.reitimwinkl.de/en/golfplatz-reit-im-winkl-koessen). The 12 Bavaria / 6 Tyrol hole split and clubhouse address (Moserbergweg, Kössen) were already verified and in production from the v1.24 Bayern/PLAY V2 seed content. **Checked: 2026-09-15.**
- **Winklmoos-Alm Dark Sky Park (Story 8, 9)**: first-party [sternenpark-winklmoosalm.de](https://www.sternenpark-winklmoosalm.de/) — certification by DarkSky International (formerly International Dark-Sky Association), 2018, fourth Sternenpark in Germany and first in the Alps, ~1,170m altitude (matching the figure already used for Winklmoos-Alm elsewhere in the product), 30–70km to Salzburg/Rosenheim/Traunstein. **Potentially volatile**: the exact star count differs between sources (this site says up to 6,000; a secondary source said ~5,000) — the Story deliberately says "mehrere tausend" (several thousand) rather than committing to either number. **Checked: 2026-09-15.**
- **Cynthia Dye McGarey (Story 10)**: first-party [ASGCA member profile](https://asgca.org/architect/cmcgarey/) for family background, career timeline, 2001 Dye Designs Group founding, White Horse Golf Club (2007), and notable project list (Dreamland Baku, Ferrum Korea, Foison China, Sheraton New Caledonia). EIGCA membership and official Dye Designs Group site (`dyedesignsgroup.com`) found via web search and cross-checked. Alice Dye / Jan Bel Jan / Vicki Martz context comes from an ASGCA obituary page for Alice Dye. No quote is presented as something she personally said in an interview; the one design-philosophy line paraphrased from her ASGCA profile is attributed as "auf ihrem offiziellen Profil beschreibt sie…", not framed as spoken dialogue. **Checked: 2026-09-15.**
- **Gut Steinbach / Restaurant HEIMAT 80:80 (Story 11)**: first-party [gutsteinbach.de/en/cuisine](https://www.gutsteinbach.de/en/cuisine/) and [gutsteinbach.de/kulinarik/restaurant-heimat](https://www.gutsteinbach.de/kulinarik/restaurant-heimat/) for the exact "80% of ingredients within 80km" credo (quoted on-site almost verbatim), the estate's own herb garden and game breeding, and the Bioland organic-farm certification. The 2021 Michelin Green Star award (chef Achim Hack) was corroborated by multiple secondary sources referencing the Guide Michelin listing; the Guide Michelin page itself returned a 403 on direct fetch, so the award is stated as reported rather than directly quoted from Michelin. Relais & Châteaux membership confirmed on the official site. **Not included**: a specific hectare figure and the estate owner's name, found only on a single secondary blog without first-party corroboration — omitted per the "omit rather than guess" rule. **Checked: 2026-09-15.**
- **Estonia (Story 12)**: reuses the same verified facts as v0.1's Story 5 (Tallinn UNESCO listing since 1997, Pärnu "Summer Capital" since 1996, Pärnu Bay Golf Links as the Baltic states' first true links course) — no new facts were needed for this forward-looking argument piece, only a different editorial angle. No trend/market claims ("booming," "the next Portugal," visitor-number growth) are made anywhere in the Story; it explicitly states that no reliable data for such a claim was found. **Checked: 2026-09-15.**

## Editorial priority and publishing dates

| Story | Format | Featured | Priority | publishedAt |
|---|---|---|---|---|
| 7 — Two Countries | worth-the-trip | ✅ | 72 | 2026-09-05 |
| 8 — 48 Hours (Reit im Winkl) | 48-hours | ✅ | 68 | 2026-09-07 |
| 9 — Winklmoos Nights | local-knowledge | — | 58 | 2026-09-09 |
| 10 — Cynthia Dye McGarey | people-to-know | — | 60 | 2026-09-11 |
| 11 — 80km/80% | the-good-stuff | — | 62 | 2026-09-13 |
| 12 — Estonia Next | next | — | 55 | 2026-09-16 |

Exactly 2 of the 6 new Stories are featured, per the brief's cap. Dates
interleave with v0.1's existing sequence (2026-09-04 through 2026-09-14) on
odd days, extending one day past it (09-16) for Story 12, so `publishedAt
DESC` automatic ordering has a realistic, non-identical sequence across all
12 Stories to exercise Story Hub / Story Graph ranking in v1.25b.

## STORY HUB READINESS — format inventory after v0.2

| Format | Count | Titles |
|---|---|---|
| Worth the Trip | 2 | Soma Bay ("Zwischen Wüste…"), Reit im Winkl-Kössen ("Ein Golfplatz. Zwei Länder.") |
| 48 Hours | 2 | Estonia ("Tallinn. Pärnu…"), Reit im Winkl ("48 Hours Between Fairways and Alps.") |
| After 18 | 1 | Soma Bay ("Wenn nach der 18…") |
| Course Correction | 1 | West Cliffs ("Der Platz, der aussieht…") |
| Local Knowledge | 1 | Winklmoos-Alm ("Wenn die Alm dunkel wird.") |
| People to Know | 1 | Cynthia Dye McGarey ("Die Frau, die West Cliffs…") |
| The Good Stuff | 1 | Gut Steinbach ("80 Kilometer. 80 Prozent.") |
| Next | 1 | Estonia ("Is Estonia Golf's Next…") |
| Manifest | 1 | AROUND Manifest ("Die beste Golfreise…") |
| Story | 1 | Der Postwirt ("Ein Hotel mitten im Dorf…") |
| **Total** | **12** | |

This matches the format distribution the brief expected. The library now
spans 9 of the 10 defined `story.format` schema values (all except a second
"Story"), across 5 Destinations, 7 Places, and 1 Person — a plausible
starting shelf for v1.25b's Stories Hub rather than a single-topic
prototype.

## Image rights status

Same **A) candidates vs. B) live in Sanity** split as v0.1, kept strictly
separate:

**A) Candidates**: `media-manifest.json` lists 16 candidates across the six
new Stories (roughly 1 hero + 2 gallery each), each with `sourceUrl`,
`credit`, `rightsStatus`, `termsUrl` and `notes`. Every operator/official
site checked (gcreit.de, reitimwinkl.de, sternenpark-winklmoosalm.de,
asgca.org, gutsteinbach.de, the Bavarian state Sternenpark page) stated no
explicit editorial-reuse grant, so all of those candidates are
`permission_required`. Visit Estonia remains the most promising path for
Story 12, exactly as recorded in v0.1, for the same reason (broadly
permissive terms, but "not for marketing activities directed to sell a
product or service" needs a direct confirmation given AROUND's booking
features, and no specific asset + photographer was pinned down).

**B) Images actually live in Sanity**: **one.** Story 7's `heroImage` now
references `image-f162c296aab7962dc3813dc3dd9cfc999b124ab5-1536x2048-jpg` —
the border-sign-at-tee-18 photo (alt: "Grenzschild am Weg zu Tee 18 zwischen
Österreich und Deutschland", credit: Tobias Hennecke) that was **already
uploaded and already live** on the Golfclub Reit im Winkl-Kössen Place
gallery (via `sanity/tools/BayernSeedTool.tsx` in an earlier release). This
is not a new upload and not an external source — it is AROUND's own,
already rights-cleared photography, referenced a second time because it is
a thematically exact match for a Story literally about crossing that
border. No other image was imported for v0.2; the other five new Stories
and the new Person have no `heroImage`/`gallery`/`portrait`.

## Not part of this release

Per the brief, this pack does not touch: Story Graph Distribution
(`lib/content.ts`, `lib/sanity/queries.ts`), `StoryRail`, Trip Intelligence,
Trip Planner, Quick Add, Smart Add, Conflict Intelligence, commerce, Place
Detail or Destination layouts, or header navigation. It is content + graph
data only, built to work immediately with the existing v1.25a/v1.25a.1
Story Graph Distribution without any code change.
