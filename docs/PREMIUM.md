# Premium — Story Access Foundation (v1.26f)

AROUND Premium is **access**, not editorial quality. `aroundSelected` (AROUND Selected) is an editorial judgment and can never be bought; `accessTier` (Premium) is a product entitlement and never influences editorial ranking. The two are independent in both data and UI, and must stay that way.

## 1. Story authorization is decided server-side, in the AROUND app

`app/stories/[slug]/page.tsx` is a Server Component. It fetches the canonical `story.accessTier` from Sanity, and — only when that Story is Premium — asks Supabase (via `hasEntitlement("read_premium_stories")`) whether the requesting, authenticated user has that entitlement. `resolveStoryAccessState()` (`lib/story-access.ts`) turns that into one of `"free" | "premium-unlocked" | "premium-locked"`. This decision happens fresh, on the server, for every request — the route is `export const dynamic = "force-dynamic"` specifically because a Premium access decision is user-specific and must never be served from a cache built for a different user.

## 2. Locked `afterGate` blocks are never rendered or passed to the browser

`splitStoryBodyAtPremiumGate()` splits a Story body at its first `premiumGate` block. When a Story is `"premium-locked"`, only `beforeGate` is ever passed to `<StoryBody>`; `afterGate` is computed and then simply never touched again — not rendered, not hidden with CSS, not serialized into any client component's props. There is no code path in which a locked reader's browser ever receives the gated content, not even invisibly.

If a Premium Story is missing its `premiumGate` (a Sanity validation error should prevent this from being published at all — see below), the app fails closed: zero body blocks are rendered rather than leaking the full text. Hero, deck, metadata, Save, and the "IN THIS STORY" discovery graph remain visible regardless — only the body content itself locks.

## 3. Entitlements, not plan strings, control capability

The only question any code asks is `hasEntitlement("read_premium_stories")` (`lib/access/entitlements.ts`). `user_access.plan` and `subscription_status` are informational account metadata only — no code path uses `plan === "premium"` to authorize anything. This is deliberate: it lets Stripe, trials, partner access, lifetime access, promotional access, or manually-granted access all be layered on later purely by writing rows into `user_entitlements`, without ever touching Story access logic again.

v1.26f activates exactly one entitlement: `read_premium_stories`. `advanced_trip_planning`, `personal_travel_briefing` and `smart_day_planning` exist in the schema but are inert — no UI locks or checks reference them yet.

## 4. AROUND Selected and Premium are independent

- `aroundSelected` is a boolean editorial flag, set by editors, never affected by any entitlement.
- `accessTier` is a Premium/Free flag, set by editors, never affected by `featured`, `priority`, or `aroundSelected`.
- A Story can be both, neither, or either independently. Story Hub ordering, StoryRail ordering, Place/Destination/Person Story distribution, and Trip Story recommendations (READ BEFORE YOU GO) all sort purely by `featured`/`priority`/`publishedAt`/Story Graph relevance — `accessTier` is never a ranking input anywhere in the codebase.
- The reader-facing `PremiumAccessBadge` ("PREMIUM") is a separate component from `.selectedBadge` ("AROUND SELECTED"), with no shared class and no shared visual language (no gold, crown, star, or "best"/"exclusive" styling on the Premium marker — it is deliberately plain).

## 5. Payment is not implemented yet

There is no Stripe package, API, checkout session, webhook, price id, or payment environment variable anywhere in this codebase. `/premium` is a proposition/teaser page ("COMING SOON") with no price, no checkout, and no waitlist — it exists to explain the direction, not to sell anything. `PremiumStoryGate`'s only calls to action are `EXPLORE AROUND PREMIUM →` (to `/premium`) and `MY ACCOUNT →` (to `/account`).

## 6. No Premium content has been automatically migrated

v1.26f does not change any Story's `accessTier` in production, does not insert a `premiumGate` into any existing Story body, and does not grant any production entitlement. Every existing Story keeps behaving exactly as before unless an editor deliberately marks it Premium and adds a gate in Sanity Studio.

---

## Content Lake security caveat — read before commercial launch

**The current Sanity client performs tokenless published reads** (`lib/sanity/client.ts`: `useCdn: false`, `perspective: "published"`, no API token) using only the public project ID and dataset name. This is standard and fine for a fully public editorial site, because Sanity's Content Lake API allows anonymous read access to a dataset's *published* documents by default when no token is required.

**This means: as of v1.26f, a Premium Story's full body — including everything after the `premiumGate` — is very likely still fetchable directly from the Sanity Content Lake API by anyone who knows (or guesses) the project ID, dataset name, and document ID, completely bypassing the AROUND app's access check.** The `app/stories/[slug]/page.tsx` gate only stops a reader going through the AROUND frontend; it does nothing to the underlying data source.

**Before AROUND accepts money for protected editorial content in v1.27**, explicitly verify whether the dataset is publicly queryable this way (e.g. attempt an anonymous GROQ query for a Premium Story's `body` field directly against `https://<project-id>.api.sanity.io/...` from outside the app). If it is — which is the default and the likely current state — paid Premium Story bodies must move behind an appropriately private/server-authorized delivery boundary (for example: a private dataset visibility, or fetching Premium bodies exclusively via a server-side authenticated Sanity token that the browser never sees, with the app's own entitlement check as the sole gate) before commercial activation.

This document does not change the Sanity dataset architecture, and this v1.26f foundation should not be described as a hardened commercial DRM/paywall — it is the application-layer half of access control only.
