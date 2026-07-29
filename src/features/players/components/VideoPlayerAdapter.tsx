import type { MediaItem } from "@/types/media";
import { getVideoPlayerAdapter } from "../api/videoPlayerAdapters";

type VideoPlayerAdapterProps = {
  item: MediaItem | null;
  onOpenChange: (isOpen: boolean) => void;
};

export const VideoPlayerAdapter = ({
  item,
  onOpenChange,
}: VideoPlayerAdapterProps) => {
  if (!item) {
    return null;
  }

  const adapter = getVideoPlayerAdapter(item);

  if (!adapter) {
    return null;
  }

  const Player = adapter.Component;

  return <Player item={item} isOpen onOpenChange={onOpenChange} />;
};
