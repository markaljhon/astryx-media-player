import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type GraphQlResponse<TData> = {
  data?: TData;
  errors?: Array<{ message?: string }>;
};

type StashTag = {
  id: string;
  name: string | null;
};

type StashScene = {
  id: string;
  title: string | null;
  files: Array<{
    path?: string | null;
    basename?: string | null;
  }> | null;
  tags: Array<{
    id: string | null;
    name: string | null;
  }> | null;
};

type FindTagsData = {
  findTags?: {
    tags?: StashTag[];
  };
};

type CreateTagData = {
  tagCreate?: StashTag | null;
};

type FindScenesData = {
  findScenes?: {
    count?: number;
    scenes?: StashScene[];
  };
};

type UpdateSceneData = {
  sceneUpdate?: {
    id: string;
  } | null;
};

type Options = {
  apply: boolean;
  tagName: string;
  pageSize: number;
  limit?: number;
};

const findTagsQuery = `
  query FindTags($filter: FindFilterType!, $tagFilter: TagFilterType) {
    findTags(filter: $filter, tag_filter: $tagFilter) {
      tags {
        id
        name
      }
    }
  }
`;

const createTagMutation = `
  mutation CreateTag($input: TagCreateInput!) {
    tagCreate(input: $input) {
      id
      name
    }
  }
`;

const findScenesQuery = `
  query FindScenes($filter: FindFilterType!) {
    findScenes(filter: $filter) {
      count
      scenes {
        id
        title
        files {
          path
          basename
        }
        tags {
          id
          name
        }
      }
    }
  }
`;

const updateSceneMutation = `
  mutation UpdateScene($input: SceneUpdateInput!) {
    sceneUpdate(input: $input) {
      id
    }
  }
`;

const loadEnvFile = (path: string) => {
  if (!existsSync(path)) {
    return;
  }

  const content = readFileSync(path, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex < 1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^(['"])(.*)\1$/, "$2");

    process.env[key] ??= value;
  }
};

const loadLocalEnv = () => {
  loadEnvFile(resolve(process.cwd(), ".env"));
  loadEnvFile(resolve(process.cwd(), ".env.local"));
};

const parsePositiveInteger = (value: string, optionName: string) => {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw new Error(`${optionName} must be a positive integer.`);
  }

  return parsedValue;
};

const parseArgs = (argv: string[]): Options => {
  const options: Options = {
    apply: false,
    tagName: "VR",
    pageSize: 250,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--apply") {
      options.apply = true;
      continue;
    }

    if (arg === "--dry-run") {
      options.apply = false;
      continue;
    }

    if (arg === "--tag") {
      const value = argv[index + 1]?.trim();
      if (!value) {
        throw new Error("--tag requires a tag name.");
      }
      options.tagName = value;
      index += 1;
      continue;
    }

    if (arg === "--page-size") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--page-size requires a value.");
      }
      options.pageSize = parsePositiveInteger(value, "--page-size");
      index += 1;
      continue;
    }

    if (arg === "--limit") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--limit requires a value.");
      }
      options.limit = parsePositiveInteger(value, "--limit");
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
};

const printHelp = () => {
  console.log(`
Usage: bun run stash:tag-vr [--apply] [--tag VR] [--page-size 250] [--limit 100]

Scans Stash scenes over GraphQL and adds a tag to scenes whose file path has a
distinct VR segment. The default mode is dry-run; pass --apply to update Stash.
`);
};

const getEndpoint = () => {
  const configuredEndpoint =
    process.env.STASH_GRAPHQL_ENDPOINT?.trim() ||
    process.env.VITE_STASH_GRAPHQL_ENDPOINT?.trim();

  if (configuredEndpoint?.startsWith("http://") || configuredEndpoint?.startsWith("https://")) {
    return configuredEndpoint;
  }

  const serverUrl = process.env.STASH_SERVER_URL?.trim();
  if (serverUrl) {
    const endpointPath = configuredEndpoint?.startsWith("/")
      ? configuredEndpoint
      : "/graphql";

    return new URL(endpointPath, serverUrl).toString();
  }

  throw new Error(
    "Set STASH_GRAPHQL_ENDPOINT, VITE_STASH_GRAPHQL_ENDPOINT, or STASH_SERVER_URL.",
  );
};

const getApiKey = () => {
  return process.env.STASH_API_KEY?.trim() || process.env.VITE_STASH_API_KEY?.trim();
};

const executeGraphQl = async <TData>(
  endpoint: string,
  query: string,
  variables: Record<string, unknown>,
) => {
  const apiKey = getApiKey();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { ApiKey: apiKey } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Stash returned HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as GraphQlResponse<TData>;
  if (payload.errors?.length) {
    const errorMessage = payload.errors
      .map((error) => error.message)
      .filter((message): message is string => Boolean(message))
      .join(" ");

    throw new Error(errorMessage || "Stash returned a GraphQL error.");
  }

  return payload.data;
};

const normalizeName = (value: string) => {
  return value.trim().toLowerCase();
};

const findTag = async (endpoint: string, tagName: string) => {
  const data = await executeGraphQl<FindTagsData>(endpoint, findTagsQuery, {
    filter: {
      per_page: 1,
      q: tagName,
    },
    tagFilter: {
      name: {
        value: tagName,
        modifier: "EQUALS",
      },
    },
  });

  return data?.findTags?.tags?.find(
    (tag) => tag.name && normalizeName(tag.name) === normalizeName(tagName),
  );
};

const ensureTag = async (endpoint: string, tagName: string, apply: boolean) => {
  const existingTag = await findTag(endpoint, tagName);
  if (existingTag) {
    return existingTag;
  }

  if (!apply) {
    return { id: "(new tag)", name: tagName };
  }

  const data = await executeGraphQl<CreateTagData>(endpoint, createTagMutation, {
    input: {
      name: tagName,
    },
  });

  if (!data?.tagCreate) {
    throw new Error(`Stash did not return a created ${tagName} tag.`);
  }

  return data.tagCreate;
};

const filePathHasVr = (value: string) => {
  return /(^|[\\/_\-.()[\]\s])vr($|[\\/_\-.()[\]\s])/i.test(value);
};

const getMatchingPaths = (scene: StashScene) => {
  return (scene.files ?? []).flatMap((file) => {
    const values = [file.path, file.basename].filter(
      (value): value is string => Boolean(value?.trim()),
    );

    return values.filter(filePathHasVr);
  });
};

const sceneHasTag = (scene: StashScene, tagId: string, tagName: string) => {
  return (scene.tags ?? []).some((tag) => {
    if (tag.id && tag.id === tagId) {
      return true;
    }

    return tag.name ? normalizeName(tag.name) === normalizeName(tagName) : false;
  });
};

const updateSceneTags = async (
  endpoint: string,
  scene: StashScene,
  tagId: string,
) => {
  const tagIds = new Set(
    (scene.tags ?? []).flatMap((tag) => (tag.id ? [tag.id] : [])),
  );
  tagIds.add(tagId);

  await executeGraphQl<UpdateSceneData>(endpoint, updateSceneMutation, {
    input: {
      id: scene.id,
      tag_ids: Array.from(tagIds),
    },
  });
};

const main = async () => {
  loadLocalEnv();

  const options = parseArgs(process.argv.slice(2));
  const endpoint = getEndpoint();
  const tag = await ensureTag(endpoint, options.tagName, options.apply);

  let page = 1;
  let scannedScenes = 0;
  let matchedScenes = 0;
  let alreadyTaggedScenes = 0;
  let updatedScenes = 0;

  console.log(
    `${options.apply ? "Applying" : "Dry run"}: tagging scenes with ${options.tagName} when file paths contain a distinct VR segment.`,
  );

  while (true) {
    const remainingLimit =
      options.limit === undefined ? options.pageSize : options.limit - scannedScenes;

    if (remainingLimit <= 0) {
      break;
    }

    const perPage = Math.min(options.pageSize, remainingLimit);
    const data = await executeGraphQl<FindScenesData>(endpoint, findScenesQuery, {
      filter: {
        page,
        per_page: perPage,
        sort: "created_at",
        direction: "DESC",
      },
    });
    const scenes = data?.findScenes?.scenes ?? [];

    if (scenes.length === 0) {
      break;
    }

    for (const scene of scenes) {
      scannedScenes += 1;

      const matchingPaths = getMatchingPaths(scene);
      if (matchingPaths.length === 0) {
        continue;
      }

      matchedScenes += 1;
      const displayTitle = scene.title?.trim() || "(untitled)";

      if (sceneHasTag(scene, tag.id, options.tagName)) {
        alreadyTaggedScenes += 1;
        console.log(`skip ${scene.id}: ${displayTitle} already has ${options.tagName}`);
        continue;
      }

      console.log(`${options.apply ? "update" : "match"} ${scene.id}: ${displayTitle}`);
      for (const path of matchingPaths) {
        console.log(`  ${path}`);
      }

      if (options.apply) {
        await updateSceneTags(endpoint, scene, tag.id);
        updatedScenes += 1;
      }
    }

    const totalScenes = data?.findScenes?.count;
    if (
      scenes.length < perPage ||
      (totalScenes !== undefined && scannedScenes >= totalScenes)
    ) {
      break;
    }

    page += 1;
  }

  console.log("");
  console.log(`Scanned scenes: ${scannedScenes}`);
  console.log(`Matched scenes: ${matchedScenes}`);
  console.log(`Already tagged: ${alreadyTaggedScenes}`);
  console.log(`Updated scenes: ${updatedScenes}`);

  if (!options.apply) {
    console.log("No changes were made. Re-run with --apply to update Stash.");
  }
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
