import { Outlet } from "@tanstack/react-router";
import { MediaSideNav } from "@/layouts/MediaSideNav";
import { ProtectedAppShell } from "@/layouts/ProtectedAppShell";

export const MediaRouteLayout = () => {
  return (
    <ProtectedAppShell sideNav={<MediaSideNav />}>
      <Outlet />
    </ProtectedAppShell>
  );
};
