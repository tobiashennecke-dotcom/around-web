"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { proposalFromParams,proposalUrl } from "@/lib/partner-os/demo-proposal";
import styles from "../portal.module.css";
const steps=[
 {title:"Basisdaten",desc:"Wer seid ihr und wie erreichen wir euch?",fields:["Offizieller Name","Adresse","Website","Ansprechpartner"]},
 {title:"Logo & Marke",desc:"Dein visueller Auftritt bei AROUND.",fields:["Logo","Markenhinweise"]},
 {title:"Deine Bildwelt",desc:"Zeig uns, was deinen Ort besonders macht.",fields:["Hero-Motiv","Weitere Motive","Bildrechte und Credits"]},
 {title:"PLAY / STAY / EAT / DO",desc:"Was sollte man vor Ort unbedingt erleben?",fields:["Dein Ort","Besondere Erlebnisse","Insiderwissen"]},
 {title:"Packages",desc:"Angebote und Konditionen für unsere Community.",fields:["Angebotstitel","Gültigkeit","Leistungen und Preis"]},
 {title:"Vorschau & Freigabe",desc:"Gemeinsam prüfen wir die Fakten vor Veröffentlichung.",fields:["Faktencheck","Korrekturwünsche"]},
 {title:"Publish",desc:"AROUND veröffentlicht den vereinbarten Umfang.",fields:["Geplanter Launch"]}
] as const;
export default function OnboardingDemo(){
 const params=useSearchParams(),proposal=proposalFromParams(params);
 const [active,setActive]=useState(0),[done,setDone]=useState<number[]>([]);
 const [fields,setFields]=useState<Record<string,string>>({});
 const [files,setFiles]=useState<Record<string,string>>({});
 const progress=Math.round(done.length/steps.length*100);
 const step=steps[active];
 function complete(){setDone(current=>current.includes(active)?current:[...current,active]);setActive(current=>Math.min(steps.length-1,current+1));}
 return <main className={styles.page}><div className={styles.wrap}><div className={styles.top}><span>AROUND / YOUR PARTNERSHIP</span><span>ONBOARDING DEMO · NO UPLOAD</span></div>
 <header className={styles.hero}><div className={styles.kicker}>LET'S TELL YOUR STORY.</div><h1>From yes<br/>to <em>live.</em></h1><p>Schritt für Schritt zu deinem Auftritt auf AROUND. Wir zeigen dir, was wir brauchen und was als Nächstes passiert.</p><div className={styles.tag}>{proposal.partner}</div></header>
 <div className={styles.progressLabel}><span>YOUR PROGRESS</span><strong>{progress}%</strong></div><div className={styles.progress}><div style={{width:`${progress}%`}}/></div>
 <div className={styles.columns}><nav className={styles.paper} aria-label="Onboarding-Schritte"><div className={styles.kicker}>YOUR ROADMAP</div>{steps.map((s,i)=><button key={s.title} className={styles.step+(active===i?" "+styles.current:"")} onClick={()=>setActive(i)}><span>{done.includes(i)?"✓":String(i+1).padStart(2,"0")}</span><span><strong>{s.title}</strong><small>{done.includes(i)?"Demo-Schritt erledigt":i===active?"Gerade geöffnet":"Noch offen"}</small></span><span>↗</span></button>)}</nav>
 <section className={styles.dark}><div className={styles.kicker}>STEP {String(active+1).padStart(2,"0")} / {String(steps.length).padStart(2,"0")}</div><h2>{step.title}</h2><p>{step.desc}</p>{step.fields.map(field=><label className={styles.field} key={field}><span>{field}</span>{/Logo|Motiv|Bildrechte/.test(field)?<><input type="file" accept="image/*,.pdf" onChange={e=>setFiles(v=>({...v,[field]:e.target.files?.[0]?.name||""}))}/><small>{files[field]?"Lokal ausgewählt: "+files[field]:"Demo: Datei bleibt ausschließlich in deinem Browser und wird nicht hochgeladen."}</small></>:<textarea rows={2} value={fields[field]||""} onChange={e=>setFields(v=>({...v,[field]:e.target.value}))} placeholder="Deine Angaben …"/>}</label>)}<button className={styles.button} onClick={complete}>{done.includes(active)?"NÄCHSTEN SCHRITT ANSEHEN ↗":"DEMO-SCHRITT ABSCHLIESSEN ↗"}</button><p className={styles.small}>Alle Angaben und Datei-Auswahlen sind nur lokale Demo-Eingaben. Es erfolgt keine Speicherung oder Übermittlung. „Publish“ veröffentlicht nichts.</p></section></div>
 <footer className={styles.footer}><Link href={proposalUrl(proposal)}>← ZUR ANGEBOTSVORSCHAU</Link><span>AROUND / PARTNER OS LAB</span></footer></div></main>;
}