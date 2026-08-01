import { useContainer } from "@videojs/react";
import { useEffect, useRef } from "react";

const DEFAULT_MAX_SCALE = 3;
const INTERACTIVE_TARGET_SELECTOR = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "[contenteditable='true']",
  "[role='button']",
  "[role='menuitem']",
  "[role='slider']",
].join(", ");
const MIDDLE_MOUSE_BUTTON = 1;
const MIDDLE_MOUSE_BUTTONS_MASK = 4;
const MIN_SCALE = 1;
const WHEEL_LINE_HEIGHT = 16;
const WHEEL_ZOOM_SENSITIVITY = 0.002;

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

type MiddleMousePan = {
  lastPoint: Point;
  pointerId: number;
};

export type PinchZoomGestureProps = {
  disabled?: boolean;
  maxScale?: number;
};

/**
 * Adds bounded pinch/wheel zoom and touch/middle-mouse pan behavior to the
 * video inside a Video.js container.
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
    const middleMousePanRef: { current: MiddleMousePan | null } = {
      current: null,
    };
    const pinchStartRef: { current: PinchStart | null } = { current: null };
    const pinchActiveRef = { current: false };
    const configuredMaxScale =
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

    const getContainerPoint = (event: PointerEvent | WheelEvent): Point => {
      const containerRect = container.getBoundingClientRect();
      return {
        x: event.clientX - containerRect.left,
        y: event.clientY - containerRect.top,
      };
    };

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

    const getMaxScale = () => {
      const renderedVideoSize = getRenderedVideoSize();

      if (
        renderedVideoSize.x <= 0
        || renderedVideoSize.y <= 0
        || container.clientWidth <= 0
        || container.clientHeight <= 0
      ) {
        return configuredMaxScale;
      }

      const viewportCoverScale = Math.max(
        container.clientWidth / renderedVideoSize.x,
        container.clientHeight / renderedVideoSize.y,
      );

      // Letterboxed media may need more than the configured zoom cap before
      // it can cover the player's full visual boundary.
      return Math.max(configuredMaxScale, viewportCoverScale);
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
      const scale = Math.min(getMaxScale(), Math.max(MIN_SCALE, zoom.scale));
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
      && Boolean(target.closest(INTERACTIVE_TARGET_SELECTOR));

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
        event.pointerType === "mouse"
        && event.button === MIDDLE_MOUSE_BUTTON
        && !isInteractiveTarget(event.target)
      ) {
        event.preventDefault();
        middleMousePanRef.current = {
          lastPoint: getContainerPoint(event),
          pointerId: event.pointerId,
        };
        container.setPointerCapture?.(event.pointerId);
        return;
      }

      if (
        event.pointerType !== "touch"
        || pointers.size >= 2
        || isInteractiveTarget(event.target)
      ) {
        return;
      }

      pointers.set(event.pointerId, getContainerPoint(event));
      container.setPointerCapture?.(event.pointerId);

      if (pointers.size === 2) {
        event.preventDefault();
        startPinch();
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      const middleMousePan = middleMousePanRef.current;

      if (middleMousePan?.pointerId === event.pointerId) {
        if ((event.buttons & MIDDLE_MOUSE_BUTTONS_MASK) === 0) {
          middleMousePanRef.current = null;
          return;
        }

        const point = getContainerPoint(event);
        event.preventDefault();
        applyZoom({
          ...zoomRef.current,
          translateX:
            zoomRef.current.translateX + point.x - middleMousePan.lastPoint.x,
          translateY:
            zoomRef.current.translateY + point.y - middleMousePan.lastPoint.y,
        });
        middleMousePan.lastPoint = point;
        return;
      }

      const pointer = pointers.get(event.pointerId);
      const pinchStart = pinchStartRef.current;

      if (!pointer || !pinchStart || pointers.size < 2) return;

      const point = getContainerPoint(event);
      pointer.x = point.x;
      pointer.y = point.y;

      const pair = getPointerPair();
      if (!pair) return;

      event.preventDefault();
      const centroid = getCentroid(...pair);
      const scale = Math.min(
        getMaxScale(),
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
      if (middleMousePanRef.current?.pointerId === event.pointerId) {
        event.preventDefault();
        middleMousePanRef.current = null;

        if (container.hasPointerCapture?.(event.pointerId)) {
          container.releasePointerCapture(event.pointerId);
        }
        return;
      }

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

    const handleWheel = (event: WheelEvent) => {
      if (event.deltaY === 0 || isInteractiveTarget(event.target)) return;

      event.preventDefault();
      const deltaMultiplier =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE ? WHEEL_LINE_HEIGHT
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? container.clientHeight
        : 1;
      const scale = Math.min(
        getMaxScale(),
        Math.max(
          MIN_SCALE,
          zoomRef.current.scale
            * Math.exp(
              -event.deltaY * deltaMultiplier * WHEEL_ZOOM_SENSITIVITY,
            ),
        ),
      );
      const scaleChange = scale / zoomRef.current.scale;
      const focalPoint = getContainerPoint(event);

      applyZoom({
        scale,
        translateX:
          focalPoint.x
          - video.offsetLeft
          - (focalPoint.x - video.offsetLeft - zoomRef.current.translateX)
            * scaleChange,
        translateY:
          focalPoint.y
          - video.offsetTop
          - (focalPoint.y - video.offsetTop - zoomRef.current.translateY)
            * scaleChange,
      });
    };

    const handleAuxClick = (event: MouseEvent) => {
      if (event.button === MIDDLE_MOUSE_BUTTON) event.preventDefault();
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
    container.addEventListener("lostpointercapture", handlePointerEnd, {
      passive: false,
    });
    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("auxclick", handleAuxClick);

    return () => {
      resizeObserver.disconnect();
      video.removeEventListener("loadedmetadata", handleLayoutChange);
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", handlePointerEnd);
      container.removeEventListener("pointercancel", handlePointerEnd);
      container.removeEventListener("lostpointercapture", handlePointerEnd);
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("auxclick", handleAuxClick);
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
