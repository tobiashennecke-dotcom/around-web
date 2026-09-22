"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ALL_PARTNER_PLANS, PARTNER_ADDONS, type PartnerPlanId } from "@/lib/partner-os/catalog";
import styles from "../partners.module.css";

function ApplyForm() {
 const params=useSearchParams();
 const initial=params.get("plan");
 const [plan,setPlan]=useState<PartnerPlanId>(ALL_PARTNER_PLANS.some(p=>p.id===initial)?initial as PartnerPlanId:"featured");
 const [founding,setFounding]=useState(true);
 const [extras,setExtras]=useState<string[]>([]);
 const [company,setCompany]=useState("");
 const [person,setPerson]=useState("");
 const [email,setEmail]=useState("");
 const [website,setWebsite]=useState("");
 const [notes,setNotes]=useState("");
 const selected=ALL_PARTNER_PLANS.find(p=>p.id===plan)!;
 const selectedExtras=useMemo(()=>PARTNER_ADDONS.filter(a=>extras.includes(a.id)),[extras]);
 const total=(founding?selected.foundingPrice:selected.price)+selectedExtras.reduce((sum,a)=>sum+a.price,0);
 const subject=encodeURIComponent("AROUND Partneranfrage – "+selected.name+" – "+company);
 const body=encodeURIComponent([
   "Unverbindliche Partneranfrage (kein Vertragsabschluss)",
   "Unternehmen: "+company,"Kontakt: "+person,"E-Mail: "+email,"Website: "+website,
   "Paket: "+selected.name,"Founding-Konditionen angefragt: "+(founding?"Ja":"Nein"),
   "Zusatzleistungen: "+(selectedExtras.map(a=>a.name).join(", ")||"Keine"),
   "Unverbindlicher Gesamtpreis erstes Jahr netto: "+total+" EUR",
   "Nachricht: "+notes
 ].join("\n"));
 return <main className={styles.page}><section className={styles.section}><div className={styles.wrap}>
 <Link href="/partners" className={styles.back}>← Zurück zu den Partnerschaften</Link>
 <div className={styles.eyebrow}>AROUND / PARTNER APPLICATION</div>
 <h1 style={{fontSize:"clamp(42px,6vw,76px)",lineHeight:1,letterSpacing:"-.05em",margin:"0 0 18px"}}>Build your partnership.</h1>
 <p className={styles.intro}>Wähle dein Paket und stelle eine unverbindliche Anfrage. Wir stimmen anschließend die Details persönlich mit dir ab.</p>
 <div className={styles.formGrid}><div className={styles.form}>
  <label>Partnerschaft<select value={plan} onChange={e=>setPlan(e.target.value as PartnerPlanId)}>
   {ALL_PARTNER_PLANS.map(p=><option value={p.id} key={p.id}>{p.name} — {p.price.toLocaleString("de-DE")} € / Jahr</option>)}
  </select></label>
  <label className={styles.choice}><input type="checkbox" checked={founding} onChange={e=>setFounding(e.target.checked)}/>Founding-Partner-Konditionen anfragen (vorbehaltlich Verfügbarkeit)</label>
  <h2 style={{fontSize:25,margin:0}}>Optional dazu</h2>
  {PARTNER_ADDONS.map(a=><label className={styles.choice} key={a.id}><input type="checkbox" checked={extras.includes(a.id)} onChange={e=>setExtras(current=>e.target.checked?[...current,a.id]:current.filter(id=>id!==a.id))}/>{a.name} · {a.price} €</label>)}
  <h2 style={{fontSize:25,margin:0}}>Über dein Unternehmen</h2>
  <label>Hotel, Golfclub oder Organisation *<input required value={company} onChange={e=>setCompany(e.target.value)} maxLength={160}/></label>
  <label>Ansprechpartner *<input required value={person} onChange={e=>setPerson(e.target.value)} maxLength={120}/></label>
  <label>Geschäftliche E-Mail *<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={200}/></label>
  <label>Website<input type="url" placeholder="https://" value={website} onChange={e=>setWebsite(e.target.value)} maxLength={300}/></label>
  <label>Was möchtest du mit AROUND erreichen?<textarea rows={5} value={notes} onChange={e=>setNotes(e.target.value)} maxLength={2000}/></label>
  <p className={styles.muted}>Die Anfrage ist unverbindlich. Es wird kein Vertrag geschlossen und keine Zahlung ausgelöst. In dieser ersten Version öffnet sich dein E-Mail-Programm mit den ausgefüllten Angaben; ein serverseitiges Anfrageformular folgt mit der sicheren CRM-Anbindung.</p>
  <a className={styles.cta} aria-disabled={!company.trim()||!person.trim()||!email.includes("@")} href={company.trim()&&person.trim()&&email.includes("@")?`mailto:partners@thisisaround.de?subject=${subject}&body=${body}`:undefined}>Anfrage im E-Mail-Programm öffnen ↗</a>
 </div><aside className={styles.summary}><div className={styles.eyebrow}>YOUR PARTNERSHIP</div>
 <h2>{selected.name}</h2><p>{selected.tagline}</p>
 <p>Jahrespaket: {(founding?selected.foundingPrice:selected.price).toLocaleString("de-DE")} €</p>
 {selectedExtras.map(a=><p key={a.id}>{a.name}: {a.price} €</p>)}
 <hr/><strong>{total.toLocaleString("de-DE")} €</strong><p>Unverbindlicher Preis im ersten Jahr, netto zzgl. USt.</p>
 <p className={styles.muted}>Zusatzleistungen sind einmalig. Foto- und Reisekosten sind nicht enthalten. Founding-Preise werden erst mit der individuellen Angebotsbestätigung verbindlich.</p>
 </aside></div>
 </div></section></main>;
}
export default function PartnerApplyPage(){return <Suspense fallback={<main className={styles.page}><div className={styles.wrap}>Konfigurator wird geladen …</div></main>}><ApplyForm/></Suspense>}
