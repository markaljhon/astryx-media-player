import { createContext, useContext } from "react";
import type { ThemeMode } from "@astryxdesign/core/theme";

export type AppThemeModeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

export const AppThemeModeContext =
  createContext<AppThemeModeContextValue | null>(null);

export const useAppThemeMode = () => {
  const context = useContext(AppThemeModeContext);

  if (context == null) {
    throw new Error("useAppThemeMode must be used inside AppThemeProvider");
  }

  return context;
};
