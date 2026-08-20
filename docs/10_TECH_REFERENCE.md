# Technical Reference — August 2026

The starter follows the current official integration patterns:

## Next.js
- Next.js 16 App Router.
- `proxy.ts` is used for request/session proxy behavior.

## Supabase
- `@supabase/ssr` for cookie-based SSR sessions.
- separate browser/server clients.
- session refresh through a Next.js `proxy.ts`.
- `getClaims()` used in the proxy to validate JWT claims.
- Magic Link / OTP flow for low-friction account creation.
- PostgreSQL Row Level Security for all user-owned tables.

## Sanity
- `next-sanity` v13 integration style.
- Sanity Studio v6 schema/config conventions.
- Embedded Studio at `/studio`.
- `defineEnableDraftMode` route for Presentation Tool.
- structured references between destination/place/story/person/object/collection.

## Architecture Decision
Sanity owns editorial truth.
Supabase owns user truth.
The frontend joins both through stable source IDs.
