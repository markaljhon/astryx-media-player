export type MediaKind = "video" | "audio" | "playlist";

export type MediaProviderId = string;

export type VideoProjection = "flat" | "vr180" | "vr360";

export type StereoVideoLayout = "mono" | "side-by-side" | "top-bottom";

export type MediaPlaybackSourceKind =
  | "direct"
  | "mp4"
  | "hls"
  | "webm";

export type MediaPlaybackSource = {
  id: string;
  label: string;
  url: string;
  kind: MediaPlaybackSourceKind;
  mimeType?: string;
};

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
  playbackSources?: MediaPlaybackSource[];
  videoProjection?: VideoProjection;
  stereoLayout?: StereoVideoLayout;
  durationMs?: number;
  tags?: string[];
};

export type MediaPage<TItem = MediaItem> = {
  items: TItem[];
  page: number;
  pageSize: number;
  totalItems: number;
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
