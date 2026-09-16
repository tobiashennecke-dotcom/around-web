"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SavedLibraryItem } from "@/components/SavedLibraryItem";
import type { SaveMode, SavePayload } from "@/lib/supabase/saves";
import {
  listSaves,
  removeSave,
  SAVES_CHANGED_EVENT
} from "@/lib/supabase/saves";
import {
  matchesSavedLibraryFilter,
  savedLibraryFilterEmptyMessage,
  savedLibraryFilterForItem,
  SAVED_LIBRARY_FILTERS,
  type SavedLibraryFilter
} from "@/lib/saved-content";

export function SavedClient() {
  const [items, setItems] = useState<SavePayload[]>([]);
  const [mode, setMode] = useState<SaveMode>("guest");
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [filter, setFilter] = useState<SavedLibraryFilter>("all");
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

  const counts = useMemo(() => {
    const result: Record<SavedLibraryFilter, number> = {
      all: items.length,
      story: 0,
      place: 0,
      destination: 0,
      person: 0,
      object: 0
    };
    for (const item of items) {
      const bucket = savedLibraryFilterForItem(item);
      if (bucket) result[bucket] += 1;
    }
    return result;
  }, [items]);

  const visible = useMemo(
    () => items.filter(item => matchesSavedLibraryFilter(item, filter)),
    [items, filter]
  );

  async function remove(item: SavePayload) {
    setRemovingId(item.sourceId);
    try {
      await removeSave(item);
      setItems(current => current.filter(existing => existing.sourceId !== item.sourceId));
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
          <strong>{mode === "account" ? "Synchronisiert mit MY AROUND" : "Auf diesem Gerät gespeichert"}</strong>
          {mode === "account" && userEmail ? <span>{userEmail}</span> : <span>{items.length} gespeichert</span>}
        </div>
        <div className="savedStatusLinks">{mode === "guest" && <Link href="/account">Auf allen Geräten sichern →</Link>}<Link href="/my-around/planen">Planen →</Link></div>
      </div>

      <div className="savedFilters" role="tablist" aria-label="Gespeicherte Inhalte filtern">
        {SAVED_LIBRARY_FILTERS.map(item => {
          const count = counts[item.value];
          return (
            <button
              type="button"
              role="tab"
              key={item.value}
              className={filter === item.value ? "active" : ""}
              aria-selected={filter === item.value}
              data-empty={count === 0}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
              <span className="saveCount savedFilterCount">{count}</span>
            </button>
          );
        })}
      </div>

      {visible.length ? (
        <div className="savedListV14">
          {visible.map((item, index) => (
            <SavedLibraryItem
              key={item.sourceId}
              item={item}
              index={index}
              removing={removingId === item.sourceId}
              onRemove={remove}
            />
          ))}
        </div>
      ) : (
        <div className="savedFilterEmpty">{savedLibraryFilterEmptyMessage(filter)}</div>
      )}
    </div>
  );
}
