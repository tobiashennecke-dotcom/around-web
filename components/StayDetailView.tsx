import Link from "next/link";
import { SaveButton } from "@/components/SaveButton";
import { TripPicker } from "@/components/TripPicker";
import { ContentCard } from "@/components/ContentCard";
import { PlaceGallery } from "@/components/PlaceGallery";
import { normalizeContentRole, type ContentRole } from "@/lib/content-role";
import type { Place } from "@/lib/types";

function formatDate(value?: string) {
  if (!value) return undefined;
  try {
    return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
  } catch {
    return undefined;
  }
}

function nightsRange(min?: number, max?: number) {
  if (min && max) return min === max ? `${min} NIGHTS` : `${min}–${max} NIGHTS`;
  if (min) return `${min}+ NIGHTS`;
  if (max) return `UP TO ${max} NIGHTS`;
  return undefined;
}

type TripGroupKey = ContentRole | "other";

const aroundItGroupLabels: Record<TripGroupKey, string> = {
  play: "PLAY",
  eat: "EAT",
  do: "DO",
  stay: "STAY ALTERNATIVES",
  other: "OTHER"
};
const aroundItGroupOrder: TripGroupKey[] = ["play", "eat", "do", "stay", "other"];

function tripGroupFor(placeType?: string): TripGroupKey {
  return normalizeContentRole(placeType) || "other";
}

function groupAroundIt(items: Place["aroundIt"]) {
  const groups = new Map<TripGroupKey, typeof items>();
  for (const item of items || []) {
    if (item.type !== "place") continue;
    const group = tripGroupFor(item.placeType);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(item);
  }
  return aroundItGroupOrder
    .filter(group => groups.get(group)?.length)
    .map(group => ({ role: group, label: aroundItGroupLabels[group], items: groups.get(group)! }));
}

export function StayDetailView({ place }: { place: Place }) {
  const gallery = place.gallery || [];
  const savePayload = { sourceId: place.id, sourceType: place.type, sourceRole: "stay" as ContentRole, title: place.title, slug: place.slug };

  const snapshotFacts = [
    place.stayCharacter?.toUpperCase(),
    ...(place.accommodationTypes || []).map(item => item.toUpperCase()),
    place.spaSummary ? "SPA" : undefined,
    nightsRange(place.recommendedNightsMin, place.recommendedNightsMax)
  ].filter((value): value is string => Boolean(value));

  const hasWhyStayHereGrid = Boolean(place.theFeel?.length || place.bestFor?.length || place.aroundMoment || place.knowBeforeYouGo);
  const hasWhyStayHere = Boolean(place.whyWeLikeIt || hasWhyStayHereGrid);

  const yourStayFacts = [
    { label: "STAY", value: place.roomSummary },
    { label: "SPA", value: place.spaSummary },
    { label: "FOOD", value: place.foodSummary },
    { label: "BREAKFAST", value: place.breakfastSummary },
    { label: "PARKING", value: place.parkingSummary },
    { label: "DOGS", value: place.dogPolicy },
    { label: "CHECK-IN", value: place.checkIn },
    { label: "CHECK-OUT", value: place.checkOut }
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));

  const hasGolfBase = Boolean(place.golfBaseWhy || (place.nearbyCourses && place.nearbyCourses.length));
  const hasOfficialInfo = Boolean(place.website || place.bookingUrl);
  const operatorConfirmed = place.operatorStatus?.source === "operator";
  const lastVerified = formatDate(place.operatorStatus?.lastVerifiedAt);

  const aroundItGroups = groupAroundIt(place.aroundIt);

  return (
    <main>
      <section
        className={`hero stayHero ${place.image ? "heroWithImage" : ""}`}
        style={place.image ? {backgroundImage:`linear-gradient(rgba(18,20,19,.25),rgba(18,20,19,.8)),url(${place.image})`} : undefined}
      >
        <div className="container">
          <div className={`eyebrow ${place.accent}`}>{place.aroundSelected ? "AROUND SELECTED · STAY" : "STAY"}</div>
          <h1>{place.title.toUpperCase()}</h1>
          <p className="heroIntro">{place.description}</p>
          <div className={`heroActions stayHeroActions ${place.bookingUrl ? "stayHeroActions--booking" : ""}`}>
            {place.bookingUrl ? (
              <a className="stayCtaBooking" href={place.bookingUrl} target="_blank" rel="noreferrer">
                {(place.bookingLabel || "Verfügbarkeit prüfen").toUpperCase()} ↗
              </a>
            ) : null}
            <div className="stayCtaTrip"><TripPicker item={savePayload} label="+ ZUM TRIP" /></div>
            <div className="stayCtaSave"><SaveButton sourceId={place.id} sourceType={place.type} title={place.title} slug={place.slug} placeType={place.placeType} label="Merken" /></div>
          </div>
        </div>
      </section>

      {snapshotFacts.length ? (
        <section className="stayUtilityStrip">
          <div className="container stayUtilityRow">{snapshotFacts.join(" · ")}</div>
        </section>
      ) : null}

      {hasWhyStayHere ? (
        <section className="section staySection">
          <div className="container">
            <div className="eyebrow lime">STAY / EDITORIAL</div>
            <h2 className="sectionTitle">WHY STAY HERE.</h2>
            {place.whyWeLikeIt ? <p className="stayWhyLead">{place.whyWeLikeIt}</p> : null}
            {place.aroundTake ? (
              <div className="stayAroundTake">
                <span className="stayAroundTakeLabel">THE AROUND TAKE.</span>
                <p>{place.aroundTake}</p>
              </div>
            ) : null}

            {hasWhyStayHereGrid ? (
              <div className="stayWhyGrid">
                {place.theFeel?.length ? (
                  <div className="stayWhyBlock">
                    <span className="stayWhyLabel">THE FEEL.</span>
                    <div className="stayTagList">{place.theFeel.map(tag => <span key={tag}>{tag}</span>)}</div>
                  </div>
                ) : null}
                {place.bestFor?.length ? (
                  <div className="stayWhyBlock">
                    <span className="stayWhyLabel">BEST FOR.</span>
                    <div className="stayTagList">{place.bestFor.map(tag => <span key={tag}>{tag}</span>)}</div>
                  </div>
                ) : null}
                {place.aroundMoment ? (
                  <div className="stayWhyBlock">
                    <span className="stayWhyLabel">THE AROUND MOMENT.</span>
                    <p>{place.aroundMoment}</p>
                  </div>
                ) : null}
                {place.knowBeforeYouGo ? (
                  <div className="stayWhyBlock">
                    <span className="stayWhyLabel">KNOW BEFORE YOU GO.</span>
                    <p>{place.knowBeforeYouGo}</p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {yourStayFacts.length ? (
        <section className="section staySection">
          <div className="container">
            <div className="eyebrow blue">STAY / DETAILS</div>
            <h2 className="sectionTitle">YOUR STAY.</h2>
            <div className="stayFactsGrid">
              {yourStayFacts.map(fact => <div className="fact" key={fact.label}><small>{fact.label}</small><strong>{fact.value}</strong></div>)}
            </div>
          </div>
        </section>
      ) : null}

      {hasGolfBase ? (
        <section className="section staySection">
          <div className="container">
            <div className="eyebrow lime">STAY / GOLF</div>
            <h2 className="sectionTitle">WHY IT WORKS FOR GOLF.</h2>
            {place.golfBaseWhy ? <p className="stayWhyLead">{place.golfBaseWhy}</p> : null}
            {place.nearbyCourses && place.nearbyCourses.length ? (
              <div className="cardGrid" style={{marginTop:30}}>
                {place.nearbyCourses.map(course => (
                  <div className="stayCourseCard" key={course.id}>
                    <ContentCard item={course} />
                    <span className="stayCourseDistance">~{Math.round(course.distanceKm)} KM LUFTLINIE</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {gallery.length > 0 && (
        <section className="section staySection placeGallerySection">
          <div className="container">
            <div className="placeGalleryIntro">
              <div className={`eyebrow ${place.accent}`}>STAY / IMAGES</div>
              <h2 className="sectionTitle">LOOK<br/>AROUND.</h2>
              <p>Ein Zuhause auf Zeit entscheidet sich nicht in einem Bild. Zimmer, Landschaft, Ruhe und Details gehören zusammen.</p>
            </div>
            <PlaceGallery items={gallery} title={place.title} />
          </div>
        </section>
      )}

      {hasOfficialInfo ? (
        <section className="section staySection">
          <div className="container">
            <div className="eyebrow lime">STAY / OFFICIAL INFO</div>
            <h2 className="sectionTitle">OFFICIAL INFO.</h2>
            <div className="stayOfficialPanel">
              <div className="stayOfficialStatus">
                {operatorConfirmed ? (
                  <>
                    <strong>Vom Betreiber bestätigt</strong>
                    {lastVerified ? <small>Zuletzt bestätigt: {lastVerified}</small> : null}
                  </>
                ) : (
                  <strong>Quelle: offizielle Website</strong>
                )}
              </div>
              <div className="stayOfficialActions">
                {place.website ? <a className="secondary" href={place.website} target="_blank" rel="noreferrer">OFFIZIELLE WEBSITE ↗</a> : null}
                {place.bookingUrl ? (
                  <a className="primary" href={place.bookingUrl} target="_blank" rel="noreferrer">
                    {(place.bookingLabel || "Verfügbarkeit prüfen").toUpperCase()} ↗
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {aroundItGroups.length ? (
        <section className="section staySection">
          <div className="container">
            <div className="eyebrow lime">STAY / TRIP</div>
            <h2 className="sectionTitle" style={{margin:"14px 0 40px"}}>MAKE A TRIP OF IT.</h2>
            {aroundItGroups.map(group => (
              <div className="stayTripGroup" key={group.role}>
                <div className="stayTripGroupLabel">{group.label}</div>
                <div className="cardGrid">{group.items.map(item => <ContentCard key={item.id} item={item}/>)}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {place.destination && !aroundItGroups.length ? (
        <section className="section staySection">
          <div className="container">
            <div className="eyebrow lime">STAY / TRIP</div>
            <h2 className="sectionTitle" style={{margin:"14px 0 40px"}}>MAKE A TRIP OF IT.</h2>
            <p>
              Entdecke mehr rund um dieses Stay in{" "}
              <Link className="textLink" href={`/destinations/${place.destination.slug}`}>{place.destination.title}</Link>.
            </p>
          </div>
        </section>
      ) : null}
    </main>
  );
}
