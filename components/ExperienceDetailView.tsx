import Link from "next/link";
import { SaveButton } from "@/components/SaveButton";
import { PlaceFitNote } from "@/components/PlaceFitNote";
import { TripPicker } from "@/components/TripPicker";
import { ContentCard } from "@/components/ContentCard";
import { PlaceGallery } from "@/components/PlaceGallery";
import { StoryRail } from "@/components/StoryRail";
import { normalizeContentRole, type ContentRole } from "@/lib/content-role";
import type { Place } from "@/lib/types";

type ExperiencePlaceType = "eat" | "drink" | "do" | "culture" | "shop";

type ExperienceConfig = {
  roleLabel: string;
  whyHeading: string;
  utilityHeading: string;
  /** EAT/DRINK: a verified booking URL becomes the hero's primary CTA. DO/CULTURE/SHOP: it stays a visible but non-primary link - not every DO becomes a commerce page. */
  bookingIsPrimaryCta: boolean;
  defaultBookingLabel: string;
};

const EXPERIENCE_CONFIG: Record<ExperiencePlaceType, ExperienceConfig> = {
  eat: { roleLabel: "EAT", whyHeading: "WARUM HIER ESSEN.", utilityHeading: "DER TISCH.", bookingIsPrimaryCta: true, defaultBookingLabel: "Tisch reservieren" },
  drink: { roleLabel: "DRINK", whyHeading: "WARUM HIER TRINKEN.", utilityHeading: "DIE BAR.", bookingIsPrimaryCta: true, defaultBookingLabel: "Tisch reservieren" },
  do: { roleLabel: "DO", whyHeading: "WARUM HIN.", utilityHeading: "ERLEBNIS PLANEN.", bookingIsPrimaryCta: false, defaultBookingLabel: "Jetzt buchen" },
  culture: { roleLabel: "CULTURE", whyHeading: "WARUM HIN.", utilityHeading: "ERLEBNIS PLANEN.", bookingIsPrimaryCta: false, defaultBookingLabel: "Jetzt buchen" },
  shop: { roleLabel: "SHOP", whyHeading: "WARUM HIN.", utilityHeading: "GUT ZU WISSEN.", bookingIsPrimaryCta: false, defaultBookingLabel: "Jetzt buchen" }
};

function resolveConfig(placeType: string): ExperienceConfig {
  return EXPERIENCE_CONFIG[placeType as ExperiencePlaceType] || EXPERIENCE_CONFIG.do;
}

function formatDate(value?: string) {
  if (!value) return undefined;
  try {
    return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
  } catch {
    return undefined;
  }
}

function titleCase(value: string) {
  return value.length ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function titleCaseJoin(values?: string[]) {
  if (!values || !values.length) return undefined;
  return values.map(titleCase).join(" · ");
}

function daypartLabel(value: string) {
  if (value === "morning") return "Morning";
  if (value === "midday") return "Midday";
  if (value === "afternoon") return "Afternoon";
  if (value === "evening") return "Evening";
  if (value === "all_day") return "All day";
  return titleCase(value);
}

function formatDuration(minutes?: number) {
  if (!minutes) return undefined;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  if (!rest) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

function effortLabel(value?: string) {
  if (value === "low") return "Low";
  if (value === "medium") return "Medium";
  if (value === "high") return "High";
  return undefined;
}

function environmentLabel(value?: string) {
  if (value === "indoor") return "Indoor";
  if (value === "outdoor") return "Outdoor";
  if (value === "mixed") return "Mixed";
  return undefined;
}

/** Never render "weatherSensitivity" as a raw threat level - a plain, readable planning fact instead. */
function weatherLabel(value?: string) {
  if (value === "high") return "Weather-sensitive";
  if (value === "medium") return "Some weather sensitivity";
  if (value === "low") return "Not weather-sensitive";
  return undefined;
}

function flexibilityLabel(value?: string) {
  if (value === "flexible") return "Flexible";
  if (value === "fixed") return "Fixpunkt";
  return undefined;
}

type TripGroupKey = ContentRole | "other";

const aroundItGroupLabels: Record<TripGroupKey, string> = {
  play: "PLAY",
  stay: "STAY",
  eat: "EAT",
  do: "DO",
  other: "OTHER"
};
const aroundItGroupOrder: TripGroupKey[] = ["play", "stay", "eat", "do", "other"];

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

type Fact = { label: string; value: string };

/**
 * Trip Fit Engine v1.24b will render personalized claims ("good after your round").
 * Until then, this section only ever shows generic, non-personalized planning facts -
 * never anything implying knowledge of a specific user's trip.
 */
function buildExperienceFacts(place: Place): Fact[] {
  const bestTime = place.compatibleDayparts?.length
    ? place.compatibleDayparts.map(daypartLabel).join(" / ")
    : place.suggestedDaypart
      ? daypartLabel(place.suggestedDaypart)
      : undefined;

  return [
    { label: "TYPE", value: place.experienceType },
    { label: "TIME", value: place.experienceDurationLabel || formatDuration(place.suggestedDurationMinutes) },
    { label: "BESTE ZEIT", value: bestTime },
    { label: "FLEXIBILITÄT", value: flexibilityLabel(place.defaultPlanningMode) },
    { label: "AUFWAND", value: effortLabel(place.effortLevel) },
    { label: "UMGEBUNG", value: environmentLabel(place.environment) },
    { label: "WETTER", value: weatherLabel(place.weatherSensitivity) },
    { label: "SAISON", value: place.season },
    { label: "BUCHEN", value: place.bookingAdvice }
  ].filter((fact): fact is Fact => Boolean(fact.value));
}

function buildEatFacts(place: Place): Fact[] {
  return [
    { label: "CHARAKTER", value: place.eatCharacter },
    { label: "MEAL", value: titleCaseJoin(place.mealTypes) },
    { label: "KÜCHE", value: titleCaseJoin(place.cuisine) },
    { label: "LAGE", value: place.setting },
    { label: "PREIS", value: place.priceLevel },
    { label: "RESERVIERUNG", value: place.reservationAdvice },
    { label: "ERNÄHRUNG", value: place.dietaryNotes }
  ].filter((fact): fact is Fact => Boolean(fact.value));
}

function normalizeFactValue(value: string) {
  return value.trim().toLowerCase();
}

/**
 * Legacy `goodToKnow` facts predate the v1.24 Experience-specific utility fields.
 * Never edits/removes the underlying Sanity content - only suppresses a fact from
 * this page's render when its value is an exact match (case/whitespace-insensitive)
 * of a value already shown in the type-specific utility section above. Generic
 * across any eat/drink/do/culture document; a legacy fact with no matching v1.24
 * value survives untouched. Mirrors StayDetailView's visibleGoodToKnow dedupe.
 */
function visibleLegacyGoodToKnow(place: Place, shownValues: string[]): Fact[] {
  const facts = (place.goodToKnow || []).filter((fact): fact is Fact => Boolean(fact.label && fact.value));
  if (!facts.length) return [];
  const shown = new Set(shownValues.filter(Boolean).map(normalizeFactValue));
  return facts.filter(fact => !shown.has(normalizeFactValue(fact.value)));
}

export function ExperienceDetailView({ place }: { place: Place }) {
  const config = resolveConfig(place.placeType);
  const gallery = place.gallery || [];
  const savePayload = { sourceId: place.id, sourceType: place.type, sourceRole: normalizeContentRole(place.placeType), title: place.title, slug: place.slug };

  const isEatKind = place.placeType === "eat" || place.placeType === "drink";
  const isShop = place.placeType === "shop";
  const utilityFacts: Fact[] = isEatKind
    ? buildEatFacts(place)
    : isShop
      ? (place.goodToKnow || []).filter((fact): fact is Fact => Boolean(fact.label && fact.value))
      : buildExperienceFacts(place);

  // SHOP already renders goodToKnow as its primary utility section above - no separate legacy block for it.
  const legacyGoodToKnow = isShop ? [] : visibleLegacyGoodToKnow(place, utilityFacts.map(fact => fact.value));

  const hasWhyGrid = Boolean(place.theFeel?.length || place.bestFor?.length || place.aroundMoment || place.knowBeforeYouGo);
  const hasWhy = Boolean(place.whyWeLikeIt || hasWhyGrid);

  const hasOfficialInfo = Boolean(place.website || place.bookingUrl);
  const operatorConfirmed = place.operatorStatus?.source === "operator";
  const lastVerified = formatDate(place.operatorStatus?.lastVerifiedAt);

  const aroundItGroups = groupAroundIt(place.aroundIt);
  const bookingLabelText = (place.bookingLabel || config.defaultBookingLabel).toUpperCase();

  return (
    <main>
      <section
        className={`hero experienceHero ${place.image ? "heroWithImage" : ""}`}
        style={place.image ? {backgroundImage:`linear-gradient(rgba(18,20,19,.25),rgba(18,20,19,.8)),url(${place.image})`} : undefined}
      >
        <div className="container">
          <div className={`eyebrow ${place.accent}`}>{place.aroundSelected ? `AROUND SELECTED · ${config.roleLabel}` : config.roleLabel}</div>
          <h1>{place.title.toUpperCase()}</h1>
          <p className="heroIntro">{place.description}</p>
          <div className={`heroActions experienceHeroActions ${place.bookingUrl && config.bookingIsPrimaryCta ? "experienceHeroActions--booking" : ""}`}>
            {place.bookingUrl && config.bookingIsPrimaryCta ? (
              <a className="experienceCtaBooking" href={place.bookingUrl} data-track="booking" target="_blank" rel="noreferrer">{bookingLabelText} ↗</a>
            ) : null}
            <div className="experienceCtaTrip"><TripPicker item={savePayload} label="+ ZUM TRIP" /></div>
            <div className="experienceCtaSave"><SaveButton sourceId={place.id} sourceType={place.type} title={place.title} slug={place.slug} placeType={place.placeType} label="Merken" /></div>
            {place.bookingUrl && !config.bookingIsPrimaryCta ? (
              <a className="experienceCtaBookingSecondary" href={place.bookingUrl} data-track="booking" target="_blank" rel="noreferrer">{bookingLabelText} ↗</a>
            ) : null}
          </div>
          <PlaceFitNote item={{ id: place.id, type: "place", placeType: place.placeType, suitability: place.suitability, activitiesNearby: place.activitiesNearby, stayPriceBand: place.stayPriceBand, destinationId: place.destinationId }} />
        </div>
      </section>

      {hasWhy ? (
        <section className="section experienceSection">
          <div className="container">
            <div className="eyebrow lime">{config.roleLabel} / EDITORIAL</div>
            <h2 className="sectionTitle">{config.whyHeading}</h2>
            {place.whyWeLikeIt ? <p className="experienceWhyLead">{place.whyWeLikeIt}</p> : null}
            {place.aroundTake ? (
              <div className="experienceAroundTake">
                <span className="experienceAroundTakeLabel">UNSERE SICHT.</span>
                <p>{place.aroundTake}</p>
              </div>
            ) : null}

            {hasWhyGrid ? (
              <div className="experienceWhyGrid">
                {place.theFeel?.length ? (
                  <div className="experienceWhyBlock">
                    <span className="experienceWhyLabel">DAS GEFÜHL.</span>
                    <div className="experienceTagList">{place.theFeel.map(tag => <span key={tag}>{tag}</span>)}</div>
                  </div>
                ) : null}
                {place.bestFor?.length ? (
                  <div className="experienceWhyBlock">
                    <span className="experienceWhyLabel">IDEAL FÜR.</span>
                    <div className="experienceTagList">{place.bestFor.map(tag => <span key={tag}>{tag}</span>)}</div>
                  </div>
                ) : null}
                {place.aroundMoment ? (
                  <div className="experienceWhyBlock">
                    <span className="experienceWhyLabel">DER MOMENT.</span>
                    <p>{place.aroundMoment}</p>
                  </div>
                ) : null}
                {place.knowBeforeYouGo ? (
                  <div className="experienceWhyBlock">
                    <span className="experienceWhyLabel">BEVOR DU FÄHRST.</span>
                    <p>{place.knowBeforeYouGo}</p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {utilityFacts.length ? (
        <section className="section experienceSection">
          <div className="container">
            <div className="eyebrow blue">{config.roleLabel} / DETAILS</div>
            <h2 className="sectionTitle">{config.utilityHeading}</h2>
            <div className="experienceFactsGrid">
              {utilityFacts.map((fact,index)=><div className="fact" key={`${fact.label}-${index}`}><small>{fact.label}</small><strong>{fact.value}</strong></div>)}
            </div>
          </div>
        </section>
      ) : null}

      {legacyGoodToKnow.length > 0 && (
        <section className="section experienceSection experienceGoodToKnow">
          <div className="container">
            <div className="eyebrow experienceGoodToKnowEyebrow">GUT ZU WISSEN</div>
            <div className="factsGrid">
              {legacyGoodToKnow.map((fact,index)=><div className="fact" key={`${fact.label}-${index}`}><small>{fact.label}</small><strong>{fact.value}</strong></div>)}
            </div>
          </div>
        </section>
      )}

      {gallery.length > 0 && (
        <section className="section experienceSection placeGallerySection">
          <div className="container">
            <div className="placeGalleryIntro">
              <div className={`eyebrow ${place.accent}`}>{config.roleLabel} / IMAGES</div>
              <h2 className="sectionTitle">LOOK<br/>AROUND.</h2>
              <p>Ein Ort entscheidet sich nicht in einem Bild. Details, Licht und Atmosphäre gehören zusammen.</p>
            </div>
            <PlaceGallery items={gallery} title={place.title} />
          </div>
        </section>
      )}

      <StoryRail
        stories={place.stories || []}
        eyebrow="GESCHICHTEN VON HIER"
        title="WEITERLESEN."
        className="experienceSection"
      />

      {hasOfficialInfo ? (
        <section className="section experienceSection">
          <div className="container">
            <div className="eyebrow lime">{config.roleLabel} / OFFIZIELLE INFOS</div>
            <h2 className="sectionTitle">OFFIZIELLE INFOS.</h2>
            <div className="experienceOfficialPanel">
              <div className="experienceOfficialStatus">
                {operatorConfirmed ? (
                  <>
                    <strong>Vom Betreiber bestätigt</strong>
                    {lastVerified ? <small>Zuletzt bestätigt: {lastVerified}</small> : null}
                  </>
                ) : (
                  <strong>Quelle: offizielle Website</strong>
                )}
              </div>
              <div className="experienceOfficialActions">
                {place.website ? <a className="secondary" href={place.website} target="_blank" rel="noreferrer">OFFIZIELLE WEBSITE ↗</a> : null}
                {place.bookingUrl ? (
                  <a className="primary" href={place.bookingUrl} data-track="booking" target="_blank" rel="noreferrer">{bookingLabelText} ↗</a>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {aroundItGroups.length ? (
        <section className="section experienceSection">
          <div className="container">
            <div className="eyebrow lime">{config.roleLabel} / TRIP</div>
            <h2 className="sectionTitle" style={{margin:"14px 0 40px"}}>DARAUS WIRD EINE REISE.</h2>
            {aroundItGroups.map(group => (
              <div className="experienceTripGroup" key={group.role}>
                <div className="experienceTripGroupLabel">{group.label}</div>
                <div className="cardGrid">{group.items.map(item => <ContentCard key={item.id} item={item}/>)}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {place.destination && !aroundItGroups.length ? (
        <section className="section experienceSection">
          <div className="container">
            <div className="eyebrow lime">{config.roleLabel} / TRIP</div>
            <h2 className="sectionTitle" style={{margin:"14px 0 40px"}}>DARAUS WIRD EINE REISE.</h2>
            <p>
              Entdecke mehr rund um diesen Ort in{" "}
              <Link className="textLink" href={`/destinations/${place.destination.slug}`}>{place.destination.title}</Link>.
            </p>
          </div>
        </section>
      ) : null}
    </main>
  );
}
