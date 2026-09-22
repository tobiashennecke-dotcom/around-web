"use client";
import { useMemo, useRef, useState } from "react";
import Script from "next/script";
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
 const [turnstileToken,setTurnstileToken]=useState("");
 const [sending,setSending]=useState(false);
 const [feedback,setFeedback]=useState("");
 const widgetRef=useRef<HTMLDivElement>(null);
 const siteKey=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
 const [widgetReady,setWidgetReady]=useState(false);
 const renderWidget=()=>{ if(!widgetRef.current || !siteKey || widgetReady) return; const w=window as typeof window & {turnstile?:{render:(element:HTMLElement,options:{sitekey:string;callback:(token:string)=>void;"expired-callback":()=>void})=>unknown}}; if(w.turnstile){w.turnstile.render(widgetRef.current,{sitekey:siteKey,callback:setTurnstileToken,"expired-callback":()=>setTurnstileToken("")});setWidgetReady(true);} };
 const [person,setPerson]=useState("");
 const [email,setEmail]=useState("");
 const [website,setWebsite]=useState("");
 const [notes,setNotes]=useState("");
 const selected=ALL_PARTNER_PLANS.find(p=>p.id===plan)!;
 const selectedExtras=useMemo(()=>PARTNER_ADDONS.filter(a=>extras.includes(a.id)),[extras]);
 const total=(founding?selected.foundingPrice:selected.price)+selectedExtras.reduce((sum,a)=>sum+a.price,0);
 const submit=async(e:React.FormEvent<HTMLFormElement>)=>{
 e.preventDefault();setFeedback("");if(!turnstileToken||sending)return;setSending(true);
 try{
 const response=await fetch("/api/partner-inquiries",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({company,person,email,website,notes,plan,founding,extras,turnstileToken,honeypot:""})});
 if(!response.ok)throw new Error("request_failed");
 setFeedback("Vielen Dank! Deine Anfrage wurde übermittelt. Wir melden uns persönlich.");
 setTurnstileToken("");
 }catch{setFeedback("Die Anfrage konnte noch nicht gespeichert werden. Bitte versuche es später erneut.");}
 finally{setSending(false);}
 };
 return <main className={styles.page}><section className={styles.section}><div className={styles.wrap}>
 <Link href="/partners" className={styles.back}>← Zurück zu den Partnerschaften</Link>
 <div className={styles.eyebrow}>AROUND / PARTNER APPLICATION</div>
 <h1 style={{fontSize:"clamp(42px,6vw,76px)",lineHeight:1,letterSpacing:"-.05em",margin:"0 0 18px"}}>Build your partnership.</h1>
 <p className={styles.intro}>Wähle dein Paket und stelle eine unverbindliche Anfrage. Wir stimmen anschließend die Details persönlich mit dir ab.</p>
 <div className={styles.formGrid}><form className={styles.form} onSubmit={submit}>
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
  <p className={styles.muted}>Die Anfrage ist unverbindlich. Es wird kein Vertrag geschlossen und keine Zahlung ausgelöst. Die Founding-Konditionen werden erst nach Bestätigung verbindlich.</p>
  {siteKey && <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={renderWidget}/><div ref={widgetRef} aria-label="Spam-Schutz"/></>}
  {!siteKey && <p role="status">Das Anfrageformular wird gerade eingerichtet.</p>}
  {feedback && <p role="status">{feedback}</p>}
  <button className={styles.cta} type="submit" disabled={!siteKey||!turnstileToken||sending||!company.trim()||!person.trim()||!email.includes("@")}>{sending?"Wird gesendet …":"Unverbindliche Anfrage senden ↗"}</button>
 </form><aside className={styles.summary}><div className={styles.eyebrow}>YOUR PARTNERSHIP</div>
 <h2>{selected.name}</h2><p>{selected.tagline}</p>
 <p>Jahrespaket: {(founding?selected.foundingPrice:selected.price).toLocaleString("de-DE")} €</p>
 {selectedExtras.map(a=><p key={a.id}>{a.name}: {a.price} €</p>)}
 <hr/><strong>{total.toLocaleString("de-DE")} €</strong><p>Unverbindlicher Preis im ersten Jahr, netto zzgl. USt.</p>
 <p className={styles.muted}>Zusatzleistungen sind einmalig. Foto- und Reisekosten sind nicht enthalten. Founding-Preise werden erst mit der individuellen Angebotsbestätigung verbindlich.</p>
 </aside></div>
 </div></section></main>;
}
export default function PartnerApplyPage(){return <Suspense fallback={<main className={styles.page}><div className={styles.wrap}>Konfigurator wird geladen …</div></main>}><ApplyForm/></Suspense>}
