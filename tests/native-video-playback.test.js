import { describe, expect, test } from "bun:test";
import {
  getNativeVideoPlaybackUrl,
  launchNativeVideoFullscreen,
} from "../src/features/players/api/nativeVideoPlayback.ts";

const baseVideoItem = {
  id: "scene-1",
  title: "Scene 1",
  kind: "video",
  providerId: "local",
  sourceUrl: "https://cdn.example.test/fallback.mp4",
};

describe("getNativeVideoPlaybackUrl", () => {
  test("prefers a browser-native playback source over hls", () => {
    expect(
      getNativeVideoPlaybackUrl({
        ...baseVideoItem,
        playbackSources: [
          {
            id: "hls",
            label: "HLS",
            url: "https://cdn.example.test/stream.m3u8",
            kind: "hls",
          },
          {
            id: "mp4",
            label: "MP4",
            url: "https://cdn.example.test/source.mp4",
            kind: "mp4",
          },
        ],
      }),
    ).toBe("https://cdn.example.test/source.mp4");
  });

  test("falls back to the source url when no playback source exists", () => {
    expect(getNativeVideoPlaybackUrl(baseVideoItem)).toBe(
      "https://cdn.example.test/fallback.mp4",
    );
  });
});

describe("launchNativeVideoFullscreen", () => {
  test("opens a native video element fullscreen and removes it after playback", async () => {
    const events = new Map();
    const calls = [];
    const video = {
      controls: false,
      playsInline: true,
      preload: "",
      src: "",
      style: {},
      addEventListener: (name, listener) => {
        events.set(name, listener);
      },
      remove: () => {
        calls.push("remove");
      },
      removeEventListener: () => {},
      pause: () => {},
      requestFullscreen: async () => {
        calls.push("fullscreen");
      },
      play: async () => {
        calls.push("play");
      },
    };
    const doc = {
      body: {
        appendChild: (element) => {
          calls.push(element === video ? "append" : "append-other");
        },
      },
      createElement: () => video,
      addEventListener: (name, listener) => {
        events.set(name, listener);
      },
      removeEventListener: () => {},
    };

    await launchNativeVideoFullscreen("https://cdn.example.test/source.mp4", doc);
    events.get("ended")();

    expect(video.src).toBe("https://cdn.example.test/source.mp4");
    expect(video.controls).toBe(true);
    expect(video.playsInline).toBe(false);
    expect(video.preload).toBe("auto");
    expect(calls).toEqual(["append", "fullscreen", "play", "remove"]);
  });

  test("starts playback on ios-style video fullscreen instead of entering fullscreen first", async () => {
    const events = new Map();
    const calls = [];
    const video = {
      controls: false,
      playsInline: true,
      preload: "",
      src: "",
      style: {},
      webkitSupportsFullscreen: false,
      addEventListener: (name, listener) => {
        events.set(name, listener);
      },
      remove: () => {
        calls.push("remove");
      },
      removeEventListener: () => {},
      pause: () => {},
      webkitEnterFullscreen: () => {
        calls.push("webkit-fullscreen");
        throw new Error("metadata not loaded");
      },
      play: async () => {
        calls.push("play");
      },
    };
    const doc = {
      body: {
        appendChild: () => {
          calls.push("append");
        },
      },
      createElement: () => video,
      addEventListener: (name, listener) => {
        events.set(name, listener);
      },
      removeEventListener: () => {},
    };

    await launchNativeVideoFullscreen("https://cdn.example.test/source.mp4", doc);
    events.get("webkitendfullscreen")();

    expect(calls).toEqual(["append", "play", "remove"]);
  });

  test("removes the native video element when playback launch fails", async () => {
    const calls = [];
    const video = {
      controls: false,
      playsInline: true,
      preload: "",
      src: "",
      style: {},
      addEventListener: () => {},
      remove: () => {
        calls.push("remove");
      },
      removeEventListener: () => {},
      pause: () => {},
      requestFullscreen: async () => {
        calls.push("fullscreen");
        throw new Error("fullscreen blocked");
      },
      play: async () => {
        calls.push("play");
      },
    };
    const doc = {
      body: {
        appendChild: () => {
          calls.push("append");
        },
      },
      createElement: () => video,
      addEventListener: () => {},
      removeEventListener: () => {},
    };

    await expect(
      launchNativeVideoFullscreen("https://cdn.example.test/source.mp4", doc),
    ).rejects.toThrow("fullscreen blocked");

    expect(calls).toEqual(["append", "fullscreen", "remove"]);
  });
});
