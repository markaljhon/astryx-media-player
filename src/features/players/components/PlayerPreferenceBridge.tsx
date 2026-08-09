import { useEffect, useRef } from "react";
import {
  selectPlaybackRate,
  selectVolume,
  useMedia,
  usePlayer,
} from "@videojs/react";
import {
  getGlobalPlaybackPreferences,
  isSupportedPlaybackRate,
  setGlobalPlaybackPreferences,
} from "../api/playerPreferences";
import { shouldPersistPlayerPreferenceChange } from "../api/playerPreferencePersistence";

type MutablePlaybackPreferenceMedia = {
  muted: boolean;
  playbackRate: number;
};

export const PlayerPreferenceBridge = () => {
  const media = useMedia();
  const playbackRate = usePlayer(selectPlaybackRate);
  const volume = usePlayer(selectVolume);
  const hasHydratedMediaRef = useRef(false);
  const hydratedMutedValueRef = useRef<boolean | null>(null);
  const hydratedPlaybackRateValueRef = useRef<number | null>(null);
  const skipNextMutedPersistRef = useRef(false);
  const skipNextPlaybackRatePersistRef = useRef(false);

  useEffect(() => {
    if (!isMutablePlaybackPreferenceMedia(media)) {
      return;
    }

    const preferences = getGlobalPlaybackPreferences();

    skipNextMutedPersistRef.current = true;
    skipNextPlaybackRatePersistRef.current = true;
    hydratedMutedValueRef.current = preferences.muted;
    hydratedPlaybackRateValueRef.current = preferences.playbackRate;
    hasHydratedMediaRef.current = true;
    media.muted = preferences.muted;
    media.playbackRate = preferences.playbackRate;
  }, [media]);

  useEffect(() => {
    if (!volume) {
      return;
    }

    const shouldPersist = shouldPersistPlayerPreferenceChange({
      hasHydratedMedia: hasHydratedMediaRef.current,
      hydratedValue: hydratedMutedValueRef.current,
      nextValue: volume.muted,
      skipHydrationEcho: skipNextMutedPersistRef.current,
    });

    if (skipNextMutedPersistRef.current) {
      skipNextMutedPersistRef.current = false;
    }

    if (!shouldPersist) {
      return;
    }

    setGlobalPlaybackPreferences({ muted: volume.muted });
  }, [volume]);

  useEffect(() => {
    if (!playbackRate) {
      return;
    }

    const shouldPersist = shouldPersistPlayerPreferenceChange({
      hasHydratedMedia: hasHydratedMediaRef.current,
      hydratedValue: hydratedPlaybackRateValueRef.current,
      nextValue: playbackRate.playbackRate,
      skipHydrationEcho: skipNextPlaybackRatePersistRef.current,
    });

    if (skipNextPlaybackRatePersistRef.current) {
      skipNextPlaybackRatePersistRef.current = false;
    }

    if (!shouldPersist) {
      return;
    }

    if (isSupportedPlaybackRate(playbackRate.playbackRate)) {
      setGlobalPlaybackPreferences({
        playbackRate: playbackRate.playbackRate,
      });
    }
  }, [playbackRate]);

  return null;
};

const isMutablePlaybackPreferenceMedia = (
  media: unknown,
): media is MutablePlaybackPreferenceMedia => {
  if (!media || typeof media !== "object") {
    return false;
  }

  const candidate = media as Partial<MutablePlaybackPreferenceMedia>;

  return (
    typeof candidate.muted === "boolean" &&
    typeof candidate.playbackRate === "number"
  );
};
