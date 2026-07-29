import type { ReactNode } from "react";
import { AppShell } from "@astryxdesign/core";

type AppLayoutProps = {
  children: ReactNode;
};

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <AppShell height="fill" variant="elevated" contentPadding={0}>
      {children}
    </AppShell>
  );
};
