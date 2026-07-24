import type { MediaItem } from "../../media/api/mediaTypes";
import { getVideoPlayerAdapter } from "../api/videoPlayerAdapters";

type VideoPlayerAdapterProps = {
  item: MediaItem | null;
  onOpenChange: (isOpen: boolean) => void;
};

export function VideoPlayerAdapter({
  item,
  onOpenChange,
}: VideoPlayerAdapterProps) {
  if (!item) {
    return null;
  }

  const adapter = getVideoPlayerAdapter(item);

  if (!adapter) {
    return null;
  }

  const Player = adapter.Component;

  return <Player item={item} isOpen onOpenChange={onOpenChange} />;
}
