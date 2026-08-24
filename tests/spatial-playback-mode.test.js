import { describe, expect, test } from "bun:test";
import {
  canPlaySpatialSbs,
  getSpatialPlayerStereoLayout,
} from "../src/features/players/api/spatialPlaybackMode.ts";

const sbsVideoItem = {
  id: "scene-1",
  title: "Scene 1",
  kind: "video",
  providerId: "stash",
  sourceUrl: "https://cdn.example.test/source.mp4",
  stereoLayout: "side-by-side",
};

describe("getSpatialPlayerStereoLayout", () => {
  test("keeps default media library playback in single-eye mode", () => {
    expect(getSpatialPlayerStereoLayout(sbsVideoItem, "default")).toBe("mono");
  });

  test("enables side-by-side layout only for the SBS playback action", () => {
    expect(getSpatialPlayerStereoLayout(sbsVideoItem, "side-by-side")).toBe(
      "side-by-side",
    );
  });
});

describe("canPlaySpatialSbs", () => {
  test("offers SBS playback only for side-by-side video items", () => {
    expect(canPlaySpatialSbs(sbsVideoItem)).toBe(true);
    expect(
      canPlaySpatialSbs({
        ...sbsVideoItem,
        stereoLayout: "mono",
      }),
    ).toBe(false);
    expect(
      canPlaySpatialSbs({
        ...sbsVideoItem,
        kind: "audio",
      }),
    ).toBe(false);
  });
});
