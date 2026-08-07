# Astryx Media Player

A simple media player built with React, Vite, and Astryx.

The current app includes:

- a search bar for finding media
- a gallery of mostly video media
- a standalone protected gallery prototype with footer navigation
- flat and spatial video player surfaces
- provider adapters for local sample media and Stash media

## App Entry

The app should keep startup concerns and the router mount in `src/main.tsx`.

### `src/main.tsx`

Use this file for bootstrapping only:

- import Astryx base styles
- create the React root
- wrap the app in the active theme provider
- render `RouterProvider`

File-based route modules live under `src/routes/`; router setup lives in
`src/router.tsx`.

## Project Structure

Current folders for this project:

```txt
src/
  main.tsx
  router.tsx

  layouts/
    MediaSideNav.tsx
    ProtectedAppShell.tsx
  routes/
    __root.tsx
    gallery.tsx
    index.tsx
    media.tsx
    media.$providerId.tsx
    media.index.tsx
    media.player.$sceneId.tsx
  features/
    auth/
      access.ts
    theme/
    media/
      api/
        adapters/
      components/
      routing/
    players/
      api/
      DefaultVideoPlayer/
      components/
      SpatialMonoVideoPlayer/
  themes/
    astryx/

public/
scripts/
```

### Where Things Go

- `layouts/` for protected route layout wrappers and section navigation
- `routes/` for TanStack file-based route modules only, including the standalone `/gallery` prototype
- `features/auth/` for access-mode session state and password routing helpers
- `pages/media/` for the media library route-level screen
- `features/media/api/` for provider registry, media API facade, and shared media types
- `features/media/api/adapters/` for concrete media providers like local sample data and Stash
- `features/media/components/` for search, gallery cards, and media loading states
- `features/media/routing/` for media route search-param validation and defaults
- `features/players/api/` for player adapter selection and player-facing contracts
- `features/players/DefaultVideoPlayer/` for the conventional flat-video player entry point
- `features/players/components/` for shared player controls, dialogs, features, and gestures
- `features/players/SpatialMonoVideoPlayer/` for the dedicated React Three Fiber spatial player and its feature-specific components
- `features/theme/` for theme-mode state and the app-level Astryx theme provider
- `themes/astryx/` for the active custom Astryx theme
- `public/` for static browser assets such as the favicon and web manifest
- `scripts/` for local tooling, including Stash maintenance scripts

## Astryx Notes

This project follows the Astryx layout rules:

- use Astryx layout components instead of raw layout `<div>`s
- prefer tokens and component props over hardcoded values
- use `AppShell` for a full-page app
- keep dense media content in rows, lists, or galleries rather than card-wrapping everything
- use `TextInput` for the search field

The current custom theme lives in `src/themes/astryx/astryxTheme.ts`.

## Routing

This project uses TanStack Router file-based routing through
`@tanstack/router-plugin`.

- `src/router.tsx` creates the router from `src/routeTree.gen.ts` and registers
  the router type.
- `src/routes/__root.tsx` owns the root route and renders only `<Outlet />`.
- `src/routes/media.tsx` owns the media layout route, protected app shell, media
  side nav, and shared media search-param validation.
- `src/routes/gallery.tsx` owns the protected standalone gallery prototype,
  including its search field and footer navigation.
- Leaf route modules such as `src/routes/media.$providerId.tsx` and
  `src/routes/media.player.$sceneId.tsx` should stay small and delegate UI to
  pages or feature components.
- Shared route helpers belong outside `src/routes/`; files in `src/routes/`
  are treated as route modules by the generator.
- `AppShell` belongs in section layout routes or full-screen route pages, not in
  the root route.
- Full-screen routes that should not have navigation can render their own shell
  or content directly from a route component.

Media library routes validate and own these URL search parameters:

```txt
q        media search text
tags     additional selected tag names
vr       whether the default VR tag filter is enabled
page     current gallery page
pageSize current gallery page size
```

The standalone `/gallery` route also owns a `providerId` search parameter so the
prototype can switch between registered providers without changing routes.

Current routes:

```txt
/                    password entry
/gallery             standalone protected gallery prototype
/media               Stash media library
/media/$providerId   provider-backed media library, for example stash or local
/media/player/$sceneId spatial Stash scene player
```

## Media provider adapters

Media providers register themselves from `src/features/media/api/mediaApi.ts`.
The registry defaults to the `local` provider, and route loaders call
`fetchMediaList`, `fetchMediaItem`, `fetchMediaTags`, or `fetchAllMediaTags`
instead of importing concrete adapters directly.

Provider adapters should return normalized `MediaItem` objects with browser-safe
URLs. Paginated list requests return `{ items, page, pageSize, totalItems }`.
Tag filters are resolved by name or id; when a tag cannot be resolved for Stash,
the request intentionally includes a missing tag id so the result set is empty
rather than silently broad.

## Player selection

The player adapter list lives in `src/features/players/api/videoPlayerAdapters.tsx`.
Spatial playback is selected when a video item has a non-flat
`videoProjection`, or when the title, description, or tags include spatial cues
such as `VR`, `VR180`, `VR360`, `3D`, `SBS`, `side-by-side`, `top-bottom`, or
`over-under`. Other playable video items fall back to the default flat player.

Both flat and spatial players normalize `playbackSources` so the requested `src`
is always present. HLS sources are routed through `HlsJsVideo`; direct MP4/WebM
sources use the standard `Video` preset.

## Flat video controls

The conventional flat-video player uses the custom `DefaultVideoSkin`. In
addition to its playback, seek, volume, and playback-rate controls, the video
supports:

- two-finger pinch and pan on touch devices
- pointer-focused mouse-wheel or trackpad zoom
- middle-mouse drag to pan while zoomed

Zoom and pan ignore interactive controls and stay bounded to the visible video
area. Letterboxed video can zoom beyond the configured cap when needed to cover
the player viewport.

## Spatial video controls

The spatial mono player renders video onto a React Three Fiber sphere and uses
the custom `SpatialMonoVideoSkin`. It supports:

- pointer drag to look around within bounded pitch and yaw
- mouse wheel or touch pinch to adjust camera FOV
- center-region double tap followed by a vertical drag to adjust camera height
- source switching through the same normalized playback-source model as the
  flat player

Camera orientation, FOV, and height reset when the selected source URL changes.

## Code Style

- use arrow-function constants for all JavaScript and TypeScript functions
- export components, helpers, and script entry points as `const` arrow functions
- use arrow-shaped TypeScript function properties instead of method signatures

## Development

Common scripts:

```bash
npm run dev
npm run build
npm run lint
npm run stash:tag-vr
```

## Stash media provider

The `stash` media provider loads the latest VR-tagged scenes from a Stash
GraphQL endpoint. For local development, configure Vite to proxy Stash requests
and inject the API key server-side:

```bash
STASH_SERVER_URL=http://localhost:9999
STASH_API_KEY=your-stash-api-key
VITE_STASH_GRAPHQL_ENDPOINT=/stash/graphql
```

Use it with `fetchMediaList({ providerId: "stash" })`. Scene durations from
Stash (seconds) are converted to the app's `durationMs` field. The app defaults
to `/stash/graphql`, so `VITE_STASH_GRAPHQL_ENDPOINT` is optional unless you want
to point it somewhere else. Restart the Vite dev server after editing
`.env.local`.

Do not put the Stash API key in a `VITE_` variable. Vite exposes `VITE_`
variables to the browser, while `STASH_API_KEY` is only read by the local dev
server proxy. The Vite proxy can fall back to older `VITE_STASH_*` values during
migration, but the app no longer reads the API key from client code.

The `local` provider contains bundled catalog entries for development,
including the Mux-hosted `highest.mp4` flat-video sample used to exercise the
default player.
