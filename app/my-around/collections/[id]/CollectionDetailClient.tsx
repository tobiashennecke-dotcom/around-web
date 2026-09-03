"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getUserCollection,
  removeItemFromCollection,
  renameUserCollection,
  type UserCollection
} from "@/lib/supabase/collections";
import { addItemToTrip, createUserTrip } from "@/lib/supabase/trips";
import type { SavePayload } from "@/lib/supabase/saves";

function hrefFor(item: SavePayload) {
  if (item.sourceType === "destination") return `/destinations/${item.slug}`;
  if (item.sourceType === "place") return `/places/${item.slug}`;
  if (item.sourceType === "story") return `/stories/${item.slug}`;
  if (item.sourceType === "person") return `/people/${item.slug}`;
  if (item.sourceType === "product" || item.sourceType === "object") return `/objects/${item.slug}`;
  return "/discover";
}

export function CollectionDetailClient({ id }: { id: string }) {
  const [collection, setCollection] = useState<UserCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [planning, setPlanning] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const result = await getUserCollection(id);
      setCollection(result.collection);
      setTitle(result.collection?.title || "");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function saveTitle() {
    if (!collection || !title.trim()) return;
    await renameUserCollection(collection.id, title);
    setEditing(false);
    await load();
  }

  async function remove(sourceId: string) {
    if (!collection) return;
    await removeItemFromCollection(collection.id, sourceId);
    await load();
  }

  async function planTrip() {
    if (!collection || planning) return;
    setPlanning(true);
    try {
      const destination = collection.items.find(item => item.sourceType === "destination");
      const trip = await createUserTrip(collection.title, { destinationSourceId: destination?.sourceId });
      for (const item of collection.items) await addItemToTrip(trip.id, item);
      window.location.href = `/my-around/trips/${trip.id}`;
    } finally {
      setPlanning(false);
    }
  }

  if (loading) return <section className="section"><div className="container savedLoading">Collection wird geladen …</div></section>;
  if (!collection) return <section className="section"><div className="container"><h1>Collection nicht gefunden.</h1><Link className="textLink" href="/my-around/collections">Zurück →</Link></div></section>;

  return (
    <>
      <section className="userCollectionDetailHero">
        <div className="container">
          <div className="eyebrow lime">MY AROUND / COLLECTION</div>
          {editing ? (
            <div className="collectionTitleEdit">
              <input value={title} onChange={event => setTitle(event.target.value)} autoFocus />
              <button type="button" className="primary" onClick={saveTitle}>Speichern →</button>
            </div>
          ) : (
            <div className="collectionDetailTitleRow">
              <h1>{collection.title}</h1>
              <button type="button" onClick={() => setEditing(true)}>Umbenennen</button>
            </div>
          )}
          <p className="serif">{collection.items.length} Fundstück{collection.items.length === 1 ? "" : "e"}. Noch keine Route – aber schon eine Richtung.</p>
          <div className="collectionPlanCta">
            <button type="button" className="primary" onClick={planTrip} disabled={planning || !collection.items.length}>{planning ? "Trip wird gebaut …" : "Als Trip planen →"}</button>
            <span>Übernimmt alle Fundstücke in einen neuen Reiseplan.</span>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="collectionDetailToolbar"><Link href="/my-around/collections">← Alle Collections</Link><div className="tripWorkspaceLinks"><Link href="/my-around/trips">Trips →</Link><Link href="/saved">+ Inhalte hinzufügen</Link></div></div>
          {collection.items.length ? (
            <div className="collectionItemList">
              {collection.items.map((item, index) => (
                <article key={item.sourceId} className="collectionItemRow">
                  <div>{String(index + 1).padStart(2, "0")}</div>
                  <div className="collectionItemType">{item.sourceType}</div>
                  <h2><Link href={hrefFor(item)}>{item.title}</Link></h2>
                  <div className="collectionItemActions"><Link href={hrefFor(item)}>Öffnen ↗</Link><button type="button" onClick={() => remove(item.sourceId)}>×</button></div>
                </article>
              ))}
            </div>
          ) : (
            <div className="collectionsEmpty"><div className="collectionEmptyIndex">00</div><div><h3>Diese Collection ist noch leer.</h3><p>Öffne MY AROUND und ordne einen gespeicherten Inhalt dieser Collection zu.</p></div><Link className="textLink" href="/saved">Zu MY AROUND →</Link></div>
          )}
        </div>
      </section>
    </>
  );
}
