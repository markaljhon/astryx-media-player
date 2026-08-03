import {
  defaultMediaProviderId,
  fetchMediaItem,
  listMediaProviders,
} from "@/features/media/api/mediaApi";
import { MediaPlayerRoutePage } from "@/pages/media/MediaPlayerRoutePage";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

type MediaPlayerSearch = {
  providerId: string;
};

const mediaPlayerSearchDefaults = {
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

  return { providerId };
};

export const Route = createFileRoute("/media/player/$sceneId")({
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
