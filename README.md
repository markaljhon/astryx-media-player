# Astryx Media Player

A simple media player built with React, Vite, and Astryx.

The current app includes:

- a search bar for finding media
- a gallery of mostly video media
- flat and spatial video player surfaces
- provider adapters for local sample media and Stash media

## App Entry

The app should keep startup concerns in `src/main.tsx` and UI composition in `src/App.tsx`.

### `src/main.tsx`

Use this file for bootstrapping only:

- import Astryx base styles
- create the React root
- wrap the app in the active theme provider
- render `<App />`

### `src/App.tsx`

Use this file for top-level composition:

- choose the main shell and layout
- render the page component
- avoid theme/bootstrap logic here

## Project Structure

Current folders for this project:

```txt
src/
  main.tsx
  App.tsx

  layouts/
    AppLayout.tsx
  pages/
    media/
  features/
    media/
      api/
        adapters/
      components/
    players/
      api/
      components/
      SpatialMonoVideoPlayer/
  themes/
    y2k/

public/
scripts/
```

### Where Things Go

- `layouts/` for page shells and structural wrappers
- `pages/media/` for the media library route-level screen
- `features/media/api/` for provider registry, media API facade, and shared media types
- `features/media/api/adapters/` for concrete media providers like local sample data and Stash
- `features/media/components/` for search, gallery cards, and media loading states
- `features/players/api/` for player adapter selection and player-facing contracts
- `features/players/components/` for general player surfaces such as the flat lightbox player
- `features/players/SpatialMonoVideoPlayer/` for the dedicated React Three Fiber spatial player and its feature-specific components
- `themes/y2k/` for the active Astryx theme and icon registry
- `public/` for static browser assets such as the favicon and web manifest
- `scripts/` for local tooling, including Stash maintenance scripts

## Astryx Notes

This project follows the Astryx layout rules:

- use Astryx layout components instead of raw layout `<div>`s
- prefer tokens and component props over hardcoded values
- use `AppShell` for a full-page app
- keep dense media content in rows, lists, or galleries rather than card-wrapping everything
- use `TextInput` for the search field

The current theme lives in `src/themes/y2k/y2kTheme.ts`.

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
