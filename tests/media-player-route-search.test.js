import { describe, expect, test } from "bun:test";
import { validateMediaPlayerPlaybackMode } from "../src/features/players/api/mediaPlayerRouteSearch.ts";

describe("validateMediaPlayerPlaybackMode", () => {
  test("defaults routed playback to single-eye mode", () => {
    expect(validateMediaPlayerPlaybackMode({})).toBe("default");
  });

  test("accepts side-by-side routed playback mode", () => {
    expect(
      validateMediaPlayerPlaybackMode({ playbackMode: "side-by-side" }),
    ).toBe("side-by-side");
  });

  test("rejects unknown routed playback modes", () => {
    expect(validateMediaPlayerPlaybackMode({ playbackMode: "sbs" })).toBe(
      "default",
    );
  });
});
