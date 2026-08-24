import {
  defaultMediaProviderId,
  fetchMediaItem,
  listMediaProviders,
} from "@/features/media/api/mediaApi";
import { validateMediaPlayerPlaybackMode } from "@/features/players/api/mediaPlayerRouteSearch";
import type { SpatialPlaybackMode } from "@/features/players/api/spatialPlaybackMode";
import { MediaPlayerRoutePage } from "@/pages/media/MediaPlayerRoutePage";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

type MediaPlayerSearch = {
  playbackMode?: SpatialPlaybackMode;
  providerId: string;
};

const mediaPlayerSearchDefaults = {
  playbackMode: "default",
  providerId: defaultMediaProviderId,
} satisfies MediaPlayerSearch;

const validateMediaPlayerSearch = (
  search: Record<string, unknown>,
): MediaPlayerSearch => {
  const providerIds = new Set(
    listMediaProviders().map((provider) => provider.id),
  );
  const requestedProviderId = search.providerId;
  const providerId =
    (
      typeof requestedProviderId === "string"
      && providerIds.has(requestedProviderId)
    ) ?
      requestedProviderId
    : mediaPlayerSearchDefaults.providerId;

  return {
    playbackMode: validateMediaPlayerPlaybackMode(search),
    providerId,
  };
};

export const Route = createFileRoute("/media_/player/$sceneId")({
  validateSearch: validateMediaPlayerSearch,
  search: {
    middlewares: [stripSearchParams(mediaPlayerSearchDefaults)],
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ deps, params }) => {
    return fetchMediaItem({
      id: params.sceneId,
      providerId: deps.providerId,
    });
  },
  component: MediaPlayerRoutePage,
});
