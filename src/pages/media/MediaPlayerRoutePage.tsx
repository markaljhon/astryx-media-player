import { Navigate, getRouteApi } from "@tanstack/react-router";
import { Center, Text, VStack } from "@astryxdesign/core";
import { useAccess } from "@/features/auth/access";
import { DefaultVideoPlayer } from "@/features/players/DefaultVideoPlayer";
import { hasSpatialVideoCue } from "@/features/players/api/videoPlayerAdapters";
import { SpatialMonoVideoPlayer } from "@/features/players/SpatialMonoVideoPlayer";

const routeApi = getRouteApi("/media_/player/$sceneId");

export const MediaPlayerRoutePage = () => {
  const item = routeApi.useLoaderData();
  const { hasAccess } = useAccess();

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  const sourceUrl = item.sourceUrl ?? item.playbackSources?.[0]?.url;

  if (!sourceUrl) {
    return (
      <Center height="100%">
        <VStack gap={1} hAlign="center">
          <Text type="body" weight="bold">
            This media item cannot be played.
          </Text>
          <Text type="supporting" color="secondary">
            The selected provider did not return a playable source.
          </Text>
        </VStack>
      </Center>
    );
  }

  const isSpatialVideo = hasSpatialVideoCue(item);
  const mediaPreferenceKey = `${item.providerId}:${item.id}`;

  if (isSpatialVideo) {
    return (
      <SpatialMonoVideoPlayer
        src={sourceUrl}
        mediaPreferenceKey={mediaPreferenceKey}
        previewSrc={item.thumbnailUrl}
        playbackSources={item.playbackSources}
      />
    );
  }

  return (
    <DefaultVideoPlayer
      src={sourceUrl}
      mediaPreferenceKey={mediaPreferenceKey}
      previewSrc={item.thumbnailUrl}
      playbackSources={item.playbackSources}
    />
  );
};
