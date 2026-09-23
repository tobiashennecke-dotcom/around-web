"use client";

import {useRef, useState, type ChangeEvent, type DragEvent} from "react";
import {
  insert,
  PatchEvent,
  setIfMissing,
  useClient,
  type ArrayOfObjectsInputProps
} from "sanity";

type GalleryImage = {
  _key: string;
  _type: "image";
  asset: {_type: "reference"; _ref: string};
};

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Adds a multi-file upload above Sanity's normal gallery editor.
 * The standard editor remains available for sorting, cropping and metadata.
 */
export function PlaceGalleryBulkInput(props: ArrayOfObjectsInputProps) {
  const client = useClient({apiVersion: "2025-02-19"});
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  async function uploadFiles(files: File[]) {
    if (uploading || files.length === 0 || props.readOnly) return;

    const accepted = files.filter((file) => ACCEPTED_TYPES.has(file.type));
    const rejected = files.length - accepted.length;
    if (!accepted.length) {
      setError("Bitte JPG-, PNG- oder WebP-Bilder auswählen.");
      return;
    }

    setUploading(true);
    setError("");
    setProgress(`0 / ${accepted.length} Bilder hochgeladen`);

    const uploaded: GalleryImage[] = [];
    const failures: string[] = [];
    const existingRefs = new Set(
      (Array.isArray(props.value) ? props.value : [])
        .map((item) => (item as {asset?: {_ref?: string}}).asset?._ref)
        .filter((ref): ref is string => Boolean(ref))
    );

    try {
      for (const [index, file] of accepted.entries()) {
        try {
          const asset = await client.assets.upload("image", file, {
            filename: file.name
          });

          // Sanity can return the same asset for identical image bytes.
          // Do not add that asset to this gallery a second time.
          if (!existingRefs.has(asset._id)) {
            uploaded.push({
              _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
              _type: "image",
              asset: {_type: "reference", _ref: asset._id}
            });
            existingRefs.add(asset._id);
          }
        } catch (cause) {
          failures.push(
            `${file.name}: ${cause instanceof Error ? cause.message : "Upload fehlgeschlagen"}`
          );
        }
        setProgress(`${index + 1} / ${accepted.length} Bilder verarbeitet`);
      }

      if (uploaded.length) {
        // Append only. Existing gallery items, their keys, order and metadata
        // are left untouched. The edit stays a normal Sanity document change.
        props.onChange(
          PatchEvent.from([
            setIfMissing([]),
            insert(uploaded, "after", [-1])
          ])
        );
      }

      const notices = [
        rejected ? `${rejected} nicht unterstützte Datei(en) übersprungen.` : "",
        failures.length ? failures.join("; ") : ""
      ].filter(Boolean);
      setError(notices.join(" "));
      setProgress(
        `${uploaded.length} neue(s) Bild(er) zur Galerie hinzugefügt. ` +
        "Bitte das Dokument anschließend speichern/veröffentlichen."
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleSelection(event: ChangeEvent<HTMLInputElement>) {
    void uploadFiles(Array.from(event.target.files || []));
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    void uploadFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <div>
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        style={{
          border: "1px dashed currentColor",
          borderRadius: 8,
          padding: 16,
          marginBottom: 16
        }}
      >
        <strong>AROUND · Mehrfach-Upload</strong>
        <p>Mehrere Bilder auswählen oder hier hineinziehen (JPG, PNG, WebP).</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={uploading || props.readOnly}
          onChange={handleSelection}
          aria-label="Mehrere Galeriebilder auswählen"
        />
        {uploading && <p role="status">Upload läuft: {progress}</p>}
        {!uploading && progress && <p role="status">{progress}</p>}
        {error && <p role="alert" style={{color: "#c2410c"}}>{error}</p>}
      </div>
      {props.renderDefault(props)}
    </div>
  );
}
