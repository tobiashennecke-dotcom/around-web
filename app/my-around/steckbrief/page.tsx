import type { Metadata } from "next";
import { SteckbriefClient } from "./SteckbriefClient";

export const metadata: Metadata = { title: "Golfer-Steckbrief", robots: { index: false, follow: false } };

export default function SteckbriefPage() {
  return (
    <main className="myAroundPage">
      <section className="myAroundHero">
        <div className="container myAroundHeroGrid">
          <div>
            <div className="eyebrow lime">MY AROUND · STECKBRIEF</div>
            <h1>SO SPIELST<br/>DU.</h1>
          </div>
          <div className="myAroundHeroAside">
            <p className="serif">Dein Profil als Story-Karte. Speichern, in die Story packen, Flight markieren.</p>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SteckbriefClient />
        </div>
      </section>
    </main>
  );
}
