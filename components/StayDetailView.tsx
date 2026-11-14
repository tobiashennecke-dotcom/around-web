import Link from "next/link";
import { ImmersiveRun } from "./ImmersiveRun";
import { ResearchDraftNote } from "./ResearchDraftNote";
import { SaveButton } from "@/components/SaveButton";
import { PlaceFitNote } from "@/components/PlaceFitNote";
import { stayPriceLabel } from "@/lib/fit-tags";
import { TripPicker } from "@/components/TripPicker";
import { ContentCard } from "@/components/ContentCard";
import { PlaceGallery } from "@/components/PlaceGallery";
import { StoryRail } from "@/components/StoryRail";
import { normalizeContentRole, type ContentRole } from "@/lib/content-role";
import type { Place, PlaceMediaItem } from "@/lib/types";
import { sizedImage } from "@/lib/content";
import { formatMonthRanges, timeDifference } from "@/lib/travel-facts";

function formatDate(value?: string) {
  if (!value) return undefined;
  try {
    return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
  } catch {
    return undefined;
  }
}

function nightsRange(min?: number, max?: number) {
  if (min && max) return min === max ? `${min} Nächte` : `${min}–${max} Nächte`;
  if (min) return `ab ${min} Nächten`;
  if (max) return `bis ${max} Nächte`;
  return undefined;
}

type Chapter = { key: string; label: string; title: string; text: string; tags?: string[]; image?: PlaceMediaItem };

type TripGroupKey = ContentRole | "other";

const aroundItGroupLabels: Record<TripGroupKey, string> = {
  play: "PLAY",
  eat: "EAT",
  do: "DO",
  stay: "ANDERE STAYS",
  other: "OTHER"
};
const aroundItGroupOrder: TripGroupKey[] = ["play", "eat", "do", "stay", "other"];

function tripGroupFor(placeType?: string): TripGroupKey {
  return normalizeContentRole(placeType) || "other";
}

function normalizeFactValue(value: string) {
  return value.trim().toLowerCase();
}

/**
 * Legacy `goodToKnow` facts predate the STAY-V2 fields and can end up restating
 * one verbatim (e.g. a legacy "Best for" fact duplicating the new bestFor tags).
 * Never edits/removes the underlying Sanity content - only suppresses a fact from
 * this page's render when its value is an exact match (case/whitespace-insensitive)
 * of a value already shown elsewhere on the page. Generic across any STAY
 * document; a legacy fact with no matching V2 value survives untouched.
 */
function visibleGoodToKnow(place: Place) {
  const facts = place.goodToKnow || [];
  if (!facts.length) return [];

  const shownElsewhere = new Set(
    [
      place.roomSummary, place.spaSummary, place.foodSummary, place.breakfastSummary,
      place.parkingSummary, place.dogPolicy, place.checkIn, place.checkOut,
      ...(place.bestFor || [])
    ]
      .filter((value): value is string => Boolean(value))
      .map(normalizeFactValue)
  );

  return facts.filter(fact => !shownElsewhere.has(normalizeFactValue(fact.value)));
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
  const immersive = Boolean(place.unlisted && gallery.length >= 4);
  const savePayload = { sourceId: place.id, sourceType: place.type, sourceRole: "stay" as ContentRole, title: place.title, slug: place.slug };

  // ---- Verdict card (from proposal C): the decision at a glance, right under the hero
  const nights = nightsRange(place.recommendedNightsMin, place.recommendedNightsMax);
  const months = formatMonthRanges(place.destinationFacts?.bestMonths);
  const time = timeDifference(place.destinationFacts?.timeZone);
  const golfFact = (place.goodToKnow || []).find(fact => /golf/i.test(fact.label))?.value
    || (place.nearbyCourses?.[0] ? `${place.nearbyCourses[0].title} · ~${Math.round(place.nearbyCourses[0].distanceKm)} km` : undefined);
  const verdictFacts = [
    { label: "IDEAL FÜR", value: place.bestFor?.length ? place.bestFor.join(", ") : undefined },
    { label: "PREIS", value: stayPriceLabel(place.stayPriceBand, place.stayBoard) },
    { label: "BLEIBEN", value: nights },
    { label: "GOLF", value: golfFact },
    { label: "REISEZEIT", value: [months, time ? `${time.label === "Keine" ? "keine Zeitverschiebung" : time.label}` : undefined].filter(Boolean).join(" · ") || undefined },
    { label: "CHARAKTER", value: place.stayCharacter }
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value)).slice(0, 4);

  // ---- Chapters (proposal A): image and text alternate, each fed by an existing field.
  // Images come from the gallery in editor order; when they run out a chapter stays text-only.
  const chapterSources = [
    { key: "why", label: "WARUM HIER", title: "Warum hier schlafen.", text: place.whyWeLikeIt, tags: place.theFeel },
    { key: "golf", label: "PLAY", title: "Warum das für Golfer passt.", text: place.golfBaseWhy },
    { key: "rooms", label: "ZIMMER", title: "Das Zimmer.", text: place.roomSummary },
    { key: "spa", label: "SPA", title: "Runterkommen.", text: place.spaSummary },
    { key: "food", label: "ESSEN", title: "Am Tisch.", text: [place.foodSummary, place.breakfastSummary].filter(Boolean).join(" ") || undefined }
  ];
  let imageIndex = 0;
  const nextImage = () => (immersive ? undefined : gallery[imageIndex++]);
  const chapters: Chapter[] = chapterSources
    .filter(source => Boolean(source.text))
    .map(source => ({ key: source.key, label: source.label, title: source.title, text: source.text as string, tags: source.tags, image: nextImage() }));
  const momentImage = place.aroundMoment ? nextImage() : undefined;
  const restGallery = immersive ? [] : gallery.slice(imageIndex);
  const momentAfter = Math.min(2, chapters.length);

  const yourStayFacts = [
    { label: "PARKEN", value: place.parkingSummary },
    { label: "HUNDE", value: place.dogPolicy },
    { label: "CHECK-IN", value: place.checkIn },
    { label: "CHECK-OUT", value: place.checkOut }
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));
  const goodToKnow = visibleGoodToKnow(place).filter(fact => fact.value !== golfFact);
  const allFacts = [...goodToKnow, ...yourStayFacts];

  const hasOfficialInfo = Boolean(place.website || place.bookingUrl);
  const operatorConfirmed = place.operatorStatus?.source === "operator";
  const lastVerified = formatDate(place.operatorStatus?.lastVerifiedAt);
  const aroundItGroups = groupAroundIt(place.aroundIt);

  const renderChapter = (chapter: Chapter, index: number) => (
    // Fixed rhythm: 60/40 image left, 40/60 image right, 50/50 image left, then repeat.
    <section key={chapter.key} className={`stayChapter stayChapter--${["a", "b", "c"][index % 3]} ${chapter.image ? "" : "stayChapter--textOnly"}`}>
      <div className="container stayChapterGrid">
      {chapter.image ? (
        <div className="stayChapterMedia">
          <img src={sizedImage(chapter.image.url, 1400)} alt={chapter.image.alt || ""} loading="lazy" decoding="async" />
        </div>
      ) : null}
      <div className="stayChapterCopy">
        <span className="stayChapterLabel">{String(index + 1).padStart(2, "0")} · {chapter.label}</span>
        <h2>{chapter.title}</h2>
        <p>{chapter.text}</p>
        {chapter.tags?.length ? <div className="stayTagList">{chapter.tags.map(tag => <span key={tag}>{tag}</span>)}</div> : null}
      </div>
      </div>
    </section>
  );

  return (
    <main className="stayV2">
      <section className={`stayHeroV2 ${place.image ? "" : "stayHeroV2--noImage"}`}>
        {place.image ? <img className="stayHeroV2Media" src={sizedImage(place.image, 2200) || place.image} alt="" fetchPriority="high" /> : null}
        <div className="stayHeroV2Shade" aria-hidden="true" />
        <div className="container stayHeroV2Inner">
          <div>
            <div className="eyebrow lime">{place.aroundSelected ? "AROUND SELECTED · " : ""}STAY{place.destination ? ` · ${place.destination.title.toUpperCase()}` : ""}</div>
            <h1>{place.title}</h1>
          </div>
          {place.description ? <p className="stayHeroV2Intro">{place.description}</p> : null}
        </div>
      </section>

      <section className="stayVerdict" aria-label="Das AROUND-Urteil">
        <div className="container stayVerdictGrid">
          <div className="stayVerdictTake">
            <span className="stayVerdictLabel">UNSERE SICHT</span>
            <p>{place.aroundTake ? `„${place.aroundTake}“` : place.description}</p>
          </div>
          {verdictFacts.length ? (
            <dl className="stayVerdictFacts">
              {verdictFacts.map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
            </dl>
          ) : null}
          <div className="stayVerdictActions">
            {place.bookingUrl ? (
              <a className="stayCtaBooking" href={place.bookingUrl} data-track="booking" target="_blank" rel="noreferrer">
                {(place.bookingLabel || "Verfügbarkeit prüfen").toUpperCase()} ↗
              </a>
            ) : null}
            <div className="stayCtaTrip"><TripPicker item={savePayload} label="+ ZUM TRIP" /></div>
            <div className="stayCtaSave"><SaveButton sourceId={place.id} sourceType={place.type} title={place.title} slug={place.slug} placeType={place.placeType} label="Merken" /></div>
          </div>
          <PlaceFitNote item={{ id: place.id, type: "place", placeType: place.placeType, suitability: place.suitability, activitiesNearby: place.activitiesNearby, stayPriceBand: place.stayPriceBand, destinationId: place.destinationId }} />
        </div>
      </section>

      {immersive ? <ImmersiveRun items={gallery} title={place.title} /> : null}
      {immersive ? <ResearchDraftNote /> : null}

      {chapters.slice(0, momentAfter).map(renderChapter)}

      {place.aroundMoment ? (
        <section className={`stayMoment ${momentImage ? "" : "stayMoment--noImage"}`}>
          {momentImage ? <img src={sizedImage(momentImage.url, 2000)} alt={momentImage.alt || ""} loading="lazy" decoding="async" /> : null}
          <div className="stayMomentShade" aria-hidden="true" />
          <div className="container stayMomentInner">
            <span className="stayChapterLabel">DER MOMENT</span>
            <p>{place.aroundMoment}</p>
          </div>
        </section>
      ) : null}

      {chapters.slice(momentAfter).map((chapter, i) => renderChapter(chapter, i + momentAfter))}

      {place.nearbyCourses && place.nearbyCourses.length ? (
        <section className="section staySection">
          <div className="container">
            <div className="eyebrow lime">PLAY / IN DER NÄHE</div>
            <h2 className="sectionTitle">Abschläge.</h2>
            <div className="cardGrid" style={{marginTop:30}}>
              {place.nearbyCourses.map(course => (
                <div className="stayCourseCard" key={course.id}>
                  <ContentCard item={course} />
                  <span className="stayCourseDistance">~{Math.round(course.distanceKm)} KM LUFTLINIE</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {restGallery.length > 0 && (
        <section className="section staySection placeGallerySection">
          <div className="container">
            <div className="placeGalleryIntro">
              <div className={`eyebrow ${place.accent}`}>MEHR BILDER</div>
              <h2 className="sectionTitle">LOOK<br/>AROUND.</h2>
            </div>
            <PlaceGallery items={restGallery} title={place.title} />
          </div>
        </section>
      )}

      {allFacts.length ? (
        <section className="stayFactsBand" aria-label="Gut zu wissen">
          <div className="container">
            <div className="stayFactsBandLabel">GUT ZU WISSEN</div>
            <dl className="stayFactsBandGrid">
              {allFacts.map((fact, index) => <div key={`${fact.label}-${index}`}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
            </dl>
          </div>
        </section>
      ) : null}

      {place.knowBeforeYouGo || hasOfficialInfo ? (
        <section className="stayBeforeYouGo">
          <div className="container stayBeforeYouGoInner">
            {place.knowBeforeYouGo ? <p><strong>Vor dem Buchen:</strong> {place.knowBeforeYouGo}</p> : <span />}
            {hasOfficialInfo ? (
              <div className="stayOfficialActions">
                {operatorConfirmed ? <small>Vom Betreiber bestätigt{lastVerified ? ` · ${lastVerified}` : ""}</small> : null}
                {place.website ? <a className="textLink" href={place.website} target="_blank" rel="noreferrer">OFFIZIELLE WEBSITE ↗</a> : null}
                {place.bookingUrl ? <a className="textLink" href={place.bookingUrl} data-track="booking" target="_blank" rel="noreferrer">{(place.bookingLabel || "Verfügbarkeit prüfen").toUpperCase()} ↗</a> : null}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <StoryRail
        stories={place.stories || []}
        eyebrow="GESCHICHTEN VON HIER"
        title="MEHR ALS EIN HOTEL."
        className="staySection"
      />

      {aroundItGroups.length ? (
        <section className="section staySection">
          <div className="container">
            <div className="eyebrow lime">STAY / TRIP</div>
            <h2 className="sectionTitle" style={{margin:"14px 0 40px"}}>DARAUS WIRD EINE REISE.</h2>
            {aroundItGroups.map(group => (
              <div className="stayTripGroup" key={group.role}>
                <div className="stayTripGroupLabel">{group.label}</div>
                <div className="cardGrid">{group.items.map(item => <ContentCard key={item.id} item={item}/>)}</div>
              </div>
            ))}
          </div>
        </section>
      ) : place.destination ? (
        <section className="stayDestinationLink">
          <div className="container">
            <Link href={`/destinations/${place.destination.slug}`}>
              <span className="eyebrow">DIE DESTINATION</span>
              <strong>{place.destination.title} entdecken →</strong>
            </Link>
          </div>
        </section>
      ) : null}
    </main>
  );
}
