"use client";

import { useEffect, useState } from "react";
import type { SavePayload } from "@/lib/supabase/saves";
import {
  addItemToCollection,
  createUserCollection,
  listUserCollections,
  type UserCollection
} from "@/lib/supabase/collections";

type Props = {
  item: SavePayload;
  compact?: boolean;
};

export function CollectionPicker({ item, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<UserCollection[]>([]);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const result = await listUserCollections();
    setCollections(result.collections);
  }

  useEffect(() => {
    if (open) load();
  }, [open]);

  async function add(collection: UserCollection) {
    setBusy(true);
    setMessage("");
    try {
      await addItemToCollection(collection.id, item);
      setMessage(`Zu „${collection.title}“ hinzugefügt.`);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function createAndAdd() {
    if (!title.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      const collection = await createUserCollection(title);
      await addItemToCollection(collection.id, item);
      setTitle("");
      setMessage(`„${collection.title}“ erstellt und hinzugefügt.`);
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`collectionPicker ${compact ? "collectionPicker--compact" : ""}`}>
      <button
        type="button"
        className="collectionPickerTrigger"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
      >
        + Collection
      </button>
      {open && (
        <div className="collectionPickerPanel">
          <div className="collectionPickerHead">
            <div>
              <div className="eyebrow lime">ORGANISIEREN</div>
              <strong>Zu Collection</strong>
            </div>
            <button type="button" className="collectionPickerClose" onClick={() => setOpen(false)} aria-label="Schließen">×</button>
          </div>

          {collections.length ? (
            <div className="collectionPickerList">
              {collections.map(collection => {
                const contains = collection.items.some(existing => existing.sourceId === item.sourceId);
                return (
                  <button
                    type="button"
                    key={collection.id}
                    disabled={busy || contains}
                    onClick={() => add(collection)}
                  >
                    <span>{collection.title}</span>
                    <small>{contains ? "Enthalten" : `${collection.items.length} Items +`}</small>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="collectionPickerEmpty">Noch keine Collection. Erstelle direkt deine erste.</p>
          )}

          <div className="collectionPickerCreate">
            <input
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="z. B. Lisbon Weekend"
              onKeyDown={event => {
                if (event.key === "Enter") createAndAdd();
              }}
            />
            <button type="button" onClick={createAndAdd} disabled={busy || !title.trim()}>Erstellen +</button>
          </div>
          {message ? <div className="collectionPickerMessage">{message}</div> : null}
        </div>
      )}
    </div>
  );
}
