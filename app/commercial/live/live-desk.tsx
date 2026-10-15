"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "../commercial.module.css";
type Status="new"|"qualified"|"contacted"|"proposal"|"won"|"lost";
type Inquiry={id:string;created_at:string;organization_name:string;contact_name:string;email:string;website:string|null;message:string|null;plan_id:string;founding_requested:boolean;addon_ids:string[];quoted_total_eur:number;status:Status;source:string};
const labels:Record<Status,string>={new:"Neu",qualified:"Qualifizierung",contacted:"Kontakt",proposal:"Angebot",won:"Gewonnen",lost:"Verloren"};
const statuses=Object.keys(labels) as Status[];
export default function LiveDesk(){
 const [items,setItems]=useState<Inquiry[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState<string|null>(null);
 const [selected,setSelected]=useState<string|null>(null);
 const [query,setQuery]=useState("");
 const [filter,setFilter]=useState("all");
 const load=useCallback(async()=>{
  setLoading(true);setError("");
  try {
   const response=await fetch("/api/commercial/inquiries",{cache:"no-store",credentials:"same-origin"});
   if(!response.ok) throw new Error(response.status===403?"Kein Zugriff. Bitte mit dem freigegebenen AROUND-Konto anmelden.":"Partneranfragen derzeit nicht verfügbar.");
   const result=await response.json() as {inquiries:Inquiry[]};
   setItems(result.inquiries);setSelected(current=>current??result.inquiries[0]?.id??null);
  }catch(e){setError(e instanceof Error?e.message:"Abruf fehlgeschlagen.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);
 const filtered=useMemo(()=>items.filter(item=>(filter==="all"||item.status===filter)&&[item.organization_name,item.contact_name,item.email,item.plan_id].join(" ").toLowerCase().includes(query.toLowerCase())),[items,filter,query]);
 const active=items.find(item=>item.id===selected);
 const open=items.filter(item=>item.status!=="won"&&item.status!=="lost");
 async function changeStatus(item:Inquiry,status:Status){
  if(status===item.status)return;
  setBusy(item.id);setError("");
  try{
   const response=await fetch("/api/commercial/inquiries",{method:"PATCH",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({id:item.id,status})});
   if(!response.ok)throw new Error("Status konnte nicht gespeichert werden.");
   setItems(current=>current.map(entry=>entry.id===item.id?{...entry,status}:entry));
  }catch(e){setError(e instanceof Error?e.message:"Speichern fehlgeschlagen.");}
  finally{setBusy(null);}
 }
 return <main className={styles.page}><div className={styles.wrap}>
  <header className={styles.head}><div><div className={styles.eyebrow}>AROUND / PARTNER OPERATIONS / PRIVATE</div><h1>Commercial<br/>Desk<span style={{color:"#93b52b"}}>.</span></h1><p>Vertrauliche Partneranfragen. Nur für ausdrücklich freigegebene AROUND-Operatoren.</p></div><span className={styles.pill}>PRIVATE · LIVE DATA</span></header>
  <nav className={styles.toolNav}><strong>Anfragen</strong><Link href="/commercial/live/partners">Partnerverwaltung</Link><Link href="/commercial/live/calendar">Live Calendar</Link></nav>
  <section className={styles.metrics}><div className={styles.metric}><span>OFFENE ANFRAGEN</span><strong>{open.length}</strong></div><div className={styles.metric}><span>NEUE ANFRAGEN</span><strong>{items.filter(i=>i.status==="new").length}</strong></div><div className={styles.metric}><span>ANGEBOTE</span><strong>{items.filter(i=>i.status==="proposal").length}</strong></div><div className={styles.metric}><span>ANFRAGEVOLUMEN*</span><strong>{open.reduce((sum,i)=>sum+i.quoted_total_eur,0).toLocaleString("de-DE")} €</strong></div></section>
  <div className={styles.sectionTitle}><h2>Partner pipeline</h2><button className={styles.action} onClick={()=>void load()} disabled={loading}>↻ Aktualisieren</button></div>
  {error&&<p role="alert" style={{padding:18,border:"1px solid #a44"}}>{error}</p>}
  {loading?<p>Lade Partneranfragen …</p>:<div className={styles.layout}><section className={styles.board}><div className={styles.toolbar}><input aria-label="Partner suchen" placeholder="Partner, Kontakt oder Paket suchen …" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Status filtern" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Alle</option>{statuses.map(s=><option key={s} value={s}>{labels[s]}</option>)}</select></div><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Partner</th><th>Paket</th><th>Anfragewert*</th><th>Status</th><th>Details</th></tr></thead><tbody>{filtered.map(i=><tr key={i.id}><td><strong>{i.organization_name}</strong><small>{new Date(i.created_at).toLocaleDateString("de-DE")} · {i.contact_name}</small></td><td>{i.plan_id.toUpperCase()}</td><td>{i.quoted_total_eur.toLocaleString("de-DE")} €</td><td><span className={styles.status+" "+(i.status==="new"?styles.new:styles.active)}>{labels[i.status]}</span></td><td><button className={styles.action} onClick={()=>setSelected(i.id)}>Öffnen ↗</button></td></tr>)}</tbody></table>{filtered.length===0&&<p className={styles.empty}>Keine Anfragen für diese Auswahl.</p>}</div></section>
  <aside className={styles.side}><div className={styles.eyebrow}>PARTNER DETAIL</div>{active?<><h3>{active.organization_name}</h3><p className={styles.muted}>{active.plan_id.toUpperCase()} · {active.id}</p><div className={styles.detail}><strong>Kontakt</strong><p>{active.contact_name}<br/><a href={`mailto:${active.email}`}>{active.email}</a></p>{active.website&&<p><a href={active.website} target="_blank" rel="noopener noreferrer">Website ↗</a></p>}<strong>Anfrage</strong><p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{active.message||"Keine Nachricht"}</p><strong>Zusatzleistungen</strong><p>{active.addon_ids.join(", ")||"Keine"}</p><strong>Founding-Preis angefragt</strong><p>{active.founding_requested?"Ja":"Nein"}</p><strong>Status</strong><p><select aria-label="Partnerstatus ändern" value={active.status} disabled={busy===active.id} onChange={e=>void changeStatus(active,e.target.value as Status)} style={{width:"100%",padding:12,background:"transparent"}}>{statuses.map(s=><option key={s} value={s}>{labels[s]}</option>)}</select></p></div></>:<p>Partner auswählen.</p>}</aside></div>}
  <footer className={styles.foot}><p className={styles.muted}>* Angefragte Paketwerte, keine gebuchten Umsätze. Maximal die letzten 100 Anfragen. Änderungen am Status werden gespeichert; ein Angebot oder Vertrag wird dadurch nicht versendet.</p></footer>
 </div></main>;
}
