# AROUND Product Planning v1.7

## Neu

- Persönliche Trips unter `/my-around/trips`.
- Trip-Detail mit Tagen, Zeit-Slots, Notizen, Datum und Status.
- Collections lassen sich mit einem Klick in einen Trip überführen.
- Gespeicherte Inhalte können direkt aus MY AROUND einem bestehenden oder neuen Trip hinzugefügt werden.
- Neuer Mobile-Bereich `PLANEN` als Hub für Collections + Trips.
- Guest-first: Trips funktionieren ohne Login im Browser.
- Account-ready: bestehende Supabase-Tabellen `trips` und `trip_items` werden verwendet, sobald Auth wieder aktiv ist.
- Keine Datenbankmigration erforderlich.

## Produktlogik

`Discover → Save → Collection → Trip`

AROUND wird damit vom Discovery-/Save-Produkt erstmals zu einem leichten Reiseplaner, ohne in eine Buchungsmaschine abzurutschen.
