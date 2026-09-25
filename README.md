# AROUND — Product System

AROUND is an editorial golf travel and lifestyle web application.

## Architecture

- **Next.js 16 + React + TypeScript:** public editorial website and application UI.
- **Sanity:** canonical editorial content, images, destination/place/story relationships and the embedded Studio at `/studio`.
- **Supabase:** authentication, saves, collections, trips, preferences and other user/product state.
- **Vercel:** deployment and runtime. Hosting configuration is managed separately from this repository.

See [architecture](docs/architecture/AROUND_ARCHITECTURE.md) and [current product state](docs/state/CURRENT_STATE.md). Source code and deployed settings take precedence over older handoff documents.

## Local development

Requirements: Node version in `.nvmrc`, npm and access to the required hosted services for full end-to-end testing.

```bash
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

Fill in only the values for your own environment. Never commit `.env.local`, provider access tokens or service-role keys. The public editorial UI includes sample-content fallbacks when Sanity is not configured, but authenticated workflows require valid Supabase configuration.

## Quality checks

```bash
npm run preflight
npm run lint
npm run typecheck
npm run test
npm run build
```

`lint` is a **targeted repository/security guard**, not a full ESLint installation. `test` currently covers selected pure access/consent/planning helpers, not real multi-user database authorization or browser end-to-end flows. The GitHub Actions workflow runs these checks for proposed code changes. The dependency audit is initially informational.

## Production boundaries

- Do not change production database schema, Sanity content or Vercel settings merely to make tests green.
- Validate user-specific access on a separate test account/environment; do not read personal user data in an audit.
- The Sanity production dataset is publicly readable. A frontend premium gate is **not** content confidentiality. Do not publish paid-only full article bodies there before introducing a private content strategy.
- Before deploying database policy changes, take a verified backup and validate a staging restore.
- The launch checklist in [docs/PRE_LIVE_LAUNCH.md](docs/PRE_LIVE_LAUNCH.md) and the [health check](docs/qa/TECHNICAL_HEALTH_CHECK_2026-09-25.md) track outstanding operations.
