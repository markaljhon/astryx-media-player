import { Canvas } from "@react-three/fiber";
import type { ReactNode } from "react";
import { MathUtils } from "three";
import {
  CameraGestureControls,
  DEFAULT_CAMERA_FOV,
} from "./CameraGestureControls";
import { SpatialVideoMaterial } from "./SpatialVideoMaterial";

type MonoVideoCanvasProps = {
  url: string;
};

export const MonoVideoCanvas = (props: MonoVideoCanvasProps) => {
  return (
    <Canvas
      camera={{
        position: [0, 0, 0],
        near: 1,
        far: 1100,
        fov: DEFAULT_CAMERA_FOV,
      }}
      style={{
        touchAction: "none",
        userSelect: "none",
      }}
    >
      <CameraGestureControls resetKey={props.url} />
      <MonoVideoScene>
        <SpatialVideoMaterial url={props.url} />
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
