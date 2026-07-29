import type { ComponentType, CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  Dialog,
  Icon,
  IconButton,
  StackItem,
  VStack,
} from "@astryxdesign/core";
import type { MediaItem } from "@/types/media";
import { FlatLightboxVideoPlayer } from "../components/FlatLightboxVideoPlayer";
import { SpatialMonoVideoPlayer } from "../SpatialMonoVideoPlayer";

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

const spatialDialogSurfaceStyle: CSSProperties = {
  backgroundColor: "var(--color-on-light)",
  height: "100dvh",
  minHeight: 0,
  overflow: "hidden",
  position: "relative",
  width: "100dvw",
};

const spatialDialogCloseButtonStyle: CSSProperties = {
  position: "absolute",
  right: "calc(env(safe-area-inset-right) + var(--spacing-2))",
  top: "calc(env(safe-area-inset-top) + var(--spacing-2))",
  zIndex: 2,
};

const spatialDialogPlayerStyle: CSSProperties = {
  height: "100dvh",
  minHeight: 0,
  minWidth: 0,
  width: "100dvw",
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

function SpatialMonoVideoPlayerAdapter({
  item,
  isOpen,
  onOpenChange,
}: VideoPlayerProps) {
  if (!item.sourceUrl || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      variant="fullscreen"
      purpose="info"
      padding={0}
    >
      <VStack
        height="100%"
        gap={0}
        padding={0}
        style={spatialDialogSurfaceStyle}
      >
        <IconButton
          label="Close spatial video"
          icon={<Icon icon="close" color="inherit" />}
          variant="secondary"
          style={spatialDialogCloseButtonStyle}
          onClick={() => onOpenChange(false)}
        />
        <StackItem
          size="fill"
          crossAlignSelf="stretch"
          style={spatialDialogPlayerStyle}
        >
          {isOpen ?
            <SpatialMonoVideoPlayer
              src={item.sourceUrl}
              previewSrc={item.thumbnailUrl}
            />
          : null}
        </StackItem>
      </VStack>
    </Dialog>,
    document.body,
  );
}

export const videoPlayerAdapters: VideoPlayerAdapter[] = [
  {
    id: "spatial-mono-r3f",
    canPlay: (item) => Boolean(item.sourceUrl) && hasSpatialVideoCue(item),
    Component: SpatialMonoVideoPlayerAdapter,
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
