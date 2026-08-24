import type { SpatialPlaybackMode } from "./spatialPlaybackMode";

export const validateMediaPlayerPlaybackMode = (
  search: Record<string, unknown>,
): SpatialPlaybackMode => {
  return search.playbackMode === "side-by-side" ? "side-by-side" : "default";
};
