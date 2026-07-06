# Valgaron World Codex

Valgaron World Codex is a local-first tool for drafting and organizing fiction or tabletop worldbuilding records. It is English-only, web-first, and designed as a polished local personal workspace with a native Expo companion before any hosted account or collaboration features are considered.

## Current Slice

- Workbench overview with section totals, recent records, pinned records,
  review prompts, and selected-record context.
- Codex sections for Characters, Places, Factions, Lore, and Timeline.
- Create and edit entries with required names, optional summaries, comma-separated tags, and section-specific fields.
- Markdown-style notes, authoring status, and pinned-entry metadata.
- Archive, restore, duplicate, and permanent-delete controls for entries.
- Read-only entry detail panels for selected records.
- Global search across names, notes, tags, summaries, and configured details.
- Search within each codex section and narrow entries by tag, status, archived state, and updated date.
- Sort section entries by recent update, recent creation, name, or status.
- Timeline events support explicit sort order, era filtering, era reassignment,
  involved-entry filtering through relationships, grouped era browsing, and
  contextual new-event drafts from active era or involved-record filters.
- Archived entries are hidden from normal section browsing unless explicitly shown.
- Pinned entries appear on the overview.
- Rule-based section templates and completeness prompts for underdeveloped records.
- Typed relationships between entries, including source, target, type, status, direction, and notes.
- Character and place taxonomy artifacts generate runtime field metadata for category-specific editor fields and relationship-backed controls.
- Relationship panels on entry detail views, plus Relationship Studio for
  review, graph browsing, link editing, exact-match cleanup, duplicate
  relationship cleanup, and ad hoc links.
- Relationship diagnostics for broken references, duplicate relationships, and orphaned records, repair/delete actions for broken links, graph filters, graph record search, custom relationship type input, and selectable graph nodes.
- Timeline diagnostics, highlight cards, stable table view, era manager
  reassignment, involved-entry browsing filters, contextual event creation, and
  earlier/later order controls for chronology work.
- Web Data route and mobile Data tab for active-workspace JSON export, full-document JSON export, Markdown reference export, diagnostics, validated JSON import preview, and reset-to-seed confirmation.
- Header Save writes the current session state to browser localStorage on demand.
- Expo mobile companion with local device storage, shared codex schema,
  Workbench, Timeline, Links, More, data import/export, recovery snapshot
  history, and Help guidance.
- Runtime recovery screens with retry and Data access when a web or mobile render failure is caught.
- Local diagnostics export on the Data route or tab with app version, schema version, storage target, recovery state, platform runtime context, and document counts without world content by default.
- Neutral starter sample data.
- Manual browser `localStorage` persistence under `valgaron.worldDocument.v2`, with migration support for the earlier `valgaron.worldCodex.v1` shape.
- Versioned multi-workspace document storage with active project/universe workspace switching in the UI.
- Separate in-fiction world/planet records inside each project/universe workspace.
- Knowledge setup for custom entry type creation, custom field hints such as
  multiline fields and suggested choices, controlled values, lore definition
  types, relationship-backed field rules, observed flexible-value review,
  hidden detail cleanup review, and recovery-snapshotted hidden detail clearing.
- Unsaved-change warnings for entry, relationship, import, workspace management forms, and unsaved document edits before browser reload or close.
- Markdown notes preview, overview quick-create links, copy-name, and duplicate-as-template entry actions.
- In-app Help route for workflow, backup, offline, diagnostics, support, and release-limit guidance, with focused Help links from entry, timeline, relationship, workspace, and data workflows.
- Reset action that loads the neutral starter codex for review before manual Save.

This phase has no accounts, authentication, backend sync, collaboration, sharing, moderation, social discovery, messaging, or high-rigor native parity program.

## Scripts

```bash
npm run dev
npm run format:check
npm test
npm run test:mobile
npm run typecheck
npm run typecheck:mobile
npm run lint
npm run build
npm run build:pages
npm run check:metadata
npm run generate:taxonomies
npm run check:taxonomies
npm run check:audit
npm run mobile:doctor
npm run mobile:e2e
npm run mobile:e2e:android
npm run check:performance
npm run check:pwa
npm run check
npm run check:browser
npm run check:release
```

`npm test` runs the focused Jest suite for codex utilities and local storage behavior. `npm run test:mobile` runs the mobile-focused Jest tests. `npm run typecheck` runs TypeScript project-reference checking with `tsc -b --noEmit`. `npm run typecheck:mobile` checks the Expo workspace. `npm run build` runs TypeScript build mode and Vite together. `npm run build:pages` also prepares the GitHub Pages route fallback. `npm run check:metadata` verifies that in-app version metadata matches `package.json`. `npm run generate:taxonomies` refreshes the generated place and character taxonomy metadata from the JSON planning artifacts. `npm run check:taxonomies` fails when generated taxonomy files drift from those artifacts. `npm run check:audit` runs the runtime audit and fails on new unreviewed findings while allowing the known Expo CLI/config tooling issue that currently has no SDK-compatible fix. `npm run mobile:doctor` runs Expo Doctor from the mobile workspace so web-only tooling versions do not pollute the Expo SDK checks; it skips the optional React Native Directory lookup and treats network-only Expo API failures as warnings so local compatibility checks still run in restricted environments. `npm run mobile:e2e` and `npm run mobile:e2e:android` run the local Android Maestro flow suite against an attached emulator or device and are intentionally separate from `npm run check`. `npm run check:performance` runs the large-world performance smoke test against a synthetic 2,500-entry, 5,000-relationship workspace. `npm run check:pwa` validates the built manifest, service worker, install icons, metadata, and Pages fallback. `npm run check` runs format checking, lint, web and mobile typechecks, metadata consistency, taxonomy drift checks, Jest, and production build. `npm run check:browser` starts a temporary local Vite server, checks key route text through a headless Chromium browser, verifies the phone-width header actions and Data Menu layout, and writes responsive screenshots under `.tmp/browser-smoke`. `npm run check:release` runs the core gate, runtime audit, mobile Expo Doctor, PWA artifact gate, and browser smoke gate. The browser smoke gate expects Chrome, Edge, or Chromium; set `VWB_BROWSER_PATH` if the browser is installed in a custom location. Vite may warn or fail on Node versions below its supported range; upgrade Node before treating that as an application code failure.

## GitHub Pages

This repository is configured to publish through GitHub Pages at:

```text
https://andeleidun.github.io/valgaron/
```

The deployment workflow is `.github/workflows/pages.yml`. It runs on pushes to
`main` and manual workflow dispatch, builds with `VITE_BASE_PATH=/valgaron/`,
prepares the `404.html` fallback for React Router routes, verifies the PWA
artifact, and deploys the `dist` directory with GitHub's Pages Actions.

In GitHub repository settings, set **Pages > Build and deployment > Source** to
**GitHub Actions**. The next push to `main` or manual run of **Deploy GitHub
Pages** will publish the site.

## Local Data

The app loads neutral starter data when no saved world document exists or when saved data cannot be parsed as a known document shape. Legacy codex data is migrated into the current versioned world document shape. When saved data is unreadable or invalid, the Data route shows the recovery status and local storage issues instead of silently hiding the fallback. Web edits remain in the current browser session until the header Save button writes them to localStorage; mobile edits save to device storage through the Expo app. Local data remains in the current browser profile or device storage area unless exported by the user.

Deleting an entry also removes relationships attached to that entry so local graph views do not keep broken links. Archiving an entry keeps it addressable by existing relationships. Active-workspace JSON export produces a focused backup for the current project/universe workspace. Full-document JSON export produces a backup containing every local workspace, in-fiction world/planet record, custom entry type, entry, and relationship. Both JSON backup shapes include export metadata and can be pasted back into the import preview.

Local storage is not a cloud backup. Export JSON backups regularly, especially before clearing browser data, switching browsers, or changing devices. The app also keeps local recovery snapshots before import, reset, permanent entry delete, relationship delete, workspace delete, in-fiction world/planet delete, custom entry type delete, and selected recovery snapshot restore actions; those snapshots stay in the same browser profile or device storage area and are not a replacement for downloaded JSON backups.

Diagnostics are local-only JSON reports for debugging storage or rendering failures. They include counts, status messages, app/schema version, storage target, recovery state, and platform runtime context such as web route/browser or mobile device-save state where available. They intentionally exclude workspace names, entry names, summaries, notes, tags, relationship notes, and ids by default. Use `docs/qa/runtime-recovery.md` for manual corrupt-storage, failed-write, import-rejection, and render-recovery checks.

## Documentation

- `docs/user-guide.md` explains core concepts, everyday workflows, local data, exports, imports, snapshots, offline use, diagnostics, and release limits.
- `docs/support.md` explains how to report issues without sharing world content by default.
- `PRIVACY.md` explains local browser storage, diagnostics, and what the app does not collect.
- `docs/security-privacy.md` documents import safety, Markdown safety, diagnostics scope, static-host header limitations, and dependency review.
- `docs/deployment/static-hosting.md` explains GitHub Pages and PWA deployment behavior.
- `docs/versioning.md` defines release, schema, and dependency update expectations.
- `docs/release/versioning-and-maintenance.md` is the release operations playbook.
- `docs/release/schema-migrations.md` records current and legacy saved-document schema expectations.
- `docs/qa/manual-release-checklist.md` and `docs/qa/runtime-recovery.md` cover manual release and recovery checks.
- `docs/qa/mobile-maestro.md` covers local Android Maestro E2E setup and runs.
- `PLACE_RELATIONSHIP_TREE.md` explains the place logical tree and relationship-backed place fields.
- `PLACE_TREE_IMPLEMENTATION_PLAN.md` records the place taxonomy implementation plan and completed work.
- `CHARACTER_RELATIONSHIP_TREE.md` explains the character logical tree, including creator-defined ancestry/profession fields and relationship-backed fields.
- `CHARACTER_TREE_IMPLEMENTATION_PLAN.md` records the character taxonomy implementation plan, completed slices, review findings, and remaining opportunities.
- `CHANGELOG.md` records release notes.

## Prototype Standards

- Keep UI copy hardcoded in English.
- Prefer simple typed React state and small utilities.
- Keep the first screen usable as the codex, not a landing page.
- Preserve ordinary accessibility expectations for forms, navigation, focus states, and responsive layout.
