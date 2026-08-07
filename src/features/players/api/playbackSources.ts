import type { MediaPlaybackSource } from "@/types/media";

export const createDefaultPlaybackSource = (
  src: string,
): MediaPlaybackSource => {
  return {
    id: "default",
    label: "Default",
    url: src,
    kind: "direct",
  };
};

export const normalizePlaybackSources = (
  src: string,
  playbackSources: MediaPlaybackSource[] | undefined,
) => {
  const defaultSource = createDefaultPlaybackSource(src);
  const sources = playbackSources?.length ? playbackSources : [defaultSource];

  return sources.some((source) => source.url === src) ?
      sources
    : [defaultSource, ...sources];
};

export const isHlsPlaybackSource = (source: MediaPlaybackSource) => {
  const mimeType = source.mimeType?.toLowerCase() ?? "";

  return (
    source.kind === "hls" ||
    mimeType.includes("mpegurl") ||
    mimeType.includes("x-mpegurl") ||
    getUrlPathname(source.url).endsWith(".m3u8")
  );
};

const getUrlPathname = (url: string) => {
  try {
    return new URL(url, window.location.origin).pathname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
};
