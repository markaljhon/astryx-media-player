import type { MediaItem, StereoVideoLayout } from "@/types/media";

export type SpatialPlaybackMode = "default" | "side-by-side";

export const canPlaySpatialSbs = (item: MediaItem) => {
  return (
    item.kind === "video"
    && item.stereoLayout === "side-by-side"
    && (Boolean(item.sourceUrl) || Boolean(item.playbackSources?.length))
  );
};

export const getSpatialPlayerStereoLayout = (
  item: MediaItem,
  playbackMode: SpatialPlaybackMode,
): StereoVideoLayout => {
  if (playbackMode === "side-by-side" && canPlaySpatialSbs(item)) {
    return "side-by-side";
  }

  return "mono";
};
