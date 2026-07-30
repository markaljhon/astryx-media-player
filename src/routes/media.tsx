import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import {
  mediaSearchDefaults,
  validateMediaSearch,
} from "@/features/media/routing/mediaSearch";
import { MediaRouteLayout } from "@/layouts/MediaRouteLayout";

export const Route = createFileRoute("/media")({
  validateSearch: validateMediaSearch,
  search: {
    middlewares: [stripSearchParams(mediaSearchDefaults)],
  },
  component: MediaRouteLayout,
});
