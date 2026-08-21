# AROUND — Pre-Live-Launch Checklist

Diese Liste sammelt Punkte, die für den aktuellen Produktaufbau nicht blockieren, aber vor dem öffentlichen Launch sauber abgeschlossen werden müssen.

## Auth & E-Mail — BLOCKER VOR LIVE

- [ ] Eigene Transaktions-Mail-Lösung auswählen (z. B. Brevo, Resend oder Postmark)
- [ ] Absender auf AROUND-Domain einrichten, z. B. `login@thisisaround.de` oder `hello@thisisaround.de`
- [ ] Custom SMTP in Supabase korrekt hinterlegen
- [ ] SPF/DKIM/DMARC für `thisisaround.de` konfigurieren und Zustellbarkeit testen
- [ ] Supabase Magic-Link-Template auf serverseitigen `token_hash`-Flow umstellen
- [ ] `/auth/confirm` mit neuem Magic Link Ende-zu-Ende testen
- [ ] Prüfen: nach Login steht im Header `ACCOUNT` statt `ANMELDEN`
- [ ] Prüfen: Gast-Saves und Gast-Collections werden nach Login in Supabase übernommen
- [ ] Prüfen: Logout und erneuter Login auf Desktop + iPhone
- [ ] Rate Limits und E-Mail-Branding prüfen

## Domain & Production

- [ ] `thisisaround.de` mit Vercel verbinden
- [ ] `NEXT_PUBLIC_SITE_URL` auf finale Domain umstellen
- [ ] Supabase Site URL / Redirect URLs auf finale Domain ergänzen
- [ ] Sanity CORS für finale Domain ergänzen
- [ ] Preview-/Vercel-Domains nur dort belassen, wo sie noch benötigt werden

## Launch QA

- [ ] Safari iPhone
- [ ] Safari macOS
- [ ] Chrome Desktop
- [ ] Login / Logout / Save / Collection vollständig testen
- [ ] SEO Metadata / OpenGraph / Social Image prüfen
- [ ] Impressum / Datenschutz / Consent / Analytics finalisieren
