import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Theme } from "@astryxdesign/core";
import type { ThemeMode } from "@astryxdesign/core/theme";
import { AppThemeModeContext } from "@/features/theme/appThemeModeContext";
import { astryxTheme } from "@/themes/astryx/astryxTheme";

const themeModeStorageKey = "astryx-media-player:theme-mode";
const defaultThemeMode: ThemeMode = "dark";

const isThemeMode = (value: string | null): value is ThemeMode => {
  return value === "light" || value === "dark" || value === "system";
};

const getInitialThemeMode = (): ThemeMode => {
  if (typeof window === "undefined") {
    return defaultThemeMode;
  }

  try {
    const stored = window.localStorage.getItem(themeModeStorageKey);
    return isThemeMode(stored) ? stored : defaultThemeMode;
  } catch {
    return defaultThemeMode;
  }
};

export const AppThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setStoredMode] = useState<ThemeMode>(getInitialThemeMode);

  useEffect(() => {
    try {
      window.localStorage.setItem(themeModeStorageKey, mode);
    } catch {
      // Ignore storage failures; the in-memory theme still updates.
    }
  }, [mode]);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setStoredMode(nextMode);
  }, []);

  const toggleMode = useCallback(() => {
    setStoredMode((currentMode) =>
      currentMode === "dark" ? "light" : "dark",
    );
  }, []);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode,
    }),
    [mode, setMode, toggleMode],
  );

  return (
    <AppThemeModeContext value={value}>
      <Theme mode={mode} theme={astryxTheme}>
        {children}
      </Theme>
    </AppThemeModeContext>
  );
};
