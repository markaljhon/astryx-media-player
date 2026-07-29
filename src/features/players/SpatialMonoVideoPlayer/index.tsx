import "@videojs/react/video/minimal-skin.css";
import "./components/skin.css";
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
import { defaultPlaybackRateFeature } from "./components/playbackRateFeature";
import {
  SpatialMonoVideoSkin,
  type PlaybackRateControlMode,
} from "./components/SpatialMonoVideoSkin";

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
  playbackRateControl?: PlaybackRateControlMode;
}) => {
  return (
    <Player.Provider>
      <SpatialMonoVideoSkin
        className="spatial-mono-video-player"
        poster={props.previewSrc}
        playbackRateControl={props.playbackRateControl}
      >
        <MonoVideoCanvas url={props.src} />
      </SpatialMonoVideoSkin>
    </Player.Provider>
  );
};
