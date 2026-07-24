import { Lightbox } from "@astryxdesign/core/Lightbox";
import type { VideoPlayerProps } from "../api/videoPlayerAdapters";

export function FlatLightboxVideoPlayer({
  item,
  isOpen,
  onOpenChange,
}: VideoPlayerProps) {
  if (!item.sourceUrl) {
    return null;
  }

  return (
    <Lightbox
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      media={{
        src: item.sourceUrl,
        alt: item.title,
        caption: item.description ?? item.title,
        type: "video",
      }}
    />
  );
}
