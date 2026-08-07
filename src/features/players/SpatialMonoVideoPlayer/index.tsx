import "@videojs/react/video/minimal-skin.css";
import "./components/skin.css";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import type { MediaPlaybackSource } from "@/types/media";
import { normalizePlaybackSources } from "../api/playbackSources";

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
  const [isSourceLoading, setIsSourceLoading] = useState(false);
  const [isSourceReady, setIsSourceReady] = useState(false);

  useEffect(() => {
    if (
      playbackSources.some((source) => source.id === selectedPlaybackSourceId)
    ) {
      return;
    }

    setSelectedPlaybackSourceId(playbackSources[0]?.id ?? "default");
    setIsSourceLoading(false);
    setIsSourceReady(false);
  }, [playbackSources, selectedPlaybackSourceId]);

  useEffect(() => {
    setSelectedPlaybackSourceId(playbackSources[0]?.id ?? "default");
    setIsSourceLoading(false);
    setIsSourceReady(false);
  }, [playbackSources, props.src]);

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
    },
    [selectedPlaybackSourceId],
  );

  const handleSourceReady = useCallback(() => {
    setIsSourceReady(true);
    setIsSourceLoading(false);
  }, []);

  return (
    <Player.Provider>
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
          source={selectedPlaybackSource}
          onSourceReady={handleSourceReady}
        />
      </SpatialMonoVideoSkin>
    </Player.Provider>
  );
};
