# AROUND Current State

## Snapshot

This document captures the product state reached before the first structured ChatGPT + Claude Code workflow.

It is not a replacement for inspecting the repository. Code always wins if this document and implementation diverge.

## Last validated product area

The most heavily tested area is:

**Discovery → Destination / Place → Save → Trip → Quick Add → Plan Check**

## Editorial content

Working concepts include:
- Destination pages
- Place pages
- Story pages
- Cards / discovery
- editorial relations
- rich media direction

Reit im Winkl / Chiemgau is the main working QA destination.

Existing example content includes or has included:
- Reit im Winkl
- Golfclub Reit im Winkl-Kössen
- Gut Steinbach Hotel & Chalets
- Restaurant HEIMAT
- Hotel Unterwirt
- Winklmoos SonnenAlm
- Grillhaus Alte Schmiede
- Hotel Restaurant Sonneck
- Seegatterl Alm
- Winklmoos-Alm
- Dürrnbachhorn Nostalgie-Sesselbahn
- Sternenpark Platzl
- Taubensee-Rundweg
- Triassic Park Steinplatte

## Trip Planner capabilities

Validated through screenshots / QA flow:

### STAY
- multiple STAYs can exist in one trip
- full-trip STAY mode
- selected date/night range
- change / remove STAY
- uncovered nights are detected
- Plan Check can prompt for missing accommodation
- `Keine Unterkunft nötig` exists as an intentional resolution concept
- `Später entscheiden` exists as an unresolved-but-allowed concept

### STOP planning
- stops can be placed on days
- flexible vs fixed planning mode
- exact time and duration for fixed items
- daypart for flexible items
- status / notes
- manual move between days

### Conflicts
- overlapping fixed times trigger a visible time conflict
- conflict treatment is informational/blue rather than red

### Quick Add
- `+ STAY` within STAY lane
- open-night action can launch STAY discovery
- `+ STOP` within day blocks
- PLAY / EAT / DO contextual discovery
- add as flexible or fixed
- existing trip items marked as already included
- full AROUND Search remains reachable

### Smart defaults
- Place may recommend fixed or flexible
- Place may recommend duration
- Place may recommend daypart
- Place may recommend exact time
- fixed Quick Add shows time/duration before insertion
- existing fixed items are considered when suggesting a conflict-free time

## Responsive QA

The planner has required specific work at intermediate widths.

A repair has been made so the item identity/action row and editor controls do not collapse into an awkward mixed desktop/mobile state.

Any future planner CSS change must test this range again.

## Plan Check — current observation

The Plan Check successfully detects an uncovered night and presents resolution actions.

A known polish opportunity remains:

When an uncovered night sits between two existing STAY segments, Plan Check should ideally offer both logical repairs:
- extend the previous STAY
- start the next STAY earlier

The currently observed UI offered the previous STAY extension.

## Known polish items

1. Plan Check should offer both adjacent STAY repairs when applicable.
2. Flexible stops should surface suggested/expected duration in the planner UI when available.
3. Perform systematic mobile planner QA.
4. Perform intermediate breakpoint QA after planner changes.
5. Align spacing / typography / micro-interaction consistency.
6. Preserve the improved conflict visibility without escalating to red error styling.

## Next planned version

**v1.21 Product Polish**

No large new feature is intended for v1.21.

The goal is to consolidate planner quality after the major v1.19 / v1.20 workflow additions.
