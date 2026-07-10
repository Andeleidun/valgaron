# Valgaron Mobile

Valgaron Mobile is a local-first Expo companion for the browser World Codex
prototype. It keeps the same world document model and visual language while
using compact native tabs for repeated editing on a phone.

- It stores the active world document in the installed app's local storage area
  with AsyncStorage.
- It uses the same shared codex schema and seed data as the web prototype.
- It stays local to the current device and does not add remote or account-based workflows.
- Uninstalling the app can remove local data; use ZIP export when uploaded
  images must be included in a portable backup.
- The main tabs are Workbench, Timeline, Links, and More.
- Workbench supports browsing, search, editing, custom sections, archived
  records, and selected-record review summaries.
- Timeline keeps chronology browsing, expandable dense era groups, event
  ordering, grouped event editing, era filters, era reassignment,
  relationship-backed involved records, existing relationship summaries,
  contextual new-event drafts, and review actions in a dedicated tab.
- Links supports relationship editing, broken-link repair, duplicate
  relationship cleanup, orphan diagnostics, graph filters, graph record search,
  and selected record context.
- More opens the Project Tools hub, Knowledge setup, project/universe
  workspaces, Data, and Help, with top-level tool shortcuts and expandable
  compact summaries for dense schema and workspace lists.
- More also shows Review Hotspots that route to existing Workbench, Timeline,
  Links, and Knowledge cleanup surfaces when review signals are present.
- Workbench review hotspot links preserve shared queue routes such as
  `/entries?view=unlinked`, so mobile opens the same review target as the
  browser instead of the default Workbench index.
- Knowledge setup covers custom entry type management, field configuration for
  labels, help text, visibility, order, vocabulary attachment, and
  suggested/restricted vocabulary behavior, searchable field settings, durable
  vocabulary value editing/search with aliases, lore definition types, and
  relationship-backed field rules.
- Data supports JSON import/export, Markdown reference export, diagnostics,
  reset, and selected recovery snapshot restore or delete.
- Help keeps focused entry, timeline, relationship, workspace, local-device,
  backup, diagnostics, support, and release-limit guidance available, with a
  topic picker that marks the active focused topic.

Run from the repository root after installing workspace dependencies:

```bash
npm run start --workspace @valgaron/mobile
npm run test:mobile
npm run typecheck:mobile
npm run mobile:doctor
```

To create a debug APK with its JavaScript bundle embedded (so it does not need
the Expo or Metro development server), run this Windows command from the
repository root:

```powershell
npm run android:apk:debug
```

The APK is written to
`mobile/android/app/build/outputs/apk/debug/app-debug.apk`. The generated
Android project and build artifacts are intentionally ignored by Git.

Native device interaction coverage starts with the Android Maestro harness. See
[`docs/qa/mobile-maestro.md`](../docs/qa/mobile-maestro.md) for Maestro
installation, E2E reset, build/install, and run instructions.
