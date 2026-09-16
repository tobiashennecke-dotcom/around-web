# Brevo — Communication Layer (v1.26e)

AROUND has three distinct systems. Brevo is the third:

- **Sanity** — Content Intelligence (editorial content, Story Graph)
- **Supabase** — User Intelligence (accounts, Saves, Collections, Trips, `communication_preferences`, `user_events`)
- **Brevo** — Communication Layer (email audiences + lifecycle automation)

**Brevo must never become the source of truth.** Supabase remains authoritative for consent, behavior, Trips, Saves and preferences. Brevo only ever receives the subset of that data required to actually deliver communication.

## Environment variables

All of the following are **server-only**. None of them may ever be prefixed `NEXT_PUBLIC_` — that would ship them to the browser bundle.

| Variable | Purpose |
| --- | --- |
| `BREVO_API_KEY` | Brevo v3 API key. Required for any Brevo call. If unset, the communication layer degrades safely (see below) — the rest of the app is unaffected. |
| `BREVO_LIST_AROUND_JOURNAL_ID` | Numeric Brevo List ID for the `aroundJournal` preference. |
| `BREVO_LIST_MY_AROUND_UPDATES_ID` | Numeric Brevo List ID for the `myAroundUpdates` preference. |
| `BREVO_LIST_TRIP_INTELLIGENCE_ID` | Numeric Brevo List ID for the `tripIntelligence` preference. |
| `BREVO_LIST_AROUND_DROPS_ID` | Numeric Brevo List ID for the `aroundDrops` preference (explicitly commercial). |

### Setup

1. Create the four Lists manually in the Brevo dashboard (Contacts → Lists), one per preference above. AROUND never creates or renames Brevo Lists via code.
2. Copy each List's numeric ID into the matching environment variable in your deployment environment (e.g. Vercel project settings), not into any file committed to this repo.
3. Create a Brevo API key (Settings → API Keys) and set it as `BREVO_API_KEY` in the same place.
4. Missing or partial configuration is safe: a missing `BREVO_API_KEY` disables the whole communication layer (product features keep working normally); a missing individual list ID just means that one list is skipped during sync, it does not block the others or crash anything.

## What this layer does

- **Consent** lives in `public.communication_preferences` (four independent boolean flags: `around_journal`, `my_around_updates`, `trip_intelligence`, `around_drops`). All default `false`. Account creation, a Save, a Trip, or Premium never implies consent.
- **`PUT /api/communication-preferences`** writes the canonical Supabase row first, then best-effort syncs Brevo contact list membership to match. A Brevo failure never rolls back or blocks the Supabase write.
- **`POST /api/communication-events`** forwards a narrow, consent-gated subset of canonical `user_events` (`content_saved`, `content_unsaved`, `trip_created`, `content_added_to_trip`, `trip_dates_set`) to `POST /v3/events` as deterministic `around_*` event names, only when the event's required preference is `true`.
- **List sync** only ever adds/removes AROUND-owned list IDs on a contact. It never touches unrelated Brevo lists or attributes, never sets `emailBlacklisted` (a global Brevo unsubscribe is never silently reversed), and never deletes a contact — opting out of everything just unlinks the four AROUND lists.

## Failure model

Communication is always the least critical layer:

1. **Core product** (Save, Trip, Collection) must always work.
2. **User Intelligence** (Supabase) must always remain canonical and correct.
3. **Communication provider** (Brevo) is best-effort and safely degradable.

A Brevo outage, a missing API key, or a missing list ID never breaks a Save, a Trip, or a preference change — Supabase still saves correctly either way. There is no automatic retry queue: a failed sync simply does not happen for that attempt, and is only attempted again the next time the user explicitly saves their preferences (or a later lifecycle event is forwarded).
