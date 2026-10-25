import { ImageResponse } from "next/og";
import { LOGO_FULL_VIEWBOX, LOGO_LIME, RING_PATH, TAGLINE_PATH, WORDMARK_PATH } from "@/lib/brand-logo";

export const alt = "AROUND. Golf. Weiter gedacht.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default social image for every page without its own Sanity socialImage/
 * hero image. Pages that set openGraph.images in generateMetadata win.
 * Uses the October 2026 logo (wordmark with claim).
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#212322"
        }}
      >
        <svg width="900" height="268" viewBox={LOGO_FULL_VIEWBOX}>
          <path d={WORDMARK_PATH} fill="#F5F3EE" fillRule="evenodd" />
          <path d={TAGLINE_PATH} fill="#F5F3EE" fillRule="evenodd" />
          <path d={RING_PATH} fill={LOGO_LIME} fillRule="evenodd" />
        </svg>
      </div>
    ),
    size
  );
}
