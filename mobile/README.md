# Valgaron Mobile

Valgaron Mobile is a local-first Expo companion for the browser World Codex
prototype. It keeps the same world document model and visual language while
using compact native tabs for repeated editing on a phone.

- It stores the active world document on the current device with AsyncStorage.
- It uses the same shared codex schema and seed data as the web prototype.
- It stays local to the current device and does not add remote or account-based workflows.
- The main tabs are Workbench, Timeline, Links, and More.
- Workbench supports browsing, search, editing, custom sections, and archived
  records.
- Timeline keeps chronology browsing, expandable dense era groups, event
  ordering, era filters, era reassignment, involved records, contextual
  new-event drafts, and review actions in a dedicated tab.
- Links supports relationship editing, broken-link repair, duplicate
  relationship cleanup, orphan diagnostics, graph filters, graph record search,
  and selected record context.
- More opens the Project Tools hub, Knowledge setup, project/universe
  workspaces, Data, and Help, with expandable compact summaries for dense
  schema and workspace lists.
- Knowledge setup covers custom entry type management, custom field hints such
  as multiline fields and suggested choices, controlled values, lore definition
  types, observed flexible values, and relationship-backed field rules.
- Data supports JSON import/export, Markdown reference export, diagnostics,
  reset, and selected recovery snapshot restore or delete.
- Help keeps focused entry, timeline, relationship, workspace, local-device,
  backup, diagnostics, support, and release-limit guidance available.

Run from the repository root after installing workspace dependencies:

```bash
npm run start --workspace @valgaron/mobile
npm run test:mobile
npm run typecheck:mobile
npm run mobile:doctor
```

Native device interaction coverage starts with the Android Maestro harness. See
[`docs/qa/mobile-maestro.md`](../docs/qa/mobile-maestro.md) for Maestro
installation, E2E reset, build/install, and run instructions.
