import type { PreviewMedia as PreviewMediaType } from "@/lib/preview-content";
import { isPlaceholderMedia } from "@/lib/preview-content";

type Props = {
  media: PreviewMediaType;
  className?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
};

/**
 * Renders a real repo asset, or — when none exists — a tasteful local
 * placeholder tagged with data-asset-needed instead of a stock substitute.
 * See lib/preview-content.ts for which entries currently use a placeholder.
 */
export function PreviewMedia({ media, className, loading = "lazy", fetchPriority }: Props) {
  if (isPlaceholderMedia(media)) {
    return (
      <div
        className={`pv-placeholder ${className ?? ""}`.trim()}
        data-asset-needed={media.assetNeeded}
        aria-hidden="true"
      >
        <span>{media.label}</span>
      </div>
    );
  }

  return (
    <img
      src={media.src}
      alt={media.alt}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      className={className}
    />
  );
}
