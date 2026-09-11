# AROUND — Claude Code Project Instructions

## 1. Product identity

AROUND is an editorial golf travel and lifestyle platform.

The product starts with golf, but it is not a golf-course database and not a generic travel SaaS product.

Core editorial idea:

> Golf is where the journey starts.

The experience should connect:

- PLAY — golf courses / rounds
- STAY — hotels / accommodation
- EAT — restaurants / food
- DO — experiences / culture / nature / things after the round
- STORIES — editorial narratives
- PEOPLE — people worth knowing
- OBJECTS — gear / products / ideas
- DESTINATIONS — curated travel contexts

AROUND should feel curated, editorial and opinionated rather than exhaustive.

## 2. Current stack and responsibility boundaries

### Next.js
Frontend application and product UI.

### Sanity
Editorial CMS and structured editorial content.

Typical editorial entities:
- destination
- place
- story
- person
- product / object
- collection

### Supabase
Product/user data.

Typical Supabase responsibilities:
- authentication / user context
- saved items
- trips
- trip items
- planning state
- user-specific product data

### Vercel
Deployment / production runtime.

## 3. Non-negotiable architecture rules

1. Do not move editorial content into Supabase unless explicitly requested.
2. Do not move user/product data into Sanity unless explicitly requested.
3. Do not change the Supabase schema without explicit approval.
4. Do not change the Sanity schema unless the active specification explicitly requests it.
5. Preserve stable public IDs and stable slugs.
6. Preserve existing functionality unless the active specification explicitly replaces it.
7. Prefer additive, backwards-compatible changes.
8. Do not introduce a monolithic `posts` abstraction that collapses all editorial entity types.
9. Keep the architecture CMS-agnostic enough that a future Contao editorial layer could reference / integrate structured entities through stable IDs and APIs.
10. Never silently remove a feature to make a build pass.

## 4. Design system

AROUND's visual system is editorial and high-contrast.

Core palette:
- Anthracite / near black
- Warm White
- Acid Lime — primary accent
- Blue — secondary signal / planning / information
- Pink — selective editorial / category signal

Typography direction:
- clean, strong sans-serif for interface, headlines and most copy
- editorial serif may be used selectively where the current design already uses it
- readability comes before stylistic novelty

Interface principles:
- strong grid
- large editorial type
- generous negative space
- clear hierarchy
- deliberate borders and rules
- avoid generic SaaS card styling
- avoid excessive rounding, shadows, pills and dashboard clichés
- mobile should feel native to the same system, not like a compressed desktop page

## 5. Product principles

### Editorial before database feel
The user should feel that AROUND has a point of view.

### Discovery and planning are different modes
- Search / Discover = explore
- Quick Add = concretely plan

Do not collapse both into one overloaded interface.

### Trip Planner should remain calm
The planner is a plan, not a search page.
Contextual drawers / bottom sheets are preferred over permanently embedded search interfaces.

### Planning intelligence should help, not dictate
AROUND may recommend:
- flexible vs fixed
- duration
- daypart
- suggested time

Users must always be able to override these recommendations.

### Explain conflicts without alarming users
Planning conflicts should be visible and actionable, but not treated as catastrophic errors.
Blue informational treatment is preferred over red warning UI unless the situation is truly destructive.

### STAY is interval-based
A stay can cover:
- the whole trip
- a date/night range
- potentially no stay needed for selected nights

The product must not assume one hotel per trip.

## 6. Current product capabilities to preserve

The current implementation includes, at minimum:

- dynamic editorial routes from Sanity
- Reit im Winkl destination and connected places
- rich Place pages
- multi-image / gallery direction for Places
- saves / My AROUND
- trip creation and detail planning
- STAY coverage by trip-night range
- full-trip stay mode
- ability to remove / change stays
- plan readiness check for uncovered nights
- explicit `Keine Unterkunft nötig` / later-decision logic
- fixed and flexible trip stops
- time conflict detection
- contextual Trip Quick Add
- direct `+ STAY` and `+ STOP`
- PLAY / EAT / DO Quick Add
- search in active trip context
- search ranking / role filters
- planning defaults per Place
- flexible vs fixed editorial planning recommendation
- suggested duration / daypart / time
- fixed-point mini-planner before insertion
- conflict-aware time suggestions
- responsive trip planner repair for intermediate desktop/tablet widths

Do not regress these capabilities.

## 7. Engineering workflow

Before editing:

1. Read this file.
2. Read the active specification under `docs/specs/`.
3. Inspect existing implementation before deciding how to change it.
4. Identify all files that will be touched.
5. Prefer the smallest coherent change.

After editing:

1. Run TypeScript typecheck if available.
2. Run `npm run build`.
3. If the project has relevant tests, run them.
4. Report exactly which files changed.
5. Report any migrations or schema changes. If there are none, explicitly state that.
6. Report any behavior that could not be verified.
7. Do not claim success if the build fails.

## 8. Branch / Git discipline

Do not make unrelated changes in the same implementation pass.

Preferred branch naming:
- `feature/v1-21-product-polish`
- `fix/planner-responsive-*`
- `feature/*`

Do not force-push or rewrite history unless explicitly instructed.

Do not commit generated `.next` output.

## 9. How to interpret specifications

A specification defines the desired product behavior.

Do not reinterpret a product request into a generic UI pattern simply because it is easier to implement.

If the spec conflicts with the current codebase:
- preserve data integrity
- prefer a minimal compatibility layer
- explain the conflict in the implementation summary

If a requested change would require a Supabase migration or destructive content migration and the spec does not explicitly approve it, stop and report the need instead of proceeding.

## 10. Product voice in code

Use existing German UI vocabulary unless the active spec changes it.

Important terms currently used:
- ENTDECKEN
- SUCHE
- GESPEICHERT / MY AROUND
- PLANEN
- STAY
- PLAY
- EAT
- DO
- FIXPUNKT
- FLEXIBEL
- ZEITKONFLIKT
- PLAN CHECK
- NOCH OFFEN

Do not introduce inconsistent synonyms without a product reason.

## 11. Contao future compatibility

AROUND may later gain a Contao-based editorial cockpit.

Therefore:
- maintain stable entity IDs
- keep APIs / data access boundaries clear
- keep editorial entities distinct
- avoid coupling product logic to one CMS implementation
- do not make the frontend the sole place where entity meaning exists

Contao is a future editorial interface possibility, not a replacement for Supabase product data.

## 12. Definition of done

A change is done only when:

- requested behavior is implemented
- existing critical planner behavior still works
- responsive behavior has been considered
- TypeScript passes
- production build passes
- no unintended schema/migration change was introduced
- changed files and risks are summarized

## 13. Agent efficiency

AROUND development should be context-efficient.

- Work autonomously within the supplied specification.
- Avoid verbose progress narration.
- Do not repeatedly reread project documentation.
- Inspect only relevant files and dependencies.
- Prefer targeted code search over broad repository exploration.
- Do not perform unrelated refactors.
- Do not use external research unless explicitly requested.
- Do not spawn additional agents unless required.
- Run expensive checks at meaningful milestones, normally once after implementation.
- Stop only for genuine blockers, schema migrations or architecture decisions.
- Final reports should be concise.

