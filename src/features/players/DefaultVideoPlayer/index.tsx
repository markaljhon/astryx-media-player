import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createPlayer,
  playbackFeature,
  volumeFeature,
  timeFeature,
  controlsFeature,
  sourceFeature,
  bufferFeature,
  errorFeature,
} from "@videojs/react";
import { HlsJsVideo } from "@videojs/react/media/hlsjs-video";
import { Video } from "@videojs/react/video";
import {
  DefaultVideoSkin,
  type PlaybackRateControlMode,
} from "../components/DefaultVideoSkin";
import { defaultPlaybackRateFeature } from "../components/playbackRateFeature";
import type { MediaPlaybackSource } from "@/types/media";
import {
  isHlsPlaybackSource,
  normalizePlaybackSources,
} from "../api/playbackSources";
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

export const DefaultVideoPlayer = (props: {
  src: string;
  mediaPreferenceKey?: string;
  previewSrc?: string;
  playbackSources?: MediaPlaybackSource[];
  playbackRateControl?: PlaybackRateControlMode;
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
  }, [playbackSources, preferenceScopeKey, props.mediaPreferenceKey]);

  const handlePlaybackSourceChange = useCallback(
    (sourceId: string) => {
      if (sourceId === selectedPlaybackSourceId) {
        return;
      }

      setSelectedPlaybackSourceId(sourceId);
      if (props.mediaPreferenceKey) {
        setMediaPlaybackSourcePreference(props.mediaPreferenceKey, sourceId);
      }
    },
    [props.mediaPreferenceKey, selectedPlaybackSourceId],
  );

  return (
    <Player.Provider>
      <PlayerPreferenceBridge />
      <DefaultVideoSkin
        poster={props.previewSrc}
        playbackRateControl={props.playbackRateControl}
        playbackSources={playbackSources}
        selectedPlaybackSourceId={selectedPlaybackSource?.id}
        onPlaybackSourceChange={handlePlaybackSourceChange}
      >
        <SourceVideo
          key={selectedPlaybackSource.url}
          initialMuted={globalPlaybackPreferences.muted}
          initialPlaybackRate={globalPlaybackPreferences.playbackRate}
          source={selectedPlaybackSource}
        />
      </DefaultVideoSkin>
    </Player.Provider>
  );
};

const SourceVideo = ({
  initialMuted,
  initialPlaybackRate,
  source,
}: {
  initialMuted: boolean;
  initialPlaybackRate: number;
  source: MediaPlaybackSource;
}) => {
  const handleVideoRef = useCallback(
    (video: HTMLVideoElement | null) => {
      if (!video) {
        return;
      }

      video.muted = initialMuted;
      video.playbackRate = initialPlaybackRate;
    },
    [initialMuted, initialPlaybackRate],
  );

  if (isHlsPlaybackSource(source)) {
    return (
      <HlsJsVideo
        ref={handleVideoRef}
        src={source.url}
        autoPlay
        muted={initialMuted}
        playsInline
        preload="auto"
      />
    );
  }

  return (
    <Video
      ref={handleVideoRef}
      src={source.url}
      autoPlay
      muted={initialMuted}
      playsInline
      preload="auto"
    />
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
