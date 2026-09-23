"use client";
import Link from "next/link";
import { useEffect,useMemo,useState } from "react";
import { DEMO_EVENTS,readDemoEvents,writeDemoEvents,formatDemoDate,type CampaignEvent } from "@/lib/partner-os/demo-schedule";
import styles from "../commercial.module.css";
const statusLabel:Record<CampaignEvent["status"],string>={requested:"Wunsch / Prüfung",confirmed:"Bestätigt",active:"Aktiv",completed:"Abgeschlossen"};
const kindLabel:Record<CampaignEvent["kind"],string>={launch:"Partner Launch",package:"Package",campaign:"Kampagne"};
const pad=(n:number)=>String(n).padStart(2,"0");
export default function CampaignCalendar(){
 const [events,setEvents]=useState<CampaignEvent[]>(DEMO_EVENTS);
 const [month,setMonth]=useState("2026-11");
 const [kind,setKind]=useState("all");
 const [status,setStatus]=useState("all");
 const [selected,setSelected]=useState<string|null>(null);
 useEffect(()=>{setEvents(readDemoEvents());const update=()=>setEvents(readDemoEvents());window.addEventListener("around-demo-schedule-change",update);window.addEventListener("storage",update);return()=>{window.removeEventListener("around-demo-schedule-change",update);window.removeEventListener("storage",update);};},[]);
 const [year,monthNumber]=month.split("-").map(Number);
 const first=new Date(year,monthNumber-1,1),days=new Date(year,monthNumber,0).getDate();
 const offset=(first.getDay()+6)%7;
 const visible=useMemo(()=>events.filter(e=>(kind==="all"||e.kind===kind)&&(status==="all"||e.status===status)),[events,kind,status]);
 const selectedEvent=events.find(e=>e.id===selected);
 const cells=Array.from({length:Math.ceil((offset+days)/7)*7},(_,i)=>i-offset+1);
 function shift(n:number){const d=new Date(year,monthNumber-1+n,1);setMonth(d.getFullYear()+"-"+pad(d.getMonth()+1));}
 function setEventStatus(id:string,next:CampaignEvent["status"]){const updated=events.map(e=>e.id===id?{...e,status:next}:e);setEvents(updated);writeDemoEvents(updated);}
 function reset(){setEvents(DEMO_EVENTS);writeDemoEvents(DEMO_EVENTS);setSelected(null);}
 return <main className={styles.page}><div className={styles.wrap}>
 <header className={styles.head}><div><div className={styles.eyebrow}>AROUND / PARTNER OPERATIONS / CAMPAIGN CALENDAR</div><h1>Every date.<br/>In view<span style={{color:"#93b52b"}}>.</span></h1><p>Launches, Packages und Kampagnen auf einer Zeitachse. Partnerwünsche bleiben von bestätigten Terminen getrennt.</p></div><span className={styles.pill}>INTERACTIVE DEMO · LOCAL DATA</span></header>
 <nav className={styles.toolNav}><Link href="/commercial">Pipeline</Link><Link href="/commercial/offer">Offer Builder</Link><Link href="/commercial/onboarding">Onboarding</Link><strong>Campaign Calendar</strong></nav>
 <div className={styles.calendarControls}><button className={styles.action} onClick={()=>shift(-1)} aria-label="Vorheriger Monat">←</button><h2>{first.toLocaleDateString("de-DE",{month:"long",year:"numeric"})}</h2><button className={styles.action} onClick={()=>shift(1)} aria-label="Nächster Monat">→</button><select aria-label="Art filtern" value={kind} onChange={e=>setKind(e.target.value)}><option value="all">Alle Arten</option><option value="launch">Launches</option><option value="package">Packages</option><option value="campaign">Kampagnen</option></select><select aria-label="Status filtern" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">Alle Status</option>{Object.entries(statusLabel).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div>
 <div className={styles.calendarLayout}><section className={styles.calendarBoard}><div className={styles.calendarGrid}>{["MO","DI","MI","DO","FR","SA","SO"].map(day=><div key={day} className={styles.calendarWeekday}>{day}</div>)}{cells.map((day,i)=>{const date=year+"-"+pad(monthNumber)+"-"+pad(day);const matching=day>=1&&day<=days?visible.filter(e=>e.start<=date&&e.end>=date):[];return <div key={i} className={styles.calendarDay}><span>{day>=1&&day<=days?pad(day):""}</span>{matching.map(e=><button key={e.id} onClick={()=>setSelected(e.id)} className={styles.calendarEvent+(e.status==="requested"?" "+styles.calendarRequested:"")} title={e.partner+" · "+statusLabel[e.status]}>{e.partner}<small>{kindLabel[e.kind]} · {statusLabel[e.status]}</small></button>)}</div>;})}</div></section>
 <aside className={styles.side}><div className={styles.eyebrow}>CAMPAIGN DETAILS</div>{selectedEvent?<><h3>{selectedEvent.partner}</h3><p>{selectedEvent.title}</p><div className={styles.detail}><strong>Art</strong><p>{kindLabel[selectedEvent.kind]}</p><strong>Zeitraum</strong><p>{formatDemoDate(selectedEvent.start)} – {formatDemoDate(selectedEvent.end)}</p><strong>Status (nur Demo)</strong><p><select aria-label="Demo-Terminstatus" value={selectedEvent.status} onChange={e=>setEventStatus(selectedEvent.id,e.target.value as CampaignEvent["status"])} style={{width:"100%",padding:12,background:"transparent"}}>{Object.entries(statusLabel).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></p><p className={styles.muted}>Eine Statusänderung hier simuliert deine interne Freigabe. Sie veröffentlicht nichts und informiert keinen Partner.</p></div></>:<><h3>Dein Kalender.</h3><p>Wähle einen Termin, um Details und Status zu sehen.</p><div className={styles.detail}><strong>Demo-Terminwünsche</strong><p>Trage im Partner-Onboarding einen gewünschten Launch und eine Package-Laufzeit ein. Sie erscheinen hier im selben Browser automatisch als „Wunsch / Prüfung“.</p><Link href="/partner-portal/demo/onboarding">PARTNER-ONBOARDING ÖFFNEN ↗</Link></div></>}<div className={styles.detail}><button className={styles.action} onClick={reset}>DEMO-KALENDER ZURÜCKSETZEN</button></div></aside></div>
 <footer className={styles.foot}><p className={styles.muted}>Alle Kalendereinträge sind fiktive Beispiele oder lokal gespeicherte Demo-Terminwünsche. Keine Verbindung zu Google Calendar, Supabase oder einem produktiven Redaktionskalender. Eine echte Veröffentlichung erfolgt ausschließlich nach AROUND-Freigabe.</p></footer>
 </div></main>;
}