# Sanity Content Lake Security — Cutover Runbook (v1.27a)

## Current state

- Project: `y8tncro2`
- Dataset: `production`
- Current dataset ACL: **public** (anonymous, tokenless reads are allowed)

**v1.27a does not change the dataset ACL.** It only prepares the application code so that the eventual public → private cutover is safe. The dataset visibility change itself is a separate, deliberate, manually-approved action — never done by running app code.

## Why this matters

AROUND Premium Story access is currently enforced only at the application layer (`app/stories/[slug]/page.tsx` checks `hasEntitlement("read_premium_stories")` before rendering body content past the `premiumGate`). Because the production dataset is public, a locked Premium Story's full body — including everything after the gate — can still be queried directly from the Sanity Content Lake API by anyone who knows the project ID, dataset name, and document ID, completely bypassing the app. Making the dataset private closes that gap; the application changes in v1.27a are what make that switch safe to flip without breaking the public site.

## Target security boundary (after cutover)

```
PUBLIC INTERNET
   |
Next.js / AROUND server
   |
server-only SANITY_API_READ_TOKEN
   |
PRIVATE Sanity production dataset
```

- **Public free content** (Places, Destinations, People, Objects, Collections, Free Stories, Stories Hub, Trip Story Intelligence) is still fetched, projected, and rendered by the AROUND server exactly as today — just via an authenticated read instead of an anonymous one.
- **Premium metadata** (title, slug, deck, format, hero image, reading time, `accessTier`) stays intentionally public/discoverable — Free users must still be able to find, understand, and save a Premium Story.
- **Premium body** stays gated by the existing `hasEntitlement()` decision, now with the dataset itself also refusing anonymous reads as a second layer.

## Rollout phases

### Phase 1 — Code (this branch, `feature/v1-27a-premium-content-security`)

- Deploy v1.27a.
- Dataset **remains public**.
- Website behavior is unchanged: `SANITY_API_READ_TOKEN` is optional at this stage, so reads keep working with or without it.

### Phase 2 — Credential

1. In the Sanity project dashboard, create a **new, least-privilege robot/access token** with **read-only** access to published content. Do not reuse `SANITY_WRITE_TOKEN` (seed tooling) or a personal developer token.
2. Configure it in the server-side deployment environment (e.g. Vercel Project Settings → Environment Variables) as:
   ```
   SANITY_API_READ_TOKEN=<the token>
   ```
   **Never** as `NEXT_PUBLIC_SANITY_API_READ_TOKEN` or any other `NEXT_PUBLIC_` name — that would ship it to every browser.
3. Redeploy.
4. Verify authenticated reads work (the site should behave identically — the dataset is still public at this point, so this only confirms the token itself is valid and wired correctly).

### Phase 3 — Preflight

Run:

```bash
npm run sanity:security-check
```

Expected result **before** the ACL switch:

```
ANONYMOUS READ: OPEN
AUTHENTICATED READ: WORKING
```

`ANONYMOUS READ: OPEN` is expected and correct at this point — the dataset hasn't been switched yet. `AUTHENTICATED READ: WORKING` confirms the token is valid and the app can reach the dataset with it.

### Phase 4 — Dataset cutover

**Only after explicit approval.** In the Sanity project dashboard, change the `production` dataset from:

```
public → private
```

This is a manual action in the Sanity dashboard (or `sanity dataset visibility set production private` via the Sanity CLI, run by a human with explicit authorization) — never something app code or an automated script performs.

Optionally, once the token is confirmed working (Phase 2) and you are ready to fail loudly on any future misconfiguration, set:

```
SANITY_REQUIRE_AUTHENTICATED_READS=true
```

in the same server-side environment. With this flag on, a missing `SANITY_API_READ_TOKEN` becomes an immediate, explicit server configuration error instead of a silent anonymous (now-failing) read — see `lib/sanity/client.ts` and `lib/sanity/security.ts`. This flag is never enabled automatically by any code in this repository; it is a deliberate operator action taken during cutover.

### Phase 5 — Verify

Run the preflight check again:

```bash
npm run sanity:security-check
```

Expected result **after** cutover:

```
ANONYMOUS READ: CLOSED
AUTHENTICATED READ: WORKING
```

Then smoke-test the live site end to end:

- Homepage
- `/discover`
- `/stories` (Stories Hub)
- A Free Story (full body renders)
- A Premium Story as a guest/free user (locked at the gate)
- A Premium Story as an entitled user (full body renders)
- A Place page
- A Destination page
- A Person page
- MY AROUND / READ BEFORE YOU GO (Trip Story Intelligence)

If any of these regress, the dataset can be switched back to `public` immediately while the issue is investigated — the ACL is a dashboard toggle, not a code deploy.

## Asset privacy caveat

**Sanity asset files (images) are not made private just because the dataset is.** Sanity's asset CDN (`cdn.sanity.io`) serves uploaded files by their asset URL regardless of the owning dataset's read visibility, unless a separate, deliberate asset-delivery change is made. This means: after the Phase 4 cutover, Premium Story **editorial data/body text** becomes properly access-controlled, but a Premium Story's **hero image or gallery images** may still be reachable by anyone who has (or guesses) the asset URL.

Do not describe this v1.27a foundation, or the Phase 4 cutover, as making Premium *images* access-controlled. The primary protected asset in this architecture is editorial data/body — not media. A media CDN migration or signed-URL delivery mechanism for Premium images is out of scope for v1.27a and would be a separate, deliberate future task.

## What this is not

This runbook and the v1.27a code changes are the **application-layer half** of access control. They are not, by themselves, a hardened commercial DRM/paywall system. Before AROUND accepts money for protected editorial content (v1.27+), re-verify this entire boundary end to end, including the asset caveat above.
