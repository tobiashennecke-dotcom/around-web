"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SaveMode, SavePayload } from "@/lib/supabase/saves";
import {
  listSaves,
  removeSave,
  SAVES_CHANGED_EVENT
} from "@/lib/supabase/saves";

type Filter = "all" | "destination" | "place" | "story" | "person" | "product" | "collection";

function hrefFor(item: SavePayload) {
  if (item.sourceType === "destination") return `/destinations/${item.slug}`;
  if (item.sourceType === "place") return `/places/${item.slug}`;
  if (item.sourceType === "story") return `/stories/${item.slug}`;
  if (item.sourceType === "person") return `/people/${item.slug}`;
  if (item.sourceType === "product" || item.sourceType === "object") return `/objects/${item.slug}`;
  if (item.sourceType === "collection") return `/collections/${item.slug}`;
  return "/discover";
}

function labelFor(type: string) {
  if (type === "destination") return "Destination";
  if (type === "place") return "Place";
  if (type === "story") return "Story";
  if (type === "person") return "Person";
  if (type === "product" || type === "object") return "Object";
  if (type === "collection") return "Collection";
  return type;
}

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "Alle" },
  { value: "destination", label: "Reisen" },
  { value: "place", label: "Places" },
  { value: "story", label: "Stories" },
  { value: "person", label: "Menschen" },
  { value: "product", label: "Objects" }
];

export function SavedClient() {
  const [items, setItems] = useState<SavePayload[]>([]);
  const [mode, setMode] = useState<SaveMode>("guest");
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const result = await listSaves();
      setItems(result.items);
      setMode(result.mode);
      setUserEmail(result.userEmail);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    window.addEventListener(SAVES_CHANGED_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(SAVES_CHANGED_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, []);

  const visible = useMemo(() => {
    if (filter === "all") return items;
    return items.filter(item => {
      if (filter === "product") return item.sourceType === "product" || item.sourceType === "object";
      return item.sourceType === filter;
    });
  }, [items, filter]);

  async function remove(sourceId: string) {
    setRemovingId(sourceId);
    try {
      await removeSave(sourceId);
      setItems(current => current.filter(item => item.sourceId !== sourceId));
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return <div className="savedLoading">MY AROUND wird geladen …</div>;
  }

  if (!items.length) {
    return (
      <div className="savedEmpty savedEmptyV14">
        <span className="drop drop--empty" aria-hidden="true" />
        <div>
          <div className="eyebrow lime">Noch leer</div>
          <h2>Dein AROUND beginnt mit einem Drop.</h2>
          <p>Speichere Orte, Stories, Menschen und Dinge direkt beim Entdecken. Ein Account ist dafür nicht nötig.</p>
          <Link className="primary" href="/discover">Entdecken →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="savedWorkspace">
      <div className="savedStatusBar">
        <div>
          <span className={`syncDot ${mode === "account" ? "syncDot--account" : ""}`} />
          <strong>{mode === "account" ? "Synchronisiert" : "Auf diesem Gerät"}</strong>
          {mode === "account" && userEmail ? <span>{userEmail}</span> : <span>{items.length} gespeichert</span>}
        </div>
        {mode === "guest" && <Link href="/account">Auf allen Geräten sichern →</Link>}
      </div>

      <div className="savedFilters" role="tablist" aria-label="Gespeicherte Inhalte filtern">
        {filters.map(item => (
          <button
            type="button"
            key={item.value}
            className={filter === item.value ? "active" : ""}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length ? (
        <div className="savedListV14">
          {visible.map((item, index) => (
            <article className="savedRowV14" key={item.sourceId}>
              <div className="savedRowIndex">{String(index + 1).padStart(2, "0")}</div>
              <div className="savedRowType">{labelFor(item.sourceType)}</div>
              <h3><Link href={hrefFor(item)}>{item.title}</Link></h3>
              <div className="savedRowActions">
                <Link href={hrefFor(item)} className="savedOpen" aria-label={`${item.title} öffnen`}>Öffnen ↗</Link>
                <button
                  type="button"
                  className="savedRemove"
                  onClick={() => remove(item.sourceId)}
                  disabled={removingId === item.sourceId}
                  aria-label={`${item.title} aus MY AROUND entfernen`}
                >
                  {removingId === item.sourceId ? "…" : "×"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="savedFilterEmpty">In dieser Kategorie hast du noch nichts gespeichert.</div>
      )}
    </div>
  );
}
