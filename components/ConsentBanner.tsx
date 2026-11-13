"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getConsent, OPEN_CONSENT_EVENT, setConsent, type ConsentLevel } from "@/lib/analytics/consent";

/**
 * Real choice, equal weight: "Einverstanden" stores a browser ID for
 * analytics, "Nur notwendige" keeps counting anonymous. Re-openable from the
 * footer and the profile page via openConsentSettings().
 */
export function ConsentBanner() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ConsentLevel | null>(null);

  useEffect(() => {
    const level = getConsent();
    setCurrent(level);
    if (!level) setOpen(true);
    function onOpen() {
      setCurrent(getConsent());
      setOpen(true);
    }
    window.addEventListener(OPEN_CONSENT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, onOpen);
  }, []);

  if (!open) return null;

  function choose(level: ConsentLevel) {
    setConsent(level);
    setCurrent(level);
    setOpen(false);
  }

  return (
    <div className="consentBanner" role="region" aria-label="Datenschutz-Einstellungen">
      <div className="consentBannerText">
        <strong>Darf AROUND mitzählen?</strong>
        <span>
          Wir möchten verstehen, welche Stories, Plätze und Reisen euch wirklich interessieren, auch über mehrere Besuche hinweg.
          Dafür merkt sich dein Browser eine zufällige ID. Keine Werbe-Cookies, keine Weitergabe an Dritte.{" "}
          <Link href="/datenschutz">Mehr dazu</Link>
        </span>
        {current ? <em>Aktuell: {current === "full" ? "Einverstanden" : "Nur notwendige"}</em> : null}
      </div>
      <div className="consentBannerActions">
        <button type="button" className="consentButton" onClick={() => choose("essential")}>Nur notwendige</button>
        <button type="button" className="consentButton consentButton--accept" onClick={() => choose("full")}>Einverstanden</button>
      </div>
    </div>
  );
}

export function ConsentSettingsLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className || "consentSettingsLink"}
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_CONSENT_EVENT))}
    >
      Cookie-Einstellungen
    </button>
  );
}
