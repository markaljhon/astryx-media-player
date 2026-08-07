import type {
  MediaListRequest,
  MediaProviderAdapter,
  MediaTagSearchRequest,
} from "@/types/api";
import type {
  MediaItem,
  MediaPlaybackSource,
  MediaPlaybackSourceKind,
  MediaTag,
  MediaTagFilter,
  StereoVideoLayout,
  VideoProjection,
} from "@/types/media";
import {
  requestStashGraphQl,
  type StashGraphQlOperation,
} from "./stash/graphqlClient";
import {
  findMediaSceneOperation,
  findMediaScenesOperation,
  findTagsOperation,
  sceneStreamsOperation,
  type StashMediaScene,
  type StashSceneStream,
  type StashTag,
} from "./stash/operations";

const defaultPageSize = 10;
const tagCatalogPageSize = 500;
const defaultEndpoint = "/stash/graphql";
const stashProxyPrefix = "/stash";

const missingTagId = "-1";
const tagIdByNormalizedName = new Map<string, string>();

const getEndpoint = () => {
  const configuredEndpoint = import.meta.env.VITE_STASH_GRAPHQL_ENDPOINT?.trim();

  return configuredEndpoint?.startsWith("/") ? configuredEndpoint : defaultEndpoint;
};

const toDurationMs = (durationSeconds: number | null | undefined) => {
  return typeof durationSeconds === "number" && Number.isFinite(durationSeconds)
    ? Math.round(durationSeconds * 1_000)
    : undefined;
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const resolveStashUrl = (path: string | null, endpoint: string) => {
  if (!path) {
    return undefined;
  }

  const endpointUrl = new URL(endpoint, window.location.origin);
  const resolvedUrl = new URL(path, endpointUrl);
  const proxyPath = `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`;

  if (
    endpointUrl.origin === window.location.origin &&
    endpointUrl.pathname.startsWith(`${stashProxyPrefix}/`)
  ) {
    const proxiedPath = proxyPath.startsWith(`${stashProxyPrefix}/`)
      ? proxyPath
      : `${stashProxyPrefix}${proxyPath}`;

    return new URL(proxiedPath, endpointUrl.origin).toString();
  }

  return resolvedUrl.toString();
};

const getUrlPathname = (url: string) => {
  try {
    return new URL(url, window.location.origin).pathname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
};

const inferPlaybackSourceKind = (
  url: string,
  mimeType?: string,
): MediaPlaybackSourceKind | null => {
  const normalizedMimeType = mimeType?.toLowerCase() ?? "";
  const pathname = getUrlPathname(url);

  if (
    normalizedMimeType.includes("mpegurl") ||
    normalizedMimeType.includes("x-mpegurl") ||
    pathname.endsWith(".m3u8")
  ) {
    return "hls";
  }

  if (normalizedMimeType.includes("mp4") || pathname.endsWith(".mp4")) {
    return "mp4";
  }

  if (normalizedMimeType.includes("webm") || pathname.endsWith(".webm")) {
    return "webm";
  }

  return null;
};

const getDefaultPlaybackSourceLabel = (
  kind: MediaPlaybackSourceKind,
  index: number,
) => {
  if (kind === "hls") return "HLS stream";
  if (kind === "mp4") return "MP4 stream";
  if (kind === "webm") return "WebM stream";
  if (kind === "direct") return "Direct stream";

  return `Stream ${index + 1}`;
};

const mapSceneStream = (
  stream: StashSceneStream,
  endpoint: string,
  index: number,
): MediaPlaybackSource | null => {
  const url = resolveStashUrl(stream.url, endpoint);

  if (!url) {
    return null;
  }

  const mimeType = stream.mime_type?.trim() || undefined;
  const kind = inferPlaybackSourceKind(url, mimeType);

  if (!kind) {
    return null;
  }

  return {
    id: `stash-stream:${index}:${url}`,
    label:
      stream.label?.trim() ||
      getDefaultPlaybackSourceLabel(kind, index),
    url,
    kind,
    mimeType,
  };
};

const createScenePlaybackSources = (
  defaultSourceUrl: string | undefined,
  sceneStreams: StashSceneStream[],
  endpoint: string,
) => {
  const sources: MediaPlaybackSource[] = [];
  const seenUrls = new Set<string>();

  if (defaultSourceUrl) {
    sources.push({
      id: "stash-stream:default",
      label: "Default stream",
      url: defaultSourceUrl,
      kind: "direct",
    });
    seenUrls.add(defaultSourceUrl);
  }

  sceneStreams.forEach((stream, index) => {
    const source = mapSceneStream(stream, endpoint, index);

    if (!source || seenUrls.has(source.url)) {
      return;
    }

    sources.push(source);
    seenUrls.add(source.url);
  });

  return sources;
};

const inferStereoLayout = (scene: StashMediaScene): StereoVideoLayout => {
  const primaryFile = scene.files[0];
  const searchableText = getSceneSearchableText(scene);

  if (/\b(tb|tab|top[-_ ]?bottom|over[-_ ]?under|ou)\b/.test(searchableText)) {
    return "top-bottom";
  }

  if (
    /\b(sbs|side[-_ ]?by[-_ ]?side|left[-_ ]?right|lr)\b/.test(searchableText)
  ) {
    return "side-by-side";
  }

  if (
    typeof primaryFile?.width === "number" &&
    typeof primaryFile.height === "number" &&
    primaryFile.width > primaryFile.height
  ) {
    return "side-by-side";
  }

  return "mono";
};

const getSceneSearchableText = (scene: StashMediaScene) => {
  const primaryFile = scene.files[0];

  return [
    scene.title,
    scene.details,
    primaryFile?.basename,
    scene.tags.map((tag) => tag.name).join(" "),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
};

const inferVideoProjection = (scene: StashMediaScene): VideoProjection => {
  const searchableText = getSceneSearchableText(scene);

  if (/\b(vr360|360)\b/.test(searchableText)) {
    return "vr360";
  }

  if (/\b(3d|vr|vr180|180|sbs|side[-_ ]?by[-_ ]?side|top[-_ ]?bottom|over[-_ ]?under|ou)\b/.test(searchableText)) {
    return "vr180";
  }

  return "flat";
};

const mapScene = (
  scene: StashMediaScene,
  endpoint: string,
  sceneStreams: StashSceneStream[] = [],
): MediaItem => {
  const primaryFile = scene.files[0];
  const defaultSourceUrl = resolveStashUrl(scene.paths.stream, endpoint);
  const playbackSources = createScenePlaybackSources(
    defaultSourceUrl,
    sceneStreams,
    endpoint,
  );

  return {
    id: scene.id,
    title: scene.title?.trim() || primaryFile?.basename?.trim() || "Untitled video",
    // Stash returns a file format such as "mp4"; these scenes are always videos.
    kind: "video",
    providerId: "stash",
    description: scene.details ?? undefined,
    thumbnailUrl: resolveStashUrl(scene.paths.screenshot, endpoint),
    previewVideoUrl: resolveStashUrl(scene.paths.preview, endpoint),
    sourceUrl: playbackSources[0]?.url ?? defaultSourceUrl,
    playbackSources: playbackSources.length > 0 ? playbackSources : undefined,
    videoProjection: inferVideoProjection(scene),
    stereoLayout: inferStereoLayout(scene),
    durationMs: toDurationMs(primaryFile?.duration),
    tags: scene.tags.flatMap((tag) => (tag.name ? [tag.name] : [])),
  };
};

const executeStashGraphQl = async <
  TData,
  TVariables extends Record<string, unknown>,
>(
  operation: StashGraphQlOperation<TData, TVariables>,
  variables: TVariables,
) => {
  return requestStashGraphQl(
    {
      endpoint: getEndpoint(),
      invalidContentTypeMessage:
        "The Stash endpoint returned HTML instead of GraphQL JSON. " +
        "Use /stash/graphql with STASH_SERVER_URL configured in Vite.",
    },
    operation,
    variables,
  );
};

const mapTag = (tag: StashTag): MediaTag | null => {
  const name = tag.name?.trim();

  if (!name) {
    return null;
  }

  return {
    id: tag.id,
    label: name,
    name,
  };
};

const normalizeTagName = (name: string) => {
  return name.trim().toLowerCase();
};

const fetchTags = async (
  request: MediaTagSearchRequest,
  tagFilter?: Record<string, unknown>,
) => {
  const limit = Math.max(1, Math.floor(request.limit ?? 10));
  const query = request.query?.trim();
  const { data } = await executeStashGraphQl(findTagsOperation, {
    filter: {
      per_page: limit,
      sort: "name",
      direction: "ASC",
      ...(query ? { q: query } : {}),
    },
    tagFilter: tagFilter ?? null,
  });

  return (data?.findTags?.tags ?? []).flatMap((tag) => {
    const mappedTag = mapTag(tag);

    if (mappedTag) {
      tagIdByNormalizedName.set(normalizeTagName(mappedTag.name), mappedTag.id);
      return [mappedTag];
    }

    return [];
  });
};

const fetchAllTags = async () => {
  const tags: MediaTag[] = [];
  let page = 1;
  let receivedTags = 0;

  while (true) {
    const { data } = await executeStashGraphQl(
      findTagsOperation,
      {
        filter: {
          page,
          per_page: tagCatalogPageSize,
          sort: "name",
          direction: "ASC",
        },
        tagFilter: null,
      },
    );
    const rawPageTags = data?.findTags?.tags ?? [];
    const pageTags = rawPageTags.flatMap((tag) => {
      const mappedTag = mapTag(tag);

      if (mappedTag) {
        tagIdByNormalizedName.set(
          normalizeTagName(mappedTag.name),
          mappedTag.id,
        );
        return [mappedTag];
      }

      return [];
    });

    tags.push(...pageTags);
    receivedTags += rawPageTags.length;

    if (rawPageTags.length === 0) {
      break;
    }

    const totalTags = data?.findTags?.count;
    if (
      totalTags !== undefined
        ? receivedTags >= totalTags
        : rawPageTags.length < tagCatalogPageSize
    ) {
      break;
    }

    page += 1;
  }

  return tags;
};

const resolveTagIds = async (tags: MediaTagFilter[]) => {
  const resolvedIds = new Set<string>();
  let hasUnresolvedTag = false;

  for (const tag of tags) {
    if (tag.id) {
      resolvedIds.add(tag.id);
      continue;
    }

    const normalizedName = normalizeTagName(tag.name);
    const cachedTagId = tagIdByNormalizedName.get(normalizedName);

    if (cachedTagId) {
      resolvedIds.add(cachedTagId);
      continue;
    }

    const [matchedTag] = await fetchTags(
      { query: tag.name, limit: 1 },
      { name: { value: tag.name, modifier: "EQUALS" } },
    );

    if (matchedTag) {
      resolvedIds.add(matchedTag.id);
    } else {
      hasUnresolvedTag = true;
    }
  }

  if (hasUnresolvedTag) {
    resolvedIds.add(missingTagId);
  }

  return Array.from(resolvedIds);
};

const createSceneFilter = async (tags: MediaTagFilter[] | undefined) => {
  if (!tags?.length) {
    return null;
  }

  const tagIds = await resolveTagIds(tags);

  return {
    tags: {
      value: tagIds,
      modifier: "INCLUDES_ALL",
    },
  };
};

const fetchScenes = async (
  page: number,
  pageSize: number,
  query?: string,
  tags?: MediaTagFilter[],
) => {
  const sceneFilter = await createSceneFilter(tags);
  const { endpoint, data } = await executeStashGraphQl(
    findMediaScenesOperation,
    {
      filter: {
        page,
        per_page: pageSize,
        sort: "created_at",
        direction: "DESC",
        ...(query?.trim() ? { q: query.trim() } : {}),
      },
      sceneFilter,
    },
  );

  return {
    endpoint,
    totalItems: data?.findScenes?.count ?? 0,
    scenes: data?.findScenes?.scenes ?? [],
  };
};

const fetchScene = async (sceneId: string) => {
  const { endpoint, data } = await executeStashGraphQl(findMediaSceneOperation, {
    id: sceneId,
  });
  const scene = data?.findScene;

  if (!scene) {
    return null;
  }

  const sceneStreams = await fetchSceneStreams(scene.id).catch(() => []);

  return mapScene(scene, endpoint, sceneStreams);
};

const fetchSceneStreams = async (sceneId: string) => {
  const { data } = await executeStashGraphQl(sceneStreamsOperation, {
    id: sceneId,
  });

  return (data?.sceneStreams ?? []).filter((stream) =>
    isNonEmptyString(stream.url),
  );
};

export const stashMediaProvider: MediaProviderAdapter = {
  id: "stash",
  listMedia: async (request: MediaListRequest) => {
    const page = Math.max(1, Math.floor(request.page ?? 1));
    const requestedPageSize = request.pageSize ?? request.limit ?? defaultPageSize;
    const pageSize = Math.max(1, Math.floor(requestedPageSize));
    const { endpoint, scenes, totalItems } = await fetchScenes(
      page,
      pageSize,
      request.query,
      request.tags,
    );
    const items = scenes.map((scene) => mapScene(scene, endpoint));

    return {
      items,
      page,
      pageSize,
      totalItems,
    };
  },
  getMediaItem: async (request) => {
    return fetchScene(request.id);
  },
  searchTags: async (request: MediaTagSearchRequest) => {
    return fetchTags(request);
  },
  listTags: async () => {
    return fetchAllTags();
  },
};
