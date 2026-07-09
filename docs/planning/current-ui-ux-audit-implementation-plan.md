# Current UI UX Audit Implementation Plan

Date: July 9, 2026  
Source audit: `CURRENT_UI_UX_AUDIT.md`  
Perspective: Staff software engineer for web, mobile, and frontend systems

## Objective

Implement the UX audit findings in a disciplined sequence that improves visual
accessibility, responsive usability, and work-surface efficiency without
changing the Valgaron product direction or adding broad abstractions. The plan
is web-first because the audit reviewed the browser prototype, but each phase
notes mobile-web and Expo companion implications where relevant.

## Scope

In scope:

- Web responsive UI defects found in the audit.
- CSS and React markup changes required to fix layout, active state, spacing,
  heading semantics, and action styling.
- Focused tests or smoke checks for changed behavior where the current harness
  supports them.
- Screenshot-based verification for desktop and mobile-web viewports.

Out of scope unless a later implementation pass proves the need:

- New product workflows.
- New persistence, sync, account, collaboration, or security claims.
- Replacing the current MUI/Emotion dependency layer.
- A full Expo visual redesign. Shared model or copy changes should still be
  checked for mobile impact.

## Engineering Principles For This Work

- Fix root causes before polishing symptoms.
- Keep route-specific layout fixes scoped when a global CSS change would create
  avoidable regression risk.
- Preserve dense, utilitarian information design; do not convert the app into a
  marketing or landing-page layout.
- Treat contrast, target size, and semantic heading fixes as accessibility
  requirements, not preference tweaks.
- Prefer simple React/CSS changes over new layout abstractions unless multiple
  routes need the same pattern.
- Re-evaluate after every phase with screenshots and computed checks before
  moving to the next phase.

## Iteration Protocol

Use this protocol before every implementation step, even inside a phase:

1. Confirm the issue is still present in the current runtime or source.
2. Identify the root cause and affected files.
3. Choose the smallest path that fixes the root cause without broadening the
   product scope.
4. Make the change.
5. Run the closest practical validation.
6. Re-evaluate the original issue and adjacent surfaces.
7. Continue only if the issue is fixed and no new higher-priority regression was
   introduced.

If a step no longer reproduces after earlier phases, skip it and record why in
the implementation notes.

## Audit Finding Coverage Map

| Audit finding                                     | Phase            | Primary outcome                                    |
| ------------------------------------------------- | ---------------- | -------------------------------------------------- |
| 1. Active chip/action contrast                    | Phase 1          | Contrast-safe selected states                      |
| 2. Workbench Edit links incorrectly active        | Phase 1          | Correct action-vs-navigation semantics             |
| 3. Overview panels touch                          | Phase 2          | Route-scoped page rhythm                           |
| 4. Desktop Workbench wastes canvas                | Phase 4          | Better no-selection and browsing layout            |
| 5. Relationship labels concatenate                | Phase 3          | Separated row heading structure                    |
| 6. Mobile header too tall                         | Phase 5          | Shorter, still usable mobile shell                 |
| 7. Mobile width cap                               | Phase 5 subset   | Full available mobile content width                |
| 8. Touch targets below recommendation             | Phase 5          | Larger mobile controls where interaction is common |
| 9. Workbench record cards too narrow              | Phase 4          | Wider/scannable record cards                       |
| 10. Overview lacks visible `h1`                   | Phase 2          | Correct page heading semantics                     |
| 11. Operational h1s oversized                     | Phase 6          | Work-surface typography scale                      |
| 12. Button/link visual inconsistency              | Phases 1 and 6   | Consistent action styling by context               |
| 13. Quick-create buttons cramped/underlined       | Phase 6          | Button-like links look like buttons                |
| 14. Local data notice visually heavy              | Phase 7 optional | Better notice weight after core fixes              |
| 15. Diagnostics severity hierarchy                | Phase 7 optional | Clearer issue-vs-info states                       |
| 16. Mobile Workbench empty panels after long list | Phases 4 and 5   | Hide or consolidate unhelpful empty states         |
| 17. Brand link hit area short                     | Phase 5          | Larger mobile/header target                        |

## Baseline Verification Before Implementation

Before changing source code:

1. Run `git status --short` and identify unrelated local changes.
2. Run `npm run build` to confirm the current build state.
3. Run `npm test` to establish the current test baseline.
4. Capture or regenerate screenshots for:
   - `/` at 1440 x 1000 and 390 x 844
   - `/entries` at 1440 x 1000 and 390 x 844
   - `/relationships` at 1440 x 1000
5. Record current computed values for:
   - Active chip/button contrast.
   - Mobile header height.
   - Mobile `.vwb-main` width and x-position.
   - Horizontal overflow.
   - Console errors.

Expected baseline from the audit:

- Fresh build passes with a Vite bundle-size warning.
- No sampled horizontal overflow.
- No sampled browser console errors.
- Active amber states can be as low as about `2.47:1` contrast.
- Mobile header height is about `166px` at 390 x 844.
- Mobile `.vwb-main` is about `355px` wide at x=10 in a 390px viewport.

## Phase 1: Correct Active-State Semantics And Contrast

### Evaluation Before Fix

Need: still required if any selected filter chip, route-active action button, or
active mode control falls below `4.5:1` contrast or communicates selection on an
action that is not actually selected.

Root cause:

- `.vwb-tag-filter.is-active` and route-active button styles can produce light
  text on amber backgrounds.
- Workbench record `Edit` actions use `NavLink`, so React Router marks many
  same-route query links as active.

Best path:

- Separate route navigation from row actions.
- Use contrast-safe active states for selected controls.

### Implementation Steps

1. In `src/Pages/WorkbenchPage.tsx`, replace record-card `NavLink` usage for
   the row `Edit` action with `Link`, or use a non-active className strategy if
   route matching behavior is needed.
2. Search for other `NavLink` usages that represent row actions rather than
   persistent navigation. Convert only the cases where active styling is
   incorrect.
3. Update active chip/button CSS:
   - Prefer `background: var(--vwb-accent-soft)`,
     `color: var(--vwb-heading)`, and `border-color: var(--vwb-accent)` for
     active filter chips.
   - If a solid amber fill remains, use `color: var(--vwb-primary-contrast)`.
4. Ensure `.vwb-secondary-button[aria-current='page']` only affects true
   navigation controls or is replaced by a more specific class.
5. Add or update a focused render test if existing route tests can assert that
   Workbench row actions do not receive active route styling.

### Re-Evaluation After Fix

- Re-run computed contrast checks on `/entries` and `/relationships`.
- Verify no active state in sampled controls is below `4.5:1`.
- Confirm Workbench record `Edit` buttons no longer all look selected.
- Confirm the selected filter/mode controls remain visually distinct.
- Confirm keyboard focus remains visible and not confused with selection.

### Risks

- Changing active styling globally can weaken primary navigation affordance.
  Mitigation: keep header nav styles separate from tag/action styles.
- Converting `NavLink` to `Link` may affect tests expecting active class names.
  Mitigation: update tests to match intended semantics.

## Phase 2: Restore Overview Spacing And Heading Semantics

### Evaluation Before Fix

Need: still required if Overview top-level bordered sections touch or the route
does not expose a visible `h1`.

Root cause:

- `OverviewPage` renders many sibling sections directly inside `.vwb-main`.
- `.vwb-main` controls width and padding but not child flow spacing.
- The Overview hero title is rendered as `h2` while other routes use `h1`.

Best path:

- Apply a route-specific page-flow class for Overview rather than changing
  `.vwb-main` globally.
- Convert the hero title to `h1` while preserving the current visual hierarchy.

### Implementation Steps

1. Add an Overview-specific class, for example
   `className="vwb-main vwb-overview-page"`.
2. Add CSS:
   - `.vwb-overview-page { display: grid; gap: 18px; }`
   - Reconcile existing margins on `.vwb-stat-grid` and
     `.vwb-local-data-notice` so gaps do not double-stack.
3. Change the Overview hero title element from `h2` to `h1`.
4. Ensure the existing `aria-labelledby="overview-title"` still points to the
   new `h1`.
5. Keep Overview dashboard density; do not enlarge content just because spacing
   is being fixed.

### Re-Evaluation After Fix

- Desktop and mobile screenshots show clear separation between hero, local data
  notice, stat grid, quick create, search, recent, and incomplete sections.
- The first visible Overview heading is an `h1`.
- No unexpected spacing regressions appear on Workbench, Relationships,
  Timeline, Knowledge, Data, Utilities, or Help.
- No horizontal overflow at 390px or 320px wide.

### Risks

- Adding global flow spacing would affect all routes. Mitigation: use a scoped
  Overview class unless another route shares the exact defect.
- Existing margins on child sections may create uneven rhythm. Mitigation:
  remove or reduce route-specific margins only inside `.vwb-overview-page`.

## Phase 3: Fix Relationship Legacy Text Row Composition

### Evaluation Before Fix

Need: still required if relationship review rows visually concatenate field
labels and entry names, such as `HOMEMira Rowan`.

Root cause:

- `RelationshipsPage` places `.vwb-entry-kind` and `strong` next to each other
  in the same generic container without a layout gap or block structure.

Best path:

- Introduce a small reusable row-heading structure only if multiple rows need
  it; otherwise scope the markup/CSS to relationship review rows.

### Implementation Steps

1. In the legacy text item row, wrap the kicker and entry name in a container
   that uses a grid or flex column with a small gap.
2. Use existing classes where possible:
   - `span.vwb-entry-kind` for field label.
   - `strong` or `h4`-like text for entry name.
3. If creating a new class, name it by function, for example
   `.vwb-relationship-row-heading`.
4. Check related rows in Relationship Studio, hidden detail cleanup, and
   Knowledge hidden details for the same pattern before stopping.
5. Add or update a render test if the current test harness covers
   Relationships page output.

### Re-Evaluation After Fix

- Screenshot confirms field labels and entry names are separated.
- The row still scans compactly and does not add excessive vertical space.
- Screen-reader order remains field label, entry name, unresolved detail, action.
- No other relationship row layout regresses.

### Risks

- A broad `.vwb-relationship-row div` style could alter many relationship rows.
  Mitigation: use a targeted class.

## Phase 4: Improve Workbench Desktop Empty And Browsing States

### Evaluation Before Fix

Need: still required if `/entries` at desktop width shows a long narrow record
list with mostly empty editor/context columns before a record is selected.

Root cause:

- `.vwb-workbench-layout` always uses a three-column grid.
- Empty editor and selected-context panels occupy valuable first-viewport space
  when they contain no actionable content.
- Record cards carry long metadata in a narrow column.

Best path:

- Treat "no selected record" as a distinct Workbench layout state.
- Avoid a major interaction redesign in the first implementation pass.

### Implementation Steps

1. Add a computed layout-state class to the workbench layout, for example:
   - `vwb-workbench-layout`
   - `vwb-workbench-layout is-empty-editor` when `!editorSection` or no
     selected record/new draft target exists.
2. In the empty state:
   - Let the record index span more width, or use a two-column grid with a
     single combined guidance panel.
   - Avoid rendering two separate empty panels if one can explain the next
     action.
3. In the active editing state:
   - Preserve the three-column or two-plus-context model if it supports editing.
   - Consider making context sticky only when it has meaningful selected data.
4. Improve record metadata presentation:
   - Split long uppercase metadata into calmer separate lines.
   - Consider limiting card footer metadata to section, key tags, and updated
     date.
5. Keep route query behavior unchanged.
6. Add focused tests for empty layout state if component tests can assert class
   or rendered empty panels.

### Re-Evaluation After Fix

- At 1440px, the Workbench first viewport uses available width productively
  before a record is selected.
- The record list is easier to scan and less cramped.
- Selecting a record or starting a new record still opens the editor without
  route-state regressions.
- Mobile does not become longer or more confusing.
- Existing unsaved-change warning flows still trigger before route/editor
  replacement.

### Risks

- Workbench route state is already complex. Mitigation: keep layout state derived
  from existing selected/editor state and avoid new state variables.
- Combining empty panels could remove useful guidance. Mitigation: preserve the
  most actionable copy in one panel.

## Phase 5: Tighten Mobile Header, Width, And Touch Targets

### Evaluation Before Fix

Need: still required if mobile header remains around `166px`, main content is
unnecessarily capped at `355px`, or frequent controls are below practical touch
sizes.

Root cause:

- At small widths the header wraps brand, workflow nav, and actions into three
  rows.
- `.vwb-main` uses a hard 355px cap at `max-width: 520px`.
- Filter chips prioritize density with 27px height.

Best path:

- Reclaim width immediately with low-risk CSS.
- Increase target sizes for mobile only where density pressure is lower than
  touch usability risk.
- Reduce header height conservatively without hiding essential actions.

### Implementation Steps

1. Replace the 355px mobile `.vwb-main` cap with full available width:
   - Use `width: calc(100% - 20px)`.
   - Keep `margin: 0 auto` unless a specific route requires left alignment.
2. Add mobile-specific control sizing:
   - `.vwb-tag-filter { min-height: 36px; }` under the mobile breakpoint.
   - Search inputs and selects should reach `44px` where feasible.
   - Header buttons should be at least `40px`, preferably `44px` if the header
     does not grow further.
3. Reduce mobile header height:
   - Tighten `gap` and padding first.
   - Put Save and Data Menu beside brand only if it does not create text
     overlap at 320px.
   - Keep workflow nav visible and horizontally scrollable if needed.
4. Check 320px, 390px, and 430px widths.
5. Verify Data Menu placement at mobile widths; it must not open off-screen.

### Re-Evaluation After Fix

- Header height is materially lower than baseline without reducing clarity.
- `.vwb-main` uses the available mobile width and remains centered.
- No controls overlap at 320px.
- The Data Menu remains reachable and visible.
- Touch target improvements do not make dense Workbench filters excessively
  tall.

### Risks

- Increasing chip height can lengthen filter-heavy screens. Mitigation:
  increase mobile target height moderately before targeting full 44px.
- Header compression can hurt readability. Mitigation: screenshot at 320px and
  390px before accepting.

## Phase 6: Tune Work-Surface Typography And Action Consistency

### Evaluation Before Fix

Need: still required if route headings consume too much first-viewport space or
button/link styling remains inconsistent after earlier fixes.

Root cause:

- `.vwb-section-intro h1` uses hero-scale sizing for operational routes.
- Some row actions are plain links while other similar actions are button-like.
- Quick-create links look underlined inside button shells.

Best path:

- Reduce operational route h1 max sizing.
- Standardize action treatment by context, not by component accident.

### Implementation Steps

1. Adjust `.vwb-section-intro h1` to a smaller clamp appropriate for work
   surfaces.
2. If a larger Overview hero is still desired, scope it to Overview rather than
   all route intros.
3. Remove text decoration from link elements styled as `.vwb-secondary-button`
   across all contexts.
4. Audit Overview row `Edit` actions:
   - Keep as text links only if the hit area and hierarchy are intentional.
   - Otherwise apply a compact button treatment.
5. Avoid adding icons unless the existing icon dependency is already used in the
   relevant surface and improves recognition.

### Re-Evaluation After Fix

- Workbench and Relationships show more useful content in the first viewport.
- Heading hierarchy remains clear.
- Button-like links no longer look like browser-default underlined links.
- Row action hierarchy remains understandable.

### Risks

- Reducing headings too much can weaken route orientation. Mitigation: keep
  strong h1 weight and clear kicker text.

## Phase 7: Optional Diagnostics And Notice Polish

### Evaluation Before Fix

Need: only required after higher-priority layout and accessibility fixes if the
local data notice or diagnostics severity still distracts from primary tasks.

Root cause:

- Important status/help content is styled similarly to task panels.
- Diagnostics cards use similar visual weight for action-needed and
  informational states.

Best path:

- Defer until the core defects are fixed, then tune with screenshots.

### Implementation Steps

1. Reassess Overview local data notice after spacing changes.
2. If still heavy, reduce surface strength or convert to a compact notice row
   with a clear Data/export link.
3. Reassess Relationship diagnostics after active-state and row fixes.
4. Make informational diagnostics visually quieter than true warning/danger
   states.

### Re-Evaluation After Fix

- Notice remains visible but no longer competes with core drafting tasks.
- Diagnostics communicate issue severity accurately.

### Risks

- Downplaying local backup guidance too much could hurt prototype data safety.
  Mitigation: keep copy intact unless a separate product decision changes it.

## Cross-Platform Considerations

- Web mobile viewport fixes do not automatically prove Expo parity. If shared
  route copy, models, or layout assumptions change, run the closest mobile test
  and inspect the Expo companion manually when available.
- The mobile app has its own local storage and UI shell. Avoid making claims
  about installed-app behavior from browser viewport evidence alone.
- If active-state constants or theme tokens are moved into packages, verify both
  web and mobile consumers compile.
- Keep English hardcoded copy; do not introduce localization infrastructure.

## Validation Matrix

Run after each phase with source changes:

- `npx prettier --write <changed files>`
- `npm run typecheck`
- Closest focused test if available.

Run before completing the full implementation:

- `npm test`
- `npm run build`
- `npx eslint .` if the ESLint setup is runnable.
- `npm run check:browser` if Chrome/Edge/Chromium is available. This is the
  preferred repo-native smoke path because it already writes responsive browser
  screenshots under `.tmp/browser-smoke`.
- Manual or Playwright screenshot checks when a phase needs more targeted
  evidence than `check:browser` currently captures:
  - `/` desktop and mobile.
  - `/entries` desktop and mobile.
  - `/relationships` desktop and mobile if relationship layout changed.
  - 320px, 390px, 768px, 900px, and 1440px widths for responsive CSS changes.

Visual/accessibility acceptance checks:

- No sampled active-state text below `4.5:1` contrast.
- No horizontal overflow at 320px or 390px.
- Mobile header actions visible and not overlapping.
- Data Menu opens within viewport on mobile and desktop.
- Focus outlines remain visible and unclipped.
- Workbench no-selection state uses space productively.
- Relationship legacy review labels no longer concatenate.
- Overview has exactly one visible page-level `h1`.

## Suggested Implementation Order

1. Phase 1: active semantics and contrast.
2. Phase 2: Overview spacing and h1.
3. Phase 3: relationship legacy row composition.
4. Phase 5, width-only subset: mobile main width cap.
5. Phase 4: Workbench no-selection and record-card layout.
6. Phase 5 remaining: mobile header and touch targets.
7. Phase 6: work-surface typography and action consistency.
8. Phase 7: optional notice and diagnostics polish.

The mobile width cap is pulled earlier than the rest of Phase 5 because it is a
low-risk CSS defect with a clear root cause and improves every mobile route.

## Rollback Strategy

- Keep phases small enough to revert independently.
- Avoid mixing semantic route-link changes with broad layout refactors in one
  commit.
- If Workbench layout changes destabilize route/editor state, revert only Phase
  4 and keep accessibility fixes from earlier phases.
- If mobile header compaction creates overlap at 320px, keep width and touch
  target improvements while reverting the header compression subset.

## Self-Review And Iteration Log

### Review Pass 1: Completeness Against Audit

Finding: The first plan draft needed to explicitly cover all 17 audit items,
not only the high-priority defects.

Improvement made:

- Added Phases 6 and 7 for typography, action consistency, local data notice,
  diagnostics severity, and lower-priority polish.
- Added cross-platform notes for mobile-web versus Expo companion behavior.

### Review Pass 2: Root-Cause Clarity

Finding: Several recommendations could have been implemented as isolated CSS
patches without addressing why the defects happened.

Improvement made:

- Added an "Evaluation Before Fix" and "Root cause" section for every phase.
- Separated action-link active semantics from contrast styling so both causes
  are addressed.

### Review Pass 3: Sequencing And Risk

Finding: Workbench layout changes are higher risk than simple contrast and
spacing fixes, even though Workbench composition is a high-priority defect.

Improvement made:

- Moved active-state, Overview spacing, and relationship row fixes before the
  Workbench layout refactor.
- Split the mobile width cap into an earlier low-risk subset.
- Added rollback guidance per phase.

### Review Pass 4: Validation Gaps

Finding: The plan needed explicit acceptance checks for computed contrast,
responsive widths, Data Menu placement, focus visibility, and route state.

Improvement made:

- Added a validation matrix with command gates and visual/accessibility
  acceptance criteria.
- Included multiple responsive breakpoints rather than only the audit's 390px
  mobile viewport.

### Review Pass 5: Traceability And Existing Tooling

Finding: The plan needed a direct mapping from each audit finding to
implementation phases, and it needed to point implementers to the existing
browser smoke script instead of implying only ad hoc screenshot capture.

Improvement made:

- Added an audit finding coverage map for all 17 findings.
- Added an iteration protocol that explicitly requires confirming need,
  understanding root cause, choosing the path, validating, and re-evaluating
  after each step.
- Clarified that `npm run check:browser` is the preferred repo-native screenshot
  smoke path when it covers the changed surfaces.

### Final Evaluation

No further planning gaps are apparent before implementation. The plan now maps
each audit issue to a root cause, implementation path, validation method, and
rollback strategy while preserving the current Valgaron prototype constraints.

## Implementation Log

### July 9, 2026 Pass

Completed through Phase 6:

- Replaced Workbench row/action `NavLink` usage with non-active `Link`
  semantics where the controls navigate by query params rather than represent
  persistent route selection.
- Added a scoped Overview page flow class and changed the Overview hero title to
  the route's visible `h1`.
- Added a targeted relationship row heading structure so field labels and record
  names no longer visually concatenate.
- Removed the narrow mobile main-content cap and centered the mobile content
  width.
- Added a Workbench no-selection layout state, removed the redundant empty
  editor panel when there is no editor target, and split record metadata into
  separate scan-friendly tokens.
- Tightened the mobile header and increased common mobile control target
  heights.
- Reduced operational route heading scale and removed underline styling from
  links presented as buttons.

Validation completed:

- `npx prettier --write` on changed source and docs.
- Focused render tests for Overview, Workbench, and Relationships.
- Restored Jest discovery for TSX render tests and re-enabled the existing
  Knowledge render test.
- `npm run typecheck`.
- `npx eslint .`.
- `npm test`.
- `npm run build`, with only the known Vite chunk-size warning.

`npm run check:browser` was used during review to find and repair stale smoke
expectations for Workbench context actions and Knowledge copy. It also exposed a
Timeline contextual-create reseed defect; route-seeded timeline drafts now clear
the parent dirty flag after applying a new route baseline. Later smoke retries
became inconclusive in this local browser environment, exiting early without the
script's normal aggregated failure output. No temporary repo-local smoke server
was left running afterward.

Deferred:

- Phase 7 notice/diagnostics polish remains optional until screenshots show the
  notice or diagnostics cards still competing with primary work surfaces.
