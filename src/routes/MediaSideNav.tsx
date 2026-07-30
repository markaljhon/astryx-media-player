import type { MouseEvent } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  SideNav,
  SideNavHeading,
  SideNavItem,
  SideNavSection,
} from "@astryxdesign/core/SideNav";

export const MediaSideNav = () => {
  const navigate = useNavigate();
  const pathname = useLocation({
    select: (location) => location.pathname,
  });

  const handleStashClick = (event: MouseEvent<Element>) => {
    event.preventDefault();
    void navigate({ to: "/media" });
  };

  const handleLocalClick = (event: MouseEvent<Element>) => {
    event.preventDefault();
    void navigate({ to: "/media/local" });
  };

  const handleDemoPlayerClick = (event: MouseEvent<Element>) => {
    event.preventDefault();
    void navigate({
      to: "/media/player/$sceneId",
      params: { sceneId: "374" },
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
          href="/media"
          isSelected={pathname === "/media"}
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
