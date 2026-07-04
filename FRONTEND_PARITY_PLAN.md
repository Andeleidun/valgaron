# Valgaron Web And Mobile Frontend Parity Plan

## Purpose

This document analyzes the current shared frontend system between the browser web app and the Expo mobile app, then lays out a concrete plan for full feature and user experience behavior parity.

The guiding requirement is low duplication over time. The web app is the more mature experience and should be treated as the source of truth for workflow shape, feature behavior, data semantics, control taxonomy, and copy unless a platform capability requires a deliberate adaptation.

Parity here does not mean pixel equality. It means a user can perform the same workflow on web and mobile, recognize the same screens and controls, make the same choices, trigger the same validations and confirmations, and export/import the same data format interchangeably.

## Executive Summary

The repo already has the most important foundation for parity:

- `@valgaron/core` owns the document schema, seed data, entries, relationships, timeline, workspace operations, import/export, diagnostics, validation, help copy, and shell route metadata.
- `@valgaron/platform` owns a small async string storage abstraction.
- `@valgaron/ui-tokens` owns shared color, spacing, radius, and type tokens.
- The web app and mobile app already consume `@valgaron/core` heavily.
- JSON import/export is already implemented through shared core serializers and parsers.

The main risk is now presentation and orchestration drift:

- Web pages and mobile screens independently compose filters, forms, limits, labels, control types, confirmation flows, and visible sections.
- Mobile has `mobileCodexViewModels.ts`, which repeats a platform-specific view-model layer over core logic rather than sharing that layer with web.
- Web state and mobile state both wire the same core mutations, but they differ in save semantics, validation display, recovery feedback, and action messages.
- Several initial mobile gaps have been closed, including notes preview, copy
  name feedback, relationship source/target selects, full relationship status
  selection, and data interchange contracts. Remaining differences are tracked
  in the debt ledger and feature matrix.
- Some mobile behaviors are not present on web, including list search in Workspaces and Help quick actions.

The recommended path is not a full rewrite into one UI implementation. The lowest-risk, lowest-long-term-duplication approach is:

1. Keep `@valgaron/core` as the pure domain/data package.
2. Add a shared headless feature layer for screen models, workflow state, control descriptors, limits, labels, and parity contracts.
3. Keep platform-specific renderers for DOM and React Native, but make them render the same feature models and control descriptors.
4. Promote the mature web workflows into shared tests and fixture-backed parity specs before changing mobile.
5. Fix critical mobile mismatches against the shared contracts.
6. Add gates so future feature work starts in shared models and fails CI when web/mobile behavior drifts.

Additional review found several gaps that must be treated as first-class parity
work, not follow-up polish:

- In-fiction worlds/planets exist in the shared data model and controller
  methods, and release docs mention the workflow, but current web and mobile
  screens do not appear to expose the create/edit/archive/delete UI.
- Route intent parity is under-specified. Web query/hash routes and mobile Expo
  params must preserve the same workflow intents, including focused import/help
  destinations.
- Accessibility parity needs explicit contracts for labels, focus order,
  keyboard behavior, screen reader roles, dialog behavior, and mobile
  accessibility state.
- Runtime recovery, diagnostics, storage migration, offline/local-storage copy,
  and release evidence need the same parity treatment as normal happy-path
  screens.
- Performance parity for large worlds needs shared budgets and tests so a mobile
  truncation or web-only optimization does not hide a feature mismatch.
- The migration plan needs a retirement path for duplicated utility re-exports
  and mobile-only view models after shared models land.

The improved plan below keeps the original direction but adds explicit root
causes, acceptance criteria, parity debt tracking, and implementation phases for
these missing areas.

## Review Iteration Log

This document should be reviewed iteratively before implementation work begins.
Each review pass must answer whether the issue is still real, why it exists,
what the best path forward is, and what change will close it.

### Iteration 1: Screen And Data Surface Review

Evaluation:

- Still needed. The existing plan covered entries, relationships, workspaces,
  data, overview, and help, but did not separately account for in-fiction
  worlds/planets despite domain and controller support.
- Root cause: the feature was added to shared data/controller code and release
  documentation, but page/screen renderers were not kept in lockstep.
- Best path: add in-fiction worlds/planets to the feature matrix, workflow
  parity target, data fixture requirements, and implementation phases.

Executed in this revision:

- Added a dedicated in-fiction worlds/planets gap and remediation plan.
- Expanded data fixture and workflow parity requirements to include the feature.

### Iteration 2: Governance And Drift Prevention Review

Evaluation:

- Still needed. The original plan said future work should use shared models, but
  did not define enough enforceable contracts for route intents, accessibility,
  storage, runtime recovery, or performance.
- Root cause: the codebase currently has many small independent adapters
  instead of one parity contract that every screen must satisfy.
- Best path: add explicit parity contracts and CI/manual gate expectations for
  each drift-prone category.

Executed in this revision:

- Added contracts for route/deep-link intents, accessibility, recovery,
  storage/migrations, diagnostics, performance, and dependency boundaries.

### Iteration 3: Duplication Retirement Review

Evaluation:

- Still needed. Moving logic into shared feature models is not enough if the old
  mobile view-model and web utility-wrapper layers remain active indefinitely.
- Root cause: compatibility wrappers in `src/Utlilities` and mobile-specific
  view models reduce migration risk, but they can preserve duplicate behavior
  after the shared layer exists.
- Best path: add deletion criteria and import-boundary tests to every phase.

Executed in this revision:

- Added retirement criteria for duplicate helpers, screen-level view models, and
  platform-only derivation code.

## Current Architecture

### Web App

Primary files:

- `src/App.tsx`
- `src/Pages/OverviewPage.tsx`
- `src/Pages/SectionPage.tsx`
- `src/Pages/RelationshipsPage.tsx`
- `src/Pages/WorkspacesPage.tsx`
- `src/Pages/DataPage.tsx`
- `src/Pages/HelpPage.tsx`
- `src/Components/Codex/CodexEntryViews.tsx`
- `src/Utlilities/useWorldDocumentState.ts`

The web app is a React Router application. It opens directly into the codex experience with top navigation, dynamic section routes, a header save button, a header data menu, and route-specific pages.

Web persistence is manual:

- Edits update in-memory React state.
- The header Save button writes the current document to browser `localStorage`.
- Import, reset, delete, and restore operations create recovery snapshots.
- Unsaved changes are surfaced through before-unload warnings and in-page dirty-state UI.

The web app currently has the richer editor and data-management behavior. It should be the UX source of truth.

### Mobile App

Primary files:

- `mobile/app/(tabs)/_layout.tsx`
- `mobile/src/screens/OverviewScreen.tsx`
- `mobile/src/screens/EntriesScreen.tsx`
- `mobile/src/screens/RelationshipsScreen.tsx`
- `mobile/src/screens/WorkspacesScreen.tsx`
- `mobile/src/screens/DataScreen.tsx`
- `mobile/src/screens/HelpScreen.tsx`
- `mobile/src/screens/screenPrimitives.tsx`
- `mobile/src/state/MobileCodexContext.tsx`
- `mobile/src/state/mobileCodexViewModels.ts`
- `mobile/src/state/mobileDataExport.ts`
- `mobile/src/storage/mobileStorage.ts`

The mobile app is an Expo Router tab application. It uses React Native primitives and shared UI tokens. It uses shared core data logic, but most screen composition is handwritten separately from web.

Mobile persistence is automatic:

- Mutations commit to state and asynchronously write to AsyncStorage.
- Destructive actions create recovery snapshots.
- Data export uses share/copy-oriented mobile behavior.
- Import is paste-based and validated through the same core parser.

This auto-save behavior is understandable for a mobile companion, but it creates workflow divergence from web because web has a visible Save affordance and manual save state. For parity, mobile should expose a recognizable Save or Save Status control even if device persistence remains automatic internally.

### Shared Packages

`packages/core` currently owns:

- `types.ts`: `WorldDocument`, `WorldWorkspace`, `WorldEntry`, `WorldRelationship`, section config, recovery snapshots.
- `worldDocument.ts`: schema version, parsing, legacy migration, active world helpers.
- `codexEntries.ts`: entry drafts, entry creation, archive, duplicate, delete, status labels, dates.
- `codexRelationships.ts`: relationship drafts, list filters, graph, health, broken links, orphaned records.
- `codexSearch.ts`: global and section search/filter helpers.
- `codexTimeline.ts`: timeline filtering, grouping, diagnostics, highlights, order updates.
- `workspaceManagement.ts`: workspace and custom entry type operations.
- `codexDataPortability.ts`: full JSON, active JSON, Markdown, diagnostics export options, import validation.
- `draftValidation.ts`: entry, relationship, workspace, world, custom type validation.
- `helpTopics.ts`: help text and topic routes.
- `overview.ts`: overview summaries and highlights.
- `shell.ts`: route ids, route paths, intros, product copy.
- `recoverySnapshots.ts`: snapshot summaries and copy.
- `destructiveActions.ts`: confirmation copy.
- `documentDiagnostics.ts`: diagnostics counts and serialization support.

`packages/platform` currently owns JSON/string storage helpers.

`packages/ui-tokens` currently owns shared color, spacing, radius, and typography tokens.

This split is good, but it stops one layer too early. The next shared layer should not be more domain logic. It should be headless feature and UX behavior.

## Current Parity Strengths

### Data Model And Serialization

The web and mobile apps both use `WorldDocument` with schema version `2`. The import/export functions are centralized in `@valgaron/core`:

- `serializeWorldDocumentBackup`
- `serializeActiveWorldBackup`
- `parseWorldImport`
- `parseWorldDocument`
- `exportWorldToMarkdown`
- `formatWorldImportPreviewText`

This is the strongest part of the parity story. Web data and mobile data should already be structurally interchangeable when exported through the shared functions.

### Core Mutations

Both platforms use shared operations for:

- Entry create/update/archive/delete/duplicate.
- Relationship create/update/delete.
- Relationship delete-on-entry-delete.
- Timeline order updates.
- Workspace create/update/archive/delete/duplicate/switch.
- Custom entry type create/delete.
- In-fiction world/planet create/update/archive/delete domain operations.
- Import, reset, restore, and recovery snapshots.

The mutation code is not perfectly centralized in one controller, but both
platforms call the same domain primitives for exposed workflows. The
in-fiction worlds/planets workflow now uses those shared operations from
visible web and mobile workspace UI, with shared draft field descriptors to
reduce label and control drift.

### Shared Copy And Routing

The core package owns product name, route metadata, screen intros, help topics, export option copy, relationship type options, status options, and destructive action copy. This reduces translation and wording drift.

### Shared Tokens

The mobile screens use `@valgaron/ui-tokens`. The web CSS appears to use the same Valgaron visual language, though it does not yet consume token values as mechanically as mobile does.

## Current Parity Gaps

### Cross-Cutting Gaps

1. Screen model duplication.

   Web pages compute view state directly in page components. Mobile computes similar state in screen components and `mobileCodexViewModels.ts`. There is no shared "entries screen model", "relationships screen model", or "data screen model" consumed by both.

2. Control taxonomy drift.

   The initial audit found several conceptual settings rendered with different
   control types. Entry status/sort/updated filters, entry status/pinned,
   relationship source/target, relationship status/directional, and
   relationship status/type filters are now covered by shared descriptors and
   matching mobile select/checkbox primitives. Remaining control-model work is
   focused on a shared decision for section/tag filters and moving full screen
   models into shared code.

3. Limit and truncation drift.

   Mobile defines separate limits such as:

   - `MOBILE_ENTRY_RESULT_LIMIT = 50`
   - `MOBILE_TIMELINE_GROUP_EVENT_LIMIT = 12`
   - `MOBILE_PICKER_RESULT_LIMIT = 24`
   - `MOBILE_RELATIONSHIP_RESULT_LIMIT = 40`
   - `MOBILE_WORKSPACE_RESULT_LIMIT = 40`

   Web has its own slices for overview search, incomplete records, orphaned entries, and highlights. Some differences may be appropriate for screen size, but the policy should be explicit and shared.

4. Dirty state and confirmation drift.

   Web and mobile both warn before losing drafts, but the logic and copy are implemented separately:

   - `src/Utlilities/unsavedChanges.ts`
   - `mobile/src/screens/mobileUnsavedChanges.ts`
   - `mobile/src/screens/mobileConfirm.ts`

   The platform-specific confirmation mechanism can differ, but the triggers, copy, and expected outcomes should come from shared contracts.

5. Save behavior drift.

   Web uses manual save. Mobile auto-saves every commit. This is acceptable as an implementation detail, but the user workflow should still expose a recognizable save/status concept on mobile so "edit, save, export" is a coherent cross-platform workflow.

6. Feature availability drift.

   Some behaviors exist only on web or only on mobile. Either they should exist on both, or the difference should be explicitly classified as a platform capability adaptation.

7. Route and deep-link drift.

   Web uses React Router paths, query strings, and hashes. Mobile maps shared
   route strings to Expo Router params. The current route helpers cover common
   `entries`, `relationships`, and `help` params, but route hashes such as
   `#import-json-backup` are not represented on mobile. A shared route-intent
   contract is needed so focused workflows behave the same across platforms.

8. Accessibility drift.

   Web has skip links, dialog focus trapping, form labels, and keyboard flows.
   Mobile has React Native accessibility labels, roles, and states in some
   primitives. There is no shared accessibility contract that proves the same
   user-facing controls have the same accessible names, states, destructive
   hints, and error announcements.

9. Runtime recovery drift.

   Web runtime recovery receives active world, document, load status, save
   status, route, and recovery snapshot context. Mobile runtime recovery is a
   simpler retry/Data fallback. The fallback can be laid out differently, but
   both platforms should expose the same recovery choices and content-safe
   diagnostics path.

10. Storage and migration drift.

    Web and mobile use different storage keys and persistence policies. That is
    acceptable, but storage load, corrupt-data recovery, legacy migration,
    snapshot retention, and user-facing copy need shared contracts so data loss
    recovery behaves predictably.

11. Performance drift.

    Web has large-world performance coverage. Mobile uses list truncation limits
    and simple scroll views. Without shared large-world budgets, mobile can
    silently hide records or become unusable while web remains acceptable.

12. Dependency-boundary drift.

    The repo contains web utility wrappers that re-export `@valgaron/core` and
    mobile-specific view models that duplicate shared derivation. These are
    useful during migration but should not become permanent alternate sources of
    truth.

### Overview

Web source behavior:

- Workspace intro.
- Local browser data notice.
- Section count cards.
- Quick create links for every section.
- Global search.
- Recent records.
- Pinned records.
- Incomplete records.

Mobile current behavior:

- Product/load/save header.
- Stats for workspace, entries, relationships, active workspaces.
- Current draft state.
- Global search.
- Start a record.
- Pinned records.
- Recent work.
- Drafting queue.

Gaps:

- Mobile does not show the same section count cards as web.
- Web does not show the same high-level active workspace count and recovery state in the overview.
- Limits differ: web search 8, mobile search 6; web incomplete 6, mobile incomplete 5; web highlight 6, mobile highlight 4.
- Labels differ enough to feel like related but separate screens.

Plan:

- Define one shared `OverviewScreenModel` with sections: workspace summary, local data notice/status, section counts, quick create, global search, recent, pinned, incomplete.
- Allow each renderer to choose layout density, but not omit a section unless the shared model marks it hidden.
- Move all limits to shared constants with platform presentation overrides documented in one place.

### Entries And Section Editing

Web source behavior:

- Direct route per section.
- Section intro and help link.
- Timeline overview with diagnostics, highlights, table, era groups, and move earlier/later.
- Entry list with query, tag chips, status select, sort select, updated-within select, show-archived checkbox.
- Timeline-specific era and involved-entry selects.
- Entry detail panel.
- Entry form with name, summary, notes, notes preview, tags, status select, pinned checkbox, detail fields with suggestions, apply template, duplicate, use as template, copy name, archive/restore, delete.

Mobile current behavior:

- One Entries tab with section button row.
- Query field.
- Status button row.
- Sort button row.
- Tag button row.
- Show archived button.
- Timeline browser with text summaries, filters, groups, diagnostics text.
- Entry list with edit buttons.
- Linked records section.
- Entry form with name, summary, notes, tags, status buttons, pinned button, detail fields, save, new draft, archive/restore, duplicate, use as template, delete, apply template.

Gaps:

- Control types differ for status, sort, show archived, entry status, and pinned.
- Mobile now includes notes preview, copy-name feedback, and detail-field
  suggestions. The next step is to move those editor controls into a shared
  headless entry editor model.
- Mobile section selection is acceptable as a responsive section-navigation adaptation, but should be governed by a shared section nav model.
- Timeline visual density differs. Mobile does not need the same table layout, but it should expose the same diagnostics, highlights, era grouping, order moves, filters, and involved-entry navigation.

Plan:

- Define `EntriesFeatureModel` in the shared feature layer.
- Define the canonical controls:
  - Section: navigation list or segmented selector backed by the same section model.
  - Search: search text field.
  - Status filter: select/picker.
  - Sort: select/picker.
  - Updated filter: select/picker.
  - Tags: selectable chips.
  - Show archived: checkbox/switch.
  - Entry status: select/picker.
  - Pinned: checkbox/switch.
  - Detail fields: text field, textarea, or autocomplete text field based on `WorldDetailField`.
- Add mobile picker/select primitives so mobile can represent web select controls as native picker/modal controls instead of button rows.
- Move notes preview, copy-name state, template application, field suggestions, and selected-entry relationship summary into shared headless model/actions.

### Relationships

Web source behavior:

- Intro and relationship help.
- Relationship health diagnostics cards.
- Broken relationship repair/delete rows.
- Orphaned record summary.
- Relationship editor with source select, target select, type autocomplete/datalist, status select, note textarea, directional checkbox.
- Relationship list with search, type select, entry select, edit/delete.
- Graph view with section/status/tag/type selects, clear filters, selectable nodes, edges, and selected node detail.

Mobile current behavior:

- Relationship health summary.
- Repair broken links section.
- Graph browser with search, section/tag button filters, and status/type selects.
- Entry pickers.
- Relationship form with source and target selects, type field, type suggestion buttons, note field, directional checkbox, full status select, save/clear.
- Saved relationships with search, type select, list, open source/target, edit/delete.

Gaps:

- Relationship source/target controls now use the same select kind, but the
  mobile picker should gain search for large worlds.
- Relationship status and directional controls now match the web control kind.
- Graph status/type filters now match the web control kind; section/tag filters
  still need a shared model decision.
- Type suggestions use datalist on web and a seven-item button row on mobile.
- Relationship health is richer on web through cards; mobile gives summaries but should expose the same concepts.
- Entry picker is useful on mobile, but it should be the mobile rendering of the same source/target select/autocomplete control, not a separate workflow.

Plan:

- Define `RelationshipsFeatureModel` with:
  - Health summary.
  - Broken references.
  - Orphans.
  - Relationship form controls.
  - Relationship filters.
  - Graph filters.
  - Graph nodes/edges/detail.
- Mobile now uses searchable source/target picker/select controls that display
  entry name and section.
- Mobile now uses full status options through the shared status descriptor.
- Shared model should generate relationship type suggestions from core defaults plus saved relationship types.
- Shared graph/filter model should own available sections, statuses, tags, and link types.

### Workspaces And Custom Entry Types

Web source behavior:

- Intro and help.
- Workspace list with shared search.
- New workspace button.
- Workspace metadata form.
- Switch, duplicate, archive/restore, permanent delete with action-state gating.
- Custom entry type list with shared search.
- Custom entry type form.
- Delete custom type.

Mobile current behavior:

- Saved workspaces with shared search.
- Workspace form.
- Custom entry types with shared search.
- Custom entry type form.
- Similar actions through mobile controller.

Gaps:

- Workspace, custom type, and in-fiction world list rows now derive from
  `getWorkspaceFeatureModel`.
- Web and mobile both expose shared search for workspace-managed lists.
- Web uses an explicit New Workspace button; mobile uses New Workspace Draft in the form.
- Workspaces section headings now derive from shared `workspaceFeatureCopy`.
- Workspaces screen command labels now derive from shared
  `workspaceFeatureActions`, including permanent delete labels.
- Workspace and custom entry type form fields now derive from shared
  `workspaceDraftFields` and `entryTypeDraftFields`.

Plan:

- Keep workspace-managed list rows, search placeholders, empty states, hidden
  counts, and workspace action states in `getWorkspaceFeatureModel`.
- Keep workspace metadata, custom entry type, and in-fiction world form field
  labels in shared draft descriptors.
- Keep remaining Workspaces screen copy in `workspaceFeatureCopy`,
  `workspaceFeatureActions`, shared draft descriptors, or the list model.
- Keep platform-specific layout, but make all fields and actions derive from the same model.

### In-Fiction Worlds And Planets

Current shared behavior:

- `WorldWorkspace` includes `planetaryWorlds`.
- `InFictionWorld` has name, summary, classification, climate, dominant
  terrain, notes, tags, status, createdAt, and updatedAt.
- `workspaceManagement.ts` includes `planetaryWorldDraftFrom`,
  `upsertPlanetaryWorld`, `setPlanetaryWorldArchived`, and
  `deletePlanetaryWorld`.
- Web `useWorldDocumentState` and mobile `MobileCodexContext` expose
  save/archive/delete controller methods.
- Import/export, diagnostics, performance fixtures, and recovery snapshot
  reasons already account for planetary worlds.

Current UI behavior:

- Web `WorkspacesPage` renders an active-workspace in-fiction worlds and planets
  section with list cards, create/edit fields, archive/restore, and permanent
  delete confirmation.
- Mobile `WorkspacesScreen` renders the same active-workspace workflow with
  native fields, searchable list filtering, archive/restore, and permanent
  delete confirmation.
- Both screens render the form from shared `planetaryWorldDraftFields`, use
  `planetaryWorldDraftFrom`, and save through shared validation and controller
  methods.

Gaps:

- The original hidden-capability gap is closed.
- `getWorkspaceFeatureModel` now owns list summaries, result limits, search
  labels, empty states, hidden-count copy, and workspace action state for
  Workspaces, custom entry types, and in-fiction worlds.
- In-fiction worlds are intentionally managed inside Workspaces rather than
  global search for this slice; global search inclusion remains a product
  decision.

Plan:

- Keep in-fiction worlds/planets supported as active-workspace records.
- Keep the current shared field descriptor as the minimum drift guard for form
  labels, placeholders, multiline behavior, and draft keys.
- Follow up with a dedicated `InFictionWorldsFeatureModel` only if the
  in-fiction world workflow grows beyond the Workspaces screen model.
- Keep in-fiction worlds in workspace management only unless global search is
  deliberately expanded on both platforms.
- Keep parity fixture and round-trip tests covering at least one active and one
  archived in-fiction world.

Acceptance criteria:

- A user can create, edit, archive, restore, permanently delete, export, and
  import in-fiction world/planet records on both platforms.
- The same draft fields and validation messages are used on both platforms.
- Recovery snapshots are created before destructive in-fiction world actions on
  both platforms.
- Diagnostics counts match after the same operations.

### Data, Import, Export, Diagnostics, And Recovery

Web source behavior:

- Storage status and manual local save detail.
- Diagnostics JSON section with textarea and download.
- Active workspace JSON section with textarea and download.
- Full document JSON section with textarea and download.
- Markdown section with textarea and download.
- JSON file chooser plus paste textarea.
- Preview import, confirm import, reset starter data, recovery snapshots restore/delete.
- Header data menu with active JSON, full JSON, Markdown, and import route.

Mobile current behavior:

- Local storage status.
- Export mode selector with share, driven by shared export options.
- Export textarea.
- Import paste textarea and import button, driven by shared import review state.
- Recovery snapshots restore/delete.
- Reset.
- Help summary.

Gaps:

- Web exposes all export modes in separate sections; mobile uses a selected mode.
- Web supports file import; mobile supports paste import.
- Web supports direct downloads; mobile supports share sheet.
- Mobile includes Help content inside Data; web links to Help.
- Web header has a Data Menu; mobile shell does not expose equivalent fast export/save access.
- Export text generation, export draft state, share payloads, visible-export
  refresh behavior, export workflow action/status copy, import preview text,
  and import review state now live in `dataFeatureModel.ts`.
- Import section title, field labels, placeholder, and import/clear action
  labels now live in `dataFeatureModel.ts`.
- Recovery snapshot row text, count labels, empty state copy, and restore/delete
  action labels now live in `dataFeatureModel.ts`.
- Reset section title, description, action label, and accessibility hint now
  live in `dataFeatureModel.ts`.
- Mobile Data storage load/save/recovery status text now lives in
  `dataFeatureModel.ts` instead of the mobile-only view-model layer.
- Mobile `mobileDataExport.ts` is now only a diagnostics-runtime adapter around
  the shared export text function.

Platform capability differences are legitimate here, but the export modes, labels, generated text, import validation, preview, confirmation, recovery copy, and reset behavior must be shared.

Plan:

- Continue moving Data screen selection/display into `dataFeatureModel.ts`.
- Preserve platform capability differences:
  - Web renderer: download file, file chooser, copyable textarea.
  - Mobile renderer: share sheet, paste textarea, copy/selectable text.
- Use the same `CodexExportMode` list, same option metadata, same generated
  text functions, and same import preview state.
- Add a mobile shell Data action, reachable from every tab, with the same modes as the web header Data Menu.
- Decide whether Data help appears inline on both platforms or only in Help; do not keep it mobile-only by accident.

### Help

Web source behavior:

- Product/version intro.
- Focused help.
- First use.
- Workflow help topics.
- Backups and recovery.
- Offline limits.
- Support.
- Privacy.
- Release limits.

Mobile current behavior:

- Intro.
- Focused help.
- First use.
- Quick actions.
- Help topic buttons.
- Workflow help topics.
- Backups and recovery.
- Offline limits.
- Support.
- Privacy.
- Release limits.

Gaps:

- Mobile has Quick Actions and Help Topics navigation that web lacks.
- Web has explicit version text; mobile does not show version here.
- Offline/installable app limits now use shared copy and render on both web and
  mobile.

Plan:

- Define one shared help section list.
- Add quick topic navigation to web or remove the mobile-only quick topic navigation.
- Add version text and any remaining platform-specific install/storage
  limitations through shared platform copy slots.

### Navigation, Routes, And Intent Preservation

Current behavior:

- Core defines route strings such as `/entries?sectionId=places&intent=new`,
  `/relationships?entryId=...`, and `/help?topic=...`.
- Web uses those strings directly through React Router.
- Mobile converts those strings into Expo Router `pathname` and `params` with
  `getMobileRouteHref`.
- Mobile preserves supported hash fragments as the shared
  `routeFocusId` param.
- Compact mobile tab labels such as "Links" and "Worlds" now come from shared
  mobile shell route label metadata instead of a mobile-local label table.

Gaps:

- A route can encode workflow intent: open an entry for edit, start a new entry,
  prefill relationship source, focus Help, or focus Data import.
- Hashes and focus targets are only consumed by Data today; additional focused
  workflows should opt into the same route-intent contract as they are added.
- Mobile label aliases are now deliberate shared metadata, but icon choices
  remain mobile-local.

Plan:

- Add shared `RouteIntent` types for:
  - Overview.
  - Entries section browse.
  - Entry create.
  - Entry edit.
  - Relationship browse.
  - Relationship create/edit with source/target preselection.
  - Workspaces.
  - Data export mode focus.
  - Data import focus.
  - Help topic focus.
- Make web and mobile route helpers convert between route strings and
  `RouteIntent` objects.
- Represent focused sections as intent fields instead of raw hashes.
- Keep platform tab labels as aliases attached to the shared route id.
- Add tests that every route generated by core can be consumed by web and
  mobile, and that every mobile route can be converted back to the same intent.

Acceptance criteria:

- Opening a focused entry, relationship, Data import, or Help topic route lands
  on the same workflow state on both platforms.
- Route conversion tests fail when a new route param is added without mobile
  support.

### Accessibility And Input Parity

Current behavior:

- Web uses semantic form labels, a skip link, dialog roles, focus trapping, and
  before-unload prompts.
- Mobile primitives provide accessibility labels, roles, selected/disabled
  state, and live-region-like status behavior in some places.
- There is no shared accessibility inventory.

Gaps:

- Matching visible controls can still be non-parity if accessible names, error
  announcements, destructive hints, or focus order differ.
- Mobile button-row substitutes currently make some selectable values appear as
  separate actions rather than one field with one accessible value.
- Web keyboard behavior has no mobile equivalent requirement for hardware
  keyboards or screen reader navigation.

Plan:

- Extend control descriptors with:
  - `accessibleName`.
  - `accessibleHint`.
  - `required`.
  - `invalid`.
  - `errorMessage`.
  - `role`.
  - `state` for selected, checked, expanded, disabled, and busy.
- Define focus behavior for every dialog and destructive confirmation.
- Define announcement behavior for validation errors, save failures, import
  previews, successful exports/shares, and recovery snapshot operations.
- Add web tests or smoke checks for visible labels, dialog focus, and keyboard
  order on critical workflows.
- Add mobile tests for accessibility labels/states on the same control ids once
  mobile control descriptors are introduced.

Acceptance criteria:

- The same shared control id has the same accessible name, requirement state,
  disabled state, selected/checked state, validation message, and destructive
  hint on both platforms.
- Web keyboard and mobile screen reader paths can complete the standard parity
  workflow.

### Runtime Recovery, Diagnostics, And Support Artifacts

Current behavior:

- Web runtime recovery receives document, active world, route, load status,
  save status, and recovery snapshot status.
- Mobile runtime recovery presents retry and Data actions through a simpler
  error boundary.
- Web local diagnostics and mobile diagnostics use related but not identical
  runtime context.

Gaps:

- A render failure can leave users with different recovery choices depending on
  platform.
- Diagnostics could drift in schema shape or content-safety guarantees.
- Support docs and Help copy need to describe the same recovery evidence users
  can actually collect.

Plan:

- Create a shared `RuntimeRecoveryModel` with title, detail, backup hint,
  retry action, Data action, and diagnostics action availability.
- Create a shared diagnostics schema contract with platform-specific runtime
  fields nested under a clearly named key.
- Add tests that diagnostics never include world names, entry names, summaries,
  notes, tags, relationship notes, or ids by default.
- Add manual QA steps that intentionally trigger web and mobile render recovery
  and verify the same actions are available.

Acceptance criteria:

- Both platforms let users retry, reach Data, and collect content-safe
  diagnostics after a runtime failure.
- Diagnostics schemas remain compatible enough for support tooling to inspect
  without platform-specific parsing branches except runtime context.

### Storage, Migration, Offline, And Local-Durability Copy

Current behavior:

- Web saves manually to browser `localStorage`.
- Mobile auto-saves to AsyncStorage under mobile-specific keys.
- Web supports legacy local codex migration.
- Mobile has its own storage keys and recovery snapshot storage.
- PWA/offline wording exists for web; mobile has local device storage wording.

Gaps:

- Storage keys can differ, but recovery semantics and user copy must stay
  aligned.
- Legacy migration behavior is documented mostly through core parsing, not a
  shared storage migration matrix.
- Offline and local durability claims can drift between README, Help, Privacy,
  web UI, and mobile UI.

Plan:

- Add a storage matrix covering:
  - Web current key.
  - Web legacy key.
  - Mobile current key.
  - Mobile legacy snapshot keys.
  - Recovery snapshot list keys.
  - Retention limits.
  - Corrupt-read behavior.
  - Failed-write behavior.
- Use shared copy slots for local-only, no-account, no-sync, backup, storage
  risk, and offline limits.
- Add tests for corrupt storage and legacy migration through the shared storage
  adapter where possible.
- Add release checklist items comparing README, Help, Privacy, Data UI, and
  mobile Data wording.

Acceptance criteria:

- Both platforms explain local durability limits with the same claims.
- Corrupt saved data, failed saves, import rejection, reset, and restore produce
  equivalent recovery states and guidance.

### Performance And Large-World Behavior

Current behavior:

- Web has a synthetic large-world performance test.
- Mobile uses display limits and non-virtualized scroll views for several
  screens.
- Export/import performance is tested for large web fixtures, but mobile
  rendered performance is not covered equivalently.

Gaps:

- Mobile can meet parity logically while still being unusable for realistic
  large worlds.
- Truncation limits can hide records on mobile that remain visible or filterable
  on web.
- Shared feature models need to define when truncation, pagination, search
  refinement, or virtualization is required.

Plan:

- Define shared large-world budgets:
  - Maximum fixture size for routine tests.
  - Target time for search/filter/model derivation.
  - Target time for export/import parse/serialize.
  - Maximum initial render row count per screen before virtualization or paging.
- Move result-limit policy into shared feature model metadata.
- Add mobile-focused large-world model tests before adding native UI automation.
- Prefer virtualization or explicit pagination over silent truncation when a
  user needs access to every matching record.
- Add manual mobile large-world QA until automated rendered mobile performance
  exists.

Acceptance criteria:

- Both platforms can find, edit, relate, export, and import records in the large
  fixture without hidden unreachable records.
- Any platform-specific truncation has a shared explanatory message and a clear
  refinement or pagination path.

## Data Interchange Requirements

The exported JSON format must be fully interchangeable:

- Web full-document JSON must import on mobile.
- Mobile full-document JSON must import on web.
- Web active-workspace JSON must import on mobile as a valid one-workspace document.
- Mobile active-workspace JSON must import on web as a valid one-workspace document.
- Custom entry types, custom fields, archived entries, relationships, timeline fields, workspace metadata, and in-fiction worlds must round-trip.
- Import validation must reject the same malformed inputs on both platforms.
- Markdown export is a readable reference format, not a restore format, and should not be treated as importable data.
- Diagnostics export must remain content-safe and should not include world content by default.

Current implementation already centralizes the JSON format in `@valgaron/core`, so the plan is to harden and protect that with parity tests rather than rewrite it.

### Required Data Tests

Add shared fixtures that include:

- Multiple workspaces.
- At least one custom entry type.
- Entries in all built-in sections.
- Archived and non-archived entries.
- Pinned entries.
- Detail fields with multiline and autocomplete options.
- Timeline events with order, era, date label, and involved-entry relationships.
- Relationships with all statuses and directional/mutual variants.
- In-fiction worlds/planetary records.
- At least one active and one archived in-fiction world/planetary record.
- Tags with mixed casing and punctuation.

Add contract tests:

- `serializeWorldDocumentBackup(parseWorldImport(webExport).document)` produces the same normalized document as the original, ignoring `exportedAt`.
- The same round trip passes for mobile-generated export text.
- Active export from either platform imports as a valid document with exactly one workspace.
- Invalid duplicate ids and orphaned relationships fail with the same errors.
- Diagnostics exports from web and mobile have the same schema shape, with only platform runtime fields varying.
- Diagnostics exports from both platforms exclude world names, entry names,
  summaries, notes, tags, relationship notes, and ids by default.
- Storage recovery tests cover corrupt saved data, failed writes where adapters
  can simulate them, legacy migration, and recovery snapshot retention.

## Architecture Options Considered

### Option A: Single React Native Web UI For Web And Mobile

This would move the whole app to React Native primitives rendered on web via `react-native-web`.

Pros:

- Maximum UI component reuse.
- One renderer for many controls.
- Strong prevention against screen drift.

Cons:

- High migration cost.
- Likely disrupts the existing mature web experience.
- Conflicts with the current instruction to keep MUI, Emotion, fonts, and MUI-based reusable infrastructure unless replacement is explicitly approved.
- Web accessibility and table/form affordances may regress if rushed.
- Does not by itself solve domain workflow duplication unless state is also centralized.

Recommendation: do not choose this as the near-term plan.

### Option B: Continue Sharing Only Domain Logic

This is the current trajectory.

Pros:

- Lowest short-term churn.
- Keeps platform implementation freedom.
- Existing tests already fit this model.

Cons:

- Does not meet the user's parity requirement.
- Screen drift will continue.
- Every future feature requires manual web/mobile comparison.
- Control taxonomy mismatches will keep appearing.
- Mobile-specific view models will grow into a parallel product.

Recommendation: insufficient.

### Option C: Shared Headless Feature Models Plus Platform Renderers

This adds a shared layer above domain logic but below platform UI.

The shared layer owns:

- Screen sections.
- Control descriptors.
- Control labels.
- Filter state shapes.
- Sort/status/tag options.
- Empty states.
- Validation messages.
- Confirmation intent.
- Export/import/recovery state.
- List limits and truncation policy.
- Workflow action names.
- Route intent interpretation.

Web and mobile renderers own:

- DOM versus React Native primitives.
- Layout and responsive density.
- Platform capability adapters such as download versus share.
- Focus handling and platform-specific accessibility mechanics.

Pros:

- Major duplication reduction without a UI rewrite.
- Preserves mature web UI while making it the formal source of truth.
- Makes future features start once in shared code.
- Allows native-feeling controls where appropriate while preserving control type.
- Easy to unit test.

Cons:

- Requires careful API design.
- Some existing page/screen code must be refactored.
- Does not eliminate all duplicate JSX/TSX, only duplicated behavior.

Recommendation: choose this path.

### Option D: Mobile WebView Wrapper Around The Web App

This would make mobile display the web app inside a WebView.

Pros:

- Fastest route to screen-level parity.
- Almost no duplicated UI.

Cons:

- Poor fit for local AsyncStorage and native share/file behavior.
- Weak native navigation.
- Harder offline and storage behavior.
- Can feel like a compromised mobile app.
- Does not fit the current Expo companion direction.

Recommendation: do not choose except as an emergency preview-only strategy.

## Recommended Target Architecture

### Package Boundaries

Keep:

- `@valgaron/core`: pure domain, schema, exports, import validation, copy constants, workflow primitives.
- `@valgaron/platform`: storage and platform-neutral service abstractions.
- `@valgaron/ui-tokens`: design tokens.

Add one of these:

- Preferred: `packages/features` as `@valgaron/features`.
- Alternative: `packages/core/src/features` if avoiding another workspace is more important than clean package separation.

The feature layer should have no DOM, browser, Expo, React Native, or storage dependency. It can depend on `@valgaron/core`.

Suggested structure:

```text
packages/features/src/
  index.ts
  controls.ts
  parityPolicy.ts
  overviewModel.ts
  entriesModel.ts
  relationshipsModel.ts
  workspacesModel.ts
  dataModel.ts
  helpModel.ts
  routeIntents.ts
  workflowSpecs.ts
  fixtures/
```

Eventually consider:

```text
packages/ui-kit/
  src/web/
  src/native/
```

Do not start with a broad UI-kit rewrite. Start by sharing model and control contracts first.

### Shared Control Vocabulary

Introduce a small set of canonical control kinds:

- `text-field`
- `textarea`
- `search-field`
- `select`
- `autocomplete`
- `checkbox`
- `segmented-control`
- `button`
- `danger-button`
- `link`
- `file-picker`
- `share-action`
- `copyable-text`

Each feature model should expose controls with:

- Stable id.
- Kind.
- Label.
- Value.
- Options when applicable.
- Required/disabled/selected state.
- Help text or placeholder.
- Validation state.
- Action id or update path.

Renderer rule:

- A web `select` maps to a native picker/select modal on mobile, not to a row of unrelated buttons.
- A web checkbox maps to a mobile switch/checkbox, not to a generic action button.
- A web autocomplete maps to a mobile searchable picker/autocomplete, not to raw id text input.
- Platform-only controls are allowed only when they represent platform capability, such as web file download or mobile share sheet.

### Shared Feature Models

Each feature model should have three layers:

1. Input state:

   - Current document/world.
   - Route params.
   - Local draft state.
   - Platform capability flags.

2. Derived model:

   - Sections, rows, cards, diagnostics, controls, buttons, messages, empty states.

3. Actions:
   - Typed action intents such as `save-entry`, `archive-entry`, `set-entry-status`, `select-relationship-source`, `preview-import`.
   - Actions should call shared domain operations or return a command for the platform state controller.

This makes web and mobile render the same model while preserving platform-specific layout and input mechanics.

### Shared State Controller

Current state is split:

- Web: `useWorldDocumentState`.
- Mobile: `MobileCodexContext`.

Create shared document controller logic in a platform-neutral package:

- `createWorldDocumentController`
- `applyDocumentCommand`
- `createRecoverySnapshotBefore`
- `getSaveStateAfterMutation`
- `getImportResetRestoreCommands`
- `getStorageRecoveryState`
- `getRuntimeRecoveryState`

Adapters provide:

- Storage implementation.
- Save policy: manual or autosave.
- Clock.
- Snapshot storage.
- User-visible save target copy.
- Runtime capability flags for download, share, file picker, clipboard, and
  diagnostics collection.

This preserves web manual save and mobile autosave while sharing all mutation semantics.

## Feature Parity Policy

Add a short policy file to the repo, ideally in `packages/features/src/parityPolicy.ts` and referenced from docs:

1. Web is the workflow source of truth.
2. New feature behavior starts in shared core or shared feature model.
3. Platform screens may adapt layout, spacing, and presentation density.
4. Platform screens may not change the control kind for the same setting.
5. Platform-only capability differences must be named in the model.
6. Export/import format must only be implemented in `@valgaron/core`.
7. Any mobile-only or web-only feature must be tracked as:
   - Intentional platform capability, or
   - Temporary parity debt with an owner and target phase.
8. A feature is not complete until:
   - Shared model tests pass.
   - Web renderer tests pass.
   - Mobile renderer or screen model tests pass.
   - Data round-trip tests pass if data changes.

## Parity Debt Ledger Template

Create this as a living checklist in `docs/qa/web-mobile-parity-checklist.md`
or a dedicated planning document. Each debt must be closed, intentionally
accepted as a platform capability difference, or removed from supported scope.

| Debt                              | Root Cause                           | Source Of Truth       | Web Status                 | Mobile Status                            | Close In | Acceptance Test                          |
| --------------------------------- | ------------------------------------ | --------------------- | -------------------------- | ---------------------------------------- | -------- | ---------------------------------------- |
| In-fiction worlds/planets         | Domain/controller support lacks UI   | README and core model | No visible workflow found  | No visible workflow found                | Phase 3  | Create/edit/archive/delete/export/import |
| Relationship source/target        | Resolved with shared descriptors     | Web relationship form | Selects                    | Selects plus supplemental picker rows    | Closed   | Same control kind and valid options      |
| Relationship status               | Resolved with shared descriptors     | Web relationship form | Full status select         | Full status select                       | Closed   | All statuses selectable                  |
| Entry status/sort/filter controls | Resolved with shared descriptors     | Web section page      | Selects/checks/chips       | Selects/checks/chips                     | Closed   | Matching control descriptors             |
| Entry notes preview/copy name     | Resolved with mobile editor controls | Web entry form        | Present                    | Present with guarded clipboard feedback  | Closed   | Same actions and feedback                |
| Route focused workflows           | Hash/query handling can drift        | Core route intents    | Query/hash routes          | Route focus param and Data scroll target | Phase 2  | `routeIntents` and `mobileRoutes` tests  |
| Diagnostics schema                | Platform runtime contexts diverge    | Core diagnostics      | Local diagnostics adapter  | Mobile export diagnostics                | Phase 1  | Same schema, no content leakage          |
| Runtime recovery                  | Separate fallback components         | Web fallback behavior | Rich context and Data path | Retry/Data fallback                      | Phase 4  | Same recovery actions                    |
| Large-world mobile behavior       | Mobile truncates lists manually      | Shared feature model  | Performance smoke exists   | Limits without shared budgets            | Phase 7  | Records remain findable/editable         |
| Duplicate derivation helpers      | Migration wrappers and mobile models | Shared feature layer  | `src/Utlilities` wrappers  | `mobileCodexViewModels`                  | Phase 4+ | Import-boundary/deletion checklist       |

## Implementation Plan

### Phase 0: Baseline And Guardrails

Goal: stop new drift before starting large refactors.

Tasks:

- Add this plan to the project root.
- Add a parity checklist to the PR/review process.
- Create a `docs/qa/web-mobile-parity-checklist.md` manual checklist based on the feature matrix below.
- Create a parity debt ledger with one row per known web/mobile mismatch,
  including owner, source-of-truth behavior, current web status, current mobile
  status, planned phase, and acceptance test.
- Add explicit debt entries for in-fiction worlds/planets, route focus/hash
  handling, mobile raw relationship ids, mobile incomplete relationship status,
  mobile button-row field substitutes, mobile missing notes preview, mobile
  missing copy name, diagnostics schema drift, and large-world mobile behavior.
- Add a "no platform-only export/import serializer" rule to code review.
- Add a search-based lint/test guard that fails if `JSON.stringify` export backup logic appears outside `@valgaron/core` except diagnostics adapters.
- Record current parity debts as intentional backlog items.
- Add import-boundary rules that prevent new feature derivation helpers in
  `mobile/src/state` or `src/Utlilities` when an equivalent shared feature model
  exists.

Deliverable:

- A visible checklist and current known gap list.
- A baseline table showing which parity debts are intentional and which release
  gate will close them.

### Phase 1: Data Contract Hardening

Goal: make interchangeability non-negotiable.

Tasks:

- Create a rich shared fixture document in `packages/core/src/testFixtures` or `packages/features/src/fixtures`.
- Add tests for web and mobile import/export helpers using the same fixture.
- Normalize export comparisons by ignoring `exportedAt` or injecting a test clock.
- Test active-workspace export round trips as a one-workspace `WorldDocument`.
- Test full-document export round trips with custom entry types, relationships, archived records, timeline data, and in-fiction worlds.
- Test malformed import rejection equality.
- Move mobile diagnostics runtime shape closer to the same core diagnostics report shape used by web.
- Add tests for in-fiction worlds/planets in full and active JSON export/import.
- Add tests for diagnostics content exclusion on both platforms.
- Add storage migration/corrupt-read tests through shared fixtures where the
  storage adapter allows it.

Deliverable:

- A failing test if either platform cannot import the other's JSON.
- A failing test if in-fiction world data is dropped or diagnostics leak world
  content.

### Phase 2: Shared Control And Screen Model Contracts

Goal: define the common UX vocabulary before moving screens.

Tasks:

- Add `ControlDescriptor` and canonical control kinds.
- Add model types for:
  - `OverviewScreenModel`
  - `EntriesScreenModel`
  - `RelationshipsScreenModel`
  - `WorkspacesScreenModel`
  - `InFictionWorldsScreenModel` or a clearly scoped submodel under
    `WorkspacesScreenModel`
  - `DataScreenModel`
  - `HelpScreenModel`
  - `RuntimeRecoveryModel`
  - `RouteIntent`
- Move shared limits to one file:
  - Overview result limits.
  - Entry list display limits.
  - Relationship picker/list limits.
  - Timeline diagnostics/group limits.
  - Workspace/custom type limits.
  - In-fiction world list limits.
- Add snapshot tests for feature models using the rich fixture.
- Add a test that web and mobile renderers consume the same control ids/kinds for each screen.
- Add accessibility descriptor tests for required controls, error states,
  selected/checked states, and destructive hints.
- Add route-intent tests proving web and mobile route adapters preserve focused
  workflow state.

Deliverable:

- Shared model tests that describe the web-source UX.
- Shared route, accessibility, and control-kind contracts that fail on new drift.

### Phase 3: Critical Mobile UX Parity Fixes

Goal: remove the highest-impact control and behavior mismatches.

Tasks:

- [x] Add native picker/select primitives in `mobile/src/screens/screenPrimitives.tsx` or a new mobile form primitives file.
- [x] Replace mobile status filter button rows with select/picker controls.
- [x] Replace mobile sort button rows with select/picker controls.
- [x] Replace mobile updated-date filter gap with a shared select.
- [x] Replace mobile entry status button rows with a select/picker.
- [x] Replace mobile relationship status Draft/Canon toggle with the full status select/picker.
- [x] Replace mobile relationship source/target raw id fields with picker/select controls that display entry name and section.
- [x] Replace mobile directional and pinned action buttons with checkbox/switch controls.
- [x] Add search inside mobile source/target picker controls for large worlds.
- [x] Add mobile notes preview.
- [x] Add mobile copy-name behavior.
- [x] Add mobile detail-field suggestions using the same suggestion model as web.
- [x] Add a mobile save/status affordance in the shell or Overview/Data header area so the save workflow is recognizable.
- [x] Add web and mobile access to every in-fiction world/planet field and
      destructive action if the feature remains supported.
- [x] Align mobile tab aliases with shared route metadata so "Links" and "Worlds"
      are deliberate short labels for Relationships and Workspaces, not separate
      feature names.

Deliverable:

- Mobile no longer has different control types for core entry and relationship workflows.
- Mobile no longer has domain-supported data that is impossible to inspect or
  edit through the UI.

### Phase 4: Shared Feature Models By Screen

Goal: reduce future duplicate effort feature by feature.

Suggested order:

1. Data model.

   - Already close to shared.
   - Highest importance for interchangeability.
   - Export/import review state and export generation now have a shared core
     model, including mobile export workflow action/status copy.
   - Recovery snapshot review rows now have a shared core model.
   - Continue with platform display models for inline Help and broader web
     storage status.

2. Help model.

   - Mostly shared copy already.
   - Low risk.
   - Good proof point for shared section models.

3. Overview model.

   - Mostly derived data and navigation actions.
   - Clarifies list limits and section counts.

4. Relationships model.

   - High drift and high user value.
   - Move graph, filters, health, form controls, and list row models.

5. Entries model.

   - Biggest screen.
   - Move filters, timeline browser, entry editor controls, detail panel, and linked-record summary incrementally.

6. Workspaces model.

   - Move workspace list, actions, custom type form, search, and delete gating.

7. In-fiction worlds/planets model.

   - Move the list, form controls, status, notes, tags, archive/restore/delete,
     diagnostics counts, and recovery snapshot hooks.

8. Runtime recovery model.

   - Move retry/Data/diagnostics actions and content-safe fallback copy.

For each screen:

- First create the shared model and tests while web still renders old code.
- Update web to consume the model without changing behavior.
- Update mobile to consume the same model.
- Delete mobile-only or web-only duplicate helpers that are now replaced.
- Add a deletion checklist to each migration PR identifying old helpers,
  wrappers, tests, and exports that should be removed once the shared model is
  live.

Deliverable:

- Each screen has one shared model and two thin renderers.
- Old duplicate derivation helpers are deleted or explicitly marked as temporary
  compatibility wrappers with a target removal phase.

### Phase 5: Shared Controller And Save Policy

Goal: eliminate mutation orchestration duplication.

Tasks:

- Extract common mutation commands from `useWorldDocumentState` and `MobileCodexContext`.
- Represent actions as commands:
  - `saveEntryDraft`
  - `archiveEntry`
  - `deleteEntry`
  - `saveRelationshipDraft`
  - `deleteRelationship`
  - `createWorkspace`
  - `updateWorkspace`
  - `createEntryType`
  - `saveInFictionWorld`
  - `archiveInFictionWorld`
  - `deleteInFictionWorld`
  - `importDocument`
  - `restoreSnapshot`
  - `resetToSeed`
- Keep platform save policies:
  - Web manual save.
  - Mobile autosave plus visible save/status affordance.
- Inject storage and snapshot adapters.
- Inject clock for deterministic tests.
- Add controller tests that run the same workflow under web and mobile save policies and compare final documents.
- Add controller tests for corrupt storage, failed saves, snapshot retention,
  in-fiction world destructive actions, and reset/import/restore recovery.

Deliverable:

- One mutation orchestration implementation with platform storage adapters.
- One recovery-state implementation with platform-specific persistence only at
  the adapter boundary.

### Phase 6: Renderer And Design System Consolidation

Goal: reduce presentational duplication after behavior is centralized.

Tasks:

- Keep existing web CSS/MUI-compatible infrastructure.
- Extend `@valgaron/ui-tokens` into CSS variables for web so web and mobile consume the same token source mechanically.
- Create matching primitive props for:
  - Button.
  - Text field.
  - Textarea.
  - Select/picker.
  - Checkbox/switch.
  - Status pill/text.
  - Section block/panel.
  - List row/card.
  - Dialog/confirmation.
  - Runtime recovery panel.
  - Data export/import section.
  - In-fiction world editor section.
- Implement web and native renderers separately but from the same prop contracts.
- Gradually replace ad hoc mobile screen primitives and web class-only form markup where duplication is high.

Deliverable:

- Platform renderers still differ internally, but feature screens no longer hand-roll control semantics.

### Phase 7: Automated Parity Gates

Goal: make drift cheap to catch.

Tasks:

- Add unit tests for every shared feature model.
- Add contract tests that assert web and mobile control descriptors match by screen.
- Add data round-trip tests for every schema or export/import change.
- Add a workflow parity test:
  - Create or edit a place.
  - Create or edit a character.
  - Create or edit an in-fiction world/planet if the feature remains supported.
  - Create a relationship from character to place.
  - Save or commit.
  - Export full JSON.
  - Import on the other platform.
  - Assert equivalent normalized document.
- Keep `npm run typecheck`, `npm run typecheck:mobile`, `npm test`, and `npm run test:mobile`.
- Add focused mobile screen tests around picker/control behavior once the primitives exist.
- Add a small browser/mobile manual QA checklist until automated mobile UI coverage exists.
- Add route-intent parity tests.
- Add accessibility descriptor parity tests.
- Add large-world mobile model tests and, when tooling is available, rendered
  mobile large-world smoke tests.
- Add diagnostics schema and content-exclusion tests.
- Add import-boundary tests preventing new duplicate feature derivation helpers
  after a shared model exists.

Deliverable:

- Future feature drift fails tests before release.

## Feature Matrix

| Area                       | Web Source State                                                                  | Mobile Current State                                                              | Parity Action                                                         |
| -------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Navigation                 | Top nav plus direct section routes                                                | Tabs plus section selector                                                        | Share route model; keep responsive section selector as nav adaptation |
| Save                       | Manual header Save                                                                | Autosave messages                                                                 | Add mobile save/status affordance; share save state model             |
| Overview counts            | Section count cards                                                               | Aggregate stats                                                                   | Shared overview model with section counts on both                     |
| Global search              | Search field and result cards                                                     | Search field and result rows                                                      | Share search model and limits                                         |
| Quick create               | Links for every section                                                           | Buttons for every section                                                         | Share quick-create action model                                       |
| Entry filters              | Search, tag chips, status select, sort select, updated select, archived checkbox  | Search, tag chips, status select, sort select, updated select, archived checkbox  | Keep covered by shared control descriptors                            |
| Entry editor               | Full form, notes preview, suggestions, copy name                                  | Full form with notes preview, suggestions, and copy-name feedback                 | Move editor model shared                                              |
| Entry status               | Select with all statuses                                                          | Select with all statuses                                                          | Keep covered by shared control descriptors                            |
| Pinned                     | Checkbox                                                                          | Checkbox                                                                          | Keep covered by shared control descriptors                            |
| Timeline                   | Diagnostics, highlights, table, era groups, filters, moves                        | Diagnostics text, groups, filters, moves                                          | Share timeline model; layout can differ                               |
| Relationship source/target | Selects                                                                           | Searchable selects plus supplemental picker rows                                  | Move picker/search model shared                                       |
| Relationship status        | Select with all statuses                                                          | Select with all statuses                                                          | Keep covered by shared control descriptors                            |
| Relationship directional   | Checkbox                                                                          | Checkbox                                                                          | Keep covered by shared control descriptors                            |
| Relationship graph filters | Selects                                                                           | Status/type selects plus section/tag buttons/search                               | Convert section filter or mark as navigation adaptation               |
| Workspaces                 | Shared list/search/action-state model, headings, draft fields, and command labels | Shared list/search/action-state model, headings, draft fields, and command labels | Continue broader screen-model extraction as needed                    |
| Custom entry types         | List/form/delete                                                                  | List/search/form/delete                                                           | Share labels and search policy                                        |
| In-fiction worlds/planets  | Visible workspace list/form/actions using shared draft field descriptors          | Visible workspace list/form/actions using shared draft field descriptors          | Move remaining list/search policy into shared workspace model         |
| Route intents              | React Router paths, query params, and hash focus                                  | Expo Router params plus route focus param                                         | Expand focused workflow consumers beyond Data                         |
| Accessibility              | Labels, skip link, focus trap, keyboard flows                                     | Labels/roles/states in primitives                                                 | Add shared accessibility descriptors and parity tests                 |
| Runtime recovery           | Context-rich fallback and Data path                                               | Retry/Data fallback                                                               | Share recovery model and diagnostics path                             |
| Storage recovery           | Manual save, localStorage recovery, snapshots                                     | Autosave, AsyncStorage recovery, snapshots                                        | Share storage/recovery state model and copy                           |
| Large-world behavior       | Synthetic performance test, browser smoke                                         | List limits and simple scroll views                                               | Shared budgets, limits, virtualization/pagination policy              |
| Export JSON                | Shared core serializer, download                                                  | Shared core serializer, share                                                     | Keep capability adaptation; test same generated data                  |
| Import JSON                | File chooser plus paste                                                           | Paste                                                                             | Keep capability adaptation; shared validation/preview                 |
| Recovery snapshots         | Restore/delete list                                                               | Restore/delete list                                                               | Shared recovery model and copy                                        |
| Help                       | Full sections with version/offline                                                | Full sections plus quick actions/topic buttons                                    | Shared help section model; align version/offline/quick actions        |

## Standard Workflow Parity Target

The requested standard workflow should behave as follows on both platforms.

Workflow:

1. Open the codex.
2. Navigate to Places.
3. Edit or create a place.
4. Navigate to Characters.
5. Edit or create a character.
6. Navigate to Workspaces.
7. Create or edit an in-fiction world/planet if the feature remains supported.
8. Navigate to Relationships.
9. Create a relationship linking the character and place.
10. Save or confirm persisted state.
11. Open Data.
12. Export full JSON.
13. Import that JSON on the other platform.

Expected parity:

- Same sections exist and are named the same.
- Entry forms expose the same fields with the same status and pinned controls.
- In-fiction world/planet forms expose the same fields and destructive actions
  if the feature remains supported.
- Relationship form exposes the same source, target, type, status, note, and directional controls.
- Validation errors are the same.
- Destructive confirmations are the same.
- Save status is visible and understandable on both platforms.
- Export modes are named the same.
- Full JSON import preview reports the same workspace, entry, and relationship counts.
- Route intents such as "edit this entry", "manage links for this entry",
  "open Data import", and "open focused Help" land in equivalent states.
- The imported document is equivalent after normalization.

## Engineering Rules For Future Features

Use these rules after the parity migration starts:

1. Add or change schema only in `@valgaron/core`.
2. Add or change export/import only in `@valgaron/core`.
3. Add or change feature behavior in the shared feature model first.
4. Add web and mobile renderers only after the model is tested.
5. Do not introduce platform-specific status options, sort options, relationship type options, export modes, or validation copy.
6. Do not hand-code the same list/filter/form derivation in both `src` and `mobile/src`.
7. If a platform has a capability difference, model it explicitly as capability data.
8. Do not add supported domain data that lacks a reachable web and mobile UI
   path unless the feature is explicitly marked internal-only and excluded from
   user-facing docs.
9. Do not add a route param, hash, or focused workflow without updating the
   shared route-intent tests.
10. Do not add a visible control without a shared accessible name and state
    contract.
11. Every feature PR should answer:
    - What shared model changed?
    - What web renderer changed?
    - What mobile renderer changed?
    - What parity test protects it?
    - Did export/import format change?
    - Did route, accessibility, diagnostics, storage, or performance behavior
      change?

## Suggested Near-Term Backlog

Highest priority:

- Keep the parity debt ledger and web/mobile parity checklist current as
  control and model slices close.
- Keep data round-trip tests for web/mobile export/import green.
- Decide and document whether in-fiction worlds/planets remain supported; if
  yes, add visible web and mobile workflows.
- Extend shared control descriptors into shared screen models.
- Extend shared route-intent and accessibility descriptors beyond the current
  Data focus consumer.
- Move mobile relationship source/target picker search into a shared model.
- Move mobile notes preview, copy-name behavior, and detail suggestions into a
  shared entry editor model.
- Keep diagnostics content-exclusion tests green as diagnostics change.

Next:

- Extract Data and Help shared models.
- Extract Overview shared model.
- Add web Workspaces search or document it as an intentional responsive affordance.
- Add mobile save/status shell affordance.
- Add runtime recovery and storage recovery shared models.
- Add large-world mobile model tests.

Then:

- Extract Relationships shared model.
- Extract Entries shared model.
- Extract Workspaces shared model.
- Extract in-fiction worlds/planets shared model if supported.
- Extract shared document controller.
- Delete or mark remaining duplicate web utility wrappers and mobile view-model
  helpers after each shared model migration.

## Risks And Mitigations

Risk: The shared feature model becomes too abstract.

Mitigation: Build it screen by screen from current web behavior. Do not invent a generic form engine beyond the control descriptors needed for actual Valgaron screens.

Risk: Mobile becomes less usable if forced to mimic desktop layout.

Mitigation: Share behavior and control kind, not layout. Use mobile picker modals, compact sections, and native scrolling while preserving the same options and workflow.

Risk: Web regressions during refactor.

Mitigation: Convert web to shared models first with behavior-preserving tests before changing mobile.

Risk: Data compatibility accidentally breaks.

Mitigation: Add rich fixture round-trip tests and run them in both web and mobile test suites.

Risk: Existing mobile autosave conflicts with web manual save source of truth.

Mitigation: Treat save policy as a platform adapter. Expose a shared save/status concept, but allow mobile to persist immediately under the hood.

Risk: Domain-supported data remains hidden from the UI.

Mitigation: Maintain a feature exposure matrix. A user-facing data type is not
considered supported until both web and mobile have reachable list, edit,
destructive-action, export, import, diagnostics, and recovery coverage.

Risk: Route-intent drift creates broken focused workflows.

Mitigation: Convert route strings through shared `RouteIntent` objects and test
every route in both directions for web and mobile.

Risk: Release gates or manual checklists become stale.

Mitigation: Add parity checklist updates to the definition of done for every
feature and align browser smoke, mobile tests, README, Help, Privacy, and QA
docs in the same PR as feature changes.

Risk: Mobile large-world limits hide data instead of managing it.

Mitigation: Move limits into shared model metadata and require a user-visible
path to every matching record through search refinement, pagination, or
virtualized lists.

## Definition Of Done

Full parity is achieved when:

- Web and mobile import each other's full and active JSON exports.
- Shared data round-trip tests cover custom sections, relationships, archived records, timeline data, and in-fiction worlds.
- Each major screen has a shared feature model.
- Every supported user-facing data type, including in-fiction worlds/planets if
  retained, has reachable web and mobile create/edit/archive/restore/delete
  workflows.
- Web and mobile renderers consume the same control ids and control kinds.
- Mobile no longer uses raw ID fields or incomplete status toggles where web uses select controls.
- Route-intent tests prove focused entry, relationship, Data import, and Help
  topic workflows land in equivalent states on both platforms.
- Accessibility descriptor tests prove the same controls have matching names,
  states, validation messages, and destructive hints.
- Runtime recovery and diagnostics provide equivalent choices and content-safe
  reports.
- Large-world tests prove records remain findable and editable on both
  platforms.
- Entry, relationship, workspace, data, recovery, and help copy comes from shared sources.
- New features can be implemented by changing shared domain/model code once, then adding thin platform renderers.
- Manual QA confirms the standard workflow in this document on both platforms.
