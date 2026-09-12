import Link from "next/link";
import { SaveButton } from "@/components/SaveButton";
import { TripPicker } from "@/components/TripPicker";
import { ContentCard } from "@/components/ContentCard";
import { PlaceGallery } from "@/components/PlaceGallery";
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
  play: "PLAY NEXT",
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
    { label: "BEST TIME", value: daypartLabel(place.suggestedDaypart) },
    { label: "ROUND", value: formatDuration(place.suggestedDurationMinutes) },
    { label: "GETTING AROUND", value: gettingAround },
    { label: "PRACTICE", value: place.practiceFacilities?.length ? place.practiceFacilities.join(" · ") : undefined },
    { label: "GUEST PLAY", value: place.guestPlay },
    { label: "SEASON", value: place.season }
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));

  const hasOfficialInfo = Boolean(place.website || place.bookingUrl);
  const operatorConfirmed = place.operatorStatus?.source === "operator";
  const lastVerified = formatDate(place.operatorStatus?.lastVerifiedAt);

  const aroundItGroups = groupAroundIt(place.aroundIt);

  return (
    <main>
      <section
        className={`hero ${place.image ? "heroWithImage" : ""}`}
        style={place.image ? {backgroundImage:`linear-gradient(rgba(18,20,19,.25),rgba(18,20,19,.8)),url(${place.image})`} : undefined}
      >
        <div className="container">
          <div className={`eyebrow ${place.accent}`}>{place.aroundSelected ? "AROUND SELECTED · PLAY" : "PLAY"}</div>
          <h1>{place.title.toUpperCase()}</h1>
          <p className="heroIntro">{place.description}</p>
          <div className="heroActions">
            <TripPicker item={savePayload} />
            <SaveButton sourceId={place.id} sourceType={place.type} title={place.title} slug={place.slug} placeType={place.placeType} label="Merken" />
            {place.bookingUrl ? (
              <a className="secondary" href={place.bookingUrl} target="_blank" rel="noreferrer">
                {(place.bookingLabel || "Tee Times / Greenfees").toUpperCase()} ↗
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {utilityFacts.length ? (
        <section className="playUtilityStrip">
          <div className="container playUtilityRow">{utilityFacts.join(" · ")}</div>
        </section>
      ) : null}

      {hasWhyPlayIt ? (
        <section className="section">
          <div className="container">
            <div className="eyebrow lime">PLAY / EDITORIAL</div>
            <h2 className="sectionTitle">WHY PLAY IT.</h2>
            {place.whyWeLikeIt ? <p className="playWhyLead serif">{place.whyWeLikeIt}</p> : null}
            {place.aroundTake ? <p className="playWhyTake">{place.aroundTake}</p> : null}

            {hasWhyPlayItGrid ? (
              <div className="playWhyGrid">
                {place.theFeel?.length ? (
                  <div className="playWhyBlock">
                    <span className="playWhyLabel">THE FEEL.</span>
                    <div className="playTagList">{place.theFeel.map(tag => <span key={tag}>{tag}</span>)}</div>
                  </div>
                ) : null}
                {place.bestFor?.length ? (
                  <div className="playWhyBlock">
                    <span className="playWhyLabel">BEST FOR.</span>
                    <div className="playTagList">{place.bestFor.map(tag => <span key={tag}>{tag}</span>)}</div>
                  </div>
                ) : null}
                {place.aroundMoment ? (
                  <div className="playWhyBlock">
                    <span className="playWhyLabel">THE AROUND MOMENT.</span>
                    <p>{place.aroundMoment}</p>
                  </div>
                ) : null}
                {place.knowBeforeYouGo ? (
                  <div className="playWhyBlock">
                    <span className="playWhyLabel">KNOW BEFORE YOU GO.</span>
                    <p>{place.knowBeforeYouGo}</p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {gallery.length > 0 && (
        <section className="section placeGallerySection">
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

      {planFacts.length ? (
        <section className="section">
          <div className="container">
            <div className="eyebrow blue">PLAY / PLANNING</div>
            <h2 className="sectionTitle">PLAN YOUR ROUND.</h2>
            <div className="factsGrid">
              {planFacts.map(fact => <div className="fact" key={fact.label}><small>{fact.label}</small><strong>{fact.value}</strong></div>)}
            </div>
          </div>
        </section>
      ) : null}

      {place.goodToKnow && place.goodToKnow.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="eyebrow lime">GOOD TO KNOW</div>
            <div className="factsGrid">
              {place.goodToKnow.map((fact,index)=><div className="fact" key={`${fact.label}-${index}`}><small>{fact.label}</small><strong>{fact.value}</strong></div>)}
            </div>
          </div>
        </section>
      )}

      {hasOfficialInfo ? (
        <section className="section">
          <div className="container">
            <div className="eyebrow lime">PLAY / OFFICIAL INFO</div>
            <h2 className="sectionTitle">OFFICIAL INFO.</h2>
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
                  <a className="primary" href={place.bookingUrl} target="_blank" rel="noreferrer">
                    {(place.bookingLabel || "Tee Times / Greenfees").toUpperCase()} ↗
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {aroundItGroups.length ? (
        <section className="section">
          <div className="container">
            <div className="eyebrow lime">PLAY / TRIP</div>
            <h2 className="sectionTitle" style={{margin:"14px 0 40px"}}>MAKE A TRIP OF IT.</h2>
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
        <section className="section">
          <div className="container">
            <div className="eyebrow lime">PLAY / TRIP</div>
            <h2 className="sectionTitle" style={{margin:"14px 0 40px"}}>MAKE A TRIP OF IT.</h2>
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
