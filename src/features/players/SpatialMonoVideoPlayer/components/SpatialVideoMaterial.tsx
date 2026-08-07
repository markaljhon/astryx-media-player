import { useVideoTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useMediaAttach } from "@videojs/react";
import { Events } from "hls.js";
import Hls from "hls.js";
import { Suspense, useEffect, useState } from "react";
import {
  BackSide,
  ClampToEdgeWrapping,
  VideoTexture,
  type VideoTexture as ThreeVideoTexture,
} from "three";
import type { MediaPlaybackSource } from "@/types/media";

type SpatialVideoMaterialProps = {
  source: MediaPlaybackSource;
  onSourceReady?: () => void;
};

export const SpatialVideoMaterial = (props: SpatialVideoMaterialProps) => {
  if (isHlsSource(props.source)) {
    return (
      <Suspense fallback={<meshBasicMaterial color="black" wireframe />}>
        <HlsSpatialVideoMaterial
          source={props.source}
          onSourceReady={props.onSourceReady}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<meshBasicMaterial color="black" wireframe />}>
      <DirectSpatialVideoMaterial
        source={props.source}
        onSourceReady={props.onSourceReady}
      />
    </Suspense>
  );
};

const DirectSpatialVideoMaterial = ({
  onSourceReady,
  source,
}: SpatialVideoMaterialProps) => {
  const texture = useVideoTexture(source.url, {
    crossOrigin: "anonymous",
    loop: false,
    muted: false,
    playsInline: true,
  });
  const setMedia = useMediaAttach();

  useEffect(() => {
    const video = texture.image;
    const cleanupReadyListeners = onMediaReady(video, onSourceReady);

    setMedia?.(video);

    return () => {
      cleanupReadyListeners();
      setMedia?.((currentMedia) =>
        currentMedia === video ? null : currentMedia,
      );
      video.pause();
    };
  }, [onSourceReady, setMedia, texture.image]);

  return <SpatialTextureMaterial texture={texture} />;
};

const HlsSpatialVideoMaterial = ({
  onSourceReady,
  source,
}: SpatialVideoMaterialProps) => {
  const texture = useSpatialHlsVideoTexture(source, onSourceReady);

  if (!texture) {
    return <meshBasicMaterial color="black" wireframe />;
  }

  return <SpatialTextureMaterial texture={texture} />;
};

const SpatialTextureMaterial = ({
  texture,
}: {
  texture: ThreeVideoTexture;
}) => {
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.repeat.set(-0.5, 1);
  texture.offset.set(0.5, 0);

  return <meshBasicMaterial map={texture} side={BackSide} toneMapped={false} />;
};

const useSpatialHlsVideoTexture = (
  source: MediaPlaybackSource,
  onSourceReady: (() => void) | undefined,
) => {
  const outputColorSpace = useThree((state) => state.gl.outputColorSpace);
  const setMedia = useMediaAttach();
  const [texture, setTexture] = useState<ThreeVideoTexture | null>(null);
  const { url } = source;

  useEffect(() => {
    let hls: Hls | null = null;
    let isDisposed = false;
    const video = document.createElement("video");
    const nextTexture = new VideoTexture(video);

    nextTexture.colorSpace = outputColorSpace;
    video.autoplay = true;
    video.crossOrigin = "anonymous";
    video.loop = false;
    video.muted = false;
    video.playsInline = true;
    video.preload = "auto";

    const handleLoadedData = () => {
      if (isDisposed) {
        return;
      }

      setTexture(nextTexture);
      setMedia?.(video);
      void video.play().catch(() => undefined);
    };
    const cleanupReadyListeners = onMediaReady(video, onSourceReady);

    video.addEventListener("loadeddata", handleLoadedData);

    if (!canPlayNativeHls(video) && Hls.isSupported()) {
      hls = new Hls();
      hls.on(Events.MEDIA_ATTACHED, () => {
        hls?.loadSource(url);
      });
      hls.attachMedia(video);
    } else {
      video.src = url;
    }

    video.load();

    return () => {
      isDisposed = true;
      video.removeEventListener("loadeddata", handleLoadedData);
      cleanupReadyListeners();
      setTexture((currentTexture) =>
        currentTexture === nextTexture ? null : currentTexture,
      );
      setMedia?.((currentMedia) =>
        currentMedia === video ? null : currentMedia,
      );
      video.pause();
      hls?.destroy();
      nextTexture.dispose();
      video.removeAttribute("src");
      video.load();
    };
  }, [onSourceReady, outputColorSpace, setMedia, url]);

  return texture;
};

const onMediaReady = (
  video: HTMLVideoElement,
  onSourceReady: (() => void) | undefined,
) => {
  let isReady = false;
  let videoFrameHandle: number | null = null;

  const markReady = () => {
    if (isReady) {
      return;
    }

    isReady = true;
    onSourceReady?.();
  };

  const handleCanRender = () => {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      markReady();
    }
  };

  video.addEventListener("loadeddata", handleCanRender);
  video.addEventListener("canplay", handleCanRender);
  video.addEventListener("playing", handleCanRender);

  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    markReady();
  } else if (video.requestVideoFrameCallback) {
    videoFrameHandle = video.requestVideoFrameCallback(() => {
      markReady();
    });
  }

  return () => {
    video.removeEventListener("loadeddata", handleCanRender);
    video.removeEventListener("canplay", handleCanRender);
    video.removeEventListener("playing", handleCanRender);

    if (videoFrameHandle !== null && video.cancelVideoFrameCallback) {
      video.cancelVideoFrameCallback(videoFrameHandle);
    }
  };
};

const isHlsSource = (source: MediaPlaybackSource) => {
  const mimeType = source.mimeType?.toLowerCase() ?? "";

  return (
    source.kind === "hls" ||
    mimeType.includes("mpegurl") ||
    mimeType.includes("x-mpegurl") ||
    getUrlPathname(source.url).endsWith(".m3u8")
  );
};

const canPlayNativeHls = (video: HTMLVideoElement) => {
  return Boolean(
    video.canPlayType("application/vnd.apple.mpegurl") ||
      video.canPlayType("application/x-mpegurl"),
  );
};

const getUrlPathname = (url: string) => {
  try {
    return new URL(url, window.location.origin).pathname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
};
