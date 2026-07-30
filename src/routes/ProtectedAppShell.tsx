import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { AppLayout } from "@/layouts/AppLayout";
import { getAccessMode } from "./access";

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

  return <AppLayout sideNav={sideNav}>{children}</AppLayout>;
};
