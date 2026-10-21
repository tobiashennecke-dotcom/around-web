"use client";

import { useState } from "react";

type Props = {
  src: string;
  provider: string;
  title: string;
  variant: "video" | "audio";
  posterUrl?: string;
  posterAlt?: string;
  height?: number;
  subtitle?: string;
};

/**
 * Two-click embed (Story 2.0). Nothing is requested from YouTube, Vimeo,
 * Spotify or Apple until the reader clicks - the poster is our own image.
 */
export function ExternalEmbed({ src, provider, title, variant, posterUrl, posterAlt, height, subtitle }: Props) {
  const [loaded, setLoaded] = useState(false);
  const notice = `Beim Abspielen werden Daten an ${provider} übertragen.`;

  if (variant === "video") {
    return (
      <div className="storyEmbed storyEmbed--video">
        {loaded ? (
          <iframe
            src={src}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button type="button" className="storyEmbedConsent" onClick={() => setLoaded(true)}>
            {posterUrl ? <img src={posterUrl} alt={posterAlt || ""} loading="lazy" /> : null}
            <span className="storyEmbedPlay" aria-hidden="true">▶</span>
            <span className="storyEmbedNotice">
              <strong>Video abspielen</strong>
              <small>{notice}</small>
            </span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="storyEmbed storyEmbed--audio">
      {loaded ? (
        <iframe
          src={src}
          title={title}
          height={height || 152}
          allow="autoplay; encrypted-media; clipboard-write; fullscreen; picture-in-picture"
          loading="lazy"
          style={{ height: height || 152 }}
        />
      ) : (
        <div className="storyEmbedAudioConsent">
          <button type="button" className="storyEmbedAudioPlay" onClick={() => setLoaded(true)} aria-label={`${title} bei ${provider} laden und anhören`}>▶</button>
          <div>
            <div className="storyEmbedEyebrow">Zum Hören · {provider}</div>
            <strong>{title}</strong>
            {subtitle ? <span>{subtitle}</span> : null}
            <small>{notice}</small>
          </div>
        </div>
      )}
    </div>
  );
}
