# AROUND Architecture

## Purpose

This document records the intended system boundaries so future development does not accidentally collapse AROUND into a single CMS or a single database.

## High-level architecture

```text
                         AROUND
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
      NEXT.JS            SANITY          SUPABASE
      Product UI       Editorial CMS      Product Data
          │                 │                 │
          └────────────── data access ────────┘
                            │
                         VERCEL
```

Potential future layer:

```text
                    CONTAO EDITORIAL DESK
                             │
                  API / stable entity refs
                             │
               Sanity / structured data layer
```

The exact future Contao integration is not decided. Current development must simply avoid making it impossible.

## Frontend — Next.js

Responsibilities:
- rendering editorial routes
- discovery/search UI
- saves UI
- trip planner UI
- responsive behavior
- page metadata
- connecting editorial content with user-specific state

Non-responsibilities:
- being the only source of editorial meaning
- storing user trip data locally as authoritative state

## Sanity — editorial data

Sanity currently owns structured editorial objects such as:
- Destination
- Place
- Story
- Person
- Object / Product
- Collection

Place semantics include roles such as:
- course / play
- stay
- eat / drink
- do / culture

Planning intelligence may be editorially attached to a Place:
- default planning mode
- suggested duration
- suggested daypart
- suggested exact time

This intelligence is recommendation metadata, not immutable scheduling logic.

## Supabase — product/user data

Supabase owns user-specific state including:
- saves
- trips
- trip items
- scheduling decisions
- STAY intervals
- fixed/flexible planning state
- booking/status/note state

Editorial content should be referenced through stable source identifiers rather than duplicated as canonical content.

## Search / Discover

Search is editorial discovery.

Search can be filtered by:
- content type
- PLAY / STAY / EAT / DO role
- query
- active trip context

Search results should be ranked by relevance and editorial signals, not treated as a raw database listing.

## Trip Quick Add

Quick Add is separate from full Search.

Purpose:
- stay in trip context
- add a STAY or STOP without leaving the plan
- apply planning intelligence
- select flexible/fixed behavior
- resolve open nights

Full Search remains available for deeper exploration.

## STAY model

STAY is not a normal point-in-time stop.

It is an interval that may cover:
- whole trip
- selected trip nights
- zero nights if explicitly marked as no accommodation required

A trip may contain multiple STAYs.

Plan readiness must evaluate night coverage and overlaps.

## Fixed vs flexible stops

### Fixed
Has:
- day
- exact time
- duration
- booking/status metadata

Examples:
- tee time
- dinner reservation
- ticketed activity

### Flexible
Has:
- day
- daypart / slot
- suggested duration where useful
- no exact time requirement

Examples:
- area exploration
- spa
- hiking area
- cultural wandering

## Conflict model

A time conflict exists when fixed intervals overlap on the same trip day.

Conflicts should:
- be visible
- be understandable
- be editable
- not be blocked by default

Quick Add should avoid creating conflicts automatically when a reasonable alternative time can be proposed.

## Caching / content freshness

Sanity published content should resolve without requiring code redeploys for every new slug.

The project has previously used:
- published Content Lake perspective
- CDN bypass where required for freshness
- route-level ISR / revalidation
- dynamic route parameters

Do not remove freshness behavior without understanding the consequences.

## Stable data contracts

AROUND should retain stable identifiers so future consumers can include:
- website
- mobile app
- Contao editorial desk
- automation
- newsletter systems
- concierge / trip interfaces

The frontend must not become the sole source of entity identity.
