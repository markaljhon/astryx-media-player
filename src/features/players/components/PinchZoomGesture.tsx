import { useContainer } from "@videojs/react";
import { useEffect, useRef } from "react";
import {
  PAN_GESTURE_DELTA_EVENT,
  type PanGestureDelta,
} from "./PanGesture";

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

type ClampZoomOptions = {
  maxScaleFloor?: number;
};

type ApplyZoomOptions = ClampZoomOptions & {
  desiredScale?: number;
  preserveDesiredScale?: boolean;
};

type PinchStart = {
  centroid: Point;
  distance: number;
  zoom: ZoomState;
};

type RenderedVideoMetrics = {
  contentOffsetX: number;
  contentOffsetY: number;
  height: number;
  width: number;
};

type LayoutAnchor = {
  contentRatioX: number;
  contentRatioY: number;
  viewportRatioX: number;
  viewportRatioY: number;
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
  const desiredScaleRef = useRef(MIN_SCALE);
  const layoutAnchorRef = useRef<LayoutAnchor | null>(null);

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

    const clampValue = (value: number, minimum: number, maximum: number) =>
      Math.min(maximum, Math.max(minimum, value));

    const normalizeScale = (scale: number) =>
      Number.isFinite(scale) ? Math.max(MIN_SCALE, scale) : MIN_SCALE;

    const getRenderedVideoMetrics = (): RenderedVideoMetrics => {
      const layoutWidth = video.clientWidth;
      const layoutHeight = video.clientHeight;

      if (
        layoutWidth === 0
        || layoutHeight === 0
        || video.videoWidth === 0
        || video.videoHeight === 0
      ) {
        return {
          contentOffsetX: 0,
          contentOffsetY: 0,
          height: layoutHeight,
          width: layoutWidth,
        };
      }

      const fitScale = Math.min(
        layoutWidth / video.videoWidth,
        layoutHeight / video.videoHeight,
      );
      const width = video.videoWidth * fitScale;
      const height = video.videoHeight * fitScale;

      return {
        contentOffsetX: (layoutWidth - width) / 2,
        contentOffsetY: (layoutHeight - height) / 2,
        height,
        width,
      };
    };

    const getMaxScale = (scaleFloor = MIN_SCALE) => {
      const renderedVideoMetrics = getRenderedVideoMetrics();

      if (
        renderedVideoMetrics.width <= 0
        || renderedVideoMetrics.height <= 0
        || container.clientWidth <= 0
        || container.clientHeight <= 0
      ) {
        return Math.max(configuredMaxScale, scaleFloor);
      }

      const viewportCoverScale = Math.max(
        container.clientWidth / renderedVideoMetrics.width,
        container.clientHeight / renderedVideoMetrics.height,
      );

      // Letterboxed media may need more than the configured zoom cap before
      // it can cover the player's full visual boundary.
      return Math.max(configuredMaxScale, viewportCoverScale, scaleFloor);
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

    const clampZoom = (
      zoom: ZoomState,
      { maxScaleFloor = MIN_SCALE }: ClampZoomOptions = {},
    ): ZoomState => {
      const scale = Math.min(
        getMaxScale(maxScaleFloor),
        Math.max(MIN_SCALE, zoom.scale),
      );
      const renderedVideoMetrics = getRenderedVideoMetrics();

      return {
        scale,
        translateX: clampAxis(
          zoom.translateX,
          scale,
          container.clientWidth,
          video.offsetLeft,
          renderedVideoMetrics.contentOffsetX,
          renderedVideoMetrics.width,
        ),
        translateY: clampAxis(
          zoom.translateY,
          scale,
          container.clientHeight,
          video.offsetTop,
          renderedVideoMetrics.contentOffsetY,
          renderedVideoMetrics.height,
        ),
      };
    };

    const getContainerCenter = (): Point => ({
      x: container.clientWidth / 2,
      y: container.clientHeight / 2,
    });

    const getLayoutAnchor = (
      zoom: ZoomState,
      viewportPoint = getContainerCenter(),
    ): LayoutAnchor | null => {
      const metrics = getRenderedVideoMetrics();

      if (
        container.clientWidth <= 0
        || container.clientHeight <= 0
        || metrics.width <= 0
        || metrics.height <= 0
        || zoom.scale <= 0
      ) {
        return null;
      }

      const videoLocalX =
        (viewportPoint.x - video.offsetLeft - zoom.translateX) / zoom.scale;
      const videoLocalY =
        (viewportPoint.y - video.offsetTop - zoom.translateY) / zoom.scale;

      return {
        contentRatioX: clampValue(
          (videoLocalX - metrics.contentOffsetX) / metrics.width,
          0,
          1,
        ),
        contentRatioY: clampValue(
          (videoLocalY - metrics.contentOffsetY) / metrics.height,
          0,
          1,
        ),
        viewportRatioX: clampValue(
          viewportPoint.x / container.clientWidth,
          0,
          1,
        ),
        viewportRatioY: clampValue(
          viewportPoint.y / container.clientHeight,
          0,
          1,
        ),
      };
    };

    const getAnchorViewportPoint = (anchor: LayoutAnchor): Point => ({
      x: anchor.viewportRatioX * container.clientWidth,
      y: anchor.viewportRatioY * container.clientHeight,
    });

    const getZoomFromLayoutAnchor = (
      anchor: LayoutAnchor,
      scale: number,
    ): ZoomState => {
      const metrics = getRenderedVideoMetrics();
      const viewportPoint = getAnchorViewportPoint(anchor);
      const contentLocalX =
        metrics.contentOffsetX + anchor.contentRatioX * metrics.width;
      const contentLocalY =
        metrics.contentOffsetY + anchor.contentRatioY * metrics.height;

      return {
        scale,
        translateX: viewportPoint.x - video.offsetLeft - contentLocalX * scale,
        translateY: viewportPoint.y - video.offsetTop - contentLocalY * scale,
      };
    };

    const applyZoom = (
      nextZoom: ZoomState,
      anchorPoint?: Point,
      options: ApplyZoomOptions = {},
    ) => {
      const desiredScale = normalizeScale(
        options.desiredScale
        ?? (options.preserveDesiredScale ?
          desiredScaleRef.current
        : nextZoom.scale),
      );
      const maxScaleFloor = Math.max(
        normalizeScale(options.maxScaleFloor ?? MIN_SCALE),
        desiredScale,
      );
      const requestedScale =
        options.preserveDesiredScale ?
          desiredScale
        : normalizeScale(nextZoom.scale);
      const zoom = clampZoom(
        {
          ...nextZoom,
          scale: requestedScale,
        },
        { maxScaleFloor },
      );
      zoomRef.current = zoom;
      desiredScaleRef.current = desiredScale;
      layoutAnchorRef.current = getLayoutAnchor(zoom, anchorPoint);

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
        applyZoom(
          {
            ...zoomRef.current,
            translateX:
              zoomRef.current.translateX + point.x - middleMousePan.lastPoint.x,
            translateY:
              zoomRef.current.translateY + point.y - middleMousePan.lastPoint.y,
          },
          getContainerCenter(),
          { preserveDesiredScale: true },
        );
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
        getMaxScale(pinchStart.zoom.scale),
        Math.max(
          MIN_SCALE,
          pinchStart.zoom.scale * (getDistance(...pair) / pinchStart.distance),
        ),
      );
      const scaleChange = scale / pinchStart.zoom.scale;

      applyZoom(
        {
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
        },
        centroid,
        {
          desiredScale: scale,
          maxScaleFloor: pinchStart.zoom.scale,
        },
      );
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
        getMaxScale(zoomRef.current.scale),
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

      applyZoom(
        {
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
        },
        focalPoint,
        {
          desiredScale: scale,
          maxScaleFloor: zoomRef.current.scale,
        },
      );
    };

    const handleAuxClick = (event: MouseEvent) => {
      if (event.button === MIDDLE_MOUSE_BUTTON) event.preventDefault();
    };

    const handlePanDelta = (event: Event) => {
      const { deltaX, deltaY } = (event as CustomEvent<PanGestureDelta>).detail;

      applyZoom(
        {
          ...zoomRef.current,
          translateX: zoomRef.current.translateX + deltaX,
          translateY: zoomRef.current.translateY + deltaY,
        },
        getContainerCenter(),
        { preserveDesiredScale: true },
      );
    };

    const handleLayoutChange = () => {
      const anchor =
        layoutAnchorRef.current
        ?? getLayoutAnchor(zoomRef.current, getContainerCenter());

      if (!anchor) {
        applyZoom(
          {
            ...zoomRef.current,
            scale: desiredScaleRef.current,
          },
          undefined,
          { preserveDesiredScale: true },
        );
        return;
      }

      applyZoom(
        getZoomFromLayoutAnchor(anchor, desiredScaleRef.current),
        getAnchorViewportPoint(anchor),
        { preserveDesiredScale: true },
      );
    };
    const resizeObserver = new ResizeObserver(handleLayoutChange);
    resizeObserver.observe(container);
    video.addEventListener("loadedmetadata", handleLayoutChange);
    container.addEventListener(PAN_GESTURE_DELTA_EVENT, handlePanDelta);
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
      container.removeEventListener(PAN_GESTURE_DELTA_EVENT, handlePanDelta);
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
      desiredScaleRef.current = MIN_SCALE;
      layoutAnchorRef.current = null;
    };
  }, [container, disabled, maxScale]);

  return null;
};
