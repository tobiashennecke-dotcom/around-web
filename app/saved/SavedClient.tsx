"use client";

import { useEffect, useState } from "react";
import type { SavePayload } from "@/lib/supabase/saves";
import { getGuestSaves } from "@/lib/supabase/saves";

export function SavedClient() {
  const [items,setItems] = useState<SavePayload[]>([]);

  useEffect(()=>{ setItems(getGuestSaves()); },[]);

  if (!items.length) {
    return <div className="savedEmpty">Noch nichts gespeichert. Gute Sache: Das lässt sich ändern.</div>;
  }

  return (
    <div className="collectionList">
      {items.map((item,index)=>(
        <div className="collectionRow" key={item.sourceId}>
          <div className="eyebrow">{String(index+1).padStart(2,"0")}</div>
          <h3>{item.title}</h3>
          <p>{item.sourceType}</p>
          <span className="drop" />
        </div>
      ))}
    </div>
  );
}
