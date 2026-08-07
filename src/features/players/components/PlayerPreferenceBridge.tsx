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

type MutablePlaybackPreferenceMedia = {
  muted: boolean;
  playbackRate: number;
};

export const PlayerPreferenceBridge = () => {
  const media = useMedia();
  const playbackRate = usePlayer(selectPlaybackRate);
  const volume = usePlayer(selectVolume);
  const skipNextMutedPersistRef = useRef(false);
  const skipNextPlaybackRatePersistRef = useRef(false);

  useEffect(() => {
    if (!isMutablePlaybackPreferenceMedia(media)) {
      return;
    }

    const preferences = getGlobalPlaybackPreferences();

    skipNextMutedPersistRef.current = true;
    skipNextPlaybackRatePersistRef.current = true;
    media.muted = preferences.muted;
    media.playbackRate = preferences.playbackRate;
  }, [media]);

  useEffect(() => {
    if (!volume) {
      return;
    }

    if (skipNextMutedPersistRef.current) {
      skipNextMutedPersistRef.current = false;
      return;
    }

    setGlobalPlaybackPreferences({ muted: volume.muted });
  }, [volume]);

  useEffect(() => {
    if (!playbackRate) {
      return;
    }

    if (skipNextPlaybackRatePersistRef.current) {
      skipNextPlaybackRatePersistRef.current = false;
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
