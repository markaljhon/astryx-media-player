import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  AspectRatio,
  Button,
  Card,
  Center,
  Heading,
  HStack,
  Section,
  Text,
  Token,
  VStack,
} from "@astryxdesign/core";
import type { MediaItem } from "@/types/media";

type MediaGalleryCardProps = {
  item: MediaItem;
  onPlay?: (item: MediaItem) => void;
};

function formatDuration(durationMs?: number) {
  if (typeof durationMs !== "number") {
    return "No duration";
  }

  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getKindTokenColor(kind: MediaItem["kind"]) {
  switch (kind) {
    case "audio":
      return "purple";
    case "playlist":
      return "orange";
    case "video":
    default:
      return "cyan";
  }
}

export function MediaGalleryCard({ item, onPlay }: MediaGalleryCardProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const previewAudioUrl =
    item.previewAudioUrl ?? (item.kind === "audio" ? item.sourceUrl : undefined);
  const hasPreviewVideo = Boolean(item.previewVideoUrl);
  const hasPreviewAudio = Boolean(previewAudioUrl);
  const hasPreviewMedia = hasPreviewVideo || hasPreviewAudio;
  const showPreviewVideo = hasPreviewVideo && isPreviewActive;
  const showPreviewAudio = !showPreviewVideo && hasPreviewAudio && isPreviewActive;
  const canPlay = item.kind === "video" && Boolean(item.sourceUrl) && onPlay;

  useEffect(() => {
    if (!isPreviewActive) {
      return;
    }

    const videoPreview = previewVideoRef.current;
    const previewMedia = videoPreview ?? previewAudioRef.current;

    if (previewMedia) {
      previewMedia.muted = false;
      void previewMedia.play().catch(() => {
        if (videoPreview) {
          // Keep the visual preview moving when audible autoplay is blocked.
          videoPreview.muted = true;
          void videoPreview.play().catch(() => {});
        }
      });
    }

    function handleDocumentPointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !previewRef.current?.contains(event.target)
      ) {
        setIsPreviewActive(false);
      }
    }

    document.addEventListener("pointerdown", handleDocumentPointerDown, true);

    return () => {
      if (previewMedia) {
        previewMedia.pause();
        previewMedia.currentTime = 0;
      }

      document.removeEventListener(
        "pointerdown",
        handleDocumentPointerDown,
        true,
      );
    };
  }, [isPreviewActive, previewAudioUrl]);

  function activatePreview() {
    if (hasPreviewMedia) {
      setIsPreviewActive(true);
    }
  }

  function deactivatePreview() {
    setIsPreviewActive(false);
  }

  function handlePointerEnter(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "touch") {
      activatePreview();
    }
  }

  function handlePointerLeave(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "touch") {
      deactivatePreview();
    }
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") {
      activatePreview();
    }
  }

  function playItem() {
    onPlay?.(item);
  }

  const previewContent = showPreviewVideo ? (
    <video
      ref={previewVideoRef}
      src={item.previewVideoUrl}
      poster={item.thumbnailUrl}
      aria-label={`${item.title} preview`}
      autoPlay
      loop
      playsInline
      preload="metadata"
    />
  ) : showPreviewAudio ? (
    <Section variant="muted" padding={3} height="100%">
      <Center width="100%" height="100%">
        <VStack gap={2} align="center">
          <Token color={getKindTokenColor(item.kind)} label={item.kind} />
          <audio
            ref={previewAudioRef}
            src={previewAudioUrl}
            aria-label={`${item.title} preview`}
            autoPlay
            controls
            loop
            preload="metadata"
          />
        </VStack>
      </Center>
    </Section>
  ) : item.thumbnailUrl ? (
    <img src={item.thumbnailUrl} alt={item.title} />
  ) : (
    <Section variant="muted" padding={3} height="100%">
      <Center width="100%" height="100%">
        <Token color={getKindTokenColor(item.kind)} label={item.kind} />
      </Center>
    </Section>
  );

  return (
    <Card padding={0}>
      <VStack>
        <AspectRatio
          ref={previewRef}
          ratio={16 / 9}
          fit={item.thumbnailUrl || showPreviewVideo ? "cover" : undefined}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onPointerDown={handlePointerDown}
          onPointerCancel={deactivatePreview}
          onFocus={activatePreview}
          onBlur={deactivatePreview}
          tabIndex={hasPreviewMedia ? 0 : undefined}
        >
          {/* {canPlay ? (
            <Overlay
              showOn="hover"
              align="center"
              content={
                <MediaTheme mode="dark">
                  <Button label="Play" variant="primary" onClick={playItem} />
                </MediaTheme>
              }
            >
              {previewContent}
            </Overlay>
          ) : (
            previewContent
          )} */}
          {previewContent}
        </AspectRatio>

        <VStack gap={1} padding={3}>
          <Heading level={4} maxLines={1}>
            {item.title}
          </Heading>
          <Text type="supporting" color="secondary">
            {item.providerId} · {formatDuration(item.durationMs)}
          </Text>
          {item.description ? (
            <Text type="supporting" color="secondary" maxLines={2}>
              {item.description}
            </Text>
          ) : null}
          {item.tags && item.tags.length > 0 ? (
            <HStack gap={1} wrap="wrap">
              {item.tags.slice(0, 3).map((tag) => (
                <Token key={tag} color="gray" label={tag} />
              ))}
            </HStack>
          ) : null}
          {canPlay ? (
            <HStack>
              <Button
                label="Play video"
                variant="secondary"
                onClick={playItem}
              />
            </HStack>
          ) : null}
        </VStack>
      </VStack>
    </Card>
  );
}
