import { useCallback, useMemo, useSyncExternalStore } from "react";
import { mediaSearchDefaults } from "@/features/media/routing/mediaSearch";

export type AccessMode = "gal" | "dev" | "local" | "stash";

const accessModeStorageKey = "astryx-media-player:access-mode";
const accessModeChangedEvent = "astryx-media-player:access-mode-changed";

const accessModeRouteOptions = {
  gal: {
    to: "/gallery",
    search: mediaSearchDefaults,
    replace: true,
  },
  dev: {
    to: "/media/player/$sceneId",
    params: { sceneId: "374" },
    search: mediaSearchDefaults,
    replace: true,
  },
  local: {
    to: "/media/$providerId",
    params: { providerId: "local" },
    search: mediaSearchDefaults,
    replace: true,
  },
  stash: {
    to: "/media/$providerId",
    params: { providerId: "stash" },
    search: mediaSearchDefaults,
    replace: true,
  },
} as const satisfies Record<AccessMode, object>;

const isAccessMode = (value: string | null): value is AccessMode => {
  return (
    value === "gal" ||
    value === "dev" ||
    value === "local" ||
    value === "stash"
  );
};

const getAccessModeSnapshot = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const accessMode = window.sessionStorage.getItem(accessModeStorageKey);

  return isAccessMode(accessMode) ? accessMode : null;
};

const subscribeToAccessMode = (onStoreChange: () => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(accessModeChangedEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(accessModeChangedEvent, onStoreChange);
  };
};

const dispatchAccessModeChanged = () => {
  window.dispatchEvent(new Event(accessModeChangedEvent));
};

const setStoredAccessMode = (accessMode: AccessMode) => {
  window.sessionStorage.setItem(accessModeStorageKey, accessMode);
  dispatchAccessModeChanged();
};

const clearStoredAccessMode = () => {
  window.sessionStorage.removeItem(accessModeStorageKey);
  dispatchAccessModeChanged();
};

const getAccessModeForPassword = (password: string) => {
  const defaultPassword = import.meta.env.VITE_APP_PASSWORD;
  const testPassword = import.meta.env.VITE_TEST_PASSWORD;

  if (password === "gal") return "gal";

  if (password === "dev") {
    return "dev";
  }

  if (password === defaultPassword) {
    return "stash";
  }

  if (password === testPassword) {
    return "local";
  }

  return null;
};

const getRouteOptionsForAccessMode = (accessMode: AccessMode) => {
  return accessModeRouteOptions[accessMode];
};

export const useAccess = () => {
  const accessMode = useSyncExternalStore(
    subscribeToAccessMode,
    getAccessModeSnapshot,
    () => null,
  );

  const setAccessMode = useCallback((nextAccessMode: AccessMode) => {
    setStoredAccessMode(nextAccessMode);
  }, []);

  const clearAccessMode = useCallback(() => {
    clearStoredAccessMode();
  }, []);

  return useMemo(
    () => ({
      accessMode,
      hasAccess: accessMode !== null,
      setAccessMode,
      clearAccessMode,
      getAccessModeForPassword,
      getRouteOptionsForAccessMode,
    }),
    [accessMode, clearAccessMode, setAccessMode],
  );
};
