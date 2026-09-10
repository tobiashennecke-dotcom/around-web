# AROUND Product & Content QA Sprint

## Stable product path to test
Discover → Detail → Save → MY AROUND → Collection → Trip → Day planning.

## Current content world
- Lisbon / Cascais
- Reit im Winkl / Chiemgau
- Gut Steinbach Hotel & Chalets (STAY)
- Golfclub Reit im Winkl-Kössen (PLAY)
- Restaurant HEIMAT (EAT)
- Heimat & Natur SPA (DO)
- WORTH THE TRIP story: Das Heimatrefugium und die Zwei-Länder-Runde

## QA priorities before next large feature
1. Every PLAY / STAY / EAT / DO card carries the semantic role everywhere, not generic PLACE.
2. Detail → parent destination → related content forms no dead ends.
3. Save all four place roles and organize them into a Collection.
4. Convert / add them to a Trip and verify role information survives the whole loop.
5. Search and Discover surface both Lisbon and Bayern without one content world dominating accidentally.
6. Long titles work on desktop, tablet and small iPhone widths.
7. Story longform stays readable with no horizontal overflow and clear image credits.
8. Empty states and back-navigation remain understandable without prior knowledge of the product.

## Product-model questions discovered through real content
- EAT and DO may live inside a STAY (Restaurant HEIMAT / SPA inside Gut Steinbach). Consider an optional `parentPlace` relation while keeping both independently saveable.
- Decide whether the public master taxonomy is strictly PLAY / STAY / EAT / DO. Current schema also contains Drink / Shop / Culture.
- Stories should have explicit author + publication date for editorial credibility.
- Decide whether Reit im Winkl remains the destination and Chiemgau is metadata, or whether a Region layer is required later.

## Pre-live blockers / housekeeping
- Custom SMTP + Magic Link end-to-end auth
- final domain + redirects + CORS
- browser cache/versioning strategy
- cleanup of legacy private Sanity dot-ID Bayern documents after public docs are fully verified
- cross-device sync for saves, collections and trips after auth is finished
- Safari iPhone, Safari macOS and Chrome desktop QA
- SEO / OG images / legal / consent / analytics
