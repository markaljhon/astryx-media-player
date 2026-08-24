import type { MediaItem } from "@/types/media";
import type { SpatialPlaybackMode } from "../api/spatialPlaybackMode";
import { getVideoPlayerAdapter } from "../api/videoPlayerAdapters";

type VideoPlayerAdapterProps = {
  item: MediaItem | null;
  onOpenChange: (isOpen: boolean) => void;
  playbackMode?: SpatialPlaybackMode;
};

export const VideoPlayerAdapter = ({
  item,
  onOpenChange,
  playbackMode,
}: VideoPlayerAdapterProps) => {
  if (!item) {
    return null;
  }

  const adapter = getVideoPlayerAdapter(item);

  if (!adapter) {
    return null;
  }

  const Player = adapter.Component;

  return (
    <Player
      item={item}
      isOpen
      playbackMode={playbackMode}
      onOpenChange={onOpenChange}
    />
  );
};
