import type { Metadata } from "next";
import { ProfileClient } from "./ProfileClient";

export const metadata: Metadata = {
  title: "Mein Profil",
  robots: { index: false, follow: false }
};

export default function ProfilePage() {
  return (
    <main className="myAroundPage">
      <section className="myAroundHero">
        <div className="container myAroundHeroGrid">
          <div>
            <div className="eyebrow lime">MY AROUND · PROFIL</div>
            <h1>WIE DU<br/>REIST.</h1>
          </div>
          <div className="myAroundHeroAside">
            <p className="serif">Je mehr AROUND über dein Spiel und deine Reisen weiß, desto besser passen Plätze, Hotels und Stories. Alles freiwillig, alles jederzeit änderbar.</p>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <ProfileClient />
        </div>
      </section>
    </main>
  );
}
