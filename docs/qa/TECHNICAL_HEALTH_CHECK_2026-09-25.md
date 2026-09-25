# AROUND — Technical Health Check, 2026-09-25

Scope: read-only connected-project inspection, main branch at `a4934fb`. No actual browser end-to-end test, restore, hosted production deployment or independent penetration test has been completed as part of this snapshot.

## Observed

| Area | Evidence | Interpretation |
| --- | --- | --- |
| GitHub | `tobiashennecke-dotcom/around-web` is public; `main` unprotected at inspection | Change acceptance should require passed checks; keep secrets out of the repo. |
| CI | No workflow runs or workflow definition at inspection | This changeset adds a quality workflow. |
| npm lint | `next lint` in package.json; Next.js 16 | Replaced by targeted repository guards; full ESLint remains to be configured separately. |
| Supabase | RLS enabled on all 17 inspected public tables | Necessary, not proof of cross-user isolation. |
| Supabase security advisors | 7 commercial tables have RLS enabled without user policies | Expected deny-by-default if these are service-only; confirm intended backend authorizations before creating policies. |
| Supabase security advisors | Leaked-password protection disabled | Enable in Supabase Auth if available for this project's plan. |
| Supabase performance advisors | 14 auth.uid() initPlan findings, 5 multiple-permissive findings, 18 unused-index notices | Measure and optimize policies without changing eligibility; unused indexes on an early product do not warrant immediate deletion. |
| Supabase | `handle_new_auth_user` is SECURITY DEFINER but anon/authenticated EXECUTE revoked | Intentional bootstrap exception; preserve narrow permissions. |
| Sanity | Dataset `production` public; no premium Stories published at inspection | Client-side/API-readable full premium bodies must never be treated as confidential. |
| Repository | No `.env.example`, README referred to it | Added safe blank template and current setup instructions. |
| Content | Sanity contains 8 destinations, 26 places and 16 stories at inspection | Preserve content and relations; no data migration performed. |

## Implemented in this proposed code change

- PR / main quality checks with locked npm install, preflight, repository guards, TypeScript, pure-function unit tests, and build.
- Isolated regression tests for Story Premium gate logic, marketing consent, allowed Brevo events and trip blocker priority.
- Corrected obsolete lint script; no claim that this custom guard replaces ESLint.
- Added non-secret local environment template, updated operational README.
- No Supabase SQL, Sanity data, production configuration or deployment changed.

## Next gated steps (not automatically resolved by passing CI)

1. Inspect Vercel deployment settings, logs, environment variable scopes and rollback via connected Vercel account.
2. Verify latest committed lockfile and dependency advisories; triage `npm audit` findings before enforcing as blocking.
3. Add proper ESLint/TypeScript-aware rules after updating the npm lockfile in a controlled working copy.
4. Run two-test-user and anonymous REST authorization tests for profiles, saves, trips, collections, preferences, entitlements and commercial data. Do not use existing customers' data as test fixtures.
5. Verify backup *and restore* for Supabase and Sanity before production schema changes.
6. Investigate Supabase RLS performance findings and write a reviewed migration; preserve public collection SELECT behavior.
7. Decide content confidentiality model before uploading paid-only Story bodies to a public Sanity dataset.
8. Configure GitHub branch protection / required `quality` checks in Settings after the workflow passes. Current GitHub connection cannot change repository administration settings.
9. Review transactional email/SMTP delivery, domain/CORS and privacy/consent launch checklist separately.
