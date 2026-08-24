import type { StereoVideoLayout } from "@/types/media";

export type SpatialTextureViewId = "mono" | "left" | "right";

export type SpatialTextureView = {
  id: SpatialTextureViewId;
  viewport: [x: number, y: number, width: number, height: number];
  repeatX: number;
  offsetX: number;
};

export const createSpatialTextureViews = (
  stereoLayout: StereoVideoLayout | undefined,
): SpatialTextureView[] => {
  if (stereoLayout === "side-by-side") {
    return [
      {
        id: "left",
        viewport: [0, 0, 0.5, 1],
        repeatX: -0.5,
        offsetX: 0.5,
      },
      {
        id: "right",
        viewport: [0.5, 0, 0.5, 1],
        repeatX: -0.5,
        offsetX: 1,
      },
    ];
  }

  return [
    {
      id: "mono",
      viewport: [0, 0, 1, 1],
      repeatX: -0.5,
      offsetX: 0.5,
    },
  ];
};
