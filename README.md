# VWorldBuilder

VWorldBuilder is the local browser prototype for the Valgaron World Codex. It is an English-only worldbuilding workspace for drafting and organizing characters, places, factions, lore notes, and timeline events.

## Current Slice

- World overview with section totals and recently updated entries.
- Codex sections for Characters, Places, Factions, Lore, and Timeline.
- Create and edit entries with required names, optional summaries, comma-separated tags, and section-specific fields.
- Search within each codex section and narrow entries by tag.
- Local seed data for Valgaron.
- Browser `localStorage` persistence under `valgaron.worldCodex.v1`.
- Reset action that restores the seed codex in local storage.

This phase has no accounts, authentication, backend sync, collaboration, sharing, moderation, social discovery, messaging, or native/mobile parity target.

## Scripts

```bash
npm run dev
npm test
npm run typecheck
npx vite build
npx eslint .
```

`npm test` runs the focused Jest suite for codex utilities and local storage behavior. `npm run typecheck` runs TypeScript project-reference checking with `tsc -b --noEmit`. `npm run build` runs TypeScript build mode and Vite together. Vite may warn or fail on Node versions below its supported range; upgrade Node before treating that as an application code failure.

## Local Data

The app loads seed data when no saved codex exists or when saved data cannot be parsed as the expected codex shape. All edits remain in the current browser profile unless exported or migrated by future work.

## Prototype Standards

- Keep UI copy hardcoded in English.
- Prefer simple typed React state and small utilities.
- Keep the first screen usable as the codex, not a landing page.
- Preserve ordinary accessibility expectations for forms, navigation, focus states, and responsive layout.
