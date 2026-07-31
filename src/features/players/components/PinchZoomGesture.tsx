import { useContainer } from "@videojs/react";
import { useEffect, useRef } from "react";

const DEFAULT_MAX_SCALE = 3;
const MIN_SCALE = 1;

type Point = {
  x: number;
  y: number;
};

type ZoomState = {
  scale: number;
  translateX: number;
  translateY: number;
};

type PinchStart = {
  centroid: Point;
  distance: number;
  zoom: ZoomState;
};

export type PinchZoomGestureProps = {
  disabled?: boolean;
  maxScale?: number;
};

/**
 * Adds bounded two-finger pinch and pan behavior to the video inside a
 * Video.js container.
 *
 * This component renders no DOM of its own, so it can be composed into an
 * ejected Video.js skin alongside the built-in Gesture components.
 */
export const PinchZoomGesture = ({
  disabled = false,
  maxScale = DEFAULT_MAX_SCALE,
}: PinchZoomGestureProps): null => {
  const container = useContainer();
  const zoomRef = useRef<ZoomState>({
    scale: MIN_SCALE,
    translateX: 0,
    translateY: 0,
  });

  useEffect(() => {
    if (!container || disabled) return;

    const video = container.querySelector<HTMLVideoElement>("video");
    if (!video) return;

    const pointers = new Map<number, Point>();
    const pinchStartRef: { current: PinchStart | null } = { current: null };
    const pinchActiveRef = { current: false };
    const safeMaxScale =
      Number.isFinite(maxScale) ?
        Math.max(MIN_SCALE, maxScale)
      : DEFAULT_MAX_SCALE;
    const originalStyles = {
      containerTouchAction: container.style.touchAction,
      transform: video.style.transform,
      transformOrigin: video.style.transformOrigin,
      willChange: video.style.willChange,
    };

    container.style.touchAction = "none";

    const getDistance = (first: Point, second: Point) =>
      Math.hypot(second.x - first.x, second.y - first.y);

    const getCentroid = (first: Point, second: Point): Point => ({
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
    });

    const getRenderedVideoSize = (): Point => {
      const layoutWidth = video.clientWidth;
      const layoutHeight = video.clientHeight;

      if (
        layoutWidth === 0
        || layoutHeight === 0
        || video.videoWidth === 0
        || video.videoHeight === 0
      ) {
        return { x: layoutWidth, y: layoutHeight };
      }

      const fitScale = Math.min(
        layoutWidth / video.videoWidth,
        layoutHeight / video.videoHeight,
      );

      return {
        x: video.videoWidth * fitScale,
        y: video.videoHeight * fitScale,
      };
    };

    const clampAxis = (
      translation: number,
      scale: number,
      viewportSize: number,
      layoutOffset: number,
      contentOffset: number,
      contentSize: number,
    ) => {
      const scaledContentSize = contentSize * scale;
      const scaledContentOffset = contentOffset * scale;

      if (scaledContentSize <= viewportSize) {
        return (
          (viewportSize - scaledContentSize) / 2
          - layoutOffset
          - scaledContentOffset
        );
      }

      const minimum =
        viewportSize - layoutOffset - scaledContentOffset - scaledContentSize;
      const maximum = -layoutOffset - scaledContentOffset;
      return Math.min(maximum, Math.max(minimum, translation));
    };

    const clampZoom = (zoom: ZoomState): ZoomState => {
      const scale = Math.min(safeMaxScale, Math.max(MIN_SCALE, zoom.scale));
      const renderedVideoSize = getRenderedVideoSize();
      const contentOffsetX = (video.clientWidth - renderedVideoSize.x) / 2;
      const contentOffsetY = (video.clientHeight - renderedVideoSize.y) / 2;

      return {
        scale,
        translateX: clampAxis(
          zoom.translateX,
          scale,
          container.clientWidth,
          video.offsetLeft,
          contentOffsetX,
          renderedVideoSize.x,
        ),
        translateY: clampAxis(
          zoom.translateY,
          scale,
          container.clientHeight,
          video.offsetTop,
          contentOffsetY,
          renderedVideoSize.y,
        ),
      };
    };

    const applyZoom = (nextZoom: ZoomState) => {
      const zoom = clampZoom(nextZoom);
      zoomRef.current = zoom;

      if (
        zoom.scale === MIN_SCALE
        && Math.abs(zoom.translateX) < 0.01
        && Math.abs(zoom.translateY) < 0.01
      ) {
        video.style.transform = originalStyles.transform;
        video.style.transformOrigin = originalStyles.transformOrigin;
        video.style.willChange = originalStyles.willChange;
        return;
      }

      video.style.transformOrigin = "0 0";
      video.style.transform = `translate(${zoom.translateX}px, ${zoom.translateY}px) scale(${zoom.scale})`;
      video.style.willChange = "transform";
    };

    const isInteractiveTarget = (target: EventTarget | null) =>
      target instanceof Element
      && Boolean(
        target.closest("button, input, select, textarea, [role='button']"),
      );

    const getPointerPair = (): [Point, Point] | null => {
      const [first, second] = [...pointers.values()];
      return first && second ? [first, second] : null;
    };

    const startPinch = () => {
      const pair = getPointerPair();
      if (!pair || video.clientWidth === 0 || video.clientHeight === 0) return;

      pinchStartRef.current = {
        centroid: getCentroid(...pair),
        distance: Math.max(getDistance(...pair), 1),
        zoom: zoomRef.current,
      };
      pinchActiveRef.current = true;
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.pointerType !== "touch"
        || pointers.size >= 2
        || isInteractiveTarget(event.target)
      ) {
        return;
      }

      const containerRect = container.getBoundingClientRect();
      pointers.set(event.pointerId, {
        x: event.clientX - containerRect.left,
        y: event.clientY - containerRect.top,
      });
      container.setPointerCapture?.(event.pointerId);

      if (pointers.size === 2) {
        event.preventDefault();
        startPinch();
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      const pointer = pointers.get(event.pointerId);
      const pinchStart = pinchStartRef.current;

      if (!pointer || !pinchStart || pointers.size < 2) return;

      const containerRect = container.getBoundingClientRect();
      pointer.x = event.clientX - containerRect.left;
      pointer.y = event.clientY - containerRect.top;

      const pair = getPointerPair();
      if (!pair) return;

      event.preventDefault();
      const centroid = getCentroid(...pair);
      const scale = Math.min(
        safeMaxScale,
        Math.max(
          MIN_SCALE,
          pinchStart.zoom.scale * (getDistance(...pair) / pinchStart.distance),
        ),
      );
      const scaleChange = scale / pinchStart.zoom.scale;

      applyZoom({
        scale,
        translateX:
          centroid.x
          - video.offsetLeft
          - (pinchStart.centroid.x
            - video.offsetLeft
            - pinchStart.zoom.translateX)
            * scaleChange,
        translateY:
          centroid.y
          - video.offsetTop
          - (pinchStart.centroid.y
            - video.offsetTop
            - pinchStart.zoom.translateY)
            * scaleChange,
      });
    };

    const handlePointerEnd = (event: PointerEvent) => {
      const wasPinching = pinchActiveRef.current;
      if (!pointers.has(event.pointerId)) return;

      pointers.delete(event.pointerId);
      pinchStartRef.current = null;
      if (pointers.size === 0) pinchActiveRef.current = false;

      if (wasPinching) {
        event.preventDefault();
        // Prevent the skin's single/double tap gesture from firing after a pinch.
        event.stopImmediatePropagation();
      }

      if (container.hasPointerCapture?.(event.pointerId)) {
        container.releasePointerCapture(event.pointerId);
      }
    };

    const handleLayoutChange = () => applyZoom(zoomRef.current);
    const resizeObserver = new ResizeObserver(handleLayoutChange);
    resizeObserver.observe(container);
    video.addEventListener("loadedmetadata", handleLayoutChange);
    container.addEventListener("pointerdown", handlePointerDown, {
      passive: false,
    });
    container.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });
    container.addEventListener("pointerup", handlePointerEnd, {
      passive: false,
    });
    container.addEventListener("pointercancel", handlePointerEnd, {
      passive: false,
    });

    return () => {
      resizeObserver.disconnect();
      video.removeEventListener("loadedmetadata", handleLayoutChange);
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", handlePointerEnd);
      container.removeEventListener("pointercancel", handlePointerEnd);
      container.style.touchAction = originalStyles.containerTouchAction;
      video.style.transform = originalStyles.transform;
      video.style.transformOrigin = originalStyles.transformOrigin;
      video.style.willChange = originalStyles.willChange;
      zoomRef.current = {
        scale: MIN_SCALE,
        translateX: 0,
        translateY: 0,
      };
    };
  }, [container, disabled, maxScale]);

  return null;
};
