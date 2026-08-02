"use client";

import { useThree } from "@react-three/fiber";
import { type MutableRefObject, useEffect, useRef } from "react";
import { PerspectiveCamera } from "three";

const DOUBLE_TAP_TIMEOUT_MS = 320;
const TAP_SLOP_PX = 12;
const SECOND_TAP_DISTANCE_PX = 48;
const ACTIVATE_DRAG_PX = 10;
const VERTICAL_DOMINANCE = 1.25;
const MIN_CAMERA_HEIGHT = -80;
const MAX_CAMERA_HEIGHT = 80;
const HEIGHT_DRAG_SENSITIVITY = 0.25;

type PointerStart = {
  centerRegion: boolean;
  pointerType: string;
  time: number;
  x: number;
  y: number;
};

type TapRecord = {
  pointerType: string;
  time: number;
  x: number;
  y: number;
};

type HeightGestureCandidate = {
  active: boolean;
  pointerId: number;
  startHeight: number;
  startX: number;
  startY: number;
};

type CameraHeightDragGestureProps = {
  heightGesturePointerRef: MutableRefObject<number | null>;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

const getPointerPosition = (event: PointerEvent) => {
  return {
    x: event.clientX,
    y: event.clientY,
  };
};

const getDistance = (
  firstPointer: { x: number; y: number },
  secondPointer: { x: number; y: number },
) => {
  return Math.hypot(
    secondPointer.x - firstPointer.x,
    secondPointer.y - firstPointer.y,
  );
};

const isPrimaryPointer = (event: PointerEvent) => {
  return (
    event.isPrimary && (event.pointerType !== "mouse" || event.button === 0)
  );
};

const isCenterRegion = (canvas: HTMLCanvasElement, event: PointerEvent) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;

  return x >= rect.width / 3 && x <= (rect.width * 2) / 3;
};

const matchesSecondTap = (
  lastTap: TapRecord | null,
  pointer: PointerStart,
) => {
  if (!lastTap || lastTap.pointerType !== pointer.pointerType) {
    return false;
  }

  return (
    pointer.time - lastTap.time <= DOUBLE_TAP_TIMEOUT_MS &&
    getDistance(lastTap, pointer) <= SECOND_TAP_DISTANCE_PX
  );
};

export const CameraHeightDragGesture = ({
  heightGesturePointerRef,
}: CameraHeightDragGestureProps) => {
  const { camera, gl } = useThree();
  const pointerStartsRef = useRef(new Map<number, PointerStart>());
  const lastTapRef = useRef<TapRecord | null>(null);
  const candidateRef = useRef<HeightGestureCandidate | null>(null);

  useEffect(() => {
    const perspectiveCamera = camera;

    if (!(perspectiveCamera instanceof PerspectiveCamera)) {
      return;
    }

    const activeCamera: PerspectiveCamera = perspectiveCamera;
    const canvas = gl.domElement;

    const applyHeight = (nextHeight: number) => {
      activeCamera.position.y = clamp(
        nextHeight,
        MIN_CAMERA_HEIGHT,
        MAX_CAMERA_HEIGHT,
      );
    };

    const clearCandidate = (pointerId: number) => {
      if (candidateRef.current?.pointerId === pointerId) {
        candidateRef.current = null;
      }

      if (heightGesturePointerRef.current === pointerId) {
        heightGesturePointerRef.current = null;
      }

      if (canvas.hasPointerCapture(pointerId)) {
        canvas.releasePointerCapture(pointerId);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!isPrimaryPointer(event)) {
        return;
      }

      const pointer = {
        ...getPointerPosition(event),
        centerRegion: isCenterRegion(canvas, event),
        pointerType: event.pointerType,
        time: event.timeStamp,
      };

      pointerStartsRef.current.set(event.pointerId, pointer);

      if (
        !pointer.centerRegion ||
        !matchesSecondTap(lastTapRef.current, pointer)
      ) {
        clearCandidate(event.pointerId);
        return;
      }

      candidateRef.current = {
        active: false,
        pointerId: event.pointerId,
        startHeight: activeCamera.position.y,
        startX: pointer.x,
        startY: pointer.y,
      };
      heightGesturePointerRef.current = event.pointerId;
      canvas.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const candidate = candidateRef.current;

      if (!candidate || candidate.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - candidate.startX;
      const deltaY = event.clientY - candidate.startY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (!candidate.active) {
        if (absY >= ACTIVATE_DRAG_PX && absY >= absX * VERTICAL_DOMINANCE) {
          candidate.active = true;
          candidate.startHeight = activeCamera.position.y;
        } else if (Math.max(absX, absY) >= ACTIVATE_DRAG_PX) {
          clearCandidate(event.pointerId);
          return;
        }
      }

      if (!candidate.active) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      applyHeight(candidate.startHeight - deltaY * HEIGHT_DRAG_SENSITIVITY);
    };

    const handlePointerEnd = (event: PointerEvent) => {
      const candidate = candidateRef.current;
      const pointerStart = pointerStartsRef.current.get(event.pointerId);

      pointerStartsRef.current.delete(event.pointerId);

      if (pointerStart) {
        const pointerPosition = getPointerPosition(event);
        const isTap =
          pointerStart.centerRegion &&
          isCenterRegion(canvas, event) &&
          getDistance(pointerStart, pointerPosition) <= TAP_SLOP_PX;

        if (isTap) {
          lastTapRef.current = {
            pointerType: pointerStart.pointerType,
            time: event.timeStamp,
            ...pointerPosition,
          };
        }
      }

      if (!candidate || candidate.pointerId !== event.pointerId) {
        return;
      }

      if (candidate.active) {
        event.preventDefault();
        event.stopPropagation();
      }

      clearCandidate(event.pointerId);
    };

    const handlePointerCancel = (event: PointerEvent) => {
      pointerStartsRef.current.delete(event.pointerId);
      clearCandidate(event.pointerId);
    };

    canvas.addEventListener("pointerdown", handlePointerDown, {
      capture: true,
    });
    canvas.addEventListener("pointermove", handlePointerMove, {
      capture: true,
    });
    canvas.addEventListener("pointerup", handlePointerEnd, {
      capture: true,
    });
    canvas.addEventListener("pointercancel", handlePointerCancel, {
      capture: true,
    });
    canvas.addEventListener("lostpointercapture", handlePointerCancel, {
      capture: true,
    });

    return () => {
      if (candidateRef.current) {
        clearCandidate(candidateRef.current.pointerId);
      }

      canvas.removeEventListener("pointerdown", handlePointerDown, {
        capture: true,
      });
      canvas.removeEventListener("pointermove", handlePointerMove, {
        capture: true,
      });
      canvas.removeEventListener("pointerup", handlePointerEnd, {
        capture: true,
      });
      canvas.removeEventListener("pointercancel", handlePointerCancel, {
        capture: true,
      });
      canvas.removeEventListener("lostpointercapture", handlePointerCancel, {
        capture: true,
      });
    };
  }, [camera, gl, heightGesturePointerRef]);

  return null;
};
