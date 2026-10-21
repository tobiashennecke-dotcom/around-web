import { PortableText } from "@portabletext/react";
import { MediaGallery } from "@/components/MediaGallery";
import { StoryInlinePlaceModule } from "@/components/StoryInlinePlaceModule";
import { ExternalEmbed } from "@/components/ExternalEmbed";
import { StoryHoleLine } from "@/components/StoryHoleLine";
import { contentHref } from "@/components/ContentCard";
import { audioEmbed, videoEmbed } from "@/lib/embeds";
import { chapterId, holeProfile, normalizeHoleStations } from "@/lib/story-modules";
import type { MediaItem } from "@/lib/types";

function formatAsOf(value?: string) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(date);
}

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
    storyVideo: ({value}: any) => {
      const embed = videoEmbed(value?.platform, value?.url);
      if (!embed) return null;
      const layout = value.layout || "wide";
      return (
        <figure className={`storyImage storyImage--${layout} storyVideo`}>
          <ExternalEmbed variant="video" src={embed.src} provider={embed.provider} title={value.title || "Video"} posterUrl={value.posterUrl} posterAlt={value.posterAlt} />
          <figcaption>
            <span><strong>{value.title}</strong>{value.duration ? ` · ${value.duration}` : ""}{value.caption ? ` – ${value.caption}` : ""}</span>
            {value.credit && <small>{value.credit}</small>}
          </figcaption>
        </figure>
      );
    },
    storyAudio: ({value}: any) => {
      // The read-aloud version lives in the meta line + dock, not in the body.
      if (value?.kind === "readAloud") return null;
      const embed = audioEmbed(value?.platform, value?.url);
      if (!embed) return null;
      const also = value.alsoUrl ? audioEmbed("spotify", value.alsoUrl) || audioEmbed("apple", value.alsoUrl) : null;
      const subtitle = [value.speaker, value.duration].filter(Boolean).join(" · ");
      return (
        <figure className="storyAudio">
          <ExternalEmbed variant="audio" src={embed.src} provider={embed.provider} title={value.title || "Zum Hören"} subtitle={subtitle || undefined} height={embed.height} />
          {(also || value.transcript) && (
            <figcaption>
              {also && <a href={value.alsoUrl} target="_blank" rel="noreferrer">Auch auf {also.provider} →</a>}
              {value.transcript && (
                <details>
                  <summary>Transkript</summary>
                  <p>{value.transcript}</p>
                </details>
              )}
            </figcaption>
          )}
        </figure>
      );
    },
    storyOTon: ({value}: any) => {
      if (!value?.quote) return null;
      const name = value.person?.title || value.name;
      const role = value.role || value.person?.role;
      return (
        <figure className="storyOTon">
          <blockquote>„{value.quote}“</blockquote>
          {name && <figcaption><strong>{name}</strong>{role ? `, ${role}` : ""}</figcaption>}
        </figure>
      );
    },
    storyFacts: ({value}: any) => {
      const rows = Array.isArray(value?.rows) ? value.rows.filter((row: any) => row?.label && row?.value) : [];
      if (!rows.length) return null;
      const asOf = formatAsOf(value.asOf);
      return (
        <details className="storyFacts" open>
          <summary>{value.title || "Auf einen Blick"}</summary>
          <dl>
            {rows.map((row: any, index: number) => (
              <div key={row._key || index}><dt>{row.label}</dt><dd>{row.value}</dd></div>
            ))}
          </dl>
          {asOf && <p className="storyFactsAsOf">Stand: {asOf}</p>}
        </details>
      );
    },
    storyHoleLine: ({value}: any) => {
      const place = value?.place;
      const length = Number(value?.length);
      if (!place || !(length > 0)) return null;
      const stations = normalizeHoleStations(value.stations, length);
      if (stations.length < 2) return null;
      return (
        <StoryHoleLine
          holeNumber={Number(value.holeNumber) || 0}
          par={Number(value.par) || 0}
          length={length}
          teeLabel={value.teeLabel || undefined}
          placeTitle={place.title}
          placeHref={contentHref(place)}
          stations={stations}
          profile={holeProfile(stations)}
        />
      );
    },
    // The gate marker itself never has visible content - the actual
    // locking (v1.26f) happens one level up, in app/stories/[slug]/page.tsx,
    // which splits the body at this block server-side and never passes
    // locked content into StoryBody at all. This case only fires for a
    // Free Story that still carries a gate from editorial preparation - it
    // must remain invisible there too.
    premiumGate: () => null
  },
  block: {
    h2: ({children, value}: any) => <h2 id={value?._key ? chapterId(value._key) : undefined}>{children}</h2>,
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
