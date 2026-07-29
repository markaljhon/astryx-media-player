export type MediaKind = "video" | "audio" | "playlist";

export type MediaProviderId = string;

export type VideoProjection = "flat" | "vr180" | "vr360";

export type StereoVideoLayout = "mono" | "side-by-side" | "top-bottom";

export type MediaItem = {
  id: string;
  title: string;
  kind: MediaKind;
  providerId: MediaProviderId;
  description?: string;
  thumbnailUrl?: string;
  previewAudioUrl?: string;
  previewVideoUrl?: string;
  sourceUrl?: string;
  videoProjection?: VideoProjection;
  stereoLayout?: StereoVideoLayout;
  durationMs?: number;
  tags?: string[];
};

export type MediaTag = {
  id: string;
  label: string;
  name: string;
};

export type MediaTagFilter = {
  id?: string;
  name: string;
};
