import type { PreviewMedia as PreviewMediaType } from "@/lib/preview-content";
import { PreviewMedia } from "./PreviewMedia";
import { PreviewSaveButton } from "./PreviewSaveButton";

type Accent = "lime" | "blue" | "pink";

type Props = {
  stamp: string;
  kicker: string;
  title: string;
  description?: string;
  accent: Accent;
  media?: PreviewMediaType;
  withSave?: boolean;
  className?: string;
};

/**
 * Non-navigating stand-in for components/ContentCard.tsx: same card shell,
 * type stamp, tag pill and save-button visuals so it reads as AROUND, but
 * with no <Link> into unreleased product routes — this page never leads a
 * visitor into the live app.
 */
export function PreviewCard({ stamp, kicker, title, description, accent, media, withSave, className }: Props) {
  const tagClass = accent === "blue" ? "tag blue" : accent === "pink" ? "tag pink" : "tag";

  return (
    <article className={`card card--${accent} pv-card ${className ?? ""}`.trim()}>
      <div className="cardMedia">
        {media ? <PreviewMedia media={media} /> : <div className="cardPlaceholder" aria-hidden="true" />}
        <span className="cardTypeStamp">{stamp}</span>
      </div>
      <div className="cardBody">
        <span className={tagClass}>{kicker}</span>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
        {withSave && (
          <div className="cardMeta">
            <span>{stamp}</span>
            <PreviewSaveButton title={title} />
          </div>
        )}
      </div>
    </article>
  );
}
