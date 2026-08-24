import "@videojs/react/video/minimal-skin.css";
import "./components/skin.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  bufferFeature,
  controlsFeature,
  createPlayer,
  errorFeature,
  playbackFeature,
  sourceFeature,
  timeFeature,
  volumeFeature,
} from "@videojs/react";
import { MonoVideoCanvas } from "./components/MonoVideoCanvas";
import { defaultPlaybackRateFeature } from "../components/playbackRateFeature";
import {
  SpatialMonoVideoSkin,
  type PlaybackRateControlMode,
} from "./components/SpatialMonoVideoSkin";
import type { MediaPlaybackSource, StereoVideoLayout } from "@/types/media";
import { normalizePlaybackSources } from "../api/playbackSources";
import {
  getGlobalPlaybackPreferences,
  getMediaPlaybackSourcePreference,
  setMediaPlaybackSourcePreference,
} from "../api/playerPreferences";
import { PlayerPreferenceBridge } from "../components/PlayerPreferenceBridge";

const Player = createPlayer({
  features: [
    playbackFeature,
    defaultPlaybackRateFeature,
    volumeFeature,
    timeFeature,
    controlsFeature,
    sourceFeature,
    bufferFeature,
    errorFeature,
  ],
});

export const SpatialMonoVideoPlayer = (props: {
  src: string;
  mediaPreferenceKey?: string;
  previewSrc?: string;
  playbackSources?: MediaPlaybackSource[];
  playbackRateControl?: PlaybackRateControlMode;
  stereoLayout?: StereoVideoLayout;
}) => {
  const playbackSources = useMemo(
    () => normalizePlaybackSources(props.src, props.playbackSources),
    [props.playbackSources, props.src],
  );
  const preferenceScopeKey = props.mediaPreferenceKey ?? props.src;
  const previousPreferenceScopeKeyRef = useRef(preferenceScopeKey);
  const globalPlaybackPreferences = getGlobalPlaybackPreferences();
  const [selectedPlaybackSourceId, setSelectedPlaybackSourceId] = useState(() =>
    getPreferredPlaybackSourceId(playbackSources, props.mediaPreferenceKey),
  );
  const selectedPlaybackSource =
    playbackSources.find((source) => source.id === selectedPlaybackSourceId) ??
    playbackSources[0];
  const [isSourceLoading, setIsSourceLoading] = useState(false);
  const [isSourceReady, setIsSourceReady] = useState(false);

  useEffect(() => {
    const preferredSourceId = getPreferredPlaybackSourceId(
      playbackSources,
      props.mediaPreferenceKey,
    );
    const isSamePreferenceScope =
      previousPreferenceScopeKeyRef.current === preferenceScopeKey;

    setSelectedPlaybackSourceId((currentSourceId) => {
      if (preferredSourceId !== playbackSources[0]?.id) {
        return preferredSourceId;
      }

      if (
        isSamePreferenceScope &&
        playbackSources.some((source) => source.id === currentSourceId)
      ) {
        return currentSourceId;
      }

      return preferredSourceId;
    });
    previousPreferenceScopeKeyRef.current = preferenceScopeKey;
    setIsSourceLoading(false);
    setIsSourceReady(false);
  }, [playbackSources, preferenceScopeKey, props.mediaPreferenceKey]);

  useEffect(() => {
    setIsSourceReady(false);
  }, [selectedPlaybackSource?.id]);

  const handlePlaybackSourceChange = useCallback(
    (sourceId: string) => {
      if (sourceId === selectedPlaybackSourceId) {
        return;
      }

      setIsSourceLoading(true);
      setIsSourceReady(false);
      setSelectedPlaybackSourceId(sourceId);
      if (props.mediaPreferenceKey) {
        setMediaPlaybackSourcePreference(props.mediaPreferenceKey, sourceId);
      }
    },
    [props.mediaPreferenceKey, selectedPlaybackSourceId],
  );

  const handleSourceReady = useCallback(() => {
    setIsSourceReady(true);
    setIsSourceLoading(false);
  }, []);

  const handleSourceError = useCallback(() => {
    setIsSourceLoading(false);
    setIsSourceReady(false);
  }, []);

  return (
    <Player.Provider>
      <PlayerPreferenceBridge />
      <SpatialMonoVideoSkin
        className="spatial-mono-video-player"
        poster={props.previewSrc}
        playbackRateControl={props.playbackRateControl}
        playbackSources={playbackSources}
        selectedPlaybackSourceId={selectedPlaybackSource?.id}
        isSourceLoading={isSourceLoading}
        isSourceReady={isSourceReady}
        onPlaybackSourceChange={handlePlaybackSourceChange}
      >
        <MonoVideoCanvas
          initialMuted={globalPlaybackPreferences.muted}
          initialPlaybackRate={globalPlaybackPreferences.playbackRate}
          source={selectedPlaybackSource}
          stereoLayout={props.stereoLayout}
          onSourceReady={handleSourceReady}
          onSourceError={handleSourceError}
        />
      </SpatialMonoVideoSkin>
    </Player.Provider>
  );
};

const getPreferredPlaybackSourceId = (
  playbackSources: MediaPlaybackSource[],
  mediaPreferenceKey: string | undefined,
) => {
  const storedSourceId =
    mediaPreferenceKey ?
      getMediaPlaybackSourcePreference(mediaPreferenceKey)
    : undefined;

  return (
    playbackSources.find((source) => source.id === storedSourceId)?.id ??
    playbackSources[0]?.id ??
    "default"
  );
};
