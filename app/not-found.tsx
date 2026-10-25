import Link from "next/link";

export const metadata = {
  title: "Seite nicht gefunden",
  robots: { index: false }
};

export default function NotFound() {
  return (
    <main>
      <section className="section notFound">
        <div className="container">
          <div className="eyebrow lime">404 / NICHT GEFUNDEN</div>
          <h1 className="sectionTitle notFoundTitle">DIESE SEITE GIBT ES HIER NICHT.</h1>
          <p className="notFoundCopy">
            Vielleicht ist sie offline gegangen oder der Link hat sich geändert. Von hier aus geht es trotzdem weiter.
          </p>
          <div className="notFoundLinks">
            <Link className="primary" href="/discover">ENTDECKEN →</Link>
            <Link className="textLink" href="/search">SUCHE →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
