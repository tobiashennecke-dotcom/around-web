# AROUND — Launch Runbook: Mail, Domain, Rechtliches

Schritt-für-Schritt-Anleitung für die Punkte aus [PRE_LIVE_LAUNCH.md](../PRE_LIVE_LAUNCH.md), die nicht im Code erledigt werden können. Reihenfolge einhalten: Domain → Mail → Auth → QA.

## 1. Rechtsseiten ausfüllen (10 Min.)

Alle Angaben stehen in **`lib/legal.ts`**. Jeder Wert in `[eckigen Klammern]` ist ein Platzhalter.

- Solange ein Platzhalter übrig ist, zeigen `/impressum` und `/datenschutz` einen ENTWURF-Hinweis und sind `noindex`.
- Optionale Zeilen (`representative`, `register`, `vatId`, `phone`) auf `""` setzen, wenn sie nicht zutreffen.
- `supabaseRegion`: Supabase Dashboard → Project Settings → General → Region.
- Datenschutztext vor dem Launch einmal rechtlich prüfen lassen (z. B. Generator von eRecht24 / Datenschutz-Generator.de als Abgleich oder Anwalt). Der Text beschreibt die Dienste, die der Code heute nutzt; jeder neue Dienst (Analytics, Maps, Stripe …) muss vorher dort ergänzt werden.
- Auftragsverarbeitungsverträge (AVV/DPA) abschließen bzw. im jeweiligen Dashboard akzeptieren: Vercel, Supabase, Sanity, Brevo.

## 2. Domain `thisisaround.de` mit Vercel verbinden

1. Vercel → Projekt → Settings → Domains → `thisisaround.de` und `www.thisisaround.de` hinzufügen. Eine davon als Hauptdomain, die andere leitet weiter.
2. Beim Domain-Registrar die DNS-Einträge setzen, die Vercel anzeigt (Apex: A-Record; `www`: CNAME). Bestehende MX-Einträge für E-Mail **nicht** löschen.
3. Warten bis Vercel „Valid Configuration“ + SSL zeigt.
4. Vercel → Settings → Environment Variables, Scope **Production**: `NEXT_PUBLIC_SITE_URL=https://thisisaround.de` (ohne Slash am Ende). Danach neu deployen — Sitemap, robots und OpenGraph-URLs hängen davon ab.
5. Prüfen: `https://thisisaround.de/robots.txt` und `/sitemap.xml` zeigen die finale Domain.

## 3. Supabase auf die Domain umstellen

Supabase → Authentication → URL Configuration:

- **Site URL:** `https://thisisaround.de`
- **Redirect URLs:** `https://thisisaround.de/**`, dazu nur die Preview-Domains, die wirklich gebraucht werden, und `http://localhost:3000/**` für lokale Entwicklung.

Außerdem (aus dem Health Check): Authentication → Settings → **Leaked password protection** aktivieren, falls der Plan es anbietet.

## 4. Sanity CORS

sanity.io/manage → Projekt → API → CORS Origins: `https://thisisaround.de` (mit „Allow credentials“, damit `/studio` auf der Live-Domain funktioniert). Alte Preview-Origins nur behalten, wenn noch benötigt.

## 5. Transaktions-Mail (Login-Links) über Brevo

Brevo ist im Code schon für Newsletter angebunden, daher ist es die naheliegende Wahl auch für Login-Mails (ein Anbieter, ein AVV).

1. Brevo → Senders, Domains & Dedicated IPs → Domains → `thisisaround.de` hinzufügen.
2. Die angezeigten DNS-Einträge beim Registrar setzen:
   - **Brevo-Code** (TXT, Verifizierung)
   - **DKIM** (TXT oder CNAME, wie Brevo ihn anzeigt)
   - **SPF**: es darf nur **einen** SPF-TXT-Eintrag geben. Existiert schon einer (z. B. für das Postfach), `include:spf.brevo.com` dort ergänzen, z. B. `v=spf1 include:spf.brevo.com include:<bestehender-anbieter> ~all`.
   - **DMARC** (TXT auf `_dmarc.thisisaround.de`), zum Start: `v=DMARC1; p=none; rua=mailto:<deine-adresse>` — nach zwei, drei Wochen ohne Probleme auf `p=quarantine` erhöhen.
3. Absender anlegen, z. B. `login@thisisaround.de` (Name: AROUND).
4. Brevo → SMTP & API → SMTP: Host, Port (587) und Login notieren, einen **SMTP-Key** erzeugen (nicht der API-Key).
5. Supabase → Authentication → Emails → SMTP Settings → **Enable Custom SMTP**: Host `smtp-relay.brevo.com`, Port `587`, User = Brevo-SMTP-Login, Passwort = SMTP-Key, Sender `login@thisisaround.de`, Name `AROUND`.
6. Supabase → Authentication → Rate Limits: E-Mail-Limit an erwartetes Volumen anpassen (Standard ist sehr niedrig, sobald Custom SMTP aktiv ist, kann es erhöht werden).

## 6. Magic-Link-Template auf `token_hash` umstellen

Die Route `app/auth/confirm/route.ts` erwartet `token_hash` und `type`. Supabase → Authentication → Emails → Templates → **Magic Link** (und genauso **Confirm signup**), Link ersetzen durch:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Bei AROUND anmelden</a>
```

Betreff/Text auf Deutsch und im AROUND-Ton setzen. Danach mit einer echten Adresse testen (Gmail **und** ein Outlook/GMX-Postfach, Spam-Ordner prüfen). Mit mail-tester.com eine Testmail auf Score ≥ 9 prüfen.

## 7. Abschluss-QA

Die Punkte „Launch QA“ und „Trips / Planning“ in [PRE_LIVE_LAUNCH.md](../PRE_LIVE_LAUNCH.md) auf Safari iPhone, Safari macOS und Chrome Desktop durchgehen. Dabei mit einem **Test-Konto**, nicht mit echten Nutzerdaten.

## Bewusst noch offen (Entscheidung nötig)

- **Konto löschen:** Es gibt keine Funktion zum Löschen des eigenen Kontos. Bis dahin Löschanfragen per E-Mail manuell im Supabase-Dashboard bearbeiten (die Datenschutzerklärung nennt diesen Weg). Eine Self-Service-Löschung braucht eine serverseitige Route mit Service-Role-Key.
- **Analytics:** Aktuell gibt es nur die eigenen `user_events` für eingeloggte Nutzer. Für Reichweitenmessung wäre ein cookieloses Tool (z. B. Vercel Web Analytics, Plausible) ohne Consent-Banner möglich; jedes Tool mit Cookies braucht einen Consent-Banner. Vor Einbau Datenschutzerklärung ergänzen.
- **Premium:** Siehe [PREMIUM.md](../PREMIUM.md) — vor dem ersten Euro muss der Story-Body aus dem öffentlichen Sanity-Dataset raus.
