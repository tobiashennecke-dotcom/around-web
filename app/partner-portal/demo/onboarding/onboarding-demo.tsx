"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { proposalFromParams,proposalUrl } from "@/lib/partner-os/demo-proposal";
import { readDemoEvents,writeDemoEvents,formatDemoDate } from "@/lib/partner-os/demo-schedule";
import styles from "../portal.module.css";
const steps=[
 {title:"Basisdaten",desc:"Wer seid ihr und wie erreichen wir euch?",fields:["Offizieller Name","Adresse","Website","Ansprechpartner"]},
 {title:"Logo & Marke",desc:"Dein visueller Auftritt bei AROUND.",fields:["Logo","Markenhinweise"]},
 {title:"Deine Bildwelt",desc:"Zeig uns, was deinen Ort besonders macht.",fields:["Hero-Motiv","Weitere Motive","Bildrechte und Credits"]},
 {title:"PLAY / STAY / EAT / DO",desc:"Was sollte man vor Ort unbedingt erleben?",fields:["Dein Ort","Besondere Erlebnisse","Insiderwissen"]},
 {title:"Packages",desc:"Angebote und Konditionen für unsere Community.",fields:["Angebotstitel","Leistungen und Preis"]},
 {title:"Vorschau & Freigabe",desc:"Prüfe deine Angaben und sende deinen Veröffentlichungswunsch an AROUND.",fields:["Faktencheck","Korrekturwünsche"]},
 {title:"AROUND Review & Launch",desc:"AROUND prüft Material, Terminwünsche und Veröffentlichung. Nur AROUND kann den Launch freigeben.",fields:[]}
] as const;
export default function OnboardingDemo(){
 const params=useSearchParams(),proposal=proposalFromParams(params);
 const [active,setActive]=useState(0),[done,setDone]=useState<number[]>([]);
 const [fields,setFields]=useState<Record<string,string>>({});
 const [files,setFiles]=useState<Record<string,string>>({});
 const [launch,setLaunch]=useState("2026-11-01");
 const [packageStart,setPackageStart]=useState("2026-11-01");
 const [packageEnd,setPackageEnd]=useState("2027-01-31");
 const [submitted,setSubmitted]=useState(false);
 const [scheduleError,setScheduleError]=useState("");
 const progress=Math.round(done.length/steps.length*100);
 const step=steps[active];
 function complete(){if(active===steps.length-1)return;setDone(current=>current.includes(active)?current:[...current,active]);setActive(current=>Math.min(steps.length-1,current+1));}
 function submitRequest(){
  if(!launch||!packageStart||!packageEnd||packageEnd<packageStart){setScheduleError("Bitte einen Launch und eine gültige Angebotslaufzeit auswählen.");return;}
  try{
   const current=readDemoEvents().filter(e=>!e.id.startsWith("partner-request-"));
   const events=[
    {id:"partner-request-launch",partner:proposal.partner,title:"Gewünschter Partner Launch",kind:"launch" as const,start:launch,end:launch,status:"requested" as const},
    {id:"partner-request-package",partner:proposal.partner,title:"Gewünschte Package-Laufzeit",kind:"package" as const,start:packageStart,end:packageEnd,status:"requested" as const}
   ];
   writeDemoEvents([...current,...events]);setSubmitted(true);setScheduleError("");
  }catch{setScheduleError("Die Demo-Termine konnten in diesem Browser nicht gespeichert werden.");}
 }
 return <main className={styles.page}><div className={styles.wrap}><div className={styles.top}><span>AROUND / YOUR PARTNERSHIP</span><span>ONBOARDING DEMO · NO UPLOAD</span></div>
 <header className={styles.hero}><div className={styles.kicker}>LET'S TELL YOUR STORY.</div><h1>From yes<br/>to <em>live.</em></h1><p>Schritt für Schritt zu deinem Auftritt auf AROUND. Wir zeigen dir, was wir brauchen und was als Nächstes passiert.</p><div className={styles.tag}>{proposal.partner}</div></header>
 <div className={styles.progressLabel}><span>YOUR PROGRESS</span><strong>{progress}%</strong></div><div className={styles.progress}><div style={{width:`${progress}%`}}/></div>
 <div className={styles.columns}><nav className={styles.paper} aria-label="Onboarding-Schritte"><div className={styles.kicker}>YOUR ROADMAP</div>{steps.map((s,i)=><button key={s.title} className={styles.step+(active===i?" "+styles.current:"")} onClick={()=>setActive(i)}><span>{done.includes(i)?"✓":i===steps.length-1?"↗":String(i+1).padStart(2,"0")}</span><span><strong>{s.title}</strong><small>{i===steps.length-1?(submitted?"Terminwunsch zur Demo-Prüfung eingereicht":"AROUND-Freigabe ausstehend"):done.includes(i)?"Demo-Schritt erledigt":i===active?"Gerade geöffnet":"Noch offen"}</small></span><span>↗</span></button>)}</nav>
 <section className={styles.dark}><div className={styles.kicker}>STEP {String(active+1).padStart(2,"0")} / {String(steps.length).padStart(2,"0")}</div><h2>{step.title}</h2><p>{step.desc}</p>{step.fields.map(field=><label className={styles.field} key={field}><span>{field}</span>{/Logo|Motiv|Bildrechte/.test(field)?<><input type="file" accept="image/*,.pdf" onChange={e=>setFiles(v=>({...v,[field]:e.target.files?.[0]?.name||""}))}/><small>{files[field]?"Lokal ausgewählt: "+files[field]:"Demo: Datei bleibt ausschließlich in deinem Browser und wird nicht hochgeladen."}</small></>:<textarea rows={2} value={fields[field]||""} onChange={e=>setFields(v=>({...v,[field]:e.target.value}))} placeholder="Deine Angaben …"/>}</label>)}
 {active===4&&<div className={styles.schedule}><h3>Package-Laufzeit</h3><p className={styles.small}>Dein Wunschtermin wird von AROUND geprüft und ist noch nicht bestätigt.</p><label className={styles.field}>Startdatum<input type="date" value={packageStart} onChange={e=>{setPackageStart(e.target.value);setSubmitted(false);}}/></label><label className={styles.field}>Enddatum<input type="date" min={packageStart} value={packageEnd} onChange={e=>{setPackageEnd(e.target.value);setSubmitted(false);}}/></label></div>}
 {active===6?<div className={styles.schedule}><div className={styles.kicker}>REQUESTED, NOT PUBLISHED</div><h3>Plan your launch.</h3><label className={styles.field}>Gewünschter Launch<input type="date" value={launch} onChange={e=>{setLaunch(e.target.value);setSubmitted(false);}}/></label><label className={styles.field}>Package-Start<input type="date" value={packageStart} onChange={e=>{setPackageStart(e.target.value);setSubmitted(false);}}/></label><label className={styles.field}>Package-Ende<input type="date" min={packageStart} value={packageEnd} onChange={e=>{setPackageEnd(e.target.value);setSubmitted(false);}}/></label>{scheduleError&&<p role="alert">{scheduleError}</p>}{submitted?<div className={styles.notice}><strong>Terminwunsch in der Demo vorgemerkt ✓</strong><p>Launch: {formatDemoDate(launch)}<br/>Package: {formatDemoDate(packageStart)} – {formatDemoDate(packageEnd)}</p><p>AROUND muss die Veröffentlichung noch freigeben. Der letzte Schritt bleibt bis dahin offen.</p><Link href="/commercial/calendar">DEMO: AROUND-KALENDER ANSEHEN ↗</Link></div>:<button className={styles.button} type="button" onClick={submitRequest}>TERMINWUNSCH ZUR PRÜFUNG EINREICHEN ↗</button>}</div>:<button className={styles.button} onClick={complete}>{done.includes(active)?"NÄCHSTEN SCHRITT ANSEHEN ↗":"DEMO-SCHRITT ABSCHLIESSEN ↗"}</button>}
 <p className={styles.small}>Alle Angaben und Datei-Auswahlen sind lokale Demo-Eingaben. Nur Demo-Terminwünsche werden im Browser gespeichert, damit du sie im Demo-Kalender siehst. Keine Übermittlung, keine echte Freigabe oder Veröffentlichung.</p></section></div>
 <footer className={styles.footer}><Link href={proposalUrl(proposal)}>← ZUR ANGEBOTSVORSCHAU</Link><span>AROUND / PARTNER OS LAB</span></footer></div></main>;
}