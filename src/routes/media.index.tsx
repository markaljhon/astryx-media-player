import { createFileRoute } from "@tanstack/react-router";
import { StashMediaRoutePage } from "@/pages/media/MediaProviderRoutePages";

export const Route = createFileRoute("/media/")({
  component: StashMediaRoutePage,
});
