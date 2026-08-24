import { Canvas } from "@react-three/fiber";
import { type ReactNode, useRef } from "react";
import { MathUtils } from "three";
import { CameraHeightDragGesture } from "./CameraHeightDragGesture";
import {
  CameraGestureControls,
  DEFAULT_CAMERA_FOV,
} from "./CameraGestureControls";
import { SpatialVideoMaterial } from "./SpatialVideoMaterial";
import type { MediaPlaybackSource, StereoVideoLayout } from "@/types/media";

type MonoVideoCanvasProps = {
  source: MediaPlaybackSource;
  stereoLayout?: StereoVideoLayout;
  initialMuted: boolean;
  initialPlaybackRate: number;
  onSourceReady?: () => void;
  onSourceError?: () => void;
};

export const MonoVideoCanvas = (props: MonoVideoCanvasProps) => {
  const heightGesturePointerRef = useRef<number | null>(null);

  return (
    <Canvas
      className="spatial-mono-video-canvas"
      camera={{
        position: [0, 0, 0],
        near: 1,
        far: 1100,
        fov: DEFAULT_CAMERA_FOV,
      }}
      resize={{ offsetSize: true }}
      style={{
        height: "100%",
        inset: 0,
        position: "absolute",
        width: "100%",
      }}
    >
      <CameraGestureControls
        heightGesturePointerRef={heightGesturePointerRef}
        resetKey={props.source.url}
      />
      <CameraHeightDragGesture
        heightGesturePointerRef={heightGesturePointerRef}
      />
      <MonoVideoScene>
        <SpatialVideoMaterial
          key={props.source.id}
          initialMuted={props.initialMuted}
          initialPlaybackRate={props.initialPlaybackRate}
          source={props.source}
          stereoLayout={props.stereoLayout}
          onSourceReady={props.onSourceReady}
          onSourceError={props.onSourceError}
        />
      </MonoVideoScene>
    </Canvas>
  );
};

const MonoVideoScene = (props: { children: ReactNode }) => {
  const d = MathUtils.degToRad;
  const cutoutDegrees = 0; // Adjust this value to control the size of the cutout

  return (
    <>
      <ambientLight intensity={1} />
      <mesh>
        <sphereGeometry
          args={[
            500,
            64,
            32,
            d(-195), // phiStart
            d(190), // phiLength
            d(cutoutDegrees), // thetaStart: cuts off top
            d(180 - cutoutDegrees * 2), // thetaLength: cuts off bottom too
          ]}
        />
        {props.children}
      </mesh>
    </>
  );
};
