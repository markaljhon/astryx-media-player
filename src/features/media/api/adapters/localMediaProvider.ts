import type {
  MediaItem,
  MediaListRequest,
  MediaProviderAdapter,
  MediaTag,
} from "../mediaTypes";

const localMediaCatalog: MediaItem[] = [
  {
    id: "local-aurora-trailer",
    title: "Aurora Trailer",
    kind: "video",
    providerId: "local",
    description: "Intro clip for the featured release.",
    durationMs: 92_000,
    previewVideoUrl: "https://cdn.aframe.io/360-video-boilerplate/video/city.mp4",
    sourceUrl: "https://cdn.aframe.io/360-video-boilerplate/video/city.mp4",
    tags: ["VR"],
  },
];

function matchesQuery(item: MediaItem, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return true;
  }

  return [
    item.title,
    item.kind,
    item.description,
    item.tags?.join(" "),
  ]
    .filter((value): value is string => typeof value === "string")
    .some((value) => value.toLowerCase().includes(normalizedQuery));
}

function matchesTags(item: MediaItem, request: MediaListRequest) {
  if (!request.tags?.length) {
    return true;
  }

  const itemTags = new Set(
    item.tags?.map((tag) => tag.trim().toLowerCase()).filter(Boolean) ?? [],
  );

  return request.tags.every((tag) => itemTags.has(tag.name.toLowerCase()));
}

function listLocalTags(query?: string, limit?: number): MediaTag[] {
  const normalizedQuery = query?.trim().toLowerCase() ?? "";
  const uniqueTags = Array.from(
    new Set(localMediaCatalog.flatMap((item) => item.tags ?? [])),
  )
    .sort((firstTag, secondTag) => firstTag.localeCompare(secondTag))
    .filter((tag) => tag.toLowerCase().includes(normalizedQuery));

  return uniqueTags.slice(0, limit).map((tag) => ({
    id: `local-tag:${tag.toLowerCase()}`,
    label: tag,
    name: tag,
  }));
}

export const localMediaProvider: MediaProviderAdapter = {
  id: "local",
  async listMedia(request: MediaListRequest) {
    const page = Math.max(1, Math.floor(request.page ?? 1));
    const pageSize = Math.max(
      1,
      Math.floor(request.pageSize ?? request.limit ?? localMediaCatalog.length),
    );
    const filteredItems = localMediaCatalog.filter(
      (item) =>
        matchesQuery(item, request.query ?? "") && matchesTags(item, request),
    );
    const startIndex = (page - 1) * pageSize;

    return {
      items: filteredItems.slice(startIndex, startIndex + pageSize),
      page,
      pageSize,
      totalItems: filteredItems.length,
    };
  },
  async searchTags(request) {
    return listLocalTags(request.query, request.limit);
  },
};
