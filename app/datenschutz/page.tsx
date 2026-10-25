import type { Metadata } from "next";
import { LegalDraftNotice } from "@/components/LegalDraftNotice";
import { LEGAL, legalComplete } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Datenschutz",
  robots: legalComplete ? undefined : { index: false }
};

/**
 * Describes the services AROUND actually uses in code (Vercel, Sanity,
 * Supabase, Brevo, click-to-load embeds, browser storage). Any new
 * provider, tracking or cookie must be added here before it ships.
 */
export default function DatenschutzPage() {
  return (
    <main>
      <section className="section legalPage">
        <div className="container legalInner">
          <div className="eyebrow lime">DATENSCHUTZERKLÄRUNG</div>
          <h1 className="sectionTitle legalTitle">DATENSCHUTZ</h1>
          <LegalDraftNotice />

          <h2>1. Verantwortlicher</h2>
          <p>
            {LEGAL.operator}<br />
            {LEGAL.street}, {LEGAL.city}, {LEGAL.country}<br />
            E-Mail: {LEGAL.email}
          </p>

          <h2>2. Hosting und Server-Logs</h2>
          <p>
            Die Website wird bei Vercel Inc. (440 N Barranca Ave #4133, Covina, CA 91723, USA) gehostet.
            Beim Aufruf verarbeitet Vercel technisch notwendige Daten wie IP-Adresse, Zeitpunkt, aufgerufene
            Seite, Browser und Betriebssystem, um die Seite auszuliefern und vor Angriffen zu schützen.
            Rechtsgrundlage ist unser berechtigtes Interesse an einem sicheren, stabilen Betrieb
            (Art. 6 Abs. 1 lit. f DSGVO). Vercel ist unter dem EU-U.S. Data Privacy Framework zertifiziert;
            zusätzlich besteht ein Auftragsverarbeitungsvertrag mit Standardvertragsklauseln.
          </p>

          <h2>3. Redaktionelle Inhalte und Bilder</h2>
          <p>
            Texte und Bilder werden über Sanity (Sanity AS, Norwegen) ausgeliefert, Bilder über deren CDN.
            Dabei wird deine IP-Adresse an Sanity übertragen, damit die Inhalte geladen werden können
            (Art. 6 Abs. 1 lit. f DSGVO). Es werden dabei keine Nutzerprofile gebildet.
          </p>

          <h2>4. Konto und Anmeldung</h2>
          <p>
            Für My AROUND kannst du dich per E-Mail-Link (Magic Link) anmelden. Wir verarbeiten dafür deine
            E-Mail-Adresse und technische Anmeldedaten. Anbieter ist Supabase Inc. (USA); die Daten werden
            in der Region {LEGAL.supabaseRegion} gespeichert, mit Auftragsverarbeitungsvertrag und
            Standardvertragsklauseln. Rechtsgrundlage ist die Bereitstellung des von dir gewünschten
            Kontos (Art. 6 Abs. 1 lit. b DSGVO).
          </p>

          <h2>5. Gespeicherte Inhalte, Collections und Trips</h2>
          <p>
            Was du speicherst, sammelst und planst, legen wir in deinem Konto ab, damit es dir auf allen
            Geräten zur Verfügung steht (Art. 6 Abs. 1 lit. b DSGVO). Ohne Anmeldung bleiben diese Daten
            nur lokal in deinem Browser (siehe 8.). Wenn du angemeldet bist, speichern wir außerdem, welche
            Inhalte du ansiehst, speicherst oder zu einem Trip hinzufügst, um My AROUND und Empfehlungen zu
            verbessern (Art. 6 Abs. 1 lit. f DSGVO). Diese Ereignisse enthalten keine E-Mail-Adresse.
          </p>

          <h2>6. Newsletter und Benachrichtigungen</h2>
          <p>
            E-Mails wie das AROUND Journal oder Hinweise zu deinen Trips senden wir nur, wenn du sie in
            deinem Konto ausdrücklich aktiviert hast (Art. 6 Abs. 1 lit. a DSGVO). Für den Versand nutzen
            wir Brevo (Sendinblue GmbH, Köpenicker Straße 126, 10179 Berlin). Übermittelt werden deine
            E-Mail-Adresse, deine gewählten Themen und, nur bei aktivierten Trip-Hinweisen, einzelne
            Planungsereignisse. Du kannst jede Einwilligung jederzeit in deinem Konto oder über den Link in
            jeder E-Mail widerrufen.
          </p>

          <h2>7. Externe Medien</h2>
          <p>
            Videos und Audio von YouTube (im erweiterten Datenschutzmodus), Vimeo, Spotify und Apple
            Podcasts laden wir erst, wenn du auf den Player klickst. Erst dann werden Daten wie deine
            IP-Adresse an den jeweiligen Anbieter übertragen, der eigene Cookies setzen kann
            (Art. 6 Abs. 1 lit. a DSGVO). Es gelten die Datenschutzhinweise des Anbieters.
          </p>

          <h2>8. Cookies und lokale Speicherung</h2>
          <p>
            AROUND setzt keine Cookies zu Werbe- oder Analysezwecken. Für die Anmeldung werden technisch
            notwendige Cookies gesetzt. Ohne Konto speichert dein Browser deine gemerkten Inhalte,
            Collections und Trips lokal (localStorage); diese Daten verlassen dein Gerät nicht, bis du dich
            anmeldest. Beides ist für die von dir gewünschte Funktion unbedingt erforderlich
            (§ 25 Abs. 2 Nr. 2 TDDDG).
          </p>

          <h2>9. Speicherdauer</h2>
          <p>
            Kontodaten speichern wir, solange dein Konto besteht. Wenn du die Löschung deines Kontos
            verlangst, löschen wir die zugehörigen Daten, soweit keine gesetzlichen Aufbewahrungspflichten
            bestehen. Server-Logs werden vom Hoster nach kurzer Zeit automatisch gelöscht.
          </p>

          <h2>10. Deine Rechte</h2>
          <p>
            Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
            Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO) sowie auf Widerruf erteilter
            Einwilligungen mit Wirkung für die Zukunft. Schreib uns dafür an {LEGAL.email}. Außerdem kannst
            du dich bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO).
          </p>

          <p className="legalUpdated">Stand: {LEGAL.privacyUpdated}</p>
        </div>
      </section>
    </main>
  );
}
