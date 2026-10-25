import {
  DOT_PATH, LOGO_FULL_VIEWBOX, LOGO_LIME, MARK_VIEWBOX, RING_PATH, TAGLINE_PATH, WORDMARK_PATH, WORDMARK_VIEWBOX
} from "@/lib/brand-logo";

type Props = { className?: string; title?: string };

/** "around" wordmark. Letters take the text colour, the ring stays lime. */
export function AroundWordmark({ className, title, tagline = false }: Props & { tagline?: boolean }) {
  return (
    <svg
      className={className}
      viewBox={tagline ? LOGO_FULL_VIEWBOX : WORDMARK_VIEWBOX}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      <path d={WORDMARK_PATH} fill="currentColor" fillRule="evenodd" />
      {tagline ? <path d={TAGLINE_PATH} fill="currentColor" fillRule="evenodd" /> : null}
      <path d={RING_PATH} fill={LOGO_LIME} fillRule="evenodd" />
    </svg>
  );
}

/** Bildmarke: the lime "o" with its dot. The dot takes the text colour. */
export function AroundMark({ className, title }: Props) {
  return (
    <svg
      className={className}
      viewBox={MARK_VIEWBOX}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      <path d={RING_PATH} fill={LOGO_LIME} fillRule="evenodd" />
      <path d={DOT_PATH} fill="currentColor" />
    </svg>
  );
}
