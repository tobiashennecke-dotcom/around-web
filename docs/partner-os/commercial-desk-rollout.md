# Commercial Desk – rollout checklist

## Routes

- `/commercial`: public **fictional demo**, only on Vercel Preview (or explicit `COMMERCIAL_DESK_DEMO=true`). No personal data.
- `/commercial/live`: private, server-checked operator route; redirects to `/account` without access.
- `/api/commercial/inquiries`: GET last 100 inquiries, PATCH status; always verifies the current Supabase user and operator allowlist on every request.

## Before real data can flow

1. Approve and apply `docs/partner-os/partner-inquiries-schema-proposal.sql` after review. No schema was changed by this branch.
2. Configure **server-side** `SUPABASE_SECRET_KEY`, `TURNSTILE_SECRET_KEY`, `COMMERCIAL_ADMIN_USER_IDS` (comma-separated Supabase Auth user UUIDs). Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` for public form; `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` must already be configured for account login.
3. Verify Cloudflare Turnstile hostname restrictions for preview and production. `PARTNER_ALLOWED_HOSTNAME` can enforce a single hostname at the API layer.
4. Sign in at `/account` with an explicitly allowlisted user. Verify non-allowlisted and logged-out users receive 403 from the API. Never allow all authenticated users.
5. Submit a test inquiry with Turnstile, verify list and PATCH persist, and test browser reload.
6. Confirm production approval before merge; enable Vercel deployment protection for previews when testing real personal data.

## Security model

- The browser never receives the Supabase secret key.
- No `anon` or `authenticated` table grants/policies for private CRM data.
- Server verifies user through `auth.getUser()`, then checks `user.id` against a **server-side** UUID allowlist. User-editable metadata and email strings are not authorization.
- Private API replies use `Cache-Control: private, no-store`; server page is dynamic and noindex.
- This is an MVP, not a full audit log, partner account, contract/invoice system or email sender.
- Status is the only mutable field in the initial private API. Notes in the demo are local only.

## Deployment checks

Run `npm run typecheck` and `npm run build`, verify Vercel deployment status, then perform the manual authorization and data-flow checks above. Do not treat a green build as proof of the database setup or access control tests.
