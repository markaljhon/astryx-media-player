import { getRouteApi } from "@tanstack/react-router";
import { SpatialMonoVideoPlayer } from "@/features/players/SpatialMonoVideoPlayer";

const routeApi = getRouteApi("/media/player/$sceneId");

export const MediaPlayerRoutePage = () => {
  const { sceneId } = routeApi.useParams();

  return <SpatialMonoVideoPlayer src={`/stash/scene/${sceneId}/stream`} />;
};
