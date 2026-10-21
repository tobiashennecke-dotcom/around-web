/**
 * Story 2.0: external players only (no uploads, no hosting costs).
 *
 * Editors paste a normal share link. These helpers recognise the platform,
 * pull out the ID and build the privacy-friendly embed URL. The same code
 * runs in the Studio (validation) and on the site (rendering), so a link that
 * passes the Studio check is guaranteed to render.
 */

export type VideoPlatform = "youtube" | "vimeo";
export type AudioPlatform = "spotify" | "apple";

export type ParsedEmbed = {
  platform: VideoPlatform | AudioPlatform;
  /** Display name used in the consent notice. */
  provider: string;
  /** The iframe src. Only ever loaded after the reader clicks. */
  src: string;
  /** Suggested iframe height in px for audio players (video uses 16:9). */
  height?: number;
};

function toUrl(value: unknown): URL | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed);
  } catch {
    return null;
  }
}

function hostOf(url: URL) {
  return url.hostname.toLowerCase().replace(/^www\.|^m\./, "");
}

/** Parses "90", "1m30s", "1h2m3s" into seconds. */
function parseStart(value: string | null): number | undefined {
  if (!value) return undefined;
  if (/^\d+$/.test(value)) return Number(value) || undefined;
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match) return undefined;
  const seconds = Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
  return seconds || undefined;
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

export function parseYouTube(value: unknown): { id: string; start?: number } | null {
  const url = toUrl(value);
  if (!url) return null;
  const host = hostOf(url);
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.split("/")[1] || null;
  } else if (host === "youtube.com" || host === "music.youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const [, first, second] = url.pathname.split("/");
      if (first === "embed" || first === "shorts" || first === "live" || first === "v") id = second || null;
    }
  }
  if (!id || !YOUTUBE_ID.test(id)) return null;
  return { id, start: parseStart(url.searchParams.get("t") || url.searchParams.get("start")) };
}

export function parseVimeo(value: unknown): { id: string; hash?: string } | null {
  const url = toUrl(value);
  if (!url) return null;
  const host = hostOf(url);
  const parts = url.pathname.split("/").filter(Boolean);
  if (host === "player.vimeo.com") {
    if (parts[0] !== "video" || !/^\d+$/.test(parts[1] || "")) return null;
    return { id: parts[1], hash: url.searchParams.get("h") || undefined };
  }
  if (host !== "vimeo.com") return null;
  // vimeo.com/123456789, vimeo.com/123456789/abcdef12 (unlisted), vimeo.com/channels/x/123456789
  const index = parts.findIndex(part => /^\d+$/.test(part));
  if (index === -1) return null;
  const hash = parts[index + 1] && /^[a-f0-9]+$/i.test(parts[index + 1]) ? parts[index + 1] : undefined;
  return { id: parts[index], hash: hash || url.searchParams.get("h") || undefined };
}

const SPOTIFY_KINDS = ["episode", "show", "track", "album", "playlist"] as const;
export type SpotifyKind = (typeof SPOTIFY_KINDS)[number];

export function parseSpotify(value: unknown): { kind: SpotifyKind; id: string } | null {
  const url = toUrl(value);
  if (!url || hostOf(url) !== "open.spotify.com") return null;
  // Optional locale segment: /intl-de/episode/<id>; also accepts /embed/episode/<id>
  const parts = url.pathname.split("/").filter(Boolean).filter(part => !/^intl-[a-z-]+$/i.test(part) && part !== "embed");
  const kind = parts[0] as SpotifyKind;
  const id = parts[1];
  if (!SPOTIFY_KINDS.includes(kind) || !id || !/^[A-Za-z0-9]{22}$/.test(id)) return null;
  return { kind, id };
}

export function parseApple(value: unknown): { service: "podcasts" | "music"; path: string; single: boolean } | null {
  const url = toUrl(value);
  if (!url) return null;
  const host = hostOf(url).replace(/^embed\./, "");
  const service = host === "podcasts.apple.com" ? "podcasts" : host === "music.apple.com" ? "music" : null;
  if (!service) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  // /<country>/<podcast|album|song|playlist>/<slug>/<id>
  const allowed = service === "podcasts" ? ["podcast"] : ["album", "song", "playlist"];
  if (parts.length < 3 || !/^[a-z]{2}$/i.test(parts[0]) || !allowed.includes(parts[1])) return null;
  if (!/^(id|pl\.)?[A-Za-z0-9.-]+$/.test(parts[parts.length - 1])) return null;
  const episodeOrTrack = url.searchParams.get("i");
  const query = episodeOrTrack && /^\d+$/.test(episodeOrTrack) ? `?i=${episodeOrTrack}` : "";
  return { service, path: `/${parts.join("/")}${query}`, single: Boolean(query) || parts[1] === "song" };
}

export function videoEmbed(platform: unknown, value: unknown): ParsedEmbed | null {
  if (platform === "youtube") {
    const parsed = parseYouTube(value);
    if (!parsed) return null;
    const params = new URLSearchParams({ autoplay: "1", rel: "0", modestbranding: "1", playsinline: "1" });
    if (parsed.start) params.set("start", String(parsed.start));
    return { platform, provider: "YouTube", src: `https://www.youtube-nocookie.com/embed/${parsed.id}?${params}` };
  }
  if (platform === "vimeo") {
    const parsed = parseVimeo(value);
    if (!parsed) return null;
    const params = new URLSearchParams({ autoplay: "1", dnt: "1", title: "0", byline: "0", portrait: "0" });
    if (parsed.hash) params.set("h", parsed.hash);
    return { platform, provider: "Vimeo", src: `https://player.vimeo.com/video/${parsed.id}?${params}` };
  }
  return null;
}

export function audioEmbed(platform: unknown, value: unknown): ParsedEmbed | null {
  if (platform === "spotify") {
    const parsed = parseSpotify(value);
    if (!parsed) return null;
    const single = parsed.kind === "episode" || parsed.kind === "track";
    return { platform, provider: "Spotify", src: `https://open.spotify.com/embed/${parsed.kind}/${parsed.id}`, height: single ? 152 : 352 };
  }
  if (platform === "apple") {
    const parsed = parseApple(value);
    if (!parsed) return null;
    return {
      platform,
      provider: parsed.service === "podcasts" ? "Apple Podcasts" : "Apple Music",
      src: `https://embed.${parsed.service}.apple.com${parsed.path}`,
      height: parsed.single ? 175 : 450
    };
  }
  return null;
}

/** Recognises any supported audio link, regardless of the chosen platform. */
export function anyAudioEmbed(value: unknown): ParsedEmbed | null {
  return audioEmbed("spotify", value) || audioEmbed("apple", value);
}
