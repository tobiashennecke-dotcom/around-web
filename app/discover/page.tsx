import Link from "next/link";
import { ContentCard, contentHref } from "@/components/ContentCard";
import { getDiscoverContent } from "@/lib/content";
import type { ContentCard as CardType } from "@/lib/types";

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
      <section className="discoverHero discoverHeroV13">
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

      <section className="tripDiscoverySection">
        <div className="container">
          <div className="tripDiscoveryHead">
            <div>
              <div className="eyebrow lime">BUILD A TRIP</div>
              <h2>PLAY. STAY.<br/>EAT. DO.</h2>
            </div>
            <p>Golf ist der Start. Eine Reise entsteht aus den richtigen Bausteinen davor, danach und dazwischen.</p>
          </div>
          <div className="tripDiscoveryRoles">
            <Link href="/search?role=play"><b>01</b><span>PLAY</span><small>Runden, für die du hinfährst.</small><i>→</i></Link>
            <Link href="/search?role=stay"><b>02</b><span>STAY</span><small>Orte, an denen du bleiben willst.</small><i>→</i></Link>
            <Link href="/search?role=eat"><b>03</b><span>EAT</span><small>Der nächste wichtige Termin nach der Runde.</small><i>→</i></Link>
            <Link href="/search?role=do"><b>04</b><span>DO</span><small>Der Grund, nicht direkt wieder abzureisen.</small><i>→</i></Link>
          </div>
          <div className="tripDiscoveryFoot"><Link href="/my-around/trips">Meine Trips →</Link><Link href="/search">AROUND durchsuchen →</Link></div>
        </div>
      </section>

      <section className="discoveryPaths discoveryPathsV13">
        <div className="container">
          <div className="sectionHead compactHead">
            <div>
              <div className="eyebrow">START BY MOOD</div>
              <h2 className="sectionTitle">Wonach ist dir?</h2>
            </div>
            <Link className="textLink" href="/search">Oder direkt suchen →</Link>
          </div>
          <div className="pathGrid pathGridV13">
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
        <section className="section discoverLeadSection discoverLeadSectionV13">
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
        <section className="section selectedRailSection selectedRailSectionV13">
          <div className="container">
            <div className="sectionHead compactHead">
              <div>
                <div className="eyebrow lime">AROUND SELECTED</div>
                <h2 className="sectionTitle">Worth keeping.</h2>
              </div>
              <p className="sectionNote serif">Redaktionell ausgewählt. Nicht bezahlt.</p>
            </div>
            <AdaptiveCards items={selected.slice(0,3)} className="selectedDiscoverGrid" />
          </div>
        </section>
      )}

      <section className="section discoverFeedSection discoverFeedSectionV13">
        <div className="container">
          <div className="sectionHead compactHead">
            <div>
              <div className="eyebrow pink">THE MIX</div>
              <h2 className="sectionTitle">Keep going.</h2>
            </div>
            <p className="sectionNote serif">Destination neben Story. Person neben Place. So soll Discovery funktionieren.</p>
          </div>
          <AdaptiveCards items={feed} className="discoverMixGrid" />
        </div>
      </section>
    </main>
  );
}
