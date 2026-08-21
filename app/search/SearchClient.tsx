"use client";
import { useEffect, useState } from "react";
import { ContentCard } from "@/components/ContentCard";
import type { ContentCard as CardType } from "@/lib/types";

export function SearchClient({initialQuery=""}:{initialQuery?:string}) {
  const [query,setQuery] = useState(initialQuery);
  const [type,setType] = useState("all");
  const [results,setResults] = useState<CardType[]>([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    const timer=window.setTimeout(async()=>{
      setLoading(true);
      try{
        const params=new URLSearchParams({q:query,type});
        const response=await fetch(`/api/search?${params.toString()}`);
        const data=await response.json();
        setResults(Array.isArray(data.results)?data.results:[]);
      } finally {
        setLoading(false);
      }
    },180);
    return ()=>window.clearTimeout(timer);
  },[query,type]);

  const filters = [["all","Alles"],["destination","Orte"],["place","Places"],["story","Stories"],["person","Menschen"],["product","Objects"],["collection","Collections"]];

  return (
    <>
      <input className="searchInput" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Lisbon, Food, City, People …" />
      <div className="filters">
        {filters.map(([value,label])=>(
          <button key={value} className="filter" onClick={()=>setType(value)} style={type===value?{background:"#212322",color:"#F5F3EE"}:{}}>
            {label}
          </button>
        ))}
      </div>
      <div className="eyebrow" style={{marginBottom:20}}>{loading?"Suche …":`${results.length} Ergebnisse / Curated, not complete.`}</div>
      <div className="cardGrid">{results.map(item=><ContentCard key={item.id} item={item}/>)}</div>
    </>
  );
}
