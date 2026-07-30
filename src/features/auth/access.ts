import { mediaSearchDefaults } from "@/features/media/routing/mediaSearch";

export type AccessMode = "dev" | "local" | "stash";

const accessModeStorageKey = "astryx-media-player:access-mode";

const accessModeRouteOptions = {
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
  return value === "dev" || value === "local" || value === "stash";
};

export const getAccessMode = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const accessMode = window.sessionStorage.getItem(accessModeStorageKey);

  return isAccessMode(accessMode) ? accessMode : null;
};

export const setAccessMode = (accessMode: AccessMode) => {
  window.sessionStorage.setItem(accessModeStorageKey, accessMode);
};

export const clearAccessMode = () => {
  window.sessionStorage.removeItem(accessModeStorageKey);
};

export const getAccessModeForPassword = (password: string) => {
  const defaultPassword = import.meta.env.VITE_APP_PASSWORD;
  const testPassword = import.meta.env.VITE_TEST_PASSWORD;

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

export const getRouteOptionsForAccessMode = (accessMode: AccessMode) => {
  return accessModeRouteOptions[accessMode];
};
