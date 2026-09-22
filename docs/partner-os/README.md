# Partner OS / inquiry integration (draft)

This branch does not modify the live Supabase database or main.

## Implemented
- Public landing and price configurator
- POST /api/partner-inquiries with server-side validation and recalculated price
- Cloudflare Turnstile verification, fail-closed when secrets are missing
- Server-only Supabase secret; no secret in NEXT_PUBLIC_* variables
- Private inquiry table proposal in partner-inquiries-schema-proposal.sql

## Before enabling submissions
1. Review the SQL proposal and approve applying it to the around Supabase project.
2. Create a Cloudflare Turnstile site for the actual production and preview hostname.
3. Configure NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY, SUPABASE_SECRET_KEY and optionally PARTNER_ALLOWED_HOSTNAME in the relevant Vercel environment.
4. Confirm NEXT_PUBLIC_SUPABASE_URL is configured already.
5. Review privacy notice, retention, bot mitigation and operational notification requirements.
6. Run typecheck and build, then test a real submission and confirm the row is private.

## Current limitations
- No internal CRM UI or notifications yet.
- No public access to inquiries; server-only insert.
- No contract is created from an inquiry.
- No rate limiting beyond Turnstile; add durable per-IP limits before large-scale public promotion.
- Turnstile must be reset after a successful submit for subsequent submissions.
