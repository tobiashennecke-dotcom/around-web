import Link from "next/link";
import { ContentCard } from "@/components/ContentCard";
import { cityGolf, content, lisbon, stories } from "@/lib/sample-content";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="container">
          <div className="eyebrow lime">THIS IS AROUND</div>
          <h1>Die Runde ist<br/>erst der Anfang.</h1>
          <p className="heroIntro">
            Orte, Menschen, Ideen und Reisen für alle, die Golf nicht als Grenze,
            sondern als Perspektive sehen.
          </p>
          <div className="heroActions">
            <Link className="primary" href="/discover">AROUND entdecken →</Link>
            <Link className="secondary" href={`/stories/${stories[0].slug}`}>Neueste Story</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="editorialGrid">
            <Link href={`/destinations/${lisbon.slug}`} className="featureCard">
              <div><div className="eyebrow lime">WORTH THE TRIP</div><h2>LISBON</h2></div>
              <p className="serif" style={{fontSize:28,maxWidth:520}}>
                Atlantic golf. City nights. Food worth staying for.
              </p>
            </Link>

            <Link href={`/collections/${cityGolf.slug}`} className="featureCard dark">
              <div><div className="eyebrow lime">AROUND COLLECTION</div><h2>CITY +<br/>GOLF</h2></div>
              <p className="serif" style={{fontSize:24}}>Städte, bei denen 18 Löcher nicht reichen.</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="eyebrow">THIS IS AROUND</div>
          <h2 className="sectionTitle" style={{margin:"14px 0 40px"}}>Entdecken.</h2>
          <div className="cardGrid">
            {content.slice(0,6).map(item => <ContentCard item={item} key={item.id} />)}
          </div>
        </div>
      </section>
    </main>
  );
}
