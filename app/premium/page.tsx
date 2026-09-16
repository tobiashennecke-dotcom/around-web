import Link from "next/link";

const PILLARS = [
  {
    index: "01",
    title: "READ DEEPER.",
    description: "Original editorial Stories and Premium Guides."
  },
  {
    index: "02",
    title: "PLAN SMARTER.",
    description: "Advanced Trip Planning and Smart Day Planning."
  },
  {
    index: "03",
    title: "TRAVEL PREPARED.",
    description: "Personal Travel Briefings and Travel Intelligence."
  }
];

/**
 * v1.26f: the Premium proposition/teaser, not a pricing page. No payment
 * system exists yet - this page must never imply one does (no price, no
 * checkout, no waitlist, no auto-opt-in). Some pillars below are foundation
 * work already active (Story access); others are announced future
 * direction, not commercially available today.
 */
export default function PremiumPage() {
  return (
    <main>
      <section className="section premiumHero">
        <div className="container">
          <div className="eyebrow lime">AROUND PREMIUM / COMING SOON</div>
          <h1 className="sectionTitle premiumHeroTitle">
            ORIGINAL STORIES.<br/>SMARTER TRIPS.<br/>PERSONAL TRAVEL INTELLIGENCE.
          </h1>
          <p className="serif premiumHeroCopy">
            AROUND Premium is not higher editorial quality — it is more depth, exclusive editorial
            access, Travel Intelligence, advanced planning and convenience. FREE remains a
            meaningful way to use AROUND.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="premiumPillarGrid">
            {PILLARS.map(pillar => (
              <article className="premiumPillar" key={pillar.index}>
                <span className="premiumPillarIndex">{pillar.index}</span>
                <h2>{pillar.title}</h2>
                <p>{pillar.description}</p>
              </article>
            ))}
          </div>
          <p className="premiumFoundationNote">
            Story access is the first active foundation piece. Advanced Trip Planning, Smart Day
            Planning and Personal Travel Briefings are announced direction, not commercially
            available yet.
          </p>
          <div className="premiumPageActions">
            <Link className="primary" href="/stories">EXPLORE STORIES →</Link>
            <Link className="textLink" href="/my-around">MY AROUND →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
