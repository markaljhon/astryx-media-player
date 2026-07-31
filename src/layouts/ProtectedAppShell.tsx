import { Navigate } from "@tanstack/react-router";
import { AppShell, type AppShellProps } from "@astryxdesign/core";
import { useAccess } from "@/features/auth/access";

export const ProtectedAppShell = ({ children, ...props }: AppShellProps) => {
  const { hasAccess } = useAccess();

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppShell
      height="fill"
      variant="wash"
      contentPadding={0}
      mobileNav={{ breakpoint: "md" }}
      className="safe-area"
      {...props}
    >
      {children}
    </AppShell>
  );
};
