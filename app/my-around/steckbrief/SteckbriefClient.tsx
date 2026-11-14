"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics/track";

export function SteckbriefClient() {
  const [state, setState] = useState<"loading" | "guest" | "ready">("loading");
  const [version, setVersion] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    createClient()?.auth.getUser().then(({ data }) => setState(data.user ? "ready" : "guest"));
  }, []);

  const src = `/api/steckbrief?v=${version}`;

  async function share() {
    setBusy(true);
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const file = new File([blob], "around-steckbrief.png", { type: "image/png" });
      track("steckbrief_shared");
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Mein AROUND-Steckbrief" });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "around-steckbrief.png";
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Share sheet closed or not available: nothing to do.
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") return <div className="savedLoading">Steckbrief wird geladen …</div>;
  if (state === "guest") {
    return (
      <div className="myAroundHomeEmpty">
        <div className="eyebrow lime">NUR MIT KONTO</div>
        <h2>ERST ANMELDEN.</h2>
        <div className="myAroundHomeEmptyActions">
          <Link className="primary" href="/account?next=/my-around/steckbrief">ANMELDEN →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="steckbriefLayout">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="steckbriefPreview" src={src} alt="Dein AROUND Golfer-Steckbrief" width={1080} height={1920} />
      <div className="steckbriefActions">
        <p className="profileHint">Die Karte zeigt nur, was du selbst im Profil angegeben hast. Mehr ausfüllen, mehr Karte.</p>
        <button type="button" className="primary" disabled={busy} onClick={share}>{busy ? "Moment …" : "Teilen oder speichern"}</button>
        <button type="button" className="accountTextButton profileDarkLink" onClick={() => setVersion(Date.now())}>Neu laden</button>
        <Link className="accountTextButton profileDarkLink" href="/my-around/profil">Profil bearbeiten →</Link>
        <Link className="accountTextButton profileDarkLink" href="/my-around/pass">Zum AROUND Pass →</Link>
      </div>
    </div>
  );
}
