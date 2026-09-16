import { PortableText } from "@portabletext/react";
import { MediaGallery } from "@/components/MediaGallery";
import { StoryInlinePlaceModule } from "@/components/StoryInlinePlaceModule";
import type { MediaItem } from "@/lib/types";

function toMediaItem(raw: any): MediaItem | null {
  if (!raw?.url) return null;
  return {
    url: raw.url,
    alt: raw.alt || undefined,
    caption: raw.caption || undefined,
    credit: raw.credit || undefined,
    width: typeof raw.width === "number" ? raw.width : undefined,
    height: typeof raw.height === "number" ? raw.height : undefined,
    aspectRatio: typeof raw.aspectRatio === "number" ? raw.aspectRatio : undefined,
    hotspot: raw.hotspot && typeof raw.hotspot.x === "number" && typeof raw.hotspot.y === "number"
      ? { x: raw.hotspot.x, y: raw.hotspot.y }
      : undefined
  };
}

const components: any = {
  types: {
    mediaGallery: ({value}: any) => {
      const items = Array.isArray(value?.images)
        ? value.images.map(toMediaItem).filter((item: MediaItem | null): item is MediaItem => Boolean(item))
        : [];
      if (!items.length) return null;
      return (
        <div className="storyMediaGallery">
          <MediaGallery items={items} title="Galerie" />
        </div>
      );
    },
    image: ({value}: any) => {
      if (!value?.url) return null;
      const layout = value.layout || "wide";
      const width = Number(value?.dimensions?.width || 0);
      const height = Number(value?.dimensions?.height || 0);
      const ratio = width > 0 && height > 0 ? width / height : 1.5;
      return (
        <figure className={`storyImage storyImage--${layout}`}>
          <div className="storyImageFrame" style={{ "--around-story-image-ratio": ratio } as any}>
            <img src={value.url} alt={value.alt || ""} loading="lazy" />
            {(value.caption || value.credit) && (
              <figcaption>
                {value.caption && <span>{value.caption}</span>}
                {value.credit && <small>{value.credit}</small>}
              </figcaption>
            )}
          </div>
        </figure>
      );
    },
    placeModule: ({value}: any) => (
      <StoryInlinePlaceModule place={value?.place} layout={value?.layout} editorialLine={value?.editorialLine} />
    ),
    // The gate marker itself never has visible content - the actual
    // locking (v1.26f) happens one level up, in app/stories/[slug]/page.tsx,
    // which splits the body at this block server-side and never passes
    // locked content into StoryBody at all. This case only fires for a
    // Free Story that still carries a gate from editorial preparation - it
    // must remain invisible there too.
    premiumGate: () => null
  },
  block: {
    h2: ({children}: any) => <h2>{children}</h2>,
    h3: ({children}: any) => <h3>{children}</h3>,
    pullQuote: ({children}: any) => <div className="pull">{children}</div>,
    blockquote: ({children}: any) => <blockquote className="storyQuote">{children}</blockquote>
  },
  marks: {
    link: ({children,value}: any) => (
      <a href={value?.href || "#"} target={value?.blank ? "_blank" : undefined} rel={value?.blank ? "noreferrer" : undefined}>
        {children}
      </a>
    )
  }
};

export function StoryBody({value}:{value:unknown[]}) {
  if (!Array.isArray(value) || value.length === 0) return null;
  if (value.every(item => typeof item === "string")) {
    return <>{(value as string[]).map((text,index)=><p key={index}>{text}</p>)}</>;
  }
  return <PortableText value={value as any} components={components} />;
}
