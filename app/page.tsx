import Link from "next/link";
import { ContentCard, contentHref } from "@/components/ContentCard";
import { getHomepageContent } from "@/lib/content";
import type { ContentCard as CardType, ContentType } from "@/lib/types";

function unique(items: CardType[]) {
  return Array.from(new Map(items.map(item => [item.id, item])).values());
}

function typeCount(items: CardType[], type: ContentType) {
  return items.filter(item => item.type === type).length;
}

export default async function HomePage() {
  const { featured, latest } = await getHomepageContent();
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
      <section className="hero homeHero">
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

            <div className="leadGrid">
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

              <div className="leadSupport">
                {supporting.map(item => <ContentCard item={item} key={item.id} />)}
              </div>
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
                <span className="indexCount">{typeCount(all, entry.type)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {travel.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="sectionHead">
              <div>
                <div className="eyebrow lime">WORTH THE TRIP</div>
                <h2 className="sectionTitle">Go somewhere.</h2>
              </div>
              <Link className="textLink" href="/search?type=destination">Alle Orte →</Link>
            </div>
            <div className="cardGrid">{travel.map(item => <ContentCard item={item} key={item.id} />)}</div>
          </div>
        </section>
      )}

      {stories.length > 0 && (
        <section className="section storiesSection">
          <div className="container">
            <div className="sectionHead">
              <div>
                <div className="eyebrow blue">STORIES</div>
                <h2 className="sectionTitle">Read beyond<br />the round.</h2>
              </div>
              <Link className="textLink" href="/search?type=story">Alle Stories →</Link>
            </div>
            <div className="cardGrid">{stories.map(item => <ContentCard item={item} key={item.id} />)}</div>
          </div>
        </section>
      )}

      {selected.length > 0 && (
        <section className="selectedSection">
          <div className="container selectedSectionGrid">
            <div>
              <div className="eyebrow">AROUND SELECTED</div>
              <h2>Handverlesen.<br />Nicht gekauft.</h2>
              <p className="serif">Unser redaktionelles Siegel für Dinge und Orte, die wir wirklich weitergeben würden.</p>
            </div>
            <div className="selectedCards">{selected.map(item => <ContentCard item={item} key={item.id} />)}</div>
          </div>
        </section>
      )}

      <section className="dropCta">
        <div className="container dropCtaGrid">
          <div>
            <div className="eyebrow lime">THE DROP / MY AROUND</div>
            <h2>Merken ist der<br />Anfang vom Planen.</h2>
          </div>
          <div>
            <p className="serif">Speichere Orte, Stories und Ideen. Kein Login-Zwang beim Entdecken.</p>
            <Link className="primary" href="/saved">MY AROUND öffnen →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
