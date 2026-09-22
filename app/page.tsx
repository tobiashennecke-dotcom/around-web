import Link from "next/link";
import { ContentCard, contentHref } from "@/components/ContentCard";
import { StoryFeature } from "@/components/StoryFeature";
import { getHomepageContent } from "@/lib/content";
import { getHomepageHero, heroImageUrl } from "@/lib/homepage-hero";
import type { ContentCard as CardType, ContentType } from "@/lib/types";

const HERO_DESKTOP_ASPECT = 16 / 9;
const HERO_MOBILE_ASPECT = 4 / 5;
const HERO_DESKTOP_WIDTHS = [900, 1400, 1900, 2400];
const HERO_MOBILE_WIDTHS = [640, 960, 1280];

function unique(items: CardType[]) {
  return Array.from(new Map(items.map(item => [item.id, item])).values());
}

function AdaptiveCards({ items, className = "" }: { items: CardType[]; className?: string }) {
  return (
    <div className={`cardGrid adaptiveGrid adaptiveGrid--${Math.min(items.length, 3)} ${className}`.trim()}>
      {items.map(item => <ContentCard item={item} key={item.id} />)}
    </div>
  );
}

function heroSrcSet(image: Parameters<typeof heroImageUrl>[0], widths: number[], aspectRatio: number) {
  return widths
    .map(width => {
      const url = heroImageUrl(image, width, aspectRatio);
      return url ? `${url} ${width}w` : null;
    })
    .filter((entry): entry is string => Boolean(entry))
    .join(", ");
}

export default async function HomePage() {
  const [{ featured, latest }, hero] = await Promise.all([getHomepageContent(), getHomepageHero()]);
  const all = unique([...featured, ...latest]);
  const lead = featured[0] || latest[0];
  const supporting = unique(featured.slice(1).concat(latest.filter(item => item.id !== lead?.id))).slice(0, 2);
  const travel = all.filter(item => item.type === "destination" || item.type === "place").slice(0, 3);
  const stories = all.filter(item => item.type === "story").slice(0, 3);
  const selected = all.filter(item => item.aroundSelected).slice(0, 3);

  const index: Array<{ type: ContentType; label: string; hint: string }> = [
    { type: "destination", label: "Reisen", hint: "Orte, die eine Runde wert sind." },
    { type: "place", label: "Places", hint: "Play. Stay. Eat. Do." },
    { type: "story", label: "Stories", hint: "Lesen, weil etwas hängen bleibt." },
    { type: "person", label: "Menschen", hint: "People to know." },
    { type: "product", label: "Objects", hint: "The good stuff." },
    { type: "collection", label: "Collections", hint: "Kuratierte Einstiege." }
  ];

  return (
    <main>
      <section className="hero homeHero homeHeroV13">
        {hero.enabled && hero.desktop && (
          <>
            <picture className="homeHeroMedia">
              <source
                media="(max-width: 620px)"
                srcSet={heroSrcSet(hero.mobile ?? hero.desktop, HERO_MOBILE_WIDTHS, HERO_MOBILE_ASPECT)}
                sizes="100vw"
              />
              <img
                src={heroImageUrl(hero.desktop, HERO_DESKTOP_WIDTHS[HERO_DESKTOP_WIDTHS.length - 1], HERO_DESKTOP_ASPECT)}
                srcSet={heroSrcSet(hero.desktop, HERO_DESKTOP_WIDTHS, HERO_DESKTOP_ASPECT)}
                sizes="100vw"
                width={HERO_DESKTOP_WIDTHS[HERO_DESKTOP_WIDTHS.length - 1]}
                height={Math.round(HERO_DESKTOP_WIDTHS[HERO_DESKTOP_WIDTHS.length - 1] / HERO_DESKTOP_ASPECT)}
                alt={hero.desktop.alt || hero.mobile?.alt || ""}
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </picture>
            <div
              className="homeHeroOverlay"
              style={{ "--hero-overlay": hero.overlay } as React.CSSProperties}
              aria-hidden="true"
            />
          </>
        )}
        <div className="container homeHeroGrid">
          <div>
            <div className="eyebrow lime">THIS IS AROUND</div>
            <h1>Die Runde ist<br />erst der Anfang.</h1>
          </div>
          <div className="homeHeroAside">
            <p className="heroIntro">
              Golf ist die Linse. Nicht die Grenze. Wir kuratieren Orte, Menschen,
              Ideen und Dinge für alle, die nach dem 18. Grün noch nicht fertig sind.
            </p>
            <div className="heroActions">
              <Link className="primary" href="/discover">AROUND entdecken →</Link>
              <Link className="secondary" href="/search">Suchen</Link>
            </div>
          </div>
        </div>
      </section>

      {lead && (
        <section className="section editSection">
          <div className="container">
            <div className="sectionHead">
              <div>
                <div className="eyebrow lime">THE EDIT / 01</div>
                <h2 className="sectionTitle">Start here.</h2>
              </div>
              <p className="sectionNote serif">Ein Einstieg. Danach weitersehen.</p>
            </div>

            <div className={`leadGrid leadGrid--support-${supporting.length}`}>
              <Link
                href={contentHref(lead)}
                className={`leadFeature leadFeature--${lead.accent}`}
                style={lead.image ? { backgroundImage: `linear-gradient(180deg,rgba(15,16,15,.08),rgba(15,16,15,.78)),url(${lead.image})` } : undefined}
              >
                {lead.aroundSelected && <span className="selectedBadge">AROUND SELECTED</span>}
                <div className="leadFeatureMeta eyebrow">{lead.kicker || "Featured"}</div>
                <div className="leadFeatureCopy">
                  <h2>{lead.title}</h2>
                  <p className="serif">{lead.description}</p>
                  <span className="textLink">Öffnen →</span>
                </div>
              </Link>

              {supporting.length > 0 && (
                <div className={`leadSupport leadSupport--${supporting.length}`}>
                  {supporting.map(item => <ContentCard item={item} key={item.id} />)}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="section indexSection">
        <div className="container">
          <div className="sectionHead">
            <div>
              <div className="eyebrow blue">AROUND INDEX</div>
              <h2 className="sectionTitle">Wohin zuerst?</h2>
            </div>
            <p className="sectionNote serif">Nicht alles. Nur das, was einen nächsten Klick verdient.</p>
          </div>
          <div className="indexGrid">
            {index.map((entry, idx) => (
              <Link href={`/search?type=${entry.type}`} className="indexItem" key={entry.type}>
                <span className="indexNumber">{String(idx + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{entry.label}</strong>
                  <small>{entry.hint}</small>
                </div>
                <span className="indexArrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {travel.length > 0 && (
        <section className="section travelSectionV13">
          <div className="container">
            <div className="sectionHead">
              <div>
                <div className="eyebrow lime">WORTH THE TRIP</div>
                <h2 className="sectionTitle">Go somewhere.</h2>
              </div>
              <Link className="textLink" href="/search?type=destination">Alle Orte →</Link>
            </div>
            <AdaptiveCards items={travel} className="travelGrid" />
          </div>
        </section>
      )}

      {stories.length > 0 && (
        <section className="section storiesSection">
          <div className="container">
            <div className="sectionHead">
              <div>
                <div className="eyebrow lime">STORIES</div>
                <h2 className="sectionTitle">Read beyond<br />the round.</h2>
              </div>
              <Link className="textLink" href="/stories">Alle Stories →</Link>
            </div>

            <div className="homeStoriesEditorial">
              {stories.length === 1 ? (
                <div className="homeStoriesLead homeStoriesLead--solo">
                  <StoryFeature story={stories[0]} variant="wide" imageLoading="lazy" />
                </div>
              ) : (
                <div className="homeStoriesGrid">
                  <div className="homeStoriesLead">
                    <StoryFeature story={stories[0]} variant="lead" imageLoading="lazy" />
                  </div>
                  <div className={`homeStoriesSecondary${stories.length === 2 ? " homeStoriesSecondary--solo" : ""}`}>
                    {stories.slice(1).map(story => (
                      <StoryFeature key={story.id} story={story} variant="secondary" imageLoading="lazy" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {selected.length > 0 && (
        <section className="selectedSection">
          <div className="container homeSelectedGrid">
            <div className="selectedManifesto">
              <div className="eyebrow">AROUND SELECTED</div>
              <span className="selectedMark" aria-hidden="true" />
              <h2>Handverlesen.<br />Nicht gekauft.</h2>
              <p className="serif">Unser redaktionelles Siegel für Dinge und Orte, die wir wirklich weitergeben würden.</p>
            </div>
            <div className={`homeSelectedGallery homeSelectedGallery--${selected.length}`}>
              {selected.map(item => <ContentCard item={item} key={item.id} />)}
            </div>
          </div>
        </section>
      )}

      <section className="dropCta dropCtaV13">
        <div className="container dropCtaGrid">
          <div className="dropCtaTitle">
            <div className="eyebrow lime">THE DROP / MY AROUND</div>
            <h2>Merken ist der<br />Anfang vom Planen.</h2>
          </div>
          <div className="dropCtaAside">
            <span className="drop drop--hero" aria-hidden="true" />
            <p className="serif">Speichere Orte, Stories und Ideen. Kein Login-Zwang beim Entdecken.</p>
            <Link className="primary" href="/saved">MY AROUND öffnen →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

// AROUND editorial freshness: refresh published Sanity content without a redeploy.
export const revalidate = 30;
