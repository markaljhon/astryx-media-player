import { describe, expect, test } from "bun:test";
import { createMediaLibraryPlayerSelection } from "../src/features/media/api/mediaLibraryPlayerSelection.ts";

const sbsVideoItem = {
  id: "scene-1",
  title: "Scene 1",
  kind: "video",
  providerId: "stash",
  sourceUrl: "https://cdn.example.test/source.mp4",
  stereoLayout: "side-by-side",
};

describe("createMediaLibraryPlayerSelection", () => {
  test("normal play video selection forces an SBS item to mono playback", () => {
    expect(createMediaLibraryPlayerSelection(sbsVideoItem)).toEqual({
      item: {
        ...sbsVideoItem,
        stereoLayout: "mono",
      },
      playbackMode: "default",
    });
  });

  test("SBS selection preserves side-by-side playback", () => {
    expect(
      createMediaLibraryPlayerSelection(sbsVideoItem, "side-by-side"),
    ).toEqual({
      item: sbsVideoItem,
      playbackMode: "side-by-side",
    });
  });
});
