# Web And Mobile Parity Checklist

Use this checklist when changing Valgaron web or mobile frontend behavior. Web
is the current workflow source of truth unless a platform capability difference
is explicitly documented.

## Parity Debt Ledger

Track each known mismatch until it is fixed, intentionally accepted as a
platform capability difference, or removed from supported scope.

| Debt                              | Root Cause                             | Source Of Truth        | Web Status                 | Mobile Status                            | Close In | Acceptance Test                             |
| --------------------------------- | -------------------------------------- | ---------------------- | -------------------------- | ---------------------------------------- | -------- | ------------------------------------------- |
| In-fiction worlds/planets         | Resolved with shared field descriptors | README and core model  | Visible workspace workflow | Visible workspace workflow               | Closed   | Create/edit/archive/delete/export/import    |
| Workspace list/search model       | Resolved with shared feature model     | Core workspace model   | Shared rows and search     | Shared rows and search                   | Closed   | Same row copy, filters, and hidden counts   |
| Workspace section headings        | Resolved with shared feature copy      | Core workspace model   | Shared section headings    | Shared section headings                  | Closed   | Same screen and form heading source         |
| Workspace form field labels       | Resolved with shared draft descriptors | Core workspace model   | Shared field descriptors   | Shared field descriptors                 | Closed   | Same labels, placeholders, multiline fields |
| Workspace action labels           | Resolved with shared action copy       | Core workspace model   | Shared command labels      | Shared command labels                    | Closed   | Same command names and destructive wording  |
| Relationship source/target        | Resolved with shared descriptors       | Web relationship form  | Selects                    | Selects plus supplemental picker rows    | Closed   | Same control kind and valid options         |
| Relationship status               | Resolved with shared descriptors       | Web relationship form  | Full status select         | Full status select                       | Closed   | All statuses selectable                     |
| Entry status/sort/filter controls | Resolved with shared descriptors       | Web section page       | Selects/checks/chips       | Selects/checks/chips                     | Closed   | Matching control descriptors                |
| Entry notes preview/copy name     | Resolved with mobile editor controls   | Web entry form         | Present                    | Present with guarded clipboard feedback  | Closed   | Same actions and feedback                   |
| Data export/import review state   | Resolved with shared Data model        | Core data model        | Shared export/import logic | Shared export/import logic               | Closed   | Same export text, preview, and review state |
| Data export workflow copy         | Resolved with shared Data model        | Core data model        | Shared export option copy  | Shared export action/status copy         | Closed   | Same export/share labels and draft prompts  |
| Data import copy                  | Resolved with shared Data model        | Core data model        | Shared import copy         | Shared import copy                       | Closed   | Same import labels, placeholder, actions    |
| Data recovery snapshot rows       | Resolved with shared Data model        | Core data model        | Shared recovery row model  | Shared recovery row model                | Closed   | Same snapshot text, empty state, actions    |
| Data reset copy                   | Resolved with shared Data model        | Core data model        | Shared reset copy          | Shared reset copy                        | Closed   | Same reset title, description, action label |
| Data storage status               | Resolved with shared Data model        | Core data model        | Storage status copy        | Shared storage status copy               | Closed   | Same load/save/recovery status semantics    |
| Help offline/install limits       | Resolved with shared Help copy         | Core help topics       | Shared offline section     | Shared offline section                   | Closed   | Same install/offline limitation copy        |
| Route focused workflows           | Hash/query handling can drift          | Core route intents     | Query/hash routes          | Route focus param and Data scroll target | Phase 2  | `routeIntents` and `mobileRoutes` tests     |
| Diagnostics schema                | Platform runtime contexts diverge      | Core diagnostics       | Local diagnostics adapter  | Mobile export diagnostics                | Phase 1  | Shared fixture tests, no content leakage    |
| Runtime recovery                  | Separate fallback components           | Web fallback behavior  | Rich context and Data path | Retry/Data fallback                      | Phase 4  | Same recovery actions                       |
| Save status affordance            | Resolved with shared save model        | Web save button/status | Header Save button         | Overview Save Status section             | Closed   | Shared save status model                    |
| Large-world mobile behavior       | Mobile truncates lists manually        | Shared feature model   | Performance smoke exists   | Limits without shared budgets            | Phase 7  | Records remain findable/editable            |
| Duplicate derivation helpers      | Migration wrappers and mobile models   | Shared feature layer   | `src/Utlilities` wrappers  | `mobileCodexViewModels`                  | Phase 4+ | Import-boundary/deletion checklist          |

## Feature Change Checklist

Before merging a frontend feature change, confirm:

1. The source-of-truth behavior is implemented in `@valgaron/core` or the
   shared feature model first.
2. Web and mobile expose the same feature, screen, workflow intent, and control
   kind.
3. Platform differences are capability differences only, such as download on
   web versus share on mobile.
4. Every visible control has a shared accessible name, state, and validation
   message.
5. Route params, hashes, and focused workflows have matching route-intent tests.
6. Export/import format changes are implemented only in `@valgaron/core`.
7. Diagnostics remain content-safe by default.
8. Large-world behavior keeps every matching record reachable through search,
   pagination, or virtualization.
9. Any old web utility wrapper or mobile view-model helper made obsolete by the
   shared model is deleted or marked with a target removal phase.

## Standard Workflow

Run this workflow on web and mobile after each parity-significant change:

1. Open the codex.
2. Create or edit a place.
3. Create or edit a character.
4. Create or edit an in-fiction world/planet if the feature remains supported.
5. Create a relationship linking the character and place.
6. Save or confirm persisted state.
7. Export full JSON.
8. Import that JSON on the other platform.
9. Confirm the imported document has the same workspaces, entries,
   relationships, in-fiction worlds, custom entry types, and timeline data.

## Release Gate Additions

Before release, confirm:

- `FRONTEND_PARITY_PLAN.md` still matches active product scope.
- This checklist's debt ledger is updated for every intentional mismatch.
- Shared route-intent tests cover query params, focused hashes, and the mobile
  focus parameter.
- Shared control descriptor tests cover entry and relationship control kinds,
  accessible labels, and canonical options.
- `npm test` covers shared data round trips for web-compatible exports.
- `npm run test:mobile` covers mobile export/import parity.
- Manual web and mobile checks cover Entry, Relationship, Workspace, Data, Help,
  runtime recovery, and any supported in-fiction world workflows.
