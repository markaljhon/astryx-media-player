import { createFileRoute } from "@tanstack/react-router";
import { MediaPlayerRoutePage } from "@/pages/media/MediaPlayerRoutePage";

export const Route = createFileRoute("/media/player/$sceneId")({
  component: MediaPlayerRoutePage,
});
