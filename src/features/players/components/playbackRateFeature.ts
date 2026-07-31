import {
  definePlayerFeature,
  isMediaPlaybackRateCapable,
} from "@videojs/react";
import type { MediaPlaybackRateState } from "@videojs/core";

export const definePlaybackRateFeature = (playbackRates: readonly number[]) =>
  definePlayerFeature({
    name: "playbackRate",
    state: ({ target }): MediaPlaybackRateState => ({
      playbackRates,
      playbackRate: 1,
      setPlaybackRate: (rate) => {
        const { media } = target();

        if (isMediaPlaybackRateCapable(media)) {
          media.playbackRate = rate;
        }
      },
    }),
    attach: ({ target, signal, set }) => {
      const { media } = target;

      if (!isMediaPlaybackRateCapable(media)) return;

      const mediaElement = media as HTMLMediaElement;
      const sync = () => set({ playbackRate: media.playbackRate });
      sync();

      mediaElement.addEventListener("ratechange", sync, { signal });
    },
  });

export const defaultPlaybackRateFeature = definePlaybackRateFeature([
  0.5, 1, 1.25, 1.5, 2,
]);
