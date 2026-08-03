import type {
  MediaItem,
  MediaPage,
  MediaProviderId,
  MediaTag,
  MediaTagFilter,
} from "./media";

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

export type FetchMediaTagsOptions = MediaTagSearchRequest & {
  providerId?: MediaProviderId;
};

export type FetchAllMediaTagsOptions = {
  providerId?: MediaProviderId;
};

export type FetchMediaListOptions = MediaListRequest & {
  providerId?: MediaProviderId;
};

export type FetchPaginatedMediaListOptions = FetchMediaListOptions & {
  paginated: true;
};

export type MediaListResult = MediaPage<MediaItem>;

export interface MediaProviderAdapter {
  id: MediaProviderId;
  listMedia: (request: MediaListRequest) => Promise<MediaListResult>;
  listTags?: () => Promise<MediaTag[]>;
  searchTags?: (request: MediaTagSearchRequest) => Promise<MediaTag[]>;
}
