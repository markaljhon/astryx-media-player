"use client";

import {
  type ComponentProps,
  type CSSProperties,
  forwardRef,
  isValidElement,
  type ReactNode,
} from "react";
import {
  CheckIcon,
  ChevronIcon,
  PauseIcon,
  PlayIcon,
  QualityIcon,
  RestartIcon,
  SeekIcon,
  SpinnerIcon,
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeOffIcon,
} from "@videojs/react/icons/minimal";
import {
  BufferingIndicator,
  Container,
  Controls,
  ErrorDialog,
  Gesture,
  Hotkey,
  Menu,
  MuteButton,
  PlaybackRateButton,
  PlayButton,
  Popover,
  Poster,
  SeekButton,
  SeekIndicator,
  StatusAnnouncer,
  StatusIndicator,
  Time,
  TimeSlider,
  Tooltip,
  usePlaybackRateOptions,
  usePlayer,
  VolumeIndicator,
  VolumeSlider,
  type RenderProp,
} from "@videojs/react";
import type { MediaPlaybackSource } from "@/types/media";

const SEEK_TIME = 10;
const CENTER_STATUS_ACTIONS = ["togglePaused"] as const;

export type PlaybackRateControlMode = "cycle" | "menu";

export interface SpatialMonoVideoSkinProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  poster?: string | RenderProp<Poster.State> | undefined;
  placeholder?: string;
  playbackRateControl?: PlaybackRateControlMode;
  playbackSources?: MediaPlaybackSource[];
  selectedPlaybackSourceId?: string;
  isSourceLoading?: boolean;
  isSourceReady?: boolean;
  onPlaybackSourceChange?: (sourceId: string) => void;
}

export const SpatialMonoVideoSkin = ({
  children,
  className,
  onPlaybackSourceChange,
  poster,
  placeholder,
  playbackRateControl = "cycle",
  playbackSources,
  selectedPlaybackSourceId,
  isSourceLoading = false,
  isSourceReady = false,
  style,
}: SpatialMonoVideoSkinProps): ReactNode => {
  const containerStyle =
    placeholder ?
      ({
        "--media-poster-placeholder": `url(${placeholder})`,
        ...style,
      } as CSSProperties)
    : style;

  return (
    <Container
      className={`media-minimal-skin media-minimal-skin--video ${isSourceReady ? "media-minimal-skin--source-ready" : ""} ${className ?? ""}`}
      style={containerStyle}
    >
      {children}

      {poster ?
        <Poster
          className="media-poster"
          src={isString(poster) ? poster : undefined}
          render={isRenderProp(poster) ? poster : undefined}
        />
      : null}

      {isSourceLoading ?
        <div
          className="media-source-switch"
          aria-label="Loading playback source"
          aria-live="polite"
        >
          {isString(poster) ?
            <img
              className="media-source-switch__poster"
              alt=""
              src={poster}
              aria-hidden="true"
            />
          : null}
          <div className="media-buffering-indicator media-buffering-indicator--source-switch">
            <SpinnerIcon className="media-icon" />
          </div>
        </div>
      : null}

      <BufferingIndicator
        render={(props) => (
          <div {...props} className="media-buffering-indicator">
            <SpinnerIcon className="media-icon" />
          </div>
        )}
      />

      <ErrorDialog.Root>
        <ErrorDialog.Popup className="media-error">
          <div className="media-error__dialog">
            <div className="media-error__content">
              <ErrorDialog.Title className="media-error__title">
                Something went wrong.
              </ErrorDialog.Title>
              <ErrorDialog.Description className="media-error__description" />
            </div>
            <div className="media-error__actions">
              <ErrorDialog.Close className="media-button media-button--primary">
                OK
              </ErrorDialog.Close>
            </div>
          </div>
        </ErrorDialog.Popup>
      </ErrorDialog.Root>

      <Controls.Root className="media-controls">
        <Tooltip.Provider>
          <div className="media-button-group">
            <Tooltip.Root side="top">
              <Tooltip.Trigger
                render={
                  <PlayButton
                    className="media-button--play"
                    render={<Button />}
                  >
                    <RestartIcon className="media-icon media-icon--restart" />
                    <PlayIcon className="media-icon media-icon--play" />
                    <PauseIcon className="media-icon media-icon--pause" />
                  </PlayButton>
                }
              />
              <Tooltip.Popup className="media-tooltip">
                <Tooltip.Label />
                <Tooltip.Shortcut className="media-tooltip__kbd" />
              </Tooltip.Popup>
            </Tooltip.Root>

            <Tooltip.Root side="top">
              <Tooltip.Trigger
                render={
                  <SeekButton
                    seconds={-SEEK_TIME}
                    className="media-button--seek"
                    render={<Button />}
                  >
                    <span className="media-icon__container">
                      <SeekIcon className="media-icon media-icon--seek media-icon--flipped" />
                      <span className="media-icon__label">{SEEK_TIME}</span>
                    </span>
                  </SeekButton>
                }
              />
              <Tooltip.Popup className="media-tooltip">
                <Tooltip.Label />
                <Tooltip.Shortcut className="media-tooltip__kbd" />
              </Tooltip.Popup>
            </Tooltip.Root>

            <Tooltip.Root side="top">
              <Tooltip.Trigger
                render={
                  <SeekButton
                    seconds={SEEK_TIME}
                    className="media-button--seek"
                    render={<Button />}
                  >
                    <span className="media-icon__container">
                      <SeekIcon className="media-icon media-icon--seek" />
                      <span className="media-icon__label">{SEEK_TIME}</span>
                    </span>
                  </SeekButton>
                }
              />
              <Tooltip.Popup className="media-tooltip">
                <Tooltip.Label />
                <Tooltip.Shortcut className="media-tooltip__kbd" />
              </Tooltip.Popup>
            </Tooltip.Root>
          </div>

          <div className="media-time-controls">
            <Time.Group className="media-time-group">
              <Time.Value
                toggle
                type="current"
                className="media-time media-time--current"
              />
              <Time.Separator className="media-time-separator" />
              <Time.Value
                type="duration"
                className="media-time media-time--duration"
              />
            </Time.Group>

            <TimeSlider.Root className="media-slider">
              <TimeSlider.Track className="media-slider__track">
                <TimeSlider.Fill className="media-slider__fill" />
                <TimeSlider.Buffer className="media-slider__buffer" />
              </TimeSlider.Track>
              <TimeSlider.Thumb className="media-slider__thumb" />
              <TimeSlider.Preview className="media-slider__preview">
                <TimeSlider.Value
                  type="pointer"
                  className="media-time media-slider__value"
                />
              </TimeSlider.Preview>
            </TimeSlider.Root>
          </div>

          <div className="media-button-group">
            <VolumePopover />
            <PlaybackRateControl mode={playbackRateControl} />
            <PlaybackSourceControl
              playbackSources={playbackSources}
              selectedPlaybackSourceId={selectedPlaybackSourceId}
              onPlaybackSourceChange={onPlaybackSourceChange}
            />
          </div>
        </Tooltip.Provider>
      </Controls.Root>

      <div className="media-overlay" />

      <Hotkey keys="Space" action="togglePaused" />
      <Hotkey keys="k" action="togglePaused" />
      <Hotkey keys="m" action="toggleMuted" />
      <Hotkey keys="ArrowRight" action="seekStep" value={SEEK_TIME / 2} />
      <Hotkey keys="ArrowLeft" action="seekStep" value={-(SEEK_TIME / 2)} />
      <Hotkey keys="l" action="seekStep" value={SEEK_TIME} />
      <Hotkey keys="j" action="seekStep" value={-SEEK_TIME} />
      <Hotkey keys="ArrowUp" action="volumeStep" value={0.05} />
      <Hotkey keys="ArrowDown" action="volumeStep" value={-0.05} />
      <Hotkey keys="0-9" action="seekToPercent" />
      <Hotkey keys="Home" action="seekToPercent" value={0} />
      <Hotkey keys="End" action="seekToPercent" value={100} />
      <Hotkey keys=">" action="speedUp" />
      <Hotkey keys="<" action="speedDown" />

      <Gesture
        type="tap"
        action="togglePaused"
        pointer="mouse"
        region="center"
      />
      <Gesture type="tap" action="toggleControls" pointer="touch" />
      <Gesture
        type="doubletap"
        action="seekStep"
        value={-SEEK_TIME}
        region="left"
      />
      <Gesture
        type="doubletap"
        action="seekStep"
        value={SEEK_TIME}
        region="right"
      />

      <StatusAnnouncer />
      <div className="media-input-feedback">
        <VolumeIndicator.Root className="media-input-feedback-island media-input-feedback-island--volume">
          <VolumeIndicator.Fill className="media-input-feedback-island__content">
            <VolumeHighIcon className="media-icon media-icon--volume-high" />
            <VolumeLowIcon className="media-icon media-icon--volume-low" />
            <VolumeOffIcon className="media-icon media-icon--volume-off" />
            <div
              className="media-input-feedback-island__progress"
              aria-hidden="true"
            />
            <VolumeIndicator.Value className="media-input-feedback-island__value" />
          </VolumeIndicator.Fill>
        </VolumeIndicator.Root>

        <SeekIndicator.Root className="media-input-feedback-bubble">
          <ChevronIcon className="media-icon media-icon--seek" />
          <SeekIndicator.Value className="media-time" />
        </SeekIndicator.Root>

        <StatusIndicator.Root
          actions={CENTER_STATUS_ACTIONS}
          className="media-input-feedback-bubble"
        >
          <PlayIcon className="media-icon media-icon--play" />
          <PauseIcon className="media-icon media-icon--pause" />
        </StatusIndicator.Root>
      </div>
    </Container>
  );
};

const Button = forwardRef<HTMLButtonElement, ComponentProps<"button">>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={`media-button media-button--subtle media-button--icon ${className ?? ""}`}
      {...props}
    />
  ),
);

Button.displayName = "Button";

const VolumePopover = (): ReactNode => {
  const volumeUnsupported = usePlayer(
    (s) => s.volumeAvailability === "unsupported",
  );

  const muteButton = (
    <MuteButton className="media-button--mute" render={<Button />}>
      <VolumeOffIcon className="media-icon media-icon--volume-off" />
      <VolumeLowIcon className="media-icon media-icon--volume-low" />
      <VolumeHighIcon className="media-icon media-icon--volume-high" />
    </MuteButton>
  );

  if (volumeUnsupported) return muteButton;

  return (
    <Popover.Root openOnHover delay={200} closeDelay={100} side="top">
      <Popover.Trigger render={muteButton} />
      <Popover.Popup className="media-popover media-popover--volume">
        <VolumeSlider.Root
          className="media-slider"
          orientation="vertical"
          thumbAlignment="edge"
        >
          <VolumeSlider.Track className="media-slider__track">
            <VolumeSlider.Fill className="media-slider__fill" />
          </VolumeSlider.Track>
          <VolumeSlider.Thumb className="media-slider__thumb media-slider__thumb--persistent" />
        </VolumeSlider.Root>
      </Popover.Popup>
    </Popover.Root>
  );
};

const PlaybackRateControl = ({
  mode,
}: {
  mode: PlaybackRateControlMode;
}): ReactNode => {
  const playbackRate = usePlaybackRateOptions();

  if (playbackRate?.state.availability !== "available") return null;

  const button = (
    <PlaybackRateButton
      className="media-button--playback-rate"
      disabled={playbackRate.disabled}
      render={<Button />}
    />
  );

  if (mode === "cycle") {
    return (
      <Tooltip.Root side="top">
        <Tooltip.Trigger render={button} />
        <Tooltip.Popup className="media-tooltip">
          <Tooltip.Label />
          <Tooltip.Shortcut className="media-tooltip__kbd" />
        </Tooltip.Popup>
      </Tooltip.Root>
    );
  }

  return (
    <Menu.Root side="top" align="end">
      <Menu.Trigger disabled={playbackRate.disabled} render={button} />
      <Menu.Content className="media-popover media-menu media-menu--playback-rate">
        <Menu.RadioGroup
          className="media-menu__group"
          value={playbackRate.value}
          onValueChange={playbackRate.setValue}
          aria-label="Playback rate"
        >
          {playbackRate.options.map((option) => (
            <Menu.RadioItem
              key={option.value}
              className="media-menu__item"
              value={option.value}
              disabled={option.disabled}
            >
              <span>{option.label}</span>
              <Menu.ItemIndicator
                checked={option.value === playbackRate.value}
                forceMount
                className="media-menu__indicator"
              >
                <CheckIcon className="media-icon" />
              </Menu.ItemIndicator>
            </Menu.RadioItem>
          ))}
        </Menu.RadioGroup>
      </Menu.Content>
    </Menu.Root>
  );
};

const PlaybackSourceControl = ({
  playbackSources,
  selectedPlaybackSourceId,
  onPlaybackSourceChange,
}: {
  playbackSources: MediaPlaybackSource[] | undefined;
  selectedPlaybackSourceId: string | undefined;
  onPlaybackSourceChange: ((sourceId: string) => void) | undefined;
}): ReactNode => {
  if (!playbackSources || playbackSources.length < 2) {
    return null;
  }

  const selectedSourceId = selectedPlaybackSourceId ?? playbackSources[0]?.id;
  const button = (
    <Button
      className="media-button--playback-source"
      aria-label="Playback source"
      title="Playback source"
    >
      <QualityIcon className="media-icon" />
    </Button>
  );

  return (
    <Menu.Root side="top" align="end">
      <Menu.Trigger render={button} />
      <Menu.Content className="media-popover media-menu media-menu--playback-source">
        <Menu.RadioGroup
          className="media-menu__group"
          value={selectedSourceId}
          onValueChange={(sourceId) => onPlaybackSourceChange?.(sourceId)}
          aria-label="Playback source"
        >
          {playbackSources.map((source) => (
            <Menu.RadioItem
              key={source.id}
              className="media-menu__item"
              value={source.id}
            >
              <span>{source.label}</span>
              <Menu.ItemIndicator
                checked={source.id === selectedSourceId}
                forceMount
                className="media-menu__indicator"
              >
                <CheckIcon className="media-icon" />
              </Menu.ItemIndicator>
            </Menu.RadioItem>
          ))}
        </Menu.RadioGroup>
      </Menu.Content>
    </Menu.Root>
  );
};

const isString = (value: unknown): value is string => typeof value === "string";

const isRenderProp = (value: unknown): value is RenderProp<unknown> =>
  typeof value === "function" || isValidElement(value);
