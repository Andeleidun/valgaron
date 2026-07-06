# Web And Mobile Parity Checklist

Use this checklist when changing Valgaron desktop web, mobile web, or native
mobile frontend behavior. Desktop web may optimize for dense Workbench editing,
but mobile web should follow native mobile workflow order unless a browser
capability difference is explicitly documented.

## Parity Debt Ledger

Track each known mismatch until it is fixed, intentionally accepted as a
platform capability difference, or removed from supported scope.

| Debt                              | Root Cause                              | Source Of Truth         | Web Status                                                            | Mobile Status                                                 | Close In | Acceptance Test                                                                         |
| --------------------------------- | --------------------------------------- | ----------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------- |
| In-fiction worlds/planets         | Resolved with shared field descriptors  | README and core model   | Visible workspace workflow                                            | Visible workspace workflow                                    | Closed   | Create/edit/archive/delete/export/import                                                |
| Workspace list/search model       | Resolved with shared feature model      | Core workspace model    | Shared rows and search                                                | Shared rows and search                                        | Closed   | Same row copy, filters, count labels, and hidden counts                                 |
| Workspace section headings        | Resolved with shared feature copy       | Core workspace model    | Shared section headings                                               | Shared section headings                                       | Closed   | Same screen and form heading source                                                     |
| Workspace form field labels       | Resolved with shared draft descriptors  | Core workspace model    | Shared field descriptors                                              | Shared field descriptors                                      | Closed   | Same labels, placeholders, multiline fields                                             |
| Workspace action labels           | Resolved with shared action copy        | Core workspace model    | Shared command labels                                                 | Shared command labels                                         | Closed   | Same command names, destructive wording, and action accessible names                    |
| Relationship source/target        | Resolved with shared descriptors        | Web relationship form   | Selects                                                               | Selects plus supplemental picker rows                         | Closed   | Same control kind and valid options                                                     |
| Relationship status               | Resolved with shared descriptors        | Web relationship form   | Full status select                                                    | Full status select                                            | Closed   | All statuses selectable                                                                 |
| Relationship navigation routes    | Resolved with shared route helpers      | Core relationship model | Shared route helpers                                                  | Shared route helpers                                          | Closed   | Same entry edit and manage-link routes                                                  |
| Entry status/sort/filter controls | Resolved with shared descriptors        | Workbench entry model   | Selects/checks/chips                                                  | Selects/checks/chips                                          | Closed   | Matching control descriptors                                                            |
| Place relationship fields         | Resolved with shared place field model  | Core place taxonomy     | Linked field controls                                                 | Linked field controls                                         | Closed   | Same targets, warnings, lazy expansion, and soft display                                |
| Character logical tree fields     | Resolved with shared character taxonomy | Core character taxonomy | Grouped field controls                                                | Grouped field controls                                        | Closed   | Same category fields, local suggestions, and relationship controls                      |
| Entry notes preview/copy name     | Resolved with mobile editor controls    | Web entry form          | Present                                                               | Present with guarded clipboard feedback                       | Closed   | Same actions and feedback                                                               |
| Data export/import review state   | Resolved with shared Data model         | Core data model         | Shared export/import logic                                            | Shared export/import logic                                    | Closed   | Same export text, preview, and review state                                             |
| Data export workflow copy         | Resolved with shared Data model         | Core data model         | Shared export option copy                                             | Shared export action/status copy                              | Closed   | Same export/share labels and draft prompts                                              |
| Data import copy                  | Resolved with shared Data model         | Core data model         | Shared import copy                                                    | Shared import copy                                            | Closed   | Same import labels, placeholder, actions                                                |
| Data recovery snapshot rows       | Resolved with shared Data model         | Core data model         | Shared recovery row model                                             | Shared recovery row model                                     | Closed   | Same snapshot text, empty state, actions                                                |
| Data reset copy                   | Resolved with shared Data model         | Core data model         | Shared reset copy                                                     | Shared reset copy                                             | Closed   | Same reset title, description, action label                                             |
| Data storage status               | Resolved with shared Data model         | Core data model         | Storage status copy                                                   | Shared storage status copy                                    | Closed   | Same load/save/recovery status semantics                                                |
| Help offline/install limits       | Resolved with shared Help copy          | Core help topics        | Shared offline section                                                | Shared offline section                                        | Closed   | Same install/offline limitation copy                                                    |
| Help section headers/routes       | Resolved with shared Help model         | Core help topics        | Shared section headers, topic routes, and active topic picker         | Shared section headers, topic routes, and active topic picker | Closed   | Same Help labels, focused-topic routes, topic picker, and selected topic state          |
| Route focused workflows           | Resolved with shared route helpers      | Core route intents      | Query/hash routes                                                     | Route focus param and Data scroll target                      | Closed   | Route intent, mobile route, Data focus tests                                            |
| Diagnostics schema                | Resolved with shared diagnostics report | Core diagnostics        | Shared diagnostics export                                             | Shared diagnostics export                                     | Closed   | Shared fixture tests, no content leakage                                                |
| Runtime recovery                  | Resolved with shared recovery copy      | Core recovery model     | Retry/Data/diagnostics                                                | Retry/Data recovery path                                      | Closed   | Same recovery copy and recovery actions                                                 |
| Save status affordance            | Resolved with shared save model         | Web save button/status  | Header Save button                                                    | Overview Save Status section                                  | Closed   | Shared save status model                                                                |
| Large-world mobile behavior       | Resolved with shared mobile budgets     | Shared feature model    | Performance smoke exists                                              | Shared limits with reachability tests                         | Closed   | Records remain findable/editable                                                        |
| Duplicate derivation helpers      | Resolved with shared feature models     | Shared feature layer    | Retired duplicate wrappers                                            | Retired `mobileCodexViewModels`                               | Closed   | Boundary test plus deletion checklist                                                   |
| Mobile web stacked workflow       | Resolved with responsive shell contract | Native mobile flow      | Desktop Workbench at wide widths, stacked mobile web at narrow widths | Native stacked screens                                        | Closed   | Browser smoke asserts Workbench, Timeline, Links, More visible order at 375px and 320px |
| Mobile web route smoke coverage   | Resolved with browser smoke artifacts   | Shared route intents    | Browser mobile viewport screenshots                                   | Native route model tests                                      | Closed   | Workbench, Timeline, Links, More, Knowledge, Data, Workspaces, and Help smoke artifacts |

## Feature Change Checklist

Before merging a frontend feature change, confirm:

1. The source-of-truth behavior is implemented in `@valgaron/core` or the
   shared feature model first.
2. Web and mobile expose the same feature, screen, workflow intent, and control
   kind.
3. Mobile web follows native mobile information order and action labels at
   narrow browser widths.
4. Platform differences are capability differences only, such as download on
   web versus share on mobile.
5. Every visible control has a shared accessible name, state, and validation
   message.
6. Route params, hashes, and focused workflows have matching route-intent tests.
7. Export/import format changes are implemented only in `@valgaron/core`.
8. Diagnostics remain content-safe by default.
9. Large-world behavior keeps every matching record reachable through search,
   pagination, or virtualization.
10. Any old web utility wrapper or mobile view-model helper made obsolete by the
    shared model is deleted or marked with a target removal phase.
11. Schema version changes require a documented product decision; review-only
    Knowledge or vocabulary visibility changes must not create a v3 migration.
12. Project Tools may summarize Review Hotspots that route to existing review
    surfaces. Durable cross-surface triage with assignment, dismissal,
    severity ordering, or progress tracking still requires an intentional
    product decision.
13. Workbench review hotspot routes must preserve the shared `view` parameter
    on web and mobile so users land in the intended review queue, such as
    Unlinked or Needs Review, rather than the default record index.
14. Workbench review hotspot labels and accessible names must include the target
    queue and count on web and mobile without duplicating the same count phrase.
15. Help topic navigation must expose the shared focused-topic list on web and
    mobile, with the active topic visibly selected and announced through
    platform-appropriate selected/current state.

## Standard Workflow

Run this workflow on web and mobile after each parity-significant change:

1. Open the codex.
2. Create or edit a place.
3. Create or edit a character, including category, ancestry, profession, and
   relationship-backed fields, then confirm Workbench selected context shows
   matching review-summary signals on web and mobile.
4. Create or edit an in-fiction world/planet if the feature remains supported.
5. Create a relationship linking the character and place.
6. Save or confirm persisted state.
7. Export full JSON.
8. Import that JSON on the other platform.
9. Confirm the imported document has the same workspaces, entries,
   relationships, in-fiction worlds, custom entry types, appended and reordered
   custom fields, renamed custom field labels, removed custom fields with
   retained hidden values visible in the cleanup queue, and timeline data,
   including event chronology fields, era values, involved-record links, and
   existing relationship summaries.

## Large-World Manual QA

Run this on mobile until rendered large-world automation exists:

1. Load or import a large fixture with more records than the shared mobile
   display limits.
2. Confirm compact review or browsing lists with Show More controls can expand
   and collapse without changing search or filters.
3. Confirm true search/picker caps still show a hidden-count or refinement
   message instead of silently hiding records.
4. Search for a record outside the initial capped list and confirm it can be
   opened and edited.
5. Search relationship source/target pickers for a record outside the initial
   capped list and confirm it can be selected.
6. Filter timeline involved-entry options until a hidden record becomes
   visible, and expand relationship graph nodes when Graph offers Show More.
7. If a screen exceeds the shared scale policy threshold, require pagination,
   virtualization, or a documented rendered-performance review before release.

## Release Gate Additions

Before release, confirm:

- `FRONTEND_PARITY_PLAN.md` still matches active product scope.
- This checklist's debt ledger is updated for every intentional mismatch.
- Shared route-intent tests cover query params, focused hashes, and the mobile
  focus parameter.
- Shared layout-mode tests keep desktop web, mobile web, and native mobile
  explicit.
- Browser smoke covers mobile viewport Workbench, Timeline, Links, More,
  Knowledge, Data, Workspaces, and Help routes without horizontal overflow.
- Shared control descriptor tests cover entry and relationship control kinds,
  accessible labels, and canonical options.
- Timeline editor checks cover chronology field grouping, contextual event
  creation from era and involved-record filters, and saved relationship
  summaries on both browser and mobile.
- Schema/vocabulary changes preserve schema `2` unless a durable v3 product
  decision is documented in the UX plan and schema migration docs.
- Review-summary changes preserve local review surfaces unless a unified
  cross-surface triage workflow is intentionally introduced.
- Browser smoke and mobile route/render tests cover direct Workbench review
  queue routes such as `/entries?view=unlinked`.
- Browser smoke and mobile render tests cover count-bearing Workbench hotspot
  labels and deduplicated accessible names.
- Browser smoke and mobile render tests cover focused Help topic navigation,
  including active Utilities topic state and the Help to Project Tools action.
- `npm test` covers shared data round trips for web-compatible exports.
- `npm test` covers the standard place, character, in-fiction world,
  relationship, save/export/import workflow through shared core helpers.
- `npm run test:mobile` covers mobile export/import parity.
- README, Help, Privacy, web Data UI, and mobile Data UI make matching
  local-only, no-account, no-sync, backup, offline, and storage-risk claims.
- Large-world manual QA has been run for capped mobile lists, expandable review
  and browse lists, relationship pickers, timeline browse, and graph filters.
- Manual web and mobile checks cover Workbench, Timeline, Links, More,
  Knowledge, Workspaces, Data, Help, runtime recovery, and any supported
  in-fiction world workflows.
