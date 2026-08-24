import { useVideoTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { HlsJsMedia } from "@videojs/core/dom/media/hls-js";
import { useMediaAttach } from "@videojs/react";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  BackSide,
  type Camera,
  ClampToEdgeWrapping,
  PerspectiveCamera,
  VideoTexture,
  type VideoTexture as ThreeVideoTexture,
} from "three";
import type { MediaPlaybackSource, StereoVideoLayout } from "@/types/media";
import { createHlsPlaybackConfig } from "../../api/hlsPlaybackConfig";
import {
  createSpatialTextureViews,
  type SpatialTextureView,
} from "./spatialTextureViews";

type SpatialVideoMaterialProps = {
  source: MediaPlaybackSource;
  stereoLayout?: StereoVideoLayout;
  initialMuted: boolean;
  initialPlaybackRate: number;
  onSourceReady?: () => void;
  onSourceError?: () => void;
};

export const SpatialVideoMaterial = (props: SpatialVideoMaterialProps) => {
  if (isHlsSource(props.source)) {
    return (
      <Suspense fallback={<meshBasicMaterial color="black" wireframe />}>
        <HlsSpatialVideoMaterial
          initialMuted={props.initialMuted}
          initialPlaybackRate={props.initialPlaybackRate}
          source={props.source}
          stereoLayout={props.stereoLayout}
          onSourceReady={props.onSourceReady}
          onSourceError={props.onSourceError}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<meshBasicMaterial color="black" wireframe />}>
      <DirectSpatialVideoMaterial
        initialMuted={props.initialMuted}
        initialPlaybackRate={props.initialPlaybackRate}
        source={props.source}
        stereoLayout={props.stereoLayout}
        onSourceReady={props.onSourceReady}
        onSourceError={props.onSourceError}
      />
    </Suspense>
  );
};

const DirectSpatialVideoMaterial = ({
  initialMuted,
  initialPlaybackRate,
  onSourceError,
  onSourceReady,
  source,
  stereoLayout,
}: SpatialVideoMaterialProps) => {
  const texture = useVideoTexture(source.url, {
    crossOrigin: "anonymous",
    loop: false,
    muted: initialMuted,
    playsInline: true,
  });
  const setMedia = useMediaAttach();

  useEffect(() => {
    const video = texture.image;
    const cleanupReadyListeners = onMediaReady(video, onSourceReady);
    const handleError = () => {
      onSourceError?.();
    };

    video.addEventListener("error", handleError);
    video.muted = initialMuted;
    video.playbackRate = initialPlaybackRate;
    setMedia?.(video);

    return () => {
      video.removeEventListener("error", handleError);
      cleanupReadyListeners();
      setMedia?.((currentMedia) =>
        currentMedia === video ? null : currentMedia,
      );
      video.pause();
    };
  }, [
    initialMuted,
    initialPlaybackRate,
    onSourceError,
    onSourceReady,
    setMedia,
    texture.image,
  ]);

  return (
    <SpatialTextureMaterial texture={texture} stereoLayout={stereoLayout} />
  );
};

const HlsSpatialVideoMaterial = ({
  initialMuted,
  initialPlaybackRate,
  onSourceError,
  onSourceReady,
  source,
  stereoLayout,
}: SpatialVideoMaterialProps) => {
  const texture = useSpatialHlsVideoTexture(
    source,
    initialMuted,
    initialPlaybackRate,
    onSourceReady,
    onSourceError,
  );

  if (!texture) {
    return <meshBasicMaterial color="black" wireframe />;
  }

  return (
    <SpatialTextureMaterial texture={texture} stereoLayout={stereoLayout} />
  );
};

const SpatialTextureMaterial = ({
  stereoLayout,
  texture,
}: {
  stereoLayout?: StereoVideoLayout;
  texture: ThreeVideoTexture;
}) => {
  const textureViews = useMemo(
    () => createSpatialTextureViews(stereoLayout),
    [stereoLayout],
  );
  const defaultTextureView = textureViews[0];

  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.repeat.set(defaultTextureView.repeatX, 1);
  texture.offset.set(defaultTextureView.offsetX, 0);

  return (
    <>
      <SpatialTextureViewportRenderer texture={texture} views={textureViews} />
      <meshBasicMaterial
        map={texture}
        side={BackSide}
        toneMapped={false}
      />
    </>
  );
};

const SpatialTextureViewportRenderer = ({
  texture,
  views,
}: {
  texture: ThreeVideoTexture;
  views: SpatialTextureView[];
}) => {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const size = useThree((state) => state.size);

  useFrame(() => {
    const originalCameraAspect =
      camera instanceof PerspectiveCamera ? camera.aspect : null;

    gl.setScissorTest(true);
    gl.setViewport(0, 0, size.width, size.height);
    gl.setScissor(0, 0, size.width, size.height);
    gl.clear(true, true, true);

    for (const view of views) {
      const [viewportX, viewportY, viewportWidth, viewportHeight] =
        view.viewport;
      const x = Math.floor(viewportX * size.width);
      const y = Math.floor(viewportY * size.height);
      const width = Math.floor(viewportWidth * size.width);
      const height = Math.floor(viewportHeight * size.height);

      texture.repeat.set(view.repeatX, 1);
      texture.offset.set(view.offsetX, 0);
      gl.setViewport(x, y, width, height);
      gl.setScissor(x, y, width, height);
      setPerspectiveCameraAspect(camera, width / height);
      gl.render(scene, camera);
    }

    if (originalCameraAspect !== null) {
      setPerspectiveCameraAspect(camera, originalCameraAspect);
    }

    gl.setViewport(0, 0, size.width, size.height);
    gl.setScissor(0, 0, size.width, size.height);
    gl.setScissorTest(false);
  }, 1);

  return null;
};

const setPerspectiveCameraAspect = (
  camera: Camera,
  aspect: number,
) => {
  if (!(camera instanceof PerspectiveCamera) || !Number.isFinite(aspect)) {
    return;
  }

  camera.aspect = aspect;
  camera.updateProjectionMatrix();
};

const useSpatialHlsVideoTexture = (
  source: MediaPlaybackSource,
  initialMuted: boolean,
  initialPlaybackRate: number,
  onSourceReady: (() => void) | undefined,
  onSourceError: (() => void) | undefined,
) => {
  const outputColorSpace = useThree((state) => state.gl.outputColorSpace);
  const setMedia = useMediaAttach();
  const [texture, setTexture] = useState<ThreeVideoTexture | null>(null);
  const { url } = source;

  useEffect(() => {
    let isDisposed = false;
    const media = new HlsJsMedia();
    const video = document.createElement("video");
    const nextTexture = new VideoTexture(video);

    nextTexture.colorSpace = outputColorSpace;
    video.autoplay = true;
    video.loop = false;
    video.muted = initialMuted;
    video.playbackRate = initialPlaybackRate;
    video.playsInline = true;
    video.preload = "auto";
    media.autoplay = true;
    media.config = {
      hlsJs: createHlsPlaybackConfig(url),
    };
    media.loop = false;
    media.muted = initialMuted;
    media.playbackRate = initialPlaybackRate;
    media.preload = "auto";

    const handleLoadedData = () => {
      if (isDisposed) {
        return;
      }

      setTexture(nextTexture);
      void media.play().catch(() => undefined);
    };
    const handleError = () => {
      if (isDisposed) {
        return;
      }

      onSourceError?.();
    };
    const cleanupReadyListeners = onMediaReady(video, onSourceReady);

    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("error", handleError);
    media.addEventListener("error", handleError);

    media.attach(video);
    setMedia?.(media);
    media.src = url;
    void media.load();
    void media.play().catch(() => undefined);

    return () => {
      isDisposed = true;
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("error", handleError);
      media.removeEventListener("error", handleError);
      cleanupReadyListeners();
      setTexture((currentTexture) =>
        currentTexture === nextTexture ? null : currentTexture,
      );
      setMedia?.((currentMedia) =>
        currentMedia === media ? null : currentMedia,
      );
      media.pause();
      media.destroy();
      nextTexture.dispose();
      video.removeAttribute("src");
      video.load();
    };
  }, [
    initialMuted,
    initialPlaybackRate,
    onSourceError,
    onSourceReady,
    outputColorSpace,
    setMedia,
    url,
  ]);

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

const getUrlPathname = (url: string) => {
  try {
    return new URL(url, window.location.origin).pathname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
};
