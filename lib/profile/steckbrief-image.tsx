import { ImageResponse } from "next/og";
import { LOGO_FULL_VIEWBOX, LOGO_LIME, RING_PATH, TAGLINE_PATH, WORDMARK_PATH } from "@/lib/brand-logo";
import { nameLayout, wrapText, type SteckbriefData } from "@/lib/profile/steckbrief";

const INK = "#212322";
const WARM = "#F5F3EE";
const LIME = "#D6EA2A";

/** 1080×1920 PNG of a Golfer-Steckbrief. */
export function renderSteckbrief(card: SteckbriefData) {
  const name = nameLayout(card.name);
  const mottoSize = card.motto.length > 70 ? 32 : 40;
  const motto = card.motto ? wrapText(`„${card.motto}“`, 920 / (mottoSize * 0.56), 3) : [];
  // Long names or mottos take room: then fewer facts and badges, so the logo always fits.
  const crowded = name.lines.length * name.size + motto.length * mottoSize * 1.25 > 250;
  const facts = card.facts.slice(0, crowded ? 4 : 6);
  const badges = card.badges.slice(0, crowded ? 4 : 6);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: INK, color: WARM, padding: "120px 80px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, letterSpacing: 6, color: LIME }}>GOLFER-STECKBRIEF</div>
          {card.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.avatarUrl} width={300} height={300} style={{ borderRadius: 150, border: `6px solid ${LIME}`, objectFit: "cover" }} alt="" />
          ) : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
          {name.lines.map((line, index) => (
            <div key={index} style={{ display: "flex", fontSize: name.size, fontWeight: 900, lineHeight: 1, letterSpacing: -2 }}>{line}</div>
          ))}
        </div>
        {card.motto ? (
          <div style={{ display: "flex", flexDirection: "column", marginTop: 30, color: "#C9CBC6" }}>
            {motto.map((line, index) => (
              <div key={index} style={{ display: "flex", fontSize: mottoSize, lineHeight: 1.25 }}>{line}</div>
            ))}
          </div>
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
          {facts.map(fact => (
            <div key={fact.label} style={{ display: "flex", justifyContent: "space-between", padding: "20px 0", borderBottom: "1px solid #4a4d49", fontSize: 34 }}>
              <div style={{ display: "flex", color: "#9b9d9a", fontSize: 26, letterSpacing: 3, fontWeight: 700 }}>{fact.label.toUpperCase()}</div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", fontWeight: 700, maxWidth: 560 }}>
                {wrapText(fact.value, fact.value.length > 40 ? 38 : 32, 2).map((line, index) => (
                  <div key={index} style={{ display: "flex", fontSize: fact.value.length > 40 ? 28 : 34, lineHeight: 1.2 }}>{line}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {badges.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 44 }}>
            {badges.map(badge => (
              <div key={badge} style={{ display: "flex", background: LIME, color: INK, fontSize: 26, fontWeight: 800, padding: "12px 18px", marginRight: 14, marginBottom: 14 }}>{badge}</div>
            ))}
          </div>
        ) : null}

        <div style={{ display: "flex", flex: 1 }} />
        <svg width="460" height="137" viewBox={LOGO_FULL_VIEWBOX} style={{ marginTop: 36 }}>
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
