# Partner OS – next integration milestone (not yet activated)

## Existing preview
- Public /partners and /partners/apply.
- Internal fictional /commercial, /commercial/offer, /commercial/onboarding and /commercial/calendar.
- Partner-facing /partner-portal/demo and /partner-portal/demo/onboarding.
- Local-only date requests flow from onboarding to calendar in the same browser; they are not shared between devices, accounts or browsers.

## Proposed real workflow
1. Server creates a versioned draft offer from a validated inquiry. Store the complete line-item snapshot, founding eligibility, currency, tax assumptions, validity and terms version. Never derive accepted price from mutable current catalog.
2. Internal operator reviews and sends a one-time or expiring invitation by email. Invitation grants access only to its own proposal; do not expose proposal data via a guessable URL or raw ID. Avoid partner names and contact details in URLs.
3. Partner authenticates or verifies invitation ownership, reads terms, and explicitly accepts the offer version. Persist timestamp, authenticated identity, accepted terms version and immutable snapshot. Never auto-accept by visiting a link.
4. Create a partner workspace and ordered onboarding tasks. Files go into a private bucket, scanned/validated server-side, with scoped signed access; do not use public asset URLs for contracts or unpublished material.
5. Partner submits factual review and desired launch/package dates; requests are NOT confirmed bookings. Internal operator confirms/rejects and records reason/time. A confirmed schedule entry must not automatically publish Sanity editorial content.
6. AROUND alone approves publication. Publish through a separately authorized action and keep editorial records in Sanity, product/commercial records in Supabase.
7. Send transactional confirmations only after successful durable writes, with retries/idempotency and a notification log.

## Before activation (requires explicit decisions and review)
- Approved Supabase migration, RLS, storage policies, auth mapping and operator permissions.
- Email provider, sending domain and deliverability checks.
- Final contract/terms, tax treatment and pricing approval.
- Vercel Preview protection before using real personal data.
- Manual checks for cross-partner access, token replay/expiry, CSRF, authorization on every write, file type/size, acceptance idempotency, calendar time zones and DST, date overlaps and duplicate notifications.

## Demo limitations
- Browser localStorage is a visual prototyping mechanism, not a security boundary or reliable shared database.
- The demo status control only simulates approval and does not change a real publication.
- Existing demo offers are not legal offers, and file pickers do not upload.
