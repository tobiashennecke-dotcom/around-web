import { TripsClient } from "./TripsClient";

export default function MyTripsPage() {
  return (
    <main className="myTripsPage">
      <section className="myTripsHero">
        <div className="container myTripsHeroGrid">
          <div>
            <div className="eyebrow lime">MY AROUND / TRIPS</div>
            <h1>AUS AUSWAHL<br/>WIRD REISE.</h1>
          </div>
          <p className="serif">Noch keine Buchungsmaschine. Sondern der Ort, an dem aus Places, Stories und Ideen ein Plan entsteht.</p>
        </div>
      </section>
      <section className="section myTripsContent">
        <div className="container"><TripsClient /></div>
      </section>
    </main>
  );
}
