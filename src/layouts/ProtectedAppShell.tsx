import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { AppShell } from "@astryxdesign/core";
import { getAccessMode } from "@/features/auth/access";

type ProtectedAppShellProps = {
  children: ReactNode;
  sideNav?: ReactNode;
};

export const ProtectedAppShell = ({
  children,
  sideNav,
}: ProtectedAppShellProps) => {
  if (!getAccessMode()) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppShell
      height="fill"
      variant="wash"
      contentPadding={0}
      sideNav={sideNav}
      mobileNav={{ breakpoint: "md" }}
      className="safe-area"
    >
      {children}
    </AppShell>
  );
};
