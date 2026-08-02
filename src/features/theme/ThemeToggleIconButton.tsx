import { Icon, IconButton, useTheme } from "@astryxdesign/core";
import type { IconButtonProps } from "@astryxdesign/core";
import { Moon, Sun } from "lucide-react";
import { useAppThemeMode } from "@/features/theme/appThemeModeContext";

type ThemeToggleIconButtonProps = Omit<
  IconButtonProps,
  "icon" | "label" | "onClick" | "tooltip"
>;

export const ThemeToggleIconButton = ({
  size = "sm",
  variant = "ghost",
  ...props
}: ThemeToggleIconButtonProps) => {
  const { setMode } = useAppThemeMode();
  const { mode } = useTheme();
  const nextMode = mode === "dark" ? "light" : "dark";
  const label =
    nextMode === "dark" ? "Switch to dark theme" : "Switch to light theme";
  const ToggleIcon = nextMode === "dark" ? Moon : Sun;

  return (
    <IconButton
      {...props}
      label={label}
      tooltip={label}
      size={size}
      variant={variant}
      icon={<Icon icon={ToggleIcon} />}
      onClick={() => setMode(nextMode)}
    />
  );
};
