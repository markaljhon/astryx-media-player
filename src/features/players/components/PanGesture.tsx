import { useContainer } from "@videojs/react";
import { useEffect, useRef } from "react";

const DEFAULT_PAN_THRESHOLD = 6;
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

export const PAN_GESTURE_DELTA_EVENT = "astryx:video-pan-delta";

export type PanGestureDelta = {
  deltaX: number;
  deltaY: number;
};

type Point = {
  x: number;
  y: number;
};

type PanState = {
  pointerId: number;
  startPoint: Point;
  lastPoint: Point;
  hasPanned: boolean;
};

export type PanGestureProps = {
  disabled?: boolean;
  threshold?: number;
};

const getPoint = (event: PointerEvent): Point => ({
  x: event.clientX,
  y: event.clientY,
});

const getDistance = (first: Point, second: Point) => {
  return Math.hypot(second.x - first.x, second.y - first.y);
};

const isInteractiveTarget = (target: EventTarget | null) => {
  return (
    target instanceof Element
    && Boolean(target.closest(INTERACTIVE_TARGET_SELECTOR))
  );
};

const isPanPointer = (event: PointerEvent) => {
  if (event.pointerType === "mouse") return event.button === 0;
  return event.pointerType === "touch" || event.pointerType === "pen";
};

/**
 * Adds one-pointer drag panning to the Video.js container.
 *
 * The transform itself is owned by PinchZoomGesture, which listens for the
 * emitted pan deltas and applies the same bounds used by pinch/wheel zoom.
 */
export const PanGesture = ({
  disabled = false,
  threshold = DEFAULT_PAN_THRESHOLD,
}: PanGestureProps): null => {
  const container = useContainer();
  const panRef = useRef<PanState | null>(null);

  useEffect(() => {
    if (!container || disabled) return;

    const activePointers = new Set<number>();

    const handlePointerDown = (event: PointerEvent) => {
      if (isPanPointer(event) && !isInteractiveTarget(event.target)) {
        activePointers.add(event.pointerId);
      }

      if (activePointers.size > 1) {
        panRef.current = null;
        return;
      }

      if (
        panRef.current
        || !isPanPointer(event)
        || isInteractiveTarget(event.target)
      ) {
        return;
      }

      const point = getPoint(event);
      panRef.current = {
        pointerId: event.pointerId,
        startPoint: point,
        lastPoint: point,
        hasPanned: false,
      };
      container.setPointerCapture?.(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const pan = panRef.current;
      if (!pan || pan.pointerId !== event.pointerId) return;

      const point = getPoint(event);
      const hasCrossedThreshold =
        pan.hasPanned || getDistance(pan.startPoint, point) >= threshold;

      if (!hasCrossedThreshold) return;

      const deltaX = point.x - pan.lastPoint.x;
      const deltaY = point.y - pan.lastPoint.y;
      pan.hasPanned = true;
      pan.lastPoint = point;

      event.preventDefault();
      container.dispatchEvent(
        new CustomEvent<PanGestureDelta>(PAN_GESTURE_DELTA_EVENT, {
          detail: { deltaX, deltaY },
        }),
      );
    };

    const handlePointerEnd = (event: PointerEvent) => {
      activePointers.delete(event.pointerId);

      const pan = panRef.current;
      if (!pan || pan.pointerId !== event.pointerId) return;

      panRef.current = null;

      if (container.hasPointerCapture?.(event.pointerId)) {
        container.releasePointerCapture(event.pointerId);
      }

      if (pan.hasPanned) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    const handleLostPointerCapture = (event: PointerEvent) => {
      activePointers.delete(event.pointerId);

      if (panRef.current?.pointerId === event.pointerId) {
        panRef.current = null;
      }
    };

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
    container.addEventListener("lostpointercapture", handleLostPointerCapture);

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", handlePointerEnd);
      container.removeEventListener("pointercancel", handlePointerEnd);
      container.removeEventListener(
        "lostpointercapture",
        handleLostPointerCapture,
      );
    };
  }, [container, disabled, threshold]);

  return null;
};
