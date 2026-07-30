import type { ComponentProps, ReactNode } from "react";
import { AppShell } from "@astryxdesign/core";

type AppLayoutProps = {
  children: ReactNode;
  contentPadding?: ComponentProps<typeof AppShell>["contentPadding"];
  sideNav?: ReactNode;
};

export const AppLayout = ({
  children,
  contentPadding = 0,
  sideNav,
}: AppLayoutProps) => {
  return (
    <AppShell
      height="fill"
      variant="wash"
      contentPadding={contentPadding}
      sideNav={sideNav}
      mobileNav={{ breakpoint: "md" }}
      className="safe-area"
    >
      {children}
    </AppShell>
  );
};
