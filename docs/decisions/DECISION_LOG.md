# AROUND Decision Log

This file records product and architecture decisions already made during development.

## D-001 — Sanity for editorial content
**Status:** Active

Sanity is the current editorial CMS for structured AROUND content.

Reason:
- structured entities
- relations
- media
- editorial workflows
- flexible frontend delivery

## D-002 — Supabase for user/product data
**Status:** Active

Supabase remains responsible for saves, trips and user-specific planning state.

Sanity should not become the database for user trip state.

## D-003 — Future Contao compatibility remains open
**Status:** Architectural constraint

A future Contao-based editorial cockpit is considered desirable/possible.

Current implementation should therefore remain API-first enough to allow stable entity references and editorial integrations later.

Contao would be an editorial interface, not a replacement for Supabase trip/user data.

## D-004 — Distinct editorial entity types
**Status:** Active

AROUND keeps separate concepts for Destination, Place, Story, Person, Object/Product and Collection.

Do not reduce everything to a generic `post` model.

## D-005 — PLAY / STAY / EAT / DO roles
**Status:** Active

Place content is semantically grouped into the four trip roles.

These roles drive both editorial presentation and trip-planning behavior.

## D-006 — STAY uses night ranges
**Status:** Active

A STAY may cover the entire trip or a selected night range.

Multiple STAYs are allowed within one trip.

## D-007 — Plan readiness checks uncovered nights
**Status:** Active

Trip completion must detect uncovered nights.

Available concepts include:
- add STAY
- extend an adjacent STAY
- no accommodation required
- decide later

## D-008 — Fixed and flexible stops
**Status:** Active

Trip stops may be fixed or flexible.

Fixed stops use time + duration.
Flexible stops use daypart/slot and may carry a suggested duration.

## D-009 — Conflicts are visible but not blocking
**Status:** Active

AROUND shows overlapping fixed-time intervals as a time conflict.

The UI uses a visible informational treatment rather than destructive red error treatment.

## D-010 — Contextual Quick Add
**Status:** Active

The planner has contextual `+ STAY` and `+ STOP` flows.

Quick Add is for concrete planning.
Full Search remains for discovery.

## D-011 — Smart planning defaults
**Status:** Active

Places may carry planning intelligence:
- flexible/fixed recommendation
- duration
- daypart
- exact suggested time

Users can override all recommendations.

Quick Add should avoid automatically creating known time conflicts.

## D-012 — Responsive planner requires intermediate layout
**Status:** Active

The planner has an intentional intermediate breakpoint between wide desktop and mobile.

Do not assume desktop layout can simply shrink until the mobile breakpoint.

## D-013 — Rich Place pages need galleries
**Status:** Active direction

PLAY / STAY / EAT / DO pages should support multiple images because the product is highly visual.

## D-014 — Content seed as product QA tool
**Status:** Active

Reit im Winkl / Chiemgau seed content is not only editorial demo data. It is deliberately used to test:
- multiple STAYs
- fixed and flexible activities
- EAT reservations
- family / outdoor alternatives
- search relevance
- trip-planning behavior

## D-015 — GitHub is the source of truth for development
**Status:** Active workflow

ChatGPT and Claude may collaborate, but neither chat should be treated as the canonical code state.

The repository and committed documentation are the shared source of truth.
