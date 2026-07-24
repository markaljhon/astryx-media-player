import type { ComponentType } from "react";
import type { MediaItem } from "../../media/api/mediaTypes";
import { FlatLightboxVideoPlayer } from "../components/FlatLightboxVideoPlayer";
import { SpatialMonoVideoPlayer } from "../components/SpatialMonoVideoPlayer";

export type VideoPlayerProps = {
  item: MediaItem;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

type VideoPlayerAdapter = {
  id: string;
  canPlay: (item: MediaItem) => boolean;
  Component: ComponentType<VideoPlayerProps>;
};

function hasSpatialVideoCue(item: MediaItem) {
  if (item.kind !== "video") {
    return false;
  }

  if (item.videoProjection) {
    return item.videoProjection !== "flat";
  }

  const searchableText = [item.title, item.description, item.tags?.join(" ")]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

  return /\b(3d|vr|vr180|vr360|sbs|side[- ]?by[- ]?side|top[- ]?bottom|over[- ]?under)\b/.test(
    searchableText,
  );
}

export const videoPlayerAdapters: VideoPlayerAdapter[] = [
  {
    id: "spatial-mono-r3f",
    canPlay: (item) => Boolean(item.sourceUrl) && hasSpatialVideoCue(item),
    Component: SpatialMonoVideoPlayer,
  },
  {
    id: "flat-lightbox",
    canPlay: (item) => item.kind === "video" && Boolean(item.sourceUrl),
    Component: FlatLightboxVideoPlayer,
  },
];

export function getVideoPlayerAdapter(item: MediaItem) {
  return videoPlayerAdapters.find((adapter) => adapter.canPlay(item));
}
