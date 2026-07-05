# Schema Migrations

Valgaron World Codex stores local documents with an explicit schema version.

## Current Schema

- Current world document schema: `2`
- Current storage key: `valgaron.worldDocument.v2`
- Legacy codex storage key: `valgaron.worldCodex.v1`

Schema version `2` supports:

- multiple project/universe workspaces;
- in-fiction worlds and planets inside each workspace;
- custom entry type definitions;
- codex entries grouped by entry type;
- relationships;
- recovery snapshots stored separately.

## Supported Legacy Shape

The earlier `valgaron.worldCodex.v1` shape is migrated into a schema `2`
document with one active workspace named `Migrated Workspace`.

The core schema migration path is covered by
`packages/core/src/worldDocument.test.ts`; browser storage fallback and legacy
load behavior are covered by `src/Utlilities/codexStorage.test.ts`.

## Adding A Future Schema

When adding schema `3` or later:

1. keep the previous parser or migration path until an explicit deprecation
   decision is made;
2. add fixtures for the previous and new schema shapes;
3. add tests for load, import, export, diagnostics, active workspace selection,
   and fallback behavior;
4. update the storage key only when necessary;
5. review service worker cache behavior so stale app code does not strand users
   with a document that requires newer migration logic;
6. document the change in `CHANGELOG.md`, `docs/versioning.md`, and this file.

## Recovery Principle

Invalid or unreadable local storage must not blank the app. The app should load
starter data, explain the recovery state on Data, and encourage JSON export
before risky changes.
