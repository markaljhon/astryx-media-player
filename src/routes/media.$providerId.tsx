import { createFileRoute } from "@tanstack/react-router";
import { MediaProviderRoutePage } from "@/pages/media/MediaProviderRoutePages";

export const Route = createFileRoute("/media/$providerId")({
  component: MediaProviderRoutePage,
});
