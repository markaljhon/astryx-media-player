import {
  useCallback,
  useEffect,
  useMemo,
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
  previewSrc?: string;
  playbackSources?: MediaPlaybackSource[];
  playbackRateControl?: PlaybackRateControlMode;
}) => {
  const playbackSources = useMemo(
    () => normalizePlaybackSources(props.src, props.playbackSources),
    [props.playbackSources, props.src],
  );
  const [selectedPlaybackSourceId, setSelectedPlaybackSourceId] = useState(
    playbackSources[0]?.id ?? "default",
  );
  const selectedPlaybackSource =
    playbackSources.find((source) => source.id === selectedPlaybackSourceId) ??
    playbackSources[0];

  useEffect(() => {
    if (
      playbackSources.some((source) => source.id === selectedPlaybackSourceId)
    ) {
      return;
    }

    setSelectedPlaybackSourceId(playbackSources[0]?.id ?? "default");
  }, [playbackSources, selectedPlaybackSourceId]);

  useEffect(() => {
    setSelectedPlaybackSourceId(playbackSources[0]?.id ?? "default");
  }, [playbackSources, props.src]);

  const handlePlaybackSourceChange = useCallback(
    (sourceId: string) => {
      if (sourceId === selectedPlaybackSourceId) {
        return;
      }

      setSelectedPlaybackSourceId(sourceId);
    },
    [selectedPlaybackSourceId],
  );

  return (
    <Player.Provider>
      <DefaultVideoSkin
        poster={props.previewSrc}
        playbackRateControl={props.playbackRateControl}
        playbackSources={playbackSources}
        selectedPlaybackSourceId={selectedPlaybackSource?.id}
        onPlaybackSourceChange={handlePlaybackSourceChange}
      >
        <SourceVideo
          key={selectedPlaybackSource.url}
          source={selectedPlaybackSource}
        />
      </DefaultVideoSkin>
    </Player.Provider>
  );
};

const SourceVideo = ({ source }: { source: MediaPlaybackSource }) => {
  if (isHlsPlaybackSource(source)) {
    return <HlsJsVideo src={source.url} autoPlay playsInline preload="auto" />;
  }

  return <Video src={source.url} autoPlay playsInline preload="auto" />;
};
