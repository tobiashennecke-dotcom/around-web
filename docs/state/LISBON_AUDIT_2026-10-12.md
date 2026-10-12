# Lisbon 1.0 — Destination audit (2026-10-12)

Code-based review, not a live Sanity content audit.

## Confirmed
- Existing destination page: Hero, WHY GO, AROUND TAKE, a combined Place card grid, StoryRail and SaveButton.
- Sanity destination schema: curated Places and Stories, image/gallery, SEO and editorial fields.
- Individual Place templates already distinguish course, stay and experiences.
- Save, Trip and Quick Add architecture exists elsewhere in the repository.

## Priority 0
Group existing curated Places under PLAY (course), STAY (stay), EAT (eat/drink) and DO (do/culture/shop) using the existing placeType. Preserve curated order within groups, existing links, SaveButton, StoryRail and ISR. Hide empty groups. Retain an OTHER group for unexpected placeTypes.

## Priority 1
Verify actual Lisbon Sanity entries and images; add a reusable 48 HOURS itinerary module only after defining its editorial content model.

## Priority 2
Test desktop/mobile presentation and Save-to-Trip persistence in a separate test account. Do not alter production content or database policies during this audit.
