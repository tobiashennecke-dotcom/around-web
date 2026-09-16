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

**As of v1.26f, the Sanity client performed tokenless published reads** (`lib/sanity/client.ts`: `useCdn: false`, `perspective: "published"`, no API token) using only the public project ID and dataset name. Sanity's Content Lake API allows anonymous read access to a dataset's *published* documents by default when no token is required, which meant a Premium Story's full body — including everything after the `premiumGate` — was very likely still fetchable directly from the Content Lake API by anyone who knew (or guessed) the project ID, dataset name, and document ID, completely bypassing the AROUND app's access check.

**v1.27a adds the missing half of this**: `lib/sanity/client.ts` now supports an optional server-only `SANITY_API_READ_TOKEN`, and `lib/sanity/security.ts` + a `SANITY_REQUIRE_AUTHENTICATED_READS` flag prepare the app to fail loudly (rather than silently) once the dataset actually becomes private. **The dataset itself is still public as of v1.27a** — this is code/preparation only. See `docs/SANITY_SECURITY.md` for the full phased cutover runbook (credential creation → preflight check → the actual public → private dataset switch, which is a manual, explicitly-approved Sanity dashboard action, never something app code performs) and the accompanying asset-privacy caveat (Sanity asset/image URLs are not made private by the dataset ACL alone).

Until that cutover is actually completed and verified (`npm run sanity:security-check` reporting `ANONYMOUS READ: CLOSED`), this document's original caveat still applies in practice: treat Premium Story bodies as not yet cryptographically/architecturally protected at the data-source level, only at the application layer.
