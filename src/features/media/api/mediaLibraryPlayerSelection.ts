import type { MediaItem } from "@/types/media";
import {
  getSpatialPlayerStereoLayout,
  type SpatialPlaybackMode,
} from "../../players/api/spatialPlaybackMode";

export type MediaLibraryPlayerSelection = {
  item: MediaItem;
  playbackMode: SpatialPlaybackMode;
};

export const createMediaLibraryPlayerSelection = (
  item: MediaItem,
  playbackMode: SpatialPlaybackMode = "default",
): MediaLibraryPlayerSelection => {
  return {
    item: {
      ...item,
      stereoLayout: getSpatialPlayerStereoLayout(item, playbackMode),
    },
    playbackMode,
  };
};
