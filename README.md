# Astryx Media Player

A simple media player built with React, Vite, and Astryx.

The first version of the app will focus on:

- a search bar for finding media
- a gallery or list of mostly videos
- a player surface for playback
- a structure that can support different players later

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

## Suggested Structure

Recommended folders for this project:

```txt
src/
  main.tsx
  App.tsx

  layouts/
  pages/
  features/
    media/
    players/
  components/
    ui/
  themes/
  lib/
```

### Where Things Go

- `layouts/` for page shells and structural wrappers
- `pages/` for route-level screens like the media browser
- `features/media/` for search, gallery/list UI, and media-specific logic
- `features/players/` for player adapters and future player types
- `components/ui/` for shared building blocks like empty, loading, and error states
- `themes/` for Astryx theme definitions and icon registries
- `lib/` for shared helpers, API clients, and constants

## Astryx Notes

This project follows the Astryx layout rules:

- use Astryx layout components instead of raw layout `<div>`s
- prefer tokens and component props over hardcoded values
- use `AppShell` for a full-page app
- keep dense media content in rows, lists, or galleries rather than card-wrapping everything
- use `TextInput` for the search field

The current theme lives in `src/themes/y2k/y2kTheme.ts`.

## Development

Common scripts:

```bash
npm run dev
npm run build
npm run lint
```

If you want, I can next propose the exact starter folder tree and the first `main.tsx` / `App.tsx` contents before we change code. 
