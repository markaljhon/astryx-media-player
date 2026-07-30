import type { MouseEvent } from "react";
import { useLocation, useNavigate, useSearch } from "@tanstack/react-router";
import {
  SideNav,
  SideNavHeading,
  SideNavItem,
  SideNavSection,
} from "@astryxdesign/core/SideNav";

export const MediaSideNav = () => {
  const navigate = useNavigate();
  const mediaSearch = useSearch({ from: "/media" });
  const pathname = useLocation({
    select: (location) => location.pathname,
  });

  const handleStashClick = (event: MouseEvent<Element>) => {
    event.preventDefault();
    void navigate({
      to: "/media/$providerId",
      params: { providerId: "stash" },
      search: mediaSearch,
    });
  };

  const handleLocalClick = (event: MouseEvent<Element>) => {
    event.preventDefault();
    void navigate({
      to: "/media/$providerId",
      params: { providerId: "local" },
      search: mediaSearch,
    });
  };

  const handleDemoPlayerClick = (event: MouseEvent<Element>) => {
    event.preventDefault();
    void navigate({
      to: "/media/player/$sceneId",
      params: { sceneId: "374" },
      search: mediaSearch,
    });
  };

  return (
    <SideNav
      header={<SideNavHeading heading="Astryx Media Library" />}
      collapsible={true}
    >
      <SideNavSection title="Library">
        <SideNavItem
          label="Stash"
          href="/media/stash"
          isSelected={pathname === "/media" || pathname === "/media/stash"}
          onClick={handleStashClick}
        />
        <SideNavItem
          label="Local samples"
          href="/media/local"
          isSelected={pathname === "/media/local"}
          onClick={handleLocalClick}
        />
      </SideNavSection>
      <SideNavSection title="Players">
        <SideNavItem
          label="Spatial demo"
          href="/media/player/374"
          isSelected={pathname.startsWith("/media/player/")}
          onClick={handleDemoPlayerClick}
        />
      </SideNavSection>
    </SideNav>
  );
};
