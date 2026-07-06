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
- Replace obsolete section-heavy routes with canonical workflow routes because
  there are no live users or live data to preserve.
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

## Current Decision Gate Review

Date: 2026-07-06

Gate 1: Product surface agreement

- Decision: keep the workflow surface model.
- Browser remains Workbench, Timeline, Relationships, Knowledge, and Utilities.
- Mobile remains Workbench, Timeline, Links, and More.
- Outcome: no new page family is needed.

Gate 2: First release scope

- Decision: start durable schema and vocabulary editing next.
- The Workbench, relationship-backed fields, Timeline, Relationship Studio,
  Knowledge, Utilities, Help, and Data baseline is complete enough to support
  the next schema-owned workflow.
- Outcome: the next implementation work should begin with schema/vocabulary
  product modeling instead of additional broad IA consolidation.

Gate 3: Unsaved link strategy

- Decision: keep staged local draft graph behavior.
- Outcome: no auto-created shell records should be introduced.

Gate 4: Mobile navigation shape

- Decision: keep four tabs.
- Knowledge remains inside More until schema editing becomes a high-frequency
  workflow.
- Outcome: do not add a fifth mobile tab now.

Gate 5: Schema MVP boundary

- Decision: introduce schema `3` for durable schema and vocabulary settings.
- Schema `2` remains the current runtime shape until the implementation slice
  starts, but the next durable schema work is approved to create a cleaner
  document model for workspace-owned vocabularies, built-in field overrides,
  and reusable field definitions.
- Outcome: schema `3` should be designed before implementation touches storage,
  import/export, or Knowledge editing UI.

Gate 6: Compatibility and migration policy

- Decision: keep the clean-break policy.
- There are no live users and no live data to protect, so direct
  Characters/Places/Factions/Lore browser routes should not be preserved as
  compatibility surfaces.
- Outcome: canonical record workflows stay on `/entries?sectionId=...`; future
  schema changes may use clean-break storage/import behavior unless a later
  product decision introduces real compatibility requirements.

Gate 7: Acceptance evidence

- Decision: keep the existing evidence bar.
- Current route/navigation changes require format, typecheck, ESLint, Jest,
  Vite build, browser smoke, and route-intent/mobile-route coverage when
  affected.
- Outcome: no weaker evidence gate is accepted for cross-platform IA changes.

Future Gate 8: Durable schema evolution

- Decision: approved as the next product scope.
- Strategy: use schema `3`, a clean break, workspace-owned vocabularies, scoped
  built-in field configuration, Vocabulary Manager first, and focused mobile
  vocabulary editing.

Future Gate 9: Cross-surface triage queue

- Decision: not approved now.
- Trigger: approve only when users need assignment, dismissal, severity
  ordering, progress tracking, or a single queue spanning Workbench, Timeline,
  Relationship Studio, and Knowledge cleanup.

Future Gate 10: Further Utilities consolidation

- Decision: not approved now.
- Trigger: approve only after observed navigation friction shows Project Tools
  is not sufficient.

## Durable Schema And Vocabulary Decisions

Date: 2026-07-06

Gate 5: Schema version strategy

- Accepted option: introduce schema `3` for durable schema/vocabulary settings.
- Rationale: the selected next scope is durable schema editing, not just
  review-only Knowledge. A new schema gives the document an explicit home for
  workspace-owned vocabularies, built-in field overrides, and reusable field
  definitions instead of overloading existing v2 structures.
- Consequences: storage, import/export, diagnostics, fixtures, tests, and
  release docs must be updated as part of the schema implementation slice.

Gate 6: Schema compatibility policy

- Accepted option: clean break.
- Rationale: there are no live users and no live data, so schema `3` does not
  need to preserve v2 import compatibility as a product requirement.
- Consequences: implementation can replace the current document shape and
  storage key directly, while tests should focus on the active schema and
  invalid/unreadable fallback behavior.

Gate 7: Vocabulary ownership

- Accepted option: workspace-owned vocabularies.
- Rationale: ancestry, profession, place categories, lore categories, faction
  types, and similar values are world-specific. They should travel with the
  exported workspace/document instead of living in app-global settings.
- Consequences: vocabulary data belongs in the world document, is included in
  JSON export/import, and should be surfaced from Knowledge/More.

Gate 8: Built-in field edit scope

- Accepted option: allow label, help text, visibility, order, and vocabulary
  edits for built-in fields.
- Rationale: this gives users meaningful schema control without allowing full
  deletion or type mutation of core fields that existing editors depend on.
- Consequences: the first schema design needs field override records, stable
  field ids, hidden-field behavior, and clear hidden-value cleanup paths.

Gate 9: First implementation slice

- Accepted option: Vocabulary Manager first.
- Rationale: durable vocabularies immediately improve ancestry, profession,
  categories, lore definition types, and other repeated worldbuilding values.
  Field-configuration UI can build on the same schema foundation after the
  vocabulary model is stable.
- Consequences: the next slice should model vocabulary collections, wire them
  into Knowledge, use them in editors/autocomplete, and cover export/import.

Gate 10: Mobile schema editing scope

- Accepted option: focused mobile vocabulary editing, with deeper field
  configuration web-first.
- Rationale: mobile users should be able to add and maintain common values such
  as ancestry or profession, but dense field configuration is better handled on
  the browser first.
- Consequences: mobile More should support vocabulary list/value management,
  while built-in field order/visibility/help editing can initially be browser
  Knowledge only.

Gate 11: Vocabulary collection shape

- Accepted option: one flat workspace vocabulary registry.
- Rationale: reusable vocabularies such as ancestry, profession, place type,
  lore category, faction type, culture, material, or language should be defined
  once per workspace and attached to fields by id.
- Consequences: schema `3` needs vocabulary collection records and field-to-
  vocabulary mappings rather than nesting all values directly under fields.

Gate 12: Vocabulary value metadata

- Accepted option: label, description, aliases, status, and sort order.
- Rationale: durable values need enough metadata to support lightweight
  definitions, alternate search terms, cleanup/archive behavior, and stable
  manual ordering without turning every vocabulary value into a full codex
  record.
- Consequences: Vocabulary Manager must support editing at least labels and
  should make description, aliases, archive status, and ordering available in
  the first durable model.

Gate 13: Built-in field override storage

- Accepted option: sparse overrides by stable field key per entry type.
- Rationale: built-in fields should keep runtime defaults while schema `3`
  stores only intentional changes such as label, help text, visibility, order,
  and vocabulary attachment.
- Consequences: editor models must merge built-in defaults with workspace
  overrides at runtime, and tests must cover sparse override behavior.

Gate 14: Hidden built-in fields

- Accepted option: hide from editor only; keep saved values and expose cleanup
  in Knowledge.
- Rationale: hiding a field is an authoring-layout choice, not a destructive
  data cleanup action.
- Consequences: hidden built-in values should remain in exported data and should
  appear in hidden-detail cleanup until explicitly cleared.

Gate 15: First Vocabulary Manager UI

- Accepted option: Knowledge page Vocabulary Manager first.
- Rationale: Knowledge already owns schema understanding, vocabulary review,
  lore definition overview, and hidden-detail cleanup. A separate Settings page
  would add navigation surface area, while inline editor vocabulary management
  would clutter drafting.
- Consequences: the first schema `3` UI slice should add a Knowledge-managed
  vocabulary list with value add/edit/archive/reorder and field usage context.

Gate 16: Mobile vocabulary editing

- Accepted option: mobile More supports add/edit/archive vocabulary values,
  descriptions, aliases, and ordering.
- Rationale: mobile should support focused vocabulary maintenance while leaving
  deeper built-in field configuration web-first.
- Consequences: More needs a compact vocabulary editor with value metadata and
  ordering controls, but not the full browser field-configuration interface.

Gate 17: Seed vocabularies

- Accepted option: seed editable default vocabularies for built-in fields.
- Rationale: first-use schema editing should not start from empty setup screens.
  Neutral defaults for character ancestry, profession, place category, faction
  type, lore category, and similar fields give users immediate examples while
  remaining fully editable.
- Consequences: seed data must distinguish editable vocabulary defaults from
  hardcoded application constraints.

Gate 18: Observed values conversion

- Accepted option: show observed values as review candidates the user can
  accept into durable vocabularies.
- Rationale: existing entry values are useful signals, but automatically
  promoting them can preserve typos or one-off draft wording as durable schema.
- Consequences: Vocabulary Manager should include review candidate actions
  rather than silently mutating vocabularies during schema creation.

Gate 19: Vocabulary enforcement in editors

- Accepted option: per-field toggle for suggestion-only or restricted
  vocabulary behavior, with every field defaulting to suggestion-only.
- Rationale: creative drafting should stay fluid by default, while specific
  fields can become controlled when a world needs stricter consistency.
- Consequences: field overrides need an enforcement mode, editor validation
  must respect restricted fields, and tests should cover both modes.

Gate 20: Alias behavior

- Accepted option: aliases are search and match helpers only.
- Rationale: aliases should improve findability without changing saved entry
  values unexpectedly.
- Consequences: alias matching can inform search, suggestions, and future
  cleanup prompts, but saving a field should not auto-normalize to a canonical
  label in the first schema `3` slice.

Gate 21: Vocabulary value status

- Accepted option: active and archived only.
- Rationale: the first durable vocabulary model needs a lightweight way to
  remove values from suggestions without adding a separate review status
  workflow.
- Consequences: archived vocabulary values remain in historical entry values
  and exports, but should be hidden from default suggestions and available in
  management views.

Gate 22: Field configuration first scope

- Accepted option: browser-only field configuration for vocabulary attachment
  and visibility.
- Rationale: attaching vocabularies and hiding fields are the first structural
  controls needed to make the Vocabulary Manager useful. Label, help text, and
  ordering can follow once the attachment model is proven.
- Consequences: the first browser field configuration slice should avoid the
  full accepted override surface and focus on vocabulary selection plus
  visibility, with mobile remaining vocabulary-focused.

Gate 23: Schema `3` storage key

- Accepted option: use a new `valgaron.worldDocument.v3` storage key.
- Rationale: the schema `3` track is an intentional clean break, so the storage
  key should make stale local data and current runtime shape unambiguous.
- Consequences: old local v2 data will not load automatically as the active
  document. Recovery behavior must explain unsupported or unreadable storage
  rather than silently hiding it.

Gate 24: Schema `3` implementation order

- Accepted option: core schema first, then browser Knowledge, then mobile More,
  then editor integration.
- Rationale: schema, import/export, diagnostics, and fixtures are the source of
  truth. UI work should consume that model instead of inventing temporary
  screen-local schema state.
- Consequences: implementation should begin in `@valgaron/core` with typed
  models and tests before changing browser or mobile screens.

Gate 25: Editor integration timing

- Accepted option: persist Vocabulary Manager first; editor suggestions come in
  the second implementation slice.
- Rationale: the durable vocabulary model needs to be stable before every entry
  editor starts consuming it.
- Consequences: the first schema `3` slice may be more Knowledge/Data focused
  than drafting focused; editor autocomplete and restriction behavior follow
  after persistence and management are proven.

Gate 26: Restricted vocabulary validation timing

- Accepted option: implement restricted validation in the same slice as editor
  vocabulary suggestions.
- Rationale: storing an enforcement mode without honoring it creates a
  misleading schema control.
- Consequences: restricted validation should wait until editor suggestions land,
  then include user-facing validation copy, save blocking, and tests.

Gate 27: Release evidence for schema `3`

- Accepted option: require the full release evidence bar before considering
  schema `3` complete.
- Rationale: schema changes affect storage, import/export, diagnostics, web,
  mobile, and PWA behavior.
- Consequences: completion requires `npm run check:release`, mobile typecheck
  and tests, browser smoke, and focused schema/import/export coverage.

Gate 28: Rollback and recovery UX

- Accepted option: unreadable or wrong-schema local data should show recovery
  state and starter data with Data route guidance.
- Rationale: clean break should not mean silent data loss or a blocked app.
- Consequences: schema `3` storage failures and unsupported old storage should
  remain visible in recovery diagnostics, with clear export/import/reset
  guidance where applicable.

Gate 29: Vocabulary id strategy

- Accepted option: stable generated ids from the initial label slug plus a
  collision suffix.
- Rationale: exported schema should remain readable, while label renames should
  not break field attachments or entry references.
- Consequences: id generation must happen once when the vocabulary or value is
  created; renaming the label must not rename the id.

Gate 30: Vocabulary attachment defaults

- Accepted option: attach seeded vocabularies automatically to matching built-in
  fields.
- Rationale: schema `3` should improve first-use behavior immediately, not seed
  vocabulary collections that users must manually wire before they matter.
- Consequences: seed document creation must include default field override
  attachments for supported built-in fields.

Gate 31: Initial seed vocabulary scope

- Accepted option: include Characters, Places, Factions, Lore, and Timeline.
- Rationale: Timeline has become a primary workflow, so event authoring should
  benefit from durable vocabulary structure alongside the other world records.
- Consequences: the schema `3` seed model should define initial vocabulary
  collections and field attachments for all five built-in record families.

Gate 32: Duplicate vocabulary value labels

- Accepted option: prevent duplicate active labels within the same vocabulary.
- Rationale: duplicate active labels make suggestions, restricted validation,
  and cleanup ambiguous.
- Consequences: add/edit validation should compare normalized labels among
  active values in the same vocabulary.

Gate 33: Archived value reuse

- Accepted option: re-adding an archived label restores the archived value.
- Rationale: this avoids duplicate ids for the same conceptual value while
  keeping archive reversible.
- Consequences: add-value flows should detect archived label matches and offer
  or perform restore instead of creating a new value.

Gate 34: Sort order

- Accepted option: manual order first, alphabetical fallback.
- Rationale: creators often want curated value order that differs from
  alphabetical order, while fallback sorting keeps imported or unranked values
  predictable.
- Consequences: vocabulary values need an optional order field and UI controls
  for reordering.

Gate 35: Observed candidate source

- Accepted option: generate observed candidates from current workspace entries
  only.
- Rationale: workspace-owned vocabularies should reflect the active creative
  project instead of pulling unrelated values from other projects.
- Consequences: Knowledge candidate generation should use the active workspace,
  not the whole document.

Gate 36: Observed candidate actions

- Accepted option: accept, ignore, or merge into an existing value as an alias.
- Rationale: this supports cleanup without destructive entry rewrites or
  automatic normalization.
- Consequences: candidate state needs accepted/ignored handling, and merge
  should add the observed value as an alias on the selected vocabulary value.

Gate 37: Field visibility behavior

- Accepted option: hidden fields move to an expandable "Hidden values" detail
  block.
- Rationale: hidden fields should leave the main editor while still making
  retained data discoverable and clearable.
- Consequences: detail/read-only views should expose hidden values separately
  when they exist, and Knowledge cleanup should continue to list them.

Gate 38: Vocabulary Manager placement inside Knowledge

- Accepted option: replace the current vocabulary review with the Vocabulary
  Manager.
- Rationale: once durable vocabulary editing exists, passive vocabulary review
  should become part of the manager instead of a duplicate adjacent section.
- Consequences: the manager must preserve the useful review context that the
  current Knowledge vocabulary rows provide.

Gate 39: Mobile Vocabulary Manager depth

- Accepted option: mobile More edits values in a compact list/detail flow.
- Rationale: this supports value labels, descriptions, aliases, archive state,
  and ordering without cramming every action into dense inline rows.
- Consequences: mobile More should expose vocabulary selection, value list, and
  focused value editing, but not full built-in field configuration.

Gate 40: Import conflict policy

- Accepted option: full-document import replaces the document wholesale after
  validation, with a single warning when schema or vocabulary replacement impact
  needs to be called out.
- Rationale: full replacement matches the current local backup mental model and
  avoids merge complexity. A single warning is enough when the import will
  replace existing vocabularies and schema settings.
- Consequences: do not build per-vocabulary merge conflict UI for the schema
  `3` slice.

Gate 41: Markdown export of vocabularies

- Accepted option: include vocabularies in Markdown reference export.
- Rationale: durable world vocabularies are useful human reference material,
  not just machine-readable settings.
- Consequences: Markdown export should include vocabulary names, active values,
  descriptions, aliases where useful, and archived values only if the export
  mode explicitly includes archival/reference detail.

Gate 42: Diagnostics content safety

- Accepted option: diagnostics include vocabulary counts only, not labels,
  descriptions, or aliases.
- Rationale: vocabulary labels and descriptions can reveal world content.
- Consequences: diagnostics should report counts and structural status only.

Gate 43: First implementation boundary

- Accepted option: first slice covers core schema `3` document model, seed
  vocabularies, export/import, and diagnostics tests only.
- Rationale: this keeps the first implementation slice focused on the durable
  data foundation before browser, mobile, or editor UI consumes it.
- Consequences: the next code slice should not include Vocabulary Manager UI or
  editor suggestions until the schema `3` core model passes focused tests.

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
- Browser Workbench renders a "Manage Links" action next to the edit action for
  selected records.
- Later shared-copy slices renamed the edit action to `Edit Record` for
  browser/mobile consistency.

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
- Superseded by the later clean-break route slice: direct section editors and
  fallback routes are not retained for Characters, Places, Factions, or Lore.
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
- Superseded by the later clean-break route slice: Workbench quick-create is
  the canonical create workflow, and old section create URLs are not retained.
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
- This slice was later extended by shared Timeline editor grouping and existing
  relationship summaries, so the current custom-editor gap is closed for the
  prototype.

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
- No additional UI iteration was needed after validation. Later completed
  Timeline editor slices reused this route contract for grouped event editing,
  contextual involved-record links, and saved relationship summaries.

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
- At this point, rename and delete were intentionally deferred because they
  required explicit behavior for existing entry data and hidden-field cleanup.
  Later completed slices added label-only rename and non-destructive field
  removal with hidden-detail cleanup.

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
- Field deletion was deferred at this point because it needed explicit handling
  for saved values and hidden-field cleanup. The later non-destructive removal
  slice closed that gap for the current custom-field MVP.

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
- Browser Knowledge exposes a Clear All Hidden Details action in the Hidden Detail
  Cleanup panel.
- Mobile More exposes the same Clear All Hidden Details action in its hidden
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
- The cleanup panel keeps the destructive Clear All Hidden Details action visible
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

- `MobileCodexProvider` commits document changes to the installed app's local
  storage area after mutations.
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
- Keep route helpers aligned to the current product surfaces instead of
  preserving obsolete section-page paths.
- Keep every slice shippable and testable.
- Do not introduce backend, auth, sync, collaboration, or security claims.
- Keep English-only UI copy.
- Treat current local document import/export behavior as product-critical
  without carrying browser route compatibility for users or data that do not
  exist.
- Prefer simple typed objects and migrations over abstract plugin systems.
- Defer schema power until high-friction authoring workflows are improved.

## Shared Core Workstreams

### Route And Shell Model

Build in `@valgaron/core`:

- `workbench` route id.
- `knowledge` route id, possibly hidden behind utilities until implemented.
- `utilities` or route grouping model without necessarily changing physical
  URLs immediately.
- Canonical route helpers that send record browsing, editing, and creation to
  `/entries?sectionId=...`.
- Direct browser pages for Characters, Places, Factions, and Lore should not be
  retained as visible navigation items or compatibility routes.
- Timeline remains a dedicated route because chronology has distinct filters,
  ordering, era management, and involved-record workflows.

Tests:

- Route intent parsing.
- Web route order.
- Mobile tab route order.
- Canonical Workbench record, editor, and quick-create routes.

### Completed Slice: Remove Legacy Browser Section Pages

Evaluation before change:

- The browser still exposed Characters, Places, Factions, and Lore as direct
  top-nav pages and accepted `/:sectionId` catch-all routes.
- Internal Workbench editor links and Knowledge reusable-lore routes still
  emitted `/characters`, `/factions`, or `/lore?...` style paths.
- This was no longer needed because there are no live users, no live data, and
  no route migration burden. The root cause was earlier implementation slices
  preserving compatibility as a default engineering habit after the product
  direction had already moved to a centralized Workbench.

Best path:

- Remove direct section links from the desktop browser shell.
- Remove the generic browser `/:sectionId` route.
- Keep `/entries` as the canonical record browsing, editing, context, and
  quick-create route.
- Update shared route helpers, Workbench record links, Knowledge schema links,
  browser smoke checks, and documentation to use Workbench section filters.
- Keep Timeline as a dedicated route because it is a chronology workflow, not a
  generic record-section page.

Implementation completed:

- Browser top navigation now shows primary workflows only.
- Characters, Places, Factions, and Lore are reached through Workbench filters
  such as `/entries?sectionId=characters`.
- Workbench editor links now use `/entries?sectionId=...&entryId=...`.
- Workbench hydrates `/entries?sectionId=...&intent=new` quick-create links.
- Knowledge field, reusable-lore, and hidden-detail routes now resolve to
  Workbench.
- Browser smoke coverage now validates Workbench section and editor routes
  instead of proving the removed direct pages still work.

Re-evaluation:

- The duplicate browser page model is removed from navigation, route matching,
  internal links, tests, and documentation.
- Remaining `SectionPage` usage is limited to the Timeline implementation
  wrapper, where the page model still matches chronology-specific workflows.
- No live-user compatibility route remains for Characters, Places, Factions, or
  Lore.

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
- Add canonical workflow route tests.
- Add an initial web Workbench route shell.
- Add mobile Workbench tab or adapt Entries tab label/path behind shared route
  helpers.

Re-evaluation:

- Current canonical workflow routes and top-level navigation paths have
  coverage. Future route work should be driven by new product workflow needs,
  not foundation parity.

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
- Best path: Introduce three-pane Workbench and remove obsolete section-heavy
  routes.
- Current status: Complete for the current prototype. Browser Workbench has a
  real route, shared index, selected context, section actions, relationship
  actions, deep-link hydration, route-persisted saved views, inline selected
  record editing, and inline quick create.

Tasks:

- Build `WorkbenchPage`.
- Move section deep links into Workbench selection state.
- Render universal index, editor, and context inspector.
- Move legacy review into Review Tray.
- Remove old section routes instead of preserving redirects or wrappers.
- Update browser smoke tests and screenshots.

Re-evaluation:

- Current browser Workbench supports browsing, context review, quick creation,
  saved-record editing, relationship-backed field maintenance, and explicit
  handoff to Timeline, Relationship Studio, and Knowledge when those workflows
  are more specific than record editing. Future Workbench work should be scoped
  as visual polish, review-tray consolidation, or performance validation, not
  MVP workflow completion.

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

- Event creation, era assignment, ordering, review, involved records,
  chronology grouping, outcome grouping, contextual create-and-link, and
  existing relationship summaries are reachable from the Timeline workflow on
  both platforms. The shared entry editor is sufficient for the current
  prototype; richer controls such as date parsing or numeric order steppers
  should be evaluated separately against observed friction.

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

Completed tasks:

- Move custom entry type management from Workspaces into Knowledge.
- Add field management for custom entry types inside Knowledge/More.
- Add controlled-value and observed flexible-value review.
- Add lore definition type overview.
- Add field backing rules for Lore, Faction, Place, Character, and Timeline
  targets.
- Add import/export coverage for Knowledge-created custom type schemas.

Remaining product-decision tasks:

- Design v3 document schema for durable built-in field definitions only when
  the current `WorldDetailField` metadata is no longer sufficient.
- Add migration from v2 only when a v3 write path is introduced.
- Add editable controlled vocabularies only after the product decision is made
  to turn observed flexible values into durable workspace-owned lists.

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

### Completed Slice: Browser Workbench Dirty Route Guard

Status: completed on 2026-07-05.

What changed:

- Browser Workbench route hydration now checks whether an incoming route change
  would replace the selected inline editor while the current draft is dirty.
- If the route change would replace the editor target, the existing discard
  confirmation runs before applying the new `sectionId` or `entryId`.
- Query and view-only route updates still apply without confirmation because
  they do not discard the active draft.
- Browser smoke coverage now dirties a Workbench inline editor, simulates a
  route change, cancels the discard prompt, and verifies the dirty draft remains
  in place.

Evaluation before implementation:

- Re-review found the Workbench UI protected user-initiated section and record
  changes, but external URL/history changes were still applied directly.
- This was still needed because Workbench is now a primary drafting surface;
  losing an inline draft from a route update would violate the low-friction
  creative editing workflow.
- The issue was browser-specific because mobile route rehydration already uses
  the platform discard confirmation before replacing dirty editor state.

Root cause and best path:

- Root cause: the Workbench route synchronization effect treated URL state as
  authoritative and updated `sectionId` or `entryId` without checking the dirty
  inline editor state.
- The best path was a narrow route-state guard that only blocks
  editor-replacing route updates, keeping search and view changes lightweight.

Re-evaluation after implementation:

- Browser smoke now verifies canceled route replacement preserves the dirty
  Workbench draft.
- Existing Workbench selection, inline create, save, delete, and route-persisted
  view behavior remain unchanged.
- No further dirty-route replacement gap was found in this pass.

### Completed Slice: Timeline Editor Existing Relationship Summary

Status: completed on 2026-07-05.

What changed:

- The shared Timeline editor model now summarizes selected involved records from
  both canonical `involves` field relationships and broader saved relationships
  connected to an existing timeline event.
- Existing timeline events now show the same involved-record context that the
  Timeline browser already uses for filtering, review, and event summaries.
- New timeline drafts and staged create-and-link flows still use canonical
  `involves` relationships for newly selected involved records.

Evaluation before implementation:

- The custom Timeline editor had the right chronology and involved-record
  controls, but a focused test showed existing broader timeline relationships
  were not appearing in the editor's selected involved-record summary.
- The gap was still needed because users expect the editor, browse view, and
  review context to agree on which records are involved in an event.
- Changing seed relationship types would have broken Relationship Studio
  examples, so the fix needed to align the editor model rather than narrowing
  the world data.

Root cause and best path:

- Root cause: `getTimelineEventEditorModel` read selected records only through
  the `involves` relationship-field config, while the rest of Timeline treats
  any relationship connected to a timeline event as relevant event context.
- The best path was to union canonical involved-field links with the existing
  Timeline involved-entry index for saved events, then keep staged new links
  scoped to canonical `involves` relationships.

Re-evaluation after implementation:

- Focused Timeline model coverage now verifies the seeded Harbor Accord shows
  the Cartographers Guild in the editor selected-record summary.
- Full test and typecheck gates pass with the broader Timeline/Relationship
  relationship semantics intact.
- No additional editor/browser summary mismatch was found in this pass.

### Completed Slice: Timeline Editor Documentation Alignment

Status: completed on 2026-07-06.

What changed:

- README now describes Timeline event authoring as grouped chronology editing
  with relationship-backed involved records and existing relationship summaries.
- The user guide now explains that Timeline editing groups chronology, linked
  records, and outcomes, and that saved events summarize existing relationships
  connected to the event.
- Mobile README now names grouped event editing, relationship-backed involved
  records, existing relationship summaries, and contextual new-event drafts as
  part of the dedicated Timeline tab.
- Manual release and web/mobile parity QA now include Timeline chronology
  grouping, contextual event creation, involved-record links, and existing
  relationship summaries.
- Older UX plan wording that still framed a custom event editor as future work
  was updated to reflect the current shared-editor baseline.

Evaluation before implementation:

- The runtime and tests now support custom Timeline editor grouping, contextual
  creation, and broader saved relationship summaries, but public docs and QA
  checks still only described generic chronology browsing or contextual
  creation.
- The gap was still needed because future release checks should verify the same
  workflow behavior users see in browser and mobile, not only the older event
  list and Era Manager behavior.

Root cause and best path:

- Root cause: implementation slices had moved faster than the user-facing docs
  and release checklists, leaving the Timeline editor capabilities discoverable
  in-app but under-specified in durable project documentation.
- The best path was a documentation-only alignment slice because no runtime
  behavior, persistence shape, or shared model change was needed.

Re-evaluation after implementation:

- Timeline docs now consistently describe browsing, event editing, contextual
  creation, involved-record linked fields, and existing relationship summaries
  across browser and mobile.
- QA checklists now ask testers to exercise the editor-specific behavior that
  previously depended on source tests and smoke coverage alone.
- No further high-signal Timeline editor documentation mismatch was found in
  this pass.

### Completed Slice: Timeline Editor Help Alignment

Status: completed on 2026-07-06.

What changed:

- Shared focused Timeline Help now mentions grouped event editing and saved
  relationship summaries alongside explicit order, Era Manager reassignment,
  filters, and contextual new-event drafts.
- Shared workflow Help now points users to grouped event editing and saved
  relationship summaries when arranging events.
- Help topic tests now assert the new Timeline editor guidance so future Help
  copy changes do not regress the browser/mobile explanation.

Evaluation before implementation:

- The user guide and QA docs now described the Timeline editor behavior, but
  in-app Help still framed Timeline mostly as browsing, ordering, and filtered
  new-event drafting.
- The gap was still needed because Help is visible from both browser and mobile
  workflows and should match the current authoring surface, not lag behind the
  durable project docs.

Root cause and best path:

- Root cause: shared Help copy had been updated for Era Manager and contextual
  creation, but not for the later editor grouping and existing relationship
  summary slices.
- The best path was a small shared Help copy update in `@valgaron/core` because
  browser and mobile both consume the same Help model.

Re-evaluation after implementation:

- Browser and mobile Help now communicate the same Timeline workflow model as
  README, user guide, QA checklists, and runtime behavior.
- Focused Help tests cover grouped event editing and saved relationship
  summaries.
- No further Timeline Help mismatch was found in this pass.

### Completed Slice: Review Tray Follow-Up Reframing

Status: completed on 2026-07-06.

What changed:

- The final remaining-followups section now treats basic Relationship/Timeline
  review-tray consolidation as complete for the current prototype.
- The remaining review-related decision is reframed as selected-record
  Workbench review context or cross-surface aggregation, which matches the
  earlier shared Review Tray summary model re-evaluation.

Evaluation before implementation:

- The plan still listed Relationship/Timeline review-tray consolidation as a
  large remaining product decision, but the implemented baseline already has a
  shared Review Tray summary model consumed by Relationship Studio, browser
  Timeline, mobile Links, and mobile Timeline.
- Leaving the older phrasing would overstate the next slice and risk pushing a
  broad rewrite when the real remaining opportunity is narrower.

Root cause and best path:

- Root cause: the final recommendation was not updated after the shared Review
  Tray summary model shipped.
- The best path was to update the plan language only, because runtime summary
  consistency already exists and detailed domain-specific actions should remain
  in their current surfaces until a concrete aggregation workflow is needed.

Re-evaluation after implementation:

- The final implementation recommendation now distinguishes completed
  Relationship/Timeline summary consistency from still-open review aggregation
  decisions.
- No code or QA change was needed for this slice because it corrects planning
  scope rather than user-visible behavior.

### Completed Slice: Utilities Focused Help Destination

Status: completed on 2026-07-06.

What changed:

- The shared Utilities/More Help destination now opens focused Utilities Help
  instead of generic Help.
- Core destination tests now assert `/help?topic=utilities` for the Help
  destination.
- Mobile route adapter tests now verify focused Utilities Help routes preserve
  the `topic=utilities` parameter.

Evaluation before implementation:

- Utilities/More already had a Help destination, but it routed to generic Help
  even though the shared Help model includes a Utilities-focused topic.
- The gap was still needed because users opening Help from Project Tools are
  more likely trying to understand Utilities/More organization, Data,
  Workspaces, Knowledge, and local prototype limits than the whole Help index.

Root cause and best path:

- Root cause: the destination model was created before focused Help topics were
  fully aligned with Utilities/More, so the Help card kept the base `/help`
  path.
- The best path was a shared destination-model change because browser
  Utilities and mobile More both consume `getUtilitiesOverviewModel` and
  `utilityWorkflowDestinations`.

Re-evaluation after implementation:

- Browser and mobile now open directly to the Utilities-focused Help topic from
  the Project Tools Help destination.
- The route remains portable across web and mobile because it uses the existing
  shared Help route and mobile route adapter.
- Focused validation caught and removed a Help/Utilities circular import, so
  the final implementation uses the stable Help route string from the shared
  shell route instead of importing the Help module.
- No further route, persistence, or UI component change was needed for this
  slice.

### Completed Slice: Utilities Focused Help Route Coverage

Status: completed on 2026-07-06.

What changed:

- Shared workflow route samples now include focused Utilities Help:
  `/help?topic=utilities`.
- Route-intent tests now verify the focused Utilities Help route classifies as
  a Help workflow with `topic: "utilities"`.
- Mobile route adapter sample coverage now exercises the same focused Help
  route through the existing `codexWorkflowRouteSamples` loop.

Evaluation before implementation:

- The Utilities Help destination now depends on focused Utilities Help, but the
  shared workflow route samples still only exercised Timeline-focused Help.
- The gap was still needed because route samples are used as a compact parity
  net for browser/mobile route adaptation, and focused Help routes are part of
  the cross-platform navigation contract.

Root cause and best path:

- Root cause: the destination change introduced a new route dependency without
  adding it to the shared route sample set.
- The best path was to add the focused Utilities Help route to
  `codexWorkflowRouteSamples` and assert direct workflow classification rather
  than create separate browser or mobile navigation logic.

Re-evaluation after implementation:

- Focused Utilities Help is now covered by shared route-intent classification
  and mobile route adaptation sample coverage.
- No runtime behavior change was needed; this slice hardens the route contract
  for the previous Utilities destination slice.

### Completed Slice: Focused Help Documentation Alignment

Status: completed on 2026-07-06.

What changed:

- README now lists Knowledge and Utilities alongside entry, timeline,
  relationship, workspace, and data workflows as focused Help link sources.

Evaluation before implementation:

- Runtime Help and route coverage now support Knowledge and Utilities-focused
  Help, but the README still described only the older focused Help sources.
- The gap was still needed because README is the public feature summary and
  should not understate the current browser/mobile guidance model.

Root cause and best path:

- Root cause: focused Help expanded incrementally across Knowledge and
  Utilities slices, but the top-level documentation sentence was not updated
  with those newer surfaces.
- The best path was a single README alignment edit; no runtime or QA workflow
  needed to change.

Re-evaluation after implementation:

- README, user guide, shared Help copy, and route tests now agree that
  Knowledge and Utilities participate in focused Help.
- No further focused Help documentation mismatch was found in this pass.

### Completed Slice: Selected Workbench Review Summary

Status: completed on 2026-07-06.

What changed:

- The shared Workbench selected-record context now includes a Review Tray
  summary for record-specific drafting prompts and legacy relationship-backed
  text.
- Browser Workbench selected context renders the summary as compact review
  cards before the detailed drafting prompt list.
- Mobile Workbench Context mode renders the same summary text before detailed
  prompts and relationship context.
- Core Workbench model tests, mobile render tests, and browser smoke route
  expectations now cover the selected-record review summary.
- A re-evaluation pass added an optional selected-entry filter to the legacy
  relationship text review helper, so Workbench context can count only the
  selected record instead of scanning unresolved text for the whole workspace.

Evaluation before implementation:

- Workbench already showed selected-record relationship count, completeness,
  and drafting prompts, but the review signal was split across plain fields and
  deeper Context or Relationship Studio workflows.
- The gap was still needed because the remaining review-consolidation follow-up
  called out selected-record Workbench context as the narrow next opportunity,
  while broad cross-surface aggregation remains a larger product decision.

Root cause and best path:

- Root cause: Workbench selected context had useful underlying signals but did
  not package them with the shared Review Tray model used by Timeline and
  Relationship Studio.
- The best path was to centralize only selected-record prompt and legacy-link
  counts in the shared Workbench model, then render them in the existing
  browser/mobile context blocks without adding a new dashboard or route.

Re-evaluation after implementation:

- Selected Workbench context now gives users an immediate record-specific
  review summary before they decide whether to edit the record or manage links.
- The implementation reuses existing Review Tray semantics and keeps detailed
  actions in the established drafting prompt and relationship text review
  workflows.
- Focused helper coverage now verifies selected-entry legacy text review counts
  can be scoped without changing existing full-workspace callers.
- Cross-surface review aggregation remains intentionally out of scope until a
  concrete workflow requires it.

### Completed Slice: Workbench Review Summary Documentation Alignment

Status: completed on 2026-07-06.

What changed:

- README, mobile README, user guide, and QA checklists now describe
  selected-record Workbench review summaries.
- Shared workflow Help now tells users to check selected-record review
  summaries before editing or managing links.
- Help topic tests now protect the selected-record review summary guidance.

Evaluation before implementation:

- Browser and mobile Workbench now show selected-record review summaries, but
  durable docs and shared Help still described Workbench primarily as prompts,
  context, and section totals.
- The gap was still needed because Workbench is the primary daily drafting
  surface and users should understand that review signals are available before
  opening editor or link-management workflows.

Root cause and best path:

- Root cause: the Workbench review summary slice changed the selected context
  behavior after the existing Workbench documentation had already stabilized.
- The best path was a documentation and shared Help copy alignment slice; the
  runtime model and renderers were already updated.

Re-evaluation after implementation:

- README, user guide, mobile README, QA checklists, shared Help, and runtime
  Workbench behavior now describe the same selected-record review summary
  workflow.
- No additional Workbench review-summary documentation gap was found in this
  pass.

### Completed Slice: Utilities Top-Level Tool Shortcuts

Status: completed on 2026-07-06.

What changed:

- The shared Utilities overview model now exposes a Tool Shortcuts summary for
  Data, Workspaces, and focused Utilities Help.
- Browser Utilities renders those shortcuts in the Project Tools overview
  alongside the Knowledge schema summary.
- Mobile More renders the same shortcuts at the top of Project Tools before the
  longer inline Knowledge setup sections.
- Core destination tests, mobile render coverage, and browser smoke
  expectations now verify the shortcuts.

Evaluation before implementation:

- Utilities/More had destination cards for Data, Workspaces, and Help, but on
  mobile those cards appeared after the long Knowledge setup, vocabulary,
  cleanup, reusable knowledge, and lore definition sections.
- The gap was still needed because Project Tools is meant to consolidate
  secondary workflows; requiring mobile users to scroll through the full
  Knowledge setup area to reach backup or Help actions undercut that goal.

Root cause and best path:

- Root cause: the top Project Tools summary had become Knowledge-heavy as
  schema ownership moved into More, while the other secondary tools remained
  available only as lower destination cards.
- The best path was a shared shortcut summary that promotes Data, Workspaces,
  and Help without duplicating Knowledge Setup, because Knowledge already has
  the primary schema summary and setup actions in the same block.

Re-evaluation after implementation:

- Browser and mobile now expose backup, workspace, and focused Help shortcuts
  from the first Project Tools block.
- Detailed destination cards remain available lower on the page for users who
  scroll, preserving focused route targets and existing destination structure.
- No schema, persistence, or navigation-route change was needed for this slice.

### Completed Slice: Utilities Shortcut Documentation Alignment

Status: completed on 2026-07-06.

What changed:

- The user guide now describes Project Tools shortcuts for Data, Workspaces,
  and focused Help.
- Mobile README now describes top-level tool shortcuts inside More.
- Focused Utilities Help and shared workflow Help now mention the top-level
  Data, Workspaces, and Help shortcuts.
- Help topic tests now guard the shortcut guidance.

Evaluation before implementation:

- Runtime Utilities/More now exposed top-level tool shortcuts, but Help and
  durable docs still described Utilities primarily as a container for secondary
  destinations.
- The gap was still needed because the shortcut row exists specifically to
  reduce mobile scroll cost; users need the Help and guide language to match
  the new interaction model.

Root cause and best path:

- Root cause: the shortcut runtime slice changed the first Project Tools block
  after Utilities documentation had already been aligned around destination
  cards.
- The best path was a small documentation and shared Help copy update; no
  routing or component behavior needed further changes.

Re-evaluation after implementation:

- Runtime Project Tools, mobile README, user guide, focused Utilities Help, and
  shared workflow Help now all describe top-level tool shortcuts.
- No further Utilities shortcut documentation mismatch was found in this pass.

### Completed Slice: Mobile Workbench Context Copy Alignment

Status: completed on 2026-07-06.

What changed:

- Shared mobile Workbench Context mode copy now names selected-record review
  summaries instead of generic selected-record context.
- Layout-mode tests now guard the updated Context mode detail.
- Mobile render coverage now verifies the updated guidance appears on a direct
  character Context route.

Evaluation before implementation:

- Browser and mobile Workbench now expose selected-record review summaries, and
  durable docs describe them, but the mobile mode switcher still described
  Context mode as generic selected-record context.
- The gap was still needed because mobile users rely on the mode summary to
  understand why Context is distinct from Edit and Index.

Root cause and best path:

- Root cause: Context mode copy was created before selected-record review
  summaries were added to the shared Workbench context model.
- The best path was a shared layout-mode copy update, because the mobile
  Workbench and Timeline mode framework already centralizes this language.

Re-evaluation after implementation:

- Mobile Context mode guidance now matches the selected-record review summary
  behavior.
- No additional renderer, route, or model change was needed for this slice.

### Completed Slice: Utilities Follow-Up Reframing

Status: completed on 2026-07-06.

What changed:

- The final recommendation no longer lists further Utilities consolidation as a
  known remaining gap.
- Additional Utilities consolidation is now framed as evidence-driven work that
  should wait for observed navigation friction.

Evaluation before implementation:

- The plan still listed further Utilities consolidation as a remaining larger
  follow-up after the Project Tools hub gained top-level Data, Workspaces, and
  focused Help shortcuts.
- The gap was still worth reviewing because leaving Utilities in the remaining
  list would imply more known work even though the current browser and mobile
  hub now exposes all secondary destinations from the first Project Tools
  block.

Root cause and best path:

- Root cause: the final recommendation had not been updated after the
  top-level shortcut slice resolved the concrete Utilities navigation friction.
- The best path was a planning-language update only; no runtime change was
  needed after the shortcut implementation and documentation alignment.

Re-evaluation after implementation:

- Remaining follow-ups now distinguish true product decisions from completed
  Utilities consolidation.
- Future Utilities work remains allowed, but only when a new observed
  navigation friction point appears.

### Completed Slice: Schema V3 Decision Guard

Status: completed on 2026-07-06.

What changed:

- Phase 9 now separates completed Knowledge MVP tasks from remaining
  product-decision tasks for durable schema work.
- Schema migration documentation now states that review-only Knowledge behavior
  should not introduce schema `3`.
- The v3 gate is now tied to concrete durable document needs such as
  workspace-owned editable vocabularies or built-in field definitions that no
  longer fit current `WorldDetailField` metadata.

Evaluation before implementation:

- Knowledge already owns custom entry type management, custom field management,
  vocabulary review, lore definition overview, field backing rules, cleanup,
  and portability coverage, but the Phase 9 task list still mixed completed MVP
  work with future v3 decisions.
- The gap was still needed because an unclear task list could push a schema
  migration before there is a durable data requirement.

Root cause and best path:

- Root cause: implementation slices completed most Knowledge MVP tasks without
  revising the original Phase 9 task list or release schema guidance.
- The best path was a planning and release-doc guard, not a runtime schema
  change, because the current schema still supports the implemented MVP.

Re-evaluation after implementation:

- The plan now clearly says v3 is only for future durable document data, not
  current Knowledge review surfaces.
- Release schema docs now give the same gate for future maintainers.
- No source schema, parser, import/export, or storage-key change was needed.

### Completed Slice: Cross-Surface Review Aggregation Guard

Status: completed on 2026-07-06.

What changed:

- The final recommendation now treats cross-surface review aggregation as a
  product decision that needs observed workflow evidence before implementation.
- The plan clarifies that the current prototype already has review summaries in
  the right local workflow surfaces: Workbench selected context, Timeline
  Review, and Relationship Studio Review.
- Future aggregation is scoped to a unified triage queue only if users need to
  compare or resolve review work across surfaces from one place.

Evaluation before implementation:

- Workbench, Timeline, and Relationship Studio now all use shared review
  summary semantics, but a global review dashboard would add another navigation
  surface and force unresolved prioritization rules.
- The gap was still worth reviewing because the remaining follow-up said
  "cross-surface review aggregation" without naming the trigger for when that
  extra surface becomes worth the interaction cost.

Root cause and best path:

- Root cause: review-summary consolidation happened in focused workflow
  surfaces, while the original plan still left aggregation as a broad remaining
  phrase.
- The best path was to record the aggregation decision gate: keep review work
  local until users need unified cross-surface triage, then design that queue
  from observed review paths rather than from implementation convenience.

Re-evaluation after implementation:

- The plan now preserves the current low-friction local review model and avoids
  adding a speculative global review surface.
- Cross-surface aggregation remains available as future work, but it has a
  concrete trigger and scope.
- No runtime change was needed because current review summaries already cover
  the active Workbench, Timeline, and Relationship Studio workflows.

### Completed Slice: Release Gate Decision Guard Alignment

Status: completed on 2026-07-06.

What changed:

- Versioning docs now repeat the schema guard: do not advance the saved
  document schema for review-only Knowledge behavior.
- Manual release checks now require schema, Knowledge vocabulary editing, and
  review aggregation changes to confirm the UX plan, versioning docs, and
  schema migration docs still describe the intended decision gate.
- Web/mobile parity checks now require documented product decisions for schema
  version changes and cross-surface review aggregation.

Evaluation before implementation:

- The UX plan and schema migration doc already captured the v3 and review
  aggregation guards, but release reviewers could still miss those decisions
  because the QA checklists did not reference them.
- The gap was still needed because future work in schema or review surfaces is
  high-blast-radius: it can affect persistence, import/export, route surfaces,
  and user workflow expectations.

Root cause and best path:

- Root cause: the decision guards were added after the release and parity
  checklists had already stabilized around general validation gates.
- The best path was to align release documentation rather than add runtime code;
  the current implementation already follows the guarded behavior.

Re-evaluation after implementation:

- Product-decision guards now appear in the plan, schema migration docs,
  versioning docs, manual release checks, and web/mobile parity checks.
- Future schema or cross-surface review work has an explicit review checkpoint
  before implementation can be considered complete.
- No source, schema, route, or UI change was needed for this slice.

### Completed Slice: Release Operations Schema Guard Alignment

Status: completed on 2026-07-06.

What changed:

- The release operations playbook now says to confirm that a change actually
  needs a new saved-document shape before treating it as migration work.
- `docs/release/versioning-and-maintenance.md` now repeats the same schema
  guard as the versioning and schema migration docs: review-only Knowledge
  behavior, vocabulary inspection, and local review summaries should not
  advance the schema version.
- Future schema `3` or later work is tied to documented product decisions for
  durable document data, such as workspace-owned editable vocabularies or
  built-in field definitions that no longer fit current field metadata.

Evaluation before implementation:

- The prior release checklist and schema migration docs carried the decision
  gate, but the operational release playbook still framed schema impact as a
  migration-review step without naming the no-migration case.
- The gap was still needed because release operators are likely to start from
  the operations playbook during version updates, not from the deeper schema
  migration note.

Root cause and best path:

- Root cause: the schema guard was added to product and QA documents after the
  release operations playbook had already defined its general schema review
  language.
- The best path was documentation alignment, not source work, because the
  runtime schema remains unchanged and already supports the completed Knowledge
  MVP.

Re-evaluation after implementation:

- The product plan, versioning policy, schema migration guide, release
  operations playbook, manual release checklist, and parity checklist now use
  the same schema decision boundary.
- No parser, storage-key, import/export, route, or UI work was needed.

### Completed Slice: Support Diagnostics-First Alignment

Status: completed on 2026-07-06.

What changed:

- The support guide now asks users to download Diagnostics before exporting a
  full-document JSON backup when reporting storage, import/export, routing, or
  rendering issues.
- The guide still recommends exporting a full JSON backup for the user's own
  recovery records when the app opens, but explicitly says not to share it by
  default.

Evaluation before implementation:

- `docs/release/versioning-and-maintenance.md` already said support starts with
  diagnostics, not world backups, while `docs/support.md` listed full-document
  JSON export first.
- The gap was worth fixing because support copy affects privacy expectations
  and issue-reporting friction even though the prototype is local-only.

Root cause and best path:

- Root cause: support recovery advice and support reporting advice had been
  combined in one ordered list, making private backup creation appear like the
  first reporting artifact.
- The best path was to reorder and clarify the instructions so diagnostics are
  the default support artifact while private backups remain part of data
  recovery hygiene.

Re-evaluation after implementation:

- Support guidance now matches the release operations support policy and the
  local-only privacy model.
- No application behavior change was needed because Data already exposes both
  Diagnostics and full-document JSON export.

### Completed Slice: Privacy Mobile Surface Alignment

Status: completed on 2026-07-06.

What changed:

- `PRIVACY.md` now describes Valgaron as a local-only web app with a native
  mobile companion instead of a browser-only app.
- The storage explanation now covers both browser `localStorage` and the
  mobile companion's installed-app local storage area.
- The local data risk list now includes uninstalling the mobile app alongside
  browser data clearing, private browsing, browser profile switching, device
  loss, storage quota limits, and local storage corruption.
- The README documentation index now describes `PRIVACY.md` as covering local
  web and mobile storage.

Evaluation before implementation:

- The main README, user guide, support docs, and security/privacy notes already
  describe both web and mobile local storage, but the top-level privacy note
  still only named browser storage.
- The gap was still needed because the current UX direction treats web and
  mobile as equal first-class surfaces, and privacy expectations must be
  consistent across both.

Root cause and best path:

- Root cause: `PRIVACY.md` predated the mobile companion work and had not been
  revisited during the later mobile parity slices.
- The best path was a narrow privacy-copy update; no runtime behavior needed
  to change because both platforms already store data locally and expose JSON
  export.

Re-evaluation after implementation:

- Privacy, support, security/privacy, README, and user-guide copy now all
  describe the same local-only web and mobile storage model.
- No source, storage, schema, or UI change was needed.

### Completed Slice: README Mobile Scope Alignment

Status: completed on 2026-07-06.

What changed:

- README product-scope copy no longer says the phase excludes a high-rigor
  native parity program.
- The same scope sentence now preserves the no-account, no-backend, no-sync,
  no-collaboration, no-sharing, no-social, and no-messaging boundaries while
  explicitly saying web and mobile are local prototype surfaces with shared
  models and paired workflow checks.

Evaluation before implementation:

- The README already described the Expo companion, mobile tabs, mobile tests,
  parity checklist, and local web/mobile storage model, but its exclusion list
  still included native parity.
- The gap was still needed because the current UX plan and implementation treat
  mobile as an equal paired surface for workflows, even though the product
  remains local-only and web-first in architecture.

Root cause and best path:

- Root cause: old prototype-scope copy was not updated after the mobile
  companion and web/mobile parity workflow became part of the active baseline.
- The best path was a single README wording change, not a runtime or QA change,
  because parity checks and mobile tests already exist and the product boundary
  still excludes hosted sync or collaboration.

Re-evaluation after implementation:

- README now distinguishes local paired web/mobile workflow quality from
  hosted multi-device or account-backed product scope.
- The scope copy no longer conflicts with mobile README, privacy, user guide,
  or the web/mobile parity checklist.
- No source, route, schema, or UI change was needed.

### Completed Slice: Mobile Storage-Risk Help Alignment

Status: completed on 2026-07-06.

What changed:

- Shared Help now tells users to export before uninstalling the mobile app,
  alongside browser data clearing, browser switching, private browsing, and
  device changes.
- Shared offline Help now names mobile app uninstall as a data-loss risk that
  offline or installable app behavior does not protect against.
- README and the user guide now include mobile app uninstall in their backup
  and offline/storage-risk guidance.
- Core Help tests and mobile Help render coverage now guard the mobile
  app-uninstall guidance.

Evaluation before implementation:

- Privacy copy already listed uninstalling the mobile app as a local data risk,
  but in-app Help, README backup guidance, and user guide offline guidance did
  not.
- The gap was still needed because Help is a live workflow surface on both web
  and mobile, and storage-risk copy directly affects whether users protect
  creative work before high-risk local actions.

Root cause and best path:

- Root cause: privacy documentation was updated after the shared Help and
  backup docs had already stabilized around browser-profile and device-change
  risks.
- The best path was to update the shared Help source of truth first, then align
  durable docs and focused tests rather than duplicate platform-specific Help
  copy.

Re-evaluation after implementation:

- In-app Help, README, user guide, Privacy, support, and security/privacy copy
  now describe the same local web/mobile storage risk model.
- Mobile Help render coverage verifies the guidance appears in the native Help
  surface.
- No storage behavior, schema, route, or UI layout change was needed.

### Completed Slice: Data Storage-Risk Copy Alignment

Status: completed on 2026-07-06.

What changed:

- Shared Data storage guidance now uses the same backup-risk set as Help and
  docs: clearing browser data, switching browsers, using private browsing,
  uninstalling the mobile app, and changing devices.
- Data feature model coverage now guards the expanded manual-save guidance.

Evaluation before implementation:

- The previous slice aligned Help, README, user guide, and Privacy, but the
  web Data route still rendered older manual-save guidance that omitted private
  browsing and mobile app uninstall.
- The gap was still needed because Data is the highest-intent backup surface;
  stale copy there would undercut the storage-risk guidance users see in Help.

Root cause and best path:

- Root cause: Data storage copy lives in the shared Data feature model rather
  than the Help model, so the prior Help-focused change did not update it.
- The best path was a copy-only shared model update with focused model
  coverage; mobile Data does not render the web manual-save sentence, so no
  mobile layout change was needed.

Re-evaluation after implementation:

- Data, Help, README, user guide, Privacy, support, and security/privacy copy
  now use a consistent local storage risk model.
- No persistence behavior, route, schema, or layout change was needed.

### Completed Slice: Overview Storage-Risk Copy Alignment

Status: completed on 2026-07-06.

What changed:

- The shared Overview local data notice now uses the same backup-risk set as
  Help and Data: clearing browser data, switching browsers, using private
  browsing, uninstalling the mobile app, and changing devices.
- Overview model coverage now guards the expanded local data notice.

Evaluation before implementation:

- Help, Data, README, user guide, and Privacy had been aligned around the
  current web/mobile storage-risk model, but the Overview first-screen local
  data notice still only mentioned clearing browser data or changing devices.
- The gap was still needed because Overview is a high-visibility entry point
  and can be the first place a user learns that local storage is not durable.

Root cause and best path:

- Root cause: the Overview notice has its own shared feature copy and was not
  covered by the prior Help/Data storage-risk slices.
- The best path was a narrow shared-copy update with focused model coverage;
  the notice still accurately uses browser-specific save wording because the
  header Save button is a web behavior.

Re-evaluation after implementation:

- Overview, Data, Help, README, user guide, Privacy, support, and
  security/privacy copy now use the same local storage risk model.
- No persistence behavior, route, schema, or UI layout change was needed.

### Completed Slice: Storage-Risk Documentation Completion

Status: completed on 2026-07-06.

What changed:

- README backup guidance now includes private browsing in the same risk set as
  Data, Help, and Overview.
- `PRIVACY.md` now says recovery snapshots stay in the same browser profile or
  mobile app storage area, and can be removed when browser data is cleared or
  the mobile app is uninstalled.
- Support recovery triage now asks whether the mobile app install/storage area
  changed and tells users to look for downloaded JSON backups outside the
  browser or mobile app.

Evaluation before implementation:

- The runtime copy had been aligned, but durable documentation still had three
  smaller mismatches: README omitted private browsing in the backup-risk
  sentence, Privacy described recovery snapshots as browser-only, and support
  triage did not explicitly ask about mobile app storage changes.
- The gap was still needed because backup, privacy, and support guidance are
  where users make recovery decisions after local storage loss.

Root cause and best path:

- Root cause: storage-risk alignment happened incrementally across Help, Data,
  Overview, and Privacy, leaving adjacent durable docs with partial versions of
  the same local storage model.
- The best path was a documentation-only correction because the runtime storage
  model and recovery snapshot behavior already match the intended local-only
  architecture.

Re-evaluation after implementation:

- Durable backup, privacy, support, user-guide, Help, Data, and Overview copy
  now agree on browser profile, mobile app storage, private browsing, app
  uninstall, device, quota, and local-corruption risks.
- No source behavior, schema, route, or UI layout change was needed.

### Completed Slice: Mobile README Storage-Risk Alignment

Status: completed on 2026-07-06.

What changed:

- Mobile README now tells developers and testers that uninstalling the app can
  remove local data.
- The same bullet points users toward JSON export as the portable backup path.

Evaluation before implementation:

- User-facing Help, README, user guide, Privacy, support, Data, and Overview
  now describe mobile app uninstall as a local data risk, but the mobile
  workspace README still only said the document is stored on the current
  device.
- The gap was still needed because mobile setup and QA readers often start
  from `mobile/README.md`, especially when testing local device behavior.

Root cause and best path:

- Root cause: mobile README predated the detailed storage-risk alignment and
  summarized only the positive local-storage behavior.
- The best path was a single mobile README bullet rather than duplicating the
  full privacy policy; detailed recovery and support guidance remains in the
  shared docs.

Re-evaluation after implementation:

- Mobile README now matches the local-only storage expectation documented in
  Help, Data, Overview, README, user guide, Privacy, and support docs.
- No source behavior, route, schema, or UI layout change was needed.

### Completed Slice: Security And Deployment Storage-Risk Alignment

Status: completed on 2026-07-06.

What changed:

- Security/privacy notes now explain that browser data can be removed by
  browser data cleanup, private browsing cleanup, browser profile removal, or
  storage failures.
- Security/privacy notes now explain that mobile app data can be removed by
  app uninstall, device loss, or storage failures.
- Static-hosting deployment docs now describe PWA offline support as app-shell
  availability only and clarify that it does not protect against
  browser-profile deletion, private browsing cleanup, or browser storage
  failures.

Evaluation before implementation:

- User-facing backup, Help, Data, Overview, Privacy, support, and mobile README
  copy had converged on the current local storage risk model, but
  security/privacy and deployment docs still used narrower storage-risk
  wording.
- The gap was still needed because these docs define what the project may
  safely claim during release and deployment reviews.

Root cause and best path:

- Root cause: storage-risk alignment moved through product surfaces first,
  while security and deployment docs still carried earlier browser-centered
  phrasing.
- The best path was a documentation-only alignment because runtime storage
  behavior, diagnostics, export/import, and recovery snapshots already match
  the local-only product boundary.

Re-evaluation after implementation:

- Security/privacy, deployment, Help, Data, Overview, README, user guide,
  Privacy, support, and mobile README now use compatible storage-risk claims.
- No source behavior, route, schema, or UI layout change was needed.

### Completed Slice: Active Backup Storage-Scope Copy Alignment

Status: completed on 2026-07-06.

What changed:

- The shared Active Workspace JSON export description now tells users to choose
  Full Document JSON when they need every workspace in the current browser
  profile or mobile app storage area.
- Data portability tests now guard that shared export description.

Evaluation before implementation:

- The broader storage-risk pass aligned most live copy around browser profiles
  and mobile app storage areas, but the active-workspace export description
  still used the broader phrase "browser profile or device."
- The gap was still needed because export-mode selection is where users decide
  whether to back up one workspace or the whole local document.

Root cause and best path:

- Root cause: export option copy lives in the data portability model, separate
  from Data storage guidance, Help, Overview, and durable documentation.
- The best path was a small shared copy update because the same option text is
  consumed by web Data and mobile Data.

Re-evaluation after implementation:

- Data export copy now matches the same browser profile and mobile app storage
  model used by Help, Data storage status, Overview, README, user guide,
  Privacy, support, security/privacy, deployment, and mobile README.
- No export format, import behavior, schema, route, or UI layout change was
  needed.

### Completed Slice: Mobile App Storage Scope Copy Alignment

Status: completed on 2026-07-06.

What changed:

- README local-data copy now says mobile edits save to the installed app's
  local storage area and that local data remains in the current browser profile
  or mobile app storage area unless exported.
- README recovery snapshot copy now uses "mobile app storage area" instead of
  the broader "device storage area."
- User guide local-data and recovery snapshot copy now uses the installed
  app's local storage area / mobile app storage area model.
- Shared Help backup guidance now says mobile edits save to the installed
  app's local storage area and that recovery snapshots stay in the same browser
  profile or mobile app storage area only.
- Help topic tests now guard the mobile app storage area wording.

Evaluation before implementation:

- The active export, Privacy, support, and security docs used the more precise
  mobile app storage-area model, but README, user guide, and shared Help still
  used broader "device" or "device storage" wording in a few places.
- The gap was still needed because users could infer that mobile data survives
  app uninstall as long as the device remains available.

Root cause and best path:

- Root cause: earlier mobile copy described the platform at the device level
  before the storage-risk slices clarified that the installed app storage area
  is the relevant boundary.
- The best path was to align shared Help and durable docs without changing
  storage behavior or adding platform-specific implementation logic.

Re-evaluation after implementation:

- Help, README, user guide, Privacy, support, security/privacy, deployment,
  active export copy, and mobile README now describe mobile local data as
  scoped to the installed app's storage area.
- No storage behavior, export format, schema, route, or UI layout change was
  needed.

### Completed Slice: Mobile Storage Summary Copy Alignment

Status: completed on 2026-07-06.

What changed:

- README now describes the Expo companion as using installed-app local storage
  instead of generic local device storage.
- Privacy now says the mobile companion stores data in the installed app's
  local storage area.
- Security/privacy notes now describe mobile storage as the installed app's
  local storage area.
- Mobile README now says the active document is stored in the installed app's
  local storage area with AsyncStorage.

Evaluation before implementation:

- Detailed backup and recovery copy had been aligned to the mobile app storage
  boundary, but several summary bullets still used broad "device storage"
  language.
- The gap was still needed because these summaries are often the first copy a
  reader sees, and broad device wording can imply stronger persistence than the
  local app storage model provides.

Root cause and best path:

- Root cause: high-level summary bullets were written before the storage-risk
  slices clarified the app-install boundary.
- The best path was a documentation-only summary alignment while preserving
  immediate save-status wording such as "Saved on this device," which remains
  useful feedback for mobile users.

Re-evaluation after implementation:

- Summary, detailed backup, Help, Data, Overview, Privacy, support,
  security/privacy, export, and mobile README copy now all use the same mobile
  app storage boundary.
- No source behavior, export format, schema, route, or UI layout change was
  needed.

### Completed Slice: Historical Plan Follow-Up Cleanup

Status: completed on 2026-07-06.

What changed:

- Older Timeline event action notes now state that later Timeline editor slices
  reused the route contract for grouped event editing, contextual
  involved-record links, and saved relationship summaries.
- Older custom-field ordering and rename notes now clarify that later slices
  added label-only rename and non-destructive field removal with hidden-detail
  cleanup.

Evaluation before implementation:

- The final recommendation already treated Timeline editor grouping and custom
  field management as complete for the current MVP, but a few historical
  completed-slice notes still described those items as future or deferred.
- The gap was still worth fixing because the user is asking to keep selecting
  the next logical implementation slice from this plan; stale follow-up notes
  can make completed work look like an open action.

Root cause and best path:

- Root cause: the plan is an iterative running document, so earlier completed
  slices kept their original re-evaluation text after later slices closed the
  gaps.
- The best path was to annotate only stale historical statements that conflict
  with the current baseline, without rewriting the original sequence of
  implementation history.

Re-evaluation after implementation:

- The plan now consistently treats Timeline editor grouping, custom field
  rename, and custom field removal as completed prototype capabilities.
- No source behavior, route, schema, test, or UI layout change was needed.

### Completed Slice: Cross-Surface Review Hotspots

Status: completed on 2026-07-06.

What changed:

- Project Tools now includes a shared Review Hotspots summary that aggregates
  existing review signals from Workbench record queues, Timeline review,
  Relationship Studio review, and Knowledge hidden-detail cleanup.
- Browser Utilities renders the shared review summary beside Knowledge schema
  status and tool shortcuts.
- Mobile More renders the same review summary and uses the same route model for
  Workbench, Timeline, Relationship Studio, and Knowledge cleanup actions.
- Shared workflow destination tests guard the review summary and route targets;
  mobile render coverage now verifies the new summary and actions.

Evaluation before implementation:

- Earlier plan review correctly rejected a full global triage queue as a
  product decision because it would imply new ownership, severity rules,
  dismissal state, and cross-surface cleanup workflows.
- Re-evaluation showed a smaller gap remained: users still had to know which
  primary surface owned each review queue before deciding where to clean up
  records, chronology, links, or schema residue.
- The slice was still needed because Project Tools is already the shared
  cross-platform hub for secondary workflows, and the existing models already
  compute these signals without new data storage.

Root cause and best path:

- Root cause: review work had become more powerful across individual surfaces,
  but the hub only summarized Knowledge cleanup and tool shortcuts.
- The best path was a non-durable overview model that exposes route shortcuts
  only when existing review signals are present, avoiding new schema, migration,
  dismissal, or queue-state decisions.

Re-evaluation after implementation:

- The slice resolves the practical discovery gap while preserving existing
  surface ownership: Workbench owns record queues, Timeline owns chronology,
  Relationship Studio owns link health, and Knowledge owns schema cleanup.
- A larger unified triage queue remains a deliberate product decision and is
  still not needed until users need cross-surface assignment, dismissal,
  severity ordering, or progress tracking.
- No stored data, schema version, import/export format, or destructive workflow
  changed.

### Completed Slice: Review Hotspots Documentation Alignment

Status: completed on 2026-07-06.

What changed:

- Focused Utilities Help and shared workflow Help now name Review Hotspots as
  part of Project Tools.
- README, mobile README, and the user guide now describe Review Hotspots as
  shortcuts to existing cleanup surfaces rather than a durable triage queue.
- The web/mobile parity checklist now distinguishes lightweight Review Hotspots
  from product-gated durable triage.
- Manual release QA now asks testers to open Project Tools on browser and
  mobile and follow available hotspot actions to the owning review surfaces.

Evaluation before implementation:

- Runtime Project Tools now exposed Review Hotspots, but Help and durable docs
  still described the hub as Knowledge/Data/Workspaces/Help only.
- The gap was still needed because the user experience plan explicitly treats
  Project Tools as the shared cross-platform secondary workflow hub, and release
  checks should verify the new discovery point.

Root cause and best path:

- Root cause: the runtime slice intentionally stayed narrow, so existing
  documentation and QA guardrails did not yet distinguish lightweight hotspot
  navigation from a durable global triage queue.
- The best path was a documentation-only alignment that names the new summary
  while preserving the product-decision gate for assignment, dismissal,
  severity ordering, or progress tracking.

Re-evaluation after implementation:

- Runtime copy, focused Help, README, mobile README, user guide, manual QA, and
  parity guardrails now describe the same Project Tools review model.
- No additional source, schema, route, or persistence change was needed.

### Completed Slice: Review Hotspots Route And Smoke Coverage

Status: completed on 2026-07-06.

What changed:

- Shared workflow route samples now include `/utilities#project-tools`.
- Route-intent tests now verify the Project Tools focus hash resolves as a
  Utilities workflow focus target.
- Mobile route adapter tests now verify `/utilities#project-tools` maps to the
  More tab with the shared focus parameter.
- Browser smoke route checks now require Utilities to render Review Hotspots
  and the Workbench/Relationship review shortcut actions.
- Browser smoke focused Timeline Help expectations now match the current
  grouped-event-editing Help copy.
- Timeline contextual create-route smoke now scopes involved-record reseed
  assertions to the selected involved-record row instead of the full page text.

Evaluation before implementation:

- Runtime, mobile render tests, Help, and durable docs now covered Review
  Hotspots, but browser smoke still only checked the older Knowledge schema and
  tool-shortcut text on Utilities.
- The gap was still needed because browser smoke is the fast release-facing
  check that confirms the web route renders the cross-platform Project Tools
  hub from a real browser DOM.

Root cause and best path:

- Root cause: the runtime slice added a new Project Tools summary after the
  Utilities route smoke expectations had already been written.
- The best path was a coverage-only slice: add the Project Tools focus route to
  shared route samples, verify mobile route adaptation, and require the browser
  smoke DOM to include the new review summary and actions.

Re-evaluation after implementation:

- Browser route smoke, shared route intents, mobile route adaptation, shared
  model tests, mobile render tests, Help, and durable docs now cover the same
  Review Hotspots behavior.
- The re-run exposed and corrected a stale Timeline Help smoke string, so the
  browser smoke text checks now match the current Help model.
- The re-run also exposed a false-positive Timeline reseed assertion: the
  previous involved record could appear elsewhere on the page even after the
  selected staged record was reseeded. The smoke check now verifies the selected
  involved-record row directly.
- No runtime behavior, schema, persistence, or UI layout change was needed.

### Completed Slice: Workbench Hotspot Target Precision

Status: completed on 2026-07-06.

What changed:

- The shared Project Tools Review Hotspots model now routes the Workbench
  hotspot to the highest-priority active Workbench review view instead of always
  opening `Incomplete`.
- Workbench hotspot routing now prioritizes `Needs Review`, then `Incomplete`,
  then `Unlinked`.
- Shared workflow destination tests now cover complete unlinked records and
  complete needs-review records so the hotspot lands on the relevant queue.

Evaluation before implementation:

- Review Hotspots made cross-surface cleanup easier to discover, but the
  Workbench action always linked to `/entries?view=incomplete` whenever any
  Workbench review signal existed.
- The gap was still needed because a user with only unlinked records or only
  needs-review records could follow the hotspot and land in an unrelated or
  empty queue, adding avoidable navigation cost.

Root cause and best path:

- Root cause: the first hotspot slice counted all Workbench review signals but
  hardcoded the action route to the first historical Workbench review queue.
- The best path was a small shared-model fix that chooses the active queue
  before formatting the route, preserving the single compact hotspot action
  rather than adding multiple Workbench buttons.

Re-evaluation after implementation:

- The Workbench hotspot now opens the most relevant active queue for the current
  workspace while keeping Project Tools compact on browser and mobile.
- Focused model tests cover the previously risky unlinked-only and needs-review
  cases.
- No stored data, schema, mobile adapter, or UI layout change was needed.

### Completed Slice: Mobile Workbench Hotspot View Hydration

Status: completed on 2026-07-06.

What changed:

- Mobile Workbench now reads shared `view` route parameters when opened from a
  Review Hotspot.
- A routed mobile Workbench review queue renders the same shared Workbench view
  records used by the browser route, with Edit and Context actions for each
  record.
- Selecting a routed review-queue record switches to the record's owning section
  before opening Edit or Context.
- Mobile render coverage now verifies the shared `view=unlinked` route opens a
  Workbench review queue with seed unlinked records.

Evaluation before implementation:

- The shared mobile route adapter preserved `/entries?view=...`, but
  `EntriesScreen` did not read the `view` parameter.
- The gap was still needed because Project Tools Review Hotspots are shared
  across browser and mobile; a mobile user tapping Workbench Review should land
  on the relevant review queue, not the default section index.

Root cause and best path:

- Root cause: browser Workbench had universal review views, while mobile
  Workbench was still section-index driven and only hydrated section, entry, and
  Timeline route params.
- The best path was to reuse `getWorkbenchRecordIndexModel` inside mobile Index
  mode when a shared view route is present, avoiding a separate mobile-only
  review model or extra Project Tools action.

Re-evaluation after implementation:

- Mobile More Review Hotspots can now route to mobile Workbench review queues
  with the same shared `view` parameter used on browser.
- Back-to-index behavior remains useful because the routed review queue stays
  active while the user inspects a record from that queue.
- A follow-up re-evaluation also cleared routed review-queue state when an
  already-mounted mobile Workbench receives the plain `/entries` route again.
- No stored data, schema, export/import, or route-adapter change was needed.

### Completed Slice: Workbench Review Queue Route Evidence

Status: completed on 2026-07-06.

What changed:

- Shared workflow route samples now include `/entries?view=unlinked`.
- Shared workflow intent parsing now preserves valid Workbench review `view`
  parameters for browse routes and rejects unknown view ids to the empty state.
- Browser smoke now opens the direct Workbench review queue route and verifies
  the Unlinked view is the active Workbench view.
- Browser smoke also verifies the seed unlinked record appears in that queue
  and that the route does not render the empty-state copy.
- README, mobile README, user guide, manual release QA, and the web/mobile
  parity checklist now state that Workbench Review Hotspots should land in the
  intended review queue on both platforms.

Evaluation before implementation:

- The shared model routed Workbench hotspots to active queues, and mobile render
  coverage proved that `view=unlinked` hydrated the mobile Workbench queue.
- The gap was still needed because browser smoke only verified that Utilities
  showed the Workbench Review action, not that the direct queue route activated
  the requested Workbench view.

Root cause and best path:

- Root cause: the first route coverage slice proved Project Tools discovery,
  while the later hotspot precision slice introduced queue-specific routing
  without a browser DOM assertion for the target route.
- The best path was a small evidence slice: add the queue route to shared route
  samples, add a browser smoke assertion that inspects the active Workbench view
  state, and update release guidance so manual QA checks the target queue.

Re-evaluation after implementation:

- Browser route smoke, mobile route adaptation, mobile render coverage, shared
  workflow intent parsing, shared route samples, README, user guide, and QA docs
  now describe and verify the same Workbench review queue behavior.
- The slice did not need data-model, persistence, schema, or UI layout changes.

### Completed Slice: Workbench Review Hotspot Label Precision

Status: completed on 2026-07-06.

What changed:

- The Workbench Review Hotspot action label now names the active target queue,
  such as `Open Incomplete Records`, `Open Unlinked Record`, or
  `Open Needs Review Record`.
- The Workbench hotspot title and detail now name the selected queue instead of
  describing Workbench review generically.
- Shared model tests, mobile render coverage, and browser smoke expectations now
  verify the queue-specific action label.

Evaluation before implementation:

- The Workbench hotspot already routed to the highest-priority active review
  queue, but the visible action still said `Open Workbench Review`.
- The gap was still needed because the generic label increased interaction cost:
  users could not tell whether the action would open Incomplete, Needs Review,
  or Unlinked records until after navigation.

Root cause and best path:

- Root cause: the first hotspot implementation added dynamic routing while
  keeping the original static action label.
- The best path was to derive the label from the same active Workbench view that
  already drives the route, keeping one compact action while making its target
  explicit on browser and mobile.

Re-evaluation after implementation:

- Project Tools now tells users which Workbench queue will open before they
  navigate, reducing surprise while preserving the compact hotspot summary.
- The change did not require new schema, persistence, route, or layout behavior.

### Completed Slice: Project Tools Action Accessibility Context

Status: completed on 2026-07-06.

What changed:

- Shared Utilities action models now have a formatter for accessibility labels
  that includes the action label, count label when present, and detail text.
- Browser Utilities applies the shared accessibility label to Knowledge,
  shortcut, and Review Hotspot links.
- Mobile More applies the same accessibility label to the matching Project
  Tools action buttons.
- Shared model tests, mobile render coverage, and browser smoke now verify the
  richer Review Hotspot accessibility label.

Evaluation before implementation:

- Project Tools actions already carried `title`, `detail`, and `countLabel`
  data, but browser and mobile controls exposed only terse visible labels to
  assistive technology.
- The gap was still needed because queue-specific labels reduced visual
  ambiguity, but users of assistive technology still benefited from the action
  count and purpose without adding more visible copy to the compact hub.

Root cause and best path:

- Root cause: Project Tools reused simple link/button rendering and did not
  consume the richer shared action metadata for accessible names.
- The best path was to add a shared formatter and apply it on both platforms,
  avoiding platform-specific accessibility copy drift.

Re-evaluation after implementation:

- Browser and mobile Project Tools now expose the same action purpose and count
  context through accessible labels while keeping the visual UI compact.
- No data, schema, routing, persistence, or visible layout change was needed.

### Completed Slice: Utilities Destination Accessibility Context

Status: completed on 2026-07-06.

What changed:

- Shared workflow destinations now have an accessibility-label formatter that
  combines the visible action label with the destination detail.
- Browser Utilities applies the shared label to the lower detailed destination
  card links.
- Mobile More applies the same label to the matching destination action buttons.
- Shared model tests, mobile render coverage, and browser smoke now verify the
  Knowledge Setup destination exposes its purpose in the accessible label.

Evaluation before implementation:

- The Project Tools action buttons now exposed richer accessibility context, but
  the lower detailed destination cards still exposed only their terse action
  labels.
- The gap was still needed because Utilities has two entry points to the same
  secondary workflows; users should get consistent action purpose whether they
  use the compact hub or the detailed card below it.

Root cause and best path:

- Root cause: detailed destination cards predated the new shared accessibility
  formatter work and still rendered direct labels.
- The best path was a small shared destination formatter used by both browser
  and mobile, mirroring the Project Tools action formatter without changing the
  visual layout.

Re-evaluation after implementation:

- Compact Project Tools actions and detailed Utilities destination cards now use
  the same shared accessibility-context pattern on browser and mobile.
- No data, schema, routing, persistence, or visible layout change was needed.

### Completed Slice: Workbench Hotspot Queue Count Precision

Status: completed on 2026-07-06.

What changed:

- The Workbench Review Hotspot action count now describes the specific queue
  being opened, such as `1 unlinked record` or `{n} incomplete records`.
- The broader Review Hotspots metric still reports the total Workbench record
  signal count across incomplete, unlinked, and needs-review queues.
- Shared model tests and mobile render coverage now verify the queue-specific
  count context.

Evaluation before implementation:

- The action label and route had become queue-specific, but the action
  `countLabel` still used the aggregate Workbench review signal count.
- The gap was still needed because an accessible label could say
  `Open Incomplete Records` followed by a total record-signal count that did not
  necessarily equal the number of records in the Incomplete queue.

Root cause and best path:

- Root cause: the initial Review Hotspot model stored one Workbench issue count
  before the later queue-specific routing and labeling slices were added.
- The best path was to keep the summary metric aggregate and change only the
  action count to use the selected Workbench view's count and label.

Re-evaluation after implementation:

- Review Hotspots now distinguish aggregate Workbench signal volume from the
  exact queue count a user will open.
- No data, schema, route, persistence, or visible layout change was needed.

### Completed Slice: Workbench Hotspot Queue Copy Normalization

Status: completed on 2026-07-06.

What changed:

- Workbench Review Hotspot detail copy now uses canonical queue names such as
  `Incomplete`, `Unlinked`, and `Needs Review`.
- Queue count labels keep natural lowercase noun phrases such as
  `1 unlinked record` and `{n} incomplete records`.
- Shared model tests, mobile render coverage, and browser smoke now verify the
  canonical queue detail copy.

Evaluation before implementation:

- The queue-specific action detail was generated by lowercasing the Workbench
  view label, which worked for `Incomplete` and `Unlinked` but produced less
  polished copy for `Needs Review`.
- The gap was still needed because this detail is used in accessibility labels
  and should read as deliberate product copy for every supported queue.

Root cause and best path:

- Root cause: the first queue-label slice reused the display label directly
  instead of defining separate copy for queue names and count noun phrases.
- The best path was a small shared queue-copy helper that keeps each phrase
  explicit while preserving the existing route and count behavior.

Re-evaluation after implementation:

- Workbench Review Hotspot accessible detail now uses canonical queue names and
  stable count phrases across all target queues.
- No data, schema, route, persistence, or visible layout change was needed.

### Completed Slice: Workbench Hotspot Visible Queue Count

Status: completed on 2026-07-06.

What changed:

- The visible Workbench Review Hotspot action label now includes the target
  queue count, such as `Open {n} Incomplete Records` or
  `Open 1 Unlinked Record`.
- Shared model tests, mobile render coverage, and browser smoke now verify the
  count-bearing visible label.

Evaluation before implementation:

- Accessibility labels already included the exact target queue count, but the
  visible button still only named the queue.
- The gap was still needed because sighted users should receive the same
  pre-navigation specificity without needing to infer the target count from
  aggregate Review Hotspots metrics.

Root cause and best path:

- Root cause: the first label precision slice added queue names but intentionally
  left the compact visible label count-free, while the later count precision
  slice exposed the count only through action metadata and accessibility labels.
- The best path was to include the target queue count in the same shared
  Workbench hotspot label formatter, preserving one button and avoiding extra
  visible helper text.

Re-evaluation after implementation:

- Browser and mobile Project Tools now show the target Workbench queue and exact
  count before navigation.
- No data, schema, route, persistence, or layout structure change was needed.

### Completed Slice: Project Tools Accessibility Count Deduplication

Status: completed on 2026-07-06.

What changed:

- The shared Project Tools action accessibility-label formatter now omits the
  count label when the visible action label already contains the same count
  phrase.
- Shared model coverage verifies count context is preserved when useful and
  deduplicated when the visible Workbench label already says the count.

Evaluation before implementation:

- Adding visible Workbench queue counts made the accessible label repeat the
  same information, for example `Open {n} Incomplete Records. {n} incomplete
records`.
- The gap was still needed because the accessibility formatter is shared across
  browser and mobile and should improve context without adding repetitive
  speech output.

Root cause and best path:

- Root cause: the formatter always appended `countLabel`, which was correct
  before Workbench labels gained visible counts.
- The best path was to deduplicate only when the normalized action label already
  contains the normalized count phrase, preserving count context for other
  actions such as Relationship Review.

Re-evaluation after implementation:

- Workbench hotspot accessible labels avoid repeated count copy while other
  review actions still announce their count context.
- No data, schema, route, persistence, or visible layout change was needed.

### Completed Slice: Workbench Hotspot Count QA Alignment

Status: completed on 2026-07-06.

What changed:

- Manual release QA now asks testers to confirm Workbench hotspot labels include
  the target queue count before following the action.
- The web/mobile parity checklist now requires Workbench hotspot visible labels
  and accessible names to include target queue and count context without
  duplicate count phrases.
- Release-gate notes now call out browser smoke and mobile render coverage for
  count-bearing hotspot labels.

Evaluation before implementation:

- Runtime and automated checks now verified count-bearing Workbench hotspot
  labels, but manual QA still only asked testers to confirm the destination
  queue after navigation.
- The gap was still needed because release reviewers should validate the
  interaction-cost improvement, not only the route target.

Root cause and best path:

- Root cause: QA documentation predated the visible-count and accessibility
  deduplication slices.
- The best path was a documentation-only alignment that adds the new acceptance
  criteria without expanding product scope or creating a durable triage
  workflow.

Re-evaluation after implementation:

- Runtime behavior, automated coverage, manual QA, and parity criteria now
  describe the same Workbench hotspot count behavior.
- No source, route, schema, persistence, or UI layout change was needed.

### Completed Slice: Workbench Hotspot Count Example Plan Alignment

Status: completed on 2026-07-06.

What changed:

- UX plan examples for Workbench hotspot counts now use count-neutral examples
  such as `{n} incomplete records` instead of fixture-specific starter counts.

Evaluation before implementation:

- Runtime behavior and tests correctly use the current fixture counts, but the
  plan examples used specific counts that can vary between the browser starter
  world and mobile render fixtures.
- The gap was still needed because the UX plan should describe the product
  behavior, not freeze incidental seed counts into the design direction.

Root cause and best path:

- Root cause: documentation examples were written while validating against a
  specific fixture, then mobile fixture setup added custom records that changed
  the count.
- The best path was documentation-only: keep exact counts in tests and smoke
  checks, but make the UX plan examples count-neutral.

Re-evaluation after implementation:

- The plan now describes the count-bearing behavior without becoming stale when
  seed data or test fixtures change.
- No source, route, schema, persistence, or UI layout change was needed.

### Completed Slice: Utilities Focus Route Coverage

Status: completed on 2026-07-06.

What changed:

- Shared workflow route samples now include the remaining Utilities focus
  targets: `knowledge-setup`, `workspaces`, and `help`.
- Shared route-intent tests now verify every Utilities focus target resolves to
  a typed Utilities workflow intent.
- Mobile route adapter tests now verify every Utilities focus target maps to the
  More tab with the shared `routeFocusId` parameter.

Evaluation before implementation:

- Runtime focus handling supported all Utilities destination ids, but route
  samples and mobile route tests only covered `project-tools` and `data-tools`.
- The gap was still needed because focused Utilities routes are how browser and
  mobile users land directly in dense secondary workflows without scanning the
  whole tools page.

Root cause and best path:

- Root cause: earlier slices added focus coverage around the newly introduced
  Project Tools hub and Data shortcut, but did not expand the coverage to every
  existing destination card.
- The best path was a route-coverage-only slice that exercises the existing
  route model without changing runtime behavior or adding new pages.

Re-evaluation after implementation:

- Shared samples, route-intent tests, and mobile route-adapter tests now cover
  all current Utilities focus targets.
- No UI, schema, persistence, or route-format change was needed.

### Completed Slice: Browser Utilities Focus Route Smoke Coverage

Status: completed on 2026-07-06.

What changed:

- Browser smoke now loads the remaining Utilities focus routes directly:
  `/utilities#knowledge-setup`, `/utilities#workspaces`, and
  `/utilities#help`.
- Each route check verifies the focused destination content and action text are
  present after a direct browser load.

Evaluation before implementation:

- Shared route samples and mobile route tests covered every Utilities focus
  target, but browser smoke only refreshed the base Utilities route and
  `/utilities#data-tools`.
- The gap was still needed because direct browser refreshes of hash-focused
  Utilities routes should remain part of the release-facing smoke evidence.

Root cause and best path:

- Root cause: earlier browser smoke coverage was added around Data Tools first
  and was not expanded after the route sample set was completed.
- The best path was to add direct DOM text checks for the remaining focused
  destination routes without adding new browser interaction steps.

Re-evaluation after implementation:

- Shared route samples, route-intent tests, mobile route-adapter tests, and
  browser smoke now cover every current Utilities focus target.
- No UI, schema, persistence, or route-format change was needed.

### Completed Slice: Browser Project Tools Focus Smoke Coverage

Implemented:

- Browser smoke now directly opens `/utilities#project-tools` and verifies the
  Project Tools hub, Knowledge Schema, Tool Shortcuts, Review Hotspots, and
  Workbench hotspot action render after a focused hash refresh.
- The check complements the existing shared route-intent coverage and mobile
  route-adapter coverage for the same focus target.

Evaluation before implementation:

- Shared route samples, route-intent tests, and mobile route-adapter tests
  already covered `/utilities#project-tools`.
- Browser smoke covered the unfocused `/utilities` route plus each destination
  hash, but the primary Project Tools hash itself was only indirectly covered.

Root cause and best path:

- Root cause: Project Tools became the primary Utilities hub before the later
  destination-hash smoke slice expanded browser refresh coverage.
- The best path was an evidence-only browser smoke addition because the runtime
  focus behavior and route model were already implemented.

Re-evaluation after implementation:

- Browser smoke now covers both the primary Project Tools focus hash and every
  destination focus hash in the current Utilities model.
- No UI, schema, persistence, mobile route, or route-intent change was needed.

### Completed Slice: Browser Utilities Help Topic Smoke Coverage

Implemented:

- Browser smoke now opens `/help?topic=utilities` directly and verifies the
  focused Utilities Help topic renders the Project Tools hub, Review Hotspots,
  and Utilities action context.

Evaluation before implementation:

- The shared Help model, route-intent tests, and mobile route adapter already
  covered focused Utilities Help.
- Browser smoke still only exercised focused Timeline Help, even though the
  Utilities Help destination now routes users to `/help?topic=utilities`.

Root cause and best path:

- Root cause: focused Help smoke coverage was created for Timeline first and
  was not expanded when Utilities became a first-class focused Help destination.
- The best path was an evidence-only browser route check because no Help copy,
  route parser, mobile adapter, or UI behavior change was needed.

Re-evaluation after implementation:

- Browser smoke now covers focused Help for both Timeline authoring and the
  Utilities/Project Tools workflow hub.
- No source-model, schema, persistence, mobile route, or layout change was
  needed.

### Completed Slice: Mobile Utilities Help Topic Render Coverage

Implemented:

- Mobile Help render coverage now passes `topic=utilities` through the mocked
  Expo route params and verifies the focused Utilities Help topic renders.
- The test asserts the mobile Help screen exposes the Project Tools hub,
  Review Hotspots, and Open Utilities guidance from the shared Help model.

Evaluation before implementation:

- Shared Help model tests and mobile route-adapter tests covered the focused
  Utilities topic, and browser smoke now exercises `/help?topic=utilities`.
- Mobile Help render coverage still only rendered the default Help screen, so
  it did not prove the installed app surface displays focused Utilities Help
  when opened through route params.

Root cause and best path:

- Root cause: the mobile Help render mock always returned empty route params,
  which was sufficient before focused Help destinations became part of the
  Project Tools workflow.
- The best path was a focused render test that keeps the existing component and
  shared model unchanged while verifying mobile route-param hydration.

Re-evaluation after implementation:

- Focused Utilities Help is now covered in shared core tests, mobile route
  adaptation, browser smoke, and mobile rendered output.
- No UI copy, schema, persistence, route parser, or component behavior change
  was needed.

### Completed Slice: Mobile Utilities Destination Focus Render Coverage

Implemented:

- Mobile More render coverage now verifies every Utilities destination section
  exists with its focusable section test id: Knowledge Setup, Data Tools,
  Workspaces, and Help.
- The same test now verifies the destination actions expose the shared
  accessibility labels with action and detail context.

Evaluation before implementation:

- Mobile More already registered layout offsets for destination ids and rendered
  the shared destination action labels, but the render test only checked some
  destination labels incidentally.
- The gap was still useful because `/utilities#...` mobile focus routes depend
  on those destination ids existing as stable rendered sections.

Root cause and best path:

- Root cause: earlier route-focus tests covered shared route adaptation, while
  mobile render coverage concentrated on Project Tools and Knowledge cleanup
  content rather than every Utilities destination anchor.
- The best path was a focused render-coverage update because the implementation
  already used the shared destination ids and accessibility formatter.

Re-evaluation after implementation:

- Mobile Utilities destination route targets now have shared route-adapter
  coverage and rendered-section coverage.
- No UI, schema, persistence, route parser, or component behavior change was
  needed.

### Completed Slice: Mobile Focused Help Selected-State Coverage

Implemented:

- Mobile Help render coverage now preserves `accessibilityState` from the
  shared `ActionButton` primitive in its React Native mock.
- The focused Utilities Help render test now verifies exactly one focus-topic
  action is selected and that the selected action is Utilities.

Evaluation before implementation:

- The Help screen passed `selected` and accent tone to the active focus-topic
  action, but the render test mock discarded the selected accessibility state.
- The gap was still useful because focused Help is now part of the
  Project Tools loop, and mobile users should get clear selected-state feedback
  while moving between focused topics.

Root cause and best path:

- Root cause: the smaller Help render mock predated the broader mobile
  accessibility-state coverage used by the Entries render tests.
- The best path was to align the Help mock with the shared primitive contract
  and assert the focused Utilities topic state without changing production
  component behavior.

Re-evaluation after implementation:

- Mobile focused Help now has rendered content coverage and focused-topic
  selected-state coverage.
- No UI copy, schema, persistence, route parser, or production component change
  was needed.

### Completed Slice: Mobile Project Tools Knowledge Label

Implemented:

- Mobile More now renders the shared `Knowledge Schema` group label inside
  Project Tools before the compact Knowledge metrics and action.
- Mobile render coverage now verifies the Knowledge Schema label appears both
  in Project Tools and in the detailed Knowledge Schema section.

Evaluation before implementation:

- Browser Project Tools showed three clearly labeled groups: Knowledge Schema,
  Tool Shortcuts, and Review Hotspots.
- Mobile Project Tools showed Tool Shortcuts and Review Hotspots labels but
  jumped directly from the Project Tools detail into Knowledge metrics, making
  that first group less scannable.

Root cause and best path:

- Root cause: the mobile Project Tools implementation reused the metrics and
  actions from the shared Knowledge summary but omitted its title to keep the
  compact mobile block short.
- The best path was to render the existing shared title rather than introduce
  new copy or a separate mobile-only grouping model.

Re-evaluation after implementation:

- Mobile Project Tools now labels all three compact groups consistently while
  preserving the detailed Knowledge Schema section below.
- No schema, persistence, route, or shared model change was needed.

### Completed Slice: Browser Help Utilities Link Smoke Coverage

Implemented:

- Browser smoke route checks now support optional expected link assertions in
  addition to text assertions.
- The focused Utilities Help smoke check now verifies the `Open Utilities`
  quick action points to `/utilities#project-tools`.

Evaluation before implementation:

- Shared Help model tests already asserted the Utilities quick action path, and
  browser smoke already verified `/utilities#project-tools` renders correctly.
- Browser smoke for `/help?topic=utilities` only checked visible text, so it
  would not catch a broken Help-page link from focused Utilities Help back to
  the Project Tools hub.

Root cause and best path:

- Root cause: route smoke checks were originally text-only and focused on page
  rendering, while later UX slices made specific cross-page focus links part of
  the workflow contract.
- The best path was to add a reusable optional link assertion to the existing
  smoke route-check structure instead of adding a separate one-off browser
  interaction.

Re-evaluation after implementation:

- The browser Help to Project Tools loop now has source-model, destination
  render, and direct link-href smoke coverage.
- No UI copy, schema, persistence, route parser, or production component change
  was needed.

### Completed Slice: Browser Help Focus Topic Navigation

Implemented:

- Browser Help now renders the shared Help Topics list from
  `helpModel.focusTopics`, matching the mobile Help topic picker.
- The active focused topic is marked with `aria-current="page"` and a visible
  selected secondary-button state.
- Browser smoke now verifies the Help Topics section renders on generic Help
  and focused Utilities Help.

Evaluation before implementation:

- Mobile Help already let users move between focused Help topics in place.
- Browser Help could display a focused topic from the URL, but it did not
  render the shared focus-topic list, so users had to rely on external links or
  know topic URLs to switch topics.

Root cause and best path:

- Root cause: the shared Help model exposed `focusTopics`, but the browser page
  only consumed focused topic content, quick actions, workflow sections, and
  data/support sections.
- The best path was to render the existing shared focus-topic model on browser
  with standard links and active-state semantics instead of introducing new
  Help state or browser-only topic data.

Re-evaluation after implementation:

- Browser and mobile Help now both support focused topic browsing from the
  shared topic model.
- No schema, persistence, route parser, or mobile behavior change was needed.

### Completed Slice: Browser Help Active Topic Smoke Coverage

Implemented:

- Browser smoke link assertions now inspect rendered anchor elements and can
  require `aria-current="page"`.
- Focused Utilities Help smoke now verifies the Utilities Help topic link points
  to `/help?topic=utilities` and is the active current topic.

Evaluation before implementation:

- Browser Help now rendered the shared focus-topic picker with active-state
  semantics, but smoke only verified the Help Topics text and the separate
  `Open Utilities` quick-action link.
- The gap was still useful because selected-state regressions would make the
  browser topic picker less clear while leaving the page text intact.

Root cause and best path:

- Root cause: the first Help topic smoke addition reused the existing link-href
  assertion for navigation but did not validate active-topic semantics.
- The best path was to extend the reusable smoke link assertion with an
  optional current-link check.

Re-evaluation after implementation:

- Browser focused Help now has smoke coverage for rendered topic navigation,
  the active topic state, and the Help to Project Tools quick-action link.
- No production UI, schema, persistence, or route parser change was needed.

### Completed Slice: Browser Smoke Route Timeout Headroom

Implemented:

- Browser smoke route DOM-dump checks now use a configurable
  `VWB_BROWSER_TIMEOUT_MS` value with a 90-second default.

Evaluation before implementation:

- After adding focused Help topic and link assertions, the smoke suite timed out
  during browser DOM dumps without producing a content assertion failure.
- The gap was still worth addressing because the route-smoke suite now covers a
  larger set of focused workflow routes, screenshots, and layout checks.

Root cause and best path:

- Root cause: the route DOM-dump timeout remained at the earlier 30-second
  value even as the smoke suite expanded across more focused workflow routes
  and occasionally cold-started both Chrome and Edge.
- The best path was modest, configurable timeout headroom rather than weakening
  route assertions or removing coverage.

Re-evaluation after implementation:

- Route smoke remains content/assertion-driven while allowing slower local
  browser startup to complete.
- Re-evaluation after additional Help link assertions showed 45 seconds could
  still time out during early DOM dumps on this local machine; the default was
  increased to 90 seconds while preserving the environment override.
- No production UI, schema, persistence, route parser, or app behavior changed.

### Completed Slice: Help Topic Navigation QA Alignment

Implemented:

- The web/mobile parity checklist now requires browser and mobile Help to expose
  the shared focused-topic picker with visible selected/current state.
- Manual release QA now asks testers to open focused Utilities Help on browser
  and mobile, confirm Utilities is selected, and follow Open Utilities back to
  Project Tools.
- The user guide now explains that Help includes a topic picker on both browser
  and mobile.

Evaluation before implementation:

- Runtime behavior, browser smoke, and mobile render tests covered focused Help
  topic navigation, but release-facing QA still only described focused Help
  links and general Help coverage.
- The gap was still useful because Help topic switching is now an explicit
  cross-platform workflow, not just a route detail.

Root cause and best path:

- Root cause: browser Help topic navigation was added after the earlier focused
  Help documentation alignment slices.
- The best path was documentation-only alignment across parity QA, manual QA,
  and user guidance because runtime behavior and automated evidence already
  existed.

Re-evaluation after implementation:

- The Help topic picker is now represented in implementation, automated
  evidence, parity acceptance criteria, manual QA, and user guidance.
- No UI, schema, persistence, route parser, or production behavior change was
  needed for this slice.

### Completed Slice: Help Topic Navigation README Alignment

Implemented:

- README now describes the Help topic picker alongside focused Help links.
- Mobile README now states that Help includes a topic picker and marks the
  active focused topic.

Evaluation before implementation:

- User guide and QA documentation now described Help topic navigation, but the
  top-level browser and mobile READMEs still described focused Help only as
  available guidance.
- The gap was still useful because the READMEs are the quickest orientation
  docs for contributors checking browser/mobile feature scope.

Root cause and best path:

- Root cause: the Help topic picker was added after the earlier README focused
  Help alignment.
- The best path was a documentation-only update because runtime behavior,
  automated evidence, parity QA, and user-guide copy were already aligned.

Re-evaluation after implementation:

- Browser README, mobile README, user guide, parity QA, manual QA, smoke, and
  render tests now all describe or verify the focused Help topic picker.
- No UI, schema, persistence, route parser, or production behavior change was
  needed.

### Completed Slice: Generic Browser Help Topic Link Smoke Coverage

Implemented:

- Browser smoke for `/help` now verifies the `Open Utilities` quick action links
  to `/utilities#project-tools`.
- Browser smoke for `/help` now verifies at least one focused topic link,
  `Timeline`, points to `/help?topic=timeline`.

Evaluation before implementation:

- Focused Utilities Help smoke verified active topic state and the Project Tools
  quick action, but generic Help smoke only checked visible Help text.
- The gap was still useful because generic Help is the default Help entry point
  and should expose the same topic-switching and Project Tools loop as focused
  Help.

Root cause and best path:

- Root cause: link-href smoke assertions were introduced around the focused
  Utilities Help workflow first.
- The best path was to reuse the optional `expectedLinks` route-check contract
  on generic Help rather than adding another browser interaction flow.

Re-evaluation after implementation:

- Both generic Help and focused Utilities Help now have browser smoke coverage
  for Help topic navigation and the Help to Project Tools route.
- No UI, schema, persistence, route parser, or production behavior change was
  needed.

### Review Fix: Needs Review Hotspot Count Copy

Implemented:

- Workbench Review Hotspot count copy now uses `needs review record` rather
  than the internal status id phrase `needs-review record`.
- Shared accessibility-label coverage now verifies `Open 1 Needs Review Record`
  does not repeat the same count phrase before the queue detail.
- The shared accessibility-label formatter now uses deterministic English
  lowercase comparison rather than locale-sensitive casing.

Evaluation before implementation:

- Review found that the visible Needs Review hotspot label used user-facing
  words, while the count label used the internal hyphenated status id.
- The gap was still worth fixing because the accessibility formatter only
  deduplicates count context when the visible label already contains the same
  normalized phrase.

Root cause and best path:

- Root cause: the queue-copy helper reused the internal status spelling for the
  count noun phrase while using display copy for the visible queue label.
- The best path was to correct the shared queue copy and add focused formatter
  coverage, without changing routes, queue priority, or visible button layout.

Re-evaluation after implementation:

- Needs Review hotspot visible copy, count copy, and accessible copy now use the
  same user-facing wording.
- The formatter remains English-only and environment-independent.
- No schema, persistence, route, or UI layout change was needed.

### Completed Slice: Custom Timeline Event Editor

Status: completed on 2026-07-05.

What changed:

- Added a shared Timeline event editor model that organizes chronology,
  involved records, outcomes, extra fields, submit copy, era suggestions, and
  legacy involved-record text cleanup without changing the stored `WorldEntry`
  schema.
- Browser Timeline now uses a custom event editor instead of the generic
  section editor, while preserving contextual create routes, dirty-route
  guards, draft transactions, destructive actions, and relationship-backed
  saves.
- Mobile Timeline Edit mode now uses the same shared editor model for
  chronology-first editing and relationship-backed involved-record staging.
- New Timeline events still save route-seeded era and involved-record links in
  one transaction.
- Saved Timeline events display existing relationship context as involved
  records, including older relationship types already used by Timeline
  overview.

Evaluation before implementation:

- Timeline already had first-class browse, review, era, ordering, and route
  behavior, but event authoring still used the generic entry form.
- The generic form made users work through ordinary detail-field groups and a
  generic staged-link panel for the most common Timeline authoring task:
  creating an ordered event with date, era, consequences, and involved records.
- The gap was still real because Timeline is one of the primary creative
  workflows and because the existing route context already knew enough to seed
  a richer editor.

Root cause and best path:

- Root cause: Timeline had workflow-specific browse and review surfaces, but
  no workflow-specific authoring model.
- The best path was a shared editor view model over the existing `WorldEntry`
  timeline fields rather than a new event schema or migration.
- Relationship-backed involved records remain the primary model; legacy
  `involvedRecords` text is treated as cleanup/support.

Re-evaluation after implementation:

- The editor now matches the Timeline workflow shape on browser and mobile:
  identity, chronology, involved records, outcomes, notes, tags, and actions.
- Existing contextual create routes still seed era and staged involved links.
- Existing saved Timeline relationships are visible as involved context, so
  older seed data and user-created relationships do not disappear from the
  editor.
- No schema migration, durable vocabulary change, or route redesign was needed.

### Completed Slice: Schema 3 Vocabulary Foundation

Status: completed on 2026-07-06.

What changed:

- World documents now use schema `3` with workspace-owned vocabulary registries,
  sparse built-in field overrides, ignored vocabulary candidate storage, and
  seed vocabularies for Characters, Places, Factions, Lore, and Timeline.
- Browser and mobile storage moved to v3 keys. Unsupported previous v2/v1
  local storage is reported and the app opens starter data instead of silently
  migrating old shapes.
- Full JSON export/import includes vocabulary schema data, Markdown export
  includes active vocabulary reference sections, and diagnostics report
  vocabulary counts without exposing labels, descriptions, or aliases.
- Workspace creation, duplication, large fixtures, frontend parity fixtures,
  and mobile storage all create current-schema workspaces.

Evaluation before implementation:

- Durable vocabulary editing needed a real document home before any UI could
  safely add, archive, restore, reorder, or attach values.
- The previous schema had no workspace-owned registry, so values were split
  between hardcoded field options and observed entry text.
- Clean break remained appropriate because there are no live users or live data
  requiring compatibility migration.

Root cause and best path:

- Root cause: the UI could show emerging values, but the persisted document had
  no durable vocabulary layer users could own.
- The best path was a schema `3` baseline with seed registries and automatic
  built-in field attachments before any editor suggestion wiring.

Re-evaluation after implementation:

- Current-schema parsing, storage recovery, import/export, Markdown export,
  diagnostics, full test coverage, typecheck, mobile typecheck, lint, and Vite
  build all pass.
- The slice intentionally did not wire editor suggestions or mobile editing;
  those remain separate approved slices after the Vocabulary Manager.

### Completed Slice: Browser Vocabulary Manager

Status: completed on 2026-07-06.

What changed:

- Shared Knowledge Schema vocabulary rows now read from durable workspace
  vocabularies and include active values, archived values, and field usage
  context.
- Browser Knowledge now includes a Vocabulary Manager with add, edit,
  archive, restore, and move controls for vocabulary values.
- Core workspace vocabulary helpers enforce no duplicate active labels, restore
  archived values when re-added, persist aliases, and maintain manual active
  value order.
- Mobile More now displays the same durable vocabulary rows read-only, keeping
  mobile aligned with the shared model until the focused mobile editing slice.

Evaluation before implementation:

- Knowledge had passive controlled/observed value rows, but users could not
  maintain the durable vocabulary lists introduced by schema `3`.
- The mobile display path consumed the same shared vocabulary row model, so a
  browser-only row-shape change would have created immediate parity drift.

Root cause and best path:

- Root cause: the schema foundation existed, but Knowledge still presented the
  old review-only model.
- The best path was to replace the shared Knowledge vocabulary rows with
  durable vocabulary rows, then add browser editing controls through existing
  active-workspace mutation and save flows.

Re-evaluation after implementation:

- Browser Knowledge now supports the first durable vocabulary maintenance
  workflow without adding new pages or changing editor behavior prematurely.
- Mobile More no longer displays obsolete observed-value copy, but remains
  read-only until the approved mobile vocabulary editing slice.
- Remaining gaps are now narrower: mobile vocabulary editing, editor
  suggestions from durable vocabularies, restricted validation, and built-in
  field override controls.

### Completed Slice: Mobile Vocabulary Manager

Status: completed on 2026-07-06.

What changed:

- Mobile More now supports compact vocabulary value add, edit, archive,
  restore, and reorder controls using the same schema `3` vocabulary data and
  core workspace helpers as browser Knowledge.
- The mobile codex controller exposes vocabulary value mutations through the
  existing document commit, local save, and device feedback path.
- Mobile render coverage now verifies editable value fields, add controls,
  archive actions, restore actions, and ordering controls in the More
  Vocabulary Manager.

Evaluation before implementation:

- Mobile More showed durable vocabulary rows after the browser Vocabulary
  Manager slice, but users still had to switch to the browser to maintain
  values.
- This violated the accepted equal-priority browser/mobile direction for
  common schema maintenance workflows.

Root cause and best path:

- Root cause: the shared Knowledge model was durable, but the mobile controller
  did not expose vocabulary mutations and the More UI remained read-only.
- The best path was to reuse the browser/core vocabulary helpers from the
  mobile controller and add compact inline controls inside the existing More
  Knowledge area rather than adding a fifth mobile tab.

Re-evaluation after implementation:

- Browser Knowledge and mobile More now support the same first vocabulary
  maintenance workflow.
- The remaining durable vocabulary gaps are editor suggestions from schema `3`
  vocabularies, restricted validation, and browser-first built-in field override
  controls.

### Completed Slice: Durable Vocabulary Editor Suggestions

Status: completed on 2026-07-06.

What changed:

- Shared entry editor suggestion helpers now merge active schema `3`
  vocabulary values into detail-field suggestions when a field override attaches
  a vocabulary to that field.
- Browser Workbench, browser Timeline event editing, section editors, mobile
  Workbench/Edit mode, and mobile Timeline editing now pass active workspace
  schema into the shared editor models.
- Existing hardcoded field options and observed-value suggestions still work,
  and the current field value remains filtered out of the visible suggestion
  list.

Evaluation before implementation:

- Users could maintain durable vocabulary values, but entry editors did not yet
  consume those maintained lists.
- That made the Vocabulary Manager useful as reference data but not yet useful
  during the primary drafting workflow.

Root cause and best path:

- Root cause: editor suggestions were built from `WorldDetailField`
  autocomplete options plus observed entry values, while schema `3`
  vocabularies lived separately in workspace schema.
- The best path was to extend the shared suggestion helper with optional
  workspace schema context and pass that context from current browser and
  mobile editor surfaces.

Re-evaluation after implementation:

- Durable active vocabulary values now appear as suggestions in browser and
  mobile editors through the same shared model.
- Alias matching and restricted validation remain intentionally out of scope for
  this slice.
- The remaining durable schema gaps are restricted validation and browser-first
  built-in field override controls.

### Completed Slice: Restricted Vocabulary Validation

Status: completed on 2026-07-06.

What changed:

- Shared entry draft validation now checks fields whose schema override is set
  to `restricted` against active values in the attached workspace vocabulary.
- Empty optional fields remain valid, while non-empty values must match an
  active vocabulary label case-insensitively.
- Browser generic entry editing, browser Timeline event editing, staged
  create-and-link transactions, and mobile save flows all pass active workspace
  schema into validation.

Evaluation before implementation:

- Durable vocabulary suggestions were live, and schema `3` already supported
  the `restricted` vocabulary mode, but saving did not enforce it.
- Even before a field-configuration UI exists, imported or programmatically
  authored schema can set a field to restricted, so validation needed to honor
  that setting consistently.

Root cause and best path:

- Root cause: entry validation only required record names and did not inspect
  schema field overrides.
- The best path was a shared validation rule in `validateEntryDraft`, threaded
  through transaction validation and platform save flows, without adding
  browser/mobile configuration UI in the same slice.

Re-evaluation after implementation:

- Restricted validation is now centralized and works for browser and mobile
  save paths.
- Alias matching remains out of scope because aliases are currently search and
  match helpers, not saved labels.
- The remaining durable schema gap is browser-first built-in field override
  configuration for label, help, visibility, order, vocabulary attachment, and
  vocabulary mode.

### Completed Slice: Browser Field Configuration

Status: completed on 2026-07-06.

What changed:

- Browser Knowledge now includes a Field Configuration area for built-in and
  custom entry fields.
- Users can save durable label overrides, editor help text, hidden/visible
  state, display order, vocabulary attachment, and suggested/restricted
  vocabulary mode without changing the saved field key.
- Shared field utilities now apply schema overrides to browser entry cards,
  browser detail panels, generic browser editors, browser Timeline editing,
  mobile entry editing, mobile Timeline editing, hidden-detail cleanup, and the
  Knowledge schema model.
- Hidden fields remain configurable in Knowledge and become cleanup targets
  when entries retain saved values for those fields.
- Configured help text now appears under browser and mobile editor fields, so
  help configuration is not merely stored metadata.

Evaluation before implementation:

- The durable schema already stored field overrides, and editor suggestions plus
  restricted validation already consumed vocabulary attachments, but users had
  no browser UI for changing those attachments or other field settings.
- Label, order, and hidden controls would have been misleading if the editor and
  display models continued to use raw section fields.
- Help text would have been incomplete if saved but not rendered where users
  edit records.

Root cause and best path:

- Root cause: field override persistence existed as schema data, but field
  rendering and cleanup paths still treated section detail fields as the only
  source of truth.
- The best path was a browser-first Knowledge configuration UI backed by shared
  core helpers, then threading optional workspace schema through the existing
  browser and mobile editor/display models.

Re-evaluation after implementation:

- Browser users can now configure the common built-in field settings approved by
  the decision gates.
- Browser and mobile editors consume the same effective schema for labels,
  order, visibility, help text, vocabulary suggestions, and restricted
  validation.
- Mobile can use configured fields but does not yet expose mobile-native field
  configuration controls; that remains the next parity slice if schema editing
  on mobile becomes a priority.

### Completed Slice: Mobile Field Configuration

Status: completed on 2026-07-06.

What changed:

- Mobile More now includes a Field Configuration section using the same shared
  Knowledge schema model and durable field override helper as browser
  Knowledge.
- Mobile users can save field labels, editor help text, hidden state, display
  order, vocabulary attachment, and suggested/restricted vocabulary mode.
- The older custom-field rename controls were removed from the mobile custom
  entry type section so label editing has one clear home; custom type management
  remains focused on creating types, adding fields, ordering fields, removing
  fields, and deleting custom types.
- Mobile controller state now exposes `updateFieldOverride`, committing schema
  edits through the same active-world update path as vocabulary management.
- Mobile render coverage now verifies the Field Configuration section,
  vocabulary attachment controls, mode controls, hidden controls, save action,
  and collapsed overflow for additional entry type sections.

Evaluation before implementation:

- Browser had durable field configuration controls, and mobile editors already
  consumed those settings, but mobile users could not maintain the settings
  directly.
- Keeping custom-field rename controls separate from the new configuration area
  would have created duplicate label-editing workflows on mobile.

Root cause and best path:

- Root cause: mobile More had custom type and vocabulary maintenance but no
  schema override maintenance, despite the shared model already exposing the
  required field metadata.
- The best path was a compact More section that uses existing mobile field,
  checkbox, select, and action button primitives, plus the existing schema save
  path, rather than adding another mobile tab or route.

Re-evaluation after implementation:

- Browser and mobile now both provide durable field configuration workflows for
  the approved schema settings.
- Custom type management is clearer because label editing moved to the shared
  field configuration workflow.
- Remaining durable schema opportunities are editor ergonomics around
  configured fields, especially clearer restricted-choice recovery and optional
  vocabulary alias matching.

### Completed Slice: Restricted Vocabulary Recovery

Status: completed on 2026-07-06.

What changed:

- Restricted vocabulary validation now accepts active vocabulary aliases in
  addition to active canonical labels.
- Validation errors now include a short set of active example values, making it
  clearer how to recover when a restricted field rejects a draft value.
- Suggestions continue to prefer canonical vocabulary labels so editors still
  guide users toward consistent saved wording.

Evaluation before implementation:

- Browser and mobile could configure restricted vocabulary fields, but a user
  who entered a near-valid term only saw a generic error with no examples.
- Vocabulary aliases were editable metadata but did not help restricted field
  validation, reducing the value of maintaining aliases.

Root cause and best path:

- Root cause: restricted validation compared only against active labels and did
  not expose the available value set in the error copy.
- The best path was to keep canonical labels as the primary suggestions while
  allowing aliases as valid matching terms and adding concise recovery examples
  to the validation message.

Re-evaluation after implementation:

- Restricted field recovery is easier on browser and mobile because both share
  the same validation model.
- Aliases now support input flexibility without changing the stored value or
  expanding suggestion lists with non-canonical wording.
- Remaining schema ergonomics can focus on optional editor-side affordances,
  such as one-tap replacement with canonical labels after alias entry.

### Completed Slice: Canonical Vocabulary Replacement

Status: completed on 2026-07-06.

What changed:

- Shared entry editor field models now detect when an attached vocabulary field
  contains an active alias or a non-canonical casing of an active label.
- Browser generic entry editors, browser Timeline editors, mobile generic
  editors, and mobile Timeline editors now show a one-tap action to replace the
  current value with the canonical vocabulary label.
- Core model coverage verifies alias and casing replacement behavior, and
  mobile render coverage verifies the replacement action appears in the editor.

Evaluation before implementation:

- Restricted validation accepted aliases, but saved drafts could still retain
  non-canonical alias text unless the user manually replaced it.
- Suggestions intentionally stayed canonical, so the missing workflow was a
  small recovery action at the point where a user had already entered an alias.

Root cause and best path:

- Root cause: vocabulary aliases were valid matching terms, but editor field
  models did not expose canonical-match metadata to the UI.
- The best path was to add a shared canonical replacement model and render it
  under existing field controls on browser and mobile rather than introducing a
  separate normalization pass that could silently change user text.

Re-evaluation after implementation:

- Alias entry is now forgiving without becoming invisible: users can keep the
  alias until they explicitly choose the canonical replacement.
- Browser and mobile use the same detection logic, including Timeline fields.
- Remaining vocabulary ergonomics can focus on deeper search/filtering if
  maintained vocabulary lists become large.

### Completed Slice: Vocabulary Value Search

Status: completed on 2026-07-06.

What changed:

- Added a shared vocabulary value filter helper that searches active value
  labels, descriptions, and aliases.
- Browser Knowledge Vocabulary Manager now includes a per-vocabulary search
  field before editable active values.
- Mobile More Vocabulary Manager now includes the same per-vocabulary search
  field.
- Filtered value lists preserve full-list move up/down behavior so search does
  not make ordering controls operate on misleading filtered indexes.
- Core coverage verifies label, description, and alias matching, while mobile
  render coverage verifies search appears in the mobile Vocabulary Manager.

Evaluation before implementation:

- Vocabulary lists could grow through durable value editing, but both browser
  and mobile relied on expansion controls instead of direct search.
- Aliases became more useful after validation and canonical replacement, so
  search also needed to include aliases.

Root cause and best path:

- Root cause: Vocabulary Manager rows exposed value metadata but had no shared
  filtering model.
- The best path was a shared filter helper plus small search fields in the
  existing browser and mobile managers, preserving the current inline editing
  workflow.

Re-evaluation after implementation:

- Large vocabulary lists are easier to scan and maintain on browser and mobile.
- Search covers the metadata users maintain: labels, descriptions, and aliases.
- Remaining opportunities are broader workflow refinements rather than missing
  durable schema capabilities.

### Completed Slice: Field Configuration Search

Status: completed on 2026-07-06.

What changed:

- Added a shared field-configuration filter helper that searches section titles,
  section descriptions, field keys, labels, backing details, help text,
  vocabulary names, vocabulary modes, relationship types, and target sections.
- Browser Knowledge Field Configuration now includes a search field and empty
  search state.
- Mobile More Field Configuration now includes the same search field and empty
  search state.
- Core coverage verifies section-level and field-level matches, while mobile
  render coverage verifies the mobile search control appears.

Evaluation before implementation:

- Field configuration controls now cover browser and mobile, but all sections
  and fields were shown in a long maintenance surface.
- As custom sections and durable schema fields grow, finding one field by
  label, key, vocabulary, or relationship target would become a repeated
  interaction cost.

Root cause and best path:

- Root cause: Knowledge schema rows exposed rich field metadata but had no
  shared filter model for configuration workflows.
- The best path was a shared filter helper plus small search inputs inside the
  existing browser and mobile field configuration areas.

Re-evaluation after implementation:

- Field configuration is easier to navigate on both platforms without adding a
  new page or route.
- Search matches the metadata users naturally remember: section, field name,
  vocabulary, mode, and relationship target.
- Remaining workflow opportunities should be evaluated from actual friction in
  Workbench, Timeline, Relationship Studio, or Knowledge rather than extending
  schema mechanics by default.

### Completed Slice: Schema Workflow Documentation Alignment

Status: completed on 2026-07-06.

What changed:

- Core Help copy now describes field configuration, searchable field settings,
  durable vocabulary maintenance, restricted vocabulary behavior, and
  alias-matched vocabulary suggestions as one Knowledge workflow.
- The browser/mobile user guide now explains Field Configuration for built-in
  and custom fields, searchable schema settings, searchable vocabulary values,
  alias-aware restricted fields, and canonical replacement actions.
- The root README and mobile README now describe the current Knowledge setup
  behavior instead of the earlier custom-field and passive vocabulary language.
- The manual release checklist now requires field configuration, field-setting
  search, vocabulary-value search, alias acceptance, and canonical replacement
  checks across browser and mobile.

Evaluation before implementation:

- Browser and mobile had gained several durable schema and vocabulary
  capabilities, but the documentation still described an older maintenance
  surface.
- Manual QA could pass while missing the newer high-value workflow paths:
  field-setting search, vocabulary-value search, restricted alias acceptance,
  and canonical replacement.

Root cause and best path:

- Root cause: the UX implementation progressed slice by slice while
  user-facing docs and checklist copy were not updated after each adjacent
  schema slice.
- The best path was to align the existing Help, README, user guide, and manual
  checklist surfaces rather than introduce a new docs page.

Re-evaluation after implementation:

- Users now receive consistent browser and mobile guidance for the current
  Knowledge workflow.
- QA now exercises the same field and vocabulary controls that drive the
  redesigned schema experience.
- Remaining opportunities should be evaluated in live workflow surfaces rather
  than documentation unless another implemented behavior lacks guidance.

### Completed Slice: Field Configuration Reset Recovery

Status: completed on 2026-07-06.

What changed:

- Browser Knowledge Field Configuration rows now show whether a field is using
  custom settings or default settings.
- Browser Knowledge now includes a Reset to Defaults action that clears a saved
  field override or discards an unsaved field-setting draft in one step.
- Mobile More Field Configuration now shows the same custom/default state and
  exposes the same Reset to Defaults action.
- Mobile render coverage now verifies the reset affordance and default-setting
  indicator appear in the compact schema surface.
- The user guide and manual release checklist now document and verify field
  configuration recovery.

Evaluation before implementation:

- Field configuration could change many controls, but users had to manually
  restore every value to recover from experimentation.
- The sparse schema model already supported clearing an override, but the UI
  did not expose that recovery path or reveal whether a row had custom
  settings.

Root cause and best path:

- Root cause: the field-configuration UI focused on saving override values and
  did not surface the default-state behavior already present in the model.
- The best path was to reuse the existing default draft shape and
  `updateFieldOverride` normalization on both platforms instead of adding new
  schema fields or a separate reset model.

Re-evaluation after implementation:

- Users can now identify customized fields and recover to defaults with one
  action on browser and mobile.
- The action also works as a discard path for unsaved field-setting drafts,
  reducing the cost of trying configuration changes.
- Remaining schema workflow opportunities should focus on editing efficiency
  inside entry creation/editing rather than additional configuration recovery.

### Completed Slice: Browser Editor Suggestion Actions

Status: completed on 2026-07-06.

What changed:

- Browser entry editors now show visible suggestion actions for configured
  detail fields while preserving the existing native datalist autocomplete.
- Browser Timeline event editor fields use the same visible suggestion action
  component for chronology fields such as era.
- The suggestion actions include field-specific accessible labels such as
  `Use Human for Ancestry`.
- Focused browser render coverage now verifies visible suggestion actions
  appear for configured character fields.
- The user guide and manual release checklist now call out visible suggestion
  actions across browser and mobile editors.

Evaluation before implementation:

- Mobile editors already exposed field suggestions as visible actions, but
  browser editors depended on native datalist behavior.
- Native datalist discovery and interaction vary by browser, which increased
  the cost of applying common vocabulary values after users configured fields.

Root cause and best path:

- Root cause: browser and mobile had drifted in suggestion affordance
  visibility even though they shared the same editor field model.
- The best path was a small browser UI parity component that renders the same
  shared suggestions as compact buttons while keeping typed autocomplete.

Re-evaluation after implementation:

- Browser users can now apply common configured values with one click, matching
  the visible mobile workflow.
- The change does not alter schema, validation, saved data, or mobile behavior.
- Remaining editor-efficiency opportunities should be evaluated from repeated
  create/edit flows, especially where long suggestion lists or linked-field
  controls create measurable friction.

### Completed Slice: Entry Editor Suggestion Display Cap

Status: completed on 2026-07-06.

What changed:

- Added a neutral shared `entryEditorDisplayLimits.detailSuggestions` constant
  for browser and mobile editor suggestion rows.
- Browser entry editors now cap visible/autocomplete detail suggestions through
  the same shared limit used by mobile.
- Browser and mobile Timeline event editors now pass the same suggestion limit
  into the shared Timeline editor model.
- Core Timeline coverage now verifies field suggestions respect an explicit
  suggestion limit.
- The user guide and manual release checklist now describe the suggestion
  actions as compact.

Evaluation before implementation:

- Visible suggestion actions made browser entry editing faster, but long
  vocabularies or observed value lists could make the editor noisy.
- Mobile normal entry editing already used a suggestion cap, while browser
  entry editing and Timeline editor models could request unbounded suggestions.

Root cause and best path:

- Root cause: suggestion limiting existed in the shared entry field model, but
  not every browser/mobile editor caller passed a limit.
- The best path was to introduce a neutral entry-editor display limit and
  thread it through browser and mobile editor model calls without changing
  schema or suggestion generation.

Re-evaluation after implementation:

- Browser and mobile editors now keep suggestion actions compact while typed
  entry remains available for values outside the visible set.
- Timeline and non-Timeline entry editors use the same limit policy.
- Remaining editor-efficiency opportunities should be evaluated only if users
  need explicit suggestion search or expansion inside the editor itself.

### Completed Slice: Entry Editor Hidden Suggestion Count

Status: completed on 2026-07-06.

What changed:

- Shared entry editor field models now include `hiddenSuggestionCount` after
  applying the configured suggestion display cap.
- Browser entry and Timeline editors now show a concise more-suggestions count
  when capped suggestion actions hide additional values.
- Mobile entry and Timeline editors now show the same more-suggestions count
  below visible suggestion actions.
- Core, browser render, and mobile editor-model coverage now verify hidden
  suggestion counts.
- The user guide and manual release checklist now describe the capped
  suggestion indicator.

Evaluation before implementation:

- Suggestion actions were capped to keep editors compact, but users could not
  tell whether more configured or observed values existed beyond the visible
  actions.
- Without a count, a compact list could be mistaken for a complete vocabulary
  list, especially after users invested time in Knowledge vocabulary setup.

Root cause and best path:

- Root cause: the shared editor model sliced suggestions but discarded the
  pre-cap total.
- The best path was to add a hidden-count field to the shared model and render
  a small passive cue on browser and mobile rather than adding expansion or
  search controls inside every editor field.

Re-evaluation after implementation:

- Users can now see when a compact suggestion row has more available values
  while keeping the editor dense.
- Typed input and existing Knowledge vocabulary search remain the right path
  for reaching values outside the visible suggestion set.
- No further suggestion-row changes are needed unless users specifically need
  in-editor search or expansion for large vocabularies.

### Completed Slice: Hidden Suggestion Cue Actionability

Status: completed on 2026-07-06.

What changed:

- Shared entry editor models now include `hiddenSuggestionLabel` so browser and
  mobile use the same hidden-suggestion copy.
- The hidden suggestion cue now says users can type another value, making the
  compact suggestion cap actionable without adding an in-editor search control.
- Browser and mobile renderers now consume the shared label instead of
  duplicating pluralization logic.
- Core, browser render, and mobile editor-model coverage now verify the
  actionable cue.
- The user guide and manual release checklist now describe the typed-value cue.

Evaluation before implementation:

- The hidden-count cue communicated that more suggestions existed, but not how
  to reach them from the current editor.
- Adding full in-editor search or expansion was not yet justified because typed
  input already accepts values outside the visible suggestion actions.

Root cause and best path:

- Root cause: the copy focused on count visibility but omitted the recovery
  action after suggestions were capped.
- The best path was a shared label in the editor model that adds the action cue
  without increasing UI complexity.

Re-evaluation after implementation:

- Users now see that additional values can be typed directly while the editor
  remains compact.
- Browser and mobile copy are centralized and consistent.
- No further hidden suggestion cue gap was found in this pass.

### Completed Slice: Mobile Timeline Extra Field Parity

Status: completed on 2026-07-06.

What changed:

- Mobile Timeline editor fields now use one shared local renderer for
  chronology, outcomes, and additional detail groups.
- Mobile Timeline outcome fields now receive the same help text, canonical
  replacement, suggestion action, and hidden suggestion count affordances as
  chronology fields.
- Mobile Timeline extra detail fields from the shared Timeline editor model now
  render under the Additional details group instead of being omitted.
- Core coverage now verifies custom Timeline fields are grouped as additional
  details.
- Mobile render coverage now verifies a custom Timeline detail field appears in
  the mobile Timeline editor with its suggestion action.

Evaluation before implementation:

- Browser Timeline already rendered chronology, outcomes, and extra detail
  groups through the same rich field renderer.
- Mobile Timeline rendered chronology with rich field affordances, but outcomes
  used plain fields and `extraDetails` was not rendered at all.

Root cause and best path:

- Root cause: the mobile Timeline editor had copied field rendering branches
  before field help, canonical replacement, suggestion actions, and hidden
  suggestion counts became shared editor affordances.
- The best path was a local mobile field-group renderer reused for every
  Timeline field group, matching the browser structure without adding new data
  model concepts.

Re-evaluation after implementation:

- Timeline field behavior is now consistent across browser and mobile for
  chronology, outcomes, and schema-provided additional details.
- The change closes the parity gap without changing routes, schema, or current
  user workflows.
- No further Timeline field-rendering parity gap was found in this pass.

### Completed Slice: Linked Field Hidden Target Cue Actionability

Status: completed on 2026-07-06.

What changed:

- Shared relationship-backed field option displays now make the hidden
  preferred-record count actionable.
- Browser and mobile linked-field controls now inherit the same copy:
  search or show more to reach hidden preferred records.
- Core relationship-field coverage now verifies the updated shared message.

Evaluation before implementation:

- Linked-field controls already supported search, selected targets, hidden
  preferred-count messages, and expand actions on browser and mobile.
- The hidden preferred-count message was passive, so users could see that more
  records existed without an immediate cue for how to reach them.

Root cause and best path:

- Root cause: the shared relationship display model named the hidden count but
  did not include the next action.
- The best path was to update the shared message once rather than editing
  browser and mobile surfaces independently.

Re-evaluation after implementation:

- Users now get the count and the recovery path in the same linked-field cue.
- Browser and mobile remain aligned through the shared display model.
- No additional linked-field discovery gap was found in this pass.

### Completed Slice: Staged Timeline Involved-Link Pruning Feedback

Status: completed on 2026-07-06.

What changed:

- Shared staged relationship transactions now remove exact duplicate staged
  links before saving, including links that resolve from a temporary draft id to
  the newly saved entry id.
- Timeline event editor submit labels now count the normalized save list, so
  duplicate route/context links do not inflate the create action.
- Browser and mobile Timeline involved-record panels now surface a shared
  warning when duplicate staged involved links will be pruned.
- Core and browser render coverage now verify the deduped save count, pruning
  warning, and committed relationship output.

Evaluation before implementation:

- The Timeline editor model already detected duplicate staged involved targets,
  but browser and mobile did not render that state.
- Save labels could describe duplicate staged links that would create redundant
  relationship records, increasing user uncertainty during contextual
  create-and-link workflows.

Root cause and best path:

- Root cause: staged-link duplicate detection lived in the Timeline editor model
  only; transaction commit and save-label counts still used the raw staged
  draft array.
- The best path was to normalize staged relationships in shared core, then have
  both browser and mobile render the existing Timeline model signal.

Re-evaluation after implementation:

- Duplicate contextual Timeline links now produce one saved relationship and one
  clear warning.
- Browser and mobile share the same copy and save-count behavior through core
  models.
- No further duplicate staged-link workflow gap was found in this pass.

### Completed Slice: Vocabulary-Ordered Editor Suggestions

Status: completed on 2026-07-06.

What changed:

- Shared entry detail suggestion building now preserves active vocabulary value
  order before falling back to field-authored options and observed saved values.
- Browser and mobile entry editors inherit the same ordered suggestions through
  the existing shared editor field model.
- Core coverage now verifies configured place option order and durable
  vocabulary order are reflected in editor suggestions.

Evaluation before implementation:

- Users could maintain and reorder durable vocabulary values, but entry editor
  suggestions were globally alphabetized.
- That made ordering controls useful for Vocabulary Manager review but less
  useful during repeated create/edit drafting, where the most preferred values
  should appear first.

Root cause and best path:

- Root cause: the suggestion builder de-duplicated values in insertion order
  but sorted the final list alphabetically, discarding vocabulary order.
- The best path was a shared core ordering rule rather than browser/mobile UI
  changes, because both surfaces already render suggestions from the shared
  model.

Re-evaluation after implementation:

- Vocabulary order now carries into browser and mobile editor suggestion rows.
- Authored field option order is also preserved, and existing saved values
  remain available after configured values.
- No additional suggestion-order workflow gap was found in this pass.

### Completed Slice: Canonical Replacement Suggestion De-duplication

Status: completed on 2026-07-06.

What changed:

- Shared entry editor field models now remove the current value from
  suggestions case-insensitively.
- When a field exposes a canonical replacement action, the same canonical value
  is no longer repeated as a separate suggestion action.
- Browser and mobile editors inherit the cleaner action set through the shared
  model, including Timeline fields.
- Core coverage now verifies alias and casing replacement fields do not also
  show the canonical value in the suggestion row.

Evaluation before implementation:

- Canonical replacement helped users recover from aliases and casing variants,
  but the suggestion row could still show the same canonical value as an
  additional action.
- This added visual noise and made the editor feel less deliberate during
  repeated drafting.

Root cause and best path:

- Root cause: suggestion filtering only removed exact current-value matches and
  did not know about the canonical replacement action.
- The best path was to compute replacement metadata before suggestion filtering
  in the shared editor model rather than adding browser/mobile presentation
  conditionals.

Re-evaluation after implementation:

- Alias and casing recovery now shows one clear canonical action.
- Suggestion rows remain available for other useful vocabulary values.
- No further canonical-replacement action duplication gap was found in this
  pass.

### Completed Slice: Hidden Detail Cleanup Search

Status: completed on 2026-07-06.

What changed:

- Added a shared hidden-detail cleanup filter that searches section title,
  entry name, field key, field label, and retained value text.
- Browser Knowledge Hidden Detail Cleanup now includes a search field and an
  empty filtered state.
- Mobile More Hidden Detail Cleanup now includes the same search field, with
  visible rows and overflow counts based on filtered results.
- Core and mobile render coverage now verify the hidden-detail cleanup search
  workflow.

Evaluation before implementation:

- Hidden-detail cleanup could collect many retained values after users remove
  or hide fields, but the cleanup list had no focused search.
- Browser showed all cleanup rows, while mobile capped rows with expansion;
  both paths still required scanning to find one entry, field, or retained
  value before review or bulk clearing.

Root cause and best path:

- Root cause: hidden-detail cleanup rows were modeled centrally but had no
  shared filtering helper like field configuration and vocabulary values.
- The best path was to add one shared filter and wire it into the existing
  cleanup sections rather than adding a new cleanup page or durable queue.

Re-evaluation after implementation:

- Users can now find cleanup targets by entry, section, field, or saved value on
  browser and mobile.
- Mobile overflow behavior remains compact and now reflects the filtered result
  set.
- No additional hidden-detail cleanup discovery gap was found in this pass.

### Completed Slice: Hidden Detail Bulk-Clear Scope Clarity

Status: completed on 2026-07-06.

What changed:

- Hidden-detail cleanup bulk actions now say `Clear All Hidden Details` on
  browser and mobile.
- Shared destructive-action confirmation copy now uses the same all-clear
  wording while retaining the recovery snapshot warning.
- The user guide now describes hidden-detail cleanup search and the all-hidden
  clear behavior.
- Core destructive-copy and mobile render coverage now verify the updated bulk
  action label.

Evaluation before implementation:

- After adding hidden-detail search, the existing `Clear Hidden Details` label
  became ambiguous because it could be read as clearing the filtered visible
  results.
- The operation actually clears all hidden detail values in the current
  workspace, so the action label needed to communicate scope before the
  confirmation dialog.

Root cause and best path:

- Root cause: the bulk action label predated filtered cleanup rows and did not
  include all-clear scope.
- The best path was to clarify the shared destructive copy and matching browser
  and mobile labels rather than changing the destructive operation.

Re-evaluation after implementation:

- The cleanup action now communicates all-hidden scope before and during
  confirmation.
- Search remains a review/discovery tool, not a filtered bulk delete mode.
- No further hidden-detail bulk-action clarity gap was found in this pass.

### Completed Slice: Hidden Detail Cleanup Documentation Alignment

Status: completed on 2026-07-06.

What changed:

- Manual release checklist wording now verifies hidden-detail cleanup search and
  the `Clear All Hidden Details` action.
- Earlier UX-plan completed-slice references now use the current all-clear
  action label.

Evaluation before implementation:

- The UI and shared destructive copy had been clarified, but checklist and
  historical plan references still named the older `Clear Hidden Details`
  action.
- Leaving stale action names would increase QA friction and make the plan appear
  inconsistent with the current workflow.

Root cause and best path:

- Root cause: the label clarification changed user-facing review language, but
  supporting docs were not part of the initial code patch.
- The best path was a narrow documentation update rather than any further
  runtime change.

Re-evaluation after implementation:

- Current QA and plan text now names the same all-clear action as browser and
  mobile.
- No additional hidden-detail cleanup wording mismatch was found in this pass.

### Completed Slice: Hidden Detail Row-Level Cleanup

Status: completed on 2026-07-06.

What changed:

- Added a shared mutation for clearing one hidden entry detail from the active
  workspace while leaving active visible fields untouched.
- Browser Knowledge hidden-detail cleanup rows now include a direct `Clear
Detail` action beside `Review Entry`.
- Mobile More hidden-detail cleanup rows now include the same direct `Clear
Detail` action with singular destructive confirmation.
- Browser, mobile render, destructive-copy, and core mutation coverage now
  verify the row-level cleanup path.

Evaluation before implementation:

- Hidden-detail cleanup search made targets discoverable, but resolving one
  target still required opening the entry, clearing the hidden value in the
  editor, saving, and returning to cleanup.
- Bulk clear was too broad when the user had searched for one field or one
  entry and wanted to resolve only that row.

Root cause and best path:

- Root cause: cleanup rows were review/navigation surfaces only; the only
  persisted cleanup operation was all-hidden bulk cleanup.
- The best path was to add one shared row-level mutation and surface it on both
  browser and mobile cleanup rows with singular confirmation, rather than
  creating a separate cleanup page or changing editor behavior.

Re-evaluation after implementation:

- Users can now clear a single hidden value directly from the cleanup list or
  still open the entry when they need context before editing.
- The mutation no-ops for stale rows or active fields, so the cleanup action is
  scoped to actual hidden details.
- No further hidden-detail cleanup workflow gap was found in this pass.

### Completed Slice: Hidden Detail Row Action Accessibility

Status: completed on 2026-07-06.

What changed:

- Shared hidden-detail cleanup row models now include a row-specific clear
  action label and accessible name.
- Browser Knowledge and mobile More keep the compact visible `Clear Detail`
  label while exposing row-specific accessible labels such as `Clear hidden
detail Power from Glass Key`.
- Core, browser render, and mobile render coverage now verify the shared row
  action labels.

Evaluation before implementation:

- Row-level cleanup removed the open-edit-save loop, but repeated `Clear
Detail` buttons were ambiguous when several cleanup rows were visible.
- The ambiguity mattered most for keyboard and screen-reader navigation, where
  users encounter controls independently from surrounding row text.

Root cause and best path:

- Root cause: the row action copy was hardcoded in browser and mobile instead
  of modeled as part of the shared cleanup row.
- The best path was to add the accessible name to the shared model and consume
  it in both renderers.

Re-evaluation after implementation:

- Visible cleanup rows remain compact for scan speed.
- Assistive technology receives entry and field context for each row action.
- No further cleanup-row accessibility gap was found in this pass.

### Completed Slice: Hidden Detail Mobile Confirmation Specificity

Status: completed on 2026-07-06.

What changed:

- Mobile destructive confirmation helpers now accept an optional subject name
  and format the dialog title through the shared destructive-action title
  helper.
- Mobile More row-level hidden-detail cleanup now confirms the specific field
  and entry, matching the browser Knowledge confirmation title.
- Shared destructive-copy coverage verifies the singular hidden-detail title
  format.

Evaluation before implementation:

- Browser row-level cleanup confirmation named the target row, but mobile used
  only the generic `Clear Hidden Detail` title.
- That mismatch made mobile cleanup slightly less confident for users resolving
  several hidden values in sequence.

Root cause and best path:

- Root cause: the mobile confirmation helper accepted only an action id, while
  browser confirmation already carried a row-specific title.
- The best path was to extend the mobile helper with an optional subject name
  and keep all action copy in the shared destructive-action model.

Re-evaluation after implementation:

- Browser and mobile now both confirm row-level cleanup with field and entry
  context.
- Existing mobile confirmations without subjects continue using their shared
  default titles.
- No further row-level confirmation clarity gap was found in this pass.

### Completed Slice: Mobile Destructive Confirmation Context

Status: completed on 2026-07-06.

What changed:

- Mobile destructive confirmations now pass subject names for entry deletion,
  relationship deletion, custom field removal, custom entry type deletion,
  workspace deletion, in-fiction world deletion, and recovery snapshot
  deletion.
- The mobile destructive confirmation presenter now has focused tests for both
  default titles and subject-specific titles.
- Existing broad document replacement confirmations keep their generic titles
  because the subject is the current local document, import, reset, or restore
  operation rather than one row.

Evaluation before implementation:

- The row-level hidden-detail cleanup confirmation had been made specific, but
  other mobile destructive actions still used generic titles such as `Delete
Entry` or `Delete Workspace`.
- That created extra confirmation cost because users had to infer the target
  from the screen behind the native alert.

Root cause and best path:

- Root cause: mobile callers originally supplied only the destructive action id
  even when they already had the target name in local scope.
- The best path was to pass existing target names into the shared confirmation
  helper, avoiding new state or screen-specific confirmation copy.

Re-evaluation after implementation:

- Mobile destructive confirmations now name the affected record, relationship,
  schema item, workspace, world, or recovery snapshot when the caller has that
  context.
- Generic confirmations remain appropriate for import and reset operations.
- No further high-impact mobile destructive confirmation context gap was found
  in this pass.

### Completed Slice: Recovery Snapshot Confirmation Context

Status: completed on 2026-07-06.

What changed:

- Browser Data recovery snapshot restore and delete confirmations now name the
  snapshot reason and active world.
- Mobile Data restore and delete snapshot confirmations now use the same
  subject-specific title pattern.
- Shared destructive-title coverage now verifies restore/delete snapshot
  subject formatting.

Evaluation before implementation:

- Mobile destructive confirmations were improved for row-level actions, but
  recovery snapshot restore still used a generic confirmation title despite
  being initiated from a specific snapshot row.
- Browser Data also stored only the snapshot id for confirmation, so restore
  and delete dialogs named a generic `recovery snapshot` instead of the row the
  user selected.

Root cause and best path:

- Root cause: the snapshot row subject was displayed in the list but was not
  carried into pending confirmation state or the mobile confirmation helper.
- The best path was to reuse the existing snapshot row model values and pass a
  compact subject string into the shared destructive-title formatter.

Re-evaluation after implementation:

- Restore and delete snapshot confirmations now identify the snapshot reason
  and active world on browser and mobile.
- Import and reset confirmations remain intentionally generic because they
  apply to the current document-level operation, not a selected row.
- No further recovery-snapshot confirmation specificity gap was found in this
  pass.

### Completed Slice: Recovery Snapshot Row Action Accessibility

Status: completed on 2026-07-06.

What changed:

- Shared Data recovery snapshot row models now include row-specific restore and
  delete accessible labels.
- Browser Data and mobile Data keep compact visible labels such as `Restore
Snapshot` and `Delete Snapshot` while exposing the snapshot reason and active
  world to assistive technology.
- Core Data model coverage now verifies the generated row action labels.

Evaluation before implementation:

- Snapshot restore/delete confirmations had been made specific, but repeated
  `Restore Snapshot` and `Delete Snapshot` buttons were still ambiguous before
  activation.
- This matched the earlier hidden-detail row action accessibility issue.

Root cause and best path:

- Root cause: the Data recovery row model exposed action labels and hints, but
  not row-specific accessible names.
- The best path was to add the labels to the shared model so browser and
  mobile stay aligned.

Re-evaluation after implementation:

- Users scanning with assistive technology can distinguish snapshot actions by
  reason and active world before choosing them.
- Visible labels remain short for dense repeated Data rows.
- No further recovery-snapshot row accessibility gap was found in this pass.

### Completed Slice: Recovery Snapshot Confirmation Subject Model

Status: completed on 2026-07-06.

What changed:

- Shared Data recovery snapshot rows now expose one `confirmationSubject` used
  by browser Data and mobile Data restore/delete confirmations.
- Restore/delete accessible labels derive from the same subject, keeping row
  action and confirmation wording aligned.
- Core Data model coverage now verifies the centralized subject text.

Evaluation before implementation:

- Browser and mobile both needed the same snapshot subject after confirmation
  titles became row-specific.
- Leaving the subject string duplicated in renderers would make future copy
  changes drift.

Root cause and best path:

- Root cause: the Data row model exposed the source parts but not the combined
  confirmation subject.
- The best path was to model the subject once in core and reuse it in both
  renderers.

Re-evaluation after implementation:

- Snapshot row accessibility labels and confirmation titles now share one
  model-owned subject.
- No further snapshot confirmation implementation drift was found in this pass.

### Completed Slice: Vocabulary Value Row Action Accessibility

Status: completed on 2026-07-06.

What changed:

- Shared Knowledge vocabulary value rows now include archive and restore
  accessible labels that name the value and owning vocabulary.
- Browser Knowledge and mobile More keep compact visible labels such as
  `Archive` and `Restore Monster` while exposing row-specific action names.
- Core, browser render, and mobile render coverage now verify the generated
  vocabulary value action labels.

Evaluation before implementation:

- Vocabulary Manager rows could contain many repeated `Archive` buttons, which
  made the control ambiguous when navigating by button name.
- Archived value restore labels included the value but not the owning
  vocabulary, which could become unclear as the number of vocabulary lists
  grows.

Root cause and best path:

- Root cause: vocabulary value row models carried value metadata but no action
  labels, leaving browser and mobile to use compact presentation text directly.
- The best path was to add action labels to the shared Knowledge model, derived
  from the vocabulary name and value label.

Re-evaluation after implementation:

- Repeated vocabulary row actions are now distinguishable by assistive
  technology on browser and mobile.
- Visible labels remain compact for dense vocabulary maintenance.
- No further vocabulary value row action accessibility gap was found in this
  pass.

### Completed Slice: Field Configuration Row Action Accessibility

Status: completed on 2026-07-06.

What changed:

- Shared Knowledge field rows now include row-specific accessible labels for
  saving field settings and resetting them to defaults.
- Browser Knowledge and mobile More keep compact visible labels such as `Save
Field Settings` and `Reset to Defaults` while exposing field and section
  context.
- Core, browser render, and mobile render coverage now verify the generated
  field configuration action labels.

Evaluation before implementation:

- Field Configuration can show many repeated `Save Field Settings` and `Reset
to Defaults` buttons.
- The visible row context helped sighted users, but button-only navigation did
  not identify which field and section the action affected.

Root cause and best path:

- Root cause: `KnowledgeFieldRow` described field metadata but did not model
  action labels for repeated field-setting commands.
- The best path was to add labels to the shared row model so browser and mobile
  stay consistent.

Re-evaluation after implementation:

- Repeated field-configuration actions are now distinguishable before
  activation on browser and mobile.
- Visible labels remain concise for dense schema editing.
- No further field-configuration row action accessibility gap was found in this
  pass.

### Completed Slice: Custom Field Order Row Action Accessibility

Status: completed on 2026-07-06.

What changed:

- Shared Knowledge field rows now include row-specific accessible labels for
  saving custom field labels, moving custom fields up/down, and removing custom
  fields.
- Browser Knowledge and mobile More now expose the custom field and owning
  entry type in repeated field-order actions.
- Remove-field confirmations now use the same field-and-entry-type subject on
  browser and mobile.
- Core, browser render, and mobile render coverage now verify the generated
  custom field order labels.

Evaluation before implementation:

- Custom entry type rows could show repeated `Move Up`, `Move Down`, and
  `Remove Field` actions.
- Browser also had repeated `Save Label` actions for custom field labels.
- Existing accessible names named the field in some cases, but did not
  consistently include the owning custom entry type or confirmation subject.

Root cause and best path:

- Root cause: custom field order actions reused local button copy instead of
  shared `KnowledgeFieldRow` action labels.
- The best path was to extend the shared row model with field-and-section
  action labels and a remove confirmation subject.

Re-evaluation after implementation:

- Custom field order actions are now distinguishable across browser and mobile
  before activation.
- Remove-field confirmation titles match the more specific row action context.
- No further custom field order row action accessibility gap was found in this
  pass.

### Completed Slice: Custom Type Add Fields Action Accessibility

Status: completed on 2026-07-06.

What changed:

- Shared Knowledge section rows now include a custom-type-specific accessible
  label for the repeated `Add Fields` action.
- Browser Knowledge and mobile More now expose the owning custom entry type in
  repeated add-fields buttons while keeping the visible button label compact.
- Core, browser render, and mobile render coverage now verify the generated
  `Add fields to Artifacts` action label.

Evaluation before implementation:

- Custom entry type setup can show the same `Add Fields` action for multiple
  user-defined entry types.
- The visible card context helped sighted users, but button-only navigation did
  not identify which custom type would receive the new fields.

Root cause and best path:

- Root cause: `KnowledgeSectionRow` described the entry type and fields but did
  not model action labels for repeated section-level commands.
- The best path was to add the section-level label to the shared Knowledge
  model and consume it in both browser and mobile surfaces.

Re-evaluation after implementation:

- Repeated add-fields actions are now distinguishable before activation on
  browser and mobile.
- Visible labels remain concise for dense custom type editing.
- No further custom type add-fields action accessibility gap was found in this
  pass.

### Completed Slice: Vocabulary Add Value Action Accessibility

Status: completed on 2026-07-06.

What changed:

- Shared Knowledge vocabulary rows now include a vocabulary-specific accessible
  label for the repeated `Add Value` action.
- Browser Knowledge and mobile More now expose the target vocabulary in
  repeated add-value buttons while preserving compact visible button copy.
- Core, browser render, and mobile render coverage now verify the generated
  `Add value to Character ancestry` action label.

Evaluation before implementation:

- The Vocabulary Manager can show multiple repeated `Add Value` actions, one
  for each reusable vocabulary row.
- Field labels already name the target vocabulary, but button-only navigation
  did not identify which vocabulary would receive the submitted value.

Root cause and best path:

- Root cause: `KnowledgeVocabularyRow` modeled vocabulary content and counts
  but not repeated row action labels.
- The best path was to add the label to the shared vocabulary row model so
  browser and mobile use the same target-specific action semantics.

Re-evaluation after implementation:

- Repeated vocabulary add-value actions are now distinguishable before
  activation on browser and mobile.
- Visible controls remain concise for dense vocabulary management.
- No further vocabulary add-value action accessibility gap was found in this
  pass.

### Completed Slice: Vocabulary Value Edit Action Accessibility

Status: completed on 2026-07-06.

What changed:

- Shared Knowledge vocabulary value rows now include target-specific accessible
  labels for `Save Value`, `Move Up`, and `Move Down`.
- Browser Knowledge and mobile More now expose both the vocabulary value and
  owning vocabulary in repeated saved-value actions.
- Core, browser render, and mobile render coverage now verify the generated
  `Save Human in Character ancestry`, `Move Human up in Character ancestry`,
  and `Move Human down in Character ancestry` action labels.

Evaluation before implementation:

- The Vocabulary Manager can show multiple saved value rows, each with repeated
  `Save Value`, `Move Up`, and `Move Down` controls.
- Archive and restore actions were already target-specific, but save and
  ordering actions were not consistently tied to the owning vocabulary.

Root cause and best path:

- Root cause: vocabulary value rows modeled archive/restore labels but left save
  and ordering labels to local UI strings.
- The best path was to extend `KnowledgeVocabularyValueRow` so all repeated
  saved-value actions share the same vocabulary-aware labels across platforms.

Re-evaluation after implementation:

- Repeated saved-value edit and ordering actions are now distinguishable before
  activation on browser and mobile.
- The visible action copy stays short enough for dense row editing.
- No further vocabulary saved-value action accessibility gap was found in this
  pass.

### Completed Slice: Vocabulary Value Edit Field Label Alignment

Status: completed on 2026-07-06.

What changed:

- Shared Knowledge vocabulary value rows now include target-specific edit field
  labels for value label, description, and aliases.
- Browser Knowledge now gives repeated saved-value inputs value-specific
  accessible names while keeping the dense visible labels compact.
- Mobile More now consumes the same shared edit field labels it previously
  constructed locally.
- Core and browser render coverage now verify the generated `Edit Human label`,
  `Edit Human description`, and `Edit Human aliases` labels; mobile render
  coverage already verifies the same visible labels.

Evaluation before implementation:

- Browser saved-value rows repeated generic `Label`, `Description`, and
  `Aliases` input labels for every vocabulary value.
- Mobile already used value-specific labels, which created an avoidable
  semantics gap between platforms.

Root cause and best path:

- Root cause: vocabulary value edit field labels were local UI copy instead of
  shared row model semantics.
- The best path was to add value-specific edit field labels to
  `KnowledgeVocabularyValueRow`, then consume them on browser and mobile.

Re-evaluation after implementation:

- Browser and mobile now expose the same value-specific edit field labels for
  saved vocabulary values.
- Browser retains compact visible row layout while improving keyboard and
  assistive-technology navigation.
- No further vocabulary saved-value edit field label gap was found in this pass.

### Completed Slice: Vocabulary New Value Field Label Alignment

Status: completed on 2026-07-06.

What changed:

- Shared Knowledge vocabulary rows now include vocabulary-specific labels for
  the new value, description, and aliases fields.
- Browser Knowledge now gives repeated new-value inputs vocabulary-specific
  accessible names while keeping the compact visible labels.
- Mobile More now consumes the same shared new-value field labels it previously
  constructed locally.
- Core, browser render, and mobile render coverage now verify the generated
  `New Character ancestry value`, `New Character ancestry description`, and
  `New Character ancestry aliases` labels.

Evaluation before implementation:

- Browser vocabulary rows repeated generic `New value`, `Description`, and
  `Aliases` labels for every vocabulary.
- Mobile already named the target vocabulary in those fields, so the browser
  experience lagged behind the mobile semantics.

Root cause and best path:

- Root cause: new-value field labels were local UI strings instead of shared
  vocabulary row semantics.
- The best path was to add vocabulary-specific labels to
  `KnowledgeVocabularyRow`, then consume them on browser and mobile.

Re-evaluation after implementation:

- Browser and mobile now expose the same vocabulary-specific new-value field
  labels.
- Browser keeps the dense visible layout while reducing ambiguity for repeated
  forms.
- No further vocabulary new-value field label gap was found in this pass.

### Completed Slice: Mobile Custom Field Rename Parity

Status: completed on 2026-07-06.

What changed:

- Shared Knowledge field rows now include a target-specific custom field rename
  label.
- Browser Knowledge now applies that shared label to repeated custom field
  rename inputs.
- Mobile More now supports renaming custom field labels from custom entry type
  rows, using the same shared rename label and existing shared `Save Label`
  action label.
- Core, browser render, and mobile render coverage now verify `Rename Origin in
Artifacts` and `Save Origin label in Artifacts`.

Evaluation before implementation:

- Browser supported renaming custom field labels, but mobile custom field rows
  only supported moving and removing fields.
- Browser rename inputs named the field but did not include the owning custom
  entry type, which could be ambiguous when different custom types shared field
  names.

Root cause and best path:

- Root cause: custom field rename semantics were local to the browser surface,
  while mobile had controller support but no inline workflow.
- The best path was to add a shared rename label to `KnowledgeFieldRow`, apply
  it to browser inputs, and add the mobile rename field plus save action using
  the existing controller method.

Re-evaluation after implementation:

- Browser and mobile now both support custom field label editing in the custom
  entry type workflow.
- Repeated rename and save-label controls identify both the field and owning
  custom type.
- No further custom field rename parity gap was found in this pass.

### Completed Slice: Custom Type Add Fields Input Label Alignment

Status: completed on 2026-07-06.

What changed:

- Shared Knowledge section rows now include a target-specific field label for
  adding fields to a custom entry type.
- Browser Knowledge now gives repeated add-fields inputs a custom-type-specific
  accessible name while keeping compact visible copy.
- Mobile More now consumes the same shared add-fields field label it previously
  constructed locally.
- Core coverage now verifies the generated `Add fields to Artifacts` field
  label alongside the existing browser and mobile render coverage for the same
  target-specific add-fields action.

Evaluation before implementation:

- Custom entry type cards can repeat the same add-fields form for several
  user-defined types.
- Browser had a target-specific submit button but the text input itself was
  still labelled generically as `Add fields`.
- Mobile already named the custom type in the field label, creating an
  unnecessary platform semantics gap.

Root cause and best path:

- Root cause: the add-fields input label was local UI copy rather than a shared
  `KnowledgeSectionRow` semantic.
- The best path was to model the label beside the existing section-level action
  label and consume it on browser and mobile.

Re-evaluation after implementation:

- Browser and mobile now expose the same custom-type-specific add-fields input
  label.
- Browser retains dense visible copy while reducing ambiguity for repeated
  forms.
- No further custom type add-fields input label gap was found in this pass.

### Completed Slice: Custom Type Delete Action Model Alignment

Status: completed on 2026-07-06.

What changed:

- Shared Knowledge section rows now include a custom-type delete accessible
  label and confirmation subject.
- Browser Knowledge and mobile More now consume the same shared delete action
  semantics instead of constructing parallel local strings.
- Core, browser render, and mobile render coverage now verify `Delete custom
entry type Artifacts`.

Evaluation before implementation:

- Custom entry type cards can repeat the same destructive `Delete Type` action.
- Browser and mobile both exposed target-specific labels, but each surface
  constructed them locally, making future copy drift likely.

Root cause and best path:

- Root cause: destructive custom type action semantics were not part of the
  shared `KnowledgeSectionRow` model.
- The best path was to model both the accessible label and confirmation subject
  with the section row so browser and mobile share one source of truth.

Re-evaluation after implementation:

- Browser and mobile now use the same target-specific destructive action label
  and confirmation subject for custom entry types.
- Visible button copy remains compact in dense custom type rows.
- No further custom type delete action semantics gap was found in this pass.

### Completed Slice: Custom Type Add Fields Preview Label Alignment

Status: completed on 2026-07-06.

What changed:

- Shared Knowledge section rows now include a target-specific label for
  add-fields draft previews.
- Browser Knowledge now consumes that shared preview label instead of
  constructing a local string.
- Mobile More now names the target custom type in the preview copy through the
  same shared label.
- Core coverage verifies `New Artifacts field preview`.

Evaluation before implementation:

- Browser add-fields previews were target-specific, but the label was built
  locally.
- Mobile preview copy was generic, which made repeated custom type cards less
  clear when users were editing multiple type definitions.

Root cause and best path:

- Root cause: add-fields preview semantics were not part of
  `KnowledgeSectionRow`, even though the field and submit action now were.
- The best path was to complete the add-fields form model by adding the preview
  label beside the existing field and action labels.

Re-evaluation after implementation:

- Browser and mobile now share the same target-specific add-fields preview
  label.
- The custom type add-fields workflow has shared semantics for input, preview,
  and submit action.
- No further custom type add-fields preview label gap was found in this pass.

### Completed Slice: Field Configuration Input Label Alignment

Status: completed on 2026-07-06.

What changed:

- Shared Knowledge field rows now include target-specific labels for field
  setting inputs: label, help text, display order, hidden state, vocabulary, and
  vocabulary mode.
- Browser Knowledge now applies those labels as accessible names for repeated
  field-setting controls while keeping compact visible labels.
- Mobile More now consumes the same shared field-setting labels it previously
  constructed locally.
- Core, browser render, and mobile render coverage now verify section-specific
  field-setting labels such as `Label for Character category in Characters`.

Evaluation before implementation:

- Browser Field Configuration rows repeated generic controls such as `Label`,
  `Help text`, `Display order`, and `Vocabulary`.
- Mobile labels named the field but were still locally constructed and did not
  include the owning entry type.
- Repeated field names across entry types could make field-setting navigation
  ambiguous.

Root cause and best path:

- Root cause: field-setting input labels were not part of the shared
  `KnowledgeFieldRow` contract.
- The best path was to move all field-setting labels into the shared row model
  and consume them on browser and mobile.

Re-evaluation after implementation:

- Browser and mobile now expose the same field-and-section-specific labels for
  Field Configuration controls.
- Browser retains the compact visible form layout while improving repeated-row
  navigation.
- No further field configuration input label gap was found in this pass.

### Completed Slice: Mobile Field Configuration Section Action Reduction

Status: completed on 2026-07-06.

What changed:

- Mobile More now shows the `Open {section}` navigation action once per Field
  Configuration section instead of repeating it inside every field row.
- Field-level save and reset controls remain attached to the specific field they
  affect.

Evaluation before implementation:

- Mobile Field Configuration repeated the same section navigation action for
  every field in a section.
- This increased scan cost and placed a destination-level action beside
  field-level save/reset actions, even though the destination did not change per
  field.

Root cause and best path:

- Root cause: the section navigation action was rendered inside the per-field
  loop.
- The best path was to move the action outside the field loop while keeping it
  within the same section block.

Re-evaluation after implementation:

- Mobile users still have a direct path from Field Configuration to the section
  workbench, but only once per section.
- Field rows are easier to scan because their action row now contains only
  field-specific commands.
- No further mobile Field Configuration repeated section-action gap was found
  in this pass.

### Completed Slice: Vocabulary Row Context Label Alignment

Status: completed on 2026-07-06.

What changed:

- Shared Knowledge vocabulary rows now include target-specific labels for value
  search, field usage, and archived value groups.
- Shared vocabulary field-usage rows now include an open-action label that
  names both the destination section and the vocabulary being configured.
- Browser Knowledge and mobile More now consume the same row context labels
  instead of constructing local strings.
- Core, browser render, and mobile render coverage now verify labels such as
  `Search Character ancestry values`, `Character ancestry field usage`, and
  `Open Characters fields using Character ancestry`.

Evaluation before implementation:

- Vocabulary Manager rows repeat search controls, usage summaries, archived
  value groups, and open-usage actions for each vocabulary.
- Browser had some target context in aria labels, mobile had some target context
  in visible labels, and both surfaces still constructed strings locally.
- The open-usage action only named the destination section, which could be
  ambiguous when several vocabularies are used by the same section.

Root cause and best path:

- Root cause: vocabulary row chrome semantics were split between browser and
  mobile instead of living in `KnowledgeVocabularyRow` and usage rows.
- The best path was to add shared labels for the repeated row chrome and
  consume them on both platforms.

Re-evaluation after implementation:

- Browser and mobile now expose the same vocabulary-specific search, usage,
  archived group, and open-usage context.
- The Vocabulary Manager is less ambiguous when several vocabularies share the
  same destination section.
- No further vocabulary row context label gap was found in this pass.

### Completed Slice: Vocabulary Row State Copy Specificity

Status: completed on 2026-07-06.

What changed:

- Shared Knowledge vocabulary rows now include vocabulary-specific empty and
  no-match text for active values.
- Shared Knowledge helpers now format hidden value counts with the vocabulary
  name, such as `1 more Character ancestry value.`
- Browser Knowledge and mobile More now consume the shared row-state copy.
- Mobile More now shows the no-active-values state for empty vocabularies rather
  than omitting row feedback.
- Core and mobile render coverage now verify the vocabulary-specific row-state
  copy.

Evaluation before implementation:

- Vocabulary rows could show repeated generic messages such as `No active
values`, `No active values match this search`, and `1 more value`.
- These messages were especially weak on mobile, where multiple vocabulary rows
  are stacked in one long scroll.

Root cause and best path:

- Root cause: empty, no-match, and hidden-count messages were local row UI copy
  instead of shared vocabulary-aware model text.
- The best path was to add shared row-state copy and a small hidden-count
  formatter, then consume them on both platforms.

Re-evaluation after implementation:

- Browser and mobile now name the affected vocabulary in empty, no-match, and
  hidden-count states.
- Mobile empty vocabulary rows now provide explicit feedback.
- No further vocabulary row-state copy gap was found in this pass.

### Completed Slice: Hidden Detail Review Action Accessibility

Status: completed on 2026-07-06.

What changed:

- Shared Knowledge hidden-detail cleanup rows now include a row-specific review
  action label and visible review label.
- Browser Knowledge and mobile More now expose the affected entry and hidden
  field in the repeated `Review Entry` action.
- Core, browser render, and mobile render coverage now verify `Review Glass Key
for hidden detail Power`.

Evaluation before implementation:

- Hidden Detail Cleanup rows already had target-specific destructive `Clear
Detail` actions.
- The non-destructive `Review Entry` action remained generic even though it
  repeats for every cleanup row.

Root cause and best path:

- Root cause: `KnowledgeHiddenDetailRow` modeled clear-action semantics but did
  not model the paired review-action semantics.
- The best path was to add the review action label to the same shared row model
  and consume it on both platforms.

Re-evaluation after implementation:

- Browser and mobile now identify the entry and hidden field before activating
  repeated cleanup review actions.
- Visible action copy remains compact for dense cleanup queues.
- No further hidden-detail review action accessibility gap was found in this
  pass.

### Completed Slice: Lore Definition Open Action Accessibility

Status: completed on 2026-07-06.

What changed:

- Shared Knowledge lore definition rows now include target-specific open action
  labels.
- Browser Knowledge and mobile More now expose the lore definition filter in
  repeated `Open Lore` actions.
- Core, browser render, and mobile render coverage now verify labels such as
  `Open Lore notes for Navigation practice`.

Evaluation before implementation:

- Lore Definition Types can list several observed lore categories, each with a
  repeated `Open Lore` action.
- The route already filtered Lore by the definition, but the action label did
  not tell users which definition would open.

Root cause and best path:

- Root cause: `KnowledgeLoreDefinitionRow` modeled the destination route but not
  the repeated action semantics.
- The best path was to add open action labels to the shared row model and
  consume them on both platforms.

Re-evaluation after implementation:

- Browser and mobile now identify the specific lore definition before
  activating repeated `Open Lore` actions.
- Visible button copy remains compact.
- No further lore definition open action accessibility gap was found in this
  pass.

### Completed Slice: Knowledge Open Navigation Label Alignment

Status: completed on 2026-07-06.

What changed:

- Shared Knowledge section rows now include target-specific open action labels
  for entry type navigation.
- Shared reusable knowledge destinations now include target-specific open action
  labels.
- Browser Knowledge and mobile More now consume the shared labels instead of
  constructing local `Open {title}` strings.
- Core, browser render, and mobile render coverage now verify labels such as
  `Open Artifacts records` and `Open Factions reusable knowledge`.

Evaluation before implementation:

- Knowledge and More repeated entry-type and reusable destination navigation
  actions across overview, custom type, field configuration, and reusable
  knowledge areas.
- Visible labels were acceptable, but accessible labels did not distinguish
  record-section navigation from reusable-knowledge navigation.
- Browser and mobile built the strings locally, leaving room for drift.

Root cause and best path:

- Root cause: open-navigation semantics were not part of
  `KnowledgeSectionRow` or `KnowledgeReusableDestination`.
- The best path was to move the labels into the shared model and consume them
  everywhere the row-level open actions render.

Re-evaluation after implementation:

- Browser and mobile now expose consistent target-specific navigation labels
  for Knowledge entry types and reusable destinations.
- The visible labels remain compact for dense navigation rows.
- No further Knowledge open-navigation label gap was found in this pass.

### Completed Slice: Knowledge Overview Shortcut Label Alignment

Status: completed on 2026-07-06.

What changed:

- Shared Knowledge type setup now includes an explicit open action accessible
  label.
- Shared Hidden Detail Cleanup summary now includes a review action label,
  accessible label, and route.
- Browser Knowledge and mobile More now consume the shared Type Setup and
  cleanup shortcut semantics instead of constructing local shortcut labels or
  routes.
- Core, browser render, and mobile render coverage now verify labels such as
  `Open Type Setup section` and `Review 6 hidden detail cleanup targets`.

Evaluation before implementation:

- Knowledge overview shortcuts routed users to specific setup and cleanup
  subsections, but the actions used generic local labels.
- Browser and mobile constructed the hidden cleanup route independently even
  though it is part of the shared Knowledge workflow model.

Root cause and best path:

- Root cause: overview shortcut semantics for Type Setup and cleanup were not
  modeled in the shared `KnowledgeSchemaModel`.
- The best path was to add the action labels and cleanup route to the shared
  model and consume them on both platforms.

Re-evaluation after implementation:

- Browser and mobile now expose the same target-specific shortcut labels for
  Knowledge setup and cleanup.
- Cleanup shortcuts include the current cleanup target count before activation.
- No further Knowledge overview shortcut label gap was found in this pass.

### Shared Timeline And Entry Row Actions Slice

Implementation completed:

- Added shared timeline event row labels to `TimelineEventItem` for opening an
  event, reviewing its context, moving it earlier/later, and labeling involved
  record groups.
- Added shared entry list row action labels to `EntryListItem` so browser and
  mobile list rows consume common edit/context copy instead of constructing it
  locally.
- Updated browser Timeline Overview table and era cards to consume shared
  timeline action labels and accessible names.
- Updated mobile Timeline Browser, Timeline Review, and section entry rows to
  consume shared event/list action labels.
- Added focused shared-model and mobile render coverage for the centralized
  action labels.

Evaluation before implementation:

- Timeline Browser and Timeline Overview rendered the same conceptual actions
  with platform-local labels such as `Edit`, `Open`, `Context`, and
  `Open Event`.
- Mobile Timeline Review target rows generated local event edit labels instead
  of reusing the event row model.
- Regular entry rows generated local edit/context labels even though the row
  model already determines the display record and section context.

Root cause and best path:

- Root cause: timeline and entry list models carried display content but not
  row-level command semantics, leaving each surface to invent its own labels.
- The best path was to centralize command labels in the existing shared row
  models instead of adding a new UI-only abstraction.

Re-evaluation after implementation:

- Timeline event row commands now use the same model-backed labels across the
  browser overview table, browser era cards, mobile timeline browser groups,
  and mobile timeline review targets.
- Entry list rows now expose shared edit/context labels for browser and mobile.
- Remaining local `Edit ...` and `Review context ...` strings are outside this
  slice: selected editor titles, Workbench queue rows, and relationship context
  actions. Those are separate workflow-specific models and should be evaluated
  independently before further changes.

### Shared Workbench Queue Row Actions Slice

Implementation completed:

- Added shared select, edit, and context-review command labels to
  `WorkbenchRecordIndexItem`.
- Updated browser Workbench record cards to use shared labels for the select and
  edit actions, including accessible names.
- Updated mobile routed Workbench queue rows to use shared edit/context labels
  instead of local string construction.
- Added focused core and mobile render coverage for the shared Workbench row
  command labels.

Evaluation before implementation:

- Workbench record rows already carried display text, routes, status, tags, and
  relationship counts, but not command semantics.
- Browser cards and mobile review queues rendered the same underlying record
  commands with local labels, increasing the cost of keeping web/mobile wording
  aligned.

Root cause and best path:

- Root cause: `WorkbenchRecordIndexItem` modeled where a record should go but
  not how row actions should be named.
- The best path was to extend the existing row model with command labels rather
  than create another per-platform wrapper.

Re-evaluation after implementation:

- Workbench queue actions are now consistent across browser cards and mobile
  routed queues.
- The selected-record editor title still intentionally says `Edit {name}`
  because it is an editor-state title, not a row command.
- Relationship context actions remain a separate relationship workflow slice.

### Shared Relationship Context Row Actions Slice

Implementation completed:

- Added shared context-review command labels to `EntryRelationshipItemModel`.
- Updated mobile selected-record relationship rows to consume shared
  relationship action labels.
- Updated browser relationship detail links with the same shared accessible
  action label.
- Added focused shared relationship model coverage; existing mobile context
  render coverage verifies the label on selected-record relationship rows.

Evaluation before implementation:

- Relationship detail rows already carried related-record identity, section,
  direction, type, and note, but mobile still constructed the context action
  label locally.
- Browser relationship links exposed the related record name visually but did
  not provide an action-specific accessible label.

Root cause and best path:

- Root cause: `EntryRelationshipItemModel` described the related record but not
  the row command used to review that record in context.
- The best path was to add the action label directly to the relationship item
  model and leave route construction in the existing platform navigation layer.

Re-evaluation after implementation:

- Browser and mobile relationship detail rows now share the same context-review
  action wording.
- The model change is limited to relationship rows and does not affect
  relationship editor or graph workflows.

### Shared Editor Suggestion Action Labels Slice

Implementation completed:

- Added shared suggestion action metadata to entry editor detail field models
  while preserving the raw suggestion list used by browser datalist
  autocomplete.
- Added shared field-specific accessible names to canonical vocabulary
  replacement actions.
- Updated browser entry and Timeline editors to consume shared suggestion and
  canonical replacement action labels.
- Updated mobile entry and Timeline editors to consume the same shared action
  labels instead of rendering bare suggestion values.
- Added focused core and mobile render coverage for suggestion actions and
  canonical replacement labels.

Evaluation before implementation:

- Browser visible suggestion buttons generated field-specific labels locally,
  while mobile suggestion actions only exposed the value label.
- Canonical replacement actions had useful visible text but no shared
  field-specific accessible label.
- The shared editor model already knew the field label and suggestion values,
  so reconstructing action names in renderers was unnecessary duplication.

Root cause and best path:

- Root cause: `EntryEditorDetailFieldModel` exposed suggestion strings rather
  than command models, leaving each platform to infer action semantics.
- The best path was to add additive `suggestionActions` metadata and canonical
  replacement accessibility labels without removing raw suggestions needed for
  browser datalist behavior.

Re-evaluation after implementation:

- Browser and mobile now use the same field-specific action labels for visible
  suggestions and canonical replacement.
- Existing typed input, datalist autocomplete, suggestion caps, and hidden
  suggestion cues are unchanged.
- No additional editor suggestion action-label gap was found in this pass.

### Shared Relationship Text Review Suggestion Actions Slice

Implementation completed:

- Added shared visible and accessible labels to relationship text review
  suggestion targets.
- Updated browser section relationship-text review buttons to consume the
  shared suggestion action labels.
- Updated mobile relationship-text review suggestion buttons to consume the
  same shared labels.
- Added focused core and mobile render coverage for suggested legacy-link
  migration actions.

Evaluation before implementation:

- Relationship text review already modeled unresolved fragments and candidate
  target records, but browser and mobile still constructed `Link ...` action
  labels locally.
- This repeated copy in a cleanup workflow where accurate fragment-to-target
  wording is important before mutating saved links.

Root cause and best path:

- Root cause: `RelationshipTextReviewItem.suggestedTargets` represented target
  identity but not the command users invoke for that target.
- The best path was to add additive action labels to each suggested target and
  leave migration inputs unchanged, since migration still needs the fragment and
  target id.

Re-evaluation after implementation:

- Browser and mobile now share the same action labels for fuzzy legacy-link
  migration suggestions.
- Exact-match migration, batch migration, and relationship text parsing are
  unchanged.
- No additional relationship text review suggestion-label gap was found in this
  pass.

### Shared Entry Editor Heading Slice

Implementation completed:

- Added a shared entry editor title helper for normal entry edit/create
  headings.
- Updated browser Workbench inline editor headings to use the shared helper.
- Updated mobile entry edit mode headings to use the same helper.
- Added focused core coverage for edit and new-entry heading output.

Evaluation before implementation:

- Browser Workbench and mobile entry edit mode both generated `Edit {name}` or
  `New {type}` headings locally.
- Core already owned adjacent editor copy such as create titles, new titles, and
  submit labels, so leaving this heading copy in renderers was unnecessary
  duplication.

Root cause and best path:

- Root cause: normal entry editor heading copy had not been extracted with the
  rest of the editor labels.
- The best path was a small shared helper in `codexEntries` and targeted
  renderer adoption, leaving Timeline's specialized editor title model
  unchanged.

Re-evaluation after implementation:

- Browser Workbench and mobile entry edit mode now share the same normal entry
  editor heading logic.
- Timeline editor headings remain separate because Timeline has its own
  event-specific editor model.
- No additional normal entry editor heading gap was found in this pass.

### Shared Browser Save Button Model Slice

Implementation completed:

- Added a shared browser local save button model that returns the visible label,
  accessible label, and disabled state from the local save state.
- Updated the browser app shell Save button to consume the shared model instead
  of owning separate local helper/copy logic.
- Added focused core coverage for saved, dirty, and failed save-button states.

Evaluation before implementation:

- Core already owned local save status labels, details, tones, and persistence
  target copy, but the browser app shell still generated the Save button label
  and accessible name locally.
- That left the most visible browser persistence affordance split between core
  and the shell component.

Root cause and best path:

- Root cause: `getLocalSaveStatusModel` described the status display but not the
  adjacent manual save command.
- The best path was a small additive `getLocalSaveButtonModel` helper in
  `saveStatus`, preserving the current button behavior while centralizing
  command copy.

Re-evaluation after implementation:

- Browser save button text, disabled state, and accessible label now come from
  the same shared save-state model as the status messaging.
- Mobile device save messaging is unchanged because it uses a different
  automatic-save feedback model.
- No additional browser save-button copy gap was found in this pass.

### Shared Header Data Menu Copy Slice

Implementation completed:

- Added shared compact Data shell menu copy for the browser header trigger,
  menu accessible name, import action, and unavailable-download fallback.
- Added a shared header download-result formatter that keeps success and
  fallback messages out of the App shell.
- Updated the browser header Data menu to consume the shared copy while keeping
  the existing export shortcut behavior.
- Added focused core coverage for the menu copy and header download-result
  formatter.

Evaluation before implementation:

- The browser header Data menu already used shared export shortcut metadata,
  but still owned its menu labels and download-unavailable fallback locally.
- The richer Data page has separate export/import copy, so the compact header
  menu needed its own small shared shell copy rather than reusing page-specific
  text.

Root cause and best path:

- Root cause: `dataShellExportActions` centralized only the export shortcut
  rows, not the menu chrome or header-specific feedback.
- The best path was to add a narrow `dataShellMenuCopy` plus a result formatter
  in the shared data feature model and leave Data page behavior unchanged.

Re-evaluation after implementation:

- Header Data menu labels and unavailable-download feedback now come from the
  shared data model.
- Data page export, import, diagnostics, and reset copy remain unchanged.
- No additional compact Data menu copy gap was found in this pass.

### Shared Relationship Management Action Label Slice

Implementation completed:

- Added a shared relationship management accessible-label helper for selected
  entry link-management actions.
- Updated browser entry relationship detail links to use the shared
  action-specific accessible label.
- Updated mobile selected-record relationship rows to use the same shared label
  for the Manage Links action.
- Added focused core coverage for the shared label.

Evaluation before implementation:

- The visible `Manage Links` label was already shared, but mobile generated the
  selected-record accessible label locally and browser relationship detail links
  did not expose action-specific wording.
- This left a small but visible drift point in the selected-record relationship
  workflow.

Root cause and best path:

- Root cause: relationship feature copy named the action, but no shared helper
  combined that action with the selected entry name.
- The best path was a narrow helper in `codexRelationships` consumed by both
  browser and mobile, without changing relationship routes or editor behavior.

Re-evaluation after implementation:

- Browser and mobile selected-record relationship management actions now share
  the same per-entry accessible label.
- Relationship detail row context actions remain covered by
  `EntryRelationshipItemModel`.
- No additional relationship management action-label gap was found in this
  pass.

### Shared Entry Create Action Label Slice

Implementation completed:

- Added a shared create-label field to Workbench section actions.
- Updated browser Workbench create buttons to consume the shared section action
  label.
- Updated mobile Entries section create action to use the shared entry editor
  new-title helper.
- Added focused core coverage for the Workbench section create label.

Evaluation before implementation:

- Browser Workbench and mobile Entries both rendered `New {type}` actions from
  local string templates.
- Core already owned `New {type}` editor heading copy, and Workbench section
  actions already represented section-level create routes.

Root cause and best path:

- Root cause: Workbench section actions exposed the create route and singular
  label but not the actual command label.
- The best path was to add `createLabel` to `WorkbenchSectionAction` and reuse
  the existing entry new-title helper for the mobile section action.

Re-evaluation after implementation:

- Browser Workbench and mobile Entries now use shared create-action wording.
- Existing routes, draft reset behavior, and contextual Timeline create flows
  are unchanged.
- No additional entry create-action label gap was found in this pass.

### Shared Vocabulary Usage And Restore Action Label Slice

Implementation completed:

- Added shared visible labels for vocabulary field-usage open actions and
  archived vocabulary value restore actions.
- Updated browser Knowledge vocabulary controls to consume the shared action
  labels.
- Updated mobile More vocabulary controls to consume the shared action labels.
- Added focused core coverage for the new vocabulary row label contract.

Evaluation before implementation:

- Browser Knowledge and mobile More both composed `Open {section}` and
  `Restore {value}` labels locally while core already owned the matching
  accessibility labels and routing context.
- This duplicated vocabulary action copy across platforms and made future
  wording or route-context changes more expensive.

Root cause and best path:

- Root cause: the vocabulary row models exposed accessibility labels but not
  the visible command labels that the controls render.
- The best path was to add narrow `openLabel` and `restoreLabel` fields to the
  existing vocabulary row models, without changing vocabulary schema,
  persistence, or route behavior.

Re-evaluation after implementation:

- Browser and mobile vocabulary usage and restore controls now use the same
  shared labels.
- The vocabulary manager still keeps compact value review, archive, restore,
  and field-usage workflows unchanged.
- No additional vocabulary usage or restore label gap was found in this pass.

### Shared Vocabulary Value Expansion Label Slice

Implementation completed:

- Added shared Show All and Show Fewer value-expansion labels to Knowledge
  vocabulary rows.
- Updated browser Knowledge vocabulary expansion controls to consume the shared
  row labels.
- Updated mobile More vocabulary expansion controls to consume the same shared
  row labels.
- Added focused core coverage for the vocabulary expansion label contract.

Evaluation before implementation:

- Browser Knowledge and mobile More both composed `Show All {vocabulary}
Values` and `Show Fewer {vocabulary} Values` locally.
- The row model already owned the vocabulary name, count summary, field usage,
  and other vocabulary control labels, so expansion copy was an isolated
  remaining drift point.

Root cause and best path:

- Root cause: value expansion was added after the vocabulary row model and kept
  its visible action labels inside the platform renderers.
- The best path was to add two narrow labels to `KnowledgeVocabularyRow` rather
  than introduce a broad expansion-control abstraction before the repeated
  cases converge on one interaction model.

Re-evaluation after implementation:

- Browser and mobile vocabulary value expansion controls now share their
  visible labels through the Knowledge model.
- Existing compact limits, expanded state, search filtering, and archive/restore
  controls remain unchanged.
- No additional Knowledge vocabulary expansion-label gap was found in this
  pass.

### Shared Relationship Review Expansion Label Slice

Implementation completed:

- Added a shared expansion-control label formatter to the feature display limit
  helpers.
- Updated browser Relationship Studio Review orphaned-record, duplicate-group,
  and legacy-text expansion controls to use the shared formatter.
- Updated mobile Relationship Studio Review expansion controls to use the same
  formatter.
- Added focused core coverage for collapsed, expanded, and defensive count
  formatting.

Evaluation before implementation:

- Browser and mobile Relationship Studio Review used identical local templates
  for `Show {count} More ...` and `Show Fewer ...` controls.
- The hidden count and expanded state remain platform-local because each
  renderer owns its display limit and compact-list state.

Root cause and best path:

- Root cause: expansion behavior was added independently to browser and mobile
  review sections after display-limit helpers existed.
- The best path was a shared formatter in `featureDisplayLimits`, not a review
  model field, because the label depends on local list expansion state rather
  than persisted relationship data.

Re-evaluation after implementation:

- Browser and mobile Relationship Studio Review now share expansion-control
  wording while keeping their current compact-list limits.
- The formatter is reusable for future capped-list controls without forcing a
  common component across web and React Native.
- No additional Relationship Studio Review expansion-label gap was found in
  this pass.

### Shared Workspace Expansion Label Slice

Implementation completed:

- Updated browser Workspaces workspace and in-fiction-world expansion controls
  to use the shared expansion-label formatter.
- Updated mobile Workspaces expansion controls to use the same formatter.
- Reused the existing display-limit formatter coverage instead of adding
  platform-specific copy tests.

Evaluation before implementation:

- Browser and mobile Workspaces used identical local `Show {count} More ...`
  and `Show Fewer ...` templates for workspace lists.
- The workspace feature model already owns list counts and compact limits, but
  the expanded state remains local to each renderer.

Root cause and best path:

- Root cause: Workspaces list expansion was implemented before a reusable
  expansion-label formatter existed.
- The best path was formatter adoption in both renderers because no schema,
  route, persistence, or workspace model behavior needed to change.

Re-evaluation after implementation:

- Browser and mobile Workspaces now share expansion-control wording for both
  workspace and in-fiction-world lists.
- Existing list caps, selection behavior, archive rules, and forms remain
  unchanged.
- No additional Workspaces expansion-label gap was found in this pass.

### Shared Capped-List Expansion Label Adoption Slice

Implementation completed:

- Extended the shared expansion-control formatter with an optional singular
  collapsed label for one-item overflow cases.
- Updated browser Workbench drafting-prompt and section legacy-text controls to
  use the shared formatter.
- Updated mobile Entries Timeline, relationship text review, record index, and
  Workbench prompt controls to use the shared formatter.
- Updated mobile More schema, relationship-field, field-configuration,
  vocabulary-row, and hidden-detail cleanup controls to use the shared
  formatter.
- Updated mobile Relationships graph, entry picker, and relationship-link
  controls to use the shared formatter.
- Added singular collapsed labels across formatter consumers so one hidden item
  reads as `Show 1 More {singular item}` instead of an awkward plural.
- Added focused formatter coverage for singular collapsed overflow text.

Evaluation before implementation:

- After the first formatter slices, remaining browser and mobile capped-list
  controls still repeated the same `Show {count} More ...` and `Show Fewer ...`
  templates locally.
- Most cases used plural labels, which produced awkward one-count copy such as
  `Show 1 More Duplicate Groups`; hidden-detail cleanup also needed to preserve
  its existing singular row copy.

Root cause and best path:

- Root cause: capped-list expansion was implemented incrementally across
  Workbench, Timeline, Knowledge/More, Relationships, and section review before
  a shared formatter existed.
- The best path was broad formatter adoption for identical expansion controls,
  plus a small singular-label option, while leaving model-owned `Show All`
  vocabulary labels and relationship-field preferred-target labels untouched.

Re-evaluation after implementation:

- Browser and mobile capped-list controls now share expansion wording wherever
  the interaction follows the count-based Show More/Show Fewer pattern.
- Single hidden records, groups, rows, prompts, fields, worlds, links, and
  cleanup rows now use grammatically correct collapsed copy.
- Remaining expansion-label matches are deliberate model/test strings or
  relationship-field labels already generated in core.

### Shared Vocabulary Command Label Slice

Implementation completed:

- Added shared visible command labels for vocabulary value save, move up, move
  down, archive, and add-value actions.
- Updated browser Knowledge Vocabulary Manager controls to consume the shared
  labels.
- Updated mobile More Vocabulary Manager controls to consume the same shared
  labels.
- Added focused Knowledge schema coverage for the new command-label contract.

Evaluation before implementation:

- Browser Knowledge and mobile More both rendered the same vocabulary command
  labels locally while the shared row model already owned the corresponding
  accessibility labels and action context.
- This left the durable Vocabulary Manager with duplicated command copy after
  usage, restore, and expansion labels had already been centralized.

Root cause and best path:

- Root cause: the Vocabulary Manager initially added visible button text in the
  platform renderers while only action-specific accessibility labels were added
  to the core row model.
- The best path was to add narrow visible labels to `KnowledgeVocabularyRow`
  and `KnowledgeVocabularyValueRow`, without changing vocabulary persistence,
  mutation helpers, or control behavior.

Re-evaluation after implementation:

- Browser and mobile vocabulary maintenance controls now share command labels
  for add, save, move, archive, restore, open, and expansion workflows.
- The remaining hardcoded Vocabulary Manager copy is field/help text or
  layout-specific guidance rather than duplicated action labels.
- No additional vocabulary command-label gap was found in this pass.

### Shared Field Configuration Command Label Slice

Implementation completed:

- Added shared visible command labels for Field Configuration save and reset
  actions.
- Updated browser Knowledge Field Configuration controls to consume the shared
  labels.
- Updated mobile More Field Configuration controls to consume the same shared
  labels.
- Added focused Knowledge schema coverage for the new field command-label
  contract.

Evaluation before implementation:

- Browser Knowledge and mobile More both hardcoded `Save Field Settings` and
  `Reset to Defaults` while the shared `KnowledgeFieldRow` already owned the
  action-specific accessibility labels.
- This duplicated schema-maintenance action copy across the two platform
  surfaces after vocabulary action labels had been centralized.

Root cause and best path:

- Root cause: the Field Configuration slice added accessibility labels to the
  core field row model but left visible button labels in the platform renderers.
- The best path was to add narrow `saveSettingsLabel` and `resetSettingsLabel`
  fields to `KnowledgeFieldRow`, without changing schema override persistence or
  save/reset behavior.

Re-evaluation after implementation:

- Browser and mobile Field Configuration save/reset controls now share visible
  command labels and accessibility context through the same row model.
- Existing field override drafts, validation, save, reset, and mobile
  controller flows remain unchanged.
- No additional Field Configuration command-label gap was found in this pass.

### Shared Archived Empty-State Recovery Slice

Implementation completed:

- Added a shared archived-recovery action label to the entry list empty-state
  model.
- Updated browser Section empty states to render the shared archived-recovery
  label instead of hardcoded copy.
- Added the missing mobile Entries archived-only empty-state recovery action
  using the same shared label.
- Added focused mobile render coverage for the archived-only empty-state action.

Evaluation before implementation:

- The shared empty-state model already identified when a section only contained
  archived entries, but it exposed only a boolean action flag.
- Browser rendered a local `Show Archived` button, while mobile showed the
  empty-state message without the recovery action.

Root cause and best path:

- Root cause: the empty-state model described the state but did not fully model
  the recovery command, leaving one platform to hardcode it and the other to
  omit it.
- The best path was to add the action label to `EntryListEmptyStateModel` and
  render the action in both platform surfaces without changing filters,
  persistence, or archive behavior.

Re-evaluation after implementation:

- Browser and mobile now both give users a direct recovery path when a section
  has only archived records.
- The action still uses existing `showArchived` state, so archived record
  rendering and restore workflows remain unchanged.
- No additional archived empty-state recovery gap was found in this pass.

### Shared Hidden Detail Clear-All Label Slice

Implementation completed:

- Added a shared hidden-detail clear-all action label to the Knowledge schema
  model, sourced from the existing destructive-action copy.
- Updated browser Knowledge Hidden Detail Cleanup to consume the shared label.
- Updated mobile More Hidden Detail Cleanup to consume the same shared label.
- Added focused Knowledge schema coverage for the new hidden-detail action
  label.

Evaluation before implementation:

- Browser Knowledge and mobile More both hardcoded `Clear All Hidden Details`
  while destructive-action copy already owned the confirmation label for the
  same workflow.
- The Knowledge schema model already owned hidden-detail cleanup titles, detail
  copy, review action labels, and row actions, so clear-all was the remaining
  action-label drift in that section.

Root cause and best path:

- Root cause: destructive confirmation copy had been centralized, but the
  pre-confirm button label stayed in platform renderers.
- The best path was to expose the destructive action's confirm label through the
  hidden-detail model, preserving the existing confirmation flow and mutation
  behavior.

Re-evaluation after implementation:

- Browser and mobile hidden-detail cleanup surfaces now share clear-all action
  wording through the Knowledge model.
- The destructive confirmation dialog still uses the same destructive-action
  copy, so pre-confirm and confirm labels remain aligned.
- No additional hidden-detail clear-all label gap was found in this pass.

### Shared Relationship Hidden Count Text Slice

Implementation completed:

- Added a shared hidden-count helper for compact list overflow text.
- Updated browser Relationship Studio Review orphaned-record, duplicate-group,
  and legacy-text hidden-count text to use the shared helper.
- Updated mobile Relationship Studio Review hidden-count text to use the same
  helper.
- Updated browser and mobile section-scoped legacy-text review hidden-count text
  to use the helper.
- Added focused helper coverage for singular, plural, and defensive count
  formatting.

Evaluation before implementation:

- Expansion-control labels were centralized, but the adjacent hidden-count
  helper text still repeated local pluralization logic across browser and
  mobile review surfaces.
- Relationship review had the densest duplication and the highest risk of copy
  drift because orphaned records, duplicate groups, and legacy text items appear
  in both platform implementations.

Root cause and best path:

- Root cause: capped-list controls gained a shared action-label formatter before
  the passive hidden-count text had an equivalent helper.
- The best path was a small `formatHiddenCountText` helper in
  `featureDisplayLimits`, adopted first by relationship review surfaces without
  changing display limits or expansion state.

Re-evaluation after implementation:

- Browser and mobile relationship review hidden-count text now shares singular
  and plural formatting.
- Section-scoped legacy-text review now matches Relationship Studio copy.
- Additional non-relationship capped-list helper text can adopt the same helper
  in later slices without broad behavior changes.

### Shared Capped-List Hidden Count Text Adoption Slice

Implementation completed:

- Applied the shared hidden-count helper to the remaining compact overflow text
  in mobile Entries Timeline, Workbench queues, record lists, and drafting
  prompts.
- Applied the helper to mobile More schema and relationship-backed field
  overflow text.
- Applied the helper to mobile Relationships graph, entry picker, and saved link
  overflow text.
- Applied the helper to browser Workbench drafting prompts and browser/mobile
  Workspaces workspace and in-fiction-world overflow text.
- Verified that the previous local `N more ...` constructions are no longer
  present in the target platform surfaces.

Evaluation before implementation:

- Relationship review hidden-count text was centralized first, but the same
  passive overflow pattern remained in other capped-list workflows.
- These labels sit beside controls that already use the shared expansion
  formatter, so leaving the passive text local would keep copy and pluralization
  split across implementations.

Root cause and best path:

- Root cause: capped-list helper text grew organically in each screen before
  display-limit copy helpers existed.
- The best path was to adopt the existing `formatHiddenCountText` helper across
  identical passive overflow labels while preserving list limits, expansion
  state, and platform layout.

Re-evaluation after implementation:

- Capped-list passive overflow text now shares singular and plural formatting
  across Workbench, Entries, More, Relationships, and Workspaces surfaces.
- Expansion controls and passive count text now use companion helpers from the
  same display-limit module.
- No remaining local hidden-count construction was found in the target browser
  and mobile screens after the adoption scan.

### Shared Staged Link Panel Model Slice

Implementation completed:

- Added shared staged relationship panel copy, duplicate detection, and row
  summary modeling to the entry draft transaction helpers.
- Updated browser entry create-and-link staging to use the shared panel labels,
  duplicate feedback, row summary, and target-specific remove accessibility
  label; duplicate staged links now disable the browser staging action before a
  redundant click.
- Updated mobile Workbench create-and-link staging to use the same shared model
  while preserving the mobile disabled-button duplicate cue.
- Added focused core coverage for staged panel copy, normalized duplicate
  detection, row summaries, and remove accessibility labels.

Evaluation before implementation:

- Browser and mobile both supported staged relationship links, but the panel
  labels, placeholders, duplicate message, row summary, and remove action copy
  were defined separately in each renderer.
- The transaction layer already owned staged relationship identity,
  normalization, validation, and commit behavior, so leaving the interaction
  copy outside that layer created an avoidable parity drift point.

Root cause and best path:

- Root cause: staged link UX was added after the transaction model, with each
  platform composing its own local labels around the same shared draft data.
- The best path was a narrow shared model in `entryDraftTransactions` rather
  than a cross-platform component, because web and React Native still render
  the controls differently.

Re-evaluation after implementation:

- Browser and mobile staged-link panels now share visible copy, duplicate
  detection semantics, row summary copy, and target-specific remove
  accessibility labels.
- Browser and mobile now both prevent duplicate staged-link submission before
  commit while still relying on transaction-level duplicate normalization as a
  final safeguard.
- The existing staged draft transaction, save behavior, duplicate normalization,
  and platform-specific interaction style remain unchanged.
- No additional staged-link panel copy or row-action parity gap was found after
  scanning the touched browser, mobile, core, and test files.

### Shared Workbench Context Copy Slice

Implementation completed:

- Added shared selected-record context labels to the Workbench record model for
  section/status/relationship/completeness metadata, summary fallback,
  review-summary heading, drafting-prompts heading, linked-records heading,
  edit-record action, back-to-index action, and empty-state copy.
- Updated browser Workbench selected context to consume the shared labels and
  align its primary edit action with the mobile `Edit Record` command.
- Updated mobile Workbench Context mode to consume the same shared labels while
  preserving the mobile-only Back to Index action.
- Added focused core coverage for the selected context copy contract and
  tightened mobile render coverage so the context action can have an edit
  accessibility label without rendering the full editor form.

Evaluation before implementation:

- Browser and mobile both rendered the same selected-record context workflow,
  but headings, metadata labels, summary fallback, and the primary edit action
  were composed locally.
- Browser used `Open Editor` while mobile used `Edit Record`, adding an
  unnecessary cross-platform vocabulary difference for the same action.

Root cause and best path:

- Root cause: the shared Workbench selected context model owned the selected
  record, relationships, review summary, and routes, but not the interaction
  copy around those values.
- The best path was to add narrow context labels to the existing model rather
  than introduce a shared component, because browser and mobile layouts remain
  intentionally different.

Re-evaluation after implementation:

- Browser and mobile selected-record context now share the same copy contract
  for the context metadata and edit action.
- Mobile still keeps its platform-specific Back to Index action, but the label
  is now owned by the shared context model.
- No further Workbench context action-label or metadata-label parity gap was
  found after scanning the Workbench browser page, mobile Entries screen, core
  Workbench model, and focused tests.

### Shared Broken Relationship Action Accessibility Slice

Implementation completed:

- Added shared repair/delete accessibility labels and destructive-action hint
  copy to Relationship Studio broken relationship diagnostics items.
- Updated browser Relationship Studio Review broken-link actions to use the
  shared labels and add the missing accessible action context.
- Updated mobile Relationship Studio Review broken-link actions to consume the
  same shared labels instead of composing local templates.
- Extended focused relationship diagnostics coverage for the shared
  repair/delete action-label contract.

Evaluation before implementation:

- Mobile Review mode locally composed `Repair {type} relationship` and
  `Delete broken {type} relationship`, while browser Review rendered generic
  Repair/Delete buttons with no relationship-specific accessible labels.
- The broken diagnostics item already knew the relationship type and missing
  endpoint state, making local platform label composition unnecessary.

Root cause and best path:

- Root cause: broken-link repair/delete actions were added to the UI before the
  shared diagnostics item owned row-level action copy.
- The best path was to attach the action labels to
  `RelationshipDiagnosticsBrokenItem`, because both browser and mobile already
  render the same review model with platform-specific controls.

Re-evaluation after implementation:

- Browser and mobile broken-link repair/delete actions now share the same
  relationship-specific accessible labels and destructive hint text.
- Browser users now receive the same contextual action information mobile users
  already had, without changing repair/delete behavior or relationship data.
- No additional broken-link action-label gap was found after scanning the core
  relationship diagnostics model and both Relationship Studio renderers.

### Shared Relationship Links Row Actions Slice

Implementation completed:

- Added shared source/target context routes plus source, target, edit, and
  delete action labels to Relationship Studio saved relationship list rows.
- Updated browser Relationship Studio Links rows to expose direct Open Source
  and Open Target context actions alongside Edit and Delete.
- Updated mobile Relationship Studio Links rows to consume the same shared
  source/target routes and action labels instead of composing local templates.
- Extended focused relationship list model coverage for endpoint context
  routes and row-level action-label contracts.

Evaluation before implementation:

- Mobile saved relationship rows could open source and target records directly,
  while browser rows only showed endpoint names and forced users through other
  navigation to inspect either record.
- Mobile composed source/target/edit/delete accessibility labels locally even
  though the shared relationship row already owned the endpoint names, type,
  direction, status, and ids.

Root cause and best path:

- Root cause: Links mode added mobile endpoint actions after the shared
  relationship list model was created, leaving browser without the same
  low-cost inspection path and leaving action copy outside the model.
- The best path was to extend `RelationshipListItem` with context routes and
  action labels, then let browser and mobile render platform-specific controls.

Re-evaluation after implementation:

- Browser and mobile Links rows now share the same endpoint navigation routes
  and row action labels.
- Browser users can inspect either endpoint from a saved relationship row
  without first editing the relationship or searching the Workbench.
- No further saved-relationship row action parity gap was found after scanning
  the Relationship Studio browser page, mobile screen, and shared relationship
  model.

### Shared Orphaned Record Review Action Slice

Implementation completed:

- Added shared Manage Links action labels and relationship-management routes to
  orphaned-record diagnostics rows.
- Updated browser Relationship Studio Review orphaned-record links to use the
  shared route and row-specific accessible label.
- Updated mobile Relationship Studio Review orphaned-record actions to consume
  the shared label while preserving the mobile flow that switches into Links
  mode with the record preselected.
- Extended focused relationship diagnostics coverage for orphaned-record
  action labels and routes.

Evaluation before implementation:

- Browser and mobile both surfaced orphaned records in Review mode, but browser
  built the destination route locally and mobile composed `Link {record}` copy
  locally.
- The diagnostics row already identifies the orphaned record and exists
  specifically to start link maintenance, so the action label and destination
  belonged in the shared model.

Root cause and best path:

- Root cause: orphaned records reused graph-node rows and did not model the
  review action that makes the row useful.
- The best path was to extend `OrphanedEntry` with a Manage Links route and
  accessible label instead of introducing a separate review queue or changing
  the mobile Links-mode prefill behavior.

Re-evaluation after implementation:

- Browser and mobile Review mode now share orphaned-record action copy and
  relationship-management destinations.
- Browser users keep direct-link navigation, while mobile users keep the faster
  in-screen Links-mode transition; both are driven by the same shared row
  model.
- No additional orphaned-record review-action gap was found after scanning the
  Relationship Studio Review renderers and shared diagnostics model.

### Shared Relationship Graph Node Actions Slice

Implementation completed:

- Added shared context route, Review Context action label, and Filter List
  action label to relationship graph nodes.
- Updated browser Relationship Studio Graph selected-node actions to use the
  shared graph-node route and accessible labels.
- Updated mobile Relationship Studio Graph selected-node actions to use the
  same shared route and labels instead of rebuilding the context route locally.
- Extended focused graph model coverage for the graph-node action fields.

Evaluation before implementation:

- Browser and mobile both let users inspect a selected graph node or filter the
  Links list to that node, but both renderers built labels and routes locally.
- The graph node already owned the selected record id, name, section, status,
  summary, and tags, so the selected-node actions belonged in the shared graph
  node model.

Root cause and best path:

- Root cause: Graph mode was modeled around visual nodes and edges first, while
  the selected-node action row was implemented separately in each renderer.
- The best path was a narrow `RelationshipGraphNode` model extension, keeping
  the browser and mobile layouts separate while unifying action copy and
  context-route behavior.

Re-evaluation after implementation:

- Browser and mobile selected graph-node actions now share Review Context and
  Filter List labels plus the same Workbench context route.
- The mobile-only route helper for graph-node context navigation was removed
  because the shared node route now covers that behavior.
- No additional selected graph-node action parity gap was found after scanning
  the graph renderers and shared relationship graph model.

### Shared Relationship Graph Edge Action Slice

Implementation completed:

- Added shared edit action labels to relationship graph view edges.
- Updated browser Relationship Studio Graph edge rows and selected-node edge
  rows to use the shared edit labels.
- Updated mobile Relationship Studio Graph selected-node edge rows to use the
  same shared edit labels.
- Extended focused graph model coverage for graph-edge edit action labels.

Evaluation before implementation:

- Browser and mobile graph edge rows both rendered generic `Edit` actions
  around edges that already carried source, target, direction, and
  relationship-type context.
- Browser had two graph edge render locations and mobile had one; keeping
  action context local would keep accessibility wording easy to drift.

Root cause and best path:

- Root cause: graph edge rows were originally modeled as visual edge labels,
  while the action to edit the underlying relationship remained renderer-local.
- The best path was to add only edit action labels to
  `RelationshipGraphViewEdge`, because Graph mode does not expose delete
  actions and adding unused destructive copy would be premature.

Re-evaluation after implementation:

- Browser and mobile graph edge edit actions now share relationship-specific
  accessible labels through the graph edge model.
- The visible button remains compact as `Edit`, while assistive technology gets
  the source, target, and relationship type.
- No additional graph-edge edit action-label gap was found after scanning the
  graph renderers and focused relationship model tests.

### Shared Relationship Text Review Row Action Slice

Implementation completed:

- Added shared edit routes, visible review labels, and row-specific accessible
  review labels to legacy relationship text review items.
- Updated browser Relationship Studio review rows to use the shared review
  route and accessible label.
- Updated mobile Relationship Studio review rows to use the same shared route
  and label through the mobile route adapter.
- Removed the mobile screen-local legacy review navigation helper because the
  route now belongs to the shared review item model.
- Extended focused relationship field coverage for review-row routes and
  labels.

Evaluation before implementation:

- Browser and mobile both exposed a `Review Entry` action for legacy
  relationship-backed text, but each renderer assembled the route locally.
- Browser review rows did not include row-specific accessible names, so repeated
  `Review Entry` links were less clear to assistive technology.
- The review item already owned the entry id, entry name, section id, and field
  label, so route and action-label ownership belonged in the shared model.

Root cause and best path:

- Root cause: legacy relationship text review started as a migration queue,
  while the action to jump back into the editor was added at the renderer layer.
- The best path was a narrow `RelationshipTextReviewItem` extension rather than
  a broader review queue abstraction, because suggestion actions and exact-match
  migration labels were already shared.

Re-evaluation after implementation:

- Browser and mobile review rows now share the same edit target and row-specific
  accessible label for legacy text cleanup.
- The visible label remains compact as `Review Entry`, preserving scan density
  while improving accessibility and parity.
- No additional legacy review-row route duplication remains in the
  Relationships screen after scanning browser and mobile renderers.

### Shared Relationship Picker Row Action Label Slice

Implementation completed:

- Added a shared relationship picker row action model for Source and Target
  actions.
- Updated mobile Relationship Studio entry picker rows to use the shared
  Source/Target visible labels and role-specific accessible labels.
- Added focused relationship model coverage for picker row action labels.

Evaluation before implementation:

- Mobile Relationship Studio shows a compact two-action picker row for selecting
  source and target records, while browser uses native selects for the same
  workflow.
- The mobile renderer built `Use [record] as relationship source/target`
  accessible labels inline even though the visible Source and Target labels
  already came from shared relationship copy.
- A shared component abstraction was not needed because the browser and mobile
  interaction controls are intentionally different.

Root cause and best path:

- Root cause: mobile needed row-level picker buttons for touch ergonomics, but
  those buttons were added after the shared relationship copy model.
- The best path was a small shared action-label helper in the relationship model
  layer, preserving platform-specific controls while centralizing product copy
  and accessibility wording.

Re-evaluation after implementation:

- Mobile picker rows now share Source/Target visible labels and role-specific
  accessible labels from core.
- Browser behavior remains unchanged because native selects already expose the
  source and target controls through shared control descriptors.
- No broader picker abstraction is currently needed; the remaining divergence is
  platform interaction design rather than duplicated product logic.

### Shared Relationship Form Header Slice

Implementation completed:

- Added a shared relationship form header model for new/edit state, edit title,
  and unsaved draft labels.
- Updated browser Relationship Studio form headers to use the shared new/edit
  kicker, relationship-specific edit title, and compact unsaved pill label.
- Updated mobile Relationship Studio form headers to use the same shared title
  and unsaved draft warning label.
- Added focused relationship model coverage for new, edit, and blank-type
  fallback header states.

Evaluation before implementation:

- Browser and mobile both supported the same new/edit relationship workflow, but
  browser kept the main form heading generic while mobile used the relationship
  type in edit mode.
- Browser used a compact `Unsaved` pill while mobile used the fuller
  `Unsaved relationship draft.` warning; this is appropriate presentation
  divergence, but the labels still needed one shared source.
- The form header copy belongs with the relationship workflow model because it
  is not tied to a specific browser or mobile component.

Root cause and best path:

- Root cause: browser and mobile form headers evolved around each platform's
  layout, leaving new/edit state and unsaved labels split across renderers.
- The best path was a small `getRelationshipFormHeaderModel` helper that keeps
  platform-specific layout intact while centralizing the label decisions and
  relationship-type edit title.

Re-evaluation after implementation:

- Browser and mobile now use the same form title model for new and edit
  relationship states.
- Browser gained the more informative edit title already present on mobile,
  while mobile retained its existing warning presentation.
- No further relationship form header copy duplication was found after scanning
  the browser and mobile form sections.

### Shared Broken Relationship Endpoint Label Slice

Implementation completed:

- Added shared broken-relationship endpoint status and endpoint line labels to
  the diagnostics model.
- Updated browser Relationship Studio diagnostics to use the shared compact
  missing-endpoint status label.
- Updated mobile Relationship Studio diagnostics to use shared source and
  target endpoint line labels.
- Extended focused diagnostics coverage for missing endpoint status and line
  labels.

Evaluation before implementation:

- Browser and mobile both rendered broken relationship diagnostics from the
  shared diagnostics model, but each renderer assembled `Missing source`,
  `Missing target`, `Source`, and `Target` labels locally.
- The endpoint names, missing flags, and diagnostic context were already owned
  by the shared model, so endpoint label ownership belonged in core.
- The browser and mobile layouts need different presentation density, but not
  different product language.

Root cause and best path:

- Root cause: the diagnostics model originally exposed endpoint booleans and
  names only, leaving each renderer to compose human-readable endpoint status.
- The best path was to add both a compact `endpointStatusLabel` for browser
  summary rows and explicit `sourceLineLabel`/`targetLineLabel` values for
  mobile stacked rows.

Re-evaluation after implementation:

- Broken relationship endpoint wording is now consistent across browser and
  mobile while still fitting each layout.
- The diagnostics model remains narrow and avoids pulling layout-specific
  components into core.
- No remaining renderer-local broken endpoint status assembly was found after
  scanning the Relationship Studio review sections.

### Shared Duplicate Relationship Review Copy Slice

Implementation completed:

- Added shared duplicate group count and cleanup summary labels to the
  Relationship Studio review model.
- Added a shared duplicate group row removal summary label to each duplicate
  group.
- Updated browser Relationship Studio duplicate review and bulk cleanup panels
  to use the shared duplicate copy.
- Updated mobile Relationship Studio duplicate review and bulk cleanup panels to
  use the same shared copy.
- Extended focused relationship coverage for duplicate group row and review
  summary labels.

Evaluation before implementation:

- Browser and mobile both used the shared duplicate relationship grouping model,
  but each renderer assembled `duplicate group`, `duplicates`, and cleanup
  summary wording locally.
- Duplicate grouping owns the retained relationship id and duplicate ids, so the
  row-level removal summary belongs with the model that decides what will be
  kept or removed.
- Bulk cleanup copy is product behavior text, not platform layout text, so it
  should remain consistent across browser and mobile.

Root cause and best path:

- Root cause: duplicate grouping was modeled as cleanup data first, leaving
  renderer code to explain the cleanup decision.
- The best path was to add small copy fields to the existing
  `RelationshipStudioReviewModel` and `RelationshipDuplicateGroup`, avoiding a
  larger review component abstraction while centralizing behavior wording.

Re-evaluation after implementation:

- Browser and mobile now share duplicate group counts, row removal summaries,
  and bulk cleanup summary copy.
- The cleanup behavior is unchanged; only the model now owns the explanation of
  what will be retained and removed.
- No remaining renderer-local duplicate cleanup sentence assembly was found
  after scanning the Relationship Studio review and bulk-edit sections.

### Shared Relationship Graph Summary Copy Slice

Implementation completed:

- Added shared connected-record, visible-link, and combined summary labels to
  the relationship graph view model.
- Added a shared filtered graph-node result summary formatter.
- Updated browser Relationship Studio health and Graph panels to use the shared
  graph count labels.
- Updated mobile Relationship Studio health and Graph panels to use the same
  graph summary and filtered-result copy.
- Extended focused graph model coverage for graph summary and filtered-result
  labels.

Evaluation before implementation:

- Browser and mobile both rendered graph counts from the same graph view model,
  but each renderer assembled count labels locally.
- Browser used `visible relationship links` while mobile shortened the same
  concept to `visible links`, creating small but avoidable wording drift.
- The graph model already owns the filtered node and edge lists, so count labels
  belong with that model.

Root cause and best path:

- Root cause: graph counts were initially treated as simple render-time values
  instead of user-facing workflow state.
- The best path was to add summary labels to `RelationshipGraphViewModel` plus a
  small helper for mobile's additional graph search result summary, avoiding a
  larger graph panel abstraction.

Re-evaluation after implementation:

- Browser and mobile now use consistent connected-record and visible
  relationship-link wording.
- The graph model remains layout-agnostic while exposing the copy each platform
  needs for its graph summaries.
- No remaining graph count sentence duplication was found after scanning the
  Relationship Studio health and Graph sections.

### Shared Relationship Editor Selected Endpoint Summary Slice

Implementation completed:

- Added nullable selected Source and Target summary labels to the shared
  relationship editor options model.
- Updated mobile Relationship Studio form summaries to use the shared selected
  endpoint labels instead of assembling `Source`, `Target`, and `Missing entry`
  text locally.
- Removed now-unused mobile selected endpoint variables.
- Extended focused editor option coverage for selected and missing endpoint
  summary labels.

Evaluation before implementation:

- Mobile displays selected Source and Target summaries below searchable selects,
  while browser relies on native select values in a denser layout.
- The selected endpoint state already belongs to
  `RelationshipEditorOptionsModel`, but mobile still owned the explanatory
  labels and missing-entry fallback locally.
- Adding summary labels to the options model improves cohesion without forcing
  browser to adopt the mobile stacked summary presentation.

Root cause and best path:

- Root cause: the mobile searchable-select workflow needed additional
  confirmation text after selection, and that copy was introduced in the screen
  rather than the shared editor model.
- The best path was to expose nullable `selectedSourceSummaryLabel` and
  `selectedTargetSummaryLabel` fields next to the existing selected endpoint
  objects.

Re-evaluation after implementation:

- Mobile selected endpoint summaries now use shared Source/Target and
  missing-entry wording.
- Browser behavior remains unchanged because the shared model now provides the
  labels without requiring the browser to render them.
- No remaining mobile-local selected Source/Target summary assembly was found
  after scanning the Relationship Studio form section.

### Shared Relationship List Direction Status Slice

Implementation completed:

- Added a shared direction/status label to saved relationship list items.
- Updated browser Relationship Studio saved relationship rows to use the shared
  direction/status label instead of composing `Directional` or `Mutual` locally.
- Updated mobile Relationship Studio saved relationship rows to show the same
  shared direction/status label.
- Extended focused relationship list coverage for directional and mutual saved
  link rows.

Evaluation before implementation:

- Browser and mobile both rendered saved relationship rows from the shared list
  model, but only browser composed the human-readable direction/status label.
- Mobile showed the symbolic direction line and status separately, which was
  correct but less cohesive with the browser row metadata.
- The list item already owns direction and status labels, so the combined row
  metadata label belongs in the shared model.

Root cause and best path:

- Root cause: the list model originally exposed symbolic relationship direction
  for endpoint lines, while browser later added human-readable row metadata in
  the renderer.
- The best path was to add a `directionStatusLabel` beside the existing
  `directionLabel`, preserving endpoint-line symbols while centralizing the row
  metadata copy.

Re-evaluation after implementation:

- Browser and mobile saved relationship rows now share the same
  `Directional - Canon` or `Mutual - Canon` style metadata labels.
- The endpoint direction symbol remains available where it is useful for compact
  source-to-target lines.
- No remaining renderer-local Directional/Mutual saved-list copy was found after
  scanning the Relationship Studio saved relationship rows.

### Shared Relationship Studio Region Label Slice

Implementation completed:

- Added shared Relationship Studio region labels for relationship filters, graph
  filters, graph nodes, graph edges, graph node tags, and selected graph-node
  relationships.
- Updated browser Relationship Studio ARIA region labels to use the shared
  relationship copy.
- Extended focused relationship copy coverage for the new region labels.

Evaluation before implementation:

- Relationship Studio copy is largely centralized in core, but several browser
  filter and graph region labels remained hardcoded in the renderer.
- These labels describe stable product regions rather than layout-only
  implementation details, so they should move with the rest of the Relationship
  Studio copy.
- Mobile does not render the same landmark structure, so this slice should not
  force mobile markup changes.

Root cause and best path:

- Root cause: browser graph accessibility labels were added directly to the
  markup while earlier slices focused on visible actions and row models.
- The best path was to extend `relationshipFeatureCopy` with only the stable
  region labels and let browser consume those fields.

Re-evaluation after implementation:

- Browser Relationship Studio region labels now share the same core copy source
  as the rest of the relationship workflow.
- Mobile remains unchanged because the same structural regions do not exist in
  its stacked screen layout.
- No remaining hardcoded browser Relationship Studio graph/filter ARIA region
  labels were found after scanning the page.

### Shared Relationship Form Placeholder Slice

Implementation completed:

- Added shared placeholder text to the relationship type and note control
  descriptors.
- Updated browser Relationship Studio relationship form fields to use the shared
  type and note placeholders.
- Updated mobile Relationship Studio relationship form fields to use the same
  shared type and note placeholders.
- Extended focused control descriptor coverage for relationship form
  placeholders.

Evaluation before implementation:

- Browser had helpful placeholder examples for relationship type and note
  fields, while mobile rendered the same fields without placeholder guidance.
- The labels and accessibility labels already lived in shared control
  descriptors, so placeholder copy belonged with those controls as well.
- The change did not require a broader descriptor migration because only these
  two relationship editor controls needed placeholder copy.

Root cause and best path:

- Root cause: placeholder guidance was added in the browser form markup after
  the controls themselves were centralized.
- The best path was to add placeholder fields directly to the existing
  relationship type and note descriptors and let both platforms consume them.

Re-evaluation after implementation:

- Browser and mobile relationship forms now share the same type examples and
  note guidance.
- Mobile gains the same lightweight drafting affordance without changing field
  layout or validation.
- No remaining hardcoded relationship type or note placeholder literals were
  found after scanning the Relationship Studio form sections.

### Shared Timeline Involved Record Copy Slice

Implementation completed:

- Added shared involved-record search labels, placeholders, option-list labels,
  empty-state text, saved-event guidance, selected-list labels, and selected
  summary text to the timeline editor model.
- Updated browser timeline involved-record controls to use the shared model copy.
- Updated mobile timeline involved-record controls and selected summary to use
  the same shared model copy.
- Extended focused timeline editor model coverage for the involved-record copy
  contract.

Evaluation before implementation:

- Browser and mobile both rendered involved-record controls from the shared
  timeline editor model, but search labels, placeholders, empty text, and
  selected summaries were still assembled in each renderer.
- The timeline editor model already owns the visible options, selected records,
  display expansion labels, and duplicate warnings, so the surrounding control
  copy belongs with that model.
- The browser and mobile layouts differ, but the involved-record workflow copy
  should stay identical.

Root cause and best path:

- Root cause: relationship-backed involved records were modeled first as data and
  migration state, while renderer-local copy remained from the original
  browser/mobile forms.
- The best path was to extend `TimelineEditorInvolvedRecordsModel` with a small
  set of copy fields and a preformatted selected summary, avoiding a new shared
  component abstraction.

Re-evaluation after implementation:

- Browser and mobile involved-record controls now share search, placeholder,
  empty-state, saved-event, and selected-record wording.
- The model remains layout-agnostic while giving each platform the copy needed
  for its presentation.
- No remaining hardcoded involved-record search or selected-summary text was
  found after scanning browser and mobile timeline editor sections.

### Shared Timeline Surface Region Copy Slice

Implementation completed:

- Added shared timeline era, highlight, and table labels to timeline feature
  copy.
- Added a shared named-era count label to the timeline era manager model.
- Updated browser timeline era, highlight, table, and era-count rendering to use
  shared timeline copy/model fields.
- Updated mobile timeline era manager summary to use the shared named-era count
  label.
- Extended focused timeline coverage for timeline surface labels and era manager
  count text.

Evaluation before implementation:

- Browser and mobile both rendered timeline era manager state from the shared
  model, but each composed named-era count text locally.
- Browser timeline surface ARIA labels and table caption were hardcoded even
  though timeline workflow copy already lives in core.
- The era manager model owns era counts, and timeline feature copy owns stable
  region labels, so these strings belonged in core rather than renderers.

Root cause and best path:

- Root cause: the browser timeline overview kept structural labels from its
  first implementation while later timeline workflow copy was centralized.
- The best path was to add a small set of stable region labels to
  `timelineFeatureCopy` and a computed `namedEraCountLabel` to
  `TimelineEraManagerModel`.

Re-evaluation after implementation:

- Browser and mobile timeline era count wording now comes from the same model.
- Browser timeline eras, highlights, and table labels now share the same
  timeline copy source as the rest of the workflow.
- No remaining hardcoded timeline era/highlight/table surface labels were found
  after scanning the browser and mobile timeline sections.

### Shared Timeline Involved Record Blocking Message Slice

Implementation completed:

- Added a shared save-before-edit message to the timeline involved-record editor
  model.
- Updated browser timeline involved-record editing to use the shared blocking
  message when a saved event cannot yet use relationship-backed controls.
- Extended focused timeline editor model coverage for the blocking message.

Evaluation before implementation:

- The timeline involved-record model already owned search, empty-state,
  selected-record, and saved-event guidance copy.
- Browser still hardcoded the blocking state for saved events that must be saved
  before relationship-backed involved-record editing is available.
- That blocking state describes the same involved-record workflow, so it belongs
  in the model with the surrounding copy.

Root cause and best path:

- Root cause: the blocking copy was left behind in the browser branch that
  handles persisted timeline events without a ready relationship field control.
- The best path was to add one `saveBeforeEditMessage` field to
  `TimelineEditorInvolvedRecordsModel` rather than broaden the control API.

Re-evaluation after implementation:

- Browser involved-record blocking copy now comes from the shared timeline model.
- Mobile behavior remains unchanged because it does not render that exact
  browser blocking branch.
- No remaining hardcoded save-before-edit involved-record text was found after
  scanning browser and mobile timeline editor sections.

### Shared Mobile Notes Placeholder Adoption Slice

Implementation completed:

- Updated mobile entry and timeline editor notes fields to use the shared
  `entryEditorFieldCopy.notesPlaceholder`.
- Reused the existing core entry editor placeholder contract already used by the
  browser editor.

Evaluation before implementation:

- Browser notes fields already consumed the shared notes placeholder from core.
- Mobile rendered the same placeholder as a local literal, creating unnecessary
  copy drift risk.
- The placeholder already existed in core and was covered by entry editor tests,
  so this only needed renderer adoption.

Root cause and best path:

- Root cause: mobile notes fields were added before all editor field copy was
  consistently consumed from shared entry editor copy.
- The best path was to import `entryEditorFieldCopy` in the mobile entry screen
  and use the existing placeholder field.

Re-evaluation after implementation:

- Browser and mobile notes fields now use the same shared notes placeholder.
- No schema or behavior changes were needed.
- No remaining hardcoded `Markdown-style drafting notes` placeholder was found
  after scanning browser and mobile entry editors.

### Shared Mobile Entry Section Search Label Slice

Implementation completed:

- Added a shared section-search label to entry list copy.
- Updated mobile entry list filtering to use the shared section-search label.
- Extended focused entry list copy coverage for the new label.

Evaluation before implementation:

- Mobile entry list filtering still hardcoded `Search this section` even though
  entry list help and clear-filter actions already used shared copy.
- The label describes entry list workflow, not mobile-only layout, so it belongs
  with `entryListCopy`.

Root cause and best path:

- Root cause: the mobile list search field was added after the original entry
  list command labels were centralized.
- The best path was to extend `entryListCopy` with a single
  `searchSectionLabel` field and consume it in the mobile screen.

Re-evaluation after implementation:

- Mobile entry list search now uses shared entry list copy.
- Browser behavior remains unchanged because this exact mobile search control is
  not rendered on the browser timeline/editor surface.
- No remaining hardcoded `Search this section` label was found after scanning
  the entry screens.

### Shared Relationship Search Placeholder Slice

Implementation completed:

- Added shared search placeholder copy for graph records, relationship picker
  entries, and saved relationships.
- Updated browser Relationship Studio saved relationship search to use the
  shared relationship search placeholder.
- Updated mobile Relationship Studio graph, entry picker, and saved
  relationship searches to use the shared placeholders.
- Extended focused relationship copy coverage for the search placeholders.

Evaluation before implementation:

- Browser and mobile Relationship Studio searches already shared labels, but
  placeholders remained hardcoded in renderers.
- The placeholders describe what each Relationship Studio search indexes, so
  they belong with the shared relationship workflow copy.
- This can be solved without changing search behavior or field components.

Root cause and best path:

- Root cause: labels were centralized before the more detailed placeholder copy
  was introduced in platform screens.
- The best path was to add one placeholder per existing shared search label in
  `relationshipFeatureCopy` and consume those fields in browser and mobile.

Re-evaluation after implementation:

- Relationship Studio search labels and placeholders now share the same core copy
  source across browser and mobile.
- No search behavior changed.
- No remaining hardcoded Relationship Studio search placeholder literals were
  found after scanning browser and mobile relationship screens.

### Shared Timeline Involved Filter Placeholder Slice

Implementation completed:

- Added a shared placeholder for the timeline involved-record filter search.
- Updated mobile timeline involved filtering to use the shared placeholder.
- Extended focused timeline copy coverage for the involved-filter placeholder.

Evaluation before implementation:

- Timeline involved filtering already used a shared label and empty-state copy,
  but mobile still hardcoded the placeholder that explains searchable record
  fields.
- The placeholder describes timeline filter behavior, so it belongs in
  `timelineFeatureCopy` with the matching label.

Root cause and best path:

- Root cause: the mobile timeline involved filter search placeholder was added
  after timeline filter labels were centralized.
- The best path was to add a single
  `searchInvolvedFiltersPlaceholder` field to timeline copy and consume it in
  the mobile timeline browser.

Re-evaluation after implementation:

- Timeline involved filter label, placeholder, and empty-state copy now come from
  the shared timeline copy model.
- Browser behavior remains unchanged because this compact involved-filter search
  is mobile-only.
- No remaining hardcoded timeline involved-filter placeholder was found after
  scanning the mobile timeline browser.

### Shared Browser Entry Section Search Placeholder Slice

Implementation completed:

- Updated browser section search to use the shared entry list section-search
  copy.
- Reused the existing `entryListCopy.searchSectionLabel` contract already
  adopted by mobile.

Evaluation before implementation:

- Mobile entry list search already consumed shared `entryListCopy`, but browser
  section search still hardcoded the same `Search this section` placeholder.
- The string describes the same section filtering workflow, so both platforms
  should share the entry list copy source.

Root cause and best path:

- Root cause: the mobile section search was centralized first, leaving the
  browser section page with the original literal placeholder.
- The best path was a direct renderer adoption because `SectionPage` already
  imports `entryListCopy`.

Re-evaluation after implementation:

- Browser and mobile section search now use the same shared section-search copy.
- No behavior or routing changed.
- No remaining hardcoded `Search this section` placeholder was found after
  scanning browser and mobile entry screens.

### Shared Relationship Field Search Label Slice

Implementation completed:

- Added a shared formatter for relationship-backed field target search labels.
- Updated browser relationship-backed field controls to use the shared search
  label formatter.
- Updated mobile relationship-backed field controls to use the same formatter.
- Extended focused relationship field coverage for the shared search label.

Evaluation before implementation:

- Relationship-backed field controls already shared placeholder, empty-state,
  and clear/create copy.
- Browser and mobile still assembled `Search [field label]` locally, which left
  one piece of the same linked-record search workflow outside the shared model.
- The label is deterministic from the relationship field config, so a small
  formatter is sufficient.

Root cause and best path:

- Root cause: placeholder and empty-state copy were centralized before the
  visible dynamic search label.
- The best path was to add `getRelationshipFieldSearchLabel` alongside
  `relationshipFieldCopy` and use it in both renderers.

Re-evaluation after implementation:

- Browser and mobile linked-record target search labels now come from the same
  helper.
- No layout or relationship behavior changed.
- No remaining renderer-local `Search ${field label}` relationship-field target
  labels were found after scanning browser and mobile entry editors.

### Shared Knowledge Search Copy Slice

Implemented:

- Added shared field-configuration search labels, placeholders, order fallback
  placeholder, and empty-state text to the Knowledge schema model.
- Added shared hidden-detail cleanup search labels, placeholders, filtered empty
  text, and no-target empty text to the Knowledge schema model.
- Updated browser Knowledge and mobile More surfaces to consume the shared model
  copy for field settings and hidden-detail cleanup workflows.
- Extended focused Knowledge schema tests to cover the shared copy contract.

Evaluation before implementation:

- Browser Knowledge and mobile More both exposed field settings search and
  hidden-detail cleanup search, but each renderer owned its labels and empty
  states locally.
- The workflow is cross-platform and already backed by the shared Knowledge
  schema model, so renderer-local copy was unnecessary drift risk.
- The order input fallback placeholder was also duplicated and belongs with the
  field configuration workflow copy.

Root cause and best path:

- Root cause: earlier Knowledge work centralized section and row models before
  centralizing the search and empty-state text for the same workflows.
- The best path was to extend `getKnowledgeSchemaModel` rather than introduce a
  separate renderer helper, because both clients already construct and use the
  schema model.

Re-evaluation after implementation:

- Browser and mobile now share the same copy for field-settings search,
  hidden-detail search, and their filtered/empty states.
- The change does not alter filtering, cleanup, field override behavior, or
  layout.
- Remaining Knowledge copy that is still local is tied to surface-specific form
  structure or broader vocabulary workflow text, so it should be evaluated in a
  later slice instead of folded into this one.

### Shared Field Configuration Vocabulary Control Slice

Implemented:

- Added shared field-configuration vocabulary labels, no-vocabulary option,
  vocabulary mode options, and explanatory help text to the Knowledge schema
  model.
- Updated browser Knowledge field settings to render vocabulary select labels
  and options from the shared model.
- Updated mobile More field settings to render the same shared vocabulary
  options while preserving field-specific accessibility labels.
- Extended focused Knowledge schema tests for the shared vocabulary control
  contract.

Evaluation before implementation:

- Field settings already used shared per-field accessibility labels, but browser
  and mobile still duplicated the visible vocabulary option copy.
- The duplicated option labels affect the same schema workflow on both
  platforms and should not drift as vocabulary modes evolve.
- Broader vocabulary-manager row copy includes form-layout differences, so it
  should remain outside this smaller field-configuration slice.

Root cause and best path:

- Root cause: the field override model exposed field-specific labels but not
  the shared vocabulary control vocabulary used to configure those fields.
- The best path was to extend the existing Knowledge schema model instead of
  creating a separate field-settings copy module.

Re-evaluation after implementation:

- Browser and mobile now use the same no-vocabulary option, vocabulary mode
  options, and relationship-backed help copy.
- Mobile still keeps dynamic accessibility labels for each field-specific
  select, and browser retains its native select behavior.
- No data model, field override, or vocabulary persistence behavior changed.

### Shared Vocabulary Value Editor Copy Slice

Implemented:

- Added shared vocabulary value editor labels, search label, alias guidance,
  new-value labels, and archived restore guidance to the Knowledge schema
  model.
- Added a per-vocabulary search placeholder to each vocabulary row.
- Updated browser Knowledge and mobile More vocabulary editors to consume the
  shared visible copy while preserving per-row and per-value accessibility
  labels.
- Added optional `accessibilityLabel` support to the mobile `Field` primitive so
  visible labels can be concise without losing screen-reader specificity.
- Extended focused Knowledge schema tests for the vocabulary editor copy and
  dynamic row search placeholder.

Evaluation before implementation:

- Browser and mobile had the same vocabulary value editing workflow but used
  different local visible labels for edit and add-value fields.
- Mobile lacked the vocabulary-specific search placeholder that browser already
  provided.
- Per-value accessibility labels were already generated in the shared model and
  should be preserved rather than replaced by generic visible labels.

Root cause and best path:

- Root cause: vocabulary rows modeled dynamic aria labels and row actions, but
  not the generic visible editor labels and help text shared by both platforms.
- The best path was to extend the Knowledge schema model and add a small mobile
  primitive prop for accessible-label overrides.

Re-evaluation after implementation:

- Browser and mobile now share visible vocabulary value editor labels, alias
  guidance, archived restore guidance, and search placeholders.
- Mobile screen-reader labels remain specific to the vocabulary or value being
  edited.
- No vocabulary filtering, add, update, archive, restore, or ordering behavior
  changed.

### Shared Field Setting Label And Error Slice

Implemented:

- Added shared field-setting status labels, visible field labels, hidden toggle
  label, current-vocabulary label, and validation messages to the Knowledge
  schema model.
- Updated browser Knowledge field settings to use the shared labels and errors.
- Updated mobile More field settings to use shared visible labels while keeping
  field-specific accessibility labels through existing row copy.
- Extended focused Knowledge schema tests for the shared field-setting contract.

Evaluation before implementation:

- Browser and mobile both duplicated the same field-setting status labels,
  visible input labels, hidden toggle label, current-vocabulary label, and
  validation messages.
- These strings are part of the same cross-platform field configuration
  workflow and should evolve through one shared model.
- Dynamic field-specific accessibility labels already existed and needed to be
  preserved.

Root cause and best path:

- Root cause: earlier field configuration modeling prioritized dynamic labels
  and actions, leaving generic visible labels and validation copy in each
  renderer.
- The best path was to extend `schemaModel.fieldConfiguration` rather than
  duplicate a second copy source.

Re-evaluation after implementation:

- Browser and mobile now share the same field-setting visible labels, status
  labels, and validation messages.
- Mobile retains dynamic accessibility labels for field-specific controls.
- No field override validation rules, save/reset behavior, or persisted schema
  data changed.

### Shared Field Configuration Section Copy Slice

Implemented:

- Added the field-configuration section title and intro detail to the Knowledge
  schema model.
- Updated browser Knowledge and mobile More to use the shared section title and
  intro for field configuration.
- Extended focused Knowledge schema tests for the shared section copy.

Evaluation before implementation:

- Browser and mobile exposed the same field configuration workflow with
  separately authored section titles and intro text.
- The workflow is already fully backed by `schemaModel.fieldConfiguration`, so
  keeping the section framing local was unnecessary drift risk.

Root cause and best path:

- Root cause: earlier slices centralized controls and empty states first, but
  the section-level framing remained local to each surface.
- The best path was to add title/detail to the existing field-configuration
  model and leave browser-only structural text such as the kicker local.

Re-evaluation after implementation:

- Browser and mobile now present the same field-configuration title and intent.
- The browser retains its page-specific kicker for visual hierarchy only.
- No field configuration behavior, filtering, or persistence changed.

### Shared Custom Type Setup Copy Slice

Implemented:

- Added shared custom-type count text, empty state, add-fields visible label,
  and add-fields validation text to the Knowledge type-setup model.
- Updated browser Knowledge custom type setup to use the shared model copy.
- Updated mobile More custom type setup to use the same shared copy while
  preserving custom-section-specific accessibility labels.
- Extended focused Knowledge schema tests for the custom type setup contract.

Evaluation before implementation:

- Browser and mobile both exposed custom entry type setup, but duplicated the
  empty state and add-field validation text.
- Mobile used section-specific visible add-field labels while browser used a
  generic label; the workflow benefits from concise shared visible text plus
  dynamic accessibility labels.
- The existing type-setup model already owns this area, so local renderer copy
  was unnecessary.

Root cause and best path:

- Root cause: type setup exposed the route, action, and custom count number but
  not the surrounding workflow copy for custom type management.
- The best path was to extend `schemaModel.typeSetup` and keep the dynamic
  custom-section labels on each row.

Re-evaluation after implementation:

- Browser and mobile now share the custom type count sentence, no-custom-types
  empty state, add-fields visible label, and add-fields validation text.
- Mobile keeps section-specific accessibility labels for the add-fields input
  and action.
- No custom type creation, add-field parsing, deletion, or field persistence
  behavior changed.

### Shared Workbench Index Copy Slice

Implemented:

- Added Workbench index shell copy to the shared Workbench record index model.
- Added per-view title, count text, and empty-state copy to Workbench saved
  views.
- Updated browser Workbench record index labels, search placeholder, grouping
  labels, editor fallback aria label, and empty state to use the shared model.
- Updated mobile Workbench review queues to use the shared view title, count
  text, and empty-state copy.
- Extended focused Workbench record model tests for the shared copy contract.

Evaluation before implementation:

- Browser Workbench owned the record index labels, search placeholder, grouping
  aria labels, and empty-view state locally.
- Mobile Workbench review queues generated the same conceptual view title,
  count text, and empty state locally.
- The Workbench record index model already owns the saved views, counts, and
  selected context, so view copy belongs there.

Root cause and best path:

- Root cause: earlier Workbench modeling focused on records, routes, and saved
  queue membership before centralizing the surface copy around those queues.
- The best path was to extend `getWorkbenchRecordIndexModel` and
  `WorkbenchRecordView` instead of creating renderer-specific helpers.

Re-evaluation after implementation:

- Browser and mobile now share saved-view titles, count text, and empty states.
- Browser index search and grouping labels now come from the same model as the
  saved views they control.
- No Workbench filtering, routing, view membership, selection, or editor
  behavior changed.

### Shared Mobile Select Field Copy Slice

Implemented:

- Added shared select-field fallback copy to the core control descriptors.
- Updated the mobile `SelectField` primitive to use shared fallback search
  placeholder, no-results text, cancel label, selected-value fallback, and open
  hint.
- Added focused control descriptor tests for the shared select-field copy.

Evaluation before implementation:

- Mobile select modals are reused by Workbench, Relationships, Knowledge, and
  entry editors, but their fallback copy lived inside the primitive.
- This created a hidden local copy contract for picker workflows that should
  remain consistent across mobile surfaces.
- Browser native selects do not use this modal copy, so the slice should remain
  scoped to the shared mobile primitive instead of adding browser-specific
  behavior.

Root cause and best path:

- Root cause: shared control descriptors modeled filters and editor controls,
  but not the reusable mobile select modal fallback language.
- The best path was to add a small `selectFieldCopy` export and keep all modal
  behavior in the existing mobile primitive.

Re-evaluation after implementation:

- Mobile picker fallback copy now has one tested source of truth.
- Existing callers can still provide custom searchable placeholders where a
  workflow needs more specific guidance.
- No picker selection, search filtering, modal behavior, or accessibility state
  behavior changed.

### Shared Knowledge Overview Summary Slice

Implemented:

- Added shared Knowledge overview labels, count details, and compact mobile
  summary sentences to the Knowledge schema model.
- Updated browser Knowledge stat cards to read their labels and details from
  the shared overview model.
- Updated mobile More Knowledge summary text to use the same shared overview
  model instead of assembling total counts locally.
- Extended focused Knowledge schema tests for the shared overview contract.

Evaluation before implementation:

- Browser and mobile both introduced the same Knowledge setup workflow with
  local count labels and summary wording.
- The browser rendered the counts as cards while mobile rendered compact
  sentences, but both communicated the same entry type, field, linked-field,
  and hidden-detail totals.
- Keeping the count wording local increased drift risk and made future schema
  terminology changes more expensive.

Root cause and best path:

- Root cause: earlier Knowledge model slices centralized detailed schema
  workflows first, while the top-level overview remained partly owned by each
  renderer.
- The best path was to add a small `overview` object to
  `getKnowledgeSchemaModel` and let each surface keep its existing layout.

Re-evaluation after implementation:

- Browser and mobile now share Knowledge overview count labels and summary
  text.
- Renderer scans show the previous overview total sentences no longer exist in
  browser or mobile code; remaining matches are shared model and test copy.
- No Knowledge navigation, filtering, schema editing, hidden-detail cleanup, or
  layout behavior changed.

### Shared Knowledge Section Summary Slice

Implemented:

- Added shared section field-count labels, relationship-backed field-count
  labels, schema summary text, and field-configuration summary text to each
  Knowledge section row.
- Updated mobile More Knowledge overview, Field Configuration, and custom type
  setup rows to use the shared section summary text.
- Updated browser Knowledge current-structure relationship-field count text to
  use the shared section row label.
- Extended focused Knowledge schema tests for the shared section summary
  contract.

Evaluation before implementation:

- Mobile assembled section counts in multiple places with local wording such
  as `linked`, while browser used `relationship-backed` wording for a similar
  concept.
- The section rows already own field counts, relationship-field counts, entry
  counts, and routes, so summary text belongs beside that data.
- Leaving the summaries local would make future schema terminology changes
  require renderer-by-renderer edits.

Root cause and best path:

- Root cause: section rows initially exposed raw counts and dynamic actions,
  while compact count sentences were introduced directly in the renderers.
- The best path was to add summary strings to `KnowledgeSectionRow`, preserving
  each surface's layout while centralizing terminology and pluralization.

Re-evaluation after implementation:

- Browser and mobile now share section field-count and
  relationship-backed-field terminology.
- Renderer scans found no remaining local `fieldCount`/`relationshipFieldCount`
  section-summary assembly in the Knowledge and More surfaces.
- No custom entry type editing, field ordering, Knowledge routing, or schema
  persistence behavior changed.

### Shared Custom Field Retention Copy Slice

Implemented:

- Added a shared retained-value summary to each Knowledge field row.
- Added a shared remove-field accessibility hint that explains hidden-detail
  retention for custom field removal.
- Updated browser Knowledge custom field rows and mobile More custom field rows
  to consume the shared retained-value copy.
- Updated mobile remove-field actions to consume the shared accessibility hint.
- Extended focused Knowledge schema tests for the retained-value and
  remove-field hint contract.

Evaluation before implementation:

- Browser and mobile both warned users that custom field values remain saved
  under their field keys, but the sentence was assembled locally in each
  renderer.
- Mobile also hardcoded the removal hint for the same data-retention behavior.
- This warning is part of the custom-field data contract and should stay
  consistent wherever custom fields are renamed, reordered, or removed.

Root cause and best path:

- Root cause: field rows exposed actions and field metadata, but not the
  user-facing retention copy derived from the field key.
- The best path was to attach the retained-value summary and removal hint to
  `KnowledgeFieldRow`, where field key, label, mode, and removal actions
  already meet.

Re-evaluation after implementation:

- Browser and mobile now share custom-field retained-value wording.
- Mobile removal hints now share the same data-retention language as the field
  row copy.
- Renderer scans found no remaining local retained-value or custom-field
  removal-retention warning text in the Knowledge and More surfaces.
- No field rename, move, removal, hidden-detail generation, or confirmation
  behavior changed.

### Shared Vocabulary Status Summary Slice

Implemented:

- Added a compact active/archived value status summary to each Knowledge
  vocabulary row.
- Updated browser Knowledge vocabulary rows to use the shared status summary
  instead of assembling active and archived counts locally.
- Extended focused Knowledge schema tests for the vocabulary status summary
  contract.

Evaluation before implementation:

- Vocabulary rows already exposed active and archived counts plus a longer
  summary, but browser still assembled the compact status line locally.
- The count status is deterministic from the shared row model and should not be
  renderer-specific terminology.
- Mobile already used the longer shared vocabulary summary, so this slice
  should remain narrow and avoid changing the mobile layout.

Root cause and best path:

- Root cause: earlier vocabulary slices centralized row actions and editor
  labels before centralizing the compact browser row status.
- The best path was to add `statusSummary` to `KnowledgeVocabularyRow` and use
  it where the compact browser status line appears.

Re-evaluation after implementation:

- Browser vocabulary rows now use the shared active/archived status summary.
- Renderer scans found no remaining local active/archive count assembly in the
  Knowledge and More vocabulary surfaces.
- No vocabulary filtering, value editing, archive/restore behavior, or mobile
  layout changed.

### Shared Vocabulary Field Usage Summary Slice

Implemented:

- Added shared display summary text to each Knowledge vocabulary field-usage
  row.
- Updated browser Knowledge vocabulary usage chips to use the shared usage
  summary text.
- Updated mobile More vocabulary usage summaries to use the same shared
  per-usage text while preserving the compact mobile prefix.
- Extended focused Knowledge schema tests for vocabulary field-usage summary
  text.

Evaluation before implementation:

- Browser displayed vocabulary field usage as `Section: Field (Mode)` chips,
  while mobile assembled a similar but slightly different `Section Field
(Mode)` compact sentence.
- The vocabulary field-usage row already owns section, field, mode, route, and
  action labels, so the display summary should live in the same model.
- Leaving this local would make vocabulary usage terminology diverge between
  browser and mobile as field configuration expands.

Root cause and best path:

- Root cause: earlier vocabulary slices centralized row actions and editor
  controls, but the per-usage display phrase remained in the renderers.
- The best path was to add `summaryText` to
  `KnowledgeVocabularyFieldUsageRow` and keep each platform's surrounding
  layout unchanged.

Re-evaluation after implementation:

- Browser and mobile now share vocabulary field-usage display text.
- Renderer scans found no remaining local `usage.sectionTitle`,
  `usage.fieldLabel`, or `usage.modeLabel` display assembly in Knowledge and
  More.
- No vocabulary routing, field-usage detection, search, or value editing
  behavior changed.

### Shared Vocabulary Usage Prefix Slice

Implemented:

- Added shared vocabulary field-usage intro text to each Knowledge vocabulary
  row.
- Updated mobile More vocabulary usage summaries to use the shared intro text
  before the shared per-usage summaries.
- Extended focused Knowledge schema tests for the shared usage intro contract.

Evaluation before implementation:

- The per-usage display text was shared, but mobile still hardcoded the
  surrounding `used by` phrase for the same vocabulary usage workflow.
- The phrase depends on the vocabulary row label and belongs with
  `fieldUsageLabel` and the usage rows.
- Browser currently uses chips and does not need the intro phrase, so the
  shared row model should expose it without forcing a browser layout change.

Root cause and best path:

- Root cause: the first usage-summary slice centralized each usage item but
  left the mobile row-level sentence prefix in the renderer.
- The best path was to add `fieldUsageSummaryIntro` to
  `KnowledgeVocabularyRow` and keep the mobile compact sentence structure.

Re-evaluation after implementation:

- Mobile now renders vocabulary usage intro and usage items from the shared
  Knowledge model.
- Focused Knowledge and mobile render tests pass.
- No vocabulary usage detection, routing, or browser layout behavior changed.

### Shared Workbench Context Detail Copy Slice

Implemented:

- Updated Workbench related-record chips so their shared `detailText` includes
  relationship type plus section when a relationship is present.
- Added shared selected-context relationship management labels to the Workbench
  record index model.
- Added shared inline-editor kicker and empty-state copy to the Workbench index
  model copy.
- Updated browser Workbench selected context and inline editor empty state to
  consume the shared model copy.
- Updated mobile Workbench Context empty state to use the shared selected
  context title and detail.
- Extended focused Workbench record model tests for shared chip detail,
  relationship management action labels, and inline-editor empty copy.

Evaluation before implementation:

- Browser Workbench selected context still assembled related-record subtitles
  from relationship type and section locally.
- The selected context also hardcoded `Manage Links`, while relationship copy
  was already shared in core.
- Browser inline editor empty copy was hardcoded beside Workbench model-owned
  editor accessibility copy.
- Mobile Context mode had a separate no-record message for the same selected
  context empty state.

Root cause and best path:

- Root cause: earlier Workbench modeling centralized record lists, views, and
  selected-context data first, leaving a few small display phrases in the
  browser renderer.
- The best path was to enrich existing Workbench model fields instead of adding
  a new UI abstraction.

Re-evaluation after implementation:

- Browser Workbench now renders related-record subtitles, relationship
  management labels, and inline-editor empty copy from the shared model.
- Mobile Workbench Context now renders the same selected-context empty state as
  browser when no record is selected.
- Focused Workbench tests pass and renderer scans show the previous hardcoded
  Workbench context strings now only appear in model/test copy.
- No Workbench routing, selection, relationship navigation, or editor behavior
  changed.

### Shared Entry List Surface Label Slice

Implemented:

- Added shared entry-list surface labels for Entries, Filters, Sections, and
  tag filtering to the entry list model.
- Added shared formatters for entry list shown-count text, section entries
  ARIA labels, section filters ARIA labels, and section search labels.
- Updated browser section pages to consume shared entry-list headings, ARIA
  labels, shown-count text, and tag-filter labels.
- Updated mobile Entries to consume shared Filters/Sections titles for the
  browse controls block.
- Extended focused entry-list model tests for the shared label contract.

Evaluation before implementation:

- Browser and mobile both exposed the same browse/filter workflow but still
  owned some surface labels locally.
- Browser assembled entries/filter region labels, shown-count text, section
  search labels, and tag filter labels inline.
- Mobile hardcoded the top-level Filters/Sections block title for the same
  browse/filter workflow.

Root cause and best path:

- Root cause: earlier entry-list slices centralized list rows, empty states,
  search labels, and controls before the surrounding browse/filter surface
  labels were moved into the model.
- The best path was to add small label helpers to `entryListModel` rather than
  introduce a new UI abstraction.

Re-evaluation after implementation:

- Browser and mobile now share entry-list browse/filter surface labels through
  the entry list model.
- Focused entry-list and mobile render tests pass.
- Renderer scans found no remaining local fixed `Filters`/`Sections`,
  `Filter by tag`, shown-count, or section search label assembly in the target
  browser/mobile entry-list surfaces.
- No filtering, sorting, routing, tag selection, or archive behavior changed.

### Shared Mobile Timeline Move Label Adoption Slice

Implemented:

- Updated mobile timeline entry move controls to use the shared entry-list row
  move labels and accessibility labels without renderer-local fallbacks.
- Focused mobile render coverage continues to verify timeline row actions.

Evaluation before implementation:

- The shared entry-list model already provided timeline move labels and
  accessibility labels.
- Mobile still kept local `Earlier`/`Later` fallback copy, which duplicated the
  shared model and could drift from browser/timeline copy.
- The controls are timeline-only, so they should render only when the shared
  row model provides move metadata.

Root cause and best path:

- Root cause: mobile timeline move controls were introduced defensively before
  the shared row model became the authoritative copy source.
- The best path was to remove local fallbacks and guard rendering on the shared
  move labels already exposed by `EntryListItem`.

Re-evaluation after implementation:

- Mobile timeline move controls now get their labels exclusively from the
  shared entry-list model.
- Focused mobile render tests pass.
- Renderer scans found no remaining mobile-local `Earlier`/`Later` fallback
  copy in the Entries screen.
- No timeline move behavior, disabled state, or ordering logic changed.

### Shared Browser Timeline Filter Label Slice

Implemented:

- Added shared Timeline filter labels for the Era and Involved entry browser
  filters.
- Updated browser Timeline browse filters to use shared Timeline copy for Era,
  Involved entry, Any Era, and Any Involved labels.
- Extended focused Timeline copy tests for the shared browser filter labels.

Evaluation before implementation:

- Mobile Timeline already used shared `Any Era` and `Any Involved` labels.
- Browser Timeline browse still hardcoded equivalent filter labels and option
  text locally.
- These labels are part of the same Timeline filtering workflow and should not
  drift across platforms.

Root cause and best path:

- Root cause: earlier Timeline filter work centralized mobile controls and
  broader Timeline surface labels, but browser select labels stayed in
  `SectionPage`.
- The best path was to extend `timelineFeatureCopy` with the missing filter
  labels and consume existing shared any-filter labels in browser.

Re-evaluation after implementation:

- Browser Timeline browse now uses shared copy for Era and Involved filters.
- Focused Timeline tests and render smoke coverage pass.
- Renderer scans found no remaining browser-local `Any era` or
  `Any linked entry` option text.
- No Timeline filtering, routing, era selection, or involved-record filtering
  behavior changed.

### Shared Container Accessibility Label Slice

Implemented:

- Added a shared Relationship Studio mode picker accessibility label to the
  relationship studio mode model.
- Added shared Knowledge Schema labels for custom type field ordering and the
  custom field preview panel.
- Added a shared Workbench editor accessibility label formatter for the default
  editor panel and section-specific inline editors.
- Updated browser Relationship Studio, entry-section legacy relationship review,
  Knowledge Schema, and Workbench panels to consume shared model labels instead
  of page-local copy.

Evaluation before implementation:

- The affected pages already used shared view models for the surrounding
  workflows.
- A small set of aria labels and panel titles still lived directly in browser
  page components, so accessibility naming could drift from mobile and shared
  copy contracts.
- These labels did not require a product decision because they preserve the
  existing workflow structure and only move ownership into the relevant shared
  model.

Root cause and best path:

- Root cause: earlier UX slices centralized primary workflow copy but left some
  container-level accessibility labels behind in renderer code.
- The best path was to add explicit model fields for labels that describe a
  shared workflow surface, and to add one small formatter for the Workbench
  section-specific editor label.

Re-evaluation after implementation:

- Renderer scans found no remaining page-local copies of the migrated
  Relationship Studio modes, custom field preview, field order, or Workbench
  editor labels.
- Focused relationship, knowledge schema, and Workbench model tests pass.
- No page structure, route behavior, data shape, or editing behavior changed.

### Shared Relationship Text Review Row Copy Slice

Implemented:

- Added shared relationship text review row labels for unresolved text and
  suggestions.
- Added a shared relationship text review count formatter for the browser
  review panel kicker.
- Updated browser and mobile entry-context and Relationship Studio relationship
  text review rows to use the shared unresolved and suggestions labels.
- Updated browser exact-match row migration actions to use the existing shared
  exact-match migration label.

Evaluation before implementation:

- Browser and mobile both render relationship text review rows for migrating
  legacy text into saved relationship links.
- The shared relationship text review model already owned the row data,
  summary, exact-match labels, review action label, and batch migration label.
- The remaining row fragments were renderer-local, so the same workflow could
  drift across browser and mobile.

Root cause and best path:

- Root cause: earlier relationship review model work centralized actions and
  diagnostics before the row sentence fragments were extracted.
- The best path was to move only the repeated row labels and count formatter
  into `relationshipTextReviewCopy`/relationship field helpers, preserving the
  existing row layout.

Re-evaluation after implementation:

- Browser and mobile entry-context and Relationship Studio surfaces now use
  shared copy for unresolved text, suggestions, and exact-match row migration
  labels.
- Focused relationship field tests pass.
- No migration behavior, relationship creation, dirty-state blocking, or row
  visibility behavior changed.

### Shared Relationship Filter Search Copy Slice

Implemented:

- Added shared Relationship Studio graph filter labels for Section and Tag.
- Updated browser Relationship Studio graph filters to consume the shared
  Section and Tag labels.
- Updated mobile relationship source and target pickers to use the existing
  shared relationship entry search placeholder instead of local `Search entries`
  copy.

Evaluation before implementation:

- Relationship Studio already centralized most graph and relationship picker
  copy in `relationshipFeatureCopy`.
- Browser graph filtering still owned the Section and Tag filter labels locally.
- Mobile source and target relationship pickers still used a shorter local
  search placeholder while the entry picker model already exposed the more
  useful shared placeholder.

Root cause and best path:

- Root cause: graph filter and picker placeholder copy was centralized in
  adjacent slices, but these small filter labels and mobile select-search
  placeholders were left behind in renderers.
- The best path was to add only the missing graph filter labels to
  `relationshipFeatureCopy` and reuse the existing shared entry search
  placeholder for mobile source/target pickers.

Re-evaluation after implementation:

- Targeted renderer scans found no remaining local `Search entries`, Section,
  or Tag copy in the Relationship Studio filter/picker surfaces.
- Focused relationship model tests pass.
- No graph filtering, relationship source/target selection, search behavior, or
  route behavior changed.

### Shared Knowledge Hierarchy Copy Slice

Implemented:

- Added shared Knowledge Schema kicker labels for Type Setup, Field
  Configuration, Vocabulary Manager, Hidden Detail Cleanup, Entry Types, and
  Reusable Knowledge.
- Updated browser Knowledge sections to consume those shared hierarchy labels.
- Updated mobile custom entry type field preview text to use the shared custom
  field preview title.

Evaluation before implementation:

- Knowledge Schema already owned the section titles, descriptions, navigation
  actions, field labels, and custom field preview accessibility label.
- Browser still owned the page hierarchy kickers locally, and mobile still
  owned the visible custom field preview label locally.
- These labels describe existing shared workflow sections rather than
  platform-specific presentation, so keeping them in renderers created avoidable
  browser/mobile copy drift.

Root cause and best path:

- Root cause: earlier Knowledge slices centralized controls and row copy before
  the outer section hierarchy labels were moved into the model.
- The best path was to add explicit kicker labels to the existing Knowledge
  schema model and reuse the existing custom field preview title on mobile.

Re-evaluation after implementation:

- Targeted renderer scans found no remaining local Knowledge hierarchy or field
  preview labels in the browser Knowledge page or mobile More screen.
- Focused Knowledge schema tests pass.
- No Knowledge navigation, field configuration, vocabulary editing, hidden
  detail cleanup, or custom entry type behavior changed.

### Shared Destructive Dialog Copy Slice

Implemented:

- Added shared destructive confirmation dialog labels for generic destructive
  actions, permanent delete dialogs, and cancel actions.
- Added a shared Knowledge Schema destructive action kicker label to the
  Knowledge schema model.
- Updated browser Data, Knowledge, Relationships, Workspaces, and shared entry
  delete/reset confirmation dialogs to consume shared dialog copy instead of
  page-local labels.
- Updated the mobile destructive confirmation presenter to use the same shared
  cancel label.

Evaluation before implementation:

- Destructive action titles, messages, and confirm labels were already
  centralized in the shared destructive-action model.
- Browser dialog hierarchy labels and cancel actions still lived directly in
  individual pages, so destructive confirmation copy could drift by surface.
- The Knowledge dialog needed a Knowledge-owned kicker because its destructive
  actions are schema-management actions, while Relationships and Workspaces
  share permanent-delete framing.

Root cause and best path:

- Root cause: earlier destructive-action work centralized action-specific copy
  but left dialog-level labels in renderer components.
- The best path was to add a small shared dialog-copy object for generic
  destructive confirmation labels and expose the Knowledge-specific kicker from
  the Knowledge schema model.

Re-evaluation after implementation:

- Targeted renderer scans found no remaining page-local `Destructive action`,
  `Knowledge schema action`, `Permanent delete`, or literal destructive-dialog
  `Cancel` labels in browser pages or the mobile destructive confirmation
  presenter.
- Focused destructive-action and Knowledge schema tests pass.
- No destructive action behavior, confirmation title formatting, recovery
  snapshot behavior, or mobile confirmation behavior changed.

### Shared Data Storage Save Line Label Slice

Implemented:

- Added a shared `Manual save` storage status line label to Data storage copy.
- Updated browser Data storage status modeling to consume the shared line label
  instead of passing local page copy into the shared storage status model.

Evaluation before implementation:

- Data storage panel title, kicker, guidance, diagnostics label, recovery
  guidance, and storage-load labels already lived in shared Data copy.
- The browser page still supplied the `Manual save` line label locally while
  building the shared storage status model.
- This was a small ownership gap in the same storage-status workflow rather
  than a behavior or product decision.

Root cause and best path:

- Root cause: the storage status helper accepted a line label parameter before
  all Data panel copy had been centralized.
- The best path was to add the missing label to `dataStorageCopy` and keep the
  existing helper signature unchanged.

Re-evaluation after implementation:

- Targeted scans found no remaining page-local `Manual save` line-label usage.
- Focused Data model tests pass.
- No save behavior, storage recovery behavior, diagnostics text, or mobile Data
  behavior changed.

### Shared Entry Detail Timeline Surface Copy Slice

Implemented:

- Added a shared selected-entry relationship kicker label to Relationship copy.
- Added a shared Timeline overview title plus visible-event and review-issue
  count formatters to Timeline copy/helpers.
- Updated the shared browser entry detail relationship panel and Timeline
  overview to consume shared labels/count formatters.
- Updated the mobile Timeline review summary to use the shared review-issue
  count formatter.

Evaluation before implementation:

- Entry detail panels, relationship groups, and Timeline review data already
  came from shared models.
- The reusable browser entry view component still owned section header copy for
  linked records and Timeline overview counts locally.
- Mobile Timeline used the same review issue count sentence locally, so the
  count wording could drift between browser and mobile.

Root cause and best path:

- Root cause: prior relationship/timeline slices centralized row actions and
  filters before moving these outer entry-detail section labels into shared
  copy.
- The best path was to add only the missing relationship kicker and Timeline
  title/count helpers, then adopt them in existing browser/mobile renderers.

Re-evaluation after implementation:

- Targeted scans found no remaining renderer-local linked-record header,
  Timeline overview title, visible-event count, or Timeline review-issue count
  strings in the affected browser/mobile surfaces.
- Focused relationship, Timeline, and entry render tests pass.
- No relationship grouping, Timeline sorting, review diagnostics, or navigation
  behavior changed.

### Shared Utilities And Runtime Recovery Kicker Slice

Implemented:

- Added a shared Utilities overview kicker label to the Utilities overview
  model.
- Added a shared runtime diagnostics kicker label to the runtime recovery copy
  model.
- Updated browser Utilities and runtime recovery fallback surfaces to consume
  those shared labels instead of page-local copy.

Evaluation before implementation:

- Utilities overview title, detail, metrics, actions, and destinations were
  already centralized in the shared workflow destination model.
- Runtime recovery already centralized retry, Data, reload, diagnostics title,
  diagnostics description, textarea label, and download feedback copy.
- The remaining kicker labels were still renderer-local even though they
  described shared utility/recovery surfaces.

Root cause and best path:

- Root cause: prior Utilities and runtime recovery slices centralized primary
  actions and content before the smaller section hierarchy labels were moved
  into the same models.
- The best path was to add one label to each existing model and consume those
  fields directly in the browser renderers.

Re-evaluation after implementation:

- Targeted scans found no remaining browser-local `Workflow Hub` or runtime
  fallback `Local-only report` kicker copy.
- Focused workflow destination and runtime recovery tests pass.
- No route focus behavior, utility actions, diagnostics generation, download
  behavior, or runtime recovery behavior changed.

### Shared Relationship Review Display Limits Slice

Implemented:

- Added `relationshipReviewDisplayLimits` to `@valgaron/core` as the shared
  collapsed-list contract for Relationship Studio review queues.
- Updated browser Relationship Studio Review to use `getLimitedResultModel`
  for orphaned records, duplicate relationship groups, and legacy text review
  items instead of local `slice(...)` calculations and hardcoded thresholds.
- Updated mobile Relationship Studio Review to use the same shared review
  limits for the same queues, replacing the previous mixed mobile/browser
  thresholds.
- Added core coverage that locks the relationship review limits as a shared
  browser/mobile model.

Evaluation before implementation:

- The issue was still needed because Relationship Studio Review is the same
  workflow on browser and mobile, but its collapsed preview limits were split
  across renderer code: browser showed 10 orphaned records, 6 duplicate groups,
  and 8 legacy text items while mobile showed 12 orphaned records, 5 duplicate
  groups, and 6 legacy text items.
- Root cause: earlier slices centralized hidden-count text and expansion labels
  first, leaving the actual review queue limits as page-local constants.
- Best path: add one small shared review-limit model and adopt the existing
  `getLimitedResultModel` helper instead of adding a new component abstraction.

Re-evaluation after implementation:

- Browser and mobile now use the same collapsed Relationship Studio Review
  queue limits and the same visible/hidden count calculation.
- The chosen limits preserve the more generous existing browser duplicate and
  legacy text previews while keeping the mobile orphaned-record preview, which
  reduces unnecessary expansion interactions without adding new controls.
- No schema, route, persistence, or product decision changed.

### Shared Workbench Drafting Prompt Display Limit Slice

Implemented:

- Added `workbenchDisplayLimits.selectedDraftingPrompts` to `@valgaron/core`.
- Updated browser Workbench selected-record context to use
  `getLimitedResultModel` and the shared prompt limit instead of a page-local
  `slice(0, 4)` calculation.
- Updated mobile Workbench context mode to use the same shared prompt limit
  instead of its previous local `slice(0, 3)` calculation.
- Updated mobile render coverage so the prompt-heavy selected-record fixture
  verifies the new shared collapsed count.

Evaluation before implementation:

- The issue was still needed because selected-record Workbench context is the
  same drafting workflow on browser and mobile, but browser exposed four
  prompts before expansion while mobile exposed three.
- Root cause: the prompt expansion labels and hidden-count text had already
  been centralized, but the collapsed prompt limit stayed in each renderer.
- Best path: add one small shared Workbench display-limit model and reuse
  `getLimitedResultModel`; no new component abstraction or route behavior was
  needed.

Re-evaluation after implementation:

- Browser and mobile selected-record context now expose four drafting prompts
  before expansion and compute hidden counts through the same helper.
- The mobile context workflow now needs one fewer expansion interaction for
  prompt-heavy records while preserving the same compact layout pattern.
- No schema, route, persistence, editor transaction, or product decision
  changed.

### Shared Knowledge Vocabulary Value Display Limit Slice

Implemented:

- Added `knowledgeDisplayLimits.vocabularyValues` to `@valgaron/core`.
- Updated browser Knowledge Vocabulary Manager rows to use
  `getLimitedResultModel` and the shared value limit instead of local
  `slice(0, 8)` and `length > 8` checks.
- Updated mobile More Vocabulary Manager rows to use the same shared value
  limit instead of local `slice(0, 4)`, hidden-count subtraction, and
  `length > 4` checks.
- Extended mobile render coverage with an over-limit ancestry vocabulary so the
  hidden-count and expansion affordance remain tested under the shared limit.

Evaluation before implementation:

- The issue was still needed because browser and mobile both edit the same
  durable vocabulary values, but browser exposed eight values before expansion
  while mobile exposed four.
- Root cause: prior Knowledge slices centralized row copy, commands, hidden
  count formatting, and field usage labels, but left the value preview limit in
  each renderer.
- Best path: add one shared Knowledge display-limit constant and reuse the
  existing limited-result helper; no schema model or storage migration was
  needed.

Re-evaluation after implementation:

- Browser and mobile Vocabulary Manager rows now expose eight matching active
  values before expansion and compute hidden counts through the same helper.
- Mobile users need fewer expansion interactions when editing common taxonomy
  vocabularies while preserving the existing compact row layout.
- No schema, route, persistence, vocabulary mutation, or product decision
  changed.

### Shared Section Relationship Text Review Display Limit Slice

Implemented:

- Added `relationshipTextReviewDisplayLimits.sectionItems` to
  `@valgaron/core`.
- Updated browser section relationship text review to use
  `getLimitedResultModel` and the shared section review limit instead of local
  `slice(0, 6)` and `length > 6` checks.
- Updated mobile Entries context relationship text review to use the same
  shared section review limit instead of reading the mobile feature limit
  directly.
- Added core coverage that keeps the section review limit aligned with the
  existing mobile context review limit.

Evaluation before implementation:

- The issue was still needed because section-level relationship text review is
  the same cleanup workflow on browser and mobile, but browser still owned a
  page-local numeric limit while mobile read a shared mobile limit.
- Root cause: earlier relationship review slices centralized count copy and
  row actions, but left the per-section collapsed review limit split across
  renderers.
- Best path: add a small relationship text review display-limit model that
  preserves the current six-item behavior and lets both renderers use
  `getLimitedResultModel`.

Re-evaluation after implementation:

- Browser section review and mobile context review now use the same collapsed
  six-item limit and hidden-count calculation.
- The slice reduces future drift without changing review routing, migration
  suggestions, batch migration, or cleanup behavior.
- No schema, route, persistence, or product decision changed.

### Shared Mobile Knowledge Overview Display Limits Slice

Implemented:

- Extended `knowledgeDisplayLimits` with the mobile Knowledge overview preview
  limits for schema sections, relationship-backed field summaries, field
  configuration sections, vocabulary rows, and hidden-detail cleanup rows.
- Updated mobile More Knowledge overview lists to use `getLimitedResultModel`
  for visible rows and hidden counts instead of local `slice(...)` and manual
  subtraction.
- Updated mobile More expansion thresholds to read the same shared display
  policy used to build each visible row model.
- Added core coverage for the Knowledge overview preview limits.

Evaluation before implementation:

- The issue was still needed because mobile More is the compact Knowledge hub
  for schema setup, field configuration, vocabulary management, and cleanup,
  but its preview row counts were scattered as page-local numeric constants.
- Root cause: prior slices centralized row copy, action labels, hidden-count
  text, and vocabulary value limits, but the mobile overview caps remained in
  the renderer.
- Best path: extend the existing Knowledge display-limit policy and reuse
  `getLimitedResultModel`; this preserves the current compact mobile layout
  without introducing a new component abstraction.

Re-evaluation after implementation:

- Mobile More now computes visible Knowledge overview rows and hidden counts
  from shared display models across schema sections, relationship-backed field
  summaries, field configuration sections, vocabulary rows, and hidden-detail
  cleanup rows.
- The same shared constants control both row visibility and expansion
  thresholds, reducing future drift in mobile Knowledge workflows.
- No browser behavior, schema, route, persistence, or product decision changed.

### Shared Utilities Compact Knowledge Metrics Slice

Implemented:

- Added `knowledgeSummary.compactMetricLines` to the shared Utilities overview
  model.
- Moved the mobile Project Tools compact Knowledge metrics composition out of
  mobile More and into `@valgaron/core`.
- Updated mobile More to render the compact metric lines directly instead of
  using `metrics.slice(0, 3)` and `metrics[3]`.
- Added shared workflow destination coverage for the compact metric lines.

Evaluation before implementation:

- The issue was still needed because mobile Project Tools rendered a compact
  Knowledge summary by assuming the full metrics array always had exactly four
  items.
- Root cause: browser Utilities displays the full metrics list, while mobile
  needs a denser two-line summary; the compact projection was left in the
  renderer rather than the shared Utilities model.
- Best path: keep the full metrics array for browser and add a compact metric
  projection to the shared model for mobile.

Re-evaluation after implementation:

- Mobile Project Tools now renders compact Knowledge summary lines from the
  shared Utilities model without local slicing or positional indexing.
- Browser Utilities remains unchanged and still renders the full metrics list.
- No route focus behavior, Knowledge schema counts, Utilities actions, or
  product decision changed.

### Shared Entry Editor Base Field Layout Slice

Implemented:

- Added `getEntryEditorBaseFieldLayout` to `@valgaron/core`.
- Moved normal-entry and Timeline-entry leading/trailing base field split rules
  out of browser and mobile renderers.
- Updated browser Timeline editor, browser entry editor, and mobile Entries
  editor to render `leadingFields` and `trailingFields` from the shared layout
  model.
- Added core coverage that normal entries lead with name, summary, and notes
  while Timeline entries lead with name and summary before Timeline-specific
  chronology fields.

Evaluation before implementation:

- The issue was still needed because browser and mobile both depended on the
  same base editor fields but encoded the normal versus Timeline split with
  local `slice(...)` calls.
- Root cause: earlier slices centralized field labels, notes preview copy, and
  Timeline editor groups, but left the base-field layout rule in renderers.
- Best path: add a small shared layout model that preserves existing visual
  order without introducing a broader form abstraction.

Re-evaluation after implementation:

- Browser and mobile entry editors now use the same shared base-field layout
  for normal and Timeline records.
- The renderer scan no longer finds local `baseFields.slice(...)` usage in the
  entry editor surfaces.
- No schema, route, persistence, field labels, notes preview behavior, or
  product decision changed.

### Shared In-Fiction World Draft Field Layout Slice

Implemented:

- Added `getPlanetaryWorldDraftFieldLayout` to `@valgaron/core`.
- Moved the browser Workspaces in-fiction world form's first-four/trailing
  field split out of the renderer.
- Updated browser Workspaces and mobile Workspaces to consume the shared
  in-fiction world draft field layout.
- Added core coverage for the leading and trailing field groups.

Evaluation before implementation:

- The issue was still needed because in-fiction world form fields are shared by
  browser and mobile, but the browser form encoded its grid/trailing split with
  local `slice(...)` calls while mobile consumed the raw descriptor list.
- Root cause: earlier Workspaces slices centralized field descriptors, form
  titles, and action copy, but not the form layout projection.
- Best path: add a small layout helper beside the existing draft field
  descriptors, preserving current browser grid behavior and mobile sequential
  rendering.

Re-evaluation after implementation:

- Browser Workspaces now uses shared leading/trailing in-fiction world draft
  fields, and mobile Workspaces maps the shared full field layout.
- The renderer scan no longer finds `planetaryWorldDraftFields.slice(...)`.
- No schema, persistence, draft normalization, validation, or product decision
  changed.

### Shared Entry Card Detail Preview Slice

Implemented:

- Added `getEntryCardDetailPreviewModel` to `@valgaron/core`.
- Moved the browser entry card's compact two-detail preview assembly out of the
  renderer.
- Updated browser `EntryCard` to render the shared preview model.
- Added core coverage for the compact preview cap and text.

Evaluation before implementation:

- The issue was still needed because entry cards are a primary scanning surface
  in browser Workbench/section lists, but their detail preview cap and text
  assembly were local renderer logic.
- Root cause: entry detail display and list row copy were centralized earlier,
  while the compact card preview remained embedded in the component.
- Best path: add a small model helper that preserves the existing two-detail
  preview without expanding the entry list model contract.

Re-evaluation after implementation:

- Browser entry cards now use the same core detail-field resolution and compact
  preview model.
- The renderer scan no longer finds the local card-detail `slice(0, 2)` chain.
- No mobile behavior, route behavior, field visibility rules, or product
  decision changed.

### Shared Custom Entry Type Draft Field Layout Slice

Implemented:

- Added `getEntryTypeDraftFieldLayout` to `@valgaron/core`.
- Moved the browser Knowledge custom entry type form's leading/trailing field
  split out of the renderer.
- Updated browser Knowledge and mobile More to consume the shared custom entry
  type draft field layout.
- Added core coverage for the shared full, leading, and trailing field groups.

Evaluation before implementation:

- The issue was still needed because custom entry type creation is a shared
  browser/mobile Knowledge workflow, but the browser encoded its two-column
  first-row layout with local `slice(...)` calls while mobile rendered the raw
  descriptor list.
- Root cause: earlier Knowledge slices centralized the draft field descriptors,
  parsing, preview, and validation behavior without centralizing the form layout
  projection.
- Best path: add a small shared layout helper beside the existing descriptor
  list, preserving browser density and mobile sequential rendering without
  schema, route, or persistence changes.

Re-evaluation after implementation:

- Browser Knowledge now uses shared leading/trailing custom entry type draft
  fields, and mobile More maps the shared full field layout.
- The remaining renderer-local `entryTypeDraftFields` uses are for descriptor
  lookup and typing rather than layout splitting.
- No field labels, validation, draft normalization, schema migration, or product
  decision changed.

### Shared Workbench Record View Limit Slice

Implemented:

- Added `workbenchDisplayLimits.recordViewRows` to `@valgaron/core`.
- Replaced the browser Workbench page's local `viewLimit: 24` with the shared
  named limit.
- Added display-limit coverage for the Workbench record view cap.

Evaluation before implementation:

- The issue was still needed because browser Workbench was the last production
  surface passing a hardcoded record index cap directly into the shared
  Workbench model.
- Root cause: the core Workbench index already accepted an injected `viewLimit`,
  but only selected-record drafting prompt caps had been named in
  `workbenchDisplayLimits`.
- Best path: add a named display limit and keep the existing Workbench model API
  unchanged, preserving browser density and mobile's existing platform-specific
  entry result cap.

Re-evaluation after implementation:

- Browser Workbench now uses a named shared record view cap.
- Mobile remains intentionally governed by `mobileFeatureDisplayLimits` for its
  smaller-screen entry results.
- No record filtering, routing, selection, query, or persistence behavior
  changed.

### Shared Entry Tag Label Adoption Slice

Implemented:

- Updated browser entry cards to use `entryDisplayCopy.tagsLabel` for tag-row
  accessibility instead of a renderer-local literal.
- Updated mobile Workbench selected-record context to use the same shared tag
  label before the selected entry's tag list.

Evaluation before implementation:

- The issue was still needed because browser entry detail already consumed the
  shared entry display tag label, while browser entry cards and mobile
  Workbench context still hardcoded the same label locally.
- Root cause: tag metadata copy was centralized for detail display first, but
  compact entry-card and selected-context render paths were left behind.
- Best path: adopt the existing `entryDisplayCopy.tagsLabel` in the two
  renderers without adding a new model or changing tag layout.

Re-evaluation after implementation:

- Browser card tag rows, browser detail tag rows, and mobile selected-context
  tag summaries now share the same entry display label source.
- No tag parsing, filtering, routing, persistence, or platform layout behavior
  changed.

### Shared Timeline Table Label Adoption Slice

Implemented:

- Added shared Timeline table column labels for order, event, date, era, links,
  and actions.
- Updated the browser entry-detail Timeline table to consume the shared column
  labels.
- Updated the same table's unassigned-era fallback to consume
  `timelineFeatureCopy.unassignedEraLabel`.
- Replaced the Timeline grouping helper's local unassigned-era fallback with
  the same shared label.

Evaluation before implementation:

- The issue was still needed because the browser Timeline table caption already
  used shared Timeline copy, while the adjacent column headers and one
  unassigned-era fallback remained renderer literals.
- Root cause: earlier Timeline copy slices centralized regions, filters, era
  summaries, and row actions, but left the table header labels from the first
  browser table implementation.
- Best path: extend `timelineFeatureCopy` with a narrow table-column label
  contract and reuse the existing unassigned-era label, without changing the
  Timeline table layout or mobile stacked Timeline presentation.

Re-evaluation after implementation:

- Browser Timeline table caption, headers, and unassigned-era fallback now share
  Timeline copy ownership.
- Timeline era grouping now uses the same unassigned-era label as browser and
  mobile filters.
- No Timeline sorting, grouping, route, relationship, or persistence behavior
  changed.

### Shared Utilities Overview Empty-State Copy Slice

Implemented:

- Added shared `reviewSummary.emptyActionText` to the Utilities overview model.
- Updated browser Utilities and mobile More to consume the shared no-hotspots
  message.
- Updated mobile More to use the shared Utilities overview title for the Project
  Tools section instead of a local literal.
- Added focused Utilities overview coverage for the empty review-hotspots state
  copy.

Evaluation before implementation:

- The issue was still needed because the Utilities overview model already owned
  the Project Tools title, review-hotspots title, detail, metrics, and actions,
  but mobile still hardcoded the section title and both platforms hardcoded the
  no-hotspots message.
- Root cause: the Review Hotspots empty state was added at the renderer layer
  after the overview model was created.
- Best path: extend the existing overview model with one empty-state text field
  and adopt the existing shared title in mobile More.

Re-evaluation after implementation:

- Browser Utilities and mobile More now share Project Tools and Review Hotspots
  empty-state copy through the Utilities overview model.
- No destination routing, review hotspot detection, metrics, or action behavior
  changed.

### Shared Relationship Entry Filter Label Slice

Implemented:

- Added shared relationship list entry-filter labels for the filter field and
  the empty `Any entry` option.
- Updated browser Relationship Studio Links filtering to consume the shared
  labels.
- Added focused relationship copy coverage for the labels.

Evaluation before implementation:

- The issue was still needed because browser Links mode already consumed shared
  relationship search labels, type-filter labels, and clear-filter labels, but
  the adjacent entry filter label and empty option remained local literals.
- Root cause: the entry filter select is browser-specific, so it was left out
  when shared Relationship Studio search and filter copy was centralized.
- Best path: add two narrow copy fields to `relationshipFeatureCopy` and adopt
  them in the browser select without forcing mobile to render the same native
  select interaction.

Re-evaluation after implementation:

- Browser Relationship Studio Links filter copy now comes from the same shared
  relationship copy source as the other filters.
- Mobile remains unchanged because it uses a different touch workflow for
  entry-filter state.
- No relationship filtering, routing, graph, or saved-link behavior changed.

### Shared Mobile Destructive Hint Model Slice

Implemented:

- Added a shared delete accessibility hint to custom entry type Knowledge rows.
- Added shared delete accessibility hints to workspace and in-fiction world row
  models.
- Updated mobile More and mobile Workspaces destructive buttons to consume the
  shared hints instead of local literals.
- Added focused Knowledge and Workspaces model coverage for the hint contract.

Evaluation before implementation:

- The issue was still needed because mobile destructive buttons already used
  shared row-specific labels and confirmation subjects, but several
  accessibility hints still lived as mobile-only literals.
- Root cause: earlier destructive-confirmation slices centralized titles,
  labels, and subjects first, leaving static hint text beside mobile button
  rendering.
- Best path: add narrow hint fields to the existing shared row models and adopt
  them in mobile, without changing confirmation behavior or adding browser-only
  hints where the browser layout does not currently use them.

Re-evaluation after implementation:

- Mobile custom entry type, workspace, and in-fiction world destructive actions
  now receive labels, confirmation subjects, and hints from shared models.
- Browser behavior remains unchanged, and destructive mutation/confirmation
  flows are untouched.

## Final Implementation Recommendation

The first milestone described above is now implemented for the current
prototype scope. Continue with targeted UX slices only when they remove observed
workflow friction or close a documented parity gap.

Current completed baseline includes:

- Canonical browser Workbench record route.
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
- Knowledge-owned custom entry types, user field management, durable browser
  Vocabulary Manager, hidden-detail cleanup, and schema portability coverage.
- Schema `3` workspace-owned vocabularies with clean-break v3 storage,
  export/import, Markdown reference export, and diagnostics count coverage.
- Custom Timeline event editor grouping for chronology, outcomes, involved
  records, contextual create-and-link, and existing relationship summaries.
- Browser Workbench dirty-route protection for inline editor state.
- Selected-record Workbench review summaries for drafting prompts and legacy
  link text.
- Utilities/More consolidation with top-level Data, Workspaces, and focused
  Help shortcuts that keep daily creative workflows primary.
- Cross-surface Review Hotspots in Project Tools that route to existing
  Workbench, Timeline, Relationship Studio, and Knowledge review surfaces
  without introducing a durable triage queue.

The remaining approved durable schema/vocabulary track should continue with
broader workflow refinements rather than missing durable schema capabilities.

A durable cross-surface triage queue remains gated until users need assignment,
dismissal, severity ordering, or progress tracking across Workbench selected
context, Timeline Review, Relationship Studio Review, and Knowledge cleanup.
Additional Utilities consolidation should only proceed after observed
navigation friction, because the current Project Tools hub exposes Knowledge
setup, Data, Workspaces, and focused Help from the first screenful on browser
and mobile.

The next implementation should stay slice-based: evaluate observed workflow
friction in the active Workbench, Timeline, Relationship Studio, or Knowledge
surface, then add only the smallest shared browser/mobile model or control that
removes that friction before re-evaluating.
