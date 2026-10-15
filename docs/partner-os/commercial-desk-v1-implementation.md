# Commercial Desk V1 — implementation and activation status (2026-09-23)

## Approved and executed
Tobias explicitly approved the Commercial Desk V1 Supabase schema and Phase 1. Migration `around_commercial_desk_v1` was applied to the existing Supabase project `around` (project ref `uhcdbjfcpivgsqaliojg`), not to a newly created project.

Tables:
- `partner_inquiries`
- `commercial_partners`
- `commercial_contacts`
- `commercial_offers`
- `commercial_activities`
- `commercial_campaigns`
- `commercial_audit_events`

All seven tables have RLS enabled. SELECT/INSERT/UPDATE grants for `anon` and `authenticated` were verified absent; privileged access is through server-side API and an authenticated, allowlisted operator. No partner/contact records were seeded. Existing editorial and trip tables were not modified.

## New private interfaces
- `/commercial/live`: live inquiries, links to the real partner workspace and calendar.
- `/commercial/live/partners`: add partner/contact, internal offer draft, note/task and launch/package request; complete tasks and approve requested dates.
- `/commercial/live/calendar`: durable campaign calendar, approval status and overlap visibility.
- `/api/commercial/records`: server-guarded GET/POST/PATCH; resource-scoped validation and audit insert.
- `/api/commercial/inquiries`: existing live inquiry endpoint, now backed by the approved inquiry table.

## Before using real data
- Ensure Vercel server env `SUPABASE_SECRET_KEY`, `COMMERCIAL_ADMIN_USER_IDS`, and `NEXT_PUBLIC_SUPABASE_URL` are configured on the target deployment. The allowlist must contain Tobias's Supabase Auth user UUID, not an email.
- Public inquiry submission additionally requires `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and appropriate hostname protection.
- Protect preview deployments from general access before entering real contacts.
- Confirm deployment build, log in as allowlisted operator, test create/reload and verify unauthenticated/other-user requests return 403.
- Confirm price/tax/legal terms before binding offers. Current offers are **drafts only** with net EUR amount; no contract, send or acceptance workflow.

## Known limitations / follow-up hardening
- API insert/update followed by separate audit insert is **not atomic**; an audit insert failure may leave the primary record saved. Implement transactional server-side database functions or trigger-based auditing before relying on this for legal/financial workflows.
- Cross-resource offer_id / partner_id relationship is not yet enforced in the DB; do not accept untrusted external partner writes.
- The private calendar currently reads up to 300 records; add pagination before scaling.
- Demo routes remain local-only and are not linked to the private records.
- No partner accounts, private upload bucket, external email, billing, Google Calendar sync or Sanity publishing action.
- Do not merge this branch to production before verifying all Vercel environment and access settings.

## 2026-09-23 follow-up (branch only)
- Magic-link callback now reports missing/invalid code and failed exchange via safe `auth_error` URL flags, instead of silently redirecting to /saved. /account displays the error; no auth tokens or provider descriptions are exposed.
- Internal offer draft UI now uses the shared AROUND catalog and founding prices with add-ons. The protected POST endpoint re-derives and checks the amount from the shared catalog and writes a catalog snapshot and line items. This is an **internal draft**, not an externally binding offer. The catalog price's tax basis still requires a decision before sending offers.
- No schema migration in this follow-up. Audit writes remain non-atomic and must be fixed before legally binding operations.
- Supabase email rate limit remains a separate external blocker to testing the Preview login. Do not repeatedly send magic links; verify allowed redirect URL and retry after cooldown.
