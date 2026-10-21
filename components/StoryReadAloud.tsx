"use client";

import { useState } from "react";

type Props = {
  src: string;
  provider: string;
  title: string;
  speaker?: string;
  duration?: string;
  height?: number;
};

/**
 * "Anhören" in the Story meta line. The first click opens a dock at the
 * bottom with the privacy notice; only the second click loads the external
 * player. The dock stays while the reader scrolls, so audio keeps playing.
 */
export function StoryReadAloud({ src, provider, title, speaker, duration, height }: Props) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const label = duration ? `Anhören · ${duration}` : "Anhören";

  return (
    <>
      <button type="button" className="storyListen" onClick={() => setOpen(true)} aria-expanded={open}>
        <span aria-hidden="true">▶</span>{label}
      </button>
      {open ? (
        <div className="storyListenDock" role="region" aria-label="Vorlesefassung">
          <div className="storyListenDockInner">
            {loaded ? (
              <iframe
                src={src}
                title={title}
                allow="autoplay; encrypted-media; clipboard-write"
                style={{ height: Math.min(height || 152, 152) }}
              />
            ) : (
              <div className="storyListenDockConsent">
                <div>
                  <strong>{title}{speaker ? ` · ${speaker}` : ""}</strong>
                  <small>Beim Abspielen werden Daten an {provider} übertragen.</small>
                </div>
                <button type="button" className="storyListenLoad" onClick={() => setLoaded(true)}>Bei {provider} abspielen</button>
              </div>
            )}
            <button type="button" className="storyListenClose" onClick={() => { setOpen(false); setLoaded(false); }} aria-label="Player schließen">×</button>
          </div>
        </div>
      ) : null}
    </>
  );
}
