import type { MediaItem, MediaPlaybackSource } from "@/types/media";

type NativeFullscreenVideoElement = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitEnterFullScreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
  webkitSupportsFullscreen?: boolean;
};

type NativeFullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
};

export const getNativeVideoPlaybackUrl = (item: MediaItem) => {
  if (item.kind !== "video") {
    return undefined;
  }

  const playbackSources = item.playbackSources ?? [];
  const nativeSource = playbackSources.find(isPreferredNativePlaybackSource);

  return nativeSource?.url ?? item.sourceUrl ?? playbackSources[0]?.url;
};

export const launchNativeVideoFullscreen = async (
  url: string,
  doc: Document = document,
) => {
  const video = doc.createElement("video") as NativeFullscreenVideoElement;
  const nativeDocument = doc as NativeFullscreenDocument;

  video.src = url;
  video.controls = true;
  video.playsInline = false;
  video.preload = "auto";
  video.style.backgroundColor = "var(--color-on-light)";
  video.style.height = "100dvh";
  video.style.inset = "0";
  video.style.position = "fixed";
  video.style.width = "100dvw";
  video.style.zIndex = "2147483647";

  let isRemoved = false;

  const removeVideo = () => {
    if (isRemoved) {
      return;
    }

    isRemoved = true;
    video.pause();
    video.remove();
    video.removeEventListener("ended", removeVideo);
    video.removeEventListener("webkitendfullscreen", removeVideo);
    doc.removeEventListener("fullscreenchange", handleFullscreenChange);
    doc.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
  };

  const handleFullscreenChange = () => {
    const fullscreenElement =
      doc.fullscreenElement ?? nativeDocument.webkitFullscreenElement ?? null;

    if (!fullscreenElement) {
      removeVideo();
    }
  };

  video.addEventListener("ended", removeVideo, { once: true });
  video.addEventListener("webkitendfullscreen", removeVideo, { once: true });
  doc.addEventListener("fullscreenchange", handleFullscreenChange);
  doc.addEventListener("webkitfullscreenchange", handleFullscreenChange);
  doc.body.appendChild(video);

  try {
    if (video.requestFullscreen) {
      await video.requestFullscreen();
      await video.play();
    } else if (hasWebKitVideoFullscreen(video)) {
      await video.play();
      enterWebKitVideoFullscreen(video);
    } else {
      await video.play();
    }
  } catch (error) {
    removeVideo();
    throw error;
  }
};

const hasWebKitVideoFullscreen = (video: NativeFullscreenVideoElement) => {
  return Boolean(video.webkitEnterFullscreen ?? video.webkitEnterFullScreen);
};

const enterWebKitVideoFullscreen = (video: NativeFullscreenVideoElement) => {
  if (
    video.webkitSupportsFullscreen === false
    || video.webkitDisplayingFullscreen
  ) {
    return;
  }

  try {
    (video.webkitEnterFullscreen ?? video.webkitEnterFullScreen)?.call(video);
  } catch {
    // iPhone enters native fullscreen automatically when non-inline playback starts.
  }
};

const isPreferredNativePlaybackSource = (source: MediaPlaybackSource) => {
  if (isHlsSource(source)) {
    return false;
  }

  return (
    source.kind === "direct" || source.kind === "mp4" || source.kind === "webm"
  );
};

const isHlsSource = (source: MediaPlaybackSource) => {
  const mimeType = source.mimeType?.toLowerCase() ?? "";

  return (
    source.kind === "hls"
    || mimeType.includes("mpegurl")
    || mimeType.includes("x-mpegurl")
    || getUrlPathname(source.url).endsWith(".m3u8")
  );
};

const getUrlPathname = (url: string) => {
  try {
    return new URL(url, "https://astryx.local").pathname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
};
