# Current UI UX Audit

Audit date: July 9, 2026  
Perspective: Professional UX design lead  
Scope: Current web prototype UI after a fresh production build

## Evidence Reviewed

- Ran `npm run build` before visual review.
- Build result: passed. Vite emitted a bundle-size warning for `dist/assets/index-BMX135NC.js` at 591.32 kB minified.
- Rendered the fresh production bundle through Playwright with filesystem-backed routing, not the pre-existing `dist` state.
- Reviewed routes:
  - `/` Overview
  - `/entries` Workbench
  - `/relationships` Relationships
- Reviewed viewports:
  - Desktop: 1440 x 1000
  - Mobile: 390 x 844
- Captured screenshots in `.tmp/`:
  - `.tmp/ux-built-overview-desktop.png`
  - `.tmp/ux-built-entries-desktop.png`
  - `.tmp/ux-built-relationships-desktop.png`
  - `.tmp/ux-built-overview-mobile.png`
  - `.tmp/ux-built-entries-mobile.png`

No horizontal page overflow was detected in the sampled routes. No browser console errors were detected in the sampled routes.

## Executive Summary

The application has a strong base for a local worldbuilding codex: the dark theme is cohesive, the UI opens directly into useful workflows, the content hierarchy is usually clear, and the product avoids marketing-style chrome. The core visual direction fits a utilitarian creative drafting tool.

The main issues are not conceptual. They are execution defects in spacing, active states, mobile density, and desktop workbench composition. The most urgent fixes are:

1. Fix low-contrast selected pill/button states.
2. Add consistent vertical spacing between top-level Overview sections.
3. Rework the Workbench desktop layout so the long record list does not create a mostly empty two-column canvas.
4. Prevent non-navigation action links from inheriting route-active styling.
5. Repair cramped relationship review labels such as `HOMEMira Rowan`.
6. Improve mobile target sizes and reclaim wasted mobile width.

## High Priority Defects

### 1. Active chip and action states fail contrast

Severity: High  
Observed in: Workbench desktop, Workbench mobile, Relationships desktop  
Likely source: `src/App.css` active tag/button styling and `NavLink` route-active behavior

The selected filter chips and some active action links use light text on an amber active background. Computed contrast was approximately `2.47:1` for examples including:

- `All records (10)`
- `Recent (10)`
- `Review`
- Workbench record `Edit` buttons that become active

This fails WCAG AA contrast for normal text. It is especially noticeable on small pill text, where the reduced font size compounds the problem.

Recommendation:

- Use a darker foreground on amber active fills, such as `--vwb-primary-contrast`, or keep the text light and make the active background much darker.
- Consider active filter styling as `background: var(--vwb-accent-soft); color: var(--vwb-heading); border-color: var(--vwb-accent);` rather than a solid amber fill.
- Check all `.vwb-tag-filter.is-active`, `.vwb-secondary-button[aria-current='page']`, and route-active action links after the fix.

### 2. Workbench record Edit links are incorrectly styled as active

Severity: High  
Observed in: `/entries` desktop and mobile  
Likely source: `src/Pages/WorkbenchPage.tsx` uses `NavLink` for record action links; `src/App.css` styles `.vwb-secondary-button[aria-current='page']`

Every record card's `Edit` action appears selected/active on the Workbench route. This makes all Edit buttons look like the current page state, not individual actions. It also creates the low contrast issue above.

Why this matters:

- Users cannot tell which record, if any, is actually selected.
- The repeated amber action state competes with genuine selected state.
- The visual language says "active location" when the control is really an action.

Recommendation:

- Use `Link` instead of `NavLink` for record actions that navigate to the same base route with query params.
- If `NavLink` is required, set a className function that does not apply active styling for these action links, or use `end`/custom matching so only the intended exact target is active.
- Keep selected record styling on the card itself, not on every action link.

### 3. Overview panels touch each other with no vertical rhythm

Severity: High  
Observed in: `/` desktop and mobile  
Likely source: `src/Pages/OverviewPage.tsx` places repeated sections directly inside `.vwb-main`; `.vwb-main` has padding but no display gap

The Quick Create, Global Search, Recently Updated, and Incomplete Records panels stack edge-to-edge. Their borders touch with no spacing, which makes separate tasks look like one large segmented container. This weakens scanability and makes the page feel compressed despite having enough available space.

Recommendation:

- Add a general page-flow utility such as `.vwb-main { display: grid; gap: 18px; }`, then account for pages that already use grid-specific classes.
- Safer scoped fix: add an Overview wrapper class with `display: grid; gap: 18px;`.
- Keep stat grid and local data notice spacing consistent with this rhythm.

### 4. Desktop Workbench wastes most of the canvas

Severity: High  
Observed in: `/entries` desktop  
Likely source: `.vwb-workbench-layout` fixed three-column grid in `src/App.css`

At 1440px wide, the Workbench uses three columns. The left record index grows to a very long list while the middle editor and right selected-context panels are short empty states. The result is a tall page where most of the visible right side is empty dark background while the user scrolls a narrow record column.

Why this matters:

- The primary browsing task is squeezed into the narrowest column.
- Record summaries wrap aggressively and become harder to scan.
- The editor/context columns do not provide value until a record is selected.
- The page looks unfinished even though the data is present.

Recommendation:

- Before a record is selected, use a two-column or single-column layout that gives the record index more width.
- Consider making the editor/context area sticky only after there is meaningful selected content.
- Combine the "No editor target selected" and "No record selected" empty panels into one helpful empty state.
- Another low-risk option: make the record index span two columns until an editor target exists.

### 5. Relationship legacy text rows concatenate labels and names

Severity: High  
Observed in: `/relationships` desktop  
Likely source: `src/Pages/RelationshipsPage.tsx` lines around the legacy text item row

Rows display strings such as:

- `HOMEMira Rowan`
- `AFFILIATIONSMira Rowan`

The field label and entry name are visually run together. This looks like a data corruption defect and slows review in a cleanup workflow.

Recommendation:

- Place the field label and entry name in separate block elements with clear spacing.
- Use a row header pattern like:
  - kicker: `Home`
  - title: `Mira Rowan`
- Avoid placing an uppercase kicker immediately adjacent to a `strong` element unless the container uses grid/flex with a gap.

## Medium Priority Issues

### 6. Mobile header consumes too much first-viewport space

Severity: Medium  
Observed in: mobile Overview and Workbench  
Measured: header height was 166px in a 390 x 844 viewport

The sticky header uses roughly one fifth of the mobile viewport before page content begins. It contains brand, four mobile nav links, Save, and Data Menu. This is understandable functionally, but it makes every route begin lower than necessary and makes the dense workbench feel heavier.

Recommendation:

- Put Save and Data Menu on the same row as the brand where possible.
- Consider a compact overflow menu for secondary actions on mobile.
- Reduce header row gaps and top/bottom padding at small widths.
- Keep the workflow nav visible, but avoid letting it force three header rows unless absolutely necessary.

### 7. Mobile content width leaves avoidable unused space

Severity: Medium  
Observed in: mobile Overview and Workbench  
Likely source: `src/App.css` mobile rule `width: min(355px, calc(100% - 20px));`

At a 390px viewport, `.vwb-main` is 355px wide and starts at x=10, leaving about 25px on the right. This produces a subtly off-center layout and reduces usable width in a content-heavy tool.

Recommendation:

- Use `width: calc(100% - 20px)` or a larger cap such as `min(720px, calc(100% - 20px))`.
- Center the container if a cap is retained.
- Avoid a 355px hard cap for modern mobile browsers unless there is a very specific layout reason.

### 8. Many touch targets are below the recommended 44px height

Severity: Medium  
Observed across desktop and mobile  
Measured examples:

- Header nav links: 40px high
- Save/Data Menu buttons: 40px high
- Filter chips: 27px high
- Search inputs: 43px high
- Brand link: 33px high

The app is keyboard-usable and many controls meet a practical minimum, but 27px chips are tight for touch and motor accessibility. The issue is most acute on mobile, where filters are a frequent interaction.

Recommendation:

- Increase mobile filter chip minimum height to at least 36px, preferably 40px.
- Keep desktop chips compact if density is critical, but increase vertical padding on touch viewports.
- Bring search inputs to 44px exactly with padding or min-height.
- Consider `min-height: 44px` for header controls on mobile.

### 9. Workbench desktop record cards are too narrow for their content

Severity: Medium  
Observed in: `/entries` desktop

The left Workbench column makes record cards wrap metadata into dense uppercase blocks. Dates, tags, and context strings break into multiple lines, which makes scanning recent records harder than it should be.

Recommendation:

- Give the record list more horizontal space.
- Split card metadata into separate lines with calmer hierarchy.
- Consider truncating secondary metadata after the first one or two useful facts.
- Use chips only for tags/status if they improve scanning; avoid long uppercase metadata strings.

### 10. Overview has no visible primary heading element

Severity: Medium  
Observed in: `/` Overview  
Likely source: Overview hero uses `h2` for the page title

The Overview route visually starts with a strong hero title, but the first heading is an `h2`, not an `h1`. Other routes use an `h1`. This is a semantic and accessibility consistency issue.

Recommendation:

- Change the Overview hero title to `h1`.
- Keep the visual size aligned with the current hero styling if desired.

### 11. Desktop route headings are sometimes oversized for an operational tool

Severity: Medium  
Observed in: Workbench and Relationships

The `Workbench` and `Relationships` h1 headings are very large on desktop. They provide clear page identity, but the scale feels closer to a landing page than a repeated-use drafting interface. The Workbench in particular would benefit from putting more task controls into the first viewport.

Recommendation:

- Reduce route h1 max size from the current hero-scale treatment.
- Reserve the largest type for a true first-run or welcome surface.
- For work surfaces, prioritize controls, filters, and selected context above dramatic heading scale.

## Lower Priority Issues and Easy Wins

### 12. Button/link visual language is inconsistent

Severity: Low to Medium  
Observed across Overview, Workbench, Relationships

Some actions are plain text links (`Edit` on Overview), some are outlined buttons, and some are route-active buttons. The product would feel more coherent if action importance mapped more consistently to style.

Recommendation:

- Use compact text links for low-risk row navigation only when the hit area remains large enough.
- Use outlined buttons for primary row actions such as Select/Edit in dense cards.
- Avoid route-active styling on action links.

### 13. Overview quick-create buttons look visually cramped

Severity: Low  
Observed in: Overview desktop and mobile

The quick-create buttons are useful, but their underlined text and tight button height make them look like browser-default links inside button shells.

Recommendation:

- Ensure `.vwb-secondary-button` links remove text decoration everywhere they are used as button-like actions.
- Increase vertical padding or min-height on mobile.
- Consider adding a small plus icon only if the icon system is already available and consistent.

### 14. Local data notice is important but visually heavy

Severity: Low  
Observed in: Overview

The local data notice is helpful, but it appears before the core stats and uses a full-width bordered block. It competes with the hero and dashboard cards.

Recommendation:

- Keep the notice, but reduce visual weight.
- Consider a compact status/help row with a clearer action path to Data/export.
- If it remains a block, add more separation above and below so it feels intentional.

### 15. Relationship diagnostics cards use warning borders effectively, but status severity could be clearer

Severity: Low  
Observed in: Relationships

The diagnostics grid is useful. However, orange borders on multiple cards can read as equal severity even when counts differ or issues are informational.

Recommendation:

- Reserve danger color for broken references.
- Use neutral or muted borders for informational counts such as graph size.
- Add a stronger hierarchy between "needs action" and "informational" diagnostics.

### 16. Mobile Workbench stacks a long record list before empty editor/context panels

Severity: Low to Medium  
Observed in: `/entries` mobile

On mobile, users scroll through the entire record list before reaching the empty editor and selected-context panels. This is logical by DOM order, but the empty panels are not useful at the bottom after a long list.

Recommendation:

- Hide the editor/context empty panels on mobile until a record is selected.
- Or place a compact instruction near the top and remove the redundant bottom empty states.

### 17. Brand link hit area is short

Severity: Low  
Observed across desktop and mobile

The brand is visually compact, but its measured height was 33px. It is a frequent navigation target and should be easier to hit.

Recommendation:

- Add vertical padding to the brand link while preserving its compact visual appearance.
- Ensure focus outline has enough room and does not clip against header edges.

## What Is Working Well

- The app opens directly into usable product UI rather than marketing content.
- The dark palette is cohesive and generally readable.
- The main text, headings, and card content mostly pass contrast in the sampled routes.
- Focus styles are visible and high contrast.
- The sticky header makes core workflows easy to reach.
- The product copy is direct and domain-appropriate.
- Cards use restrained 8px radii and fit the utilitarian prototype direction.
- The Overview gives useful dashboard counts and fast creation paths.
- The Relationships page has a strong diagnostics concept that can become a very useful maintenance workflow.

## Recommended Fix Order

1. Fix active state contrast for chips and route-active buttons.
2. Stop Workbench record action links from inheriting active route styling.
3. Add page-level vertical gaps to Overview.
4. Fix relationship legacy row spacing (`HOMEMira Rowan`).
5. Improve Workbench desktop composition for the no-selection state.
6. Reclaim mobile width and reduce mobile header height.
7. Increase mobile chip/control touch target heights.
8. Convert Overview hero title to `h1`.
9. Reduce work-surface h1 scale on desktop.
10. Tighten visual consistency for action links versus buttons.

## Suggested Quick Wins

- Add `gap: 18px` to a route-specific Overview wrapper.
- Use `Link` instead of `NavLink` for Workbench card Edit actions.
- Change active chip text color to `var(--vwb-primary-contrast)` if using solid amber.
- Add `display: grid; gap: 2px;` to relationship legacy row headings.
- Replace the 355px mobile main cap with full available width.
- Raise mobile `.vwb-tag-filter` min-height to 36-40px.
- Hide empty Workbench editor/context panels on mobile until they contain useful state.
