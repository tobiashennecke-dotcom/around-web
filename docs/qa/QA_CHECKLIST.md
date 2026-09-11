# AROUND QA Checklist

## Build

- [ ] TypeScript typecheck passes
- [ ] `npm run build` passes
- [ ] no unexpected schema migration
- [ ] no unexpected Supabase migration
- [ ] no obvious console errors on tested route

## Editorial routes

- [ ] existing Destination route resolves
- [ ] newly published dynamic Destination slug resolves
- [ ] Place route resolves
- [ ] Story route resolves
- [ ] cards link to correct entity routes
- [ ] published Sanity content refreshes without code redeploy where intended

## Content cards

- [ ] PLAY / STAY / EAT / DO label is correct
- [ ] card image crop works
- [ ] no missing type/category label regression
- [ ] save action still works

## Place pages

- [ ] hero image behaves on wide desktop
- [ ] portrait image does not become absurdly tall on desktop
- [ ] image credit aligns with image/container
- [ ] mobile imagery remains natural
- [ ] gallery / multiple image content remains supported

## Story pages

- [ ] body text is sans-serif where intended
- [ ] comfortable reading measure on desktop
- [ ] responsive headings do not overflow
- [ ] portrait media behaves on desktop
- [ ] image credits stay attached to media
- [ ] bottom navigation does not cover essential content on mobile

## Search / Discover

- [ ] query returns relevant results
- [ ] role filters PLAY / STAY / EAT / DO work
- [ ] trip mode displays active trip context
- [ ] `NUR NEUE` works
- [ ] already-added content displays `IM TRIP`
- [ ] full search remains usable independently of planner

## Trip — STAY

- [ ] full-trip STAY works
- [ ] full-trip STAY can be undone/changed
- [ ] range STAY works
- [ ] split STAY works
- [ ] uncovered night count is correct
- [ ] overlap detection is correct
- [ ] no-stay-required resolution works
- [ ] later-decision resolution works
- [ ] Quick Add can fill an uncovered night

## Trip — STOP

- [ ] `+ STOP` opens Quick Add
- [ ] PLAY filter works
- [ ] EAT filter works
- [ ] DO filter works
- [ ] flexible add works
- [ ] fixed add opens mini-planner
- [ ] fixed time is preserved
- [ ] duration is preserved
- [ ] status is preserved
- [ ] notes are preserved
- [ ] move between days works
- [ ] remove works

## Smart planning defaults

- [ ] Golf / PLAY defaults are sensible
- [ ] EAT defaults are sensible
- [ ] DO can default to flexible
- [ ] editorial place overrides are respected
- [ ] suggested duration is respected
- [ ] suggested daypart is respected
- [ ] suggested time is respected
- [ ] user can override every recommendation
- [ ] Quick Add does not blindly create a known conflict

## Conflict detection

- [ ] overlapping fixed stops trigger conflict
- [ ] non-overlapping fixed stops do not trigger conflict
- [ ] flexible stop does not create an exact-time conflict
- [ ] conflict UI is noticeable at desktop width
- [ ] conflict UI remains clear on mobile
- [ ] no destructive/red-error visual regression

## Plan Check

- [ ] fully covered trip can pass Plan Check
- [ ] uncovered night opens Plan Check
- [ ] exact missing date range is shown
- [ ] add STAY action works
- [ ] previous adjacent STAY can be extended where valid
- [ ] next adjacent STAY can be started earlier where valid
- [ ] `Keine Unterkunft nötig` resolves intentionally
- [ ] `Später entscheiden` remains visibly unresolved

## Responsive planner

Test at minimum:

- [ ] 1600+ px desktop
- [ ] ~1280 px desktop
- [ ] ~1024 px intermediate/tablet landscape
- [ ] ~820 px intermediate
- [ ] mobile portrait ~390 px

Check:
- [ ] no editor controls overlap
- [ ] no huge unused column caused by broken grid
- [ ] title remains readable
- [ ] remove/open/move actions remain reachable
- [ ] STAY controls remain usable
- [ ] Plan Check fits viewport
- [ ] Quick Add becomes usable bottom sheet on mobile

## Final regression flow

Run one complete QA trip:

1. create 5-day trip
2. add first STAY for partial range
3. add second STAY for later range
4. intentionally leave one night open
5. add PLAY fixed point
6. add EAT fixed point
7. add DO flexible
8. add DO fixed
9. create and resolve one time conflict
10. run Plan Check
11. resolve uncovered night
12. verify final trip state
