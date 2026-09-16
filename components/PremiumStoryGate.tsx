import Link from "next/link";

/**
 * Editorial reading-flow gate, not a generic SaaS paywall wall: no modal, no
 * viewport takeover, no price, no checkout, no trial offer - v1.26f has no
 * payment system at all. Renders inline where the Story body stops, inside
 * the normal document flow, so the reader understands the Story continues,
 * why it stops here, and what AROUND Premium means.
 */
export function PremiumStoryGate() {
  return (
    <section className="premiumStoryGate" aria-labelledby="premium-story-gate-title">
      <div className="eyebrow lime">AROUND PREMIUM</div>
      <h2 id="premium-story-gate-title">KEEP READING WITH AROUND PREMIUM.</h2>
      <p className="serif">
        Selected Original Stories, deeper travel knowledge and smarter planning — built for the
        part of the journey that starts after inspiration.
      </p>
      <p className="premiumStoryGateProposition">
        Original Stories. Smarter Trips. Personal Travel Intelligence.
      </p>
      <div className="premiumStoryGateActions">
        <Link className="primary" href="/premium">EXPLORE AROUND PREMIUM →</Link>
        <Link className="textLink" href="/account">MY ACCOUNT →</Link>
      </div>
    </section>
  );
}
