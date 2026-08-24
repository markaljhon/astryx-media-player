import { describe, expect, test } from "bun:test";
import { createSpatialTextureViews } from "../src/features/players/SpatialMonoVideoPlayer/components/spatialTextureViews.ts";

describe("createSpatialTextureViews", () => {
  test("keeps mono spatial video as a single full-player view", () => {
    expect(createSpatialTextureViews("mono")).toEqual([
      {
        id: "mono",
        viewport: [0, 0, 1, 1],
        repeatX: -0.5,
        offsetX: 0.5,
      },
    ]);
  });

  test("splits side-by-side spatial video into left and right eye views", () => {
    expect(createSpatialTextureViews("side-by-side")).toEqual([
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
    ]);
  });

  test("keeps side-by-side texture coordinate ranges inside the source texture", () => {
    expect(
      createSpatialTextureViews("side-by-side").map((view) => ({
        id: view.id,
        sourceStartX: view.offsetX,
        sourceEndX: view.offsetX + view.repeatX,
      })),
    ).toEqual([
      {
        id: "left",
        sourceStartX: 0.5,
        sourceEndX: 0,
      },
      {
        id: "right",
        sourceStartX: 1,
        sourceEndX: 0.5,
      },
    ]);
  });
});
