"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ContentCard } from "@/components/ContentCard";
import { TripPicker } from "@/components/TripPicker";
import { normalizeContentRole, type ContentRole } from "@/lib/content-role";
import { addItemToTrip, getUserTrip } from "@/lib/supabase/trips";
import type { SavePayload } from "@/lib/supabase/saves";
import type { ContentCard as CardType } from "@/lib/types";

const allowedTypes = new Set(["all","destination","place","story","person","product","collection"]);
const allowedRoles = new Set(["play","stay","eat","do"]);

function toSavePayload(item: CardType): SavePayload {
  return {
    sourceId: item.id,
    sourceType: item.type,
    sourceRole: item.type === "place" ? normalizeContentRole(item.placeType) : undefined,
    title: item.title,
    slug: item.slug
  };
}

function roleLabel(role?: ContentRole) {
  if (role === "play") return "PLAY";
  if (role === "stay") return "STAY";
  if (role === "eat") return "EAT";
  if (role === "do") return "DO";
  return "INHALT";
}

export function SearchClient({
  initialQuery="",
  initialType="all",
  initialRole="",
  tripId=""
}:{
  initialQuery?:string;
  initialType?:string;
  initialRole?:string;
  tripId?:string;
}) {
  const [query,setQuery] = useState(initialQuery);
  const [type,setType] = useState(allowedTypes.has(initialType) ? initialType : "all");
  const [role,setRole] = useState(allowedRoles.has(initialRole) ? initialRole : "");
  const [results,setResults] = useState<CardType[]>([]);
  const [loading,setLoading] = useState(true);
  const [tripTitle,setTripTitle] = useState("");
  const [tripItemIds,setTripItemIds] = useState<Set<string>>(new Set());
  const [addingId,setAddingId] = useState("");
  const [actionMessage,setActionMessage] = useState("");

  useEffect(()=>{
    if (!tripId) { setTripTitle(""); setTripItemIds(new Set()); return; }
    let cancelled=false;
    getUserTrip(tripId).then(result=>{
      if (cancelled) return;
      if (!result.trip) { setTripTitle(""); setTripItemIds(new Set()); return; }
      setTripTitle(result.trip.title);
      setTripItemIds(new Set(result.trip.items.map(item=>item.sourceId)));
    });
    return ()=>{cancelled=true;};
  },[tripId]);

  useEffect(()=>{
    const timer=window.setTimeout(async()=>{
      setLoading(true);
      try{
        const params=new URLSearchParams({q:query,type});
        if (role) params.set("role",role);
        const response=await fetch(`/api/search?${params.toString()}`);
        const data=await response.json();
        setResults(Array.isArray(data.results)?data.results:[]);
      } finally {
        setLoading(false);
      }
    },180);
    return ()=>window.clearTimeout(timer);
  },[query,type,role]);

  useEffect(()=>{
    if (typeof window === "undefined") return;
    const params=new URLSearchParams();
    if (query) params.set("q",query);
    if (type !== "all") params.set("type",type);
    if (role) params.set("role",role);
    if (tripId) params.set("trip",tripId);
    const next=`${window.location.pathname}${params.toString()?`?${params.toString()}`:""}`;
    window.history.replaceState(null,"",next);
  },[query,type,role,tripId]);

  const activeKey=role || type;
  const filters=useMemo(()=>[
    {key:"all",label:"ALLE",type:"all",role:""},
    {key:"destination",label:"REISEN",type:"destination",role:""},
    {key:"play",label:"PLAY",type:"all",role:"play"},
    {key:"stay",label:"STAY",type:"all",role:"stay"},
    {key:"eat",label:"EAT",type:"all",role:"eat"},
    {key:"do",label:"DO",type:"all",role:"do"},
    {key:"story",label:"STORIES",type:"story",role:""},
    {key:"person",label:"MENSCHEN",type:"person",role:""},
    {key:"product",label:"OBJECTS",type:"product",role:""}
  ],[]);

  async function addDirect(item: CardType, wholeTrip=false) {
    if (!tripId || tripItemIds.has(item.id)) return;
    setAddingId(item.id);
    setActionMessage("");
    try {
      const payload=toSavePayload(item);
      const itemRole=item.type === "place" ? normalizeContentRole(item.placeType) : undefined;
      await addItemToTrip(tripId,payload,itemRole === "stay" ? {stayFullTrip:wholeTrip} : {});
      setTripItemIds(current=>new Set([...current,item.id]));
      setActionMessage(`${item.title} wurde zu ${tripTitle || "deinem Trip"} hinzugefügt.`);
    } finally {
      setAddingId("");
    }
  }

  return (
    <>
      {tripId ? (
        <div className="searchTripContext">
          <div>
            <div className="eyebrow lime">TRIP MODE</div>
            <strong>{tripTitle ? `FÜR ${tripTitle.toUpperCase()} ENTDECKEN.` : "FÜR DEINEN TRIP ENTDECKEN."}</strong>
            <p>Finde den nächsten Baustein und füge ihn ohne Umweg direkt zum Plan hinzu.</p>
          </div>
          <Link href={`/my-around/trips/${tripId}`}>Zurück zum Trip →</Link>
        </div>
      ) : null}

      <div className="searchControlPanel">
        <input className="searchInput" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ort, Golfplatz, Hotel, Restaurant …" />
        <div className="filters searchRoleFilters">
          {filters.map(filter=>(
            <button
              type="button"
              key={filter.key}
              className={`filter ${activeKey===filter.key?"filter--active":""}`}
              onClick={()=>{setType(filter.type);setRole(filter.role);}}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="searchResultMeta">
        <div className="eyebrow">{loading?"SUCHE …":`${results.length} ERGEBNISSE · CURATED, NOT COMPLETE.`}</div>
        {actionMessage ? <span>{actionMessage}</span> : null}
      </div>

      <div className="cardGrid searchPlanningGrid">
        {results.map(item=>{
          const payload=toSavePayload(item);
          const itemRole=item.type === "place" ? normalizeContentRole(item.placeType) : undefined;
          const contained=tripItemIds.has(item.id);
          return (
            <div className="searchPlanningCard" key={item.id}>
              <ContentCard item={item}/>
              <div className="searchPlanningActions">
                {tripId ? (
                  contained ? (
                    <span className="searchTripContained">IM TRIP ✓</span>
                  ) : itemRole === "stay" ? (
                    <>
                      <button type="button" disabled={addingId===item.id} onClick={()=>void addDirect(item,true)}>GANZE REISE</button>
                      <button type="button" disabled={addingId===item.id} onClick={()=>void addDirect(item,false)}>ZEITRAUM OFFEN +</button>
                    </>
                  ) : (
                    <button type="button" disabled={addingId===item.id} onClick={()=>void addDirect(item)}>{addingId===item.id?"FÜGT HINZU …":`${roleLabel(itemRole)} ZU TRIP +`}</button>
                  )
                ) : (
                  <TripPicker item={payload} compact/>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!loading && !results.length ? (
        <div className="searchEmptyState">
          <strong>NOCH NICHTS DABEI.</strong>
          <p>AROUND bleibt kuratiert. Versuch einen anderen Begriff oder wechsle den Bereich.</p>
        </div>
      ) : null}
    </>
  );
}
