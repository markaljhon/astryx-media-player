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

export type MediaListRequest = {
  query?: string;
  tags?: MediaTagFilter[];
  limit?: number;
  page?: number;
  pageSize?: number;
};

export type MediaTagSearchRequest = {
  query?: string;
  limit?: number;
};

export type FetchMediaListOptions = MediaListRequest & {
  providerId?: MediaProviderId;
};

export type FetchPaginatedMediaListOptions = FetchMediaListOptions & {
  paginated: true;
};

export type MediaListResult = {
  items: MediaItem[];
  page: number;
  pageSize: number;
  totalItems: number;
};

export interface MediaProviderAdapter {
  id: MediaProviderId;
  listMedia(request: MediaListRequest): Promise<MediaListResult>;
  searchTags?(request: MediaTagSearchRequest): Promise<MediaTag[]>;
}
