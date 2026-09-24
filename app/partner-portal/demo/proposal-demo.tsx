"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { proposalFromParams,proposalTotals,proposalUrl } from "@/lib/partner-os/demo-proposal";
import styles from "./portal.module.css";
const money=(n:number)=>n.toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";
export default function ProposalDemo(){
 const params=useSearchParams();
 const proposal=proposalFromParams(params),{plan,addons,net,tax,gross}=proposalTotals(proposal);
 return <main className={styles.page}><div className={styles.wrap}>
 <div className={styles.top}><span>AROUND / PARTNERSHIP PROPOSAL</span><span>INTERACTIVE PREVIEW · NOT A CONTRACT</span></div>
 <header className={styles.hero}><div className={styles.kicker}>GREAT PLACES. BETTER TOGETHER.</div><h1>Welcome to<br/><em>AROUND.</em></h1><p>Ein besonderer Ort verdient mehr als einen Eintrag. Hier beginnt unsere mögliche Zusammenarbeit.</p><div className={styles.tag}>PREVIEW / {proposal.partner}</div></header>
 <div className={styles.columns}><section className={styles.paper}><div className={styles.kicker}>01 / YOUR PARTNERSHIP</div><h2>{plan.name}</h2><p>{plan.tagline}</p>{proposal.founding&&<div className={styles.founding}>FOUNDING PARTNER · SONDERKONDITION IM ERSTEN JAHR · VORBEHALTLICH BESTÄTIGUNG</div>}<h3>Was enthalten ist</h3><ul>{plan.features.map(feature=><li key={feature}>{feature}</li>)}</ul><p className={styles.small}>Werbeleistungen werden gekennzeichnet. Redaktionelle Empfehlungen und unabhängige Auswahl sind nicht käuflich.</p></section>
 <aside className={styles.dark}><div className={styles.kicker}>02 / YOUR INVESTMENT</div><h2>Made for<br/>your place.</h2><div className={styles.line}><span>{plan.name} / {proposal.founding?"Founding, Jahr 1":"Jahr 1"}</span><strong>{money(proposal.founding?plan.foundingPrice:plan.price)}</strong></div>{addons.map(a=><div className={styles.line} key={a.id}><span>{a.name}</span><strong>{money(a.price)}</strong></div>)}<div className={styles.totals}><div><span>Netto</span><strong>{money(net)}</strong></div><div><span>USt. 19 % (Beispiel)</span><strong>{money(tax)}</strong></div><div><span>Gesamt</span><strong>{money(gross)}</strong></div></div><p className={styles.small}>Unverbindliche Produktdemo. Laufzeit, Leistungszeitraum, Zahlungsbedingungen, Widerrufs- bzw. Rücktrittsfragen und finale Vertragsunterlagen sind hier nicht festgelegt.</p><Link className={styles.button} href={proposalUrl(proposal,"/partner-portal/demo/onboarding")}>DEMO: ONBOARDING ANSEHEN ↗</Link><p className={styles.small}>Dieser Button simuliert die nächste Phase. Es wird kein Angebot angenommen, keine E-Mail versendet und keine Zahlung ausgelöst.</p></aside></div>
 <footer className={styles.footer}>AROUND · GOLF IS WHERE THE JOURNEY STARTS. <Link href="/partners">FOR PARTNERS ↗</Link></footer></div></main>;
}