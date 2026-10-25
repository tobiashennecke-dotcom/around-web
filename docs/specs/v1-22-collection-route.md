# 16: Collection als Route

**Status:** Vorschlag, zur Freigabe am Montag · **Stand:** 23.10.2026
**Anlass:** Collection „Ennstal“. Ein langes Wochenende soll sich lesen wie ein Plan: Tag 1 Radstadt, Tag 2 Schladming.

**Was die Änderung nicht macht:** keine Supabase-Änderung, keine Datenmigration. Bestehende Collections bleiben unverändert. Am Reiseplaner ändert sich nichts.

**Was freigegeben werden muss:** eine kleine, rein additive Erweiterung des Sanity-Schemas der Collection (Abschnitt 2).

---

## 1. Was neu ist

Eine Collection hat künftig eine von zwei Formen:

| Form | Wie sie aussieht | Wann |
|---|---|---|
| **Auswahl** (wie heute, Standard) | Aufmacher, Teaser, alle Einträge als Kacheln | Themen-Sammlungen, z. B. „Die besten Par 3 der Alpen“ |
| **Route** (neu) | Aufmacher, Teaser, kurzer Einstieg, dann Tag für Tag: Überschrift, zwei, drei Sätze, die Kacheln dieses Tages in Reihenfolge | Lange Wochenenden und Reisen über mehrere Destinationen |

Bei einer Route steht unter den Tagen ein Knopf **„Als Trip übernehmen“**. Er nimmt alle Places, die online sind, in einen neuen Trip. Das funktioniert genau wie heute bei den Stories: Der Trip hat noch kein Datum, STAY gilt für die ganze Reise, mit und ohne Login.

## 2. Schemaänderung (additiv)

Neue, optionale Felder an `collection`:

- `format`: „Auswahl“ oder „Route“, Standard ist „Auswahl“
- `intro`: Einstieg, Text, höchstens 400 Zeichen
- `days[]`: Tage, nur sichtbar, wenn `format` = „Route“, zwei bis sieben Tage. Jeder Tag hat:
  - `label` (Pflicht, höchstens 24 Zeichen), z. B. „Tag 1 · Radstadt“
  - `title` (optional, höchstens 60 Zeichen), z. B. „Die Gondel“
  - `text` (optional, höchstens 300 Zeichen)
  - `items[]`: Verweise auf Place, Story oder Destination, ein bis sechs Einträge

Das bestehende Feld `items` bleibt. Bei einer Route ist es optional und wird nur gezeigt, wenn `days` leer ist. So bricht keine Collection, wenn jemand die Form umstellt.

## 3. Frontend

- `COLLECTION_QUERY` lädt zusätzlich `format`, `intro` und `days[]`, die Einträge mit `CARD_FIELDS`. Places, die offline sind, fallen wie überall raus.
- `app/collections/[slug]/page.tsx`: Ist die Form „Route“ und `days` gefüllt, werden die Tage gezeigt, sonst die Kacheln wie bisher.
- **Gestaltung:** Jeder Tag bekommt eine Zeile mit dem Label in Lime, eine große Überschrift, den Text und das bestehende Kachelraster. Keine neuen Kartenstile. Auf dem Handy steht alles untereinander.
- „Als Trip übernehmen“ nutzt die vorhandene `StoryTripActions`-Logik. Die Komponente wird so verallgemeinert, dass sie eine Liste von Einträgen annimmt.
- Ein Tag, dessen Einträge alle offline sind, verschwindet ganz.

## 4. Beispiel Ennstal

| Tag | Überschrift | Einträge |
|---|---|---|
| Tag 1 · Radstadt | Die Gondel | Story Radstadt, Golfclub Radstadt, Roßbrand, Sporthotel Radstadt |
| Tag 2 · Schladming | Das Inselgrün | Story Schladming, Golfclub Schladming-Dachstein, noa (sobald angelegt) |

## 5. Geänderte Dateien (geplant)

- `sanity/schemaTypes/collection.ts`
- `lib/sanity/queries.ts`, `lib/content.ts`, `lib/types.ts`
- `app/collections/[slug]/page.tsx`
- `components/StoryTripActions.tsx` (verallgemeinert, Verhalten bei Stories unverändert)
- `app/globals.css` (eigener, abgegrenzter Block)
- Neu: `tests/collection-route.test.cjs`

## 6. Abnahmekriterien

- [ ] Bestehende Collections sehen aus wie vorher.
- [ ] Eine Route zeigt die Tage in Reihenfolge, auf dem Desktop und bei 390 px ohne horizontales Scrollen.
- [ ] Offline-Places fehlen, ein leerer Tag verschwindet.
- [ ] „Als Trip übernehmen“ legt einen Trip mit allen Places an, die online sind.
- [ ] „Als Trip übernehmen“ funktioniert bei Stories weiter wie bisher.
- [ ] Typecheck, Lint, Tests und Build sind grün.

## 7. Bewusst nicht enthalten

- Die Einträge eines Trips Tagen zuordnen. Dafür müsste sich der Reiseplaner ändern. Das wäre ein eigener Schritt.
- Fahrzeiten zwischen den Tagen und eine Karte.
