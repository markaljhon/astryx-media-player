import {
  defaultMediaProviderId,
  getMediaProvider,
  registerMediaProvider,
} from "./mediaProviders";
import { localMediaProvider } from "./adapters/localMediaProvider";
import { stashMediaProvider } from "./adapters/stashMediaProvider";
import type {
  FetchAllMediaTagsOptions,
  FetchMediaListOptions,
  FetchMediaTagsOptions,
  MediaItem,
  MediaTag,
} from "./mediaTypes";
import type {
  FetchPaginatedMediaListOptions,
  MediaListResult,
} from "./mediaTypes";

registerMediaProvider(localMediaProvider);
registerMediaProvider(stashMediaProvider);

export type {
  FetchMediaListOptions,
  FetchMediaTagsOptions,
  FetchAllMediaTagsOptions,
  FetchPaginatedMediaListOptions,
  MediaItem,
  MediaListResult,
  MediaTag,
} from "./mediaTypes";
export {
  defaultMediaProviderId,
  getMediaProvider,
  listMediaProviders,
  registerMediaProvider,
} from "./mediaProviders";
export type { MediaProviderAdapter } from "./mediaTypes";

export function normalizeMediaListRequest(options: FetchMediaListOptions = {}) {
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const requestedPageSize = options.pageSize ?? options.limit;
  const pageSize =
    typeof requestedPageSize === "number" && Number.isFinite(requestedPageSize)
      ? Math.max(1, Math.floor(requestedPageSize))
      : undefined;

  return {
    query: options.query,
    tags: options.tags,
    limit: options.limit,
    page,
    pageSize,
  };
}

export async function fetchMediaList(
  options: FetchPaginatedMediaListOptions,
): Promise<MediaListResult>;
export async function fetchMediaList(
  options?: FetchMediaListOptions,
): Promise<MediaItem[]>;
export async function fetchMediaList(
  options: FetchMediaListOptions | FetchPaginatedMediaListOptions = {},
): Promise<MediaItem[] | MediaListResult> {
  const providerId = options.providerId ?? defaultMediaProviderId;
  const adapter = getMediaProvider(providerId);

  if (!adapter) {
    throw new Error(`No media provider adapter registered for "${providerId}".`);
  }

  const result = await adapter.listMedia(normalizeMediaListRequest(options));
  console.log("fetchMediaList result:", result);

  return "paginated" in options && options.paginated ? result : result.items;
}

export async function searchMedia(query: string): Promise<MediaItem[]> {
  return fetchMediaList({ query });
}

function getMediaProviderAdapter(providerId: string) {
  const adapter = getMediaProvider(providerId);

  if (!adapter) {
    throw new Error(`No media provider adapter registered for "${providerId}".`);
  }

  return adapter;
}

export async function fetchMediaTags(
  options: FetchMediaTagsOptions = {},
): Promise<MediaTag[]> {
  const providerId = options.providerId ?? defaultMediaProviderId;
  const adapter = getMediaProviderAdapter(providerId);

  if (!adapter.searchTags) {
    return [];
  }

  return adapter.searchTags({
    query: options.query,
    limit: options.limit,
  });
}

export async function fetchAllMediaTags(
  options: FetchAllMediaTagsOptions = {},
): Promise<MediaTag[]> {
  const providerId = options.providerId ?? defaultMediaProviderId;
  const adapter = getMediaProviderAdapter(providerId);

  if (adapter.listTags) {
    return adapter.listTags();
  }

  return adapter.searchTags?.({}) ?? [];
}
