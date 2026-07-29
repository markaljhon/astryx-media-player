import "@videojs/react/video/minimal-skin.css";
import "./components/skin.css";
import {
  bufferFeature,
  controlsFeature,
  createPlayer,
  errorFeature,
  playbackFeature,
  Poster,
  sourceFeature,
  timeFeature,
  volumeFeature,
} from "@videojs/react";
import { MinimalVideoSkin } from "@videojs/react/video";
import { MonoVideoCanvas } from "./components/MonoVideoCanvas";
import { defaultPlaybackRateFeature } from "./components/playbackRateFeature";

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
}) => {
  return (
    <Player.Provider>
      <MinimalVideoSkin className="spatial-mono-video-player">
        <MonoVideoCanvas url={""} />
        <Poster className="media-poster" src={props.previewSrc} />
      </MinimalVideoSkin>
    </Player.Provider>
  );
};
