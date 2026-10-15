"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "../commercial.module.css";
const seed=[
 ["Basisdaten","Name, Adresse, Website und Ansprechpartner vollständig"],
 ["Brand Assets","Logo / Wortmarke in geeigneter Qualität"],
 ["Bildwelt","Hero + Galerie für die vereinbarte Darstellung"],
 ["PLAY / STAY / EAT / DO","Relevante Informationen und Besonderheiten"],
 ["Packages","Aktuelle Angebote, Laufzeiten und Konditionen"],
 ["Freigabe","Partner prüft faktische Angaben und Werbeleistungen"],
 ["Publish","AROUND veröffentlicht den vereinbarten Partnerumfang"]
] as const;
export default function Onboarding(){
 const [done,setDone]=useState<number[]>([0]);
 const progress=Math.round(done.length/seed.length*100);
 const next=useMemo(()=>seed.findIndex((_,i)=>!done.includes(i)),[done]);
 return <main className={styles.page}><div className={styles.wrap}>
  <header className={styles.head}><div><div className={styles.eyebrow}>AROUND / PARTNER OPERATIONS / ONBOARDING LAB</div><h1>From yes<br/>to live<span style={{color:"#93b52b"}}>.</span></h1><p>Ein klarer Material- und Freigabeprozess, damit eine Partnerschaft nicht nach dem Abschluss in E-Mails und offenen Dateien hängen bleibt.</p></div><span className={styles.pill}>INTERACTIVE DEMO</span></header>
  <nav className={styles.toolNav}><Link href="/commercial">Pipeline</Link><Link href="/commercial/offer">Offer Builder</Link><strong>Onboarding</strong></nav>
  <div className={styles.onboardGrid}><section className={styles.board}><div className={styles.progressHead}><div><div className={styles.eyebrow}>DEMO PARTNER / ONBOARDING</div><h2>Alpine Hideaway</h2></div><strong>{progress}%</strong></div><div className={styles.progress}><i style={{width:`${progress}%`}}/></div>
  <div>{seed.map(([title,copy],i)=><button key={title} type="button" className={styles.task} onClick={()=>setDone(v=>v.includes(i)?v.filter(x=>x!==i):[...v,i])}><span className={done.includes(i)?styles.taskDone:""}>{done.includes(i)?"✓":String(i+1).padStart(2,"0")}</span><span><strong>{title}</strong><small>{copy}</small></span><b>{done.includes(i)?"ERLEDIGT":"OFFEN"}</b></button>)}</div></section>
  <aside className={styles.side}><div className={styles.eyebrow}>NEXT BEST ACTION</div><h3>{next>=0?seed[next][0]:"Ready to publish."}</h3><p>{next>=0?seed[next][1]:"Alle vereinbarten Onboarding-Schritte sind in dieser Demo abgeschlossen."}</p><div className={styles.detail}><strong>Später im echten Partner OS</strong><p>Partner sehen nur ihre eigenen Aufgaben. Uploads, Freigaben und Status werden nachvollziehbar gespeichert. AROUND behält die redaktionelle Veröffentlichungshoheit.</p></div></aside></div>
  <footer className={styles.foot}><p className={styles.muted}>Demo ohne Upload und Speicherung. Die spätere Datenstruktur wird erst nach ausdrücklicher Freigabe des Supabase-Schemas umgesetzt.</p></footer>
 </div></main>;
}