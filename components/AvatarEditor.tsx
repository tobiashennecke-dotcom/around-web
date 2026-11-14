"use client";

import { useEffect, useRef, useState } from "react";
import { AVATAR_CHANGED_EVENT, getAvatarUrl, removeAvatar, uploadAvatar } from "@/lib/profile/avatar";

export function Avatar({ url, name, size = 40 }: { url: string | null; name: string; size?: number }) {
  const initial = (name.trim()[0] || "A").toUpperCase();
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url ? <img src={url} alt="" width={size} height={size} /> : initial}
    </span>
  );
}

export function useAvatarUrl() {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const load = () => getAvatarUrl().then(next => { if (active) setUrl(next); }).catch(() => undefined);
    load();
    window.addEventListener(AVATAR_CHANGED_EVENT, load);
    return () => {
      active = false;
      window.removeEventListener(AVATAR_CHANGED_EVENT, load);
    };
  }, []);
  return url;
}

/** Profile picture block on the profile page. */
export function AvatarEditor({ name }: { name: string }) {
  const url = useAvatarUrl();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      await uploadAvatar(file);
      setMessage("Neues Bild gespeichert.");
    } catch {
      setMessage("Das Bild konnte nicht gespeichert werden. Probier ein anderes.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function onRemove() {
    setBusy(true);
    await removeAvatar().catch(() => undefined);
    setBusy(false);
    setMessage("Bild entfernt.");
  }

  return (
    <div className="avatarEditor">
      <Avatar url={url} name={name} size={112} />
      <div className="avatarEditorActions">
        <input ref={input} type="file" accept="image/*" className="visuallyHidden" id="avatar-file" onChange={e => onFile(e.target.files?.[0])} />
        <label htmlFor="avatar-file" className="primary avatarUploadButton" aria-disabled={busy}>{busy ? "Lädt …" : url ? "Bild ändern" : "Bild hochladen"}</label>
        {url ? <button type="button" className="accountTextButton profileDarkLink" disabled={busy} onClick={onRemove}>Entfernen</button> : null}
        <p className="profileHint">{message || "Wird quadratisch zugeschnitten. Sieht nur du, und wer deinen Steckbrief bekommt."}</p>
      </div>
    </div>
  );
}
