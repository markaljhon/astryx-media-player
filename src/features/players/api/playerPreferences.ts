const playerPreferencesStorageKey =
  "astryx-media-player:player-preferences:v1";

export const supportedPlaybackRates = [0.5, 1, 1.25, 1.5, 2] as const;

export type SupportedPlaybackRate = (typeof supportedPlaybackRates)[number];

export type GlobalPlaybackPreferences = {
  muted: boolean;
  playbackRate: SupportedPlaybackRate;
};

type PlayerPreferences = {
  global: GlobalPlaybackPreferences;
  mediaSources: Record<string, string>;
};

const defaultGlobalPlaybackPreferences: GlobalPlaybackPreferences = {
  muted: false,
  playbackRate: 1,
};

const defaultPlayerPreferences: PlayerPreferences = {
  global: defaultGlobalPlaybackPreferences,
  mediaSources: {},
};

export const getGlobalPlaybackPreferences = (): GlobalPlaybackPreferences => {
  return readPlayerPreferences().global;
};

export const setGlobalPlaybackPreferences = (
  nextPreferences: Partial<GlobalPlaybackPreferences>,
) => {
  const currentPreferences = readPlayerPreferences();
  const playbackRate =
    nextPreferences.playbackRate === undefined ?
      currentPreferences.global.playbackRate
    : normalizePlaybackRate(nextPreferences.playbackRate);

  writePlayerPreferences({
    ...currentPreferences,
    global: {
      muted: nextPreferences.muted ?? currentPreferences.global.muted,
      playbackRate,
    },
  });
};

export const getMediaPlaybackSourcePreference = (
  mediaPreferenceKey: string,
) => {
  return readPlayerPreferences().mediaSources[mediaPreferenceKey];
};

export const setMediaPlaybackSourcePreference = (
  mediaPreferenceKey: string,
  sourceId: string,
) => {
  const currentPreferences = readPlayerPreferences();

  writePlayerPreferences({
    ...currentPreferences,
    mediaSources: {
      ...currentPreferences.mediaSources,
      [mediaPreferenceKey]: sourceId,
    },
  });
};

export const isSupportedPlaybackRate = (
  value: number,
): value is SupportedPlaybackRate => {
  return supportedPlaybackRates.some((rate) => rate === value);
};

const readPlayerPreferences = (): PlayerPreferences => {
  if (typeof window === "undefined") {
    return defaultPlayerPreferences;
  }

  try {
    return normalizePlayerPreferences(
      JSON.parse(
        window.localStorage.getItem(playerPreferencesStorageKey) ?? "null",
      ),
    );
  } catch {
    return defaultPlayerPreferences;
  }
};

const writePlayerPreferences = (preferences: PlayerPreferences) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      playerPreferencesStorageKey,
      JSON.stringify(preferences),
    );
  } catch {
    // Ignore storage failures; the in-memory player state still updates.
  }
};

const normalizePlayerPreferences = (value: unknown): PlayerPreferences => {
  if (!isRecord(value)) {
    return defaultPlayerPreferences;
  }

  return {
    global: normalizeGlobalPlaybackPreferences(value.global),
    mediaSources: normalizeMediaSources(value.mediaSources),
  };
};

const normalizeGlobalPlaybackPreferences = (
  value: unknown,
): GlobalPlaybackPreferences => {
  if (!isRecord(value)) {
    return defaultGlobalPlaybackPreferences;
  }

  return {
    muted:
      typeof value.muted === "boolean" ?
        value.muted
      : defaultGlobalPlaybackPreferences.muted,
    playbackRate: normalizePlaybackRate(value.playbackRate),
  };
};

const normalizePlaybackRate = (value: unknown): SupportedPlaybackRate => {
  return typeof value === "number" && isSupportedPlaybackRate(value) ?
      value
    : defaultGlobalPlaybackPreferences.playbackRate;
};

const normalizeMediaSources = (value: unknown): Record<string, string> => {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};
