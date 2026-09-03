import Link from "next/link";

export default function PlanPage() {
  return (
    <main className="planHubPage">
      <section className="planHubHero">
        <div className="container planHubHeroGrid">
          <div>
            <div className="eyebrow lime">MY AROUND / PLANEN</div>
            <h1>MERKEN.<br/>ORDNEN.<br/>LOS.</h1>
          </div>
          <p className="serif">Collections sammeln Möglichkeiten. Trips geben ihnen Zeit und Reihenfolge.</p>
        </div>
      </section>
      <section className="section planHubContent">
        <div className="container planHubGrid">
          <Link href="/my-around/collections" className="planHubCard planHubCard--collection">
            <span>01 / ORGANISIEREN</span>
            <h2>COLLECTIONS.</h2>
            <p>Places, Stories, Menschen und Dinge thematisch zusammenstellen.</p>
            <strong>Collections öffnen →</strong>
          </Link>
          <Link href="/my-around/trips" className="planHubCard planHubCard--trip">
            <span>02 / PLANEN</span>
            <h2>TRIPS.</h2>
            <p>Fundstücke auf Tage verteilen, Timing ergänzen und aus Auswahl Reise machen.</p>
            <strong>Trips öffnen →</strong>
          </Link>
        </div>
      </section>
    </main>
  );
}
