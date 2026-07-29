import type {
  MediaListRequest,
  MediaProviderAdapter,
  MediaTagSearchRequest,
} from "@/types/api";
import type {
  MediaItem,
  MediaTag,
  MediaTagFilter,
  StereoVideoLayout,
  VideoProjection,
} from "@/types/media";

const defaultPageSize = 10;
const tagCatalogPageSize = 500;
const defaultEndpoint = "/stash/graphql";
const stashProxyPrefix = "/stash";

const missingTagId = "-1";
const tagIdByNormalizedName = new Map<string, string>();

const findScenesQuery = `
  query FindScenes($filter: FindFilterType!, $sceneFilter: SceneFilterType) {
    findScenes(
      filter: $filter
      scene_filter: $sceneFilter
    ) {
      count
      scenes {
        title
        paths {
          stream
          preview
          screenshot
          sprite
        }
        files {
          basename
          bit_rate
          duration
          format
          frame_rate
          height
          size
          width
          video_codec
          created_at
        }
        details
        id
        tags {
          name
          id
        }
      }
    }
  }
`;

const findTagsQuery = `
  query FindTags($filter: FindFilterType!, $tagFilter: TagFilterType) {
    findTags(filter: $filter, tag_filter: $tagFilter) {
      count
      tags {
        id
        name
      }
    }
  }
`;

type StashScene = {
  id: string;
  title: string | null;
  details: string | null;
  paths: {
    stream: string | null;
    preview: string | null;
    screenshot: string | null;
  };
  files: Array<{
    basename: string | null;
    duration: number | null;
    format: string | null;
    height: number | null;
    width: number | null;
  }>;
  tags: Array<{ name: string | null; id: string | null }>;
};

type GraphQlResponse<TData> = {
  data?: TData;
  errors?: Array<{ message?: string }>;
};

type StashTag = {
  id: string;
  name: string | null;
};

type StashFindTagsData = {
  findTags?: {
    count?: number;
    tags?: StashTag[];
  };
};

type StashFindScenesData = {
  findScenes?: {
    count?: number;
    scenes?: StashScene[];
  };
};

function getEndpoint() {
  const configuredEndpoint = import.meta.env.VITE_STASH_GRAPHQL_ENDPOINT?.trim();

  return configuredEndpoint?.startsWith("/") ? configuredEndpoint : defaultEndpoint;
}

function toDurationMs(durationSeconds: number | null | undefined) {
  return typeof durationSeconds === "number" && Number.isFinite(durationSeconds)
    ? Math.round(durationSeconds * 1_000)
    : undefined;
}

function resolveStashUrl(path: string | null, endpoint: string) {
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
}

function inferStereoLayout(scene: StashScene): StereoVideoLayout {
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
}

function getSceneSearchableText(scene: StashScene) {
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
}

function inferVideoProjection(scene: StashScene): VideoProjection {
  const searchableText = getSceneSearchableText(scene);

  if (/\b(vr360|360)\b/.test(searchableText)) {
    return "vr360";
  }

  if (/\b(3d|vr|vr180|180|sbs|side[-_ ]?by[-_ ]?side|top[-_ ]?bottom|over[-_ ]?under|ou)\b/.test(searchableText)) {
    return "vr180";
  }

  return "flat";
}

function mapScene(scene: StashScene, endpoint: string): MediaItem {
  const primaryFile = scene.files[0];

  return {
    id: scene.id,
    title: scene.title?.trim() || primaryFile?.basename?.trim() || "Untitled video",
    // Stash returns a file format such as "mp4"; these scenes are always videos.
    kind: "video",
    providerId: "stash",
    description: scene.details ?? undefined,
    thumbnailUrl: resolveStashUrl(scene.paths.screenshot, endpoint),
    previewVideoUrl: resolveStashUrl(scene.paths.preview, endpoint),
    sourceUrl: resolveStashUrl(scene.paths.stream, endpoint),
    videoProjection: inferVideoProjection(scene),
    stereoLayout: inferStereoLayout(scene),
    durationMs: toDurationMs(primaryFile?.duration),
    tags: scene.tags.flatMap((tag) => (tag.name ? [tag.name] : [])),
  };
}

async function executeStashGraphQl<TData>(
  query: string,
  variables: Record<string, unknown>,
) {
  const endpoint = getEndpoint();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`The Stash media provider returned HTTP ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (
    !contentType.includes("application/graphql-response+json") &&
    !contentType.includes("application/json") &&
    !contentType.includes("application/graphql+json")
  ) {
    throw new Error(
      "The Stash endpoint returned HTML instead of GraphQL JSON. " +
        "Use /stash/graphql with STASH_SERVER_URL configured in Vite.",
    );
  }

  const payload = (await response.json()) as GraphQlResponse<TData>;
  if (payload.errors?.length) {
    throw new Error(
      payload.errors
        .map((error) => error.message)
        .filter((message): message is string => Boolean(message))
        .join(" ") || "The Stash media provider returned a GraphQL error.",
    );
  }

  return { endpoint, data: payload.data };
}

function mapTag(tag: StashTag): MediaTag | null {
  const name = tag.name?.trim();

  if (!name) {
    return null;
  }

  return {
    id: tag.id,
    label: name,
    name,
  };
}

function normalizeTagName(name: string) {
  return name.trim().toLowerCase();
}

async function fetchTags(
  request: MediaTagSearchRequest,
  tagFilter?: Record<string, unknown>,
) {
  const limit = Math.max(1, Math.floor(request.limit ?? 10));
  const query = request.query?.trim();
  const { data } = await executeStashGraphQl<StashFindTagsData>(findTagsQuery, {
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
}

async function fetchAllTags() {
  const tags: MediaTag[] = [];
  let page = 1;
  let receivedTags = 0;

  while (true) {
    const { data } = await executeStashGraphQl<StashFindTagsData>(
      findTagsQuery,
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
}

async function resolveTagIds(tags: MediaTagFilter[]) {
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
}

async function createSceneFilter(tags: MediaTagFilter[] | undefined) {
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
}

async function fetchScenes(
  page: number,
  pageSize: number,
  query?: string,
  tags?: MediaTagFilter[],
) {
  const sceneFilter = await createSceneFilter(tags);
  const { endpoint, data } = await executeStashGraphQl<StashFindScenesData>(
    findScenesQuery,
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
}

export const stashMediaProvider: MediaProviderAdapter = {
  id: "stash",
  async listMedia(request: MediaListRequest) {
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
  async searchTags(request: MediaTagSearchRequest) {
    return fetchTags(request);
  },
  async listTags() {
    return fetchAllTags();
  },
};
