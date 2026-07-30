import { Outlet, createRoute } from "@tanstack/react-router";
import { SpatialMonoVideoPlayer } from "@/features/players/SpatialMonoVideoPlayer";
import { MediaLibraryPage } from "@/pages/media/MediaLibraryPage";
import { MediaSideNav } from "./MediaSideNav";
import { ProtectedAppShell } from "./ProtectedAppShell";
import { rootRoute } from "./rootRoute";

export const mediaLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "media",
  component: () => (
    <ProtectedAppShell sideNav={<MediaSideNav />}>
      <Outlet />
    </ProtectedAppShell>
  ),
});

export const mediaIndexRoute = createRoute({
  getParentRoute: () => mediaLayoutRoute,
  path: "/",
  component: () => <MediaLibraryPage providerId="stash" />,
});

export const localMediaRoute = createRoute({
  getParentRoute: () => mediaLayoutRoute,
  path: "local",
  component: () => <MediaLibraryPage providerId="local" />,
});

export const mediaPlayerRoute = createRoute({
  getParentRoute: () => mediaLayoutRoute,
  path: "player/$sceneId",
  component: () => {
    const { sceneId } = mediaPlayerRoute.useParams();

    return <SpatialMonoVideoPlayer src={`/stash/scene/${sceneId}/stream`} />;
  },
});

export const mediaRoutes = mediaLayoutRoute.addChildren([
  mediaIndexRoute,
  localMediaRoute,
  mediaPlayerRoute,
]);
