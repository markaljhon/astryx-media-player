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
import { Video } from "@videojs/react/video";
import {
  DefaultVideoSkin,
  type PlaybackRateControlMode,
} from "../components/DefaultVideoSkin";
import { defaultPlaybackRateFeature } from "../components/playbackRateFeature";

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
  playbackRateControl?: PlaybackRateControlMode;
}) => {
  return (
    <Player.Provider>
      <DefaultVideoSkin
        poster={props.previewSrc}
        playbackRateControl={props.playbackRateControl}
      >
        <Video src={props.src} playsInline />
      </DefaultVideoSkin>
    </Player.Provider>
  );
};
