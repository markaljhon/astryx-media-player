# AGENTS.md

Project-specific guidance for AI coding agents.

## Folder Structure Reference

- `src/main.tsx` handles bootstrapping, Astryx style imports, theme provider setup, and rendering TanStack `RouterProvider`.
- `src/router.tsx` creates the TanStack router from the generated route tree; keep route modules under `src/routes/`.
- `src/routes/` contains TanStack file-based route modules only. Keep shared route helpers, layout shells, and access state outside this folder so they are not generated as routes.
- Section layout routes own their Astryx `AppShell` configuration directly; use one layout route per app section when different pages need different side navs.
- `src/pages/media/` contains route-level media library screens.
- `src/features/media/api/` contains the media API facade, provider registry, shared media types, and provider adapters under `api/adapters/`.
- `src/features/media/components/` contains media search, gallery cards, and loading states.
- `src/features/players/api/` contains player adapter selection and player-facing contracts.
- `src/features/players/components/` contains general player surfaces. Keep dedicated spatial-player internals in `src/features/players/SpatialMonoVideoPlayer/`.
- `src/themes/y2k/` contains the active Astryx theme and icon registry.
- `scripts/` contains local maintenance tooling, including Stash scripts.

## Video.js Reference

- Use the Video.js v10 React docs index as the source of truth before changing player code: https://videojs.org/docs/framework/react/llms.txt
- Any docs page in that index can be loaded as markdown by appending `.md`, for example `https://videojs.org/docs/framework/react/reference/create-player.md`.
- This project uses `@videojs/react`, not the legacy v8 `video.js` player API. Prefer the v10 React model: `createPlayer({ features })` creates `Player.Provider`, `Player.Container`, typed hooks, and the player store boundary.
- For video players, start from the `@videojs/react/video` preset docs (`Video`, `videoFeatures`, skins such as `MinimalVideoSkin`) unless a custom feature set is already established in the surrounding code.
- When editing custom controls, hooks, media attachment, or features, consult the matching docs from the index first (`ui-components`, `create-player`, `use-player`, `use-media-attach`, feature references, and component references).
- Use arrow-function constants for all JavaScript and TypeScript functions, including React components, helpers, callbacks, and script entry points. TypeScript function contracts should use property signatures such as `run: () => void`.
- Keep custom SpatialMonoVideoPlayer React components and local helper functions as arrow-function constants.

<!-- ASTRYX:START -->
Astryx v0.1.7 · 150 components
CLI: run every command as `bunx astryx <cmd>` (shown below as `astryx ...`).

SETUP (once, in your app entry e.g. main.tsx) — without these, components render unstyled:
  import "@astryxdesign/core/reset.css";
  import "@astryxdesign/core/astryx.css";

WORKFLOW — discover, don't guess. Before writing UI:
1. `astryx build "<idea>"` — START HERE: returns a kit (closest [page] + [block]s + [component]s). No args = full playbook.
2. `astryx template <name> [--skeleton]` — scaffold the [page]/[block]s it named, or study their layout. Templates are reference code.
3. `astryx component <Name>` — props + examples for every component you use.

RULES:
- No <div> — components do all layout/spacing. Full page → AppShell; sidebar nav → SideNav.
- Frame first: pick the shell (AppShell / Layout+LayoutPanel) and budget regions in px BEFORE writing content (`astryx docs layout`).
- Dense data = rows (Table, List/Item) edge-to-edge — never Card-wrapped list items. Card = dashboard widgets, galleries, settings groups only.
- Status → StatusDot/Token; Badge only for counts and enumerated states, never decoration.
- Custom styling: component props first; else style/className with tokens — var(--color-*|--spacing-*|--radius-*). No raw hex/px. (No StyleX/Tailwind compiler here — don't use xstyle/utility classes.)
- Tokens for every value (`astryx docs tokens`). Brand/accent via `astryx theme` — never override --color-* in :root.
- SELF-CHECK before you finish: re-read the file and replace any raw <div>/<span> layout, imported .css/@apply, or hardcoded value (#hex, 16px) with the component or a token (var(--color-*|--spacing-*|…)). If unsure a component/prop exists, run `astryx component <Name>` / `astryx search "<thing>"`; don't hand-roll CSS.

MORE CLI:
  search "<query>"   find any component / hook / doc / template / block
  component --list   150 components by category
  template --list    page + block recipes
  docs <topic>       color, elevation, icons, illustrations, internationalization, layout, migration, motion, principles, shape, spacing, styling, theme, tokens, typography
  swizzle <Name>     eject component source for deep customization
  upgrade --apply    run after any @astryxdesign/core bump
<!-- ASTRYX:END -->
