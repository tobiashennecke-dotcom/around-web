import Link from "next/link";
import { ContentCard } from "@/components/ContentCard";
import { content } from "@/lib/sample-content";

export default function DiscoverPage() {
  const moods = [
    ["WORTH THE TRIP","/destinations/lisbon"],
    ["48 HOURS","/destinations/lisbon"],
    ["CITY + GOLF","/collections/city-golf"],
    ["UNDER THE RADAR","/stories/warum-lissabon-mehr-ist-als-golf"],
    ["FOOD FIRST","/places/prado"],
    ["ROADTRIP","/search?q=roadtrip"]
  ];

  return (
    <main>
      <section className="hero" style={{minHeight:"58vh"}}>
        <div className="container">
          <div className="eyebrow lime">Entdecken</div>
          <h1>Orte. Menschen.<br/>Ideen. Für dich.</h1>
          <p className="heroIntro">Golf ist der Anfang. Alles darum herum ist das Produkt.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cardGrid">
            {moods.map(([label,href],i)=>(
              <Link href={href} key={label} className={`featureCard ${i===2 ? "limeBg": i===3 ? "dark":""}`} style={{minHeight:340}}>
                <div className="eyebrow">{String(i+1).padStart(2,"0")}</div>
                <h2 style={{fontSize:50}}>{label}</h2>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="eyebrow blue">Curated, not complete.</div>
          <h2 className="sectionTitle" style={{margin:"14px 0 40px"}}>Was bleibt hängen?</h2>
          <div className="cardGrid">
            {content.map(item => <ContentCard item={item} key={item.id} />)}
          </div>
        </div>
      </section>
    </main>
  );
}
