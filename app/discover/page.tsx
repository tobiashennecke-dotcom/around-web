import Link from "next/link";
import { ContentCard, contentHref } from "@/components/ContentCard";
import { getDiscoverContent } from "@/lib/content";
import type { ContentCard as CardType } from "@/lib/types";

function unique(items: CardType[]) {
  return Array.from(new Map(items.map(item => [item.id, item])).values());
}

export default async function DiscoverPage() {
  const content = unique(await getDiscoverContent());
  const lead = content.find(item => item.featured) || content[0];
  const selected = content.filter(item => item.aroundSelected).slice(0, 6);
  const feed = content.filter(item => item.id !== lead?.id);

  const paths = [
    { index: "01", label: "Worth the Trip", sub: "Golf + Destination", href: "/search?type=destination", accent: "lime" },
    { index: "02", label: "48 Hours", sub: "Ein Wochenende. Gut genutzt.", href: "/search?q=48%20hours", accent: "ink" },
    { index: "03", label: "City + Golf", sub: "Runde rein. Stadt an.", href: "/search?q=city", accent: "blue" },
    { index: "04", label: "Under the Radar", sub: "Nicht überall. Genau deshalb.", href: "/search?q=under%20the%20radar", accent: "pink" },
    { index: "05", label: "Food First", sub: "Tee Time ist nicht der einzige Termin.", href: "/search?q=food", accent: "warm" },
    { index: "06", label: "People to Know", sub: "Menschen mit Perspektive.", href: "/search?type=person", accent: "ink" }
  ];

  return (
    <main>
      <section className="discoverHero">
        <div className="container discoverHeroGrid">
          <div>
            <div className="eyebrow lime">ENTDECKEN</div>
            <h1>Orte. Menschen.<br />Ideen. Für dich.</h1>
          </div>
          <div className="discoverHeroAside">
            <p className="serif">Kuratiert statt komplett. AROUND soll dich nicht beschäftigen, sondern irgendwohin bringen.</p>
            <div className="discoverStats">
              <span><b>{content.length}</b> Inhalte</span>
              <span><b>{selected.length}</b> Selected</span>
            </div>
          </div>
        </div>
      </section>

      <section className="discoveryPaths">
        <div className="container">
          <div className="sectionHead compactHead">
            <div>
              <div className="eyebrow">START BY MOOD</div>
              <h2 className="sectionTitle">Wonach ist dir?</h2>
            </div>
            <Link className="textLink" href="/search">Oder direkt suchen →</Link>
          </div>
          <div className="pathGrid">
            {paths.map(path => (
              <Link href={path.href} key={path.label} className={`pathCard pathCard--${path.accent}`}>
                <span className="pathIndex">{path.index}</span>
                <div>
                  <h3>{path.label}</h3>
                  <p className="serif">{path.sub}</p>
                </div>
                <span className="pathArrow">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {lead && (
        <section className="section discoverLeadSection">
          <div className="container discoverLeadGrid">
            <div className="discoverLeadLabel">
              <div className="eyebrow blue">START SOMEWHERE</div>
              <p className="serif">Ein starker Einstieg statt noch ein weiterer Feed.</p>
            </div>
            <Link
              href={contentHref(lead)}
              className={`discoverLead discoverLead--${lead.accent}`}
              style={lead.image ? { backgroundImage: `linear-gradient(180deg,rgba(18,19,18,.05),rgba(18,19,18,.82)),url(${lead.image})` } : undefined}
            >
              {lead.aroundSelected && <span className="selectedBadge">AROUND SELECTED</span>}
              <div className="eyebrow lime">{lead.kicker || "Featured"}</div>
              <div>
                <h2>{lead.title}</h2>
                <p className="serif">{lead.description}</p>
                <span className="textLink">Entdecken →</span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {selected.length > 0 && (
        <section className="section selectedRailSection">
          <div className="container">
            <div className="sectionHead compactHead">
              <div>
                <div className="eyebrow lime">AROUND SELECTED</div>
                <h2 className="sectionTitle">Worth keeping.</h2>
              </div>
              <p className="sectionNote serif">Redaktionell ausgewählt. Nicht bezahlt.</p>
            </div>
            <div className="cardGrid">{selected.slice(0,3).map(item => <ContentCard item={item} key={item.id} />)}</div>
          </div>
        </section>
      )}

      <section className="section discoverFeedSection">
        <div className="container">
          <div className="sectionHead compactHead">
            <div>
              <div className="eyebrow pink">THE MIX</div>
              <h2 className="sectionTitle">Keep going.</h2>
            </div>
            <p className="sectionNote serif">Destination neben Story. Person neben Place. So soll Discovery funktionieren.</p>
          </div>
          <div className="cardGrid">{feed.map(item => <ContentCard item={item} key={item.id} />)}</div>
        </div>
      </section>
    </main>
  );
}
