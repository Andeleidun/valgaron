# Valgaron Worldbuilding Prototype Plan

This document defines a practical path from the current local World Codex slice into a fully functioning browser-local worldbuilding prototype. It starts with clarifying questions because several product decisions will materially change the data model, UI structure, and implementation order. Until those answers are available, the plan uses conservative assumptions that preserve the current Valgaron constraints: English-only UI, local browser persistence, no account system, no backend, no collaboration, no social product surfaces, and no native/mobile parity target.

## Clarifying Questions

### Creative Workflow

1. What is the primary writing workflow this prototype should support: reference lookup while drafting, structured world bible maintenance, exploratory brainstorming, or campaign/session preparation?
2. Should the app optimize for one large world, multiple separate worlds, or one Valgaron workspace only?
3. Should entries be mostly short structured records, long-form wiki pages, or a hybrid with both structured fields and freeform notes?
4. Do you expect writers to start from templates, blank records, or imported seed material?
5. Should the prototype support canon status such as Draft, Canon, Deprecated, Contradiction, or Needs Review?
6. Should entries support private scratch notes separate from polished reference text, even though everything is local?

### Codex Scope

1. Are the current five sections enough for the prototype: Characters, Places, Factions, Lore, and Timeline?
2. Should additional record types be first-class, such as Artifacts, Creatures, Cultures, Languages, Magic Systems, Religions, Species, Scenes, Chapters, Quests, or Plot Threads?
3. Should users be able to create custom entry types, or should the prototype use a fixed schema for reliability?
4. Should every entry have the same base fields plus type-specific fields, or should fields be customizable per entry?
5. Should tags remain simple text, or should they become managed taxonomy records with descriptions and colors?

### Relationships And World Logic

1. Which relationship types matter most: character to faction, place to faction, event to character, lore to place, cause and consequence between events, family ties, political alliances, rivalries, ownership, or location?
2. Should relationships be directional, such as "member of" versus "has member"?
3. Should relationships have notes, dates, confidence, canon status, or source references?
4. Should the UI include a graph-like relationship view, or is a linked-reference list enough for the prototype?
5. Should the app surface contradictions, orphaned entries, missing links, duplicated names, or timeline conflicts?

### Timeline And Chronology

1. Should timeline events use flexible prose dates only, sortable numeric dates, eras plus year offsets, or both?
2. Should events support ranges, unknown dates, approximate dates, or alternate calendars?
3. Should timeline browsing be visual, table-based, or grouped by era?
4. Should an event be linkable to involved characters, places, factions, lore notes, and related events?

### Search, Organization, And Navigation

1. What should global search cover: names only, summaries, tags, all fields, relationship notes, and timeline dates?
2. Which filters are essential: entry type, tag, canon status, updated date, linked/unlinked state, location, faction, or custom fields?
3. Should the app have a command palette for fast entry creation and navigation?
4. Should recently edited, pinned, incomplete, and orphaned entries be shown on the overview?
5. Should users be able to bookmark or pin important entries?

### Data Ownership And Portability

1. Should import/export be required for the prototype, and if so should it be JSON-only or include Markdown export?
2. Should exports be single-file world backups, per-section files, or both?
3. Should the app keep automatic local snapshots before destructive actions?
4. Should there be a visible storage status, last-saved timestamp, and local-only warning?
5. Should reset-to-seed remain available once user data workflows are added, or should it move behind a confirmation dialog?

### Editing Experience

1. Should editing happen in a side panel, full page, modal, or split view?
2. Should fields save immediately, save on explicit button press, or support both draft and commit behavior?
3. Should entries support Markdown-like formatting, plain text only, or rich text controls?
4. Should images or reference URLs be supported in the prototype, and should images be stored as local object URLs, base64 data, or external links only?
5. Should delete, duplicate, archive, and restore actions be part of the prototype?

### Prototype Definition

1. What does "fully functioning prototype" mean for this phase: complete CRUD and navigation, import/export, relationship linking, timeline tools, visual polish, or all of these?
2. Is persistence through browser refresh sufficient, or should the prototype include manual backups as a required acceptance gate?
3. Should the prototype work fully offline after the first page load?
4. Are browser support targets limited to current Chromium, or should Firefox and Safari also be considered?
5. What is the target device posture: desktop-first, tablet-friendly, or mobile usable?

### Drafting Assistance And Prompts

1. Should the prototype include non-AI drafting prompts, random tables, or guided completeness checks?
2. Should the app suggest missing fields, missing relationships, or unresolved questions?
3. Should any future AI-assisted generation be considered later, or is this prototype strictly manual?
4. Should templates be generic fantasy templates, Valgaron-specific templates, or both?

## Working Assumptions Until Answered

- The prototype supports multiple local worlds.
- It remains local-first and browser-only, using localStorage unless a lightweight IndexedDB layer becomes necessary for size or attachment handling.
- The first fully functioning prototype should include complete create, read, update, delete, duplicate, search, filter, relationship linking, timeline browsing, import, export, and reset flows.
- Entry types are customizable, while the starter Valgaron world still ships with default character, place, faction, lore, and timeline types.
- Templates and completeness prompts are rule-based and local only.
- Entry notes support Markdown-style authoring.
- Archive and restore are the default removal workflow; permanent delete is available only behind explicit confirmation.
- Relationship views should include a graph-style view once linked-list relationship management is stable.
- Export includes both single-file JSON world backups and Markdown export.
- UI copy stays hardcoded in English.
- MUI, Emotion, and the retained MUI-based reusable component layer remain available.
- No account, backend, sharing, collaboration, publishing, moderation, or native parity scope is included.

## Product Goal

Build a local browser worldbuilding workspace that lets a writer create, organize, connect, search, and preserve Valgaron world records quickly enough to use during active drafting. The app should feel like a practical world bible tool rather than a demo page. It should preserve the fast iteration of the current codex while adding the missing workflows that make it usable over repeated sessions.

## Product Non-Goals

- No authentication or user accounts.
- No cloud sync, backend, Firebase, collaboration, sharing, or publishing.
- No translation or localization system.
- No social, dating, matching, messaging, community, moderation, trust, or safety product surfaces.
- No native mobile app or web/native parity work.
- No promise of secure storage, backup, privacy isolation, or production-grade durability.
- No large content management system or plugin architecture during this prototype phase.

## Target Users And Use Cases

### Primary User

A fiction or fantasy writer maintaining a working world bible while drafting Valgaron stories.

### Secondary User

A game master or campaign designer using Valgaron-like records to organize places, factions, characters, lore, and historical events.

### Core Use Cases

1. Quickly create a new character, place, faction, lore note, or timeline event.
2. Search for a known item by name, tag, summary, or detail field.
3. Browse all entries in a section and narrow by tags or status.
4. Open an entry and see its structured details, notes, linked records, and timeline references.
5. Connect entries, such as a character belonging to a faction or an event affecting a place.
6. Find incomplete or unlinked records that need more worldbuilding attention.
7. Export a local backup and import it later without losing the world structure.
8. Reset to seed data only after an explicit confirmation.
9. Use templates and completeness prompts to identify underdeveloped records.

## Current State

The current app already provides the first usable slice:

- Overview with section totals and recent entries.
- Sections for Characters, Places, Factions, Lore, and Timeline.
- Create and edit forms with required names, summaries, tags, and type-specific fields.
- Section-local search and tag filters.
- Seed data for Valgaron.
- localStorage persistence with invalid-data fallback.
- Focused Jest tests for codex utilities and storage behavior.
- MUI dependencies retained for reusable component infrastructure.

## Fully Functioning Prototype Definition

The prototype should be considered fully functioning when it supports the workflows below without requiring code edits or manual localStorage manipulation:

1. Entry Management: create, edit, delete, duplicate, archive, restore, and view entries across every section.
2. Organization: global search, section filters, tag filtering, status filtering, sorting, pinned entries, and recently updated entries.
3. Relationships: add, view, edit, and remove typed links between entries.
4. Timeline: browse events by era/order, link events to related entries, and filter timeline by tag, era, involved entity, or status.
5. Data Portability: export a world backup, import a valid backup, reject invalid imports safely, and reset seed data with confirmation.
6. Local Persistence: preserve data through refresh, tolerate unavailable storage gracefully, and expose local save status.
7. Usability: provide clear empty states, error states, keyboard-accessible controls, and responsive layouts.
8. Validation: maintain passing Jest, typecheck, lint, and Vite build checks.

## Prototype Quality Bar

The prototype does not need production infrastructure, but it should be coherent enough for real local use:

- It should never require manual edits to localStorage for ordinary workflows.
- It should not silently discard user-created entries during import, reset, migration, or invalid-data recovery.
- It should show clear feedback for saves, failed saves, imports, exports, resets, deletes, archive actions, and validation errors.
- It should avoid dead-end screens by always offering create, clear filter, back, or reset actions where appropriate.
- It should keep long text readable and editable without layout overlap.
- It should keep all domain rules in utilities rather than burying them in route components.

## Information Architecture

### Global Shell

- Header with Valgaron brand, primary navigation, global search, and data actions.
- Primary navigation: Overview, Characters, Places, Factions, Lore, Timeline, Relationships, Data.
- Main landmark with route-specific content.
- Optional toast/status region for save, import, export, and destructive action feedback.

### Overview

- Section totals.
- Recently updated entries.
- Pinned entries.
- Incomplete entries.
- Orphaned entries with no relationships.
- Timeline highlights.
- Quick create buttons for each entry type.

### Section Pages

- Search field.
- Filter controls for tag, status, and updated date.
- Sort control for name, updated date, creation date, status, or timeline order where relevant.
- Entry list with density suitable for repeated editing.
- Detail/editor panel or full detail route.
- Empty state when no entries exist.
- Empty result state when filters hide all entries.

### Entry Detail

- Display mode and edit mode.
- Base fields: name, summary, tags, status, pinned, archived, updatedAt, createdAt.
- Type-specific fields.
- Freeform notes.
- Relationship list grouped by relationship type.
- Timeline references where applicable.
- Actions: edit, duplicate, archive, delete, restore, copy name, export entry.

### Relationships

- Relationship browser grouped by source entry, target entry, or relationship type.
- Create relationship form with source, target, type, direction, note, and optional status.
- Entry detail should show both outgoing and incoming relationships.
- Deleted or archived entries should not leave broken relationship displays.

### Timeline

- Timeline event list grouped by era.
- Sortable event order.
- Filters for era, tag, involved entry, and status.
- Event detail with linked entities and consequences.
- Optional compact chronological view after the table/list workflow is stable.

### Data

- Storage status and last saved timestamp.
- Export world JSON.
- Import world JSON with validation and preview.
- Reset to seed with typed confirmation.
- Optional snapshot list if automatic snapshots are included.

## Architecture And Ownership Plan

The implementation should keep route components focused on orchestration and move reusable domain logic into narrow utilities.

### Proposed Source Modules

- `src/types.ts`: shared entry, relationship, timeline, import/export, and world document types.
- `src/Utlilities/seedCodex.ts`: seed world document and section configuration.
- `src/Utlilities/worldDocument.ts`: document creation, migration, schema defaults, and validation entry points.
- `src/Utlilities/codexEntries.ts`: entry creation, update, duplicate, archive, restore, delete, and field helpers.
- `src/Utlilities/codexRelationships.ts`: relationship creation, lookup, reverse lookup, filtering, and cleanup.
- `src/Utlilities/codexSearch.ts`: search indexing, query normalization, filtering, and sorting.
- `src/Utlilities/codexTimeline.ts`: event ordering, era grouping, and timeline filters.
- `src/Utlilities/codexImportExport.ts`: export serialization, import parsing, import preview, and import validation.
- `src/Utlilities/codexStorage.ts`: local persistence, storage availability handling, and storage-key ownership.
- `src/App.tsx`: app shell, route composition, and top-level state wiring.
- `src/Components/Common`: retained reusable MUI-based primitives.
- Future route components may be extracted under `src/Pages` only if the app shell becomes too large; do not recreate copied social-app pages.

### State Management Approach

- Start with `useReducer` or small pure reducer helpers once entry actions exceed simple create/edit flows.
- Keep reducer actions typed with discriminated unions.
- Keep persistence as an effect at the shell boundary.
- Keep import/reset/delete-all actions explicit and confirmation-gated.
- Avoid introducing a global state library for this prototype unless reducer complexity becomes a real blocker.

### Component Strategy

- Prefer existing retained MUI-based reusable primitives for controls, layout, and feedback.
- Create feature components only when repeated UI appears in multiple routes.
- Keep forms controlled and typed.
- Keep dialogs accessible with labels, focus return, and keyboard dismissal.
- Avoid decorative or marketing-style surfaces; prioritize dense, scannable editing workflows.

## Data Model Plan

### Base Entry

Every entry should include:

- `id`: stable local id.
- `kind`: entry type.
- `name`: required display name.
- `summary`: short description.
- `notes`: long-form working notes.
- `tags`: string array.
- `status`: `draft`, `canon`, `needs-review`, `deprecated`, or `archived`.
- `pinned`: boolean.
- `createdAt`: ISO timestamp.
- `updatedAt`: ISO timestamp.

### Entry Types

Characters:

- role
- home
- affiliation
- statusNote
- traits
- goals

Places:

- region
- climate
- significance
- hazards
- resources

Factions:

- purpose
- influence
- headquarters
- leadership
- publicFace

Lore Notes:

- category
- source
- implications
- openQuestions

Timeline Events:

- dateLabel
- era
- sortOrder
- consequences
- involvedEntryIds

### Relationships

Relationship records should be separate from entries:

- `id`
- `sourceEntryId`
- `targetEntryId`
- `type`
- `directional`
- `note`
- `status`
- `createdAt`
- `updatedAt`

Initial relationship types:

- member of
- located in
- controls
- allied with
- opposed to
- founded by
- affected by
- caused
- references
- related to

### World Document

The persisted world document should include:

- `schemaVersion`
- `world`
  - name
  - summary
  - defaultEra
- entry collections
- relationships
- savedAt
- settings
  - activeFilters
  - pinnedEntryIds
  - preferredDensity

## Data Invariants And Error Handling

These rules should be enforced by pure helpers and tests:

- Every entry id is unique across all entry collections.
- Every relationship id is unique.
- Relationship source and target ids must either resolve to known entries or be represented as broken references with clear UI treatment.
- Archived entries remain addressable by relationships but are hidden from default browsing.
- Deleted entries either remove dependent relationships or convert them into broken-reference records according to the chosen delete policy.
- Imported data must include a recognized schema version or migrate from a known legacy shape.
- Imported data must be validated before replacing current data.
- Failed imports must leave the current world document unchanged.
- Failed storage reads should fall back to seed or current in-memory state without crashing.
- Failed storage writes should show local-only failure feedback and should not claim successful persistence.
- Timestamps should be valid ISO strings before display formatting.
- Empty required names should be rejected before save.
- Tags should be normalized consistently.

### Migration Strategy

- Introduce `schemaVersion` before broadening fields.
- Preserve support for the current v1 localStorage shape and migrate it into the richer shape.
- Keep migration functions pure and covered by Jest.
- Reject unrecognized or unsafe imported data with clear user feedback.

## Implementation Slices

Each slice should be completed and verified before moving to the next.

### Slice 1: Data Model Foundation

Goal: establish a richer, versioned local world document without changing user-visible workflows more than necessary.

Tasks:

1. Add typed `WorldDocument`, `WorldMetadata`, `WorldEntryStatus`, and `WorldRelationship` models.
2. Add `schemaVersion`, `createdAt`, `notes`, `status`, and `pinned` support.
3. Add pure migration helpers from the current codex shape to the new document shape.
4. Update seed data to include the new fields.
5. Update storage load/save to validate and migrate known shapes.
6. Add Jest tests for migration, validation, and fallback behavior.

Acceptance criteria:

- Existing saved codex data loads into the new document shape.
- Invalid stored data falls back without crashing.
- Typecheck, Jest, ESLint, and Vite build pass.

### Slice 2: Entry Detail And Full CRUD

Goal: make entries manageable as real records, not only create/edit list items.

Tasks:

1. Add entry detail display mode.
2. Add delete with confirmation.
3. Add archive and restore.
4. Add duplicate.
5. Add pinned toggle.
6. Add notes and status fields to the editor.
7. Preserve selected entry behavior through create, edit, archive, restore, and delete.
8. Add focused tests for entry reducers/helpers.

Acceptance criteria:

- Users can create, view, edit, duplicate, archive, restore, and delete records.
- Destructive actions require confirmation.
- Archived entries are hidden by default but can be shown.
- Pinned entries appear on the overview.

### Slice 3: Global Search, Sorting, And Filters

Goal: make the codex navigable as it grows.

Tasks:

1. Add global search across all entry fields.
2. Add a global search route or panel with grouped results.
3. Add section sorting controls.
4. Add filters for tag, status, archived state, pinned state, and updated date.
5. Persist non-sensitive UI preferences locally if useful.
6. Add tests for search indexing and filter helpers.

Acceptance criteria:

- Search finds entries by name, summary, tags, notes, and type-specific details.
- Results clearly show section and match context.
- Filters can be cleared quickly.
- Empty states remain useful.

### Slice 4: Templates, Completeness, And Drafting Prompts

Goal: make records easier to flesh out without adding AI, backend, or custom plugin complexity.

Tasks:

1. Add local templates for each entry type.
2. Add optional completeness rules per section.
3. Add overview cards for incomplete entries and unresolved questions.
4. Add prompt suggestions such as missing motivation, missing headquarters, or missing consequence.
5. Add a per-entry "questions to answer" notes area if approved.
6. Add tests for completeness scoring and prompt selection.

Acceptance criteria:

- Users can start from a section-specific template.
- Incomplete records are easy to find.
- Prompts are deterministic, local, and editable.
- No generated text or external service is introduced.

### Slice 5: Relationship Linking

Goal: let world records explain how they connect.

Tasks:

1. Add relationship data model and seed relationships.
2. Add relationship creation/edit/delete helpers.
3. Add relationship panels to entry detail.
4. Add relationship browser route.
5. Add relationship type selector.
6. Handle archived/deleted target entries clearly.
7. Add tests for relationship creation, reverse lookup, deletion cleanup, and filtering.

Acceptance criteria:

- Users can link any entry to any other entry.
- Entry detail shows incoming and outgoing relationships.
- Relationship browser can filter by type and entry.
- Deleting an entry handles related relationships predictably.

### Slice 6: Timeline Upgrade

Goal: make timeline events useful for historical reasoning.

Tasks:

1. Add sortable timeline order.
2. Add era grouping.
3. Add involved-entry links.
4. Add event consequence display.
5. Add filters for era, tag, status, and involved entry.
6. Add tests for timeline sorting and grouping.

Acceptance criteria:

- Timeline events display in a stable, explainable order.
- Events can be linked to characters, places, factions, and lore notes.
- Users can filter the timeline by era or involved entry.

### Slice 7: Data Import, Export, Reset, And Snapshots

Goal: make the local prototype safe enough for real repeated use.

Tasks:

1. Add export world JSON.
2. Add import world JSON with validation.
3. Add import preview showing counts and schema version.
4. Add reset-to-seed confirmation.
5. Add optional automatic snapshot before import/reset/delete-all.
6. Add user-visible save status and last saved time.
7. Add tests for export serialization, import validation, and reset behavior.

Acceptance criteria:

- Users can export and re-import a world backup.
- Invalid imports never overwrite current data.
- Reset is deliberate and reversible if snapshots are enabled.
- Save status does not make security or backup claims.

### Slice 8: UX Polish And Accessibility

Goal: make the prototype comfortable for repeated use.

Tasks:

1. Review keyboard access for navigation, forms, filters, dialogs, and relationship controls.
2. Add clear focus styles where missing.
3. Add responsive layouts for desktop, tablet, and narrow mobile widths.
4. Add empty/loading/error states for every route.
5. Add compact density options only if the default density is insufficient.
6. Review color contrast and text overflow.
7. Add accessible confirmation dialogs.

Acceptance criteria:

- All primary flows are keyboard usable.
- Form labels and controls are clear.
- No obvious text overlap at common widths.
- Mobile/narrow layout remains usable even without native parity scope.

### Slice 9: Prototype Hardening

Goal: remove remaining prototype footguns before declaring the slice complete.

Tasks:

1. Audit unused files and exports.
2. Add tests around migration, reducers, relationship helpers, search helpers, and import/export helpers.
3. Add a short manual QA checklist.
4. Run validation commands.
5. Update README with completed prototype capabilities and constraints.

Acceptance criteria:

- No stale copied-app surfaces remain active.
- Tests cover core data behavior.
- README accurately describes runtime behavior.
- Validation passes.

## Suggested Build Order

1. Data Model Foundation.
2. Entry Detail And Full CRUD.
3. Global Search, Sorting, And Filters.
4. Templates, Completeness, And Drafting Prompts.
5. Relationship Linking.
6. Timeline Upgrade.
7. Data Import, Export, Reset, And Snapshots.
8. UX Polish And Accessibility.
9. Prototype Hardening.

This order prioritizes stable data contracts first, then record workflows, then cross-record intelligence, then portability and polish.

## Testing Strategy

### Unit Tests

- Entry creation, update, duplicate, archive, restore, and delete helpers.
- Tag normalization and status filtering.
- Search indexing and query matching.
- Relationship creation, lookup, and cleanup.
- Timeline sorting and grouping.
- Template application and completeness scoring.
- Storage validation and migration.
- Import/export serialization.

### Integration-Level Component Tests

Add only when the UI structure stabilizes enough to justify them:

- Entry form saves required and optional fields.
- Delete/archive confirmation prevents accidental loss.
- Search results navigate to entries.
- Import preview rejects invalid data.

### Manual Runtime Checks

- App loads from empty storage.
- App loads from existing v1 storage.
- Creating and editing entries persists through refresh.
- Deleting, archiving, and restoring behave as expected.
- Duplicating entries creates a new id and preserves intended fields.
- Pinned and incomplete entries appear on the overview.
- Relationship links render correctly from both related entries.
- Import/export round trip preserves counts and relationships.
- Narrow viewport remains usable.

## Validation Commands

Run after source changes:

```bash
npm test
npm run typecheck
npx eslint .
npx vite build
npm run build
```

Run Markdown formatting after planning/documentation edits:

```bash
npx prettier --write WORLD_BUILDING_PROTOTYPE_PLAN.md
```

## Risks And Mitigations

### Risk: localStorage Size And Reliability

Mitigation: keep content text-focused for now, add export/import early, and consider IndexedDB only if content size or attachment handling requires it.

### Risk: Data Model Grows Too Quickly

Mitigation: keep fixed entry types for the prototype, add migrations before broad UI changes, and avoid custom fields until core workflows are stable.

### Risk: Relationship UI Becomes Too Complex

Mitigation: start with linked lists and filters before any graph visualization.

### Risk: Destructive Actions Cause Data Loss

Mitigation: add confirmations, archive before delete where possible, export/import, and optional snapshots before destructive global actions.

### Risk: App Becomes A Wiki Instead Of A Drafting Tool

Mitigation: keep quick create, quick search, recent work, incomplete entries, and relationship prompts central to the UI.

### Risk: Over-Investing In Infrastructure

Mitigation: stay local-first, typed, and simple. Do not add backend, auth, collaboration, localization, or native layers in this prototype phase.

### Risk: Completeness Rules Feel Prescriptive

Mitigation: treat prompts as optional drafting aids, keep them editable or dismissible, and avoid blocking saves based on completeness scores.

## Decision Gates

The user has answered the initial decision gates:

1. Multiple worlds, not a single Valgaron-only workspace.
2. Custom entry types.
3. Markdown-style notes.
4. Archive and restore by default, with permanent delete behind confirmation.
5. Graph-style relationship view as part of the prototype target.
6. JSON and Markdown export.
7. Rule-based templates and completeness prompts.
8. localStorage remains the persistence target, and a full world must always be exportable as one JSON file.

Ask the user before reopening any of these decisions or before adding backend, account, collaboration, native, or non-local persistence scope.

## Definition Of Done For The Full Prototype

- The app opens directly to a useful worldbuilding workspace.
- A user can manage all core entry types without touching code.
- A user can connect entries and inspect those connections.
- A user can search and filter the world quickly.
- A user can find incomplete records and continue drafting them.
- A user can browse timeline events coherently.
- A user can export and import a backup.
- A user can recover from invalid local storage data without a crash.
- Destructive actions are deliberate.
- README and AGENTS remain aligned with runtime behavior.
- Jest, typecheck, lint, and build validation pass.

## Implementation Checklist

- [x] Confirm answers to clarifying questions or accept working assumptions.
- [x] Implement versioned world document.
- [x] Migrate current storage data.
- [x] Add full CRUD actions.
- [x] Add detail view and notes.
- [x] Add status, pinned, archived, and timestamps.
- [x] Add global search.
- [x] Add sorting and richer filters.
- [x] Add templates and completeness prompts.
- [x] Add relationships.
- [x] Add relationship browser.
- [x] Upgrade timeline ordering and links.
- [x] Add export.
- [x] Add import validation and preview.
- [x] Add reset confirmation.
- [x] Add save status.
- [x] Review accessibility and responsive layout.
- [x] Expand Jest coverage.
- [x] Update README.
- [x] Run final validation.

## Plan Review And Improvement Log

### Review Pass 1

Evaluation performed:

- Checked that the document begins with clarifying questions.
- Checked that the plan follows the current local-first, English-only, no-auth, no-backend constraints.
- Checked that the plan includes entry management, relationships, timeline, import/export, testing, and validation.
- Checked for missing implementation ownership and missing data invariants.

Findings:

1. The initial plan described product slices but did not name clear source-module ownership.
2. The initial plan did not explicitly list data invariants or localStorage failure handling rules.
3. The initial plan asked about templates but did not include an implementation slice for templates or completeness prompts.
4. The initial plan lacked a review log documenting what was evaluated and improved.

Fixes applied:

1. Added `Architecture And Ownership Plan`.
2. Added `Data Invariants And Error Handling`.
3. Added `Slice 4: Templates, Completeness, And Drafting Prompts`.
4. Added this review and improvement log.

Re-evaluation:

- The plan now has questions, assumptions, product boundaries, architecture ownership, data model, invariants, phased implementation, tests, validation, risks, decision gates, and a done definition.
- No known plan gap remains that would block starting Slice 1 under the working assumptions.

### Review Pass 2

Evaluation performed:

- Re-read implementation slice headings and build-order numbering after adding the template slice.
- Checked for duplicate headings and inconsistent slice numbers.

Finding:

1. A stale `Slice 4: Relationship Linking` heading remained above the new template slice.

Fix applied:

1. Removed the stale duplicate heading so the slices now run from Slice 1 through Slice 9 without duplicate section titles.

Re-evaluation:

- Slice numbering and the suggested build order are aligned.

### Decision Capture

Evaluation performed:

- Captured the user's answers to the initial clarifying questions.
- Re-checked the implementation slices against those answers.

Findings:

1. The original working assumptions still implied a single fixed Valgaron workspace and fixed entry types.
2. Export planning mentioned JSON and Markdown as a decision gate but did not record the confirmed choice.
3. Relationship planning allowed graph visualization as an option but did not record it as a target.

Fixes applied:

1. Updated working assumptions to require multiple worlds and custom entry types.
2. Recorded Markdown notes, archive-first delete, graph-style relationship views, JSON plus Markdown export, templates, and localStorage single-file JSON export.
3. Converted the initial decision gates into confirmed decisions.

Re-evaluation:

- Slice 1 should now start from a versioned multi-world local document model with custom entry type definitions.

### Implementation Pass: Relationship Linking

Evaluation performed:

- Checked the existing schema and parser before adding relationship behavior.
- Confirmed the versioned world document already had a relationship collection.
- Compared the implementation against Slice 5 acceptance criteria.

Findings:

1. Relationship persistence existed in the data model, but there were no helpers, seed records, detail panels, browser route, filters, or graph-style UI.
2. Permanent entry deletion needed relationship cleanup to avoid dangling graph edges.
3. The relationship browser needed type and entry filters before the slice could satisfy its own acceptance criteria.

Fixes applied:

1. Added relationship helper utilities and focused Jest coverage for creation, lookup, graph data, upsert/delete, and entry-deletion cleanup.
2. Added seed relationships connecting Valgaron characters, factions, lore, places, and timeline events.
3. Added entry-detail relationship panels and a Relationships route for creating, editing, deleting, filtering, and browsing links.
4. Added a compact graph-style view backed by relationship graph data.
5. Updated permanent entry delete to remove attached relationships.

Re-evaluation:

- Users can link any entry to another entry, edit the link, delete it, filter relationship browsing by type or entry, and see connected records in entry detail.
- Deleted entries remove dependent relationships; archived entries remain addressable.
- Remaining relationship improvements are visual polish and richer graph interactions, not blockers for the prototype slice.

### Implementation Pass: Timeline Upgrade

Evaluation performed:

- Checked the existing timeline section before adding a separate route.
- Confirmed timeline records already had era, date label, and consequence fields.
- Checked that relationships can represent involved entries without adding a second link model.

Findings:

1. Timeline events lacked an explicit sortable order field.
2. The generic section browser did not expose era or involved-entry filters.
3. Timeline event links were available only through relationship data and needed a timeline-specific presentation.

Fixes applied:

1. Added a `Sort order` timeline field and seed values for the starter Valgaron events.
2. Added timeline helper utilities and Jest tests for sorting, era grouping, relationship-backed involved entries, and timeline-specific filtering.
3. Added a timeline overview panel grouped by era.
4. Added Timeline section filters for era and involved entry, plus a `Timeline order` sort option.
5. Displayed consequences and linked involved entries in the timeline overview.

Re-evaluation:

- Timeline events now display in a stable order, can be grouped by era, can be filtered by era or involved entry, and can use relationships to connect events to characters, places, factions, and lore.
- Remaining timeline improvements are richer chronology editing and alternate calendar support, which are beyond this slice.

### Implementation Pass: Data Portability And Reset Safety

Evaluation performed:

- Checked current storage helpers and document parsing before adding import/export behavior.
- Verified that the user decision requires full world export as one JSON file and Markdown export.
- Checked that reset-to-seed was still an immediate header action without confirmation.

Findings:

1. The app persisted local data but did not expose backup export or import.
2. Reset was available without confirmation.
3. There was no visible save status for localStorage write success or failure.
4. Markdown export was not available for drafting reference.

Fixes applied:

1. Added data portability utilities and Jest tests for active-world JSON backup serialization, import parsing, preview counts, and Markdown export.
2. Added a Data route with JSON export, Markdown export, import preview, import apply, and reset controls.
3. Added reset confirmation for both the header and Data route reset actions.
4. Added a header save-status pill and Data route storage-status panel.

Re-evaluation:

- A full active world can be exported as one JSON backup document and imported after validation.
- Invalid JSON or invalid document shapes do not overwrite current data.
- Reset requires confirmation and prompts the user to export first.
- Save status reports localStorage write failure without making security or cloud-backup claims.

### Implementation Pass: UX, Accessibility, And Coverage Review

Evaluation performed:

- Checked the running local server response on `127.0.0.1:5173`.
- Reviewed navigation, main landmarks, dialog behavior, focus styling, form labels, status regions, and responsive grid rules in the current source.
- Attempted browser automation for rendered inspection, but the browser tool connection was unavailable in this session.
- Reviewed remaining inline UI logic for behavior that could be moved into Jest-covered utilities.

Findings:

1. The app had `main-content` landmarks but no skip link.
2. Skip-link targets were not programmatically focusable.
3. Confirmation dialogs did not support Escape to cancel or initial focus on a safe action.
4. Save status was visible but not announced as a status region.
5. Relationship browser filtering was inline in the route component and lacked focused unit coverage.

Fixes applied:

1. Added a skip link that targets the active main landmark.
2. Made route main landmarks focusable for skip-link navigation.
3. Added Escape handling and safe initial focus to destructive confirmation dialogs.
4. Marked the save-status pill as a live status region.
5. Extracted relationship filtering into `codexRelationships.ts` and added focused Jest coverage.

Re-evaluation:

- Keyboard users now have a direct skip path to main content.
- Destructive dialogs can be cancelled with Escape and initially focus the non-destructive action.
- Relationship browser filter behavior is covered by unit tests.
- Rendered desktop/mobile visual verification remains unverified because browser automation was unavailable; static responsive rules were reviewed and validation builds pass.

### Final Validation Pass

Evaluation performed:

- Ran the full Jest, TypeScript, lint, and build validation set after completing the remaining checklist items.

Results:

1. `npm test` passed with 8 suites and 44 tests.
2. `npm run typecheck` passed.
3. `npm run lint` passed.
4. `npm run build` passed.
5. `npx vite build` passed.

Re-evaluation:

- The project update plan checklist is complete.
- No further implementation slice remains in this plan.
