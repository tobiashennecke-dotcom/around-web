import { ImageResponse } from "next/og";

export const alt = "THIS IS AROUND. Golf. Weiter gedacht.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default social image for every page without its own Sanity socialImage/
 * hero image. Pages that set openGraph.images in generateMetadata win.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#212322",
          color: "#F5F3EE",
          fontFamily: "sans-serif"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#D6EA2A" }} />
          <div style={{ fontSize: "24px", letterSpacing: "0.14em", fontWeight: 800, color: "#D6EA2A" }}>THIS IS AROUND</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "128px", fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.04em" }}>AROUND.</div>
          <div style={{ fontSize: "44px", marginTop: "28px" }}>Golf. Weiter gedacht.</div>
        </div>
      </div>
    ),
    size
  );
}
