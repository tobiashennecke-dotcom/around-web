"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  COLLECTIONS_CHANGED_EVENT,
  createUserCollection,
  deleteUserCollection,
  listUserCollections,
  type UserCollection
} from "@/lib/supabase/collections";

export function CollectionsClient() {
  const [collections, setCollections] = useState<UserCollection[]>([]);
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<"guest" | "account">("guest");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const result = await listUserCollections();
      setCollections(result.collections);
      setMode(result.mode);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    window.addEventListener(COLLECTIONS_CHANGED_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(COLLECTIONS_CHANGED_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, []);

  async function create() {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await createUserCollection(title);
      setTitle("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Collection wirklich löschen? Die gespeicherten Inhalte bleiben in MY AROUND erhalten.")) return;
    await deleteUserCollection(id);
    await load();
  }

  return (
    <div className="collectionsWorkspace">
      <div className="collectionsStatusBar">
        <div><span className={`syncDot ${mode === "account" ? "syncDot--account" : ""}`} /><strong>{mode === "account" ? "Synchronisiert" : "Auf diesem Gerät"}</strong></div>
        <div className="tripWorkspaceLinks"><Link href="/my-around/trips">Trips →</Link><Link href="/saved">MY AROUND →</Link></div>
      </div>

      <div className="collectionCreateBar">
        <div>
          <div className="eyebrow">NEUE COLLECTION</div>
          <h2>WAS PLANST DU?</h2>
        </div>
        <div className="collectionCreateControls">
          <input value={title} onChange={event => setTitle(event.target.value)} placeholder="z. B. Lisbon Weekend" onKeyDown={event => { if (event.key === "Enter") create(); }} />
          <button type="button" className="primary" onClick={create} disabled={busy || !title.trim()}>Erstellen →</button>
        </div>
      </div>

      {loading ? <div className="savedLoading">Collections werden geladen …</div> : null}

      {!loading && !collections.length ? (
        <div className="collectionsEmpty">
          <div className="collectionEmptyIndex">00</div>
          <div><h3>Noch keine Collection.</h3><p>Speichere zuerst Inhalte in MY AROUND und ordne sie dann hier zu.</p></div>
          <Link className="textLink" href="/saved">Gespeicherte Inhalte öffnen →</Link>
        </div>
      ) : null}

      {collections.length ? (
        <div className="userCollectionGrid">
          {collections.map((collection, index) => (
            <article className="userCollectionCard" key={collection.id}>
              <div className="userCollectionMeta"><span>{String(index + 1).padStart(2, "0")}</span><span>{collection.items.length} ITEMS</span></div>
              <h3><Link href={`/my-around/collections/${collection.id}`}>{collection.title}</Link></h3>
              <div className="userCollectionPreview">
                {collection.items.slice(0, 3).map(item => <span key={item.sourceId}>{item.title}</span>)}
                {!collection.items.length ? <span>Noch leer.</span> : null}
              </div>
              <div className="userCollectionActions">
                <Link href={`/my-around/collections/${collection.id}`}>Öffnen →</Link>
                <button type="button" onClick={() => remove(collection.id)}>Löschen</button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
