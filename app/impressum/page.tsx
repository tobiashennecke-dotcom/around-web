import type { Metadata } from "next";
import { LegalDraftNotice } from "@/components/LegalDraftNotice";
import { LEGAL, legalComplete } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Impressum",
  robots: legalComplete ? undefined : { index: false }
};

export default function ImpressumPage() {
  return (
    <main>
      <section className="section legalPage">
        <div className="container legalInner">
          <div className="eyebrow lime">IMPRESSUM</div>
          <h1 className="sectionTitle legalTitle">IMPRESSUM</h1>
          <LegalDraftNotice />

          <h2>Angaben gemäß § 5 DDG</h2>
          <p>
            {LEGAL.operator}<br />
            {LEGAL.street}<br />
            {LEGAL.city}<br />
            {LEGAL.country}
          </p>
          {LEGAL.representative && <p>Vertreten durch: {LEGAL.representative}</p>}

          <h2>Kontakt</h2>
          <p>
            E-Mail: {LEGAL.email}
            {LEGAL.phone && <><br />Telefon: {LEGAL.phone}</>}
          </p>

          {LEGAL.register && (
            <>
              <h2>Registereintrag</h2>
              <p>{LEGAL.register}</p>
            </>
          )}

          {LEGAL.vatId && (
            <>
              <h2>Umsatzsteuer-ID</h2>
              <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: {LEGAL.vatId}</p>
            </>
          )}

          <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
          <p>{LEGAL.editorialResponsible}</p>

          <h2>Verbraucherstreitbeilegung</h2>
          <p>
            Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>

          <h2>Haftung für Links</h2>
          <p>
            AROUND verlinkt auf Websites von Golfclubs, Hotels, Restaurants und anderen Anbietern. Für deren
            Inhalte sind ausschließlich die jeweiligen Betreiber verantwortlich. Bei Bekanntwerden von
            Rechtsverletzungen entfernen wir solche Links umgehend.
          </p>
        </div>
      </section>
    </main>
  );
}
