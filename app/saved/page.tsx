import Link from "next/link";
import { SavedClient } from "./SavedClient";

export default function SavedPage() {
  return (
    <main className="myAroundPage">
      <section className="myAroundHero">
        <div className="container myAroundHeroGrid">
          <div>
            <div className="eyebrow lime">THE DROP / MY AROUND</div>
            <h1>DEINE<br/>AUSWAHL.</h1>
          </div>
          <div className="myAroundHeroAside">
            <span className="drop drop--my-around" aria-hidden="true" />
            <p className="serif">Merken ist kein Endpunkt. Hier beginnt aus einzelnen Funden langsam eine Reise.</p>
          </div>
        </div>
      </section>

      <section className="section myAroundContent">
        <div className="container">
          <SavedClient />
          <div className="myAroundContinue">
            <Link className="primary" href="/discover">Weiter entdecken →</Link>
            <Link className="textLink" href="/search">Gezielt suchen →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
