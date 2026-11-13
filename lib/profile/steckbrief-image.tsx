import { ImageResponse } from "next/og";
import { LOGO_FULL_VIEWBOX, LOGO_LIME, RING_PATH, TAGLINE_PATH, WORDMARK_PATH } from "@/lib/brand-logo";
import type { SteckbriefData } from "@/lib/profile/steckbrief";

const INK = "#212322";
const WARM = "#F5F3EE";
const LIME = "#D6EA2A";

/** 1080×1920 PNG of a Golfer-Steckbrief. */
export function renderSteckbrief(card: SteckbriefData) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: INK, color: WARM, padding: "150px 80px 90px" }}>
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700, letterSpacing: 6, color: LIME }}>GOLFER-STECKBRIEF</div>
        <div style={{ display: "flex", fontSize: card.name.length > 14 ? 110 : 150, fontWeight: 900, lineHeight: 0.95, marginTop: 28, letterSpacing: -4 }}>
          {card.name.toUpperCase()}
        </div>
        {card.motto ? (
          <div style={{ display: "flex", fontSize: 40, lineHeight: 1.25, marginTop: 34, color: "#C9CBC6" }}>„{card.motto}“</div>
        ) : null}

        <div style={{ display: "flex", marginTop: 60, borderTop: `4px solid ${WARM}` }}>
          {[
            [String(card.stats.courses), "PLÄTZE"],
            [String(card.stats.countries), "LÄNDER"],
            [`${card.stats.bucketDone}/${card.stats.bucketTotal}`, "BUCKET LIST"]
          ].map(([value, label], index) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", flex: 1, padding: "28px 0 0", paddingLeft: index ? 28 : 0, borderLeft: index ? "1px solid #4a4d49" : "none" }}>
              <div style={{ display: "flex", fontSize: 96, fontWeight: 900, color: index === 0 ? LIME : WARM, lineHeight: 1 }}>{value}</div>
              <div style={{ display: "flex", fontSize: 24, fontWeight: 700, letterSpacing: 4, marginTop: 10 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 60 }}>
          {card.facts.map(fact => (
            <div key={fact.label} style={{ display: "flex", justifyContent: "space-between", padding: "20px 0", borderBottom: "1px solid #4a4d49", fontSize: 34 }}>
              <div style={{ display: "flex", color: "#9b9d9a", fontSize: 26, letterSpacing: 3, fontWeight: 700 }}>{fact.label.toUpperCase()}</div>
              <div style={{ display: "flex", fontWeight: 700, maxWidth: 560, textAlign: "right" }}>{fact.value}</div>
            </div>
          ))}
        </div>

        {card.badges.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 44 }}>
            {card.badges.map(badge => (
              <div key={badge} style={{ display: "flex", background: LIME, color: INK, fontSize: 26, fontWeight: 800, padding: "12px 18px", marginRight: 14, marginBottom: 14 }}>{badge}</div>
            ))}
          </div>
        ) : null}

        <div style={{ display: "flex", flex: 1 }} />
        <svg width="460" height="137" viewBox={LOGO_FULL_VIEWBOX}>
          <path d={WORDMARK_PATH} fill={WARM} fillRule="evenodd" />
          <path d={TAGLINE_PATH} fill={WARM} fillRule="evenodd" />
          <path d={RING_PATH} fill={LOGO_LIME} fillRule="evenodd" />
        </svg>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      headers: { "Cache-Control": "private, no-store" }
    }
  );
}
