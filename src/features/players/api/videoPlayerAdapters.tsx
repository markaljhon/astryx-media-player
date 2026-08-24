import type { ComponentType } from "react";
import type { MediaItem } from "@/types/media";
import {
  getSpatialPlayerStereoLayout,
  type SpatialPlaybackMode,
} from "./spatialPlaybackMode";
import { DefaultVideoPlayer } from "../DefaultVideoPlayer";
import { SpatialMonoVideoPlayer } from "../SpatialMonoVideoPlayer";
import { VideoPlayerDialog } from "../components/VideoPlayerDialog";

export type VideoPlayerProps = {
  item: MediaItem;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  playbackMode?: SpatialPlaybackMode;
};

type VideoPlayerAdapter = {
  id: string;
  canPlay: (item: MediaItem) => boolean;
  Component: ComponentType<VideoPlayerProps>;
};

export const hasSpatialVideoCue = (item: MediaItem) => {
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
};

const spatialMonoVideoPlayerAdapter = ({
  item,
  isOpen,
  onOpenChange,
  playbackMode = "default",
}: VideoPlayerProps) => {
  const sourceUrl = item.sourceUrl ?? item.playbackSources?.[0]?.url;
  const mediaPreferenceKey = getMediaPreferenceKey(item);

  if (!sourceUrl) {
    return null;
  }

  return (
    <VideoPlayerDialog
      closeLabel="Close spatial video"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      {isOpen ?
        <SpatialMonoVideoPlayer
          src={sourceUrl}
          mediaPreferenceKey={mediaPreferenceKey}
          previewSrc={item.thumbnailUrl}
          playbackSources={item.playbackSources}
          stereoLayout={getSpatialPlayerStereoLayout(item, playbackMode)}
        />
      : null}
    </VideoPlayerDialog>
  );
};

const defaultVideoPlayerAdapter = ({
  item,
  isOpen,
  onOpenChange,
}: VideoPlayerProps) => {
  const sourceUrl = item.sourceUrl ?? item.playbackSources?.[0]?.url;
  const mediaPreferenceKey = getMediaPreferenceKey(item);

  if (!sourceUrl) {
    return null;
  }

  return (
    <VideoPlayerDialog
      closeLabel="Close video"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      {isOpen ?
        <DefaultVideoPlayer
          src={sourceUrl}
          mediaPreferenceKey={mediaPreferenceKey}
          previewSrc={item.thumbnailUrl}
          playbackSources={item.playbackSources}
        />
      : null}
    </VideoPlayerDialog>
  );
};

export const videoPlayerAdapters: VideoPlayerAdapter[] = [
  {
    id: "spatial-mono-r3f",
    canPlay: (item) =>
      (Boolean(item.sourceUrl) || Boolean(item.playbackSources?.length)) &&
      hasSpatialVideoCue(item),
    Component: spatialMonoVideoPlayerAdapter,
  },
  {
    id: "flat-default",
    canPlay: (item) =>
      item.kind === "video" &&
      (Boolean(item.sourceUrl) || Boolean(item.playbackSources?.length)),
    Component: defaultVideoPlayerAdapter,
  },
];

export const getVideoPlayerAdapter = (item: MediaItem) => {
  return videoPlayerAdapters.find((adapter) => adapter.canPlay(item));
};

const getMediaPreferenceKey = (item: MediaItem) => {
  return `${item.providerId}:${item.id}`;
};
