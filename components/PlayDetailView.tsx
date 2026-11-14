import Link from "next/link";
import { ImmersiveRun } from "./ImmersiveRun";
import { ResearchDraftNote } from "./ResearchDraftNote";
import { SaveButton } from "@/components/SaveButton";
import { PlaceMarkButtons } from "@/components/PlaceMarkButtons";
import { PlaceFitNote } from "@/components/PlaceFitNote";
import { TripPicker } from "@/components/TripPicker";
import { ContentCard } from "@/components/ContentCard";
import { PlaceGallery } from "@/components/PlaceGallery";
import { StoryRail } from "@/components/StoryRail";
import { normalizeContentRole, type ContentRole } from "@/lib/content-role";
import type { Place } from "@/lib/types";

function daypartLabel(daypart?: string) {
  if (daypart === "morning") return "Morgen";
  if (daypart === "midday") return "Mittag";
  if (daypart === "afternoon") return "Nachmittag";
  if (daypart === "evening") return "Abend";
  if (daypart === "all_day") return "Ganztägig";
  return undefined;
}

function formatDuration(minutes?: number) {
  if (!minutes) return undefined;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} Min`;
  if (!rest) return `Ca. ${hours} Std`;
  return `Ca. ${hours} Std ${rest} Min`;
}

function formatDurationCompact(minutes?: number) {
  if (!minutes) return undefined;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `~${rest}MIN`;
  if (!rest) return `~${hours}H`;
  return `~${hours}H${rest}`;
}

function formatDate(value?: string) {
  if (!value) return undefined;
  try {
    return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
  } catch {
    return undefined;
  }
}

type TripGroupKey = ContentRole | "shop" | "other";

const aroundItGroupLabels: Record<TripGroupKey, string> = {
  stay: "STAY",
  eat: "EAT",
  play: "ALS NÄCHSTES SPIELEN",
  do: "DO",
  shop: "SHOP",
  other: "OTHER"
};
const aroundItGroupOrder: TripGroupKey[] = ["stay", "eat", "play", "do", "shop", "other"];

/**
 * normalizeContentRole() only covers the four planning roles (play/stay/eat/do)
 * and returns undefined for other valid placeType values like "shop" - which
 * would silently drop those results here. This adds a fallback so every valid
 * aroundIt place lands in a group, without changing normalizeContentRole's
 * shared behavior used elsewhere (search, planner, save).
 */
function tripGroupFor(placeType?: string): TripGroupKey {
  const role = normalizeContentRole(placeType);
  if (role) return role;
  return (placeType || "").trim().toLowerCase() === "shop" ? "shop" : "other";
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

export function PlayDetailView({ place }: { place: Place }) {
  const gallery = place.gallery || [];
  const immersive = Boolean(place.unlisted && gallery.length >= 4);
  const savePayload = { sourceId: place.id, sourceType: place.type, sourceRole: "play" as ContentRole, title: place.title, slug: place.slug };

  const utilityFacts = [
    place.holes ? `${place.holes} HOLES` : undefined,
    place.par ? `PAR ${place.par}` : undefined,
    place.courseCharacter?.toUpperCase(),
    place.walkability?.toUpperCase(),
    formatDurationCompact(place.suggestedDurationMinutes),
    place.season?.toUpperCase()
  ].filter((value): value is string => Boolean(value));

  const hasWhyPlayItGrid = Boolean(place.theFeel?.length || place.bestFor?.length || place.aroundMoment || place.knowBeforeYouGo);
  const hasWhyPlayIt = Boolean(place.whyWeLikeIt || hasWhyPlayItGrid);

  const gettingAround = [place.walkability, place.cartAvailability].filter(Boolean).join(" · ") || undefined;
  const planFacts = [
    { label: "BESTE ZEIT", value: daypartLabel(place.suggestedDaypart) },
    { label: "RUNDE", value: formatDuration(place.suggestedDurationMinutes) },
    { label: "ZU FUSS ODER CART", value: gettingAround },
    { label: "ÜBEN", value: place.practiceFacilities?.length ? place.practiceFacilities.join(" · ") : undefined },
    { label: "GÄSTE", value: place.guestPlay },
    { label: "SAISON", value: place.season }
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));

  const hasOfficialInfo = Boolean(place.website || place.bookingUrl);
  const operatorConfirmed = place.operatorStatus?.source === "operator";
  const lastVerified = formatDate(place.operatorStatus?.lastVerifiedAt);

  const aroundItGroups = groupAroundIt(place.aroundIt);

  return (
    <main>
      <section
        className={`hero playHero ${place.image ? "heroWithImage" : ""} ${immersive ? "heroImmersive" : ""}`}
        style={place.image ? {backgroundImage:`linear-gradient(${immersive ? "rgba(18,20,19,0) 35%,rgba(18,20,19,.82)" : "rgba(18,20,19,.25),rgba(18,20,19,.8)"}),url(${place.image})`} : undefined}
      >
        <div className="container">
          <div className={`eyebrow ${place.accent}`}>{place.aroundSelected ? "AROUND SELECTED · PLAY" : "PLAY"}</div>
          <h1>{place.title.toUpperCase()}</h1>
          <p className="heroIntro">{place.description}</p>
          <div className={`heroActions playHeroActions ${place.bookingUrl ? "playHeroActions--booking" : ""}`}>
            <div className="playCtaTrip"><TripPicker item={savePayload} label="+ ZUM TRIP" /></div>
            <div className="playCtaSave"><SaveButton sourceId={place.id} sourceType={place.type} title={place.title} slug={place.slug} placeType={place.placeType} label="Merken" /></div>
            {place.bookingUrl ? (
              <a className="playCtaBooking" href={place.bookingUrl} data-track="booking" target="_blank" rel="noreferrer">
                {(place.bookingLabel || "Tee Times / Greenfees").toUpperCase()} ↗
              </a>
            ) : null}
          </div>
          <PlaceMarkButtons payload={{
            sourceId: place.id,
            title: place.title,
            slug: place.slug,
            destinationId: place.destination?.id,
            destinationTitle: place.destination?.title,
            destinationSlug: place.destination?.slug,
            country: place.destinationCountry
          }} />
          <PlaceFitNote item={{ id: place.id, type: "place", placeType: place.placeType, suitability: place.suitability, activitiesNearby: place.activitiesNearby, stayPriceBand: place.stayPriceBand, destinationId: place.destinationId }} />
        </div>
      </section>

      {utilityFacts.length ? (
        <section className="playUtilityStrip">
          <div className="container playUtilityRow">{utilityFacts.join(" · ")}</div>
        </section>
      ) : null}

      {immersive ? <ImmersiveRun items={gallery} title={place.title} /> : null}
      {immersive && place.aroundTake ? <section className="immersiveStatement"><div className="container"><span>UNSERE SICHT.</span><p>{place.aroundTake}</p></div></section> : null}
      {immersive ? <ResearchDraftNote /> : null}

      {hasWhyPlayIt ? (
        <section className="section playSection">
          <div className="container">
            <div className="eyebrow lime">PLAY / EDITORIAL</div>
            <h2 className="sectionTitle">WARUM SPIELEN.</h2>
            {place.whyWeLikeIt ? <p className="playWhyLead">{place.whyWeLikeIt}</p> : null}
            {place.aroundTake && !immersive ? (
              <div className="playAroundTake">
                <span className="playAroundTakeLabel">UNSERE SICHT.</span>
                <p>{place.aroundTake}</p>
              </div>
            ) : null}

            {hasWhyPlayItGrid ? (
              <div className="playWhyGrid">
                {place.theFeel?.length ? (
                  <div className="playWhyBlock">
                    <span className="playWhyLabel">DAS GEFÜHL.</span>
                    <div className="playTagList">{place.theFeel.map(tag => <span key={tag}>{tag}</span>)}</div>
                  </div>
                ) : null}
                {place.bestFor?.length ? (
                  <div className="playWhyBlock">
                    <span className="playWhyLabel">IDEAL FÜR.</span>
                    <div className="playTagList">{place.bestFor.map(tag => <span key={tag}>{tag}</span>)}</div>
                  </div>
                ) : null}
                {place.aroundMoment ? (
                  <div className="playWhyBlock">
                    <span className="playWhyLabel">DER MOMENT.</span>
                    <p>{place.aroundMoment}</p>
                  </div>
                ) : null}
                {place.knowBeforeYouGo ? (
                  <div className="playWhyBlock">
                    <span className="playWhyLabel">BEVOR DU FÄHRST.</span>
                    <p>{place.knowBeforeYouGo}</p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {gallery.length > 0 && !immersive && (
        <section className="section playSection placeGallerySection">
          <div className="container">
            <div className="placeGalleryIntro">
              <div className={`eyebrow ${place.accent}`}>PLAY / IMAGES</div>
              <h2 className="sectionTitle">LOOK<br/>AROUND.</h2>
              <p>Ein Platz entscheidet sich nicht in einem Bild. Lage, Bahnen, Licht und Atmosphäre gehören zusammen.</p>
            </div>
            <PlaceGallery items={gallery} title={place.title} />
          </div>
        </section>
      )}

      <StoryRail
        stories={place.stories || []}
        eyebrow="STORIES / PLAY"
        title="DIE GESCHICHTE DAHINTER."
        className="playSection"
      />

      {planFacts.length ? (
        <section className="section playSection">
          <div className="container">
            <div className="eyebrow blue">PLAY / PLANNING</div>
            <h2 className="sectionTitle">RUNDE PLANEN.</h2>
            <div className="planFactsGrid">
              {planFacts.map(fact => <div className="fact" key={fact.label}><small>{fact.label}</small><strong title={fact.value}>{fact.value}</strong></div>)}
            </div>
          </div>
        </section>
      ) : null}

      {place.goodToKnow && place.goodToKnow.length > 0 && (
        <section className="section playSection">
          <div className="container">
            <div className="eyebrow lime">GUT ZU WISSEN</div>
            <div className="factsGrid">
              {place.goodToKnow.map((fact,index)=><div className="fact" key={`${fact.label}-${index}`}><small>{fact.label}</small><strong>{fact.value}</strong></div>)}
            </div>
          </div>
        </section>
      )}

      {hasOfficialInfo ? (
        <section className="section playSection">
          <div className="container">
            <div className="eyebrow lime">PLAY / OFFIZIELLE INFOS</div>
            <h2 className="sectionTitle">OFFIZIELLE INFOS.</h2>
            <div className="playOfficialPanel">
              <div className="playOfficialStatus">
                {operatorConfirmed ? (
                  <>
                    <strong>Vom Betreiber bestätigt</strong>
                    {lastVerified ? <small>Zuletzt bestätigt: {lastVerified}</small> : null}
                  </>
                ) : (
                  <strong>Quelle: offizielle Website</strong>
                )}
              </div>
              <div className="playOfficialActions">
                {place.website ? <a className="secondary" href={place.website} target="_blank" rel="noreferrer">OFFIZIELLE WEBSITE ↗</a> : null}
                {place.bookingUrl ? (
                  <a className="primary" href={place.bookingUrl} data-track="booking" target="_blank" rel="noreferrer">
                    {(place.bookingLabel || "Tee Times / Greenfees").toUpperCase()} ↗
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {aroundItGroups.length ? (
        <section className="section playSection">
          <div className="container">
            <div className="eyebrow lime">PLAY / TRIP</div>
            <h2 className="sectionTitle" style={{margin:"14px 0 40px"}}>DARAUS WIRD EINE REISE.</h2>
            {aroundItGroups.map(group => (
              <div className="playTripGroup" key={group.role}>
                <div className="playTripGroupLabel">{group.label}</div>
                <div className="cardGrid">{group.items.map(item => <ContentCard key={item.id} item={item}/>)}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {place.destination && !aroundItGroups.length ? (
        <section className="section playSection">
          <div className="container">
            <div className="eyebrow lime">PLAY / TRIP</div>
            <h2 className="sectionTitle" style={{margin:"14px 0 40px"}}>DARAUS WIRD EINE REISE.</h2>
            <p>
              Entdecke mehr rund um diesen Platz in{" "}
              <Link className="textLink" href={`/destinations/${place.destination.slug}`}>{place.destination.title}</Link>.
            </p>
          </div>
        </section>
      ) : null}
    </main>
  );
}
