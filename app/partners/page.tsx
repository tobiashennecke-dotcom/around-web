import type { Metadata } from "next";
import Link from "next/link";
import { PARTNER_PLANS, DESTINATION_PLANS } from "@/lib/partner-os/catalog";
import styles from "./partners.module.css";

export const metadata: Metadata = {
  title: "For Partners — AROUND",
  description: "Hotels, Golfclubs und Destinationen: Entdecke Partnerschaften mit AROUND."
};

export default function PartnersPage() {
  return <main className={styles.page}>
    <section className={styles.hero}><div className={styles.wrap}>
      <div className={styles.eyebrow}>AROUND / FOR PARTNERS</div>
      <h1>Great places.<br/><em>Worth telling.</em></h1>
      <p>Golf is where the journey starts. Wir verbinden besondere Hotels, Golfplätze und Destinationen mit Menschen, die mehr als nur eine Runde suchen.</p>
      <Link className={styles.cta} href="/partners/apply">Partnerschaft zusammenstellen <span aria-hidden>↗</span></Link>
    </div></section>
    <section className={styles.section}><div className={styles.wrap}>
      <div className={styles.eyebrow}>01 / PLACES</div><h2>Dein Ort. Unsere Welt.</h2>
      <p className={styles.intro}>Ein kuratiertes Profil, echte Geschichten und klar definierte Vermarktungsleistungen. Keine gekaufte redaktionelle Auszeichnung.</p>
      <div className={styles.grid}>{PARTNER_PLANS.map(plan=><article className={styles.plan} key={plan.id}>
        <div className={styles.eyebrow}>{plan.name}</div><h3>{plan.tagline}</h3>
        <p className={styles.price}>{plan.price.toLocaleString("de-DE")} € <small>/ Jahr zzgl. USt.</small></p>
        <p className={styles.founding}>Founding Partner: {plan.foundingPrice.toLocaleString("de-DE")} € im ersten Jahr*</p>
        <ul>{plan.features.map(feature=><li key={feature}>{feature}</li>)}</ul>
        <Link href={`/partners/apply?plan=${plan.id}`} className={styles.planLink}>Angebot anfragen ↗</Link>
      </article>)}</div>
      <p className={styles.note}>*Founding-Konditionen vorbehaltlich Verfügbarkeit; maximal 20 qualifizierte Place-Partner. Preise netto. Veröffentlichung nach Materialeingang und Freigabe.</p>
    </div></section>
    <section className={styles.sectionDark}><div className={styles.wrap}>
      <div className={styles.eyebrow}>02 / DESTINATIONS</div><h2>Make the whole trip matter.</h2>
      <p className={styles.intro}>Von einzelnen Golfplätzen zur Geschichte einer ganzen Region: PLAY, STAY, EAT und DO in einem gemeinsamen Reisekontext.</p>
      <div className={styles.grid}>{DESTINATION_PLANS.map(plan=><article className={styles.plan} key={plan.id}>
        <div className={styles.eyebrow}>{plan.name}</div><p className={styles.price}>{plan.price.toLocaleString("de-DE")} € <small>/ Jahr zzgl. USt.</small></p>
        <p className={styles.founding}>Founding: {plan.foundingPrice.toLocaleString("de-DE")} €*</p>
        <ul>{plan.features.map(feature=><li key={feature}>{feature}</li>)}</ul>
        <Link href={`/partners/apply?plan=${plan.id}`} className={styles.planLink}>Destination anfragen ↗</Link>
      </article>)}</div>
    </div></section>
    <section className={styles.section}><div className={styles.wrap}>
      <div className={styles.eyebrow}>03 / HOW IT WORKS</div><h2>Easy to start. Built to last.</h2>
      <div className={styles.steps}>{["Paket auswählen","Individuelle Anfrage stellen","Material digital einreichen","AROUND prüft & veröffentlicht","Ergebnisse transparent auswerten"].map((step,i)=><div key={step}><span>{String(i+1).padStart(2,"0")}</span><strong>{step}</strong></div>)}</div>
      <Link className={styles.cta} href="/partners/apply">Partnerschaft anfragen ↗</Link>
    </div></section>
  </main>;
}
