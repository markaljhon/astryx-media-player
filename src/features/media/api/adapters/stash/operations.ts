import type { StashGraphQlOperation } from "./graphqlClient";

export type StashTag = {
  id: string;
  name: string | null;
};

export type StashMediaScene = {
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

export type StashSceneStream = {
  label: string | null;
  mime_type: string | null;
  url: string | null;
};

export type StashTaggableScene = {
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

export type StashFindTagsData = {
  findTags?: {
    count?: number;
    tags?: StashTag[];
  };
};

export type StashCreateTagData = {
  tagCreate?: StashTag | null;
};

export type StashFindMediaScenesData = {
  findScenes?: {
    count?: number;
    scenes?: StashMediaScene[];
  };
};

export type StashFindMediaSceneData = {
  findScene?: StashMediaScene | null;
};

export type StashSceneStreamsData = {
  sceneStreams?: StashSceneStream[] | null;
};

export type StashFindTaggableScenesData = {
  findScenes?: {
    count?: number;
    scenes?: StashTaggableScene[];
  };
};

export type StashUpdateSceneData = {
  sceneUpdate?: {
    id: string;
  } | null;
};

export type StashFindTagsVariables = {
  filter: Record<string, unknown>;
  tagFilter: Record<string, unknown> | null;
};

export type StashCreateTagVariables = {
  input: {
    name: string;
  };
};

export type StashFindMediaScenesVariables = {
  filter: Record<string, unknown>;
  sceneFilter: Record<string, unknown> | null;
};

export type StashFindMediaSceneVariables = {
  id: string;
};

export type StashSceneStreamsVariables = {
  id: string;
};

export type StashFindTaggableScenesVariables = {
  filter: Record<string, unknown>;
};

export type StashUpdateSceneVariables = {
  input: {
    id: string;
    tag_ids: string[];
  };
};

export const findTagsOperation: StashGraphQlOperation<
  StashFindTagsData,
  StashFindTagsVariables
> = {
  name: "FindTags",
  document: `
    query FindTags($filter: FindFilterType!, $tagFilter: TagFilterType) {
      findTags(filter: $filter, tag_filter: $tagFilter) {
        count
        tags {
          id
          name
        }
      }
    }
  `,
};

export const createTagOperation: StashGraphQlOperation<
  StashCreateTagData,
  StashCreateTagVariables
> = {
  name: "CreateTag",
  document: `
    mutation CreateTag($input: TagCreateInput!) {
      tagCreate(input: $input) {
        id
        name
      }
    }
  `,
};

export const findMediaScenesOperation: StashGraphQlOperation<
  StashFindMediaScenesData,
  StashFindMediaScenesVariables
> = {
  name: "FindMediaScenes",
  document: `
    query FindMediaScenes($filter: FindFilterType!, $sceneFilter: SceneFilterType) {
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
  `,
};

export const findMediaSceneOperation: StashGraphQlOperation<
  StashFindMediaSceneData,
  StashFindMediaSceneVariables
> = {
  name: "FindMediaScene",
  document: `
    query FindMediaScene($id: ID!) {
      findScene(id: $id) {
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
  `,
};

export const sceneStreamsOperation: StashGraphQlOperation<
  StashSceneStreamsData,
  StashSceneStreamsVariables
> = {
  name: "SceneStreams",
  document: `
    query SceneStreams($id: ID!) {
      sceneStreams(id: $id) {
        label
        mime_type
        url
      }
    }
  `,
};

export const findTaggableScenesOperation: StashGraphQlOperation<
  StashFindTaggableScenesData,
  StashFindTaggableScenesVariables
> = {
  name: "FindTaggableScenes",
  document: `
    query FindTaggableScenes($filter: FindFilterType!) {
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
  `,
};

export const updateSceneTagsOperation: StashGraphQlOperation<
  StashUpdateSceneData,
  StashUpdateSceneVariables
> = {
  name: "UpdateSceneTags",
  document: `
    mutation UpdateSceneTags($input: SceneUpdateInput!) {
      sceneUpdate(input: $input) {
        id
      }
    }
  `,
};
