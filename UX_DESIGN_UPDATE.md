# Valgaron Cross-Platform UX Implementation Plan

Date: 2026-07-05

## Purpose

This document transforms the cross-platform UX direction for Valgaron into a
staff-level implementation plan for the browser app, Expo mobile app, and shared
frontend monorepo. It focuses on practical sequencing, shared abstractions,
component boundaries, migration safety, validation, and the user input gates
that should happen before implementation starts.

## Staff Engineering Assessment

The product direction is sound: Valgaron should move away from many
section-heavy pages toward a smaller set of workflow surfaces:

- Workbench.
- Timeline.
- Relationship Studio.
- Knowledge And Schema.
- Utilities.

The implementation should not be a full rewrite. The current app already has
strong shared core models, route intent helpers, mobile-specific screens,
browser-specific pages, local persistence, recovery snapshots, import/export,
taxonomy-generated fields, relationship diagnostics, and focused tests.

The safest path is an incremental migration:

- Add shared core view models first.
- Keep current routes working as compatibility routes.
- Build new web/mobile surfaces behind the same route intents.
- Move behavior gradually from page-specific components to shared model helpers.
- Only add document schema migrations when user-defined fields require durable
  new data.

## Non-Negotiable User Input Gates

These gates should happen before implementation begins. They prevent expensive
rework in navigation, schema, and persistence.

Decision status:

- Gate 1 uses the recommended product surface agreement.
- Gate 2 uses the recommended first release scope.
- Gate 3 uses the recommended staged draft transaction strategy.
- Gate 4 uses the recommended four-tab mobile navigation shape.
- Gate 5 uses the recommended schema MVP boundary.
- Gate 6 uses the clean-break compatibility policy because there are no live
  users and no live data.
- Gate 7 uses the recommended acceptance evidence.

### Gate 1: Product Surface Agreement

Decision needed:

- Confirm the target top-level surfaces.

Accepted decision:

- Browser: Workbench, Timeline, Relationships, Knowledge, Utilities.
- Mobile: Workbench, Timeline, Links, More. Promote Knowledge to a fifth tab
  only after schema editing becomes a common workflow.

Why this matters:

Navigation drives route contracts, smoke tests, mobile tab counts, help copy,
and migration from current pages.

### Gate 2: First Release Scope

Decision needed:

- Choose the first implementation slice.

Accepted decision:

- First release should deliver Workbench foundation plus inline relationship
  fields for existing character and place taxonomy fields. Defer full
  user-defined fields until the relationship authoring model is proven.

Why this matters:

User-defined fields require schema migrations. Inline relationships mostly
reuse current relationship data and gives immediate workflow value.

### Gate 3: Unsaved Link Strategy

Decision needed:

- Pick how links work before a record is saved.

Options:

- Staged local draft graph: keep unsaved entry and relationship drafts together
  until final save.
- Auto-created shell record: create a lightweight saved entry as soon as a link
  is added.

Accepted decision:

- Staged local draft graph for browser and mobile, with one atomic commit that
  saves the entry and relationships together.

Why this matters:

This choice affects entry ids, validation, undo/discard behavior, mobile
auto-save semantics, recovery snapshots, and tests.

### Gate 4: Mobile Navigation Shape

Decision needed:

- Confirm whether mobile should use four or five bottom tabs.

Accepted decision:

- Four tabs initially: Workbench, Timeline, Links, More.
- Put Knowledge And Schema inside More until schema editing is implemented.

Why this matters:

Mobile route files, E2E flows, tab labels, and user muscle memory depend on
this.

### Gate 5: Schema MVP Boundary

Decision needed:

- Decide how much user-defined field power belongs in the first schema release.

Accepted decision:

- MVP supports user fields for built-in/custom entry types with these value
  modes only: free text, multiline text, controlled value, single link, multi
  link.
- Defer formulas, number validation, date parsing, conditional logic beyond
  category visibility, and custom relationship inverses.

Why this matters:

Schema breadth can easily dominate the project and destabilize import/export.

### Gate 6: Compatibility And Migration Policy

Decision needed:

- Confirm how strongly old URLs, saved local documents, and current exports
  must keep working.

Accepted decision:

- Use a clean-break route and schema policy because there are no live users and
  no live data to preserve.
- Replace old section-heavy routes with the new workflow route model rather than
  carrying long-term compatibility redirects.
- Introduce the next document schema when the implementation needs it, without
  preserving v2 import compatibility as a product requirement.

Why this matters:

This reduces migration complexity and lets the implementation optimize around
the new Workbench, Timeline, Links, Knowledge, and Utilities model from the
start.

### Gate 7: Acceptance Evidence

Decision needed:

- Agree on minimum evidence before each major slice is considered complete.

Accepted decision:

- Core unit tests.
- Web typecheck.
- Mobile typecheck.
- Browser smoke screenshots.
- Mobile render tests for changed screens.
- Focused workflow tests for character create/link, place create/link,
  timeline involvement, relationship repair, and export/import.

Why this matters:

This is a cross-platform IA change, not a cosmetic refactor.

## Implementation Progress

### Completed Slice: Shared Route And Mobile Shell Foundation

Status: completed on 2026-07-05.

Implemented:

- Shared shell routes now expose Workbench, Timeline, Relationships, Knowledge,
  and Utilities as the browser workflow surfaces.
- Native mobile primary tabs now use Workbench, Timeline, Links, and More.
- Timeline has a dedicated mobile tab that reuses the existing entry workflow
  with the timeline section fixed.
- Legacy mobile Overview, Workspaces, Data, and Help screens remain routable but
  are no longer primary tabs.
- Browser navigation now prioritizes workflow surfaces and avoids duplicating
  Timeline as both a section shortcut and a primary route.
- Browser Knowledge and Utilities route pages exist as lightweight consolidation
  surfaces; later completed slices filled in the deeper Workbench and schema
  workflows.

Evaluation after implementation:

- The route and tab shape matches the accepted gates for both browser and
  mobile.
- Existing entry, relationship, data, workspace, and help routes still resolve.
- At this point in the implementation, Workbench was label/route foundation
  only; later completed slices added selected context, inline editing, and
  quick creation.

### Completed Slice: Shared Utilities Destination Model

Status: completed on 2026-07-05.

Implemented:

- Shared utility destination copy and route targets live in `@valgaron/core`.
- Browser Utilities and mobile More consume the same destination model.
- This reduces drift between web and mobile while the Utilities surface grows.

Evaluation after implementation:

- Utilities/More has one source of truth for Knowledge Setup, Data Tools, and
  Help.
- Superseded by the later Knowledge ownership slices: Knowledge Setup now opens
  the dedicated Knowledge surface, while Workspaces remains a project/world
  management utility.

### Completed Slice: Shared Record Index And Browser Workbench Foundation

Status: completed on 2026-07-05.

Implemented:

- Shared Workbench record index model lives in `@valgaron/core`.
- The model provides saved queues for all, recent, pinned, incomplete,
  unlinked, needs-review, and archived records.
- The model provides selected record context with section, relationship count,
  completeness, and drafting prompts.
- Browser `/entries` now opens a real Workbench route with search, saved view
  controls, record cards, and a selected-context panel.
- Deep `/entries` links with `intent=new`, `intent=edit`, or legacy bare
  `entryId` still route to the existing section editor, preserving current
  editing behavior during the incremental migration.
- Deep `/entries` links with `intent=context` stay on Workbench so selected
  records and related-record chips can be reviewed without entering the editor.

Evaluation after implementation:

- Browser Workbench no longer behaves as a bare redirect.
- Query-only `/entries?query=...` links seed Workbench search.
- At this point in the implementation, the editor remained the existing section
  editor; later completed slices added mobile Workbench modes, inline browser
  editing, and inline browser quick create.

### Completed Slice: Shared Record Picker Foundation

Status: completed on 2026-07-05.

Implemented:

- Shared Workbench record picker model lives with the record index model in
  `@valgaron/core`.
- The picker supports search, selected records, excluded records, result caps,
  hidden counts, archived filtering, and empty-state text.
- This gives future inline relationship fields one platform-neutral picker
  contract for browser and mobile.

Evaluation after implementation:

- At this point in the implementation, the picker was model-only and had not
  replaced existing relationship pickers.
- Later slices added production picker consumers while preserving specialized
  relationship field controls where they fit better.

### Completed Slice: Relationship Picker And Entity Chip Integration

Status: completed on 2026-07-05.

Implemented:

- Mobile relationship entry picking now uses the shared Workbench record picker
  model under the existing relationship screen.
- Shared entity chip model was added for records related to the selected
  Workbench context.
- Browser Workbench selected context now shows linked records as reusable entity
  chips.

Evaluation after implementation:

- Existing relationship form selects and saved relationship lists remain
  unchanged.
- The shared picker now has at least one production UI consumer.
- Entity chips remain navigation surfaces; later completed slices added
  create-and-link and staged relationship save support in entry editors.

### Completed Slice: Inline Relationship Preferred Target Expansion

Status: completed on 2026-07-05.

Implemented:

- Shared relationship field target display now supports expanding hidden
  preferred targets before exposing unusual targets.
- Browser linked-field pickers now offer Show More Preferred Records when a
  field has more preferred matches than the compact default.
- Mobile linked-field pickers use the same preferred-target expansion behavior,
  with search changes resetting temporary expansion state.

Evaluation before implementation:

- The root cause was a picker workflow cost: inline relationship fields could
  hide valid preferred targets behind refinement copy, forcing users to alter a
  search query when they simply wanted to browse the rest of the likely links.
- The best path was to update the shared relationship field display model so
  browser and mobile keep the same preferred-before-unusual progression while
  rendering platform-native controls.

Re-evaluation after implementation:

- Users can now browse all preferred inline relationship targets before opting
  into unusual targets, reducing interaction cost for character, place, and
  timeline linking workflows.
- The compact default and query reset behavior preserve scan performance and
  keep large result sets intentional.
- A re-evaluation pass centralized mobile linked-field picker resets and reset
  browser picker expansion when the selected entry or field changes, preventing
  temporary expansion state from leaking across records.

### Completed Slice: Entry Draft Transaction Foundation

Status: completed on 2026-07-05.

Implemented:

- Core `EntryDraftTransaction` helper can commit an entry draft and staged
  relationship drafts together.
- Staged relationships can point at a temporary draft entry id and are remapped
  to the saved entry id during commit.
- Transaction preflight validation checks the entry draft and staged
  relationships before UI calls commit.

Evaluation after implementation:

- This started as model-only; later slices wire the transaction path into
  browser and mobile entry editors.
- Existing save flows are unchanged.
- Later transaction-adoption and create-and-link slices use this model inside
  entry editors before final save.

### Completed Slice: Entry Editor Transaction Adoption

Status: completed on 2026-07-05.

Implemented:

- Browser `EntryForm` supports draft-level save callbacks while retaining the
  previous entry-level save fallback.
- Browser section entry saves now route through the transaction commit helper
  with zero staged relationships.
- Browser legacy relationship text migration saves through the same draft-save
  path.
- Mobile `saveEntryDraft` now routes through the transaction validation and
  commit helpers with zero staged relationships.

Evaluation after implementation:

- Current editor behavior remains unchanged for users.
- Browser and mobile entry saves now share the same transaction commit
  foundation.
- Later browser and mobile create-and-link slices add staged relationship UI on
  top of this shared save path.

### Completed Slice: Staged Relationship Draft List Foundation

Status: completed on 2026-07-05.

Implemented:

- Core staged relationship draft type with stable staged ids.
- Shared helpers to create, upsert, delete, and filter staged relationship
  drafts for the current draft entry.
- Tests cover staged draft replacement and draft-entry filtering.

Evaluation after implementation:

- Later browser and mobile create-and-link slices expose staged controls using
  this shared list semantics.

### Completed Slice: Browser Create-And-Link Staging

Status: completed on 2026-07-05.

Implemented:

- Browser new-entry editor now exposes a staged "Links to create on save"
  panel.
- Users can choose an existing target record, relationship type, and note before
  the new entry is saved.
- Staged links are included in dirty-state tracking and transaction validation.
- Saving the entry commits the entry and staged relationships together through
  the shared transaction helper.

Evaluation after implementation:

- The panel is only shown where transaction draft-save support is available.
- Archived records are not offered as create-and-link targets.
- Duplicate staged target/type links are blocked before save.
- Mobile create-and-link staging is covered by the next completed slice.

### Completed Slice: Mobile Create-And-Link Staging

Status: completed on 2026-07-05.

Implemented:

- Mobile new-entry editor now exposes the same staged "Links to create on save"
  workflow as the browser editor.
- Users can search/select an existing target record, define the relationship
  type, add a note, stage multiple links, and remove staged links before save.
- Staged links participate in mobile dirty-state protection, so route changes,
  section changes, entry selection, and new-draft actions prompt before
  discarding staged create-and-link work.
- Mobile entry save now commits the draft entry and staged relationships
  through the shared transaction helper.

Evaluation after implementation:

- The workflow is intentionally limited to new records, where create-and-link
  removes the most interaction cost.
- Target selection uses the full non-archived record picker index so searchable
  mobile select can reach records beyond the initially visible result set.
- Duplicate staged target/type links are blocked before save.
- Existing-entry relationship editing remains in the dedicated relationship and
  linked-field workflows to avoid mixing maintenance actions into the creation
  panel.

### Completed Slice: Browser Workbench Section Actions

Status: completed on 2026-07-05.

Implemented:

- Shared Workbench section action model with per-section counts, active state,
  section routes, and create routes.
- Shared Workbench index filtering by active section before view construction,
  so section-scoped views, search, and counts remain consistent.
- Browser Workbench now renders section filters and quick-create actions for
  all entry types, reducing the need to leave the Workbench just to start a
  character, place, faction, lore note, or timeline record.

Evaluation after implementation:

- This completes the next Workbench hub slice without moving the full editor
  layout yet.
- The action model is platform-neutral and can be reused when mobile Workbench
  mode splitting begins.
- At this point, create routes still handed off to the existing section editor;
  later completed Workbench slices made the primary browser create action
  inline.

### Completed Slice: Browser Workbench Deep-Link Hydration

Status: completed on 2026-07-05.

Implemented:

- Workbench record items now distinguish between a Workbench context route and
  the current section editor route.
- Browser `/entries` now hydrates section, selected record, and search query
  state from route parameters instead of redirecting all deep links back to
  section pages.
- In-page Workbench selection, section filtering, and search update the route
  parameters so browser back/forward and copyable URLs preserve the current
  Workbench context.
- Route create intents still preserve compatibility with the existing section
  editor, while later completed browser Workbench slices made primary in-page
  creation and editing inline.

Evaluation after implementation:

- Users can follow related-record context links and remain in the Workbench.
- Users can still open the current editor explicitly when they need full record
  editing.
- Selected context remains visible even when a search query filters the index,
  which avoids losing record context while narrowing lists.

### Completed Slice: Browser Workbench Relationship Actions

Status: completed on 2026-07-05.

Implemented:

- Shared selected-record context now exposes a direct relationship studio route
  for the selected record.
- Browser Workbench renders a "Manage Links" action next to "Open Editor" for
  selected records.

Evaluation after implementation:

- This reduces interaction cost for relationship maintenance from Workbench
  without duplicating the Relationship Studio UI.
- The action is platform-neutral in the shared model and can be reused in the
  later mobile Workbench context mode.

### Completed Slice: Browser Workbench View Route Persistence

Status: completed on 2026-07-05.

Implemented:

- Shared Workbench view ids now have a typed route-parameter validator.
- Browser Workbench reads the `view` query parameter on load and route changes.
- Changing saved Workbench views updates the URL, so back/forward navigation and
  copied URLs preserve the chosen drafting queue.
- Section changes reset the saved view to Recent and clear the `view` parameter
  to keep section-scoped browsing predictable.

Evaluation before implementation:

- The root cause was an incomplete Workbench route contract: search, section,
  and selected context were preserved in the URL, but the active saved view was
  local component state only.
- The best path was route persistence rather than a larger editor extraction,
  because this directly improves current Workbench navigation without changing
  persistence or editing behavior.

Re-evaluation after implementation:

- Users can share or revisit Workbench views such as Incomplete, Unlinked, or
  Needs Review without reconstructing the queue manually.
- Invalid view parameters fall back to Recent, keeping arbitrary URLs safe.
- No data model, mobile route, or editor behavior changes were needed.

### Completed Slice: Browser Workbench Selected Inline Editor

Status: completed on 2026-07-05.

Implemented:

- Browser Workbench now renders a three-pane desktop layout: record index,
  inline editor, and selected context.
- The inline editor reuses the existing browser `EntryForm`, `EntryDetail`,
  transaction save path, relationship-backed fields, duplicate/template
  actions, archive/restore actions, delete confirmation, and dirty-state
  warning behavior.
- Changing the selected Workbench record or section now asks for confirmation
  before discarding unsaved inline editor changes.
- Browser link navigation from a dirty inline editor is protected by the shared
  unsaved-change warning.

Evaluation before implementation:

- The root cause was the remaining Phase 5 workflow split: Workbench could find
  and inspect records, but users still had to leave the route for full editing.
- The best path was component reuse rather than a new editor, because the
  section editor already owns validation, transaction commits, linked fields,
  destructive actions, and accessibility labeling.

Re-evaluation after implementation:

- Selected-record browse, edit, relationship field maintenance, and context
  review now happen in one browser Workbench route.
- The legacy section editor remains available through explicit Open Editor
  links, preserving a lower-risk fallback.
- No schema, persistence, or mobile behavior changes were needed.

### Completed Slice: Browser Workbench Inline Quick Create

Status: completed on 2026-07-05.

Implemented:

- Browser Workbench section create actions now open an inline new-entry draft
  for the chosen section instead of handing off to a legacy section route.
- Inline create uses the same transaction save path as the selected-record
  editor, including staged create-and-link support before the entry is saved.
- Starting a new inline draft respects existing dirty-state confirmation.

Evaluation before implementation:

- The root cause was an interaction-cost gap left after selected-record inline
  editing: users could edit in Workbench, but creation still exited the
  Workbench route.
- The best path was to reuse the inline editor's new-record mode and keep route
  parameters section-scoped without adding another modal or drawer.

Re-evaluation after implementation:

- Users can create characters, places, factions, lore notes, timeline events,
  and custom-section records from the Workbench index without leaving the
  browser Workbench.
- The old create URLs remain reachable from route compatibility paths, but the
  primary Workbench create workflow is now inline.
- This closes the remaining high-impact browser Workbench MVP workflow gap
  without starting a broader visual redesign.

### Completed Slice: Mobile Workbench Mode Split Foundation

Status: completed on 2026-07-05.

Implemented:

- Shared mobile Workbench mode model with Index, Context, and Edit options.
- Mobile Entries screen now renders a mode switcher and gates the existing
  filters/list, selected-record context, review cleanup, and editor blocks by
  mode.
- Deep-linked records and new-entry intents open Edit; section-only routes open
  Index.
- Record rows now offer direct Edit and Context actions, reducing the need to
  scroll through unrelated mobile sections.

Evaluation after implementation:

- This completes the first mobile Workbench split without rewriting the long
  editor or changing persistence behavior.
- Context is disabled until it has selected-record or review content, avoiding
  an empty dead-end mode.
- Later mobile slices add mode-specific summaries and move more context/review
  affordances into compact panels; this slice intentionally keeps existing
  editor internals intact.

### Completed Slice: Mobile Workbench Index Create Action

Status: completed on 2026-07-05.

Implemented:

- Mobile Index mode now exposes a section-specific new-record action.
- The action reuses the existing new-draft path, including dirty-state
  confirmation and the transition into Edit mode.

Evaluation after implementation:

- Users can start a character, place, faction, lore note, or timeline event
  from the filtered list view without first switching modes manually.
- This reduces creation interaction cost while keeping save and discard
  behavior unchanged.

### Completed Slice: Mobile Section Index Expansion

Status: completed on 2026-07-05.

Implemented:

- Mobile Index mode now supports Show More/Show Fewer for section record lists
  that exceed the compact mobile result limit.
- Hidden-count copy now describes remaining records directly instead of telling
  users to refine section search or filters when an expansion action exists.
- Index expansion resets when section, search, status, tag, archived visibility,
  updated-range, era, or involved-record filters change.
- Mobile render coverage now verifies dense section indexes expose the
  expansion affordance.

Evaluation before implementation:

- The root cause was a mobile-only browsing cap: dense section lists stayed
  reachable through search, but users could not simply continue scanning the
  current result set.
- The best path was mobile-local expansion state because the existing entry
  list model already produces the full filtered list and the cap is a rendering
  concern.

Re-evaluation after implementation:

- Mobile users can keep compact default indexes for repeated use and expand the
  current result set only when needed.
- Search remains useful for large worlds, but it is no longer the only path to
  records beyond the first compact batch.

### Completed Slice: Mobile Workbench Context Summary Actions

Status: completed on 2026-07-05.

Implemented:

- Mobile Context mode now shows a selected-record summary before relationship
  details.
- Context mode includes direct actions to edit the selected record or return to
  Index.

Evaluation after implementation:

- Users can orient around the selected record without scrolling into the full
  editor.
- Context mode now has local navigation actions, reducing reliance on the top
  mode switcher for common transitions.

### Completed Slice: Mobile Workbench Context Completeness

Status: completed on 2026-07-05.

Implemented:

- Mobile Context mode now reuses the shared Workbench selected-record context
  model to show relationship count, completeness, and top drafting prompts.
- Mobile `/entries` routes now support `intent=context` so deep links can open
  the lightweight context panel directly.
- Mobile render coverage verifies direct context routing, summary actions, link
  management, and related-record context without rendering the full editor.

Evaluation after implementation:

- The root issue was context asymmetry: browser Workbench selected context
  surfaced relationship count and completeness prompts, while mobile Context
  only showed basic entry metadata before linked records.
- The best path was to reuse the shared Workbench context model instead of
  duplicating completeness and relationship-count logic inside the mobile
  screen.
- Mobile Context mode now better supports review and triage workflows without
  forcing users into Edit mode.

### Completed Slice: Mobile Mode Summary Cues

Status: completed on 2026-07-05.

Implemented:

- Shared mobile Workbench/Timeline mode summary helper now describes the active
  mode's current state: visible record/event count, selected context, or active
  draft.
- Mobile Entries renders the compact summary directly under the mode switcher.
- Core and mobile render coverage verify Workbench Edit, Workbench Context, and
  Timeline Events summaries.

Evaluation after implementation:

- The root issue was that mobile mode labels explained what a mode does, but
  not what the current mode contains; users still had to scroll to know whether
  they were editing a selected record, reviewing context, or seeing a filtered
  list.
- The best path was a shared summary helper because Workbench and Timeline use
  the same Index/Context/Edit mode model with different nouns.
- This completes the earlier mode-summary gap without changing editor
  internals, persistence, or route behavior.

### Completed Slice: Mobile Staged Link Summary Cues

Status: completed on 2026-07-05.

Implemented:

- Shared mobile mode summaries now accept a staged relationship count.
- Mobile Edit mode passes the current staged link count so new drafts can
  communicate when staged links will be saved with the record.
- Core coverage verifies staged-link summary copy.

Evaluation after implementation:

- The root issue was a state-cue gap created by the staged create-and-link
  workflow: users could stage links lower in the editor, but the compact mode
  summary still described the draft as a plain new record.
- The best path was extending the shared summary helper instead of adding
  mobile-only copy next to the staged-link panel.
- No route, persistence, or transaction behavior changed; this only improves
  mobile orientation while drafting.

### Completed Slice: Staged Link Submit Cue

Status: completed on 2026-07-05.

Implemented:

- Shared entry editor submit labels now accept a staged relationship count.
- Browser and mobile new-entry forms now label the primary submit action as
  creating both the record and staged links when staged links exist.
- Core coverage verifies singular, plural, and existing-entry submit labels.

Evaluation after implementation:

- The root issue matched the mobile staged-link summary gap: users could stage
  links lower in the editor, but the primary submit action still looked like a
  plain record create action.
- The best path was to extend the shared submit-label helper, keeping the
  browser and mobile forms simple while avoiding duplicate copy.
- No transaction behavior changed; this is an orientation cue for the already
  implemented create-and-link save path.

### Completed Slice: Shared Workbench Context Routes

Status: completed on 2026-07-05.

Implemented:

- Shared entry routes now treat `intent=context` as a first-class workflow
  intent alongside browse, create, and edit.
- Browser `/entries?...intent=context` routes now remain on Workbench instead
  of being redirected to the legacy section editor.
- Workbench selected-record links and linked-record chips now use context
  routes, while explicit Edit actions still open the editor.
- Mobile route application now preserves Context mode when route params change,
  so linked context navigation does not silently fall back to Edit mode.

Evaluation after implementation:

- The root issue was route ambiguity: `entryId` was overloaded to mean edit,
  which made context review links impossible to preserve across browser and
  mobile.
- The best path was to introduce a typed context intent and keep the existing
  edit/new redirects intact for users who explicitly choose editing.
- The result is a more cohesive linked-record review loop: users can move from
  one related record context to another, then enter editing only when they
  intentionally choose an edit action.

### Completed Slice: Mobile Related Context Navigation

Status: completed on 2026-07-05.

Implemented:

- Shared relationship routing now distinguishes the existing edit route from a
  new context route for related records.
- Mobile Context relationship rows now use the context route and label the
  action as "Review Context" instead of the ambiguous "Open".
- Mobile render coverage verifies the related-record context action copy.

Evaluation after implementation:

- The root issue was cross-platform drift after context routes became shared:
  browser Workbench linked-record chips stayed in context review, while mobile
  relationship rows still navigated through edit routes.
- The best path was to add a small shared helper rather than repurpose the
  existing edit helper, because Relationship Studio and editor workflows still
  need explicit edit navigation.
- Mobile and browser now share the same low-cost related-record review loop:
  review context first, then choose Edit only when changing record content.

### Completed Slice: Relationship Graph Context Open

Status: completed on 2026-07-05.

Implemented:

- Browser Relationship Studio graph node "Review Context" actions now route to
  Workbench context instead of the legacy section editor.
- Mobile Relationship Studio graph node "Review Context" actions now use the same
  context route, while Review Entry and source/target maintenance actions keep
  their edit routes.
- Browser smoke coverage verifies that the selected graph node Review Context
  link targets `intent=context`.

Evaluation after implementation:

- The root issue was action ambiguity in graph review: selecting a graph node is
  an exploration task, but the open action still forced the heavier edit
  workflow.
- The best path was to scope context routing to graph-node open actions only,
  because legacy text cleanup still needs the user to edit fields and
  source/target actions in Links mode remain maintenance-oriented.
- The graph workflow now matches the Workbench context loop: inspect a connected
  record first, then choose explicit editing when needed.

### Completed Slice: Relationship Graph Context Copy

Status: completed on 2026-07-05.

Implemented:

- Relationship graph node actions now label the context-opening action as
  "Review Context" instead of "Open Entry".
- Browser smoke coverage now waits for and verifies the updated action copy
  while still checking that the link targets `intent=context`.

Evaluation after implementation:

- The root issue was copy-behavior mismatch after graph opens moved to
  Workbench context: "Open Entry" implied a generic or editor-style navigation
  even though the action intentionally opens review context.
- The best path was to update the shared relationship copy, because the graph
  action is rendered on both browser and mobile from the same label.
- No additional behavior change was needed; the route correction from the
  previous slice remains intact.

### Completed Slice: Browser Timeline Route Foundation

Status: completed on 2026-07-05.

Implemented:

- Browser Timeline now has an explicit route page instead of relying only on
  the generic section route.
- Shared section rendering can now be fixed to a specific section id, matching
  the mobile Timeline tab's fixed-section pattern.

Evaluation after implementation:

- This creates a dedicated browser Timeline surface boundary without changing
  event editing or persistence behavior.
- Timeline still reuses the section-derived list/editor internals; the next
  Timeline slices should move toward shared surface models and mode-specific
  timeline controls.

### Completed Slice: Mobile Timeline Mode Copy

Status: completed on 2026-07-05.

Implemented:

- Shared mobile entry-mode model now supports a Timeline surface variant.
- Mobile Timeline tab uses Timeline-specific mode title and Events/Context/Edit
  labels instead of generic Workbench copy.

Evaluation after implementation:

- Timeline users get surface-specific orientation without a separate screen
  rewrite.
- The mode model remains shared, so future Timeline screen splitting can reuse
  the same mode contract.

### Completed Slice: Browser Timeline Surface Copy

Status: completed on 2026-07-05.

Implemented:

- Fixed browser Timeline surfaces now use shared Timeline intro copy instead of
  generic "Codex section" copy.

Evaluation after implementation:

- Browser Timeline now reads as a dedicated chronology surface while preserving
  the existing section editor workflow.
- Generic section routes keep their existing section-oriented intro copy.

### Completed Slice: Timeline Era Manager MVP

Status: completed on 2026-07-05.

Implemented:

- Shared Timeline Era Manager model with sorted named-era counts and unassigned
  event count.
- Browser Timeline overview now shows era counts before the timeline table.
- Mobile Timeline Events mode now uses the Era Manager as the era filter
  surface, including counts and an unassigned-event indicator.

Evaluation after implementation:

- Users can understand era coverage at a glance on both platforms.
- Mobile avoids duplicate era controls by folding era filtering into the Era
  Manager block.
- This completed the count/filter MVP; a later slice adds rename, merge, and
  bulk reassignment actions.

### Completed Slice: Timeline Era Reassignment

Status: completed on 2026-07-05.

Implemented:

- Shared Timeline era reassignment helper updates every event in a source era
  to a target era.
- The same helper supports renaming an era, merging one era into another, and
  assigning unassigned events to a named era.
- Browser Timeline Era Manager now renders a source-era selector, target-era
  field, and Apply Era Change action.
- Mobile Timeline renders the same source selection and target field inside the
  Timeline Browser/Era Manager block.
- Mobile controller and shared document mutation support committing era
  reassignment through the same active-workspace update path as event ordering.

Evaluation before implementation:

- The root cause was that era drift was visible but not actionable; users had
  to open every affected event to rename or merge eras.
- The best path was a shared event-update helper rather than a new schema,
  because era is already an event field and bulk reassignment is an ordinary
  multi-entry edit.

Re-evaluation after implementation:

- Users can now correct era naming drift or assign unassigned timeline events
  in one workflow on browser and mobile.
- The interaction stays scoped to timeline events and reuses existing save
  semantics, avoiding a broader calendar or era-entity model.
- Further Era Manager improvements, such as dedicated era descriptions or
  durable era records, are not needed for the current UX plan slice.

### Completed Slice: Timeline Unassigned Era Filter

Status: completed on 2026-07-05.

Implemented:

- Shared Timeline filtering now has an explicit unassigned-era filter value,
  avoiding the previous conflict where an empty era filter meant "Any Era".
- Browser Timeline filters include an Unassigned Era option when unassigned
  events exist.
- Mobile Timeline turns the Unassigned Era count chip into an active filter
  chip instead of a disabled indicator.
- Shared entry-list tests cover filtering timeline entries down to unassigned
  events.

Evaluation before implementation:

- The root cause was that unassigned events were visible as a count, but users
  could not isolate them before assigning or editing them.
- The best path was a shared sentinel filter value because empty string already
  has established "all eras" semantics across web and mobile filters.

Re-evaluation after implementation:

- Users can find unassigned events first, then either edit individual events or
  use Era Manager reassignment to assign them in bulk.
- Browser and mobile now expose the same unassigned-era workflow without
  changing the event schema.
- No further unassigned-era filtering gap remains.

### Completed Slice: Timeline Help Alignment

Status: completed on 2026-07-05.

Implemented:

- Shared focused Timeline Help now mentions Era Manager reassignment and
  unassigned-era filters.
- Shared workflow Help now points users to Timeline order controls and Era
  Manager reassignment together.
- Help topic tests cover the new Timeline guidance.

Evaluation before implementation:

- The root cause was that Timeline Help still described era browsing before
  reassignment and unassigned filtering existed.
- The best path was updating shared Help copy in core so browser Help and
  mobile Help stay aligned.

Re-evaluation after implementation:

- Users who open focused Timeline Help can discover the new Era Manager
  workflow without platform-specific copy drift.
- No further high-signal Timeline Help mismatch remains for this slice.

### Completed Slice: Timeline Involved-Record Linked Field

Status: completed on 2026-07-05.

Implemented:

- Timeline events now define a relationship-backed "Involved records" field.
- The field targets characters, places, factions, and lore records using the
  existing shared relationship field model and picker behavior.
- Browser editor filtering now removes relationship-backed text fields for any
  entry kind with active linked-field configs, not only character and place.

Evaluation after implementation:

- Saved timeline events can author involved-record links through the same
  shared linked-field controls used elsewhere.
- Existing timeline diagnostics continue to treat all relationships connected to
  an event as involved; this slice adds a structured authoring path for new
  involved links.
- A custom Timeline event editor remains future work.

### Completed Slice: Browser Timeline Event Open Actions

Status: completed on 2026-07-05.

Implemented:

- Browser Timeline table rows now include an Open action that deep-links to the
  selected timeline event in edit context.
- Browser Timeline era cards now include an Open Event action so users can move
  from chronology review to event editing without returning to the side list.
- Timeline event edit URLs use the shared route-search formatter:
  `/timeline?entryId=...&intent=edit&query=...`.
- Shared workflow-intent classification now treats Timeline edit URLs as
  `entry-edit` workflows with `sectionId: "timeline"` while preserving
  `/timeline` as the overview workflow.

Evaluation after implementation:

- The slice reduces browser interaction cost for timeline review/edit loops by
  turning each visible event into a direct editing entry point.
- Deep-link behavior stays aligned with the existing Timeline route and shared
  SectionPage query hydration instead of adding a separate editor surface.
- The route-intent improvement closes a cross-platform semantics gap found
  during review; tools that reason about workflows can now distinguish Timeline
  overview from Timeline event editing.
- No additional UI iteration was needed after validation; a future custom
  Timeline event editor can reuse the same route contract.

### Completed Slice: Mobile Timeline Event Actions

Status: completed on 2026-07-05.

Implemented:

- Mobile Timeline grouped event cards now include Edit and Context actions for
  each visible event in the chronology view.
- Event actions use the existing mobile entry selection flow so Timeline users
  can move directly from Events mode into Edit or Context mode.
- Mobile selection now switches modes even when the same record is already
  selected, avoiding a dead interaction when users move between Context and
  Edit for the current record.
- Mobile render coverage now verifies the Timeline tab exposes grouped event
  actions from an unfiltered Timeline route.

Evaluation after implementation:

- The mobile Timeline now matches the browser slice's review-to-edit affordance
  while staying platform-native and preserving the existing mobile mode model.
- Interaction cost drops for timeline-first workflows because users no longer
  need to scan the grouped chronology, then find the same event again in the
  generic section list before editing.
- The selected-record mode fix improves Timeline and Workbench behavior without
  changing persistence or draft transaction semantics.
- No further mobile Timeline event-action gaps were found after focused render
  and type validation.

### Completed Slice: Shared Timeline Editor Field Groups

Status: completed on 2026-07-05.

Implemented:

- Shared entry editor detail grouping now treats Timeline events as a
  first-class authoring workflow instead of a generic detail list.
- Timeline event fields are grouped into Chronology, Linked records, and
  Outcomes so order, date, era, involved records, and consequences appear in
  the order writers naturally reason about an event.
- Browser Timeline editing and mobile Timeline editing both consume the same
  shared grouping model through the existing entry editor infrastructure.
- Mobile render coverage now verifies the focused Timeline edit route exposes
  chronology and outcome groups plus the linked timeline fields panel.

Evaluation before implementation:

- Root cause: Timeline had a dedicated overview, review tray, era manager, and
  event actions, but the edit form still presented event-specific fields as a
  generic section detail block.
- The best path was a shared model change because both browser and mobile
  already render `getEntryEditorDetailFieldGroups`; adding a separate
  platform-specific editor would duplicate behavior before the workflow proves
  it needs custom controls.

Re-evaluation after implementation:

- The event authoring path now has a clearer chronology-first structure across
  both platforms without changing persistence, routes, or relationship-backed
  involved-record behavior.
- Selected Timeline events keep involved records in the linked-field editor,
  while new Timeline drafts can still stage relationship links before save.
- No additional custom Timeline editor gap remains for this slice; richer
  controls such as numeric order steppers or date parsing should be evaluated
  separately against observed friction.

### Completed Slice: Timeline Context-Aware New Drafts

Status: completed on 2026-07-05.

Implemented:

- Shared section draft creation now accepts a narrow creation context for
  Timeline era seeding.
- Browser Timeline new-entry transitions now preserve the active era filter in
  the new event draft, while leaving the special Unassigned filter blank.
- Mobile Timeline `intent=new` routes and New Timeline Event actions now seed
  the draft era from the requested or active era context.
- Core and mobile render coverage now verify the seeded-era behavior.

Evaluation before implementation:

- Root cause: Timeline browse filters helped users narrow chronology context,
  but creating a new event from that context discarded the era and forced users
  to re-enter it manually.
- The best path was extending the shared draft factory because both platforms
  already use `createSectionEntryDraft` for new entries.

Re-evaluation after implementation:

- Era-scoped creation now costs fewer interactions on both platforms and stays
  compatible with the existing generic editor and route model.
- The helper deliberately avoids seeding the synthetic Unassigned filter because
  that filter means the draft should have no era value.
- Involved-record seeding was left for a separate slice because it requires
  staging a relationship transaction, not just pre-filling a text detail field.

### Completed Slice: Timeline Context-Aware Involved Links

Status: completed on 2026-07-05.

Implemented:

- Shared Timeline helpers now create an initial staged `involves` relationship
  from a new draft event to an active involved-record context.
- Browser Timeline new-event drafts capture initial involved-record staged links
  at draft creation time, so later filter changes do not reset in-progress
  editor content.
- Mobile Timeline `intent=new` routes and New Timeline Event actions now seed a
  staged involved-record link when the involved-record filter points at a valid
  target.
- Mobile render coverage now verifies contextual Timeline creation shows the
  seeded era, the staged involved record, and the combined create-and-link save
  action.
- Browser smoke now verifies the matching route-level Timeline creation path
  renders the seeded era, staged involved link, and combined save action.

Evaluation before implementation:

- Root cause: Timeline browse could filter by involved record, but creating a
  new event from that context still required users to manually stage or add the
  involved-record relationship.
- The best path was to reuse the existing staged relationship transaction
  system rather than create a custom Timeline editor or save the link outside
  the entry save flow.

Re-evaluation after implementation:

- Era and involved-record scoped creation now work as one contextual draft
  pattern across browser and mobile.
- The browser implementation stores initial staged links with the draft rather
  than deriving them from live filters, avoiding destructive resets while users
  type.
- The slice still avoids durable Timeline-specific event models; the current
  shared draft transaction remains sufficient for the prototype.

### Completed Slice: Timeline Era Authoring Suggestions

Status: completed on 2026-07-05.

Implemented:

- Timeline Era now opts into existing-value suggestions through the shared field
  definition model.
- Browser Timeline editing inherits era suggestions through the existing
  datalist renderer.
- Mobile Timeline editing inherits the same era suggestions through the shared
  detail-field suggestion chips.
- Core editor-model coverage now verifies Timeline Era suggests other saved
  era values while excluding the current draft value.

Evaluation before implementation:

- Root cause: Timeline had an Era Manager and era filters, but the actual event
  editor treated Era as a blank text field with no reuse help.
- The best path was a field-definition change because the shared editor already
  supports suggestions on both platforms.

Re-evaluation after implementation:

- Users can reuse existing eras with fewer keystrokes while retaining free-form
  era creation by typing a new value.
- No custom Timeline editor, vocabulary schema, or migration is needed for this
  slice.

### Completed Slice: Timeline Create Route Intent Classification

Status: completed on 2026-07-05.

Implemented:

- Shared workflow route samples now include contextual Timeline creation:
  `/timeline?intent=new&era=...&involvedEntryId=...`.
- Shared workflow intent classification now treats Timeline `intent=new` routes
  as `entry-create` with `sectionId: "timeline"` and, after later route-context
  hardening, typed Timeline create context.
- Core route-intent coverage now verifies Timeline overview, Timeline create,
  and Timeline edit routes classify as distinct workflows.

Evaluation before implementation:

- Root cause: browser and mobile now support contextual Timeline creation, but
  the shared workflow-intent model still classified every Timeline route without
  an entry id as Timeline overview.
- The best path was a core route-intent update because no UI behavior needed to
  change; the runtime route already worked.

Re-evaluation after implementation:

- Workflow analytics, help routing, parity checks, and future automation can now
  distinguish Timeline event creation from Timeline browsing.
- Later route-context work promoted era and involved-record params into an
  optional typed `timelineContext` on Timeline create intents, after route
  reseeding showed those params are part of the selected workflow state.

### Completed Slice: Mobile Timeline Create Route Adapter Coverage

Status: completed on 2026-07-05.

Implemented:

- Mobile route adapter tests now explicitly verify contextual Timeline create
  links preserve `intent=new`, `era`, and `involvedEntryId` when converted to
  Expo Router hrefs.
- The broad shared-route sample coverage now includes the same Timeline create
  route through `codexWorkflowRouteSamples`.

Evaluation before implementation:

- Root cause: the adapter behavior already preserved generic Timeline query
  params, but the newly supported Timeline create route did not have a direct
  mobile assertion.
- The best path was focused coverage instead of production code changes because
  the adapter is intentionally generic and already preserves all route params.

Re-evaluation after implementation:

- Browser route classification, browser smoke, mobile route adaptation, and
  mobile render coverage now all cover contextual Timeline creation.
- No mobile navigation code change was needed.

### Completed Slice: Timeline Contextual Creation Help Alignment

Status: completed on 2026-07-05.

Implemented:

- Focused Timeline Help now describes contextual new-event drafts alongside
  order, Era Manager, and involved-record filters.
- Shared workflow Help now names filtered new-event drafts as part of arranging
  events while keeping flexible dates, eras, and involved-record links.
- The user guide Timeline section now explains that creating an event from an
  active era or involved-record filter starts the draft with that context.

Evaluation before implementation:

- Root cause: the runtime now supports contextual Timeline creation, but Help
  and guide copy still described Timeline filters only as browsing tools.
- The best path was shared Help copy plus one user-guide sentence because the
  behavior itself was already implemented and validated.

Re-evaluation after implementation:

- Browser Help, mobile Help, and docs now explain the new workflow without
  introducing new UI or route behavior.
- The copy avoids promising a custom Timeline editor or durable vocabulary
  system.

### Completed Slice: Timeline Contextual Creation Documentation Alignment

Status: completed on 2026-07-05.

Implemented:

- README Timeline capability bullets now include contextual new-event drafts
  from active era or involved-record filters.
- Mobile README now lists contextual new-event drafts as part of the dedicated
  Timeline tab.
- Manual release checklist now asks QA to create a Timeline event from active
  era or involved-record context and confirm the draft is seeded.

Evaluation before implementation:

- Root cause: Help and runtime coverage were aligned, but top-level project
  docs and manual release checks still described generic Timeline creation.
- The best path was targeted documentation updates because no implementation
  behavior needed to change.

Re-evaluation after implementation:

- Product summary, mobile summary, in-app Help, user guide, smoke coverage, and
  manual release checks now describe the same Timeline creation workflow.
- No additional QA checklist expansion was needed beyond the core Timeline
  workflow step.

### Completed Slice: Shared Timeline Review Tray

Status: completed on 2026-07-05.

Implemented:

- Shared Timeline Review model now centralizes unordered events, duplicate
  order groups, and unlinked events as review items with counts, summaries, and
  affected labels.
- Shared Timeline Browse model now includes the Review model so mobile can use
  the same filtered review state as its grouped Timeline events.
- Browser Timeline overview now renders a dedicated Timeline Review tray
  instead of generic diagnostic count cards.
- Mobile Timeline Events mode now shows diagnostics inside an inline Timeline
  Review group instead of splitting counts near highlights and issue lists
  after event groups.

Evaluation after implementation:

- Diagnostics now have a single conceptual home on both platforms, reducing
  scan cost while keeping the existing event ordering and involved-record
  workflows unchanged.
- The Review model is platform-neutral and can later move into a broader Review
  Tray without changing browser or mobile copy.
- A responsive gap was found during review: the browser review grid needed the
  same single-column mobile collapse as the existing diagnostics grid. This was
  patched and revalidated.
- No additional Timeline Review gaps were found after focused model, render,
  type, and build validation.

### Completed Slice: Actionable Timeline Review Targets

Status: completed on 2026-07-05.

Implemented:

- Timeline Review items now carry affected event ids in the shared core model,
  not just display labels.
- Browser Timeline Review issue lists now provide direct Open links for each
  affected event, including all events inside a duplicate-order group.
- Mobile Timeline Review issue groups now provide Edit actions for each
  affected event using the existing Timeline mode selection flow.

Evaluation after implementation:

- The Review Tray is now corrective, not only informative: users can move from
  an unordered, duplicate-order, or unlinked issue directly into the event that
  needs repair.
- The event-target model keeps browser and mobile affordances aligned while
  preserving platform-native rendering.
- A duplicate-label issue was found in the first mobile pass because target
  labels appeared both as compact text and beside action buttons. The redundant
  compact list was removed and the slice revalidated.

### Completed Slice: Browser Timeline Browse Route Persistence

Status: completed on 2026-07-05.

Implemented:

- Browser Timeline now reads `query`, `era`, `involvedEntryId`, `tag`,
  `status`, `sort`, `updatedWithinDays`, and `showArchived` route parameters.
- Timeline search, tag, status, sort, updated-window, era, involved-entry,
  archived visibility, and Clear Filters now keep the `/timeline` URL aligned
  with the active browsing context.
- Timeline route query removal now clears the search field when users navigate
  back to an unfiltered URL.
- The fixed Timeline route now defaults to Timeline order instead of the generic
  updated-date sort.

Evaluation before implementation:

- The root cause was that Timeline review/open actions had routeable event
  context, but browsing filters were still local state. Users could not copy or
  revisit a specific chronology filter state without rebuilding it.
- The best path was scoped route persistence inside the fixed Timeline section
  route, avoiding changes to generic section pages or entry editor behavior.

Re-evaluation after implementation:

- Timeline URLs can now reopen filtered chronology contexts while preserving
  existing event edit/context query parameters.
- Generic section browsing remains unchanged.
- No data model, mobile route, or custom Timeline editor change was needed.

### Completed Slice: Mobile Timeline Browse Route Hydration

Status: completed on 2026-07-05.

Implemented:

- Mobile Timeline now hydrates `query`, `era`, `involvedEntryId`, `tag`,
  `status`, `sort`, `updatedWithinDays`, and `showArchived` route parameters.
- Filtered mobile Timeline links can open directly into the matching event
  list, while invalid sort/status/updated values fall back to safe defaults.
- Mobile route adapter coverage now preserves filtered `/timeline` route
  parameters.
- Mobile render coverage verifies a filtered Timeline route opens a one-event
  chronology view.

Evaluation before implementation:

- The root cause was a platform parity gap after browser route persistence:
  mobile preserved arbitrary route params at the navigation adapter layer but
  the Timeline screen only read `query`.
- The best path was route hydration, not route-writing on every mobile filter
  interaction, because current mobile workflows mostly navigate through action
  buttons and direct links rather than copyable browser URLs.

Re-evaluation after implementation:

- Browser and mobile now both accept the same filtered Timeline route contract.
- Mobile defaults remain chronology-first with Timeline order.
- No mobile persistence, tab structure, or editor behavior changes were needed.

### Completed Slice: Shared Timeline Surface Model

Status: completed on 2026-07-05.

Implemented:

- Core now exposes a shared Timeline Surface model that composes visible event
  count, Review Tray state, Era Manager state, highlights, sorted event rows,
  and grouped era cards.
- Browser Timeline overview now consumes the shared surface model instead of
  assembling highlights, grouping, review state, and event display items inside
  the component.
- Focused core coverage verifies the surface model shape against the seed world
  chronology.

Evaluation after implementation:

- Timeline overview behavior stays the same, but display logic is now
  centralized in `@valgaron/core`, which reduces browser/mobile divergence for
  future Timeline editor and Review Tray slices.
- Event reordering still uses the existing entry mutation path, preserving the
  current save semantics.
- No further model-adoption issues were found after formatting, focused
  Timeline tests, typecheck, and browser build validation.

### Completed Slice: Relationship Studio Mode Foundation

Status: completed on 2026-07-05.

Implemented:

- Shared Relationship Studio mode model with Review, Graph, Links, and Bulk
  Edit options.
- Shared mode copy now defines each mode's label and purpose in
  `@valgaron/core`.
- Browser Relationships page now shows Relationship Studio mode controls.
- Mobile Relationships screen now shows the same modes using platform-native
  action buttons.

Evaluation after implementation:

- The mode model gives both platforms the same information architecture for
  repurposing Relationships into an advanced studio rather than an everyday
  linking requirement.
- Initial implementation exposed the modes without changing visible content,
  which preserved safety but did not yet reduce page length or interaction
  cost. That gap led directly to the next slice.

### Completed Slice: Relationship Studio Mode Split

Status: completed on 2026-07-05.

Implemented:

- Browser Relationship Studio now conditionally shows Review, Graph, Links, or
  Bulk Edit content based on the active mode.
- Mobile Relationships screen now uses the same split so the long relationship
  workflow is no longer one continuous scroll.
- Review mode contains relationship health, broken-link repair, and orphaned
  records.
- Graph mode contains graph browsing and node inspection.
- Links mode contains entry pickers, the ad hoc relationship composer, and the
  saved relationship list.
- Bulk Edit mode initially used the shared mode copy until later slices promoted
  deterministic cleanup actions into the mode.

Evaluation after implementation:

- The mode split reduces scan cost on both platforms while preserving all
  existing relationship actions.
- A workflow gap was found after the first split: deep links carrying
  relationship query params landed on Review mode and hid the relevant Links
  content. Browser and mobile route hydration now switch to Links mode for
  relationship entry/query deep links.
- Mobile graph "Filter List" now also switches to Links mode after applying the
  selected graph node as the list filter.
- Later Relationship Studio slices should make Review more powerful by moving
  legacy migration and duplicate review into this mode, then add real Bulk Edit
  batch actions.

### Completed Slice: Mobile Relationship Links Expansion

Status: completed on 2026-07-05.

Implemented:

- Mobile Relationship Studio Links mode now supports Show More/Show Fewer for
  dense entry-picker records.
- Mobile Relationship Studio Links mode now supports Show More/Show Fewer for
  dense saved relationship result lists.
- Hidden-count copy now names remaining records or links directly instead of
  requiring users to refine search or filters when expansion is available.
- Expansion resets when the active world, picker search, relationship search,
  relationship type filter, or entry filter changes.

Evaluation before implementation:

- The root cause was a mobile-only Links-mode browsing cap: users could be in
  the correct linking workflow but still had to change search/filter text to
  inspect additional picker records or saved links.
- The best path was Links-mode local expansion state because the shared picker
  and relationship list models already expose full filtered result sets, and
  this cap is a rendering concern.

Re-evaluation after implementation:

- Mobile users can keep compact Links mode by default and expand dense picker
  or saved-link result sets only when needed.
- No shared relationship model, persistence, or route changes were needed.

### Completed Slice: Actionable Relationship Orphan Review

Status: completed on 2026-07-05.

Implemented:

- Browser Relationship Studio Review now renders orphaned records as direct
  link-management actions instead of static tags.
- Mobile Relationship Studio Review now shows visible orphaned records as
  action rows with Manage Links actions.
- Mobile orphan actions prefill the selected orphan as the relationship source,
  apply relationship list search/filter context, and switch to Links mode.

Evaluation after implementation:

- Review mode now provides a direct repair path for unlinked records, reducing
  the cost from "notice an orphan, navigate manually, search again" to one
  action.
- Browser uses the existing relationship management route and dirty-draft guard,
  preserving current deep-link behavior.
- Mobile uses the existing draft and list state instead of adding a new modal or
  persistence path.
- No further orphan-review issues were found after formatting, focused
  relationship tests, typecheck, and browser build validation.

### Completed Slice: Relationship Studio Legacy Text Review

Status: completed on 2026-07-05.

Implemented:

- Shared Relationship Studio Review model now composes graph diagnostics with
  legacy relationship-text review items.
- Browser Relationship Studio Review now summarizes legacy link text cleanup
  and links directly to the affected entry editor.
- Mobile Relationship Studio Review now shows the same legacy link text review
  queue with Review Entry actions and mobile result limiting.
- Existing entry editors remain the place where exact-match and suggestion
  migrations execute, preserving their draft-save and dirty-state guards.

Evaluation after implementation:

- Review mode now centralizes discovery for broken links, orphaned records, and
  legacy relationship-backed text cleanup instead of scattering graph health
  issues across unrelated screens.
- The slice deliberately avoids adding migration execution inside Relationship
  Studio because that would duplicate cross-section entry-save behavior and
  weaken the existing entry-editor draft protections.
- No additional legacy-text review gaps were found before focused validation;
  future Bulk Edit work can reuse the shared review model when batch migration
  controls are promoted out of entry context.

### Completed Slice: Relationship Studio Exact-Match Bulk Edit

Status: completed on 2026-07-05.

Implemented:

- Browser Relationship Studio Bulk Edit now exposes an exact-match legacy text
  migration action instead of a placeholder when cleanup work exists.
- Browser Relationships now receives entry-save capability from the app shell so
  batch migration can update affected entries and save generated relationships.
- Mobile Relationship Studio Bulk Edit now exposes the same exact-match batch
  migration action using the existing mobile entry and relationship save
  controller methods.
- Ambiguous or unresolved legacy text remains in Review Entry workflows, where
  users can choose targets with entry context.

Evaluation after implementation:

- Bulk Edit now performs a real low-risk cleanup task across the active world on
  both platforms.
- The implementation intentionally limits the first batch action to exact
  matches because suggestions and duplicate-name choices require user judgment.
- No further Bulk Edit placeholder gaps were found for the current Phase 8
  scope; future bulk actions should follow the same rule of only batching
  deterministic operations.

### Completed Slice: Relationship Studio Duplicate Relationship Cleanup

Status: completed on 2026-07-05.

Implemented:

- Shared Relationship Studio Review now detects conservative duplicate
  relationship groups using source, target, direction, type, status, and note.
- Browser Relationship Studio Review explains duplicate groups, while Bulk Edit
  removes duplicates and keeps the oldest saved relationship in each group.
- Mobile Links uses the same review model, copy, and bulk cleanup behavior.
- Shared copy and tests now cover duplicate cleanup labels, grouping behavior,
  core exports, and mobile render output.

Evaluation after implementation:

- The root workflow issue was duplicate relationship clutter after iterative
  drafting or migration, not a missing relationship editor. A deterministic
  cleanup action in Relationship Studio reduces list noise without creating a
  second editing path.
- The best path remains conservative: only same endpoints, direction, type,
  status, and note are batched. Similar relationships with different notes stay
  visible because they may contain intentional context.
- Draft protection matches the exact-match cleanup slice; users must save or
  discard an active relationship draft before bulk deletion can run.
- No further duplicate-cleanup gaps were found after adding shared copy,
  browser/mobile UI paths, focused tests, and documentation hooks.

### Completed Slice: Relationship Studio Health Summary Completeness

Status: completed on 2026-07-05.

Implemented:

- Browser Relationship Studio Review health cards now summarize duplicate
  groups, legacy text cleanup fields, exact-match cleanup readiness, and graph
  size in addition to broken and orphaned records.
- Mobile Links health summary now includes duplicate group counts alongside
  broken links, orphaned records, graph size, and legacy text cleanup.
- Mobile render coverage asserts the duplicate count appears before users reach
  the detailed duplicate review rows.

Evaluation after implementation:

- The root issue was scan cost: Review mode could contain duplicate cleanup and
  migration work while the top summary only advertised broken and orphaned
  records.
- The best path was to expose issue counts in the existing health summary rather
  than introduce another mode, badge system, or alert surface.
- Browser and mobile now communicate the same categories of relationship
  maintenance work at the top of the screen.
- No additional summary gaps were found for the current Relationship Studio
  scope after checking broken, orphaned, duplicate, legacy-text, and graph
  visibility.

### Completed Slice: Actionable Relationship Graph Edges

Status: completed on 2026-07-05.

Implemented:

- Browser Relationship Studio Graph edge rows now include direct Edit actions.
- Mobile selected-node graph edge rows now include direct Edit actions.
- Both platforms reuse the existing relationship edit flow, including dirty
  draft protection and switching into Links mode.

Evaluation after implementation:

- Graph browsing is now corrective as well as observational: users can inspect
  an edge and immediately edit the saved relationship without searching for it
  again in Links mode.
- The slice avoids adding a separate graph-edge editor, keeping one relationship
  composer and one validation path.
- No additional graph-edge workflow gaps were found for the current Studio
  scope.

### Completed Slice: Browser Relationship Graph Node Actions

Status: completed on 2026-07-05.

Implemented:

- Browser Relationship Studio Graph selected-node detail now shows the selected
  node's connected edge rows with direct Edit actions.
- Browser selected-node detail now includes Review Context and Filter List
  actions, matching the mobile Links graph workflow.
- Browser smoke now clicks Graph mode, selects a graph node, and verifies the
  selected-node actions render with the expected entry route.

Evaluation after implementation:

- The root issue was asymmetric interaction cost: mobile users could move from a
  graph node to entry editing or filtered link review, while browser users had
  to manually leave Graph mode and recreate context.
- The best path was to reuse existing entry-route, dirty-draft guard, and Links
  filter behavior instead of adding a graph-specific record editor.
- Browser and mobile graph inspection now provide the same next actions for
  selected records.
- No further node-action gaps were found after checking Review Context, Filter
  List, selected edge Edit actions, and browser smoke coverage.

### Completed Slice: Knowledge Schema Overview Foundation

Status: completed on 2026-07-05.

Implemented:

- Shared Knowledge Schema model now summarizes entry types, field modes,
  relationship-backed fields, custom type count, and reusable lore/faction
  destinations.
- Browser Knowledge now renders a real schema overview instead of a placeholder
  that only points back to Workspaces.
- Mobile More now includes a compact Knowledge Schema overview while Knowledge
  remains a secondary mobile workflow under More.
- Browser smoke and mobile render coverage now include the Knowledge Schema
  overview.

Evaluation after implementation:

- The slice gives users a centralized understanding of built-in/custom types and
  field behavior without introducing a document schema migration.
- The field model distinguishes controlled values, flexible text, multiline
  text, single links, and multi links, which keeps ancestry/profession flexible
  while making category and relationship-backed behavior explicit.
- The best next Knowledge slice is to move custom entry type creation from
  Workspaces into this Knowledge surface; durable user-defined fields should
  still wait until the schema MVP is intentionally designed.

### Completed Slice: Mobile Knowledge Entry Type Navigation

Status: completed on 2026-07-05.

Implemented:

- Mobile More Knowledge overview now includes Open Section actions for the
  visible compact entry type summaries.
- Mobile render coverage verifies a non-duplicated Open Places action from the
  entry type overview.

Evaluation after implementation:

- The root issue was browser/mobile action parity: browser Knowledge entry type
  cards could open the owning section, but mobile More only exposed static type
  summaries.
- The best path was to add actions only for the compact visible summary rows,
  preserving mobile density while still making the overview actionable.
- Mobile users can now move from schema understanding to the relevant records
  without manually returning to the Workbench tab and selecting a section.

### Completed Slice: Knowledge Custom Entry Type Management

Status: completed on 2026-07-05.

Implemented:

- Browser Knowledge now includes custom entry type listing, creation, and
  destructive delete actions using the existing workspace entry-type model.
- Mobile More now includes the same custom entry type creation and delete path
  inside its Knowledge Schema area.
- Workspaces keeps the old custom entry type panel during this transition so
  existing setup workflows remain reachable while Knowledge takes ownership.
- Browser smoke and mobile render coverage now verify the custom type controls
  are visible from the Knowledge/More surface.

Evaluation after implementation:

- The workflow root cause was page ownership drift: custom type behavior lived
  under project workspace management even though users expect schema and
  reusable knowledge setup to be centralized.
- The best path is an incremental ownership move, not a schema migration:
  reuse the current typed draft, validation, and destructive action behavior
  before adding durable user-defined field definitions.
- The duplicate custom type panel should be removed from Workspaces once
  Knowledge/More coverage has soaked through full validation; a later slice
  completed that ownership cleanup.

### Completed Slice: Custom Type Open Section Actions

Status: completed on 2026-07-05.

Implemented:

- Browser Knowledge custom type management cards now include Open Section
  actions next to type management controls.
- Mobile More custom type management rows now include the same Open Section
  action.
- Mobile render coverage verifies the action on a fixture-created Artifacts
  custom type.

Evaluation after implementation:

- The root issue was that users could create or modify a custom type but then
  had to leave the management area and manually find that section before adding
  records.
- The best path was to reuse each custom type's existing section route rather
  than add a separate create-record shortcut or schema-specific editor.
- Custom type management now supports a clear setup-to-use workflow on both
  browser and mobile without changing the schema model.

### Completed Slice: Knowledge Setup Destination Ownership

Status: completed on 2026-07-05.

Implemented:

- Shared Utilities/More destination for Knowledge Setup now targets the
  Knowledge route instead of Workspaces.
- Mobile route adaptation maps shared Knowledge intents to the More tab, where
  Knowledge setup now lives for the first release.
- Route tests now cover the Knowledge-to-More adaptation.

Evaluation after implementation:

- The old destination preserved the pre-Knowledge ownership model and would
  keep sending users back to Workspaces after schema controls moved.
- Updating the shared destination is lower risk than adding a fifth mobile tab:
  browser gets `/knowledge`, while native mobile keeps the accepted More-based
  navigation shape.
- No further route ownership issues were found for the current Knowledge setup
  slice.

### Completed Slice: Workspaces Custom Type Retirement

Status: completed on 2026-07-05.

Implemented:

- Browser Workspaces no longer renders the duplicate custom entry type
  management panel.
- Mobile Workspaces no longer renders the duplicate custom entry type
  management panel.
- Custom entry type creation and deletion now live in browser Knowledge and
  mobile More, while Workspaces stays focused on project/universe metadata and
  in-fiction worlds/planets.
- Browser smoke expectations now match the reduced Workspaces scope.

Evaluation after implementation:

- Keeping the duplicate panel after Knowledge ownership would preserve two
  places for one schema workflow and increase future drift.
- Removing the duplicate panel is safe now because Knowledge/More already uses
  the same draft validation and destructive delete behavior.
- No additional Workspaces ownership gaps were found for custom entry types;
  future schema fields should be added to Knowledge rather than reintroduced in
  Workspaces.

### Completed Slice: Knowledge Controlled Vocabulary Overview

Status: completed on 2026-07-05.

Implemented:

- Shared Knowledge Schema model now exposes vocabulary rows for suggested
  controlled values and observed flexible field values.
- Browser Knowledge now shows controlled/observed value rows, including
  category fields and flexible values such as ancestry and profession.
- Mobile More now shows a compact controlled/observed value summary inside the
  Knowledge Schema area.
- Type Setup now targets the Knowledge custom type section instead of
  Workspaces, and mobile adapts that focused Knowledge route to More.

Evaluation after implementation:

- The root cause was that users could enter flexible values but had no central
  place to see emerging taxonomy before deciding whether to formalize it.
- The best path is visibility before schema persistence: show existing
  suggested and observed values without forcing ancestry, profession, or other
  prose-friendly fields into controlled vocabularies yet.
- No further controlled-value visibility gaps were found for the current MVP;
  editing durable vocabularies should wait for the v3 user-field/schema design.

### Completed Slice: Knowledge Vocabulary Navigation

Status: completed on 2026-07-05.

Implemented:

- Shared Knowledge vocabulary rows now include the owning section route.
- Browser Knowledge controlled/observed vocabulary rows now include Open
  Section actions.
- Mobile More controlled/observed vocabulary rows now include the same Open
  Section actions through the mobile route adapter.
- Core, mobile render, and browser smoke coverage now verify vocabulary
  navigation.

Evaluation after implementation:

- The root issue was that Knowledge made emerging values visible but left users
  to manually navigate back to the owning entry list before applying or
  reviewing those values.
- The best path was to add section navigation from the existing vocabulary row
  model rather than introduce durable controlled-vocabulary editing before the
  schema migration.
- Browser and mobile now support the same visibility-to-action loop for fields
  such as ancestry, profession, category, and custom suggested values.

### Completed Slice: Knowledge Lore Definition Overview

Status: completed on 2026-07-05.

Implemented:

- Shared Knowledge Schema model now derives lore definition type rows from the
  current lore category field.
- Browser Knowledge shows lore definition types with counts and direct Lore
  routes.
- Mobile More shows the same lore definition type summary inside Knowledge
  setup.
- Tests and browser/mobile render checks now cover the derived lore definition
  rows.

Evaluation after implementation:

- The root cause was that lore categories could emerge organically but were not
  visible as reusable definition types from the centralized Knowledge surface.
- The best path is to derive definition rows from current lore data before
  adding a durable editable definition-type schema.
- No further lore-definition visibility gaps were found for the current MVP;
  editing definition types should be part of the later schema migration.

### Completed Slice: Mobile Lore Definition Navigation

Status: completed on 2026-07-05.

Implemented:

- Mobile More lore definition rows now include Open Lore actions using the
  shared lore definition route from the Knowledge Schema model.
- Mobile render coverage now verifies that derived lore definition rows are
  actionable, not only informational.

Evaluation after implementation:

- The root issue was browser/mobile parity drift: browser Knowledge could open
  filtered Lore from a definition type, while mobile More required manual
  navigation and search.
- The best path was to reuse the existing derived route and mobile route
  adapter instead of adding a mobile-specific lore definition workflow.
- Lore definition review is now equally reachable on browser and mobile without
  starting the larger durable definition-type editing schema.

### Completed Slice: Mobile Reusable Knowledge Destinations

Status: completed on 2026-07-05.

Implemented:

- Mobile More now renders the shared Reusable Knowledge destination model with
  Open Factions and Open Lore actions.
- Mobile render coverage now verifies that the reusable destination section is
  present alongside lore definition rows.

Evaluation after implementation:

- The root issue was another mobile/browser parity gap: browser Knowledge let
  users jump to reusable Factions and Lore collections, while mobile More only
  showed derived lore definition rows.
- The best path was to render the existing shared destination model on mobile,
  keeping More as the current mobile container for secondary Knowledge
  workflows.
- Mobile Knowledge now gives users both collection-level reusable-knowledge
  navigation and definition-level Lore navigation without adding a fifth tab.

### Completed Slice: Knowledge Field Backing Rules

Status: completed on 2026-07-05.

Implemented:

- Shared Knowledge Schema field rows now expose storage backing labels,
  relationship type names, and target entry type titles.
- Browser Knowledge now shows relationship-backed field rules directly in the
  entry type cards.
- Mobile More now shows a compact list of linked field backing rules.
- Tests now cover Character and Timeline relationship-backed target rules.

Evaluation after implementation:

- The root cause was that users could see a field was linked, but not what
  relationship type it wrote or which records it was meant to target.
- The best path was to reuse existing relationship field configs rather than
  create a separate schema definition source.
- No further backing-rule visibility gaps were found; editing these rules still
  belongs to the later durable schema design.

### Completed Slice: Utilities Workspaces Destination

Status: completed on 2026-07-05.

Implemented:

- Shared Utilities/More destinations now include Workspaces as a project
  management destination.
- Browser Utilities now exposes Workspaces alongside Knowledge Setup, Data
  Tools, and Help.
- Mobile More now exposes the same Workspaces destination while keeping the
  four-tab primary navigation shape.
- Browser smoke and mobile render checks now cover the Workspaces destination.

Evaluation after implementation:

- The root cause was that Workspaces had been removed from primary navigation
  ownership but was not fully represented under Utilities/More.
- Adding it to the shared destination model is the lowest-risk consolidation
  path because both platforms already render those destinations.
- No remaining Utilities destination gaps were found for Data, Workspaces, and
  Help.

### Completed Slice: Knowledge Schema Export/Import Coverage

Status: completed on 2026-07-05.

Implemented:

- Core data portability tests now verify that a Knowledge-created custom entry
  type survives full JSON export and import.
- The test covers custom section id, display labels, custom flag, detail fields,
  and initialized codex collection.

Evaluation after implementation:

- The root cause was that schema ownership moved into Knowledge, but portability
  tests only covered broader document validity and not the specific setup
  workflow users now reach from Knowledge/More.
- The best path is focused coverage for the active v2 schema rather than adding
  legacy v2-to-v3 migration tests before a v3 schema exists.
- No further export/import gaps were found for the current custom entry type
  MVP.

### Completed Slice: Help Knowledge And Utilities Alignment

Status: completed on 2026-07-05.

Implemented:

- Shared Help quick actions now match the current primary workflow surfaces:
  Workbench, Timeline, Relationships, Knowledge, and Utilities.
- Help focus topics now include Knowledge and Utilities.
- Workspaces help now focuses on project/universe workspaces and in-fiction
  worlds/planets, while custom entry type guidance moved to Knowledge.
- Mobile Help render coverage now verifies the Knowledge/Utilities actions and
  custom entry type guidance.

Evaluation after implementation:

- The root cause was stale help ownership after custom entry type management
  moved from Workspaces to Knowledge/More.
- Updating shared Help copy fixes browser and mobile at once because both
  render from the same core help model.
- No further Help guidance gaps were found for the current navigation model.

### Completed Slice: Documentation Knowledge And Utilities Alignment

Status: completed on 2026-07-05.

Implemented:

- User guide everyday workflow now starts from Workbench, uses Knowledge for
  custom entry types and schema understanding, and routes Data/Workspaces
  through Utilities or More.
- Manual release checklist now checks Workbench, Timeline, Relationships,
  Knowledge, Utilities, Data, Workspaces, and Help.
- Mobile README now describes More as the home for Knowledge setup,
  Workspaces, Data, and Help.
- Main README now describes Workbench, Relationship Studio, Knowledge setup, and
  the current mobile tab shape.
- Web/mobile parity checklist now includes Knowledge and More in route and
  manual QA coverage.
- Frontend parity plan now describes mobile Workbench/Timeline/Links/More,
  Knowledge-owned custom entry types, and current route-intent surfaces.

Evaluation after implementation:

- The root cause was stale documentation after the IA moved schema setup into
  Knowledge/More and grouped project tools under Utilities/More.
- Updating docs now prevents QA and release checks from validating the old
  Workspaces-centered workflow.
- No remaining high-signal user-facing documentation references were found that
  send custom entry type management back to Workspaces.

### Completed Slice: Mobile Knowledge Focus Routing

Status: completed on 2026-07-05.

Implemented:

- Shared Knowledge route focus ids now define the custom entry type section
  target used by `/knowledge#custom-entry-types`.
- Mobile More resolves the shared Knowledge focus param and scrolls to custom
  entry type setup when launched from a focused Knowledge intent.
- Mobile render coverage verifies that focused Knowledge setup keeps the custom
  entry type section addressable.

Evaluation before implementation:

- The root cause was a split route contract: the mobile route adapter preserved
  `routeFocusId`, but More did not consume it.
- The best path was to mirror the existing Data focus behavior with a smaller
  Knowledge-specific helper, keeping More as the accepted mobile container for
  Knowledge.

Re-evaluation after implementation:

- Focused Knowledge links now land closer to the task on mobile without adding
  a fifth tab or duplicating the browser Knowledge page.
- The slice does not change stored data and does not start the larger durable
  user-defined-field schema migration.

### Completed Slice: Browser Knowledge Focus Routing

Status: completed on 2026-07-05.

Implemented:

- Browser Knowledge now resolves the shared custom entry type focus id from the
  URL hash.
- The custom entry type panel is focusable and scrolls into view for
  `/knowledge#custom-entry-types`.
- Browser smoke now covers the focused Knowledge route.

Evaluation before implementation:

- The root cause was the same route-focus split as mobile: the route existed
  but Knowledge did not explicitly restore scroll or keyboard focus after React
  rendered the page.
- The best path was to reuse the shared Knowledge focus id and mirror the
  existing Data page focus behavior.

Re-evaluation after implementation:

- Browser and mobile now both honor the focused Knowledge setup intent.
- No additional route-focus targets are needed until durable user-defined
  fields add more schema panels.

### Completed Slice: Custom Field Definition Hints

Status: completed on 2026-07-05.

Implemented:

- Custom entry type creation now parses detail field hints into the existing
  `WorldDetailField` capabilities without a document schema migration.
- Creators can define multiline fields with `(long)`, suggestion-backed free
  text with `(suggest)`, and controlled suggested choices with
  `[Value | Value]`.
- Browser Knowledge and mobile More expose the field syntax helper text at the
  point of custom type creation.
- Core and Knowledge Schema tests cover parsing, persistence, and schema
  classification for the richer custom field modes.
- User-facing docs now describe the supported custom field hints.

Evaluation before implementation:

- The root cause was that the current schema already supported richer field
  definitions, but the Knowledge custom type workflow only surfaced plain text
  field labels.
- The best path was to extend the existing draft field parser instead of adding
  a v3 schema or separate field editor before the MVP proves the interaction
  model.

Re-evaluation after implementation:

- This completes a useful first user-field slice for custom entry types while
  preserving existing comma-separated field input.
- Durable editing of fields after type creation and user-defined fields on
  built-in entry types remain larger schema/workflow slices.

### Completed Slice: Custom Field Draft Preview

Status: completed on 2026-07-05.

Implemented:

- Shared workspace model now previews parsed custom field definitions before
  entry type creation.
- Browser Knowledge shows inline field chips and details for the draft custom
  fields.
- Mobile More shows the same parsed field labels and modes in a compact preview
  line.
- User guide copy now tells users the preview exists before saving.

Evaluation before implementation:

- The root cause was that richer field hints were valid but still required
  users to mentally parse syntax before saving a new custom type.
- The best path was a shared preview model because the parser result needs to
  stay identical across browser and mobile.

Re-evaluation after implementation:

- Users can verify multiline fields, suggested choices, and suggestion-backed
  text fields before committing the custom type.
- The preview does not change persistence and remains compatible with existing
  comma-separated custom field input.

### Completed Slice: Rich Custom Field Portability Coverage

Status: completed on 2026-07-05.

Implemented:

- Full-document JSON export/import coverage now verifies custom entry type
  fields with multiline, suggested-choice, and suggestion-from-existing-values
  metadata.

Evaluation before implementation:

- The root cause was that portability coverage only verified custom field
  labels, which was enough before field hints created richer metadata.
- The best path was to strengthen the existing custom entry type round-trip
  test rather than adding separate import/export machinery.

Re-evaluation after implementation:

- Custom field hint metadata is covered by the same backup flow users rely on
  for local portability.
- No data migration is needed because the existing schema already serializes the
  field metadata.

### Completed Slice: Append Fields To Custom Entry Types

Status: completed on 2026-07-05.

Implemented:

- Shared workspace mutations now add parsed field definitions to existing
  custom entry types without changing existing entries.
- Browser Knowledge exposes an inline add-fields form for each custom type,
  with helper text and field preview.
- Mobile More exposes the same append-fields workflow for each custom type.
- Browser and mobile state controllers now call the shared active-workspace
  mutation.
- Focused tests cover appending fields, preserving existing entry values,
  rejecting built-in type mutation, and mobile rendering of the add-fields
  action.

Evaluation before implementation:

- The root cause was that users could only define fields at custom type
  creation time, forcing them to create another section or accept an incomplete
  schema when new field needs appeared.
- The best path was append-only editing because rename/delete require explicit
  decisions about existing entry data, migration, and cleanup.

Re-evaluation after implementation:

- Users can now evolve custom entry types incrementally while existing records
  remain intact.
- Field rename, field deletion, reordering, and built-in type custom fields
  remain separate larger slices.

### Completed Slice: Custom Field QA Checklist Alignment

Status: completed on 2026-07-05.

Implemented:

- Manual release checklist now includes adding multiline and suggested-choice
  fields after custom type creation.
- Web/mobile parity checklist now requires appended custom fields to survive
  cross-platform export/import review.

Evaluation before implementation:

- The root cause was that QA still verified only custom type create/delete,
  which would miss regressions in the new append-fields workflow.
- The best path was to update the existing release and parity checklists rather
  than creating a separate QA document.

Re-evaluation after implementation:

- Manual QA now follows the current Knowledge workflow across browser and
  mobile.
- Automated coverage remains the primary gate for parser and portability
  behavior.

### Completed Slice: Reorder Custom Entry Type Fields

Status: completed on 2026-07-05.

Implemented:

- Shared workspace mutations now move fields up or down inside existing custom
  entry types without changing saved entry field values.
- Browser Knowledge exposes field order controls for each custom type.
- Mobile More exposes matching compact move controls for each custom type.
- JSON export/import coverage now verifies reordered custom fields remain in
  order.
- User guide and QA checklists now include custom field reordering.

Evaluation before implementation:

- The root cause was that append-only fields solved schema growth but not field
  scanning order, which matters when users add fields over time.
- The best path was reorder-only management because it changes presentation
  order without touching entry values or requiring data-retention decisions.

Re-evaluation after implementation:

- Users can now evolve and organize custom entry type fields incrementally on
  both browser and mobile.
- Rename and delete remain intentionally deferred because they require explicit
  behavior for existing entry data and hidden-field cleanup.

### Completed Slice: Rename Custom Field Labels

Status: completed on 2026-07-05.

Implemented:

- Shared workspace mutations now rename custom field display labels while
  preserving field keys and existing entry values.
- Browser Knowledge exposes inline field label inputs and save actions in the
  field order area.
- Mobile More exposes matching rename inputs and save actions for custom
  fields.
- JSON export/import coverage now verifies renamed custom field labels survive
  alongside appended and reordered fields.
- User guide and QA checklists now include renaming field labels.

Evaluation before implementation:

- The root cause was that users could append and reorder fields but could not
  correct a label without creating a replacement field.
- The best path was label-only rename because it improves schema clarity while
  avoiding data migration: existing entry values remain stored under the same
  field key.

Re-evaluation after implementation:

- Users can correct and clarify custom field labels on browser and mobile
  without losing data.
- Field deletion remains deferred because it needs explicit handling for saved
  values and hidden-field cleanup.

### Completed Slice: Remove Custom Fields Non-Destructively

Status: completed on 2026-07-05.

Implemented:

- Shared workspace mutations now remove custom fields from custom entry type
  schemas while preserving existing entry field values.
- Generic hidden-detail cleanup now works for custom and other non-character,
  non-place sections, so removed custom field values remain reviewable.
- Browser Knowledge and mobile More expose confirmed remove-field actions.
- JSON export/import coverage verifies removed fields are absent from the
  schema after removal.
- User guide and QA checklists now describe removed fields as retained hidden
  values.

Evaluation before implementation:

- The root cause was that users could add, rename, and reorder fields, but could
  not retire obsolete custom fields without deleting the whole entry type.
- The best path was non-destructive removal: schema visibility changes
  immediately, while saved entry values remain available through hidden-detail
  cleanup.

Re-evaluation after implementation:

- Users can now complete the basic custom field lifecycle without destructive
  data loss.
- Hidden removed-field value review is now the next logical slice because
  individual cleanup is supported by the entry editor, but users still need a
  central queue that shows where cleanup work exists.

### Completed Slice: Knowledge Hidden Detail Cleanup Queue

Status: completed on 2026-07-05.

Implemented:

- Shared Knowledge Schema now summarizes hidden detail cleanup targets across
  all active entry types.
- Cleanup rows identify the entry type, entry, hidden field label, retained
  value, and shared edit route for the affected entry.
- Browser Knowledge exposes a Hidden Detail Cleanup panel after vocabulary
  review with direct Review Entry actions.
- Mobile More exposes the same cleanup queue in a compact stacked form with
  Review Entry actions that use the shared mobile route adapter.
- Core and mobile render tests now cover a removed custom field with retained
  entry data appearing in the cleanup queue.

Evaluation before implementation:

- The root cause was that non-destructive field removal correctly preserved
  saved values but left users dependent on opening individual entries to
  discover hidden cleanup work.
- The best path was a shared Knowledge Schema model because browser Knowledge
  and mobile More already consume that model for schema, vocabulary, and custom
  type management.
- Shared Workbench edit routes are required for cleanup actions because legacy
  `/{sectionId}` routes are browser-only and cannot be adapted by the native
  mobile route layer.

Re-evaluation after implementation:

- Browser and mobile now give users one place to find retained removed-field
  values, reducing cleanup discovery cost after schema changes.
- The queue intentionally opens the entry editor instead of adding bulk delete
  because hidden values can still contain useful worldbuilding information that
  should be reviewed before removal.
- No further cleanup-discovery gap remains for the current custom field
  lifecycle; the later Hidden Detail Bulk Clear slice adds recovery-snapshotted
  bulk clearing from this central queue.

### Completed Slice: Knowledge Cleanup Count Summary

Status: completed on 2026-07-05.

Implemented:

- Shared Knowledge Schema totals now include hidden detail cleanup target count.
- Browser Knowledge shows the count in the top schema summary diagnostics.
- Mobile More shows the same count in the compact Knowledge Schema overview.
- Core and mobile render tests cover the count when a removed custom field
  leaves retained entry data.

Evaluation before implementation:

- The root cause was that the cleanup queue reduced review cost but still sat
  below the fold on dense Knowledge/More pages.
- The best path was a shared count on the existing Knowledge summary model
  rather than duplicating hidden-detail scans in each platform renderer.

Re-evaluation after implementation:

- Users can now discover whether cleanup work exists from the first Knowledge
  overview section before deciding to scroll into details.
- No further low-risk visibility gap remains for hidden detail cleanup; the
  later Hidden Detail Bulk Clear slice adds the destructive cleanup action.

### Completed Slice: Knowledge Cleanup Focus Shortcut

Status: completed on 2026-07-05.

Implemented:

- Shared Knowledge route focus targets now include hidden detail cleanup.
- Browser Knowledge makes the hidden-detail count actionable with a Review
  Cleanup shortcut and a focusable cleanup panel.
- Mobile More exposes the same Review Cleanup shortcut and scroll target
  through the existing route-focus adapter.
- Route, mobile render, and browser smoke coverage now include
  `/knowledge#hidden-detail-cleanup`.

Evaluation before implementation:

- The root cause was that the cleanup count disclosed work but still required
  manual scrolling on a dense schema page.
- The best path was extending the existing Knowledge focus-target contract
  rather than adding a one-off anchor or platform-local scroll action.

Re-evaluation after implementation:

- Browser and mobile users can move from cleanup count to cleanup queue in one
  action.
- This closes the remaining low-risk navigation cost around hidden-detail
  cleanup; the later Hidden Detail Bulk Clear slice adds the destructive
  cleanup action.

### Completed Slice: Hidden Detail Bulk Clear

Status: completed on 2026-07-05.

Implemented:

- Shared core mutation clears hidden entry detail values across the active
  workspace while preserving visible field values.
- Browser Knowledge exposes a Clear Hidden Details action in the Hidden Detail
  Cleanup panel.
- Mobile More exposes the same Clear Hidden Details action in its hidden
  cleanup section.
- Clearing hidden details creates a `schema-cleanup` recovery snapshot on web
  and mobile before saved values are removed.
- Shared destructive-action copy and recovery snapshot labels now describe
  schema cleanup explicitly.
- User guide, README, and manual QA copy now describe review plus bulk clear.

Evaluation before implementation:

- The root cause was that the central cleanup queue reduced discovery and
  navigation cost, but users still had to open entries one by one to clear
  already-reviewed hidden values.
- The best path was a shared document mutation and recovery-snapshotted action,
  because hidden detail values are ordinary entry fields and clearing them is a
  destructive data change.

Re-evaluation after implementation:

- Users can still review individual affected entries before clearing, but can
  now finish cleanup in one action after deciding the retained values are no
  longer needed.
- The cleanup action is available in browser Knowledge and mobile More with the
  same confirmation semantics.
- Focused tests cover mutation behavior, destructive copy, recovery reason
  labels, and mobile More rendering.

### Completed Slice: Mobile Web Route Smoke Coverage

Status: completed on 2026-07-05.

Implemented:

- Browser smoke now captures mobile viewport screenshots for Knowledge and
  More/Utilities in addition to Workbench, Timeline, Links, Data, Workspaces,
  and Help.
- The web/mobile parity checklist now marks mobile web route smoke coverage as
  closed because the acceptance artifact set covers every required route group.

Evaluation before implementation:

- The root cause was not missing route functionality; route checks already
  loaded Knowledge and Utilities. The gap was missing mobile screenshot
  artifacts for the Knowledge and More route groups named in the parity
  checklist.
- The best path was to extend the existing browser smoke artifact list rather
  than creating a separate visual QA script.

Re-evaluation after implementation:

- Mobile web smoke evidence now covers the route set required by the parity
  checklist.
- This route artifact work left the broader mobile web stacked workflow
  contract for a later shell-layout slice; that follow-up is now recorded below
  as closed.

### Review Fix: Shared Entry Edit Route Bridge

Status: completed on 2026-07-05.

Implemented:

- Browser `/entries` compatibility now opens the section editor whenever the
  shared route contains an entry id, `intent=edit`, or `intent=new`.
- Browser smoke now covers a shared `/entries?...intent=edit` route and
  verifies it reaches the entry editor surface.

Evaluation before implementation:

- The root cause was that shared route helpers now produce `/entries` edit
  intents for browser and mobile, but the browser bridge only redirected new
  entry intents to the section editor.
- The best path was to fix the bridge instead of changing shared route helpers,
  because native mobile already expects `/entries` route params.

Re-evaluation after implementation:

- Review Entry links from Knowledge, Relationship Studio, overview, and shared
  relationship helpers can use the shared route contract while browser users
  still land in the current editor.
- The Workbench MVP can continue using `/entries` without entry params for
  index and context browsing.

### Completed Slice: Mobile Web Primary Workflow Shell

Status: completed on 2026-07-05.

Implemented:

- Browser desktop navigation now remains a full productivity route set at wide
  widths.
- Browser mobile-web navigation switches at narrow widths to the same primary
  workflow sequence as native mobile: Workbench, Timeline, Links, More.
- Mobile-web nav labels now come from the shared shell route label contract
  instead of browser-only route titles.
- Browser smoke header layout checks now assert the visible mobile-web nav
  labels at 375 px and 320 px.
- The web/mobile parity checklist now marks the mobile web stacked workflow
  debt closed with a concrete smoke acceptance test.

Evaluation before implementation:

- The root cause was that core already defined the mobile-web route order, but
  the browser shell rendered the desktop nav on every viewport.
- The best path was a responsive shell-level nav swap using the shared route
  and label contracts, not a Workbench page rewrite.

Re-evaluation after implementation:

- Narrow browser widths now expose the same top-level workflow order as native
  mobile while keeping desktop-specific Knowledge and section shortcuts out of
  the primary mobile-web strip.
- Knowledge, Data, Workspaces, and Help remain reachable through More/Utilities
  and direct routes.
- No remaining parity ledger item is open; future mobile-web work can focus on
  deeper page-level ergonomics rather than primary route mismatch.

### Review Fix: Knowledge Hash Focus Reactivity

Status: completed on 2026-07-05.

Implemented:

- Browser Knowledge now reacts to `location.hash` changes, so same-page Review
  Cleanup and focused setup links scroll and focus after the page is already
  mounted.

Evaluation before implementation:

- The root cause was that Knowledge read the hash only on initial mount.
- The best path was to use React Router location state as the effect dependency
  instead of adding platform-local click handlers.

Re-evaluation after implementation:

- Direct focused routes and same-page focused shortcuts now use the same shared
  focus-target contract.

### Completed Slice: Shared Utilities Knowledge Overview

Status: completed on 2026-07-05.

Implemented:

- Added a shared Utilities overview model that summarizes Knowledge schema
  status, hidden-detail cleanup readiness, and utility destinations from the
  active world.
- Browser Utilities now shows a live Project Tools overview with Knowledge
  Schema counts and direct Type Setup/Cleanup shortcuts before the destination
  cards.
- Native More now consumes the same shared Project Tools summary and action
  model before its fuller inline Knowledge setup controls.
- Browser smoke now verifies the live Utilities summary text on `/utilities`.

Evaluation before implementation:

- The root cause was a platform asymmetry after the mobile-web shell work:
  native More gave users immediate Knowledge status and setup shortcuts, while
  web Utilities stayed as static navigation cards.
- The best path was a shared core model rendered by both surfaces rather than
  moving schema editing into Utilities or duplicating more Knowledge logic.

Re-evaluation after implementation:

- Desktop web, mobile web, and native More now expose the same setup status and
  shortcut contract from the Utilities/More hub.
- Knowledge remains the owner of schema editing, hidden-detail cleanup, and
  deeper vocabulary review, so Utilities stays a launcher and status surface.
- No additional Utilities ownership gaps were found in this slice; deeper
  schema editing still belongs to the existing Knowledge/More sections.

### Completed Slice: Utilities Destination Focus Routing

Status: completed on 2026-07-05.

Implemented:

- Added shared Utilities focus target ids for Project Tools and each utility
  destination card.
- Route intent classification now exposes a validated Utilities focus id instead
  of treating every Utilities hash as opaque.
- Browser Utilities now scrolls and focuses matching destination sections when
  opened through a focused hash route.
- Native More now adapts `/utilities#...` route focus params to the same
  destination cards using its existing offset-based scroll behavior.
- Browser smoke and mobile route tests now cover the focused Utilities
  destination route.

Evaluation before implementation:

- The root cause was that route parsing and mobile route adaptation preserved
  Utilities hashes, but the Utilities/More surfaces did not consume those focus
  ids.
- The best path was to add a tiny shared focus resolver and reuse existing web
  and native focus patterns rather than adding page-specific aliases.

Re-evaluation after implementation:

- Desktop web, mobile web, and native mobile can now route users directly to a
  specific Utilities/More destination without adding another top-level tab.
- Invalid Utilities hashes are ignored by the shared workflow intent model.
- No additional focus targets are needed until Utilities grows new owned
  sections beyond Project Tools and the existing destination cards.

### Completed Slice: Focused Utilities Help Shortcut

Status: completed on 2026-07-05.

Implemented:

- The shared Help quick action for Utilities now routes to
  `/utilities#project-tools` instead of the unfocused top-level Utilities route.
- Web Help links now land users on the actionable Project Tools hub.
- Native Help keeps the same visible action label while the mobile route
  adapter carries the focus id to More.

Evaluation before implementation:

- The root cause was that the new Project Tools focus target reduced Utilities
  scan cost, but Help still opened the non-focused route.
- The best path was to update the shared Help quick-action route rather than
  adding web-only or mobile-only shortcut behavior.

Re-evaluation after implementation:

- Help, Utilities, More, and mobile route adaptation now share the same
  Project Tools target.
- No copy change was needed because the existing `Open Utilities` label remains
  accurate on desktop web, mobile web, and native mobile.

### Completed Slice: Focused Knowledge Setup Destination

Status: completed on 2026-07-05.

Implemented:

- The shared Utilities/More Knowledge Setup destination now opens
  `/knowledge#custom-entry-types`.
- Browser users land directly on the Knowledge Type Setup section.
- Native mobile users keep the More tab route shape while the route adapter
  carries the `custom-entry-types` focus id to the inline Knowledge setup
  section.

Evaluation before implementation:

- The root cause was that the destination card and the Knowledge schema action
  had drifted: `Open Type Setup` used the focused setup route, while
  `Open Knowledge Setup` opened the general Knowledge surface.
- The best path was to update the shared destination route, because both web
  Utilities and native More already consume that destination model.

Re-evaluation after implementation:

- Utilities, More, Help, and Knowledge schema actions now share focused setup
  routes instead of leaving users to scan the full Knowledge page.
- No additional routing behavior was needed because browser Knowledge and
  native More already understand the shared `custom-entry-types` focus target.

### Completed Slice: Knowledge Vocabulary Decision Context

Status: completed on 2026-07-05.

Implemented:

- Shared Knowledge vocabulary rows now include a short decision summary for
  suggested choice sets and observed flexible values.
- Browser Knowledge renders the summary next to each vocabulary row.
- Native More renders the same source label and decision summary before the
  compact value list.
- Core and mobile render tests now cover observed flexible-value summaries.

Evaluation before implementation:

- The root cause was that Knowledge made ancestry, profession, category, and
  custom field values visible, but users still had to infer whether the values
  were fixed suggestions or observed workspace data.
- The best path was shared explanatory model copy rather than durable
  vocabulary editing, because the active schema still intentionally keeps
  flexible fields lightweight.

Re-evaluation after implementation:

- Users can now distinguish suggested choice sets from flexible observed values
  on both web and mobile before deciding whether a field should remain flexible
  or become reusable knowledge later.
- No migration or new schema editor is needed for this slice.

### Completed Slice: Mobile Vocabulary Row Expansion

Status: completed on 2026-07-05.

Implemented:

- Mobile More now offers a Show More/Show Fewer control when Knowledge
  vocabulary rows exceed the compact default.
- The control reveals the full shared vocabulary row set in place without
  leaving More or adding another mobile route.
- Mobile render coverage verifies that the affordance is present with the seed
  vocabulary set.

Evaluation before implementation:

- The root cause was a mobile-only truncation gap: browser Knowledge rendered
  every vocabulary row, while native More showed only the first five rows with
  no path to inspect the rest.
- The best path was an inline expand/collapse affordance because vocabulary
  review is still lightweight schema evaluation, not a separate editor.

Re-evaluation after implementation:

- Mobile users can now inspect all observed and suggested field values from
  More while preserving a compact first scan.
- No additional state persistence is needed because this is a temporary
  inspection preference within the current screen session.

### Completed Slice: Utilities And Vocabulary Documentation Alignment

Status: completed on 2026-07-05.

Implemented:

- Shared Help now describes Utilities/More as the Project Tools hub and calls
  out observed flexible-value review.
- The user guide now explains that Knowledge and More distinguish suggested
  choice sets from observed flexible values before deeper schema structure is
  needed.
- README and mobile README summaries now mention observed flexible-value review
  and the Project Tools hub.
- The manual release checklist now asks QA to verify suggested and observed
  value labeling in Knowledge/More.

Evaluation before implementation:

- The root cause was documentation drift after the Utilities and vocabulary
  slices: runtime behavior had gained Project Tools focus routing and
  vocabulary decision context, but Help and docs still used broader older
  wording.
- The best path was to update shared Help copy and lightweight docs rather than
  adding new UI.

Re-evaluation after implementation:

- Runtime labels, in-app Help, README, mobile README, user guide, and manual QA
  checklist now describe the same Knowledge/More workflow.
- No additional copy changes were found for this slice.

### Completed Slice: Mobile Hidden Detail Review Expansion

Status: completed on 2026-07-05.

Implemented:

- Mobile More now offers a Show More/Show Fewer control when hidden-detail
  cleanup rows exceed the compact default.
- The cleanup panel keeps the destructive Clear Hidden Details action visible
  while allowing users to inspect all retained values before clearing them.
- Mobile render coverage now creates multiple removed custom fields and verifies
  the cleanup expansion affordance.

Evaluation before implementation:

- The root cause was a mobile-only review gap: browser Knowledge rendered all
  hidden-detail cleanup rows, while mobile More showed only the first five rows
  before an action that clears all hidden values.
- The best path was inline expansion because hidden-detail review belongs in
  the existing Knowledge/More cleanup panel and does not require another route.

Re-evaluation after implementation:

- Mobile users can now inspect every retained hidden value before using the
  recovery-snapshotted clear action.
- No additional persistent state or data-model change was needed.

### Completed Slice: Mobile Vocabulary Value Expansion

Status: completed on 2026-07-05.

Implemented:

- Mobile More now offers per-row Show All/Show Fewer controls for vocabulary
  fields with more than four visible values.
- The value expansion works independently from the broader vocabulary row
  expansion, so users can keep the screen compact while inspecting only the
  value set they care about.
- Mobile render coverage verifies that long value rows expose an expansion
  affordance.

Evaluation before implementation:

- The root cause was that mobile vocabulary row expansion revealed more fields,
  but each field still showed only four values followed by passive "and more"
  text.
- The best path was a row-local expansion state, because value review is
  temporary inspection and should not create schema or persistence changes.

Re-evaluation after implementation:

- Mobile users can now inspect full suggested or observed value sets from More
  without leaving the Knowledge workflow.
- The compact first scan remains intact because values expand only for the row
  the user chooses.

### Completed Slice: Browser Vocabulary Value Expansion

Status: completed on 2026-07-05.

Implemented:

- Browser Knowledge now offers per-row Show All/Show Fewer controls for
  vocabulary fields with more than twelve visible values.
- Long value lists stay compact by default while still allowing complete
  inspection from the Knowledge page.
- Browser smoke now verifies that the Knowledge vocabulary surface exposes a
  value-expansion affordance.

Evaluation before implementation:

- The root cause matched the mobile value-list gap: browser Knowledge rendered
  a passive "N more" chip for long value sets without a reveal action.
- The best path was to reuse local row expansion state in the page rather than
  move this temporary display preference into the document model.

Re-evaluation after implementation:

- Browser and mobile now both support complete vocabulary value inspection while
  preserving compact first-pass review.
- No schema or persistence work was needed.

### Completed Slice: Knowledge Vocabulary Count Copy Alignment

Status: completed on 2026-07-05.

Implemented:

- Browser Knowledge long-value chips now describe hidden vocabulary values as
  values instead of using bare "N more" copy.
- Mobile More vocabulary rows now say how many hidden values remain before a
  row is expanded.

Evaluation before implementation:

- The root cause was a comprehension gap after vocabulary value expansion:
  users could reveal long ancestry, profession, status, or other value sets,
  but the compact copy still required them to infer what "more" referred to.
- The best path was copy-only alignment because the Show All/Show Fewer
  behavior and per-row expansion state already worked on both platforms.

Re-evaluation after implementation:

- Browser and mobile now both name hidden vocabulary values directly while
  keeping compact scans intact.
- No schema, persistence, route, or shared view-model changes were needed.

### Completed Slice: Focused Knowledge Help Value Guidance

Status: completed on 2026-07-05.

Implemented:

- The focused Knowledge Help topic now mentions suggested choices and observed
  flexible values.
- Help topic tests now guard that focused Knowledge guidance stays aligned with
  the Knowledge/More vocabulary review workflow.

Evaluation before implementation:

- The root cause was copy drift after the vocabulary decision and expansion
  slices: runtime surfaces explained observed flexible values, but focused Help
  still used older controlled-value wording.
- The best path was a shared Help copy update because web and mobile both
  consume the same Help model.

Re-evaluation after implementation:

- Users who open focused Knowledge Help now receive the same vocabulary guidance
  that appears in Knowledge and More.
- No route, schema, or component changes were needed.

### Completed Slice: Browser Relationship Review Expansion

Status: completed on 2026-07-05.

Implemented:

- Browser Relationship Studio Review now supports Show More/Show Fewer controls
  for orphaned records, duplicate relationship groups, and legacy text review
  items when those lists exceed their compact defaults.
- Review lists still open compactly, but users can inspect the full cleanup set
  before moving to repair, migration, or bulk cleanup actions.

Evaluation before implementation:

- The root cause was that Review mode could show passive "N more" text for
  cleanup lists without any way to reveal the hidden rows.
- The best path was local UI expansion state because the underlying review
  model and cleanup actions already operate on the full item sets.

Re-evaluation after implementation:

- Browser users can now review complete relationship cleanup lists without
  leaving Relationship Studio.
- No mutation, persistence, or route changes were needed.

### Completed Slice: Mobile Relationship Review Expansion

Status: completed on 2026-07-05.

Implemented:

- Mobile Relationship Studio Review now supports Show More/Show Fewer controls
  for orphaned records, duplicate relationship groups, and legacy text review
  items when those lists exceed their compact defaults.
- Duplicate relationship review now uses the same limited-result approach as
  orphan and legacy review rows on mobile.
- Mobile hidden-count copy now describes remaining review items directly
  instead of using refinement wording when Show More actions are available.
- Mobile render coverage now exercises the duplicate-group expansion affordance.

Evaluation before implementation:

- The root cause matched the browser review gap: mobile Review mode reported
  hidden cleanup items but did not let users reveal them in place.
- The best path was temporary screen-local expansion state, because the review
  and cleanup models already include the full item sets.

Re-evaluation after implementation:

- Mobile users can inspect complete relationship cleanup lists before switching
  modes or running cleanup actions.
- A re-evaluation pass removed misleading refinement copy from the expandable
  mobile Review lists, so the status text now matches the controls.
- No persistence, schema, or route changes were needed.

### Completed Slice: Relationship Review Documentation Alignment

Status: completed on 2026-07-05.

Implemented:

- The user guide now describes expanding Relationship/Links Review cleanup
  lists before repairing links, cleaning duplicates, reviewing legacy text, or
  inspecting graph context.
- The manual release checklist now asks QA to expand Review cleanup lists and
  review legacy relationship text during the Relationship Studio workflow.

Evaluation before implementation:

- The root cause was documentation drift after the browser and mobile Review
  expansion slices: runtime cleanup lists became fully inspectable, but docs
  still only described cleanup at a high level.
- The best path was focused docs/checklist alignment because no additional UI
  behavior was required.

Re-evaluation after implementation:

- The documented relationship workflow now matches the expanded Review behavior
  on browser and mobile.
- No additional documentation gaps were found for this slice.

### Completed Slice: Browser Relationship Review Count Copy Alignment

Status: completed on 2026-07-05.

Implemented:

- Browser Relationship Studio Review hidden-count tags now name the hidden
  orphaned records and legacy text items directly instead of saying only
  "N more".
- Browser duplicate relationship review now shows a hidden-count status tag
  before the Show More control, matching the clearer mobile review behavior.

Evaluation before implementation:

- The root cause was a copy polish gap after Review expansion: users could
  reveal the hidden rows, but the browser status tags still required context
  memory to understand what was hidden.
- The best path was a local copy-only update because the expansion state,
  review models, and actions already worked.

Re-evaluation after implementation:

- Browser and mobile Relationship Review now use direct hidden-count language
  for expandable cleanup lists.
- No data model, persistence, route, or shared component changes were needed.

### Completed Slice: Section Legacy Text Review Expansion

Status: completed on 2026-07-05.

Implemented:

- Browser section compatibility pages now support Show More/Show Fewer controls
  for legacy relationship text review items when a section has more than six
  items to inspect.
- The compact default remains in place, but users can reveal the full
  section-scoped cleanup list without leaving the section page.

Evaluation before implementation:

- The root cause was a remaining hard cap in section pages after Relationship
  Studio gained expandable Review lists: affected users were told to continue
  cleanup through individual entries instead of being able to reveal the hidden
  review rows in place.
- The best path was screen-local expansion state because the section review
  model already contains the full item set and the migration actions already
  operate per item or as an exact-match batch.

Re-evaluation after implementation:

- The section compatibility workflow now matches the newer Relationship Studio
  expectation that compact review lists can expand in place.
- No route, persistence, migration, or shared model change was needed.

### Completed Slice: Mobile Section Legacy Text Review Expansion

Status: completed on 2026-07-05.

Implemented:

- Mobile Entries context review now supports Show More/Show Fewer controls for
  section-scoped legacy relationship text review items.
- Hidden-count copy now names remaining legacy text items directly instead of
  telling users to open affected entries to continue cleanup.
- Mobile render coverage now verifies that dense section review lists expose
  the expansion affordance.

Evaluation before implementation:

- The root cause was a mobile-only workflow gap: Relationship Studio and
  browser section review could expand dense legacy text lists, but mobile
  Entries context mode still rendered a hard six-item slice with passive
  continuation instructions.
- The best path was mobile-local expansion state because the shared review
  model already exposes the full section-scoped item set and cleanup actions
  already operate per item.

Re-evaluation after implementation:

- Mobile users can now inspect complete section-scoped legacy text cleanup
  lists from context mode before choosing review or migration actions.
- No persistence, route, or shared review-model change was needed.

### Completed Slice: Workbench Drafting Prompt Expansion

Status: completed on 2026-07-05.

Implemented:

- Browser Workbench selected-context cards now support Show More/Show Fewer for
  drafting prompts when the selected record has more than four unresolved
  prompts.
- Mobile Workbench context mode now supports the same expansion behavior when a
  selected record has more than three unresolved prompts.
- Mobile hidden-count copy now describes the remaining prompt count directly
  instead of using search-refinement wording.
- Mobile render coverage now verifies a prompt-heavy character context route
  exposes the hidden prompt count and expansion action.

Evaluation before implementation:

- The root cause was a renderer-level cap: the shared Workbench model already
  exposed all incomplete prompts, but browser and mobile context surfaces only
  rendered a small subset with no way to reveal the rest.
- The best path was local expansion state in each platform renderer because no
  domain, persistence, route, or shared-model behavior needed to change.

Re-evaluation after implementation:

- Users can now inspect complete drafting guidance from Workbench context before
  deciding whether they need to open the full editor.
- The compact default remains suitable for repeated scanning, and expansion
  resets when the selected record changes.
- A re-evaluation pass removed misleading mobile hidden-count copy, so the
  status text now matches the expansion action.

### Completed Slice: Browser Compact Count Copy Alignment

Status: completed on 2026-07-05.

Implemented:

- Browser section compatibility review now names hidden legacy text items
  directly before the Show More control.
- Browser Workbench selected-context cards now name hidden drafting prompts
  directly before the Show More control, matching the clearer mobile copy.

Evaluation before implementation:

- The root cause was a copy consistency gap after expansion controls were added:
  browser compact lists still displayed bare "N more" tags even though mobile
  and newer browser slices used item-specific hidden-count language.
- The best path was local copy alignment because the compact defaults,
  expansion controls, and underlying workflow data already worked.

Re-evaluation after implementation:

- Browser compact workflow lists now make hidden review and drafting counts
  self-explanatory without increasing interaction cost.
- No model, route, persistence, or component architecture change was needed.

### Completed Slice: Workspace Management List Expansion

Status: completed on 2026-07-05.

Implemented:

- The shared Workspace feature model now supports per-list result limits, so
  browser and mobile can expand one management list without expanding every
  Workspaces section.
- Browser Workspaces now supports Show More/Show Fewer controls for large
  project/universe workspace lists and in-fiction world lists.
- Mobile Workspaces now supports matching Show More/Show Fewer controls for the
  same large management lists.
- Browser and mobile hidden-count copy now describes the remaining workspaces
  or worlds directly instead of telling users to refine search when a Show More
  action is available.

Evaluation before implementation:

- The root cause was that Workspaces used a shared high-count result cap with
  only search-refinement guidance. That protects dense pages, but it still
  forces users to alter a query when they simply want to inspect the rest of
  the current workspace or world list.
- The best path was a shared per-list limit override, because the existing
  shared model already owns searching, counting, hidden counts, and row
  construction for both platforms.

Re-evaluation after implementation:

- Users can keep the compact default for scanning but expand the current
  Workspaces result set in place on browser and mobile.
- Custom entry type expansion was not added to Workspaces because that workflow
  has moved to Knowledge/More; adding a control to an unused Workspaces surface
  would increase drift instead of reducing interaction cost.
- A re-evaluation pass removed contradictory search-refinement copy from the
  expanded Workspaces lists; a later model cleanup retired the unused shared
  hidden-text field entirely.

### Completed Slice: Workspace Hidden Copy Model Cleanup

Status: completed on 2026-07-05.

Implemented:

- The shared Workspace feature model no longer returns unused `hiddenText`
  refinement copy for capped Workspaces, custom type, or in-fiction world rows.
- The focused model test now verifies live count data instead of stale UI copy.

Evaluation before implementation:

- The root cause was contract drift: browser and mobile Workspaces now use
  direct hidden counts plus Show More controls, but the shared model still
  generated old "Refine search to show..." text that no renderer consumed.
- The best path was removal rather than replacement because the active
  renderers already own their platform-specific expansion copy.

Re-evaluation after implementation:

- The shared model now exposes only the data that current platform renderers
  use for capped lists: rows, total count, hidden count, labels, placeholders,
  and empty text.
- No navigation, persistence, or visual changes were needed.

### Completed Slice: Hidden Result Formatter Cleanup

Status: completed on 2026-07-05.

Implemented:

- Removed the unused shared `formatHiddenResultCountMessage` helper that
  generated refinement-first hidden-count copy.
- Removed test coverage that existed only to preserve the deleted helper.

Evaluation before implementation:

- The root cause was the same copy-model drift at the utility layer: expansion
  controls now use specific renderer-owned labels, but the shared helper still
  encoded the older "refine search" behavior.
- The best path was deletion because no active browser, mobile, or core model
  code imported the helper.

Re-evaluation after implementation:

- Shared feature display utilities now keep only live concerns: limited result
  counts, compact text-list formatting, plural labels, mobile caps, and scale
  decisions.
- Future capped-list copy can be added beside the renderer that owns the
  interaction rather than as a misleading global default.

### Completed Slice: Shared Review Tray Summary Model

Status: completed on 2026-07-05.

Implemented:

- Core now exposes a shared Review Tray summary model for review category
  cards, issue counts, total issue state, and severity.
- Relationship Studio Review now builds its broken reference, orphaned record,
  duplicate relationship, and legacy text summary cards through the shared
  Review Tray model.
- Timeline Review now exposes matching Review Tray summary items for unordered
  events, duplicate orders, and unlinked events.
- Browser Relationship Studio, browser Timeline, mobile Links, and mobile
  Timeline now render review summary counts and details from the shared model
  while preserving their existing detailed repair/edit actions.

Evaluation before implementation:

- The root cause was review-summary drift: Timeline and Relationship Studio had
  similar review trays, but each page manually assembled count cards and copy.
- The best path was to centralize only the summary-card contract first, leaving
  domain-specific target lists and repair actions in their existing surfaces.

Re-evaluation after implementation:

- Browser and mobile review summaries now share the same issue-count semantics
  across Timeline and Relationship Studio.
- Detailed review actions remain platform-native and domain-specific, avoiding
  a broad component rewrite.
- Further Review Tray consolidation can focus on selected-record Workbench
  context or cross-surface aggregation rather than basic summary consistency.

### Completed Slice: Mobile Relationship Graph Expansion

Status: completed on 2026-07-05.

Implemented:

- Mobile Relationship Studio Graph mode now supports Show More/Show Fewer for
  graph record nodes when the filtered graph exceeds the compact mobile limit.
- Hidden graph-node copy now describes the remaining graph records directly
  instead of telling users to refine graph search when an expansion action is
  available.
- Graph expansion resets when the active world, graph search, or graph filters
  change.

Evaluation before implementation:

- The root cause was a mobile-only parity gap: browser Graph mode rendered the
  graph node set directly, while mobile Graph mode capped graph nodes with only
  search-refinement guidance.
- The best path was mobile-local expansion state because the shared graph model
  already exposes the full filtered node set and the limit is a mobile rendering
  concern.

Re-evaluation after implementation:

- Mobile graph browsing now supports both compact scanning and complete
  filtered-node inspection without forcing users to alter their graph search.
- No shared graph model, persistence, or route changes were needed.

### Completed Slice: Mobile Timeline Era Expansion

Status: completed on 2026-07-05.

Implemented:

- Mobile Timeline grouped era browsing now supports Show More/Show Fewer for
  event groups that exceed the compact mobile event limit.
- Hidden event copy now describes the remaining events in the era directly
  instead of framing the issue only as a timeline-filter refinement task.
- Era expansion resets when the Timeline section, search, status, tag,
  archived, era, or involved-record filters change.

Evaluation before implementation:

- The root cause was a mobile-only browsing cap: era groups exposed only the
  first set of events even though the user was already in the appropriate
  timeline context.
- The best path was per-era mobile expansion state because the shared Timeline
  browse model already exposes full filtered era groups and browser workflows
  are not using this compact mobile rendering limit.

Re-evaluation after implementation:

- Mobile Timeline users can keep compact era browsing for scanning but expand a
  dense era without changing filters or leaving the Timeline workflow.
- No shared Timeline model, persistence, or route changes were needed.

### Completed Slice: Mobile Timeline Involved Filter Expansion

Status: completed on 2026-07-05.

Implemented:

- Mobile Timeline involved-record filters now support Show More/Show Fewer
  when the compact chip list hides additional involved records.
- Hidden-count copy now names remaining involved records directly instead of
  requiring users to refine the involved-record search.
- Involved-filter expansion resets when Timeline search, era, status, tag,
  archive visibility, involved search, or involved-record filter state changes.
- Mobile render coverage now verifies dense Timeline involved-record filters
  expose the expansion affordance.

Evaluation before implementation:

- The root cause was a mobile-only filter browsing cap: users could be in the
  correct Timeline context but still had to search to reach additional involved
  record filters.
- The best path was mobile-local expansion state because the shared Timeline
  browse model already exposes the full involved-record option set and the cap
  is only a compact rendering concern.

Re-evaluation after implementation:

- Mobile Timeline users can browse all involved-record filters in place before
  narrowing by search.
- No shared Timeline model, persistence, or route changes were needed.

### Completed Slice: Mobile Knowledge Overview Expansion

Status: completed on 2026-07-05.

Implemented:

- Mobile More Knowledge overview now supports Show More/Show Fewer for entry
  type summaries when the workspace has more than four entry types.
- Mobile More Knowledge overview now supports Show More/Show Fewer for
  relationship-backed field summaries when more than four linked fields exist.
- Hidden-count copy now states how many entry types or linked fields remain
  visible on expansion.

Evaluation before implementation:

- The root cause was a mobile-only overview cap: the shared schema model exposed
  all entry types and relationship-backed fields, but mobile More rendered only
  the first four of each with no hidden count or expansion action.
- The best path was local expansion state because the mobile overview needs a
  compact default while the full schema data already exists in the shared
  Knowledge model.

Re-evaluation after implementation:

- Mobile users can inspect the complete schema overview before jumping into a
  specific type or linked field workflow.
- Browser Knowledge already renders the full schema overview, so no browser or
  shared-model change was needed.

### Completed Slice: Expandable Workflow Documentation Alignment

Status: completed on 2026-07-05.

Implemented:

- The user guide now explains expandable Workbench prompts, mobile Timeline era
  groups, mobile More schema summaries, and dense Workspaces lists.
- The mobile README now describes expandable Timeline, Knowledge, and
  Workspaces summaries.
- Manual release QA now asks testers to exercise expandable prompt, Timeline,
  Relationship Review, Graph, workspace, and in-fiction world lists when dense
  fixtures make those controls available.
- The web/mobile parity checklist now distinguishes expandable review/browse
  lists from true search/picker caps that still require refinement.

Evaluation before implementation:

- The root cause was documentation drift after multiple expansion slices:
  runtime behavior now supports in-place expansion for several compact
  workflows, but user and QA docs still described only some Relationship Review
  expansion and still treated large mobile caps primarily as search-refinement
  scenarios.
- The best path was focused documentation alignment because no additional
  runtime behavior was required and the remaining cap scan showed mostly
  intentional picker/search limits.

Re-evaluation after implementation:

- Users and QA now have a consistent rule: expand compact review/browse lists
  when an expansion action exists, and refine search for true picker/search
  caps.
- No UI, route, persistence, or shared-model change was needed.

## Current Architecture Considerations

### Shared Packages

Current shared layer:

- `@valgaron/core`: domain types, document mutations, route intents, shell
  routes, entry/relationship/timeline/search/data/workspace view models.
- `@valgaron/ui-tokens`: colors, spacing, radius, typography.
- `@valgaron/platform`: storage-oriented helpers.

Recommendation:

- Continue putting durable domain logic and platform-neutral view models in
  `@valgaron/core`.
- Keep visual rendering in web and mobile apps.
- Extend `@valgaron/ui-tokens` only for shared design primitives and semantic
  tokens, not component behavior.
- Avoid a shared React component package until repeated cross-platform UI
  duplication has proven costly. React DOM and React Native interaction models
  differ enough that premature shared render components would slow work down.

### Web App

Current web state:

- `useWorldDocumentState` owns document state, manual save, snapshots, and
  active workspace mutations.
- Route pages render Overview, Section, Relationships, Workspaces, Data, Help.
- Section pages already compose list, filters, detail, editor, timeline panel,
  legacy link review, and relationship-backed fields.

Implementation concern:

- Web currently treats save as manual. Staged links must not silently save to
  localStorage. They can update in-memory document state and then rely on the
  existing header Save, or they can be contained inside a draft transaction
  until the entry save action.

Recommended path:

- Add `WorkbenchPage` and keep current section routes as route-intent entry
  points into Workbench.
- Extract current section list/editor/detail model logic into core view models
  before changing layout.

### Mobile App

Current mobile state:

- `MobileCodexProvider` commits document changes to device storage after
  mutations.
- Mobile `EntriesScreen` already combines section switching, list, editor,
  timeline browsing, linked fields, and review.
- Mobile `RelationshipsScreen` already combines health, repair, graph, pickers,
  relationship form, and saved list.

Implementation concern:

- Mobile auto-saves after mutations. Staged draft graph behavior must avoid
  partially saving temporary relationship drafts unless the user commits.

Recommended path:

- Create a local screen-level draft transaction for Workbench Edit mode.
- Commit entry plus relationships through a single controller method.
- Keep current mobile save semantics for committed changes.

## Implementation Principles

- Favor shared view models over shared rendered components.
- Preserve route compatibility while introducing new destinations.
- Keep every slice shippable and testable.
- Do not introduce backend, auth, sync, collaboration, or security claims.
- Keep English-only UI copy.
- Treat local data and import/export compatibility as product-critical.
- Prefer simple typed objects and migrations over abstract plugin systems.
- Defer schema power until high-friction authoring workflows are improved.

## Shared Core Workstreams

### Route And Shell Model

Build in `@valgaron/core`:

- `workbench` route id.
- `knowledge` route id, possibly hidden behind utilities until implemented.
- `utilities` or route grouping model without necessarily changing physical
  URLs immediately.
- Compatibility helpers that translate:
  - `/characters` to Workbench with `sectionId=characters`.
  - `/places` to Workbench with `sectionId=places`.
  - `/timeline` to Timeline.
  - `/entries?sectionId=timeline` to Timeline or Workbench depending on the
    selected rollout gate.

Tests:

- Route intent parsing.
- Web route order.
- Mobile tab route order.
- Compatibility redirects.

### Workbench View Model

Build in `@valgaron/core`:

- `WorkbenchMode`: `index`, `edit`, `context`.
- `WorkbenchSelection`: section id, entry id, intent, query, filters.
- Universal record list model with section filters, saved views, search,
  recent, pinned, incomplete, unlinked, needs-review, archived.
- Selected record context model with relationships, timeline involvement,
  review issues, suggestions, hidden details, and completeness prompts.
- Action descriptors for create, open, duplicate, archive, restore, delete,
  copy name, use as template, add link, create-and-link.

Implementation notes:

- Reuse existing `entryListModel`, `overview`, `codexSearch`,
  `codexTemplates`, and `codexRelationships`.
- Avoid duplicating list/filter logic in web and mobile.
- Include result limit controls for mobile and large worlds.

Tests:

- Workbench list filters.
- Deep link selection.
- Dirty draft route replacement decisions.
- Large world list performance smoke.

### Draft Transaction Model

Build in `@valgaron/core`:

- `EntryDraftTransaction`.
- Temporary draft ids or deterministic local draft ids.
- Staged relationship drafts.
- Commit operation returning updated entry and relationship mutations.
- Discard/reset operation.
- Validation that reports entry errors and relationship errors together.

Recommended data shape:

- Do not put transaction state into `WorldDocument`.
- Keep transaction state in component/controller state.
- Commit produces ordinary `WorldEntry` and `WorldRelationship` records.

Tests:

- Create new entry with staged links.
- Edit existing entry with added/removed links.
- Discard draft leaves document unchanged.
- Duplicate/template draft does not reuse relationship ids incorrectly.
- Mobile commit and web manual-save flows produce equivalent documents.

### Relationship Field Model

Build in `@valgaron/core`:

- Platform-neutral relationship field display model.
- Selected target chips.
- Search/filter target options.
- Create-and-link target descriptor.
- Warnings for unusual target categories.
- Cardinality behavior.
- Direction and relationship type behavior.
- Field-level legacy text migration state.

Implementation notes:

- Consolidate logic currently split between web `RelationshipFieldControl` and
  mobile `getMobileEntryEditorModel`.
- Keep mobile-specific result limits configurable.
- Support both saved relationships and staged relationships.

Tests:

- Single-link replacement.
- Multi-link toggle.
- Clear linked records.
- Unusual target visibility.
- Hidden preferred count.
- Legacy text exact match migration.

### Universal Record Picker Model

Build in `@valgaron/core`:

- Search results across sections.
- Target kind/category constraints.
- Recent records and selected records pinned to top.
- Empty state.
- "Create new target" descriptor.
- Result limit and refinement message.

Web rendering:

- Popover or side drawer with keyboard navigation.

Mobile rendering:

- Full-screen modal or bottom sheet with search first.

Tests:

- Target kind constraints.
- Preferred category ordering.
- Query matching.
- Selected targets remain visible.
- Large world result limiting.

### Review Tray Model

Build in `@valgaron/core`:

- Broken relationships.
- Orphaned records.
- Legacy text links.
- Hidden field data.
- Incomplete records.
- Timeline duplicate/missing order.
- Timeline unlinked events.
- Severity and count labels.
- Batch action descriptors.

Implementation notes:

- Use in Workbench context, Timeline, and Relationship Studio.
- Keep normal drafting unblocked unless an action would corrupt data.

Tests:

- Issue counts by selected record.
- Workspace-wide issue counts.
- Batch migration eligibility.
- Dirty-draft blocking rules.

## Platform Component Workstreams

### Web Components

Add or refactor:

- `WorkbenchPage`.
- `WorkbenchShell`.
- `RecordIndexPane`.
- `RecordEditorPane`.
- `ContextInspectorPane`.
- `RelationshipField`.
- `UniversalRecordPicker`.
- `EntityChip`.
- `CreateAndLinkDrawer`.
- `ReviewTray`.
- `FieldGroupNavigator`.

Implementation considerations:

- Keep current MUI/Emotion dependencies and existing app CSS conventions unless
  explicitly approved otherwise.
- Maintain deep links and browser back/forward behavior.
- Avoid nested card-heavy layouts.
- Keep focus management for drawers/dialogs.
- Preserve header Save and Data Menu.

Validation:

- Browser smoke route text.
- Responsive screenshots at 320, 375, 768, and desktop widths.
- Keyboard flow through picker, drawer, and relationship chips.
- No horizontal overflow.

### Mobile Components

Add or refactor:

- `WorkbenchScreen`.
- `WorkbenchIndexMode`.
- `WorkbenchEditMode`.
- `WorkbenchContextMode`.
- `TimelineScreen` promoted from Entries timeline subset.
- `RelationshipStudioScreen` modes: Review, Graph, Links, Edit.
- `UniversalRecordPickerModal`.
- `EntityChipRow`.
- `CreateAndLinkModal`.
- `CollapsibleFieldGroup`.
- `MobileReviewTray`.

Implementation considerations:

- Keep 44 px touch targets.
- Prefer full-screen modal selection for long lists.
- Avoid tiny destructive icons.
- Keep keyboard-avoiding behavior.
- Use result limits consistently.
- Keep mobile route params compatible with existing deep links.

Validation:

- Mobile render tests for changed screens.
- Route param tests.
- Unsaved draft confirmation tests.
- Android rendered interaction smoke when available.
- Manual or screenshot checks for long field groups.

## Feature Implementation Phases

### Phase 0: User Gates And Technical Design

Evaluation before work:

- Root cause: The UX direction affects navigation, persistence, and schema.
- Best path: Use the accepted gate decisions above before code changes.
- Current status: Complete for the current prototype. The accepted gate
  decisions are recorded in this document and guided the completed slices.

Tasks:

- Record the accepted decisions for the seven gates above in the implementation
  issue, project plan, or ADR before code work starts.
- Add a short architecture decision record or planning section to this
  document.
- Define first release acceptance tests.
- Treat Knowledge as a More/Utilities child on mobile for the first release.
- Treat route/schema compatibility as a clean break unless a later product
  requirement introduces seeded or user-held data that must be preserved.

Re-evaluation:

- Route surface, MVP scope, staged link strategy, mobile tab count, schema
  boundary, clean-break migration policy, and evidence gates are documented.

### Phase 1: Shared Route And Workbench Foundation

Evaluation before work:

- Root cause: Web and mobile currently expose different route models.
- Best path: Add shared route/view model foundation before UI replacement.
- Current status: Complete for the current prototype. Shared shell routes,
  workflow destinations, Workbench, Timeline, Links, More/Utilities, and route
  intent coverage now provide the foundation.

Tasks:

- Extend shell route ids and route intent parsing for Workbench/Timeline/Links.
- Add Workbench selection model.
- Add compatibility route tests.
- Add an initial web Workbench route shell.
- Add mobile Workbench tab or adapt Entries tab label/path behind compatibility
  helpers.

Re-evaluation:

- Current compatibility and top-level navigation paths have coverage. Future
  route work should be driven by new product workflow needs, not foundation
  parity.

### Phase 2: Shared Record Index And Context Models

Evaluation before work:

- Root cause: Overview, section lists, mobile Entries, and search duplicate
  related concepts.
- Best path: Centralize record index and selected context models.
- Current status: Complete for the current prototype. Shared Workbench record
  index, picker, selected context, entity chips, and large-world reachability
  coverage are in place.

Tasks:

- Add universal record index model.
- Add saved views: all, recent, pinned, incomplete, unlinked, needs-review,
  archived.
- Add selected context model.
- Reuse existing overview and entry list tests where possible.
- Add large-world test coverage for index and context creation.

Re-evaluation:

- Web and mobile now render the shared index/context data through
  platform-specific components.

### Phase 3: Relationship Field And Picker Foundation

Evaluation before work:

- Root cause: Relationship-backed field code is split and gated.
- Best path: Build shared model before changing UX.
- Current status: Complete for the current prototype. Relationship-backed
  fields, preferred/unusual target display, shared picker behavior, and
  saved-record parity are implemented across browser and mobile.

Tasks:

- Extract shared relationship field display model.
- Add universal record picker model.
- Add entity chip model.
- Add tests for current saved-entry behavior first.
- Render new web/mobile components in existing entry editors behind current
  saved-entry gate.

Re-evaluation:

- Existing behavior remains stable while shared relationship field logic is
  centralized in core and rendered separately per platform.

### Phase 4: Draft Transactions And Create-And-Link

Evaluation before work:

- Root cause: Users cannot complete links during initial entry creation.
- Best path: Add transaction model with staged relationships.
- Current status: Complete for the current prototype. Draft transactions and
  create-and-link staging now work for browser and mobile entry creation.

Tasks:

- Implement `EntryDraftTransaction` in core.
- Add web state integration without forcing localStorage save.
- Add mobile state integration with atomic commit.
- Add create-and-link modal/drawer for Place, Faction, Lore, Timeline, and
  Character targets.
- Add recovery snapshot policy for destructive link changes only, not ordinary
  staged draft discard.

Re-evaluation:

- Users can create records with staged relationship links before final save on
  both platforms.

### Phase 5: Browser Workbench

Evaluation before work:

- Root cause: Browser section pages force section-by-section workflow.
- Best path: Introduce three-pane Workbench while preserving old routes.
- Current status: Complete for the current prototype. Browser Workbench has a
  real route, shared index, selected context, section actions, relationship
  actions, deep-link hydration, route-persisted saved views, inline selected
  record editing, and inline quick create.

Tasks:

- Build `WorkbenchPage`.
- Move section deep links into Workbench selection state.
- Render universal index, editor, and context inspector.
- Move legacy review into Review Tray.
- Keep old section routes as redirects or wrappers.
- Update browser smoke tests and screenshots.

Re-evaluation:

- Current browser Workbench supports browsing, context review, quick creation,
  saved-record editing, relationship-backed field maintenance, and explicit
  handoff to legacy section editors when users want the older route. Future
  Workbench work should be scoped as visual polish, review-tray consolidation,
  or performance validation, not MVP workflow completion.

### Phase 6: Mobile Workbench

Evaluation before work:

- Root cause: Mobile Entries is too long and mixes many concerns.
- Best path: Split into Workbench Index/Edit/Context modes.
- Current status: Complete for the current prototype. Mobile Workbench/Timeline
  modes split Index, Context, and Edit concerns while preserving route params.

Tasks:

- Create `WorkbenchScreen` from EntriesScreen capabilities.
- Add internal mode control.
- Move entry list/search/filter to Index.
- Move form and field groups to Edit.
- Move linked records, suggestions, and review to Context.
- Add collapsible field groups.
- Preserve existing route params for `sectionId`, `entryId`, `intent`, and
  `query`.

Re-evaluation:

- Mobile users can reach list, edit, and context workflows without scrolling
  through unrelated sections.

### Phase 7: Timeline Surface

Evaluation before work:

- Root cause: Timeline is currently a section variant.
- Best path: Promote it to a workflow surface after Workbench foundations exist.
- Current status: Complete for the current prototype. Timeline has dedicated
  browser/mobile surfaces, shared surface models, era management, involved
  records, review targets, open actions, and dense mobile expansion controls.

Tasks:

- Build shared timeline surface model.
- Add involved-record relationship field using shared picker/chips.
- Add Era Manager MVP.
- Browser: dedicated Timeline page with event list/table/editor/context.
- Mobile: dedicated Timeline tab/screen with Events/Era/Edit modes.
- Move timeline diagnostics into Review Tray.

Re-evaluation:

- Event creation, era assignment, ordering, review, and involved records are
  reachable from the Timeline workflow on both platforms. A custom event editor
  remains future work only if the shared entry editor proves insufficient.

### Phase 8: Relationship Studio

Evaluation before work:

- Root cause: Relationship pages mix everyday linking and advanced maintenance.
- Best path: After inline linking works, repurpose Relationships.
- Current status: Complete for the current prototype. Relationship Studio has
  Review, Graph, Links, and Bulk Edit modes with repair, graph inspection,
  duplicate cleanup, legacy text review, and dense mobile expansion controls.

Tasks:

- Add Relationship Studio mode model: Review, Graph, Links, Bulk Edit.
- Move broken links, orphaned entries, legacy migration, and duplicate review
  into Review.
- Keep graph browsing but improve selected node/edge inspection.
- Remove generic link creation as the primary path, but keep Link Composer for
  ad hoc relationships.
- Mobile: split long RelationshipsScreen into modes.

Re-evaluation:

- Users do not need Relationship Studio for common links, but it is clearly the
  place for graph audit, repair, ad hoc links, and deterministic bulk cleanup.

### Phase 9: Knowledge And Schema MVP

Evaluation before work:

- Root cause: Custom types and user fields are not centralized.
- Best path: Implement only the schema MVP after relationship workflows are
  stable.
- Current status: Complete for the current schema MVP. Knowledge owns custom
  entry types, field management, relationship-backed field summaries,
  vocabulary review, lore definition overview, hidden-detail cleanup, focus
  routing, and portability coverage.

Tasks:

- Design v3 document schema for user field definitions if required.
- Add migration from v2.
- Add field definitions for built-in and custom entry types.
- Move custom entry type management from Workspaces into Knowledge.
- Add controlled vocabularies.
- Add lore definition types.
- Add field backing rules for Lore/Faction/Place/Character/Timeline targets.
- Add import/export compatibility tests.

Re-evaluation:

- Users can create custom sections, add/reorder/rename/remove fields, inspect
  vocabulary patterns, and clean hidden values. Durable v3 field definitions or
  editable controlled vocabularies remain future product decisions.

### Phase 10: Utilities Consolidation

Evaluation before work:

- Root cause: Data, Help, Workspaces, and schema currently compete with daily
  drafting.
- Best path: Consolidate utilities only after primary surfaces are stable.
- Current status: Complete for the current prototype. Utilities/Data,
  Workspaces, Help, Knowledge destinations, mobile More, and safety workflows
  are consolidated enough for the current navigation model.

Tasks:

- Browser: group Data, Workspaces, Help under Utilities while preserving direct
  URLs and header Data Menu.
- Mobile: move Data, Workspaces, Help into More/Utilities.
- Keep Workspaces focused on project/universe metadata and switching.
- Remove custom entry type management from Workspaces after Knowledge is live.

Re-evaluation:

- Creative surfaces dominate navigation, and data safety remains easy to find.
  Further consolidation should be based on observed navigation friction.

## Migration And Compatibility Plan

Route compatibility:

- No long-term route compatibility is required because there are no live users
  or live data.
- Replace section-heavy routes with the new workflow route model.
- Keep temporary redirects only if they reduce implementation risk during a
  short transition, then remove them before the slice is considered complete.
- Update tests, smoke checks, docs, and help copy to the new route model.

Document compatibility:

- No live v2 document compatibility is required.
- Introduce the next schema version when Workbench transactions or Knowledge
  And Schema need durable data changes.
- Keep seed data, export, import preview, reset, diagnostics, and recovery
  internally consistent with the active schema.
- Tests should cover the active schema thoroughly, but do not need legacy v2
  import coverage unless a future seeded-data migration is introduced.

Feature compatibility:

- Keep archive, restore, duplicate, permanent delete, import, reset, and
  recovery snapshot behavior.
- Keep current relationship diagnostics until Relationship Studio replaces
  their presentation.

## Validation Plan

Required gates by slice:

- `npx prettier --write` for edited files.
- `npm test`.
- `npm run typecheck` for source changes.
- `npx eslint .` when runnable.
- `npx vite build` after route/export/build changes.
- Mobile render tests for changed mobile screens.
- Browser smoke after route/layout changes.

Focused tests to add:

- Workbench route intent and compatibility.
- Universal record index.
- Relationship field model.
- Draft transaction commit/discard.
- Create-and-link.
- Timeline involved records.
- Relationship Studio review modes.
- Knowledge schema migration.

Manual checks:

- 320 px and 375 px mobile screenshots for Workbench, Timeline, Links, More.
- Desktop screenshot for three-pane Workbench.
- Keyboard-only record picker and create-and-link drawer.
- Android rendered interaction checks when mobile navigation changes.

## Risks And Mitigations

Risk: Over-abstracting shared UI.

Mitigation:

- Share view models and action descriptors first. Keep web and mobile rendering
  separate.

Risk: Breaking local data.

Mitigation:

- Delay schema changes. Add migration tests before any v3 write path.

Risk: Mobile screens become modal-heavy.

Mitigation:

- Use modes for persistent context and modals only for focused selection or
  create-and-link tasks.

Risk: Workbench becomes too dense.

Mitigation:

- Browser uses panes. Mobile uses modes. Review stays collapsed by default.

Risk: Relationship transactions create confusing save semantics.

Mitigation:

- Browser keeps manual Save visible. Mobile commits atomically on Save Entry.
  Draft discard leaves document unchanged on both platforms.

Risk: Knowledge And Schema slows delivery.

Mitigation:

- Defer it until inline relationship workflows ship. Limit schema MVP.

## Iterative Review Of This Implementation Plan

### Review Pass 1: Are User Input Gates Early Enough?

Finding:

Implementation could begin before navigation, staged-link strategy, or schema
scope is settled.

Correction:

Added Phase 0 and seven explicit user gates before code work.

Re-evaluation:

The plan now prevents the highest-cost reversals.

### Review Pass 2: Is The Shared Component Strategy Realistic?

Finding:

Sharing rendered components across React DOM and React Native would likely
create styling, accessibility, and interaction compromises.

Correction:

The plan shares core view models, descriptors, route intents, and tokens while
keeping web/mobile render components separate.

Re-evaluation:

This fits the existing monorepo and avoids premature abstraction.

### Review Pass 3: Does Mobile Get Equal Priority?

Finding:

A web-first Workbench could leave mobile as a later adaptation.

Correction:

The plan includes mobile workstreams and a dedicated Mobile Workbench phase with
route compatibility and render tests.

Re-evaluation:

Mobile remains equal in product design, while sequencing still lets shared core
work land first.

### Review Pass 4: Is The Plan Too Big For One Release?

Finding:

The full plan spans navigation, linking, timeline, schema, and utilities.

Correction:

Phases separate the first valuable release: Workbench foundation plus inline
relationship fields. Schema and utilities consolidation are later phases.

Re-evaluation:

The plan is comprehensive but can ship incrementally.

### Review Pass 5: Are Persistence Differences Addressed?

Finding:

Browser manual save and mobile auto-save create different transaction risks.

Correction:

Added platform-specific transaction guidance: browser in-memory/manual save,
mobile atomic commit.

Re-evaluation:

The same user workflow can be implemented without forcing identical persistence
semantics.

### Review Pass 6: Are Existing Tests And Gates Sufficient?

Finding:

Current tests are strong for core behavior but need new workflow-specific
coverage.

Correction:

Added focused tests for Workbench, picker, relationship fields, draft
transactions, create-and-link, Timeline, Relationship Studio, and schema
migrations.

Re-evaluation:

Validation now matches the risk profile.

### Review Pass 7: Does The Plan Protect Existing Work?

Finding:

Replacing pages outright could break old URLs, exports, and mobile route params.

Correction:

Added route and document compatibility requirements.

Re-evaluation:

The implementation can migrate UI without stranding existing local data or
deep links.

### Review Pass 8: Does The Plan Preserve Fast Drafting?

Finding:

Transactions, pickers, and schema features can add friction.

Correction:

The first release focuses on reusing current fields and links, with schema
power deferred and quick text preserved.

Re-evaluation:

The plan improves workflow power without forcing upfront schema design.

### Completed Slice: Timeline Context Route Reseeding

Status: completed on 2026-07-05.

Implemented:

- Browser Timeline route-selection state now includes contextual Timeline
  creation params, so changing `intent=new` links between different eras or
  involved records reseeds the active draft.
- Browser smoke coverage now performs an in-place navigation from one
  contextual Timeline create route to another and verifies the draft era and
  staged involved-record link both update.

Evaluation before implementation:

- Root cause: direct contextual Timeline create routes worked, but the browser
  route-selection key only tracked section, entry, intent, and query. A
  same-screen route update from one contextual create route to another could
  leave the old draft context in place.
- Mobile already tracked `era` and `involvedEntryId` in its applied route key,
  so the best path was a browser parity fix plus browser interaction coverage.

Re-evaluation after implementation:

- Browser and mobile now treat contextual Timeline create route params as part
  of the selected workflow state.
- The smoke test covers the interaction cost that mattered: users can move
  between contextual creation links without stale era or involved-record
  scaffolding.
- No data model, mobile route, or custom Timeline editor change was needed.

### Completed Slice: Timeline Create Workflow Context

Status: completed on 2026-07-05.

Implemented:

- Shared workflow intent classification for Timeline `intent=new` routes now
  includes a typed `timelineContext` payload with `era` and `involvedEntryId`.
- Core route-intent coverage now verifies contextual Timeline create routes do
  not collapse into generic entry creation when consumed by Help, analytics,
  parity checks, or future workflow automation.

Evaluation before implementation:

- Root cause: raw route parsing preserved contextual Timeline query params, but
  the typed workflow intent only exposed `kind`, `query`, and `sectionId`.
  Consumers using the workflow intent could not tell the difference between a
  blank Timeline create action and one seeded from an era or involved record.
- The best path was a narrow optional Timeline context on `entry-create`
  intents rather than a broad route-param bag.

Re-evaluation after implementation:

- Contextual Timeline creation is now represented consistently at the route,
  renderer, mobile adapter, and typed workflow-intent layers.
- Existing generic entry-create consumers remain compatible because the new
  context is optional and only populated by Timeline create routes.
- No UI change was needed for this slice; it protects future workflow and
  parity consumers from semantic drift.

### Completed Slice: Mobile Tab Accessibility Label Parity

Status: completed on 2026-07-05.

Implemented:

- Mobile tab route metadata now includes `tabAccessibilityLabel` alongside the
  visible compact tab label.
- The Expo tab layout now reads accessibility labels from the shared mobile
  route model instead of deriving them from fuller route titles.
- Mobile route-model coverage now verifies tab accessibility labels stay
  aligned with the visible Workbench, Timeline, Links, and More labels.

Evaluation before implementation:

- Root cause: mobile tabs visually used compact workflow labels such as
  `Links` and `More`, while accessibility labels were generated from full route
  titles such as `Relationships` and `Utilities`.
- The best path was to centralize mobile tab accessibility labels in the
  existing mobile route model because this is route metadata, not screen logic.

Re-evaluation after implementation:

- Visual tab labels and screen-reader labels now describe the same primary
  mobile workflows.
- Browser mobile-web navigation already uses visible text links, so no browser
  renderer change was needed for this slice.
- This closes a small accessibility drift gap without adding new navigation
  concepts or changing route behavior.

### Completed Slice: Mobile Checkbox Accessibility State Coverage

Status: completed on 2026-07-05.

Implemented:

- Mobile rendered screen tests now preserve React Native `accessibilityState`
  in the test markup for checked, disabled, and selected states.
- Mobile entry edit coverage now verifies `Pin entry on overview` renders as a
  checked checkbox with the shared accessible name.
- Mobile checkbox primitive coverage now verifies the shared `Directional
relationship` control label renders as a checked checkbox.

Evaluation before implementation:

- Root cause: the shared mobile `CheckboxField` primitive already set checkbox
  role and checked state, but the render-test mock discarded
  `accessibilityState`. Tests could verify labels but not the state contract
  called out in the parity plan.
- The best path was test-harness improvement plus representative assertions:
  one real entry-edit screen checkbox and one direct primitive check for the
  checked state.

Re-evaluation after implementation:

- Rendered mobile tests can now catch regressions where parity-critical
  checkbox controls lose their checked state or selected action state.
- The slice strengthens the existing shared accessibility inventory without
  changing UI behavior.
- Additional mobile control-state assertions can now be added incrementally
  when a workflow changes.

### Completed Slice: Relationship Route First Paint

Status: completed on 2026-07-05.

Implemented:

- Browser and mobile Relationship Studio now initialize route-focused
  relationship links directly in Links mode when `entryId`, `entryQuery`, or
  `relationshipQuery` route params are present.
- Initial draft, entry filter, entry query, and relationship query state now
  seed from the same route params before effects run on mobile; browser seeds
  matching draft, entry-filter, relationship-query, and mode state.
- Mobile render coverage now verifies a focused relationship route opens with
  Relationship Form, Saved Relationships, seeded source context, and the
  directional checkbox visible on first render.

Evaluation before implementation:

- Root cause: route-focused relationship links switched to Links mode only
  inside an effect. Interactive runtime recovered, but first render and static
  render stayed on Review, increasing perceived navigation cost and weakening
  route parity tests.
- The best path was to seed initial Relationship Studio state from route params
  while keeping the existing effects for later route changes.

Re-evaluation after implementation:

- Focused relationship routes now land immediately on the workflow users asked
  for across browser and mobile.
- Existing effects still handle subsequent route changes and invalid entry ids.
- The route-first render also provides real screen coverage for the
  directional checkbox accessible checked state.

### Review Hardening: Route-Seeded Draft Baselines

Status: completed on 2026-07-05.

Implemented:

- Entry form dirty-state tracking now treats route-seeded staged relationships
  as baseline draft scaffolding instead of immediate user edits.
- Added staged-link comparison by staged id, endpoints, type, note, direction,
  and status so manually added, removed, or changed staged links still count as
  unsaved work.

Evaluation before implementation:

- Root cause: contextual Timeline create routes seeded an involved-record link,
  and the entry form reported every staged link as dirty. Moving from one
  contextual create route to another could therefore trigger a discard prompt
  before the user edited the draft.
- The best path was to compare staged links against the initial staged-link
  baseline rather than suppress all staged-link dirty tracking.

Re-evaluation after implementation:

- Browser smoke now verifies contextual Timeline route reseeding without a
  headless prompt hang.
- Manual staged-link edits remain protected because any staged-link delta from
  the baseline still reports as dirty.

### Completed Slice: Mobile Select Expanded State Accessibility

Status: completed on 2026-07-05.

What changed:

- The shared mobile `SelectField` trigger now exposes its expanded/collapsed
  state through the native accessibility state contract.
- Mobile render coverage now verifies the collapsed select state from the shared
  primitive, protecting Workbench, Timeline, Links, and More picker controls
  that compose it.

Evaluation before implementation:

- Mobile checkbox and action-button primitives already exposed checked,
  selected, and disabled state.
- Mobile select triggers had a hint that they opened choices, but did not
  expose whether the picker sheet was currently expanded.
- Because `SelectField` is shared across the mobile entry editor, filters,
  Relationship Studio controls, and Knowledge/More setup controls, fixing the
  primitive improves all common mobile workflows without per-screen drift.

Root cause and best path:

- Root cause: the mobile picker trigger was visually clear but did not publish
  open/closed state to assistive technology.
- The best path was a shared primitive fix because route-specific or
  screen-specific labels would leave the same state gap in other pickers.

Re-evaluation after implementation:

- Focused render coverage passes for the shared select trigger state.
- No browser change was needed because the web surfaces use native labeled
  selects and filter controls for these picker workflows.

### Completed Slice: Mobile Expandable Action State Accessibility

Status: completed on 2026-07-05.

What changed:

- The shared mobile `ActionButton` now accepts an `expanded` state and publishes
  it through the native accessibility state contract.
- Mobile expandable list controls now expose their expanded/collapsed state
  across Workbench, Timeline, Relationship Studio, Knowledge/More, and
  Workspaces.
- Focused render coverage verifies both collapsed and expanded action states
  from the shared primitive.

Evaluation before implementation:

- Previous slices made dense mobile lists expandable so users could inspect all
  hidden records, prompts, graph nodes, review rows, value rows, and workspace
  rows.
- Those controls visibly changed between "Show More" and "Show Fewer", but did
  not publish an expanded state.
- Because the controls all use the shared mobile action primitive, the issue was
  systemic and affected multiple workflow combinations.

Root cause and best path:

- Root cause: expandable list behavior had been added per workflow before the
  shared `ActionButton` exposed an expanded-state contract.
- The best path was to extend the primitive and pass existing `showAll` or row
  expansion state into the controls that actually reveal or collapse content.

Re-evaluation after implementation:

- Each expandable mobile workflow now communicates both its action label and its
  current state.
- Ordinary command buttons remain unchanged because `expanded` is only passed to
  controls that toggle hidden content.

### Completed Slice: Browser Expandable Action State Parity

Status: completed on 2026-07-05.

What changed:

- Browser expandable controls now expose `aria-expanded` for Knowledge value
  rows, Relationship Studio review queues, section legacy-text review,
  Workbench drafting prompts, and Workspaces management lists.
- The browser state model now matches the mobile expandable-action state slice:
  visible labels still change between "Show More/All" and "Show Fewer", and
  assistive technology also receives the current expanded/collapsed state.

Evaluation before implementation:

- The mobile expandable-state slice revealed the same root interaction pattern
  on browser: dense workflow lists could expand, but the web buttons only
  communicated state visually through label text.
- Browser users rely on these expansion controls while reviewing long Knowledge,
  Relationship, Workbench, and Workspace queues.
- This was still needed after the mobile fix because browser buttons are plain
  HTML controls rather than the shared mobile `ActionButton` primitive.

Root cause and best path:

- Root cause: expandable behavior had been added directly in each web page
  without an explicit ARIA state.
- The best path was a narrow page-level parity fix because these controls are
  local HTML buttons and already own the relevant `showAll` or row-expanded
  state.

Re-evaluation after implementation:

- A follow-up scan found every current browser "Show More", "Show All", and
  "Show Fewer" workflow toggle now has a matching `aria-expanded` value.
- No visual behavior, route behavior, persistence, or mobile behavior changed in
  this slice.

### Completed Slice: Mobile Action Selected State Precision

Status: completed on 2026-07-05.

What changed:

- The shared mobile `ActionButton` no longer defaults every ordinary command to
  `selected: false`.
- Explicitly selectable controls still publish selected and unselected state
  when callers pass `selected`.
- Focused render coverage now verifies ordinary action buttons omit selected
  state, while opt-in selectable actions expose both true and false values.

Evaluation before implementation:

- The previous expandable-action slice exposed that `ActionButton` always
  included `selected: false` because the prop defaulted to `false`.
- Ordinary commands such as Review Entry, Open, Delete, and Save are not members
  of selectable groups, so announcing "not selected" adds unnecessary state and
  makes dense mobile workflows noisier.
- Existing filter chips, mode switches, and picker targets already pass
  explicit `selected` values, so the primitive could be tightened without
  removing meaningful state from selectable controls.

Root cause and best path:

- Root cause: the shared mobile action primitive treated the absence of a
  selected prop as an explicit false selected state.
- The best path was to remove the default and let selection be opt-in at the
  call site.

Re-evaluation after implementation:

- Ordinary command buttons no longer publish selected state.
- Mode, filter, and picker buttons keep their selected/unselected state because
  their call sites pass `selected` explicitly.

### Completed Slice: Mobile Select Current Value Accessibility

Status: completed on 2026-07-05.

What changed:

- The shared mobile `SelectField` trigger now publishes the currently selected
  option through `accessibilityValue`.
- Focused mobile render coverage verifies a picker announces both collapsed
  state and selected value.

Evaluation before implementation:

- The mobile select expanded-state slice made the picker trigger's open/closed
  state available.
- Re-evaluation found the trigger still only exposed the field label, so users
  had to infer the current value from the visible child text or open the picker.
- Because `SelectField` powers editor status, sort, filter, graph, and
  relationship controls, this was a shared workflow-cost issue.

Root cause and best path:

- Root cause: the picker rendered the selected value visually but did not expose
  it as the control's current accessibility value.
- The best path was a shared primitive update using the already-computed
  selected option label.

Re-evaluation after implementation:

- Mobile picker triggers now communicate label, collapsed/expanded state, and
  current value before the user opens the choice sheet.
- No route, persistence, browser, or data-model behavior changed.

### Completed Slice: Mobile Action Disabled State Precision

Status: completed on 2026-07-05.

What changed:

- The shared mobile `ActionButton` now omits disabled state unless the button is
  actually disabled.
- Focused render coverage verifies ordinary actions do not publish disabled
  state, while disabled actions still announce disabled status.

Evaluation before implementation:

- The selected-state slice removed false selected state from ordinary commands.
- Re-evaluation found the same pattern remained for disabled state: the
  primitive always constructed an accessibility state object with
  `disabled: false`.
- Ordinary commands such as Review Entry, Open, Save, and Cancel should not add
  unnecessary state in dense mobile workflows.

Root cause and best path:

- Root cause: the shared mobile action primitive passed raw optional/defaulted
  state props directly into `accessibilityState`.
- The best path was to build the accessibility state object only from meaningful
  values: `disabled` when true, `expanded` when explicitly supplied, and
  `selected` when explicitly supplied.

Re-evaluation after implementation:

- Ordinary action buttons omit disabled state.
- Disabled buttons continue to expose disabled state through both the native
  disabled prop and accessibility state.
- Expandable and selectable controls retain the state coverage added in earlier
  slices.

### Completed Slice: Inline Relationship Target Expansion State

Status: completed on 2026-07-05.

What changed:

- Browser relationship-backed field controls now expose collapsed state on the
  inline buttons that reveal more preferred or unusual target records.
- Mobile relationship-backed field controls now pass collapsed state through the
  shared `ActionButton` for the same target-expansion actions.

Evaluation before implementation:

- Broader browser and mobile expandable-list slices covered Workbench,
  Timeline, Relationship Studio, Knowledge, and Workspaces lists.
- Re-evaluation found inline relationship-backed fields use a separate target
  expansion path inside entry editors.
- These controls are important in character/place workflows because users may
  need to reveal additional valid targets while linking homes, affiliations,
  origins, mentors, related lore, or involved records.

Root cause and best path:

- Root cause: inline relationship target expansion predated the shared
  expandable-action accessibility pass and lived in editor-specific rendering.
- The best path was a narrow browser/mobile wiring fix: publish collapsed state
  on the buttons that reveal hidden target options without changing the
  relationship field model.

Re-evaluation after implementation:

- Source scans now show the inline web target-expansion buttons carry
  `aria-expanded={false}`.
- Mobile target-expansion actions now use the same `expanded={false}` contract
  as other collapsed expandable controls.
- No relationship model, picker ordering, persistence, or route behavior changed.

### Completed Slice: Browser Data Menu Semantics

Status: completed on 2026-07-05.

What changed:

- The browser header Data Menu trigger now declares that it opens a menu.
- The opened Data Menu list now uses menu semantics, and each export/import
  action is marked as a menu item.
- Browser smoke coverage now verifies the trigger popup semantics, expanded
  state, menu role, menu item roles, action count, and horizontal fit.

Evaluation before implementation:

- The Data Menu is a utility workflow entry point that appears on every browser
  page and gives fast access to export/import actions.
- It already exposed expanded state and passed layout smoke checks, but it did
  not identify the popup as a menu or mark its actions as menu items.
- This was a low-risk browser-only gap because the menu is plain header HTML and
  does not affect mobile tabs or native More workflows.

Root cause and best path:

- Root cause: the header utility menu was implemented visually before its menu
  semantics were completed.
- The best path was a narrow markup update plus smoke assertions in the existing
  browser menu check.

Re-evaluation after implementation:

- The browser menu keeps the same layout, click behavior, export behavior, and
  import route.
- The menu now communicates trigger, opened-menu, and item semantics to
  assistive technology.

### Completed Slice: Browser Data Menu Keyboard Focus Flow

Status: completed on 2026-07-05.

What changed:

- Opening the browser Data Menu now moves focus to the first menu action.
- Pressing Escape while the menu is active closes it and restores focus to the
  Data Menu trigger.
- Browser smoke coverage now verifies first-item focus, Escape close behavior,
  restored trigger focus, and collapsed trigger state.

Evaluation before implementation:

- The Data Menu semantics slice gave the menu correct roles, but re-evaluation
  showed keyboard focus still needed an explicit workflow.
- Without focus management, keyboard users could open the menu but remain on the
  trigger instead of landing in the export/import actions, then need extra
  navigation to proceed.
- This was worth fixing because the Data Menu is available from every browser
  route and supports common backup/reference workflows.

Root cause and best path:

- Root cause: the header menu was state-driven but did not use refs to manage
  focus after opening or closing.
- The best path was a small browser-only focus loop: focus the first menu action
  when open, and restore focus to the trigger on Escape.

Re-evaluation after implementation:

- Browser smoke now exercises the full menu keyboard flow.
- Export/import behavior, routes, and layout are unchanged.

### Completed Slice: Browser Data Menu Keyboard Open Shortcut

Status: completed on 2026-07-05.

What changed:

- Pressing ArrowDown on the browser Data Menu trigger now opens the menu.
- The existing focus flow moves directly into the first export/import action
  after the keyboard-open shortcut.
- Browser smoke coverage now verifies ArrowDown opens the menu and focuses a
  menu item.

Evaluation before implementation:

- The focus-flow slice fixed what happens after the menu opens, but
  re-evaluation showed the trigger still only relied on default button
  activation keys.
- ArrowDown is a familiar menu-trigger shortcut and reduces keyboard interaction
  cost for a persistent header utility menu.
- The behavior could be added without changing pointer interaction, exports,
  imports, routes, or menu layout.

Root cause and best path:

- Root cause: the Data Menu trigger had popup semantics but no menu-specific
  keyboard-open shortcut.
- The best path was a narrow trigger `onKeyDown` handler that opens the menu on
  ArrowDown and lets the existing open-state focus effect move focus into the
  menu.

Re-evaluation after implementation:

- Browser smoke now covers click open, Escape close and focus restore, and
  ArrowDown open with item focus.
- No additional Data Menu behavior gap was found in this pass.

### Completed Slice: Browser Data Menu Item Keyboard Navigation

Status: completed on 2026-07-05.

What changed:

- Browser Data Menu items now support ArrowDown, ArrowUp, Home, and End focus
  movement while the menu is open.
- Browser smoke coverage verifies item-to-item movement, wraparound behavior,
  and first/last item jumps.

Evaluation before implementation:

- The keyboard-open shortcut made it easy to enter the menu, but re-evaluation
  showed focus inside the menu still depended on ordinary tab order.
- Export/import menu actions are a compact action group, so arrow-key movement
  better matches the menu semantics added in the prior slices.
- This improvement is scoped to the browser header utility menu and does not
  affect routes, exports, import navigation, or mobile More.

Root cause and best path:

- Root cause: the menu had roles and open/close focus management, but no item
  navigation handler.
- The best path was to keep focus on native button/link elements and add a small
  menu-list key handler for ArrowDown, ArrowUp, Home, and End.

Re-evaluation after implementation:

- Browser smoke now covers entering the menu, moving between actions, jumping to
  first/last actions, and closing back to the trigger.
- No additional menu navigation behavior gap was found for this current
  browser utility workflow.

### Completed Slice: Browser Data Menu Outside Dismissal

Status: completed on 2026-07-05.

What changed:

- The browser Data Menu now closes when the user clicks outside the trigger or
  menu list.
- Browser smoke coverage verifies outside-click dismissal and collapsed trigger
  state.

Evaluation before implementation:

- The prior Data Menu keyboard slices completed menu roles, open/close focus,
  ArrowDown entry, and item navigation.
- Re-evaluation found pointer users still had to choose an action, click the
  trigger again, or press Escape to dismiss the open menu.
- Outside-click dismissal is expected for a persistent header menu and reduces
  friction when users open the export/import actions accidentally.

Root cause and best path:

- Root cause: menu visibility was controlled only by trigger/action/Escape
  state changes.
- The best path was a document-level `pointerdown` listener that is registered
  only while the menu is open and ignores clicks inside the trigger or menu
  list.

Re-evaluation after implementation:

- Browser smoke now verifies click open, keyboard entry, keyboard navigation,
  Escape close, and outside-click close.
- Export/import actions and route behavior remain unchanged.

### Completed Slice: Browser Knowledge Destructive Action Dialogs

Status: completed on 2026-07-05.

What changed:

- Browser Knowledge custom type deletion, custom field removal, and hidden
  detail clearing now use the shared destructive-action dialog pattern.
- The dialog provides consistent destructive-action copy, dialog semantics,
  Escape cancellation, focus containment, and cancel/confirm actions.
- Native browser confirmation prompts were removed from these Knowledge schema
  workflows; the dirty-draft discard guard remains unchanged because it protects
  a different unsaved-edit workflow.

Evaluation before implementation:

- The Knowledge schema workflows had gained powerful setup and cleanup actions,
  but destructive confirmation still used native `window.confirm` prompts.
- Re-evaluation showed this was a browser-only interaction quality gap because
  mobile already uses platform alerts and other browser destructive actions had
  moved to explicit in-app dialogs.
- The improvement was still needed because deleting custom types, removing
  fields, and clearing hidden details are high-consequence schema actions where
  consistent copy, focus handling, and keyboard cancellation matter.

Root cause and best path:

- Root cause: Knowledge schema actions were implemented before the shared
  browser destructive-action dialog pattern was applied across newer flows.
- The best path was to keep each existing action handler and mutation unchanged,
  but replace the native confirmation branch with a typed pending destructive
  action rendered through the shared focus-managed dialog.

Re-evaluation after implementation:

- Custom type delete, custom field remove, and hidden-detail clear now share the
  browser destructive dialog behavior used by other high-consequence actions.
- The change is limited to confirmation presentation; Knowledge routing,
  draft validation, schema mutation behavior, and mobile alert behavior remain
  unchanged.
- No further browser Knowledge destructive-action parity gap was found in this
  pass.

### Completed Slice: Browser Knowledge Destructive Dialog Smoke Coverage

Status: completed on 2026-07-05.

What changed:

- Browser smoke coverage now opens a Knowledge custom-field remove action,
  verifies the in-app destructive dialog copy and modal semantics, confirms
  initial focus lands on Cancel, and verifies Escape closes the dialog.
- The smoke assertion also verifies focus returns to the remove-field trigger
  after dismissal.
- The check creates a temporary `Smoke Relics` custom entry type in the isolated
  smoke profile and cancels the remove-field action, so it covers the
  interaction without confirming a destructive mutation.

Evaluation before implementation:

- The previous slice removed native browser prompts from Knowledge destructive
  actions, but smoke coverage only verified that Knowledge routes rendered.
- Re-evaluation showed this left the highest-risk part of the slice untested:
  focus placement, modal semantics, Escape cancellation, and focus restoration.
- The coverage was still needed because future dialog refactors could silently
  regress destructive schema actions even when route text and screenshots still
  pass.

Root cause and best path:

- Root cause: browser smoke had targeted route, layout, menu, timeline, and
  relationship interactions, but no Knowledge destructive-action interaction.
- The best path was a narrow CDP smoke helper that opens the real seeded
  remove-field action, inspects the dialog, cancels with Escape, and avoids
  confirming the destructive mutation.

Re-evaluation after implementation:

- The smoke gate now exercises the browser Knowledge destructive dialog
  workflow directly.
- The assertion stays scoped to the UX contract rather than data mutation,
  keeping the check fast and deterministic.
- No additional Knowledge dialog coverage gap was found in this pass.

## Final Implementation Recommendation

The first milestone described above is now implemented for the current
prototype scope. Continue with targeted UX slices only when they remove observed
workflow friction or close a documented parity gap.

Current completed baseline includes:

- Browser Workbench compatibility route.
- Mobile Workbench modes that separate Index, Edit, and Context workflows.
- Shared relationship field, entity chip, picker, context, route intent,
  timeline, relationship studio, and knowledge/schema models in `@valgaron/core`.
- Inline saved-record relationship editing parity across browser and mobile.
- Draft transaction support for create-and-link before saving a new record.
- Dedicated Timeline surfaces for browser and mobile.
- Contextual Timeline create routes that seed and reseed era plus involved
  record links, with typed workflow context retained in shared route intents.
- Mobile tab accessibility labels aligned with the compact primary workflow
  labels.
- Mobile rendered accessibility-state coverage for parity-critical checkbox
  controls.
- Browser and mobile relationship route-focused first paint opens directly in
  Links mode.
- Relationship Studio review, graph, link creation, and bulk cleanup modes.
- Knowledge-owned custom entry types, user field management, vocabulary review,
  hidden-detail cleanup, and schema portability coverage.
- Utilities/More consolidation that keeps daily creative workflows primary.

Remaining larger follow-ups are deliberate product decisions: custom Timeline
event editor, durable v3 schema/vocabulary editing, Relationship/Timeline
review-tray consolidation, and further Utilities consolidation.

No remaining implementation gaps were found that require changing the core
direction. The next work should stay slice-based: evaluate whether a friction
point is still real, identify the root cause, make the smallest cohesive
platform-paired improvement, then re-evaluate with focused tests.
