# VWorldBuilder

VWorldBuilder is the local browser prototype for the Valgaron World Codex. It is an English-only worldbuilding workspace for drafting and organizing characters, places, factions, lore notes, and timeline events.

## Current Slice

- World overview with section totals and recently updated entries.
- Codex sections for Characters, Places, Factions, Lore, and Timeline.
- Create and edit entries with required names, optional summaries, comma-separated tags, and section-specific fields.
- Markdown-style notes, authoring status, and pinned-entry metadata.
- Archive, restore, duplicate, and permanent-delete controls for entries.
- Read-only entry detail panels for selected records.
- Global search across names, notes, tags, summaries, and configured details.
- Search within each codex section and narrow entries by tag, status, archived state, and updated date.
- Sort section entries by recent update, recent creation, name, or status.
- Timeline events support explicit sort order, era filtering, involved-entry filtering through relationships, and grouped era browsing.
- Archived entries are hidden from normal section browsing unless explicitly shown.
- Pinned entries appear on the overview.
- Rule-based section templates and completeness prompts for underdeveloped records.
- Typed relationships between entries, including source, target, type, status, direction, and notes.
- Relationship panels on entry detail views, plus a Relationships route for add, edit, delete, filter, and graph-style browsing.
- Data route for single-file JSON world backup export, Markdown reference export, validated JSON import preview, and reset-to-seed confirmation.
- Header save status shows whether the latest local browser save attempt succeeded.
- Local seed data for Valgaron.
- Browser `localStorage` persistence under `valgaron.worldDocument.v2`, with migration support for the earlier `valgaron.worldCodex.v1` shape.
- Versioned multi-world document storage with active-world selection in the data model.
- Custom entry type definitions in the world document; the current UI still presents the starter Valgaron sections.
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

The app loads seed data when no saved world document exists or when saved data cannot be parsed as a known document shape. Legacy codex data is migrated into the current versioned world document shape. All edits remain in the current browser profile unless exported or migrated by future work.

Deleting an entry also removes relationships attached to that entry so local graph views do not keep broken links. Archiving an entry keeps it addressable by existing relationships. JSON export produces a complete single-world backup document that can be pasted back into the import preview.

## Prototype Standards

- Keep UI copy hardcoded in English.
- Prefer simple typed React state and small utilities.
- Keep the first screen usable as the codex, not a landing page.
- Preserve ordinary accessibility expectations for forms, navigation, focus states, and responsive layout.
