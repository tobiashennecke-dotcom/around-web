"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  listSaves,
  SAVES_CHANGED_EVENT,
  type SaveMode,
  type SavePayload
} from "@/lib/supabase/saves";
import {
  listUserCollections,
  COLLECTIONS_CHANGED_EVENT,
  type UserCollection
} from "@/lib/supabase/collections";
import {
  listUserTrips,
  TRIPS_CHANGED_EVENT,
  type UserTrip
} from "@/lib/supabase/trips";
import { selectFocusTrip, tripStatusLabel, formatTripDateRange, sortCollectionsByRecentlyUpdated } from "@/lib/my-around";
import { contentTypeLabel } from "@/lib/content-role";
import { savedItemPrimaryAction, savedLibraryHref } from "@/lib/saved-content";
import { TripStoryRail } from "@/components/TripStoryRail";
import type { TripStoryRecommendation } from "@/lib/trip-stories";

const MAX_SAVED_PREVIEW = 4;
const MAX_COLLECTIONS_PREVIEW = 3;
const MAX_TRIPS_PREVIEW = 3;
const MAX_TRIP_STORIES_HOME = 3;

export function MyAroundHomeClient() {
  const [loading, setLoading] = useState(true);
  const [saves, setSaves] = useState<SavePayload[]>([]);
  const [saveMode, setSaveMode] = useState<SaveMode>("guest");
  const [collections, setCollections] = useState<UserCollection[]>([]);
  const [trips, setTrips] = useState<UserTrip[]>([]);
  const [tripStoryRecommendations, setTripStoryRecommendations] = useState<TripStoryRecommendation[]>([]);

  async function load() {
    setLoading(true);
    try {
      const [savesResult, collectionsResult, tripsResult] = await Promise.all([
        listSaves(),
        listUserCollections(),
        listUserTrips()
      ]);
      setSaves(savesResult.items);
      setSaveMode(savesResult.mode);
      setCollections(collectionsResult.collections);
      setTrips(tripsResult.trips);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    window.addEventListener(SAVES_CHANGED_EVENT, load);
    window.addEventListener(COLLECTIONS_CHANGED_EVENT, load);
    window.addEventListener(TRIPS_CHANGED_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(SAVES_CHANGED_EVENT, load);
      window.removeEventListener(COLLECTIONS_CHANGED_EVENT, load);
      window.removeEventListener(TRIPS_CHANGED_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, []);

  const focus = useMemo(() => selectFocusTrip(trips), [trips]);

  // READ BEFORE YOU GO reuses the exact v1.26c Story Graph edge (POST
  // /api/trip-stories) - no matching/ranking logic is duplicated here. Key
  // only reflects the focus Trip's Place/Destination membership, never day
  // assignment, timing, notes or status, so unrelated Planner edits never
  // cause a refetch.
  const focusTripStoryContextKey = useMemo(() => {
    const trip = focus?.trip;
    if (!trip) return "";
    const placeIds = trip.items.filter(item => item.sourceType === "place").map(item => item.sourceId).sort();
    const destinationIds = trip.items.filter(item => item.sourceType === "destination").map(item => item.sourceId).sort();
    return JSON.stringify({ tripId: trip.id, placeIds, destinationIds, tripDestinationId: trip.destinationSourceId || null });
  }, [focus]);

  useEffect(() => {
    const trip = focus?.trip;
    if (!trip) {
      setTripStoryRecommendations([]);
      return;
    }

    const placeIds = trip.items.filter(item => item.sourceType === "place").map(item => item.sourceId);
    const destinationIds = trip.items.filter(item => item.sourceType === "destination").map(item => item.sourceId);
    if (trip.destinationSourceId) destinationIds.push(trip.destinationSourceId);

    if (!placeIds.length && !destinationIds.length) {
      setTripStoryRecommendations([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/trip-stories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ placeIds, destinationIds })
        });
        const data = await response.json();
        if (cancelled) return;
        setTripStoryRecommendations(Array.isArray(data?.recommendations) ? data.recommendations : []);
      } catch {
        if (!cancelled) setTripStoryRecommendations([]);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTripStoryContextKey]);

  if (loading) {
    return <div className="savedLoading">MY AROUND wird geladen …</div>;
  }

  const nothingYet = !saves.length && !collections.length && !trips.length;

  if (nothingYet) {
    return (
      <div className="myAroundHomeEmpty">
        <div className="eyebrow lime">NOCH LEER</div>
        <h2>YOUR AROUND<br/>STARTS HERE.</h2>
        <p className="serif">Speichere eine Story, einen Place oder eine Destination – und AROUND wird zu deinem persönlichen Raum.</p>
        <div className="myAroundHomeEmptyActions">
          <Link className="primary" href="/discover">DISCOVER →</Link>
          {saveMode === "guest" && <Link className="textLink" href="/account">SIGN IN →</Link>}
        </div>
      </div>
    );
  }

  const focusTrip = focus?.trip;
  const homeStoryRecommendations = tripStoryRecommendations.slice(0, MAX_TRIP_STORIES_HOME);
  const savedPreview = saves.slice(0, MAX_SAVED_PREVIEW);
  const collectionsPreview = sortCollectionsByRecentlyUpdated(collections).slice(0, MAX_COLLECTIONS_PREVIEW);
  const tripsPreview = trips.slice(0, MAX_TRIPS_PREVIEW);

  return (
    <>
      <div className="myAroundHomeStatus" role="status">
        <span className={`syncDot ${saveMode === "account" ? "syncDot--account" : ""}`} />
        <strong>{saveMode === "account" ? "SYNCED WITH MY AROUND" : "Auf diesem Gerät gespeichert."}</strong>
        {saveMode === "guest" && <Link href="/account">AUF ALLEN GERÄTEN SICHERN →</Link>}
      </div>

      <div className="myAroundOverview">
        <Link className="myAroundOverviewItem" href="/saved">
          <span>Saved</span>
          <strong>{saves.length}</strong>
        </Link>
        <Link className="myAroundOverviewItem" href="/my-around/collections">
          <span>Collections</span>
          <strong>{collections.length}</strong>
        </Link>
        <Link className="myAroundOverviewItem" href="/my-around/trips">
          <span>Trips</span>
          <strong>{trips.length}</strong>
        </Link>
      </div>

      {focusTrip ? (
        <section className="myAroundFocusTrip" aria-labelledby="my-around-focus-trip-title">
          <div className="eyebrow lime">{focus!.heading === "next-trip" ? "YOUR NEXT TRIP" : "CONTINUE PLANNING"}</div>
          <h3 id="my-around-focus-trip-title">{focusTrip.title}</h3>
          <div className="myAroundFocusTripMeta">
            <span>{formatTripDateRange(focusTrip.startDate, focusTrip.endDate)}</span>
            <span>{tripStatusLabel(focusTrip.status)}</span>
            <span>{focusTrip.items.length} {focusTrip.items.length === 1 ? "Fundstück" : "Fundstücke"}</span>
            {focusTrip.planReady ? <span>Plan bereit</span> : null}
          </div>
          <div className="myAroundFocusTripActions">
            <Link className="primary" href={`/my-around/trips/${focusTrip.id}`}>OPEN TRIP →</Link>
            <Link className="textLink" href="/my-around/trips">ALL TRIPS →</Link>
          </div>
        </section>
      ) : (
        <section className="myAroundEmptyTrip" aria-labelledby="my-around-no-trip-title">
          <div className="eyebrow lime">MY AROUND / TRIPS</div>
          <h3 id="my-around-no-trip-title">NO TRIP YET.</h3>
          <p className="serif">Trips sind für Reisen, die du wirklich planen willst – nicht jedes gespeicherte Fundstück muss dorthin führen.</p>
          <div className="myAroundFocusTripActions">
            <Link className="primary" href="/my-around/trips">START A TRIP →</Link>
          </div>
        </section>
      )}

      {homeStoryRecommendations.length ? (
        <TripStoryRail
          recommendations={homeStoryRecommendations}
          intro={focus?.heading === "next-trip" ? "Stories zu den Orten in deinem nächsten Trip." : "Stories zu den Orten in deinem Trip."}
          embedded
        />
      ) : null}

      {savedPreview.length ? (
        <section className="section" aria-labelledby="my-around-saved-title">
          <div className="myAroundSectionHead">
            <div>
              <div className="eyebrow lime">SAVED</div>
              <h2 className="sectionTitle" id="my-around-saved-title">SAVED FOR LATER.</h2>
            </div>
            <Link className="textLink" href="/saved">ALL SAVED →</Link>
          </div>
          <div className="myAroundSavedPreview">
            {savedPreview.map(item => (
              <div className="myAroundSavedPreviewRow" key={item.sourceId}>
                <div>
                  <span>{contentTypeLabel(item.sourceType, item.sourceRole)}</span>
                  <h4>{item.title}</h4>
                </div>
                <Link className="myAroundPreviewOpen" href={savedLibraryHref(item)}>{savedItemPrimaryAction(item)}</Link>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section" aria-labelledby="my-around-collections-title">
        <div className="myAroundSectionHead">
          <div>
            <div className="eyebrow lime">COLLECTIONS</div>
            <h2 className="sectionTitle" id="my-around-collections-title">ORDNEN.</h2>
          </div>
          <Link className="textLink" href="/my-around/collections">ALL COLLECTIONS →</Link>
        </div>
        {collectionsPreview.length ? (
          <div className="myAroundPreviewGrid">
            {collectionsPreview.map(collection => (
              <article className="myAroundCollectionCard" key={collection.id}>
                <span>{collection.items.length} {collection.items.length === 1 ? "Fundstück" : "Fundstücke"}</span>
                <h4>{collection.title}</h4>
                {collection.description ? <p>{collection.description}</p> : null}
                <Link className="textLink" href={`/my-around/collections/${collection.id}`}>OPEN →</Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="myAroundEmptyModule">
            <strong>Noch keine Collection.</strong>
            <Link className="textLink" href="/my-around/collections">CREATE A COLLECTION →</Link>
          </div>
        )}
      </section>

      {tripsPreview.length ? (
        <section className="section" aria-labelledby="my-around-trips-title">
          <div className="myAroundSectionHead">
            <div>
              <div className="eyebrow lime">TRIPS</div>
              <h2 className="sectionTitle" id="my-around-trips-title">DEINE REISEN.</h2>
            </div>
            <Link className="textLink" href="/my-around/trips">ALL TRIPS →</Link>
          </div>
          <div className="myAroundPreviewGrid">
            {tripsPreview.map(trip => (
              <article className="myAroundTripCard" key={trip.id}>
                <span>{formatTripDateRange(trip.startDate, trip.endDate)} · {tripStatusLabel(trip.status)}</span>
                <h4>{trip.title}</h4>
                <span>{trip.items.length} {trip.items.length === 1 ? "Fundstück" : "Fundstücke"}</span>
                <Link className="textLink" href={`/my-around/trips/${trip.id}`}>OPEN →</Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
