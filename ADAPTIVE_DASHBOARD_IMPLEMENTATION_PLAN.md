# Adaptive Dashboard Implementation Plan

## Implementation Status

Implemented on 2026-07-09 across the shared core, every primary browser
dashboard route, and the native mobile Overview, Workbench/Entries, Links,
More, Data, Workspaces, and Help screens. The shipped implementation includes
versioned local preferences, legacy Workbench migration, recommended presets,
semantic regions and sizes, pointer and keyboard movement/resizing, collapse
and restore, focus, Undo/Redo, cancel, page/all reset, forced-visible safety
cards, compact viewport normalization, mobile section customization, shared
Help guidance, and maintenance documentation.

Automated tests, web/mobile type checks, ESLint, Prettier, and the Vite
production build pass. The repository Chromium smoke harness was attempted with
both Chrome and Edge but each browser process exceeded the harness timeout
before completing the route matrix; it returned no application assertion and
its remaining managed processes were stopped. Interactive responsive capture
therefore remains an environment-dependent release verification item.

## Status

- **Product:** Valgaron World Codex
- **Scope:** Browser-first adaptive dashboards with a constrained mobile customization companion
- **Baseline:** The current runtime already provides a fluid web canvas, responsive one- and two-column layouts, Workbench focus controls, a collapsed-card shelf, container-query form reflow, and collapsible mobile Overview cards.
- **Target:** A typed, accessible, user-configurable dashboard system with semantic card sizes, page presets, resilient local persistence, keyboard-operable positioning, and later pointer-based drag and resize.

## 1. Objective

Turn the current page-specific dashboard behavior into a reusable creative workspace system that helps users move quickly between drafting, browsing, reviewing, and organizing world records.

The completed system must:

1. Keep one clear primary task on every page.
2. Let users reorder, resize, collapse, restore, focus, and reposition eligible cards.
3. Preserve safe, useful layouts across desktop, tablet, mobile, browser zoom, and long content.
4. Make every customization available without drag-and-drop.
5. Store interface preferences separately from world data and exports.
6. Recover safely from missing, corrupt, or outdated preferences.
7. Preserve current routes, editing behavior, local-only product claims, and MUI-based infrastructure.

## 2. Product and Engineering Constraints

### In scope

- Shared dashboard card and layout primitives for the browser application.
- Page card registries and recommended presets.
- Explicit layout-customization mode.
- Menu- and keyboard-based movement and semantic resizing.
- Desktop pointer dragging and resizing after non-pointer controls are stable.
- Per-page local layout persistence and migration.
- Responsive normalization across viewport classes.
- A mobile **Customize sections** workflow for order and collapse preferences.
- Accessibility, testing, documentation, and recovery behavior.

### Out of scope

- Arbitrary pixel coordinates or Figma-style freeform placement.
- Cloud synchronization, accounts, sharing, or collaborative layouts.
- Persisting layout preferences inside world documents or exports.
- User-created dashboard card types.
- Third-party dashboard marketplace concepts.
- Desktop-style drag and width resizing on phones.
- Replacing MUI, Emotion, React Router, Expo Router, or the shared token system.

### Defaults selected

- Use a constrained CSS Grid layout, not absolute positioning.
- Use semantic card sizes: `compact`, `standard`, `wide`, and `full`.
- Store global per-page preferences, not per-world preferences, for the first release.
- Persist only user overrides; keep recommended defaults in code.
- Keep layout state local and versioned under a separate storage key.
- Implement menu and keyboard customization before pointer drag-and-resize.
- Use existing dependencies for the first implementation. Adding a drag-and-drop library is a later decision gate.

## 3. Experience Principles

### Primary-task dominance

Every page declares one primary task card or canvas. Supporting cards may move or collapse but cannot force the primary task below an unusable width.

Examples:

- Workbench: editor
- Timeline: chronology or selected event editor
- Links Explore mode: graph
- Knowledge: selected schema editor
- Data: active safe operation

### Structured freedom

Users control card priority and arrangement through regions and size tiers. The system controls minimum widths, responsive fallbacks, locked safety areas, and recovery.

### Progressive disclosure with visibility

Collapsed cards always remain represented in a shelf or section navigator. Shelf items show the card title plus meaningful status such as counts, warnings, or save health.

### Explicit customization

Reordering and resizing are enabled only after the user chooses **Customize layout**. Normal drafting never accidentally begins a drag or resize interaction.

### Safe reversibility

Every customization action supports Undo. Every page supports Reset layout. Invalid or obsolete preferences fall back to recommended defaults without affecting world data.

## 4. Target Interaction Model

### 4.1 Dashboard regions

Browser dashboards use four logical regions:

```text
page-toolbar
collapsed-shelf
primary | supporting
full-width
```

- **Primary:** Editors, lists, queues, graphs, and timelines that drive the current task.
- **Supporting:** Filters, context, health, navigation, and summaries.
- **Full-width:** Dense tables, graphs, bulk review, and tasks that need maximum horizontal space.
- **Shelf:** Collapsed cards, represented by restorable status items.

### 4.2 Card states

Each card supports only the states allowed by its registry definition:

- `visible`: rendered in a dashboard region.
- `collapsed`: represented in the shelf.
- `focused`: temporarily occupies the full canvas while other eligible cards move to the shelf.
- `forced-visible`: warnings, validation errors, or protected workflows prevent automatic collapse.

Focus mode is a layout state, not a modal. It must not trap keyboard focus.

### 4.3 Card sizes

Cards expose semantic sizes:

| Size       | Wide-grid intent  | Typical content                         |
| ---------- | ----------------- | --------------------------------------- |
| `compact`  | 3–4 of 12 columns | Metrics, status, quick actions          |
| `standard` | 5–6 columns       | Lists, filters, summaries               |
| `wide`     | 7–9 columns       | Queues, previews, configuration editors |
| `full`     | 12 columns        | Main editor, graph, timeline, tables    |

Size choices are preferences, not persisted pixels. The layout normalizer maps them to the available viewport and card constraints.

### 4.4 Normal mode

- Card content behaves normally.
- Drag and resize affordances are hidden.
- Card menus expose relevant actions such as Collapse or Focus.
- The page toolbar exposes preset selection, Customize layout, Focus primary task, and Reset.

### 4.5 Customization mode

- A visible grid guide and insertion targets appear.
- Eligible card headers show a dedicated drag handle.
- Cards show their current region and semantic size.
- Toolbar actions become Done, Undo, Redo, Reset, and Cancel.
- Card menus expose all non-pointer alternatives.
- Escape cancels the active drag or resize operation.
- Leaving customization mode commits preferences locally.

### 4.6 Card movement

Every movable card menu provides:

- Move earlier
- Move later
- Move to primary
- Move to supporting
- Move to full-width
- Collapse
- Focus, where allowed
- Reset this card

Pointer movement, when added, uses a dedicated handle, ghost preview, insertion indicator, grid snapping, edge auto-scroll, and one-step Undo.

### 4.7 Card resizing

Every resizable card menu provides only supported sizes. Pointer resizing snaps between these tiers and displays the candidate size and region.

Cards declare their own constraints. For example, the Workbench editor supports `wide` and `full` but never `compact`.

## 5. Presets

### Shared preset behavior

Each page provides recommended presets. A user may customize a preset without modifying the recommendation in code.

The UI distinguishes:

- Recommended preset
- Customized preset
- Reset to recommended

Shared concepts:

- **Default:** Balanced task and support content.
- **Focus:** Primary task fills the canvas; eligible support cards move to the shelf.
- **Overview:** More summary cards are visible at smaller sizes.
- **Review:** Diagnostics and incomplete-work queues receive priority.

### Page preset definitions

| Page           | Presets                         | Primary behavior                                                 |
| -------------- | ------------------------------- | ---------------------------------------------------------------- |
| Overview       | Continue, Overview, Review      | Continue prioritizes recent and incomplete work                  |
| Workbench      | Browse, Draft, Review           | Draft protects and expands the editor                            |
| Timeline       | Browse, Edit Event, Manage Eras | Chronology or the active editor owns the primary canvas          |
| Links          | Manage, Explore Graph, Repair   | Mode changes which card is primary                               |
| Knowledge      | Navigate, Configure, Audit      | Navigator remains supporting; selected editor is primary         |
| Data           | Backup, Recover, Diagnose       | Safe active operation is primary; danger zone stays anchored     |
| Workspaces     | Browse, Edit, Archive Review    | Selected workspace details are primary                           |
| Help/Utilities | Browse Topics, Focus Topic      | Selected topic or tool expands; reference cards remain secondary |

## 6. Page Card Registries

Each page declares stable card IDs and constraints. Names below are implementation IDs and must not be derived from translated or user-editable copy.

### Overview

| Card ID                 | Default region | Default size | Rules                                        |
| ----------------------- | -------------- | ------------ | -------------------------------------------- |
| `overview.continue`     | primary        | wide         | Not rendered when no recent record exists    |
| `overview.search`       | supporting     | standard     | Collapsible; results expand internally       |
| `overview.quick-create` | supporting     | compact      | Collapsible                                  |
| `overview.recent`       | primary        | wide         | Movable and resizable                        |
| `overview.pinned`       | primary        | standard     | Hidden when empty                            |
| `overview.incomplete`   | primary        | wide         | Warning count remains visible when collapsed |
| `overview.metrics`      | full           | full         | Internal cards auto-fit                      |
| `overview.save-health`  | supporting     | compact      | Forced visible for warning or danger states  |

### Workbench

| Card ID                    | Default region | Default size | Rules                                                         |
| -------------------------- | -------------- | ------------ | ------------------------------------------------------------- |
| `workbench.records`        | supporting     | standard     | Movable, collapsible, not smaller than 300px                  |
| `workbench.editor`         | primary        | wide         | Locked to primary/full; cannot collapse with an unsaved draft |
| `workbench.record-context` | supporting     | standard     | Movable and collapsible                                       |
| `workbench.review`         | supporting     | compact      | Forced visible for blocking issues                            |
| `workbench.prompts`        | supporting     | standard     | Hidden when empty                                             |
| `workbench.linked-records` | supporting     | standard     | Hidden when empty                                             |

The current combined Context panel should be decomposed only after the shared dashboard foundation exists. Until then, preserve its current behavior as `workbench.record-context`.

### Timeline and section pages

- `timeline.overview`
- `timeline.filters`
- `timeline.chronology`
- `timeline.event-editor`
- `timeline.era-manager`
- `timeline.review`
- `section.record-list`
- `section.record-editor`
- `section.link-review`

Chronology, event editor, and dense tables support `wide` or `full`. Filters and review cards support `compact` or `standard`.

### Links

- `links.mode-selector`
- `links.health`
- `links.editor`
- `links.saved-list`
- `links.graph`
- `links.graph-filters`
- `links.selected-node`
- `links.repair`
- `links.bulk-review`

Mode-specific cards remain registered but are inactive when irrelevant. Inactive cards are not shown in the shelf and do not consume layout order.

### Knowledge

- `knowledge.navigator`
- `knowledge.editor`
- `knowledge.schema-health`
- `knowledge.field-order`
- `knowledge.vocabulary`
- `knowledge.hidden-detail-review`
- `knowledge.reusable-definitions`

### Data

- `data.save-health`
- `data.export`
- `data.import`
- `data.recovery`
- `data.diagnostics`
- `data.help`
- `data.danger-zone`

`data.danger-zone` is locked to the last full-width position. It cannot move beside routine safe actions. Import errors and recovery warnings force their cards visible.

### Workspaces, Help, and Utilities

Use stable IDs following the same `<page>.<card>` convention. Keep selected workspace details and selected Help topics primary. Do not make short informational cards individually resizable unless their content materially benefits.

## 7. Data Model and Public Interfaces

Add pure shared layout types and normalization logic under `packages/core`. No layout preference becomes part of `WorldDocument`, `WorldWorkspace`, exports, schema migrations, or diagnostics containing world content.

```ts
export type DashboardPageId =
  | 'overview'
  | 'workbench'
  | 'timeline'
  | 'links'
  | 'knowledge'
  | 'data'
  | 'workspaces'
  | 'help'
  | 'utilities';

export type DashboardCardSize = 'compact' | 'standard' | 'wide' | 'full';

export type DashboardCardRegion = 'primary' | 'supporting' | 'full' | 'shelf';

export type DashboardViewportClass = 'compact' | 'standard' | 'wide';

export type DashboardCardPreference = {
  region: DashboardCardRegion;
  size: DashboardCardSize;
  order: number;
  collapsed: boolean;
};

export type DashboardPagePreference = {
  pageId: DashboardPageId;
  presetId: string;
  cards: Partial<Record<string, DashboardCardPreference>>;
};

export type DashboardPreferenceDocument = {
  version: 1;
  pages: Partial<Record<DashboardPageId, DashboardPagePreference>>;
  updatedAt: string;
};
```

### Card registry contract

```ts
export type DashboardCardDefinition = {
  id: string;
  pageId: DashboardPageId;
  defaultRegion: Exclude<DashboardCardRegion, 'shelf'>;
  defaultSize: DashboardCardSize;
  allowedRegions: readonly Exclude<DashboardCardRegion, 'shelf'>[];
  allowedSizes: readonly DashboardCardSize[];
  collapsible: boolean;
  focusable: boolean;
  movable: boolean;
  lockedOrder?: boolean;
  responsivePriority: number;
};
```

Card definitions remain code-owned. Preferences may reference only registered card IDs.

### Normalized layout output

Components consume a normalized model rather than raw stored preferences:

```ts
export type NormalizedDashboardCard = {
  id: string;
  region: DashboardCardRegion;
  size: DashboardCardSize;
  order: number;
  collapsed: boolean;
};
```

Normalization resolves defaults, overrides, invalid values, locked cards, unavailable cards, viewport constraints, duplicate order values, and forced-visible state.

## 8. Persistence and Migration

### Browser storage

- Key: `valgaron.dashboardLayout.v1`
- Adapter location: browser platform or web utility layer, not `packages/core`
- Write debounce: 250ms during repeated customization actions
- Write immediately when customization mode closes
- Listen for `storage` events and apply changes from another tab when no local customization session is active
- Recover from storage errors without blocking the page

### Existing Workbench preferences

Migrate `valgaron:workbench-layout:v1` once:

- `isIndexCollapsed` maps to `workbench.records.collapsed`
- `isContextCollapsed` maps to `workbench.record-context.collapsed`
- After successfully writing the new preference document, remove the old key
- If migration fails, retain the old key and use recommended defaults

### Mobile storage

Use a separate AsyncStorage key such as `valgaron.dashboardSections.v1`. Mobile stores only section order and collapsed state. It does not persist desktop regions or sizes.

### Preference validation

- Parse as `unknown`.
- Narrow every field.
- Ignore unknown page and card IDs.
- Clamp order to a finite non-negative integer.
- Accept only registry-supported regions and sizes.
- Reset a page when its preference cannot be normalized safely.
- Never alter world data while recovering preferences.

## 9. Responsive Layout Engine

### Viewport classes

- `wide`: more than 1279px of dashboard container width
- `standard`: 960–1279px
- `compact`: less than 960px

Use dashboard container width, not only `window.innerWidth`, so side-by-side development tools and embedded layouts normalize correctly.

### Wide

- 12-column grid
- Primary and supporting regions available
- All semantic sizes available
- Supporting rail capped around 440–480px where appropriate

### Standard

- Keep two columns only when both regions meet card minimum widths
- Normalize `wide` cards to `full` when required
- Move supporting cards below the primary region before content becomes cramped

### Compact

- One column
- Every visible card renders full width
- Region influences order, not horizontal position
- Collapsed state remains
- Shelf becomes a wrapping list or section navigator

### Layout normalization order

1. Load the page registry and recommended preset.
2. Merge validated user overrides.
3. Remove inactive or unavailable cards.
4. Force protected cards visible.
5. Enforce allowed regions and sizes.
6. Apply locked order constraints.
7. Normalize sizes and regions for the viewport class.
8. Resolve duplicate or missing order values stably.
9. Return DOM rendering order matching visual order.

## 10. Component Architecture

Create focused web components under a dashboard component folder:

- `DashboardWorkspace`: page context, normalized model, customization state, history, persistence boundary
- `DashboardToolbar`: presets, customize, focus, undo/redo, reset
- `DashboardGrid`: semantic region rendering and insertion targets
- `DashboardCard`: header, status, menu, drag handle, resize affordance, content region
- `DashboardShelf`: collapsed cards and restore behavior
- `DashboardCardMenu`: non-pointer movement, resize, collapse, focus, and reset actions
- `DashboardCustomizationHelp`: first-use explanation and keyboard guidance

Keep layout algorithms and registry types outside React. React components should render normalized models and dispatch typed actions.

### State reducer

Use a typed reducer with actions such as:

- `apply-preset`
- `move-card`
- `resize-card`
- `collapse-card`
- `restore-card`
- `focus-card`
- `exit-focus`
- `reset-card`
- `reset-page`
- `undo`
- `redo`

Keep at most 20 in-memory history entries. Do not persist undo history across reloads.

### Card content responsiveness

Continue using container queries. Card content must reflow based on actual card width after movement or resizing. Do not introduce page-specific viewport breakpoints for card internals when a container query can express the behavior.

## 11. Pointer Drag and Resize

Pointer support begins only after registry, reducer, menu movement, keyboard behavior, persistence, and normalization are complete.

### First implementation

Use native Pointer Events and CSS transforms with semantic drop zones. Do not add a dependency initially.

Requirements:

- Dedicated drag handle
- Pointer capture
- Ghost preview
- Insertion indicator
- Edge auto-scroll
- Grid and region snapping
- Escape cancellation
- Drop validation through the registry
- Live-region placement announcement
- Undo after drop
- No persisted pixel coordinates

### Dependency decision gate

Consider a drag-and-drop library only if native implementation evidence shows unacceptable complexity or reliability. Before adding one, compare bundle impact, touch support, keyboard support, React 19 compatibility, maintenance status, and interoperability with CSS Grid and MUI. Library coordinates must never become the persistence format.

## 12. Accessibility Specification

### DOM and focus

- Render DOM order from the normalized visual order.
- Never use CSS `order` to contradict reading order.
- Move focus to a card heading after restore.
- After moving a card by menu, return focus to its card menu trigger.
- After pointer drop, focus the moved card heading or handle.
- When collapsing the focused card, move focus to its shelf item.
- Focus mode does not trap focus.

### Semantics

- Card titles remain semantic headings.
- Header actions are real buttons.
- Collapse controls expose `aria-expanded` and `aria-controls`.
- Customization controls use a labeled group unless a complete ARIA toolbar keyboard pattern is implemented.
- Status badges have complete accessible labels.
- Drag handles describe the card and customization state.

### Announcements

Use a polite live region for messages such as:

- “Linked records moved to supporting region, position 2 of 4.”
- “Timeline changed to full width.”
- “Review issues collapsed. Three unresolved issues remain.”
- “Layout restored to the Draft preset.”

### Input parity

Every pointer move or resize has an equivalent menu action. Test keyboard-only operation, screen readers, 200% zoom, increased mobile text size, high contrast, and reduced motion.

## 13. Mobile Customize Sections

Mobile uses a dedicated modal or bottom sheet opened from a **Customize sections** action.

Users can:

- Review all available sections and status summaries
- Move a section earlier or later
- Collapse or expand eligible sections
- Reset the screen order
- Reset all mobile dashboard preferences

Mobile does not expose horizontal regions or physical widths. Cards remain one column. Tablet layouts may derive two columns automatically but use the same logical order.

Do not use long-press dragging as the only interaction. If drag handles are later added, keep move buttons and accessibility actions.

## 14. Performance Requirements

- Layout normalization must be pure and linear in the number of registered cards.
- Avoid measuring every card on every render.
- Use container queries for internal reflow instead of resize observers per card where possible.
- During pointer drag, update the preview with `requestAnimationFrame`; commit reducer state only when the candidate placement changes or the interaction ends.
- Memoize registry and normalized layout models.
- Do not mount inactive mode-specific heavy cards.
- Hidden cards with expensive effects should unmount or suspend those effects while preserving only necessary draft state.
- Re-run the existing large-world performance smoke after each page migration.

## 15. Implementation Phases

### Phase 0: Baseline and evidence

1. Commit or preserve the current fluid-dashboard baseline.
2. Capture responsive screenshots and overflow measurements for all primary routes at 390, 768, 1024, 1440, and 1920px.
3. Record keyboard order and primary-task placement.
4. Add browser-smoke assertions for document-level horizontal overflow.

**Exit criteria:** Baseline evidence is reproducible and browser capture is reliable.

### Phase 1: Pure layout foundation

1. Add shared layout types, registry validation, preset merging, normalization, and reducer helpers.
2. Add unit tests for invalid preferences, locked cards, duplicate order, viewport normalization, and reset.
3. Add web storage adapter with migration from the current Workbench preference key.
4. Add a page-level context/hook that exposes normalized layout and typed actions.

**Exit criteria:** Pure tests cover layout behavior without rendering React.

### Phase 2: Shared web components

1. Implement workspace, toolbar, grid, card, shelf, and card menu components.
2. Implement customization mode, Undo/Redo, reset, and first-use guidance.
3. Implement menu- and keyboard-based movement and semantic resizing.
4. Add accessible announcements and focus restoration.
5. Preserve current visual tokens and responsive card internals.

**Exit criteria:** A test fixture dashboard is fully customizable without pointer input.

### Phase 3: Workbench pilot

1. Register Records, Editor, and Record Context using the shared system.
2. Migrate current collapse and focus behavior.
3. Protect unsaved editor drafts from collapse or invalid movement.
4. Add Browse, Draft, and Review presets.
5. After parity, optionally split review, prompts, and linked records into separate cards.

**Exit criteria:** Current Workbench workflows and routes pass; layout customization is keyboard complete and persistent.

### Phase 4: Overview

1. Register current Overview cards.
2. Add Continue, Overview, and Review presets.
3. Add a Continue card using existing recent-record data.
4. Allow pinned record cards only if they reuse existing pinned metadata and routes.
5. Preserve local-data and recovery warnings as forced-visible states.

**Exit criteria:** Overview remains immediately usable with defaults and supports complete reset.

### Phase 5: Timeline, Links, and Knowledge

1. Migrate one page at a time.
2. Use active page mode to activate relevant cards.
3. Lock graph, timeline, and selected editor canvases to safe regions and sizes.
4. Verify dense tables, graph filters, editor forms, and cleanup queues at all viewport classes.

**Exit criteria:** Each migrated page passes parity tests before the next migration begins.

### Phase 6: Data, Workspaces, Help, and Utilities

1. Register appropriate cards.
2. Keep Data danger zone anchored and last.
3. Keep selected workspace detail and selected Help topic primary.
4. Avoid customization controls on trivial informational cards.

**Exit criteria:** All primary browser pages use the shared dashboard foundation where it materially improves the workflow.

### Phase 7: Mobile customization

1. Add mobile section preference types and AsyncStorage adapter.
2. Implement Customize sections modal or sheet.
3. Apply order and collapse preferences to Overview, Workbench, Timeline, Links, More, Data, and Workspaces incrementally.
4. Add move controls, status summaries, reset, text-scaling tests, and mobile rendered-interaction coverage.

**Exit criteria:** Mobile customization is touch- and screen-reader-usable without desktop geometry concepts.

### Phase 8: Pointer drag and resize

1. Add native Pointer Events to the established semantic model.
2. Add ghost preview, drop indicators, snapping, auto-scroll, cancellation, and Undo.
3. Add semantic resize handles.
4. Measure performance and interaction reliability.
5. Revisit the dependency decision gate only if evidence warrants it.

**Exit criteria:** Pointer behavior matches menu and keyboard outcomes and never persists invalid geometry.

## 16. Testing Plan

### Unit tests

- Registry validation
- Default preset generation
- Override merging
- Unknown card removal
- Corrupt storage recovery
- Workbench key migration
- Locked-card constraints
- Forced-visible warnings
- Duplicate order resolution
- Viewport normalization
- Reducer actions
- Undo/Redo limit
- Reset card, page, and all layouts

### Render and interaction tests

- Card heading and menu semantics
- Customize mode entry and exit
- Menu movement and resizing
- Collapse, shelf summary, and restore
- Focus restoration
- Focus mode
- Unsaved editor protection
- Mode-specific card activation
- Storage failure fallback
- Cross-tab update behavior

### Responsive browser matrix

Test every primary route at:

- 320px
- 390px
- 768px
- 1024px
- 1280px
- 1440px
- 1920px
- 1280px at 200% browser zoom

For each route assert:

- No document-level horizontal overflow
- Primary task remains visible and usable
- DOM order matches visual order
- Shelf is discoverable
- Sticky controls do not overlap content
- Long names, tags, notes, and IDs wrap safely

### Mobile matrix

- Small Android phone
- Typical Android phone
- Large phone
- Tablet where available
- Increased system font size
- TalkBack/VoiceOver order
- Keyboard and switch-access behavior where supported

### Required repository gates

After source changes:

```bash
npx prettier --write <edited-files>
npm test
npm run typecheck
npm run typecheck:mobile
npx eslint .
npx vite build
npm run check:browser
```

Run focused tests during each phase and the complete suite before phase completion.

## 17. Acceptance Criteria

The feature is complete when:

1. Every primary web page has a recommended, readable default layout.
2. Eligible cards can be reordered, resized by tier, collapsed, restored, and reset without pointer input.
3. Desktop pointer interactions produce the same semantic outcomes as menu actions.
4. No preference stores pixel coordinates.
5. User preferences survive reload and recover from invalid data.
6. Old Workbench preferences migrate safely.
7. Layout preferences never affect world exports or schema migrations.
8. Locked primary and safety cards cannot enter invalid regions or sizes.
9. Responsive normalization produces usable layouts at every target width and 200% zoom.
10. Visual and DOM order match.
11. Critical warnings cannot remain silently hidden.
12. Mobile users can reorder and collapse sections without desktop drag behavior.
13. Reset page and Reset all layouts restore current recommended defaults.
14. All tests, type checks, lint, formatting, build, and browser smoke gates pass.

## 18. Risks and Mitigations

| Risk                                             | Mitigation                                                              |
| ------------------------------------------------ | ----------------------------------------------------------------------- |
| Customization overwhelms casual users            | Keep strong defaults; hide mechanics behind Customize layout            |
| Users lose cards                                 | Persistent shelf, All cards menu, Reset layout                          |
| Layout breaks on another screen                  | Semantic sizes, regions, and viewport normalization                     |
| Drag interferes with editing                     | Dedicated handles and explicit customization mode                       |
| Accessibility differs from pointer behavior      | Implement menu/keyboard behavior first and use the same reducer actions |
| Stored preferences become stale                  | Versioning, validation, registry-driven migration, safe fallback        |
| Card system becomes over-abstracted              | Pilot in Workbench; migrate only pages with clear dashboard value       |
| Large bundle or dependency cost                  | Native CSS Grid/Pointer Events first; explicit dependency gate          |
| Hidden heavy cards keep running                  | Unmount inactive cards or suspend card-specific effects                 |
| Safety actions become too prominent or misplaced | Lock Data danger zone and force blocking warnings visible               |

## 19. Documentation and Rollout

### Documentation updates

- Add layout customization to the user guide.
- Explain local-only preference storage and reset behavior.
- Add keyboard customization instructions to Help.
- Update web/mobile parity notes for intentional geometry differences.
- Record the preference storage key and migration behavior in maintenance documentation.
- Add release notes without implying cloud synchronization or backup.

### Rollout strategy

- Ship the shared foundation and Workbench pilot before migrating every page.
- Keep recommended defaults equivalent to the current usable layouts during the pilot.
- Introduce customization as an explicit secondary action, not a blocking onboarding step.
- Do not remove the legacy Workbench preference key until successful migration is verified.
- Retain a kill-switch path that disables customization and renders recommended defaults if a release issue appears.

## 20. Definition of Done

For each phase:

- The implementation matches this plan or records an approved decision change.
- No new product, schema, navigation, compatibility, release, or dependency decision is silently chosen.
- Focused behavior tests pass.
- `npm test` passes.
- Web and mobile type checks pass for affected code.
- ESLint and Prettier pass.
- Relevant production builds and browser/mobile interaction checks pass.
- No process started for verification remains running.
- Documentation accurately describes shipped behavior and limitations.

The final dashboard system should feel less like a configurable admin grid and more like a dependable writer's desk: adaptable to the current creative task, difficult to break, immediately recoverable, and equally usable with mouse, touch, keyboard, or assistive technology.
