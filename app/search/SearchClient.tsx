"use client";
import { useMemo, useState } from "react";
import { content } from "@/lib/sample-content";
import { ContentCard } from "@/components/ContentCard";

export function SearchClient() {
  const [query,setQuery] = useState("");
  const [type,setType] = useState("all");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return content.filter(item => {
      const typeOk = type === "all" || item.type === type;
      const queryOk = !q || `${item.title} ${item.kicker || ""} ${item.description}`.toLowerCase().includes(q);
      return typeOk && queryOk;
    });
  },[query,type]);

  const filters = [["all","Alles"],["destination","Orte"],["place","Places"],["story","Stories"],["person","Menschen"],["collection","Collections"]];

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
      <div className="eyebrow" style={{marginBottom:20}}>{results.length} Ergebnisse / Curated, not complete.</div>
      <div className="cardGrid">{results.map(item=><ContentCard key={item.id} item={item}/>)}</div>
    </>
  );
}
