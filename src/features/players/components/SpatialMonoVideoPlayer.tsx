import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Dialog } from "@astryxdesign/core/Dialog";
import { HStack, StackItem, VStack } from "@astryxdesign/core/Stack";
import { Slider } from "@astryxdesign/core/Slider";
import { Text } from "@astryxdesign/core/Text";
import { Canvas, useThree } from "@react-three/fiber";
import {
  BackSide,
  ClampToEdgeWrapping,
  LinearFilter,
  MathUtils,
  PerspectiveCamera,
  SRGBColorSpace,
  VideoTexture,
} from "three";
import type { StereoVideoLayout } from "../../media/api/mediaTypes";
import type { VideoPlayerProps } from "../api/videoPlayerAdapters";
import { Icon, IconButton } from "@astryxdesign/core";

const DEFAULT_CAMERA_FOV = 100;
const MIN_CAMERA_FOV = 20;
const MAX_CAMERA_FOV = 100;
const ROTATION_SENSITIVITY = 0.0026;
const MIN_PITCH = MathUtils.degToRad(-40);
const MAX_PITCH = MathUtils.degToRad(40);
const MIN_YAW = MathUtils.degToRad(140);
const MAX_YAW = MathUtils.degToRad(218);
const SPHERE_RADIUS = 500;
const CANVAS_RESIZE_OPTIONS = { offsetSize: true };
const SPATIAL_VIEWPORT_HEIGHT_VARIABLE = "--spatial-player-viewport-height";
const SPATIAL_VIEWPORT_HEIGHT = `var(${SPATIAL_VIEWPORT_HEIGHT_VARIABLE}, 100dvh)`;

const fullscreenDialogStyle: CSSProperties = {
  backgroundColor: "black",
  height: SPATIAL_VIEWPORT_HEIGHT,
  maxHeight: SPATIAL_VIEWPORT_HEIGHT,
  minHeight: SPATIAL_VIEWPORT_HEIGHT,
  overflow: "hidden",
  width: "100dvw",
  maxWidth: "100dvw",
};

const fullscreenSurfaceStyle: CSSProperties = {
  backgroundColor: "black",
  height: "100%",
  minHeight: 0,
  overflow: "hidden",
  position: "relative",
  width: "100%",
};

const canvasItemStyle: CSSProperties = {
  flexBasis: 0,
  height: "100%",
};

const closeButtonStyle: CSSProperties = {
  position: "absolute",
  top: "calc(env(safe-area-inset-top) + var(--spacing-2))",
  right: "calc(env(safe-area-inset-right) + var(--spacing-2))",
  zIndex: 2,
};

const playbackControlsStyle: CSSProperties = {
  boxSizing: "border-box",
  left: 0,
  padding:
    "var(--spacing-3) calc(env(safe-area-inset-right) + var(--spacing-3)) calc(env(safe-area-inset-bottom) + var(--spacing-3)) calc(env(safe-area-inset-left) + var(--spacing-3))",
  position: "absolute",
  right: 0,
  bottom: 0,
  width: "100%",
  zIndex: 1,
};

type PointerPosition = {
  x: number;
  y: number;
};

type PinchState = {
  distance: number;
  fov: number;
};

function useSpatialViewportHeight(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const root = document.documentElement;
    const visualViewport = window.visualViewport;

    function updateViewportHeight() {
      const viewportHeight = visualViewport?.height ?? window.innerHeight;
      root.style.setProperty(
        SPATIAL_VIEWPORT_HEIGHT_VARIABLE,
        `${viewportHeight}px`,
      );
    }

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    window.addEventListener("orientationchange", updateViewportHeight);
    visualViewport?.addEventListener("resize", updateViewportHeight);
    visualViewport?.addEventListener("scroll", updateViewportHeight);

    return () => {
      window.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("orientationchange", updateViewportHeight);
      visualViewport?.removeEventListener("resize", updateViewportHeight);
      visualViewport?.removeEventListener("scroll", updateViewportHeight);
      root.style.removeProperty(SPATIAL_VIEWPORT_HEIGHT_VARIABLE);
    };
  }, [isOpen]);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getPointerPosition(event: PointerEvent): PointerPosition {
  return {
    x: event.clientX,
    y: event.clientY,
  };
}

function getPointerDistance(
  firstPointer: PointerPosition,
  secondPointer: PointerPosition,
) {
  return Math.hypot(
    secondPointer.x - firstPointer.x,
    secondPointer.y - firstPointer.y,
  );
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  const totalSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainder = totalSeconds % 60;

  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function applyMonoCrop(texture: VideoTexture, layout: StereoVideoLayout) {
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;

  if (layout === "side-by-side") {
    texture.repeat.set(-0.5, 1);
    texture.offset.set(0.5, 0);
    return;
  }

  if (layout === "top-bottom") {
    texture.repeat.set(-1, 0.5);
    texture.offset.set(1, 0.5);
    return;
  }

  texture.repeat.set(-1, 1);
  texture.offset.set(1, 0);
}

function MonoVideoScreen({
  layout,
  video,
}: {
  layout: StereoVideoLayout;
  video: HTMLVideoElement;
}) {
  const d = MathUtils.degToRad;
  const cutoutDegrees = 0; // Adjust this value to control the amount of cutout at the bottom of the sphere

  const texture = useMemo(() => {
    const nextTexture = new VideoTexture(video);
    nextTexture.colorSpace = SRGBColorSpace;
    nextTexture.minFilter = LinearFilter;
    nextTexture.magFilter = LinearFilter;

    return nextTexture;
  }, [video]);

  useEffect(() => {
    applyMonoCrop(texture, layout);
  }, [layout, texture]);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  return (
    <mesh>
      <sphereGeometry
        args={[
          SPHERE_RADIUS,
          64,
          32,
          d(-5), // phiStart
          d(190), // phiLength
          d(cutoutDegrees), // thetaStart: cuts off top
          d(180 - cutoutDegrees*2), // thetaLength: cuts off bottom too
        ]}
      />
      <meshBasicMaterial map={texture} side={BackSide} toneMapped={false} />
    </mesh>
  );
}

function CameraGestureControls({ resetKey }: { resetKey: string }) {
  const { camera, gl } = useThree();
  const pointersRef = useRef(new Map<number, PointerPosition>());
  const lastRotationPointerRef = useRef<PointerPosition | null>(null);
  const pinchRef = useRef<PinchState | null>(null);
  const rotationRef = useRef({ pitch: 0, yaw: 0 });

  useEffect(() => {
    const DEFAULT_CAMERA_PITCH = 0;
    const DEFAULT_CAMERA_YAW = MathUtils.degToRad(180);
    const perspectiveCamera = camera;

    if (!(perspectiveCamera instanceof PerspectiveCamera)) {
      return;
    }

    perspectiveCamera.position.set(0, 0, 0);
    perspectiveCamera.rotation.order = "YXZ";
    perspectiveCamera.rotation.set(
      DEFAULT_CAMERA_PITCH,
      DEFAULT_CAMERA_YAW,
      0,
      "YXZ",
    );
    perspectiveCamera.fov = DEFAULT_CAMERA_FOV;
    perspectiveCamera.updateProjectionMatrix();

    rotationRef.current = {
      pitch: DEFAULT_CAMERA_PITCH,
      yaw: DEFAULT_CAMERA_YAW,
    };
    pointersRef.current.clear();
    lastRotationPointerRef.current = null;
    pinchRef.current = null;
  }, [camera, resetKey]);

  useEffect(() => {
    const perspectiveCamera = camera;

    if (!(perspectiveCamera instanceof PerspectiveCamera)) {
      return;
    }

    const activeCamera: PerspectiveCamera = perspectiveCamera;
    const canvas = gl.domElement;

    function applyFov(nextFov: number) {
      activeCamera.fov = clamp(nextFov, MIN_CAMERA_FOV, MAX_CAMERA_FOV);
      activeCamera.updateProjectionMatrix();
      console.log("FOV:", activeCamera.fov);
    }

    function getPinchPointers() {
      return Array.from(pointersRef.current.values()).slice(0, 2);
    }

    function startPinch() {
      const [firstPointer, secondPointer] = getPinchPointers();

      if (!firstPointer || !secondPointer) {
        pinchRef.current = null;
        return;
      }

      pinchRef.current = {
        distance: getPointerDistance(firstPointer, secondPointer),
        fov: activeCamera.fov,
      };
    }

    function continueSinglePointerRotation(pointer: PointerPosition | null) {
      lastRotationPointerRef.current = pointer;
      pinchRef.current = null;
    }

    function handlePointerDown(event: PointerEvent) {
      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);
      pointersRef.current.set(event.pointerId, getPointerPosition(event));

      if (pointersRef.current.size >= 2) {
        startPinch();
        lastRotationPointerRef.current = null;
        return;
      }

      continueSinglePointerRotation(getPointerPosition(event));
    }

    function handlePointerMove(event: PointerEvent) {
      if (!pointersRef.current.has(event.pointerId)) {
        return;
      }

      event.preventDefault();
      const pointerPosition = getPointerPosition(event);
      pointersRef.current.set(event.pointerId, pointerPosition);

      if (pointersRef.current.size >= 2) {
        const [firstPointer, secondPointer] = getPinchPointers();

        if (!firstPointer || !secondPointer) {
          return;
        }

        if (!pinchRef.current) {
          startPinch();
        }

        const pinch = pinchRef.current;
        const nextDistance = getPointerDistance(firstPointer, secondPointer);

        if (pinch && pinch.distance > 0 && nextDistance > 0) {
          applyFov(pinch.fov * (pinch.distance / nextDistance));
        }

        return;
      }

      const lastRotationPointer = lastRotationPointerRef.current;
      lastRotationPointerRef.current = pointerPosition;

      if (!lastRotationPointer) {
        return;
      }

      const rotation = rotationRef.current;
      rotation.yaw = clamp(
        rotation.yaw +
          (pointerPosition.x - lastRotationPointer.x) * ROTATION_SENSITIVITY,
        MIN_YAW,
        MAX_YAW,
      );
      rotation.pitch = clamp(
        rotation.pitch +
          (pointerPosition.y - lastRotationPointer.y) * ROTATION_SENSITIVITY,
        MIN_PITCH,
        MAX_PITCH,
      );

      activeCamera.rotation.set(rotation.pitch, rotation.yaw, 0, "YXZ"); console.log("Pitch:", MathUtils.radToDeg(rotation.pitch), "Yaw:", MathUtils.radToDeg(rotation.yaw));
    }

    function handlePointerEnd(event: PointerEvent) {
      pointersRef.current.delete(event.pointerId);

      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }

      if (pointersRef.current.size === 1) {
        continueSinglePointerRotation(
          Array.from(pointersRef.current.values())[0] ?? null,
        );
        return;
      }

      if (pointersRef.current.size >= 2) {
        startPinch();
        return;
      }

      continueSinglePointerRotation(null);
    }

    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      const wheelScale =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 0.03 : 0.001;

      applyFov(activeCamera.fov * Math.exp(event.deltaY * wheelScale));
    }

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerEnd);
    canvas.addEventListener("pointercancel", handlePointerEnd);
    canvas.addEventListener("lostpointercapture", handlePointerEnd);
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerEnd);
      canvas.removeEventListener("pointercancel", handlePointerEnd);
      canvas.removeEventListener("lostpointercapture", handlePointerEnd);
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [camera, gl]);

  return null;
}

function MonoVideoCanvas({
  layout,
  video,
}: {
  layout: StereoVideoLayout;
  video: HTMLVideoElement | null;
}) {
  const resetKey = video?.currentSrc || video?.src || "";

  return (
    <Canvas
      camera={{
        position: [0, 0, 0],
        fov: DEFAULT_CAMERA_FOV,
        near: 1,
        far: 1100,
      }}
      resize={CANVAS_RESIZE_OPTIONS}
      style={{
        height: "100%",
        touchAction: "none",
        userSelect: "none",
        width: "100%",
      }}
    >
      <CameraGestureControls resetKey={resetKey} />
      <ambientLight intensity={1} />
      {video ? <MonoVideoScreen layout={layout} video={video} /> : null}
    </Canvas>
  );
}

export function SpatialMonoVideoPlayer({
  item,
  isOpen,
  onOpenChange,
}: VideoPlayerProps) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const layout = item.stereoLayout ?? "mono";
  useSpatialViewportHeight(isOpen);

  useEffect(() => {
    if (!isOpen || !item.sourceUrl) {
      return;
    }

    let isActive = true;
    let hasRequestedAutoplay = false;
    const nextVideo = document.createElement("video");
    const sourceUrl = new URL(item.sourceUrl, window.location.href);

    if (sourceUrl.origin !== window.location.origin) {
      nextVideo.crossOrigin = "anonymous";
    }

    nextVideo.autoplay = true;
    nextVideo.preload = "auto";
    nextVideo.playsInline = true;
    nextVideo.src = item.sourceUrl;

    function syncPlaybackState() {
      setIsPaused(nextVideo.paused);
      setCurrentTime(nextVideo.currentTime);
      setDuration(Number.isFinite(nextVideo.duration) ? nextVideo.duration : 0);
    }

    function handleError() {
      setPlaybackError("This video could not be loaded by the VR mono player.");
    }

    async function startPlayback() {
      if (hasRequestedAutoplay) {
        return;
      }

      hasRequestedAutoplay = true;

      try {
        setPlaybackError(null);
        await nextVideo.play();
      } catch {
        if (isActive) {
          setIsPaused(true);
          setPlaybackError("Playback was blocked by the browser.");
        }
      }
    }

    nextVideo.addEventListener("loadedmetadata", syncPlaybackState);
    nextVideo.addEventListener("timeupdate", syncPlaybackState);
    nextVideo.addEventListener("play", syncPlaybackState);
    nextVideo.addEventListener("pause", syncPlaybackState);
    nextVideo.addEventListener("ended", syncPlaybackState);
    nextVideo.addEventListener("error", handleError);
    setVideo(nextVideo);
    setPlaybackError(null);
    void startPlayback();

    return () => {
      isActive = false;
      nextVideo.pause();
      nextVideo.removeEventListener("loadedmetadata", syncPlaybackState);
      nextVideo.removeEventListener("timeupdate", syncPlaybackState);
      nextVideo.removeEventListener("play", syncPlaybackState);
      nextVideo.removeEventListener("pause", syncPlaybackState);
      nextVideo.removeEventListener("ended", syncPlaybackState);
      nextVideo.removeEventListener("error", handleError);
      nextVideo.removeAttribute("src");
      nextVideo.load();
      setVideo(null);
    };
  }, [isOpen, item.sourceUrl]);

  useEffect(() => {
    if (video) {
      video.muted = isMuted;
    }
  }, [isMuted, video]);

  async function togglePlayback() {
    if (!video) {
      return;
    }

    try {
      setPlaybackError(null);

      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch {
      setPlaybackError("Playback was blocked by the browser.");
    }
  }

  function seek(nextTime: number) {
    if (!video) {
      return;
    }

    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function stopPlayback() {
    if (!video) {
      return;
    }

    video.pause();
    video.currentTime = 0;
    setCurrentTime(0);
  }

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      variant="fullscreen"
      purpose="info"
      padding={0}
      style={fullscreenDialogStyle}
    >
      <VStack height="100%" gap={0} padding={0} style={fullscreenSurfaceStyle}>
        <VStack gap={3} height="100%" padding={0} style={fullscreenSurfaceStyle}>
          <IconButton
            label="Close"
            icon={<Icon icon="close" color="inherit" />}
            variant="secondary"
            style={closeButtonStyle}
            onClick={() => onOpenChange(false)}
          />
          <StackItem
            size="fill"
            crossAlignSelf="stretch"
            style={canvasItemStyle}
          >
            <MonoVideoCanvas layout={layout} video={video} />
          </StackItem>

          {playbackError ? (
            <Text type="supporting" color="secondary">
              {playbackError}
            </Text>
          ) : null}

          <VStack
            gap={2}
            padding={0}
            style={playbackControlsStyle}
          >
            <Slider
              label="Playback position"
              isLabelHidden
              value={Math.min(currentTime, duration || currentTime)}
              min={0}
              max={duration || 1}
              step={0.1}
              valueDisplay="none"
              onChange={seek}
            />
            <HStack gap={2} vAlign="center" wrap="wrap">
              <Button
                label={isPaused ? "Play" : "Pause"}
                variant="primary"
                onClick={togglePlayback}
                isDisabled={!video}
              />
              <Button
                label="Stop"
                variant="secondary"
                onClick={stopPlayback}
                isDisabled={!video}
              />
              <Button
                label={isMuted ? "Unmute" : "Mute"}
                variant="ghost"
                onClick={() => setIsMuted((value) => !value)}
                isDisabled={!video}
              />
              <Text type="supporting" color="secondary">
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>
            </HStack>
          </VStack>
        </VStack>
      </VStack>
    </Dialog>
  );
}
