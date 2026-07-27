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

export const SpatialMonoVideoPlayer = (props: { src: string }) => {
  return (
    <Player.Provider>
      <MinimalVideoSkin>
        <MonoVideoCanvas url={props.src} />
      </MinimalVideoSkin>
    </Player.Provider>
  );
};
