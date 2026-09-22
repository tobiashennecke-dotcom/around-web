"use client";
import { useMemo, useState } from "react";
import styles from "./commercial.module.css";
type Stage="Neu"|"Qualifizierung"|"Kontakt"|"Angebot"|"Gewonnen";
type Lead={id:string;name:string;type:string;contact:string;plan:string;amount:number;stage:Stage;date:string;next:string;};
const initial:Lead[]=[
{id:"D-001",name:"Alpine Hideaway",type:"Hotel · Bayern",contact:"Demo-Kontakt A",plan:"SIGNATURE",amount:690,stage:"Neu",date:"22.09.",next:"Erstkontakt vorbereiten"},
{id:"D-002",name:"Coastal Golf Club",type:"Golfclub · Portugal",contact:"Demo-Kontakt B",plan:"FEATURED",amount:390,stage:"Qualifizierung",date:"21.09.",next:"Bildmaterial und Leistungsumfang klären"},
{id:"D-003",name:"Mountain Region",type:"Destination · Österreich",contact:"Demo-Kontakt C",plan:"EXPLORE",amount:1390,stage:"Kontakt",date:"20.09.",next:"Gespräch vereinbaren"},
{id:"D-004",name:"City Golf Escape",type:"Hotel · Deutschland",contact:"Demo-Kontakt D",plan:"ESSENTIAL",amount:190,stage:"Angebot",date:"18.09.",next:"Angebotsfreigabe prüfen"},
{id:"D-005",name:"Atlantic Links",type:"Golfclub · Portugal",contact:"Demo-Kontakt E",plan:"SIGNATURE",amount:690,stage:"Gewonnen",date:"17.09.",next:"Onboarding starten"}
];
const stages:Stage[]=["Neu","Qualifizierung","Kontakt","Angebot","Gewonnen"];
export default function CommercialDesk(){
 const [leads,setLeads]=useState(initial);
 const [query,setQuery]=useState("");
 const [stage,setStage]=useState("Alle");
 const [selected,setSelected]=useState<string|null>("D-001");
 const [notes,setNotes]=useState<Record<string,string>>({});
 const filtered=useMemo(()=>leads.filter(l=>(stage==="Alle"||l.stage===stage)&&[l.name,l.type,l.plan,l.contact].join(" ").toLowerCase().includes(query.toLowerCase())),[leads,stage,query]);
 const active=leads.find(l=>l.id===selected);
 const open=leads.filter(l=>l.stage!=="Gewonnen");
 const total=open.reduce((n,l)=>n+l.amount,0);
 return <main className={styles.page}><div className={styles.wrap}>
 <header className={styles.head}><div><div className={styles.eyebrow}>AROUND / PARTNER OPERATIONS / LAB 01</div><h1>Commercial<br/>Desk<span style={{color:"#93b52b"}}>.</span></h1><p>Vom ersten Interesse zur aktiven Partnerschaft. Eine Arbeitsoberfläche für Anfragen, nächste Schritte und transparente Angebote.</p></div><div className={styles.pill}>● INTERACTIVE DEMO · NO REAL DATA</div></header>
 <nav className={styles.toolNav}><strong>Pipeline</strong><a href="/commercial/offer">Offer Builder</a><a href="/commercial/onboarding">Onboarding</a></nav>\n <section className={styles.metrics} aria-label="Demo-Kennzahlen"><div className={styles.metric}><span>OFFENE ANFRAGEN</span><strong>{open.length.toString().padStart(2,"0")}</strong></div><div className={styles.metric}><span>NEU EINGEGANGEN</span><strong>{leads.filter(l=>l.stage==="Neu").length.toString().padStart(2,"0")}</strong></div><div className={styles.metric}><span>IN ANGEBOTSPHASE</span><strong>{leads.filter(l=>l.stage==="Angebot").length.toString().padStart(2,"0")}</strong></div><div className={styles.metric}><span>OFFENES ANGEBOTSVOLUMEN*</span><strong>{total.toLocaleString("de-DE")} €</strong></div></section>
 <div className={styles.sectionTitle}><h2>Partner pipeline</h2><span className={styles.muted}>DEMO / {filtered.length} EINTRÄGE</span></div>
 <div className={styles.layout}><section className={styles.board}><div className={styles.toolbar}><input aria-label="Partner suchen" placeholder="Partner, Paket oder Region suchen …" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Status filtern" value={stage} onChange={e=>setStage(e.target.value)}><option>Alle</option>{stages.map(s=><option key={s}>{s}</option>)}</select></div>
 <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Partner</th><th>Paket</th><th>Potenzial*</th><th>Status</th><th>Aktion</th></tr></thead><tbody>{filtered.map(l=><tr key={l.id}><td><strong>{l.name}</strong><small>{l.type} · {l.date}</small></td><td>{l.plan}</td><td>{l.amount.toLocaleString("de-DE")} €</td><td><span className={styles.status+" "+(l.stage==="Neu"?styles.new:styles.active)}>{l.stage}</span></td><td><button className={styles.action} type="button" onClick={()=>setSelected(l.id)}>Öffnen ↗</button></td></tr>)}</tbody></table>{filtered.length===0&&<p className={styles.empty}>Keine passenden Demo-Einträge.</p>}</div></section>
 <aside className={styles.side}><div className={styles.eyebrow}>NEXT BEST ACTION</div>{active?<><h3>{active.name}</h3><p className={styles.muted}>{active.type} · {active.id}</p><div className={styles.detail}><strong>Kontakt</strong><p>{active.contact} (Demo)</p><strong>Nächster Schritt</strong><p>{active.next}</p><strong>Status ändern (nur lokal)</strong><p><select aria-label="Demostatus ändern" value={active.stage} onChange={e=>setLeads(items=>items.map(l=>l.id===active.id?{...l,stage:e.target.value as Stage}:l))} style={{width:"100%",padding:12,background:"transparent"}}>{stages.map(s=><option key={s}>{s}</option>)}</select></p><strong>Interne Notiz (nur lokal)</strong><p><textarea aria-label="Demo-Notiz" value={notes[active.id]||""} onChange={e=>setNotes(current=>({...current,[active.id]:e.target.value}))} rows={4} placeholder="Was ist als Nächstes zu tun?" style={{width:"100%",padding:12,boxSizing:"border-box",background:"transparent"}}/></p></div></>:<><h3>Eintrag auswählen</h3><p>Öffne einen Partner aus der Pipeline.</p></>}
 <div className={styles.detail}><div className={styles.eyebrow}>WORKFLOW</div><ol><li>Anfrage prüfen und qualifizieren</li><li>Persönlichen Kontakt aufnehmen</li><li>Leistungen und Angebot abstimmen</li><li>Freigabe und Vertragsabschluss</li><li>Digitales Onboarding starten</li></ol></div></aside></div>
 <footer className={styles.foot}><p className={styles.muted}>* Alle Namen, Kontakte, Daten, Statuswerte und Beträge auf dieser Seite sind ausschließlich fiktive Beispieldaten. Änderungen bleiben nur bis zum Neuladen im Browser. Keine Verbindung zu echten Partneranfragen, kein Versand, kein Vertragsabschluss.</p></footer>
 </div></main>;
}
