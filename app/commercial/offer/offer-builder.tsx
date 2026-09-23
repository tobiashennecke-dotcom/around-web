"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ALL_PARTNER_PLANS, PARTNER_ADDONS, type PartnerPlanId } from "@/lib/partner-os/catalog";
import styles from "../commercial.module.css";
import { proposalUrl } from "@/lib/partner-os/demo-proposal";
export default function OfferBuilder(){
 const [partner,setPartner]=useState("Demo Partner");
 const [plan,setPlan]=useState<PartnerPlanId>("featured");
 const [founding,setFounding]=useState(true);
 const [extras,setExtras]=useState<string[]>([]);
 const selected=ALL_PARTNER_PLANS.find(p=>p.id===plan)!;
 const add=useMemo(()=>PARTNER_ADDONS.filter(a=>extras.includes(a.id)),[extras]);
 const subtotal=(founding?selected.foundingPrice:selected.price)+add.reduce((n,a)=>n+a.price,0);
 const vat=subtotal*.19,total=subtotal+vat;
 return <main className={styles.page}><div className={styles.wrap}>
  <header className={styles.head}><div><div className={styles.eyebrow}>AROUND / COMMERCIAL / OFFER LAB</div><h1>Offer<br/>Builder<span style={{color:"#93b52b"}}>.</span></h1><p>Aus einem Paket wird ein nachvollziehbares Angebot – ohne Preischaos und ohne redaktionelle Leistungen mit käuflicher Empfehlung zu vermischen.</p></div><span className={styles.pill}>PREVIEW · NO SEND</span></header>
  <nav className={styles.toolNav}><Link href="/commercial">Pipeline</Link><strong>Offer Builder</strong><Link href="/commercial/onboarding">Onboarding</Link><Link href="/commercial/calendar">Campaign Calendar</Link></nav>
  <div className={styles.offerGrid}><section className={styles.board}><div className={styles.formStack}>
   <label>Partner<input value={partner} maxLength={160} onChange={e=>setPartner(e.target.value)}/></label>
   <label>Jahrespaket<select value={plan} onChange={e=>setPlan(e.target.value as PartnerPlanId)}>{ALL_PARTNER_PLANS.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
   <label className={styles.checkRow}><input type="checkbox" checked={founding} onChange={e=>setFounding(e.target.checked)}/> Founding-Kondition als Angebotsbasis</label>
   <div><div className={styles.eyebrow}>ADD-ONS</div>{PARTNER_ADDONS.map(a=><label className={styles.checkRow} key={a.id}><input type="checkbox" checked={extras.includes(a.id)} onChange={e=>setExtras(v=>e.target.checked?[...v,a.id]:v.filter(x=>x!==a.id))}/><span>{a.name}</span><strong>{a.price.toLocaleString("de-DE")} €</strong></label>)}</div>
   <p className={styles.muted}>Diese Vorschau erzeugt noch kein Dokument, versendet nichts und speichert keine Kundendaten.</p><Link className={styles.action} style={{textDecoration:"none",textAlign:"center"}} href={proposalUrl({partner,plan,founding,extras})} target="_blank" rel="noopener noreferrer">PARTNER-VORSCHAU ÖFFNEN ↗</Link>
  </div></section>
  <aside className={styles.offerSheet}><div className={styles.eyebrow}>AROUND / PARTNERSHIP PROPOSAL</div><h2>{partner||"Partner"}</h2><p className={styles.muted}>Unverbindliche Angebotsvorschau</p>{founding&&<p style={{display:"inline-block",border:"1px solid #c6ed4a",color:"#c6ed4a",padding:"8px 12px",fontSize:11,fontWeight:800,letterSpacing:".12em"}}>FOUNDING PARTNER · 1. JAHR · VORBEHALTLICH BESTÄTIGUNG</p>}<div className={styles.line}><span>{selected.name} · {founding?"Founding-Preis / 1. Jahr":"Regulär / 1. Jahr"}</span><strong>{(founding?selected.foundingPrice:selected.price).toLocaleString("de-DE")} €</strong></div>{add.map(a=><div className={styles.line} key={a.id}><span>{a.name}</span><strong>{a.price.toLocaleString("de-DE")} €</strong></div>)}<div className={styles.sum}><div><span>Netto</span><strong>{subtotal.toLocaleString("de-DE",{minimumFractionDigits:2})} €</strong></div><div><span>USt. 19 %</span><strong>{vat.toLocaleString("de-DE",{minimumFractionDigits:2})} €</strong></div><div><span>Gesamt</span><strong>{total.toLocaleString("de-DE",{minimumFractionDigits:2})} €</strong></div></div><p className={styles.muted}>Partnerschaft und Werbeleistungen begründen keine redaktionelle Empfehlung. Veröffentlichung und konkrete Termine werden individuell abgestimmt.</p></aside>
  </div>
 </div></main>;
}