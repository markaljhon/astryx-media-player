import { createRoute, createRouter } from "@tanstack/react-router";
import { IndexRoute } from "./IndexRoute";
import { mediaRoutes } from "./mediaRoutes";
import { rootRoute } from "./rootRoute";

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexRoute,
});

const routeTree = rootRoute.addChildren([indexRoute, mediaRoutes]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
