import { useThree } from "@react-three/fiber";
import { type MutableRefObject, useEffect, useRef } from "react";
import { MathUtils, PerspectiveCamera } from "three";

export const DEFAULT_CAMERA_FOV = 100;
export const DEFAULT_CAMERA_HEIGHT = 0;

const MIN_CAMERA_FOV = 20;
const MAX_CAMERA_FOV = 140;
const DEFAULT_CAMERA_PITCH = 0;
const DEFAULT_CAMERA_YAW = 0;
const ROTATION_SENSITIVITY = 0.0026;
const MIN_PITCH = MathUtils.degToRad(-40);
const MAX_PITCH = MathUtils.degToRad(40);
const MIN_YAW = MathUtils.degToRad(-40);
const MAX_YAW = MathUtils.degToRad(40);

type PointerPosition = {
  x: number;
  y: number;
};

type PinchState = {
  distance: number;
  fov: number;
};

type CameraGestureControlsProps = {
  heightGesturePointerRef: MutableRefObject<number | null>;
  resetKey: string;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

const getPointerPosition = (event: PointerEvent): PointerPosition => {
  return {
    x: event.clientX,
    y: event.clientY,
  };
};

const getPointerDistance = (
  firstPointer: PointerPosition,
  secondPointer: PointerPosition,
) => {
  return Math.hypot(
    secondPointer.x - firstPointer.x,
    secondPointer.y - firstPointer.y,
  );
};

export const CameraGestureControls = ({
  heightGesturePointerRef,
  resetKey,
}: CameraGestureControlsProps) => {
  const { camera, gl } = useThree();
  const pointersRef = useRef(new Map<number, PointerPosition>());
  const lastRotationPointerRef = useRef<PointerPosition | null>(null);
  const pinchRef = useRef<PinchState | null>(null);
  const rotationRef = useRef({
    pitch: DEFAULT_CAMERA_PITCH,
    yaw: DEFAULT_CAMERA_YAW,
  });

  useEffect(() => {
    const perspectiveCamera = camera;

    if (!(perspectiveCamera instanceof PerspectiveCamera)) {
      return;
    }

    perspectiveCamera.position.set(0, DEFAULT_CAMERA_HEIGHT, 0);
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
    heightGesturePointerRef.current = null;
    lastRotationPointerRef.current = null;
    pinchRef.current = null;
  }, [camera, heightGesturePointerRef, resetKey]);

  useEffect(() => {
    const perspectiveCamera = camera;

    if (!(perspectiveCamera instanceof PerspectiveCamera)) {
      return;
    }

    const activeCamera: PerspectiveCamera = perspectiveCamera;
    const canvas = gl.domElement;

    const applyFov = (nextFov: number) => {
      activeCamera.fov = clamp(nextFov, MIN_CAMERA_FOV, MAX_CAMERA_FOV);
      activeCamera.updateProjectionMatrix();
    };

    const getPinchPointers = () => {
      return Array.from(pointersRef.current.values()).slice(0, 2);
    };

    const startPinch = () => {
      const [firstPointer, secondPointer] = getPinchPointers();

      if (!firstPointer || !secondPointer) {
        pinchRef.current = null;
        return;
      }

      pinchRef.current = {
        distance: getPointerDistance(firstPointer, secondPointer),
        fov: activeCamera.fov,
      };
    };

    const continueSinglePointerRotation = (pointer: PointerPosition | null) => {
      lastRotationPointerRef.current = pointer;
      pinchRef.current = null;
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (heightGesturePointerRef.current === event.pointerId) {
        return;
      }

      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);
      pointersRef.current.set(event.pointerId, getPointerPosition(event));

      if (pointersRef.current.size >= 2) {
        startPinch();
        lastRotationPointerRef.current = null;
        return;
      }

      continueSinglePointerRotation(getPointerPosition(event));
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (heightGesturePointerRef.current === event.pointerId) {
        return;
      }

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

      activeCamera.rotation.set(rotation.pitch, rotation.yaw, 0, "YXZ");
    };

    const handlePointerEnd = (event: PointerEvent) => {
      if (heightGesturePointerRef.current === event.pointerId) {
        pointersRef.current.delete(event.pointerId);

        if (canvas.hasPointerCapture(event.pointerId)) {
          canvas.releasePointerCapture(event.pointerId);
        }

        if (pointersRef.current.size === 0) {
          continueSinglePointerRotation(null);
        }

        return;
      }

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
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const wheelScale =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 0.03 : 0.001;

      applyFov(activeCamera.fov * Math.exp(event.deltaY * wheelScale));
    };

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
  }, [camera, gl, heightGesturePointerRef]);

  return null;
};
