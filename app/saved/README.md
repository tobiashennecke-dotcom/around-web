# AROUND Product System v1.0

Production-oriented starter for the AROUND media + discovery platform.

## Stack
- Next.js 16 / App Router
- Sanity / next-sanity for editorial content
- Supabase SSR Auth + Postgres/RLS for user state
- CSS design tokens based on AROUND Brand Identity
- Local sample content fallback for immediate UI work

## Start locally
1. `npm install`
2. Copy `.env.example` to `.env.local`
3. `npm run dev`

The app renders with sample content even before Sanity/Supabase are configured.

## Connect Supabase
1. Create a Supabase project
2. Run `supabase/schema.sql` in SQL editor
3. Add URL + Publishable Key to `.env.local`
4. Add Auth UI / magic-link flow in the next implementation sprint

## Connect Sanity
1. Create a Sanity project
2. Add project ID/dataset to `.env.local`
3. Reuse `sanity/schemaTypes`
4. Add embedded or hosted Studio
5. Replace sample-content page loaders with GROQ queries from `lib/sanity/queries.ts`

## Product rule
AROUND must never degrade into a blog + database.
Every editorial object should lead somewhere useful, and every utility action should retain editorial context.

See `/docs` for product, IA, content model, UX rules, MVP scope and build order.

## Account / Saves
The starter includes passwordless email login through Supabase OTP/Magic Link:
- `/account`
- `/auth/callback`
- `proxy.ts` refreshes SSR auth cookies
- guest saves remain usable without login
- authenticated saves are written to `saved_items`

## Editorial Studio
Sanity Studio is mounted at `/studio`.
Draft mode endpoints are included under `/api/draft-mode/*`.
Once Sanity environment variables are present, dynamic detail pages read from Sanity first and fall back to sample content when no CMS record is available.

## Preflight
Run `npm run preflight` to validate the repository structure before installing external services.
