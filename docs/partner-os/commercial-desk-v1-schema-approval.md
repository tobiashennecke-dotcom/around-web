# Commercial Desk V1 — schema and activation proposal

**Status: DRAFT FOR TOBIAS APPROVAL. No migration executed; no real CRM data entered.**

## Objective

Manage the first 5–10 AROUND partners internally with durable records and a private operator dashboard. The partner-facing demo remains unchanged until internal operations work. Sanity continues to own published editorial destinations, places and stories; Supabase owns commercial records and product workflow.

## Current code reality

- `partner_inquiries` is only a proposed table in `docs/partner-os/partner-inquiries-schema-proposal.sql`. Its API and private /commercial/live page already exist but cannot be assumed active.
- The /commercial/calendar and partner-portal demo use browser-local data, not the backend.
- /commercial demo is preview-visible with fictional entries. It MUST NOT become a real CRM screen without server authorization.
- Existing `getCommercialAccess()` validates Supabase Auth user and `COMMERCIAL_ADMIN_USER_IDS`; reuse this check for every new server read/write. Server-only secret never leaves the server.

## Data model proposed for approval

| Entity | Purpose | Required fields / relationships |
| --- | --- | --- |
| partner_inquiries | Incoming requests and lead funnel (existing proposal) | id, organization/contact/email, requested plan/add-ons, quote estimate, status, created_at |
| commercial_partners | One organization independent of its contact person or inquiry | id UUID, display_name, partner_type, website, country, internal_status, source_inquiry_id nullable FK, created_at, updated_at |
| commercial_contacts | Multiple contacts per partner | id UUID, partner_id FK, full_name, email, role nullable, is_primary, created_at |
| commercial_offers | Versioned proposals and immutable commercial snapshots | id UUID, partner_id FK, offer_number, version, state (draft/sent/accepted/declined/expired/cancelled), currency EUR, net_amount_cents, tax_amount_cents nullable, gross_amount_cents nullable, line_items JSONB, catalog_snapshot JSONB, terms_version nullable, valid_until nullable, created_at, updated_at, accepted_at nullable; unique (offer_number,version) |
| commercial_activities | Operator timeline, notes and follow-ups | id UUID, partner_id FK, offer_id nullable FK, activity_type, summary, due_at nullable, completed_at nullable, actor_user_id UUID, created_at |
| commercial_campaigns | One row per launch, package or campaign; NOT a publication command | id UUID, partner_id FK, offer_id nullable FK, kind (launch/package/campaign), title, starts_on DATE, ends_on DATE, status (requested/confirmed/active/completed/cancelled), approved_by UUID nullable, approved_at nullable, created_at, updated_at; check ends_on >= starts_on |
| commercial_audit_events | Durable record of privileged status and approval changes | id UUID, entity_type, entity_id UUID, action, actor_user_id UUID, before_data JSONB nullable, after_data JSONB nullable, created_at |

### Relationships and invariants

- One partner has many contacts, offers, activities and campaigns.
- One inquiry can be associated with zero or one partner; duplicate requests do not create duplicate partners automatically.
- Offer versions are append-only after sending; acceptance is tied to an exact immutable version. A draft can be revised until sent.
- Offer money uses integer cents, not floating-point. Do not guess VAT or whether a price is net/gross. Resolve commercial/legal terms before sending binding offers.
- Campaign dates use DATE for day-granular partner launches and packages. A later timed calendar sync must add timezone-aware start/end instants and explicit timezone, not reinterpret DATE as UTC.
- A requested campaign cannot become confirmed without authenticated operator approval; status transitions must be server validated and audited.
- A confirmed campaign does NOT trigger Sanity publication.
- Deleting a partner must not cascade-delete contracts/audit history; default to archive/soft-delete and explicit retention rules.
- Avoid storing credentials, unnecessary personal information, or contract PDFs in JSONB.

## Authorization and exposure

- All CRM tables private by default: enable RLS and revoke anon/authenticated access; no permissive policies. Access only through protected Next.js server routes using a server-side Supabase secret and verified operator allowlist.
- Verify authentication and authorization for GET/POST/PATCH individually, including target partner/offer/campaign IDs; never trust role, price or approval status supplied by browser.
- No real CRM records on preview-visible /commercial or /partner-portal/demo. Use /commercial/live and new private routes for real data.
- Protect previews before testing real contacts; redact PII in logs; disable caching of API and private pages.
- Partner auth and private file storage are **Phase 2**, not part of the first migration.

## Proposed delivery sequence

1. Approve this model and the previously proposed inquiry schema; confirm price/tax and contact handling.
2. Inspect actual Supabase schema for naming collisions and existing migrations, then create a reviewed, reversible migration. No SQL executed before approval.
3. Verify RLS, grants, constraints, indexes and audit behavior. Test denied access as anon, ordinary authenticated user, and permitted operator.
4. Implement protected /api/commercial/partners, /offers, /activities and /campaigns with validation and idempotent writes.
5. Build /commercial/live as the real internal home, keeping preview-only demo intact. Add partner detail, offer history, activity timeline and calendar.
6. Run typecheck, build, authenticated API checks, reload and cross-browser persistence checks before entering actual partner records.

## Decisions to approve before implementation

1. Use **Supabase for private commercial records**, keep editorial content in Sanity?
2. Start with **internal-only operator access** (Tobias; optional additional authorized team members later)?
3. Allow **multiple contacts per organization** and preserve offers as **versioned snapshots**?
4. Keep all launch/package dates as **requested until explicitly confirmed** by AROUND?
5. Confirm commercial pricing, tax basis, offer validity and legal terms separately before activating binding acceptance.

No production merge, database migration, external invitations, billing, or email sending is included in this draft.
