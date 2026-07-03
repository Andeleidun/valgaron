# Valgaron Publish Readiness Plan

This plan describes how to take the current browser-local Valgaron World Codex from a complete prototype to a high quality, professional grade web tool that is ready to publish. It is written from the perspective of a staff React engineer preparing a real user-facing application for public release while respecting the current Valgaron constraints: English-only UI, web-first delivery, local-first storage, no accounts, no backend, no collaboration, no social product scope, and no native/mobile parity target unless those decisions are explicitly reopened.

## Clarifying Questions

The answers to these questions should be captured before locking release scope. Until they are answered, this plan uses conservative assumptions that preserve a local-first professional web tool rather than a cloud product.

### Release Positioning

1. Is the first public release meant to be a polished local-only personal tool, a paid product preview, an open-source project, or a private portfolio/demo release?
2. Should the product name remain `VWorldBuilder`, become `Valgaron World Codex`, or use another publishable brand name?
3. Who is the primary release audience: fiction writers, tabletop campaign designers, worldbuilding hobbyists, Valgaron-only readers, or the project owner only?
4. What is the minimum acceptable release promise: "local browser tool", "offline-capable app", "exportable world bible", or "professional writing software"?
5. Should the release include seed Valgaron content as sample data, or should it launch with a neutral starter world and optional Valgaron sample import? Answered: neutral sample content ships by default.

### Product Scope

1. Are multiple worlds and custom entry types required in the first public release UI, or is it acceptable that the data model supports them while the UI exposes only the starter sections? Answered: expose multiple project/universe workspaces in the UI, and add separate functionality for in-fiction worlds/planets inside those workspaces.
2. Should custom fields be editable in the release UI, or should field customization remain a later power-user capability?
3. Should relationships stay list-and-graph-style only, or should graph navigation become interactive enough to be a headline feature?
4. Should Markdown notes be plain textarea authoring, or should release include preview, shortcuts, or formatting help?
5. Should the timeline support only manual sort order and era grouping, or should it include richer chronology controls before release?

### Data And Durability

1. Is `localStorage` acceptable for the first public release, or should the release move to IndexedDB before publishing to avoid browser quota and large-document risks? Answered: keep `localStorage`, but add strong backup/export recommendations and browser-data-clearing warnings.
2. Should automatic snapshots be required before import, reset, and permanent delete?
3. Should users be able to export all worlds at once, or is active-world export enough for release?
4. Should imports merge into existing data, replace the active document, or offer both modes?
5. Should the app warn explicitly that clearing browser data can remove the workspace?

### Distribution

1. Where will the app be published: static hosting, GitHub Pages, Netlify, Vercel, a custom domain, or packaged as a downloadable static artifact? Answered: GitHub Pages.
2. Should the app be installable as a PWA with service worker caching and manifest metadata? Answered: yes.
3. What browser support target is required: latest Chromium only, latest Chrome/Edge/Firefox/Safari, or broader? Answered: Firefox and Chrome are primary.
4. Should the app support mobile phone usage, tablet usage, or only desktop/tablet authoring? Answered: desktop, tablet, and mobile.
5. Is analytics allowed for anonymous usage telemetry, or should release remain completely telemetry-free? Answered: no telemetry.

### Quality Bar

1. What data-loss scenario is unacceptable for release?
2. What manual QA evidence should block release: browser matrix, responsive screenshots, keyboard walkthrough, import/export round trip, or all of these?
3. Should there be an in-app welcome/onboarding flow, or should the working codex remain the first screen?
4. Should release include formal help documentation and sample workflows?
5. Should legal/privacy documents exist even for a no-account local-only app?

## Working Assumptions

- Release remains a static, local-first React web app.
- No account system, backend sync, cloud storage, collaboration, social sharing, moderation, payments, or native app is included in the first publishable release.
- English-only hardcoded UI remains acceptable.
- The app must be honest about local browser storage and must not imply secure backup, cloud sync, privacy isolation, or production durability that it does not provide. The release storage promise is hardened `localStorage` with strong backup/export guidance, not IndexedDB.
- The first professional release should feel complete for the project owner first, with a product direction that can later serve fiction writers and tabletop/campaign designers.
- The app can use MUI, Emotion, and retained local component infrastructure, but the release UI should be consistent and not visibly stitched together from copied scaffolding.
- The release should support desktop, tablet, and mobile layouts, with Firefox and Chrome as the primary browser targets.
- The published app should be offline-installable as a PWA on GitHub Pages.
- The release should remain telemetry-free.
- Publishing requires a repeatable quality gate, not ad hoc manual checks.

## Confirmed Release Decisions

These decisions are now part of the release contract. Reopen them only with an explicit product decision.

1. Release target: polished local-only personal tool.
2. Product name: Valgaron World Codex.
3. Primary audience: the project owner first, with the design direction shaped for fiction writers and tabletop/campaign designers later.
4. Storage promise: `localStorage` with strong backup, export, and browser-data-clearing warnings.
5. Distribution target: GitHub Pages.
6. Multi-world scope: expose multiple project/universe workspaces in the UI and provide separate in-fiction world/planet functionality inside each workspace. Product language and data behavior must not collapse those two concepts into one generic "world" model.
7. Offline scope: installable PWA with tested offline behavior.
8. Device and browser scope: desktop, tablet, and mobile; Firefox and Chrome matter most.
9. Telemetry: no telemetry.
10. Starter content: neutral sample content for public release, not Valgaron-specific seed content by default.

## Current State Summary

The current project has a complete local prototype and a completed publish-readiness implementation pass:

- Vite, React, TypeScript, Jest, ESLint, and Prettier are configured.
- The World Codex supports entries, statuses, pinned records, archive/restore, duplicate, permanent delete behind confirmation, Markdown-style notes, tags, section filters, global search, templates, completeness prompts, typed relationships, graph-style relationship browsing, timeline diagnostics and ordering, JSON export/import, Markdown export, seed reset confirmation, save status, localStorage-backed persistence, recovery snapshots, route-level runtime recovery, local diagnostics, PWA metadata, and GitHub Pages deployment preparation.
- The world document is versioned, exposes multiple project/universe workspaces in the UI, separates in-fiction worlds/planets from project workspaces, supports custom entry types, and migrates the earlier codex-only storage shape.
- Focused Jest tests cover core utilities: entries, search, templates, relationships, timeline, portability, storage, snapshots, downloads, document parsing, workspace management, release workflows, large-world performance, local diagnostics, and Markdown-as-text behavior.
- Release gates include format, lint, typecheck, metadata consistency, Jest, production build, PWA artifact verification, and browser smoke screenshots.
- Documentation now includes README, in-app Help, user guide, support guide, privacy note, security/privacy guidance, deployment docs, manual QA checklists, changelog, release operations, schema migration notes, and issue templates.
- The active plan `WORLD_BUILDING_PROTOTYPE_PLAN.md` is complete, and all publish-readiness slices in this plan are complete.

Remaining pre-publication work:

- Run the manual release checklist on the intended release artifact and deployed GitHub Pages URL.
- Verify installed/offline PWA behavior in current Chrome and Firefox after deployment.
- Cut an actual public version by updating `package.json`, `package-lock.json`, `src/Utlilities/appMetadata.ts`, and `CHANGELOG.md` together.
- Capture release evidence and publish release notes without claiming readiness beyond verified checks.

## Release Definition

The project is publish-ready when it can be given to a writer without engineering assistance and without likely loss of ordinary work.

Release-ready means:

1. Core authoring workflows are complete and ergonomic.
2. Data import/export and recovery behavior is understandable, tested, and hard to misuse.
3. The UI is coherent, responsive, accessible, and free of visible copied-app remnants.
4. Runtime failures have safe fallbacks and clear user-facing messaging.
5. The build, test, lint, typecheck, accessibility, and browser smoke gates are repeatable.
6. Documentation explains what the app does, where data lives, how to back it up, and what is intentionally out of scope.
7. The app can be deployed as a static web artifact with predictable cache behavior.

## Non-Goals For First Public Release

- Account creation.
- Cloud sync or hosted database.
- Collaboration.
- Sharing or publishing worlds online.
- AI-assisted generation.
- Payments.
- Native mobile apps.
- Translation/localization.
- Advanced plugin system.
- Real-time graph physics or heavy visualization libraries unless graph interaction becomes a release-defining feature.

## Release Principles

### Trust Through Honesty

The app must be explicit that data is local to the browser profile. It should encourage export backups and avoid implying cloud durability.

### Strong Defaults, Escape Hatches

The default workflow should work for writers without setup. Advanced choices such as custom entry types, imports, and permanent delete should remain discoverable but deliberate.

### Progressive Hardening

Keep the static local-first architecture until release requirements prove that a backend is necessary. Do not add infrastructure before product behavior is stable.

### Domain-Led UI

The UI should feel like worldbuilding software, not a generic CRUD admin or marketing site. Screens should prioritize scanning, editing, linking, and returning to work.

### Quality Gates Before Claims

Do not claim professional readiness until tests, builds, browser smoke checks, responsive checks, keyboard walkthroughs, and data round trips have passed.

## Target Information Architecture

### Global Shell

- Persistent header with brand, primary navigation, save status, data actions, and accessible skip link.
- Optional compact command/search entry once core navigation is stable.
- Responsive navigation that remains usable at phone and tablet widths.
- Clear local-data notice in Data or Settings, not a distracting banner on every page.

### Overview

- Current world name and summary.
- Section totals.
- Recently updated entries.
- Pinned entries.
- Incomplete records.
- Orphaned records with no relationships.
- Timeline highlights.
- Quick create actions.
- Backup reminder if no recent export/snapshot exists.

### Entry Sections

- Dense browse/edit workflow.
- Search, tag, status, archived, updated-date filters.
- Timeline-specific filters where relevant.
- Clear selected-entry state.
- Display and edit modes that do not cause accidental data loss.
- Entry actions grouped by frequency and risk.

### Relationships

- Create/edit/delete relationships.
- Type and entry filters.
- Entry detail backlinks.
- Graph-style overview.
- Broken-reference detection and repair flows for imported or migrated data.

### Timeline

- Stable timeline sort order.
- Era grouping.
- Involved-entry filters.
- Relationship-backed event links.
- Clear order editing and event movement controls before release.

### Data

- Active world JSON export.
- All-world JSON export if multiple worlds are exposed.
- Markdown export.
- File picker import in addition to paste.
- Import preview.
- Replace/merge decision if merge is included.
- Automatic snapshot before destructive data actions.
- Snapshot restore list.
- Clear local-only data explanation.

### Settings

- World metadata editing.
- Entry type management if custom types ship in UI.
- Data storage status.
- Export reminder settings if included.
- Reset seed data behind confirmation.

## Architecture Target

### Current Ownership To Preserve

- `src/types.ts`: shared domain types.
- `src/Utlilities/worldDocument.ts`: document parsing, migration, and active-world helpers.
- `src/Utlilities/codexStorage.ts`: browser storage adapter.
- `src/Utlilities/codexEntries.ts`: entry creation and mutation helpers.
- `src/Utlilities/codexSearch.ts`: search and filters.
- `src/Utlilities/codexRelationships.ts`: relationship rules and graph data.
- `src/Utlilities/codexTimeline.ts`: timeline sorting and grouping.
- `src/Utlilities/codexDataPortability.ts`: import/export logic.
- `src/Utlilities/fileDownloads.ts`: browser file download helpers.

### Required Refactors Before Release

1. Split `src/App.tsx` into route components:
   - `src/routes/OverviewRoute.tsx`
   - `src/routes/SectionRoute.tsx`
   - `src/routes/RelationshipsRoute.tsx`
   - `src/routes/DataRoute.tsx`
   - `src/routes/SettingsRoute.tsx` if settings ship.
2. Move app-level state orchestration into a narrow hook:
   - `src/hooks/useWorldDocumentState.ts`
   - Owns active document, active world, save status, import, reset, and entry/relationship mutations.
3. Move reusable view components into feature folders:
   - `src/features/entries/*`
   - `src/features/relationships/*`
   - `src/features/timeline/*`
   - `src/features/data/*`
4. Keep pure business rules in utilities and test them directly.
5. Keep React components focused on rendering, event wiring, and accessible interactions.

### Data Architecture Decision

The first release keeps `localStorage` by decision. IndexedDB remains a future option if local document size, snapshot depth, or user expectations outgrow `localStorage`.

Option A: Harden `localStorage`.

- Pros: smallest change, simplest static deployment, preserves current behavior.
- Cons: size limits, browser clearing risk, harder snapshot history, worse large-world performance.
- Acceptable only if release copy clearly says local browser storage and export backups are required.

Deferred Option B: Move world documents and snapshots to IndexedDB.

- Pros: better quota characteristics, better snapshot storage, more appropriate for a professional local writing tool.
- Cons: migration work, more complex tests, more storage failure modes.
- Reopen only if `localStorage` quota, snapshot depth, or large-world performance becomes a real release blocker.

Decision: harden `localStorage` for release. This means the release must include strong local-data warnings, export guidance, snapshots before destructive actions, and full JSON export as the primary user-controlled backup path.

## Work Slices

Each slice should be completed and validated before moving to the next. A slice is complete only when code, tests, docs, and review notes match the acceptance criteria.

### Slice 1: Release Scope And Product Contract

Goal: lock what the first published product promises.

Evaluation before work:

- Confirm target audience, name, distribution channel, storage promise, browser support, PWA requirement, telemetry stance, and neutral sample-content requirement.
- Compare intended claims against actual local-first behavior.
- Identify any claim that would require backend, auth, sync, payment, or collaboration.

Implementation plan:

1. Capture release decisions in `PUBLISH_READINESS_PLAN.md`.
2. Update `README.md` with release-positioning language once decisions are final.
3. Add a short in-app local-data explanation for `localStorage`, export backups, and browser-data-clearing risk.
4. Define publish-readiness acceptance criteria and release blockers.
5. Replace Valgaron-specific default seed content with neutral sample content, while keeping Valgaron sample data available only if deliberately added as an optional import later.

Acceptance criteria:

- Release scope is explicit.
- No release copy overpromises durability, privacy, collaboration, or backup.
- Non-goals are visible enough to prevent accidental scope creep.
- Public starter data is neutral by default.

### Slice 2: App Structure And Maintainability Refactor

Goal: make the codebase maintainable enough for professional iteration.

Evaluation before work:

- Measure large files and identify stateful route responsibilities.
- Confirm tests cover utilities before moving components.
- Ensure refactor does not change user-facing behavior.

Implementation plan:

1. Extract route components from `src/App.tsx`.
2. Extract `useWorldDocumentState`.
3. Move entry, relationship, timeline, and data subcomponents into feature folders.
4. Keep imports stable and avoid broad behavior rewrites.
5. Add smoke tests or component-level tests if the chosen test stack supports them.

Acceptance criteria:

- `src/App.tsx` becomes a small composition root.
- Route components are focused and understandable.
- Existing Jest, typecheck, lint, and build gates pass.
- No visible workflow regression is introduced.

### Slice 3: Data Durability And Recovery

Goal: make data behavior safe enough for real users.

Evaluation before work:

- Confirm `localStorage` hardening details and document which IndexedDB triggers would reopen the decision later.
- Identify every destructive action: import replace, reset, permanent delete, delete relationship, delete world if added.
- Define snapshot retention and restore rules.

Implementation plan:

1. Add automatic snapshots before import, reset, and permanent delete.
2. Add snapshot browser and restore flow.
3. Add export metadata: schema version, exportedAt, app version, world counts.
4. Add import file picker.
5. Add import validation for duplicate ids, missing section definitions, orphaned relationships, and unsupported schema versions.
6. Add safe migration tests.
7. Add a storage adapter boundary so IndexedDB can be introduced later without rewriting app state.

Acceptance criteria:

- Users can recover from accidental reset/import/permanent delete if snapshots are enabled.
- Invalid imports never overwrite current data.
- Export/import round trip is tested.
- Storage failure states show clear UI.

### Slice 4: Workspace, In-Fiction World, And Custom Entry Type UI

Goal: align UI capability with the data model while separating project/universe workspaces from in-fiction worlds and planets.

Evaluation before work:

- Confirm release terminology and navigation for project/universe workspaces versus in-fiction planets/worlds.
- Define separate data models and ownership rules for workspaces and in-fiction worlds/planets.
- Identify whether in-fiction worlds/planets are a built-in entry section, a specialized first-class record type, or a layer above places.
- Identify whether custom fields are section-level only or per-entry.
- Confirm deletion/archive rules for workspaces, in-fiction worlds/planets, and entry types.

Implementation plan:

1. Add project/universe workspace switcher and metadata editor.
2. Add create, rename, duplicate, archive/delete workspace flows.
3. Add a separate in-fiction world/planet management surface inside each workspace.
4. Add create, edit, duplicate, archive/delete flows for in-fiction worlds/planets.
5. Add clear relationship behavior between in-fiction worlds/planets and places, factions, characters, lore, and timeline events.
6. Add custom entry type management if it remains in release scope after the workspace and in-fiction world UI lands.
7. Add custom detail field management if custom entry types ship.
8. Add validation for duplicate workspace ids, in-fiction world ids, section ids, unsafe ids, and field-key conflicts.
9. Add tests for workspace, in-fiction world/planet, relationship, and entry-type mutations.

Acceptance criteria:

- Users can manage project/universe workspaces without localStorage editing.
- Users can manage in-fiction worlds or planets as separate worldbuilding records inside a workspace.
- Workspace switching never implies switching planets, and planet/world records never imply switching projects.
- Exports preserve both workspace-level metadata and in-fiction world/planet records distinctly.
- Custom entry types can be created and used in navigation.
- Export/import preserves custom entry types and records.
- Risky world/type deletions require confirmation and snapshots.

### Slice 5: Editing Experience Upgrade

Goal: make repeated authoring comfortable and hard to lose.

Evaluation before work:

- Identify accidental-loss paths: route changes, filter changes, selected entry changes, import/reset, and browser close.
- Decide explicit save versus autosave per form.
- Decide Markdown preview requirements.

Implementation plan:

1. Add dirty-state tracking for entry and relationship forms.
2. Warn before losing unsaved form edits.
3. Add Markdown preview for notes.
4. Add better status and archive controls.
5. Add quick create actions from overview and section pages.
6. Add copy entry name and duplicate-as-template actions.

Acceptance criteria:

- Unsaved edits are not lost silently.
- Notes are easier to review.
- Common authoring actions take fewer clicks.
- Keyboard operation remains intact.

### Slice 6: Relationship And Graph Professionalization

Goal: make world logic useful at scale.

Evaluation before work:

- Measure likely graph size.
- Decide whether graph remains static HTML/CSS or needs a lightweight graph library.
- Confirm relationship-type taxonomy and whether custom relationship types are allowed.

Implementation plan:

1. Add relationship type management if needed.
2. Add broken-reference report and repair UI.
3. Add orphaned-entry overview.
4. Add graph filtering by section, status, tag, and relationship type.
5. Add graph node selection that opens entry details.
6. Add tests for broken-reference detection and orphaned records.

Acceptance criteria:

- Relationships remain understandable beyond seed data.
- Imported broken links are visible and recoverable.
- Graph interactions improve navigation instead of becoming decoration.

### Slice 7: Timeline Professionalization

Goal: make timeline work useful for serious chronology work.

Evaluation before work:

- Decide flexible prose dates versus structured dates.
- Decide whether alternate calendars are in release scope.
- Confirm sorting semantics for unknown or approximate dates.

Implementation plan:

1. Add explicit order-edit controls.
2. Add range/unknown/approximate date modeling if required.
3. Add timeline table view with stable columns.
4. Add timeline highlight cards on overview.
5. Add conflict/orphan prompts for timeline events.
6. Add tests for sorting, grouping, and filtering edge cases.

Acceptance criteria:

- Users can reorder timeline events without editing raw fields awkwardly.
- Timeline filters and order are predictable.
- Linked entries are visible from events and event references.

### Slice 8: Visual Design, Responsive UX, And Accessibility Audit

Goal: make the application feel professional and trustworthy.

Evaluation before work:

- Capture desktop, tablet, and mobile screenshots.
- Walk through keyboard-only flows.
- Check focus order, dialogs, labels, contrast, text wrapping, and empty states.
- Decide whether to use retained MUI/local components more consistently.

Implementation plan:

1. Establish a small design token system or align existing CSS variables.
2. Replace one-off controls with consistent local/MUI-backed primitives where useful.
3. Review every route at 375px, 768px, 1024px, and desktop width.
4. Add accessible dialog focus management and restore focus on close.
5. Add automated accessibility checks if a browser test stack is added.
6. Add final empty/loading/error states.

Acceptance criteria:

- No obvious layout overlap or text clipping at target widths.
- Keyboard-only operation works for core workflows.
- Dialog focus behavior is robust.
- Visual hierarchy is consistent across routes.

### Slice 9: Testing Strategy And Quality Gates

Goal: make release quality repeatable.

Evaluation before work:

- Identify test gaps by workflow, not file count.
- Decide whether to add React Testing Library, Playwright, Vitest, or keep Jest-only.
- Identify CI environment and browser availability.

Implementation plan:

1. Keep unit tests for utilities.
2. Add component/integration tests for entry form, relationship form, data import, and reset confirmation.
3. Add Playwright smoke tests for navigation, create/edit/archive, import/export preview, and responsive route rendering.
4. Add an accessibility smoke test with axe if Playwright is adopted.
5. Add `npm run check` that runs format check, lint, typecheck, tests, and build.
6. Add CI workflow for pull requests and release branches.

Acceptance criteria:

- A single command or CI workflow validates release readiness.
- Core workflows are covered at unit and browser-smoke levels.
- Failed checks are actionable.

### Slice 10: Performance And Large-World Readiness

Goal: keep the app fast as user data grows.

Evaluation before work:

- Create synthetic large-world fixtures.
- Measure load time, search time, route render time, and export/import time.
- Identify React re-render hotspots.

Implementation plan:

1. Add large-world seed generator for tests and profiling.
2. Memoize expensive derived data where needed.
3. Consider list virtualization for large sections.
4. Move storage serialization off hot render paths if needed.
5. Add user-visible progress for large import/export if needed.

Acceptance criteria:

- App remains responsive with a realistic large world.
- Search and filter operations are fast enough for repeated authoring.
- Large export/import does not appear frozen without feedback.

### Slice 11: Offline, PWA, And Deployment

Goal: make publishing repeatable and the hosted app reliable.

Evaluation before work:

- Use GitHub Pages as the hosting provider.
- Treat PWA installability and offline cache as release requirements.
- Confirm cache invalidation strategy.

Implementation plan:

1. Add production metadata: title, description, favicon, manifest, theme color.
2. Add GitHub Pages deployment configuration.
3. Add service worker, web app manifest, install metadata, and offline shell caching.
4. Add cache strategy that does not strand users on stale app code after schema migrations.
5. Add deployment smoke checklist.

Acceptance criteria:

- Production build deploys repeatably to GitHub Pages.
- Browser tab metadata and icons are polished.
- Cache behavior is understood and tested.
- Offline installability and offline claims match tested Firefox and Chrome behavior.

### Slice 12: Runtime Reliability And Supportability

Goal: make failures understandable and recoverable in production.

Evaluation before work:

- Identify runtime failure paths: corrupt storage, unavailable storage, import failure, schema mismatch, rendering error, oversized data, and failed downloads.
- Telemetry is not allowed. Define local-only diagnostics that users can copy into an issue report.
- Review existing error boundary coverage and decide where route-level boundaries are needed.

Implementation plan:

1. Add route-level error boundaries with recovery actions.
2. Add user-facing recovery for invalid or unreadable saved documents.
3. Add local diagnostics export that includes app version, schema version, route, browser user agent, counts, and recent non-sensitive error messages.
4. Add clear failure states for storage write failure, import rejection, and export/download unavailability.
5. Add tests for error-state helpers and document recovery paths.
6. Add manual QA scenarios for corrupt storage and failed storage writes.

Acceptance criteria:

- A rendering or storage failure does not strand the user on a blank screen.
- Users can export diagnostics without exposing world content unless they explicitly choose to include it.
- Recovery options are clear and do not silently delete data.

### Slice 13: Documentation, Help, And Support

Goal: make the release usable without direct developer explanation.

Evaluation before work:

- Identify questions a new user will have during first use.
- Decide where help lives: README, in-app Help route, docs site, or all.
- Decide support/contact expectations.

Implementation plan:

1. Update README for users and contributors.
2. Add in-app Help or Guide route.
3. Document local data, export backups, import, reset, snapshots, and browser data risks.
4. Document release limitations.
5. Add changelog and versioning policy.
6. Add manual QA checklist.

Acceptance criteria:

- A new user can understand storage and backup behavior.
- A contributor can run and validate the app.
- Release notes can be produced without reconstructing history from commits.

### Slice 14: Security, Privacy, And Legal Readiness

Goal: prevent misleading claims and avoid avoidable web security mistakes.

Evaluation before work:

- Confirm there is no backend or telemetry.
- Confirm hosting CSP requirements.
- Confirm whether privacy policy or terms are needed for the chosen publication channel.

Implementation plan:

1. Add privacy note explaining local-only storage, no telemetry, and no account behavior.
2. Add CSP and security headers where the hosting platform supports them.
3. Audit dependencies and run `npm audit`.
4. Ensure imported files are parsed as data only and never executed.
5. Avoid unsafe HTML rendering for Markdown unless sanitized.
6. Add dependency update policy.

Acceptance criteria:

- Public docs and UI make accurate privacy/storage claims.
- Import and Markdown behavior do not execute untrusted content.
- Dependency risk is reviewed before release.

### Slice 15: Versioning, Maintenance, And Release Operations

Goal: make the project sustainable after publication.

Evaluation before work:

- Decide semantic versioning policy.
- Decide how schema migrations are versioned and tested.
- Decide dependency update cadence and minimum supported browser versions.
- Decide how user-reported data issues are triaged without access to private local data.

Implementation plan:

1. Add app version metadata surfaced in Data or Help.
2. Add `CHANGELOG.md`.
3. Add schema migration documentation and test fixtures per schema version.
4. Add dependency update policy.
5. Add issue templates for bug reports, data recovery issues, and feature requests.
6. Add release checklist ownership for version bump, changelog, build artifacts, QA evidence, and deployment smoke.

Acceptance criteria:

- Every public release has a version, changelog entry, and migration expectation.
- Maintainers can reproduce release checks.
- User support can happen without asking users to paste private world content by default.

### Slice 16: Release Candidate And Launch

Goal: ship a professional release with evidence.

Evaluation before work:

- Confirm all prior slices are complete or explicitly deferred.
- Confirm release blockers are closed.
- Confirm deployment target and final domain.

Implementation plan:

1. Cut a release candidate branch or tag.
2. Run full automated checks.
3. Run manual QA checklist.
4. Capture release screenshots.
5. Test import/export round trip on a clean browser profile.
6. Test data migration from the previous saved schema.
7. Deploy to staging or preview.
8. Smoke test production preview.
9. Publish release notes.
10. Deploy production.

Acceptance criteria:

- Release evidence is current.
- Known limitations are documented.
- Production deployment is smoke-tested after publishing.

## Release Blockers

These issues should block a professional public release:

1. Data can be lost through ordinary create/edit/import/reset workflows without warning or recovery.
2. Exported JSON cannot restore a full active world.
3. Invalid imports can overwrite current data.
4. Core routes fail in a current supported browser.
5. Keyboard users cannot complete create/edit/export/import/reset flows.
6. App copy implies cloud backup or security guarantees that do not exist.
7. Build, lint, typecheck, or test gates fail.
8. Browser storage migration is untested.
9. The deployed app can serve stale code that cannot read current saved data.
10. Published documentation does not explain local storage risk.

## Recommended Release Sequence

1. Scope lock and release contract.
2. App structure refactor.
3. Data durability and recovery.
4. Multi-world/custom-type UI if required for release.
5. Editing experience upgrade.
6. Relationship and graph professionalization.
7. Timeline professionalization.
8. Visual/accessibility audit.
9. Testing and CI gates.
10. Performance and large-world readiness.
11. Deployment/PWA decision.
12. Runtime reliability and supportability.
13. Documentation and support.
14. Security/privacy/legal readiness.
15. Versioning and maintenance.
16. Release candidate and launch.

## Validation Matrix

### Automated

- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run check:metadata`
- `npm test`
- `npm run build`
- `npm run check:pwa`
- `npm run check:browser`
- `npm run check:performance`
- `npm run check:release`
- `npm audit --omit=dev`

### Manual

- Create/edit/archive/restore/permanent-delete entry.
- Duplicate entry.
- Add/edit/delete relationship.
- Filter relationships and open linked records.
- Add timeline event and verify ordering/grouping.
- Export JSON and import it into a clean profile.
- Export Markdown and inspect readability.
- Reset seed after exporting.
- Restore a recovery snapshot.
- Keyboard-only navigation across all routes.
- Responsive walkthrough at 375, 768, 1024, and desktop widths.
- Browser matrix smoke on supported browsers.
- Installed/offline PWA check after deployment.
- Deployment smoke checklist on the published GitHub Pages URL.

## Documentation Deliverables

- `README.md`: user overview, local data warning, scripts, release limitations.
- `PUBLISH_READINESS_PLAN.md`: this release plan.
- `CHANGELOG.md`: versioned release notes.
- `PRIVACY.md`: local-only privacy and diagnostics note.
- `docs/user-guide.md`: user-facing workflow and backup guide.
- `docs/support.md`: diagnostics-first support guidance.
- `docs/security-privacy.md`: import, Markdown, diagnostics, hosting header, and dependency guidance.
- `docs/qa/manual-release-checklist.md`: manual QA steps.
- `docs/qa/runtime-recovery.md`: corrupt storage, failed write, import rejection, and render recovery scenarios.
- `docs/deployment/static-hosting.md`: deployment and cache strategy.
- `docs/versioning.md`: semantic versioning and schema policy overview.
- `docs/release/versioning-and-maintenance.md`: versioning, migration, and dependency policy.
- `docs/release/schema-migrations.md`: current and legacy schema migration record.
- `.github/ISSUE_TEMPLATE/*.md`: privacy-preserving issue intake templates.

## Plan Review And Improvement Log

### Review Pass 1

Evaluation performed:

- Checked the plan against the current prototype state, `AGENTS.md`, `README.md`, and the completed prototype plan.
- Checked whether the plan starts with clarifying questions.
- Checked whether the plan distinguishes professional publication from prototype completion.
- Checked whether data loss, browser storage, accessibility, testing, deployment, and documentation are treated as first-class release concerns.

Findings:

1. The first draft needed explicit release blockers so publication could be stopped by concrete evidence.
2. The first draft needed a data architecture decision between hardened localStorage and IndexedDB.
3. The first draft needed to call out the large `src/App.tsx` maintainability risk.
4. The first draft needed a validation matrix that separates automated checks from manual QA.

Fixes applied:

1. Added `Release Blockers`.
2. Added `Data Architecture Decision`.
3. Added maintainability refactor details in Slice 2 and current-state gaps.
4. Added `Validation Matrix`.

Re-evaluation:

- The plan now identifies release decisions, implementation slices, blockers, validation, and documentation deliverables.
- No known gap remains that would prevent using this document as the publish-readiness roadmap.

### Review Pass 2

Evaluation performed:

- Re-read every work slice for missing acceptance criteria.
- Checked for accidental backend, account, collaboration, native, or localization scope creep.
- Checked whether each slice begins with evaluation before implementation.
- Checked whether the plan is executable without needing hidden context.

Findings:

1. Several slices could be misread as optional polish rather than release-readiness work.
2. Offline/PWA work needed an explicit cache-staleness warning because schema migrations can make stale assets dangerous.
3. Security/privacy work needed to state that imported files and Markdown must be treated as untrusted data.

Fixes applied:

1. Added acceptance criteria to every slice.
2. Added stale-code cache strategy requirements in Slice 11 and Release Blockers.
3. Added import/Markdown safety requirements in the security/privacy slice.

Re-evaluation:

- Each slice now has evaluation steps, implementation steps, and acceptance criteria.
- The plan remains local-first and avoids adding cloud scope by default.
- No further gaps are known from this review pass.

### Review Pass 3

Evaluation performed:

- Re-scanned the plan from a publish-and-maintain perspective rather than only a pre-release implementation perspective.
- Checked whether runtime failures, user support, versioning, and post-release maintenance had clear owners.
- Checked whether the release sequence could sustain updates after launch.

Findings:

1. Runtime reliability and supportability were present as scattered concerns but not owned by a dedicated slice.
2. Versioning, changelog, schema migration records, dependency updates, and issue reporting were not explicit enough for a professional published tool.
3. Documentation deliverables did not include a maintenance/versioning policy.

Fixes applied:

1. Added `Slice 12: Runtime Reliability And Supportability`.
2. Added `Slice 15: Versioning, Maintenance, And Release Operations`.
3. Updated release sequence numbering and documentation deliverables.

Re-evaluation:

- The plan now covers pre-release implementation, launch, and post-release maintenance.
- Runtime failure handling and non-sensitive diagnostics are explicit without requiring telemetry or backend scope.
- No further known gaps remain after this pass.

### Review Pass 4

Evaluation performed:

- Recorded the user's release decisions and re-scanned the plan for stale undecided language.
- Checked whether the storage architecture recommendation still matched the confirmed `localStorage` release promise.
- Checked whether PWA, GitHub Pages, Firefox/Chrome, no telemetry, neutral sample content, and multi-world terminology were reflected in the work slices.

Findings:

1. The plan still implied IndexedDB was the recommended publish-readiness path even after `localStorage` was confirmed for release.
2. The next action still asked to answer release questions that had already been answered.
3. Multi-world UI work needed clearer language distinguishing project/universe workspaces from in-fiction planets/worlds.

Fixes applied:

1. Reframed IndexedDB as a deferred option with explicit triggers to reopen.
2. Updated Slice 1 and Slice 4 to include the confirmed release decisions.
3. Updated the next action to begin implementing the now-locked release contract.

Re-evaluation:

- The plan now reflects the confirmed release target: Valgaron World Codex as a polished local-only personal tool, published on GitHub Pages, installable as a PWA, telemetry-free, using hardened `localStorage`, supporting desktop/tablet/mobile with Firefox and Chrome as primary targets, exposing project/universe workspaces separately from in-fiction worlds/planets, and shipping neutral sample content by default.
- No stale release-decision gaps remain after this pass.

### Review Pass 5

Evaluation performed:

- Applied the user's clarification that multi-world UI must include separate terminology and separate functionality.
- Checked Slice 4 for whether it treated workspaces and in-fiction worlds/planets as distinct data and UI concepts.

Findings:

1. The previous plan distinguished terminology but could still be interpreted as one generic multi-world model.
2. Slice 4 did not explicitly require separate create/edit/archive/delete flows for in-fiction worlds/planets.
3. Export acceptance criteria did not explicitly require preserving workspace metadata separately from in-fiction world/planet records.

Fixes applied:

1. Updated confirmed release decisions to require separate workspace and in-fiction world/planet functionality.
2. Renamed Slice 4 and expanded its evaluation, implementation, and acceptance criteria.
3. Added export/import acceptance criteria that preserves both concepts distinctly.

Re-evaluation:

- The plan now treats project/universe workspaces and in-fiction worlds/planets as separate product concepts with separate data behavior.
- No remaining ambiguity is known in the multi-world release requirement.

### Implementation Pass: Slice 1 Started

Evaluation performed:

- Compared the runtime and README against the confirmed release contract.
- Checked for product-name drift, Valgaron-specific starter data, and weak local-data warnings.

Findings:

1. The browser title and README still used `VWorldBuilder`.
2. Starter content was still Valgaron-specific instead of neutral sample content.
3. The UI mentioned local browser persistence but did not strongly recommend export backups from the main workflow.

Fixes applied:

1. Updated product naming toward `Valgaron World Codex`.
2. Replaced starter data with neutral sample worldbuilding content.
3. Added local browser data/export backup warnings to the overview and Data route copy.

Re-evaluation:

- Slice 1 is underway and now visibly aligns runtime copy and starter content with the confirmed release contract.
- Remaining Slice 1 work is to finish validation, update any tests affected by neutral starter data, and then continue to the next release-contract task.

### Implementation Pass: Slice 1 Completed

Evaluation performed:

- Re-ran targeted searches for stale starter-content copy, old product naming, and local-data warnings after the runtime changes.
- Reviewed the main overview, reset, data import/export, and README copy against the confirmed release contract.
- Ran the full validation loop required for source and documentation changes.

Findings:

1. Remaining `VWorldBuilder` references are internal component symbol names, not rendered product copy.
2. The remaining `world-valgaron` reference is the legacy migration fallback id and is intentionally preserved for older local-storage data.
3. No rendered starter-content copy still positions the default dataset as Valgaron-specific.

Fixes applied:

1. Updated affected Jest expectations for neutral starter data and the new backup validation message.
2. Confirmed the runtime and README now use `Valgaron World Codex` as the public product name.
3. Confirmed the overview and Data route warn that browser storage is local and that JSON backups should be exported regularly.

Validation:

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npx vite build`

Re-evaluation:

- Slice 1 is complete for the current release-readiness plan.
- The next most impactful uncompleted slice is Slice 2: App Structure, Maintainability, And State Boundaries.

### Implementation Pass: Slice 2 Completed

Evaluation performed:

- Measured `src/App.tsx` and confirmed it still owned persistence, active-world derivation, route UI, entry editing, relationship management, data import/export, dialogs, and shared entry display helpers.
- Checked current tests before refactoring so the split could stay behavior-preserving.
- Reviewed file-size and ownership risks after the first hook extraction to determine whether additional refactoring was still needed.

Findings:

1. `src/App.tsx` was still a large route/component bundle after Slice 1, which made future publish-readiness work harder to review.
2. Persistence and mutation logic belonged behind a focused local document state boundary instead of the app shell.
3. Route pages and shared codex entry views could be split without changing user-facing workflows.

Fixes applied:

1. Added `src/Utlilities/useWorldDocumentState.ts` to own browser document loading, saving, active-workspace selectors, entry mutations, relationship mutations, import, reset, and save status.
2. Reduced `src/App.tsx` to a small shell that composes the router, header navigation, save status, reset dialog state, and route wiring.
3. Moved route-level UI into `src/Pages/OverviewPage.tsx`, `src/Pages/SectionPage.tsx`, `src/Pages/RelationshipsPage.tsx`, and `src/Pages/DataPage.tsx`.
4. Moved shared entry cards, detail panels, relationship snippets, timeline overview, entry form, and confirmation dialogs into `src/Components/Codex/CodexEntryViews.tsx`.

Validation:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

Re-evaluation:

- Slice 2 is complete for the current release-readiness plan.
- `src/App.tsx` is now a composition root, and the largest extracted component module remains under the repository's size-discipline threshold.
- The next most impactful uncompleted slice is Slice 3: Data Durability And Recovery.

### Implementation Pass: Slice 3 Completed

Evaluation performed:

- Confirmed destructive local-data actions were import replace, reset, permanent entry delete, relationship delete, and snapshot restore.
- Checked that `localStorage` remains the confirmed release storage target, with IndexedDB deferred until quota, snapshot depth, or large-world performance becomes a real blocker.
- Reviewed import/export and Data route behavior for recovery gaps before implementation and again after validation.

Findings:

1. Destructive actions could replace or remove local-only data without a recoverable in-browser history.
2. JSON export lacked explicit export metadata even though the raw document was importable.
3. Import validation accepted structurally valid documents with duplicate ids or orphaned relationships.
4. Storage access was duplicated directly against `window.localStorage`, making a future IndexedDB migration harder.
5. Snapshot restore itself is also a destructive replacement action and needed a pre-restore snapshot.

Fixes applied:

1. Added bounded recovery snapshots in `src/Utlilities/codexSnapshots.ts`, retained in `localStorage` under `valgaron.recoverySnapshots.v1`.
2. Captured snapshots before import, reset, permanent entry delete, relationship delete, and snapshot restore.
3. Added a Recovery snapshots panel to the Data route with snapshot status, restore, and delete actions.
4. Added export metadata to JSON backups while keeping them parseable as world documents.
5. Added import validation for duplicate world, section, entry, and relationship ids, plus orphaned relationship endpoints.
6. Added a JSON file picker alongside paste-based import.
7. Introduced `src/Utlilities/storageAdapter.ts` as the narrow storage boundary for current localStorage reads/writes and future storage migration.
8. Documented snapshot behavior and local-backup limits in `README.md`.

Validation:

- `npx jest src\Utlilities\storageAdapter.test.ts src\Utlilities\codexStorage.test.ts src\Utlilities\codexSnapshots.test.ts src\Utlilities\codexDataPortability.test.ts --runInBand`
- `npm run lint`
- `npm test`
- `npm run typecheck`
- `npm run build`

Re-evaluation:

- Slice 3 is complete for the current release-readiness plan.
- Remaining known durability limitation: recovery snapshots are still browser-profile-local, so downloaded JSON remains the only device-independent backup.
- The next most impactful uncompleted slice is Slice 4: Workspace, In-Fiction World, And Custom Entry Type UI.

### Implementation Pass: Slice 4 Completed

Evaluation performed:

- Confirmed the existing `WorldDocument.worlds` collection was acting as the project/universe workspace layer, even though UI copy could read as in-fiction worlds.
- Identified the missing separate in-fiction world/planet record model inside each workspace.
- Checked that custom entry type definitions existed in the data model but had no creation/deletion UI.
- Reviewed destructive workspace, in-fiction world/planet, and entry-type deletion paths against the snapshot requirement from Slice 3.

Findings:

1. Workspace switching and workspace metadata editing were not available without editing stored JSON.
2. In-fiction worlds/planets were not represented separately from project/universe workspaces.
3. Custom entry types could not be created from the UI, so the dynamic section model was incomplete.
4. Export/import summaries did not surface in-fiction world/planet counts distinctly.
5. Legacy saved workspaces needed safe defaults for the new workspace status and in-fiction world/planet collection.

Fixes applied:

1. Added workspace status and in-fiction world/planet types to the document model.
2. Added neutral seed in-fiction planet/moon records.
3. Updated document parsing so older saved workspaces default to active status and an empty in-fiction world/planet list.
4. Added `src/Utlilities/workspaceManagement.ts` with pure helpers for workspace creation, switching, editing, archive/restore, duplicate, permanent delete, in-fiction world/planet CRUD, and custom entry type creation/deletion.
5. Added the Workspaces route for project/universe workspace management, in-fiction worlds/planets, and custom entry types.
6. Wired destructive workspace, in-fiction world/planet, and entry-type delete actions through recovery snapshots.
7. Updated JSON backup metadata, import preview, Markdown export, and import validation to preserve and report in-fiction worlds/planets distinctly.
8. Updated `README.md` to describe multi-workspace UI, in-fiction world/planet records, and custom entry types.

Validation:

- `npx jest src\Utlilities\workspaceManagement.test.ts src\Utlilities\codexDataPortability.test.ts src\Utlilities\worldDocument.test.ts --runInBand`
- `npm test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

Re-evaluation:

- Slice 4 is complete for the current release-readiness plan.
- The implementation distinguishes project/universe workspaces from in-fiction worlds/planets in both data and UI.
- Remaining future refinement: custom entry type editing is create/delete only; richer field editing can be expanded in a later editing-experience or structure-management pass.
- The next most impactful uncompleted slice is Slice 5: Editing Experience Upgrade.

### Implementation Pass: Slice 5 Completed

Evaluation performed:

- Identified accidental-loss paths across entry edits, relationship edits, pasted import JSON, reset/restore actions, workspace management forms, route navigation, and browser close.
- Confirmed explicit save remains the right model for entry, relationship, workspace, in-fiction world/planet, and custom entry type forms.
- Reviewed repeated authoring actions that required extra clicks from the overview and section editor.

Findings:

1. Entry and relationship forms could be abandoned by internal navigation without warning.
2. Pasted import JSON and workspace management drafts had no browser-close or route-change protection.
3. Entry notes were edited as Markdown-like text without a nearby preview.
4. Starting new records from the overview and reusing existing records as templates required extra steps.
5. Copying entry names for drafting or external notes was not directly supported.

Fixes applied:

1. Added `src/Utlilities/unsavedChanges.ts` with stable nested dirty checks, discard confirmation, browser before-unload protection, and internal link interception.
2. Added dirty-state tracking and visible Unsaved status pills to entry, relationship, import, workspace, in-fiction world/planet, and custom entry type forms.
3. Added discard confirmations before actions that would replace or clear dirty drafts.
4. Added a Markdown notes preview to the entry form.
5. Added overview quick-create links for every active codex section.
6. Added entry Copy Name and Use As Template actions, with duplicate-as-template creating a new draft without modifying the original entry.
7. Documented the editing protections and faster authoring actions in `README.md`.

Validation:

- `npx jest src\Utlilities\unsavedChanges.test.ts --runInBand`
- `npm test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

Re-evaluation:

- Slice 5 is complete for the current release-readiness plan.
- Remaining future refinement: rich Markdown rendering can replace the plain preformatted preview later if a Markdown renderer becomes part of the dependency strategy.
- The next most impactful uncompleted slice is Slice 6: Relationship And Graph Professionalization.

### Implementation Pass: Slice 6 Completed

Evaluation performed:

- Reviewed the relationship utility layer and confirmed graph generation skipped broken relationships, which hid import or deletion damage from users.
- Confirmed relationship type strings were already stored as arbitrary text, but the editor only exposed fixed suggestions.
- Checked graph usefulness against the plan requirements for filtering and node selection.

Findings:

1. Broken relationship references had no visible report or repair path.
2. Orphaned entries with no relationships were not surfaced.
3. Graph filtering was limited to the relationship list filters and could not narrow by section, status, tag, or relationship type.
4. Graph nodes were static labels and did not help inspect the selected record.
5. Custom relationship types were technically supported by the model but not by the editor control.

Fixes applied:

1. Added `getBrokenRelationships` and `getOrphanedEntries` diagnostics in `src/Utlilities/codexRelationships.ts`.
2. Expanded graph nodes with section ids and tags, and added graph filters for section, status, tag, and type.
3. Added a Relationships route diagnostics panel with broken-link counts, orphaned-record counts, repair/edit actions, and delete actions for broken links.
4. Added graph filter controls and selectable graph nodes that show selected record details and tags.
5. Changed relationship type editing to a free-form input with suggestions from built-in and existing relationship types.
6. Added focused tests for broken-reference detection, orphaned-entry reporting, and graph filtering.
7. Documented the relationship diagnostics and graph improvements in `README.md`.

Validation:

- `npx jest src\Utlilities\codexRelationships.test.ts --runInBand`
- `npm test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

Re-evaluation:

- Slice 6 is complete for the current release-readiness plan.
- Remaining future refinement: graph layout remains static HTML/CSS, which is acceptable for the prototype until larger graphs show a real interaction need.
- The next most impactful uncompleted slice is Slice 7: Timeline Professionalization.

### Implementation Pass: Slice 7 Completed

Evaluation performed:

- Confirmed timeline ordering currently depended on editing a raw numeric detail field.
- Confirmed flexible prose dates remain acceptable for this prototype phase, with numeric order as the stable sort mechanism.
- Reviewed timeline event relationship prompts and found no route-level diagnostics for unordered, duplicate-order, or unlinked events.

Findings:

1. Blank order values were incorrectly treated as numeric zero by timeline sorting.
2. Timeline events had no direct earlier/later controls.
3. Timeline review was card-only, with no stable table for scanning order, date, era, and link counts.
4. Timeline route did not surface ordering conflicts, missing order values, or unlinked events.
5. Overview-level chronology highlights were not available on the timeline route.

Fixes applied:

1. Fixed timeline order parsing so blank or invalid order values are treated as unordered.
2. Added `getTimelineOrderUpdates`, `getTimelineDiagnostics`, and `getTimelineHighlights` utility helpers.
3. Added focused tests for reordering, duplicate order detection, unordered events, unlinked events, and highlights.
4. Added timeline diagnostics cards for unordered events, duplicate orders, and unlinked events.
5. Added timeline highlight cards and a stable table view with order, event, date, era, link count, and earlier/later controls.
6. Wired timeline order controls through the existing entry save path.
7. Documented timeline diagnostics, highlights, table view, and order controls in `README.md`.

Validation:

- `npx jest src\Utlilities\codexTimeline.test.ts --runInBand`
- `npm test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

Re-evaluation:

- Slice 7 is complete for the current release-readiness plan.
- Remaining future refinement: richer structured dates, approximate dates, alternate calendars, and date ranges remain deferred until the product needs more than prose date labels plus numeric order.
- The next most impactful uncompleted slice is Slice 8: Visual Design, Responsive UX, And Accessibility Audit.

### Implementation Pass: Slice 8 Completed

Evaluation performed:

- Reviewed the active app shell, common CSS, route panels, filters, and confirmation dialogs against the Slice 8 acceptance criteria.
- Confirmed destructive entry, workspace, in-fiction world/planet, custom entry type, and reset dialogs had Escape handling but no shared focus trap or focus restoration.
- Captured local Chrome headless screenshots on a strict Vite audit port for representative mobile, tablet, and desktop routes.
- Rechecked the 375px overview, section, and data routes after each responsive fix until the visible clipping issues were resolved.

Findings:

1. Confirmation dialogs duplicated Escape behavior and did not trap Tab focus or restore focus to the opener after close.
2. Narrow Chrome captures exposed mobile clipping in overview cards, section filters, and long search placeholders.
3. The 480px-only mobile layout rules did not protect the tested 375px screenshot flow because the headless browser could calculate layout against a wider viewport than the captured bitmap.
4. Dense form action rows and dialogs needed stronger small-screen containment.
5. A stale or unrelated dev-server/service-worker state on the default Vite port made `5173` unreliable for audit evidence, so the responsive pass needed a strict alternate port.

Fixes applied:

1. Added `src/Utlilities/dialogFocus.ts` with reusable dialog focus trapping, Escape close handling, and opener focus restoration.
2. Added focused Jest coverage for the dialog focus trap index helper.
3. Wired entry delete, reset starter data, and workspace management permanent-delete dialogs through the shared dialog focus helper.
4. Tightened responsive CSS for app overflow containment, top navigation, wrapping section headings, dialog max-height/scrolling, mobile action rows, and 768px one-column filter/form/stat layouts.
5. Added phone-width main-column containment for reliable 375px rendering.
6. Shortened search placeholders so phone inputs remain readable.

Validation:

- `npx jest src\Utlilities\dialogFocus.test.ts --runInBand`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `git diff --check`
- Local Vite probe on strict audit port `5273`
- Local Chrome headless screenshots:
  - `.tmp\slice8\screenshots-final2\overview-375.png`
  - `.tmp\slice8\screenshots-final2\characters-375.png`
  - `.tmp\slice8\screenshots-final2\data-375.png`
  - `.tmp\slice8\screenshots-final\overview-768.png`
  - earlier pass: `.tmp\slice8\screenshots-5273\overview-1280.png`, `relationships-768.png`, `workspaces-768.png`

Re-evaluation:

- Slice 8 is complete for the current release-readiness plan.
- The audited mobile/tablet routes no longer show obvious structural clipping or overlapping in the captured evidence.
- Dialog focus behavior is centralized and covered at the pure helper level; future Slice 9 browser tests should add component or browser-level verification for Tab cycling, Escape close, and opener focus restoration.
- Remaining future refinement: assistive-technology review and automated axe-style checks are still deferred to the testing/accessibility gate work in Slice 9.
- The next most impactful uncompleted slice is Slice 9: Testing Strategy And Quality Gates.

### Implementation Pass: Slice 9 Completed

Evaluation performed:

- Reviewed existing Jest coverage by workflow instead of file count.
- Confirmed the project already had broad utility coverage for storage, import/export, search, templates, relationships, timeline, snapshots, and workspace management.
- Confirmed the repository did not have React Testing Library, Playwright, or a jsdom Jest environment installed.
- Confirmed local Chromium-family browsers are available for a dependency-free browser smoke gate.
- Checked that a single repeatable command was missing for release validation.

Findings:

1. Release checks were available only as separate commands, so it was easy to skip format, lint, typecheck, test, or build work.
2. No browser-level smoke command validated that production routes render through an actual browser.
3. `format:check` exposed existing Prettier drift in a few retained files.
4. Workflow-level Jest coverage needed one higher-level suite that proves core user flows work across utility boundaries, not only one helper at a time.
5. CI was missing, so release checks were not repeatable on push or pull request.

Fixes applied:

1. Added `npm run format:check`, `npm run check`, `npm run check:browser`, and `npm run check:release`.
2. Added `scripts/browserSmoke.cjs`, a dependency-free browser smoke runner that starts Vite on a strict local port, validates key route text through headless Chrome/Edge/Chromium, and writes responsive screenshots under `.tmp/browser-smoke`.
3. Added `.tmp/` to `.gitignore` and `.prettierignore` coverage for generated local/browser artifacts and `dist`.
4. Formatted files surfaced by the new format gate.
5. Added `src/Utlilities/releaseWorkflows.test.ts` for release-critical entry lifecycle, relationship cleanup, and JSON backup/import round-trip workflows.
6. Added `.github/workflows/ci.yml` to run `npm run check:release` on pull requests and pushes to `main` with Node 22.
7. Updated `README.md` with the new quality-gate commands and browser requirement.

Validation:

- `npx jest src\Utlilities\releaseWorkflows.test.ts --runInBand`
- `npm run check:browser`
- `npm run check`
- `npm run check:release`

Re-evaluation:

- Slice 9 is complete for the current release-readiness plan.
- The project now has a single release gate that runs format checking, lint, typecheck, Jest, production build, and browser route/screenshot smoke checks.
- Remaining future refinement: browser smoke is intentionally dependency-free and verifies rendered route text plus screenshots, not full click/edit workflows. Full interaction automation with Playwright and axe can be considered later if richer browser testing becomes worth the dependency overhead.
- The next most impactful uncompleted slice is Slice 10: Performance And Large-World Readiness.

### Implementation Pass: Slice 10 Completed

Evaluation performed:

- Reviewed search, relationship diagnostics, relationship graph, timeline derivations, overview derivations, and import/export helpers for large-world hot paths.
- Added a deterministic synthetic large-world fixture before making optimization changes.
- Measured a 2,500-entry, 5,000-relationship, 24-planetary-world workspace through search, filtering, relationship graph, relationship diagnostics, timeline derivations, and JSON export/import.
- Checked whether import/export needs progress UI at the current realistic fixture size.

Findings:

1. Global search rebuilt section lookup work for each searched entry.
2. Relationship diagnostics resolved relationship endpoints by repeatedly scanning all codex sections.
3. Timeline filtering and diagnostics repeatedly scanned all relationships for each event.
4. Timeline route rendering also recalculated event involvement by scanning relationships for each table and era row.
5. The Relationships route rebuilt selected graph-entry lookup data in render instead of memoizing it.
6. Import/export completed inside broad readiness budgets for the current large fixture, so progress UI is not yet necessary for this prototype size.

Fixes applied:

1. Added `src/Utlilities/largeWorldFixtures.ts` with deterministic large-workspace generation for tests and profiling.
2. Added fixture-shape coverage in `src/Utlilities/largeWorldFixtures.test.ts`.
3. Added `src/Utlilities/largeWorldPerformance.test.ts` to measure large-world search, section filtering, relationship graph/diagnostics, timeline derivations, and backup export/import against broad readiness budgets.
4. Added `npm run check:performance` for targeted large-world verification.
5. Optimized global search with a section lookup map.
6. Optimized relationship diagnostics and entry-relationship resolution with a shared entry index per operation.
7. Added timeline relationship-involvement indexing and reused it in filtering, diagnostics, and the timeline route.
8. Optimized timeline era grouping to avoid repeated array spreading.
9. Memoized relationship-page full-entry lookup for selected graph details.
10. Documented the performance check in `README.md`.

Validation:

- `npx jest src\Utlilities\largeWorldFixtures.test.ts src\Utlilities\largeWorldPerformance.test.ts src\Utlilities\codexRelationships.test.ts src\Utlilities\codexTimeline.test.ts src\Utlilities\codexSearch.test.ts --runInBand`
- `npm run check:performance`
- `npm run typecheck`

Re-evaluation:

- Slice 10 is complete for the current release-readiness plan.
- Large-world operations are now covered by a repeatable fixture and broad performance smoke budgets.
- The current large fixture does not justify user-visible import/export progress UI yet; this should be revisited if fixture size increases substantially or browser smoke reveals visible freezing.
- Remaining future refinement: list virtualization is still deferred because current section filtering and rendering targets remain manageable for the prototype.
- The next most impactful uncompleted slice is Slice 11: Offline, PWA, And Deployment.

### Implementation Pass: Slice 11 Completed

Evaluation performed:

- Reviewed current static assets, metadata, Vite config, router base handling, CI workflow, and GitHub Pages deployment needs.
- Confirmed GitHub Pages is the target host and that project-site base paths need explicit support.
- Confirmed PWA support must be conservative because stale app shells can be risky when saved local documents need schema migrations.
- Verified default and `/valgaron/` base-path Pages builds.

Findings:

1. `index.html` had only a title and favicon; it lacked description, theme color, manifest, and install icons.
2. Vite did not support a GitHub Pages project-site base path.
3. React Router did not receive a base name for project-site deployment paths.
4. There was no service worker, manifest, Pages deployment workflow, or route-refresh fallback.
5. There was no repeatable PWA artifact verifier or deployment smoke checklist.

Fixes applied:

1. Added production metadata, manifest link, theme color, and Apple touch icon metadata.
2. Added `public/manifest.webmanifest`, generated 192px and 512px PNG install icons, and added `public/sw.js`.
3. Added production-only service worker registration in `src/Utlilities/serviceWorkerRegistration.ts`.
4. Updated Vite to read `VITE_BASE_PATH` and React Router to use `import.meta.env.BASE_URL` as its basename.
5. Added `npm run build:pages` and `scripts/preparePagesArtifact.cjs` to create a GitHub Pages `404.html` route fallback.
6. Added `scripts/verifyPwaBuild.cjs` and `npm run check:pwa` to verify manifest, service worker, icons, metadata, and fallback output.
7. Added `.github/workflows/pages.yml` for GitHub Pages deployment with `VITE_BASE_PATH=/${{ github.event.repository.name }}/`.
8. Added `docs/deployment/static-hosting.md` with cache strategy, deployment instructions, and a deployment smoke checklist.
9. Updated `README.md` with Pages and PWA verification commands.

Validation:

- `npm run check:pwa`
- `$env:VITE_BASE_PATH='/valgaron/'; npm run build:pages; node scripts\verifyPwaBuild.cjs`
- Manual inspection of `dist/index.html` and `dist/404.html` for `/valgaron/` asset paths and matching fallback content.

Re-evaluation:

- Slice 11 is complete for the current release-readiness plan.
- Production build artifacts are GitHub Pages-ready, include PWA metadata/install assets, and have a conservative offline cache strategy.
- Remaining future refinement: full offline installability still needs manual Chrome and Firefox verification after deployment because browser install prompts and service worker behavior are environment-dependent.
- The next most impactful uncompleted slice is Slice 12: Runtime Reliability And Supportability.

### Implementation Pass: Slice 12 Completed

Evaluation performed:

- Reviewed runtime failure paths for corrupt storage, unreadable storage, schema mismatch, import rejection, failed downloads, storage write failure, and route rendering failure.
- Confirmed telemetry remains out of scope, so diagnostics must be generated locally and copyable by the user.
- Reviewed existing error boundary coverage and confirmed the active route tree needed a recovery boundary.

Findings:

1. Invalid or unreadable local storage fell back safely, but the UI did not explain that recovery happened.
2. The storage adapter intentionally hid localStorage exceptions, which kept the app from crashing but also removed useful recovery context.
3. Route rendering errors could still blank the main experience because the active route tree was not wrapped in a recovery boundary.
4. Users had no non-content diagnostics report to copy when storage or rendering failed.
5. Failed downloads were handled for exports, but diagnostics needed the same copyable fallback.
6. Validation exposed that importing `ErrorBoundary` through the Common barrel pulled unrelated retained components into startup and left the browser smoke root empty.
7. The browser smoke harness needed more robust Windows headless flags and per-browser profile isolation after Chrome/Edge GPU subprocess failures.

Fixes applied:

1. Added detailed localStorage read results while preserving the existing safe `null` read fallback.
2. Added `loadWorldDocumentWithStatus` so document loading reports loaded, empty, recovered, current, legacy, and seed fallback states with non-sensitive issues.
3. Exposed document load status through `useWorldDocumentState` and the Data route.
4. Extended the existing `ErrorBoundary` to pass caught error details into fallback renderers.
5. Added `RuntimeErrorFallback` around the route tree with Retry, Open Data, Reload App, and diagnostics actions.
6. Added `localDiagnostics` helpers that export app version, schema version, route, browser user agent, storage status, recovery status, and document counts while omitting world content by default.
7. Added a Data route diagnostics export/copy area and visible load-recovery messages.
8. Added manual recovery QA scenarios in `docs/qa/runtime-recovery.md`.
9. Updated `README.md` to document runtime recovery and local-only diagnostics.
10. Narrowed the App shell ErrorBoundary import to the owned component file to avoid unrelated barrel side effects.
11. Hardened browser smoke with per-run/per-browser profiles, browser fallback, DOM artifact capture for failed route checks, and CI-style headless sandbox flags.

Validation:

- `npx jest src\Utlilities\localDiagnostics.test.ts src\Utlilities\codexStorage.test.ts src\Utlilities\storageAdapter.test.ts --runInBand`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run check:browser`
- `npm run check:release`

Re-evaluation:

- Slice 12 is complete for the current release-readiness plan.
- A rendering failure now lands on a recovery screen instead of a blank route.
- Storage fallback remains safe, and invalid or unreadable saved data is now explained on the Data route.
- Diagnostics exclude user-authored world content by default and are copyable when downloads are unavailable.
- Remaining future refinement: a full browser-level forced-render-error smoke can be added if the browser smoke harness grows beyond route text checks.
- The next most impactful uncompleted slice is Slice 13: Documentation, Help, And Support.

### Implementation Pass: Slice 13 Completed

Evaluation performed:

- Identified the first-use questions a new user needs answered: where to start, how project/universe workspaces differ from in-fiction worlds/planets, how backups work, what import/reset/snapshots do, what offline installability means, and what is intentionally out of scope.
- Chose three support surfaces: concise in-app Help for users while working, README for repository entry, and `docs/` for detailed user, support, versioning, deployment, and QA records.
- Confirmed support must be local-only and diagnostics-first because there is no account system, telemetry, backend, or maintainer access to user data.

Findings:

1. Users could not access a complete help explanation from inside the running app.
2. README described the current slice but did not point to a user guide, support guidance, versioning policy, changelog, or manual release checklist.
3. Release notes had no stable file, making future release summaries dependent on commit reconstruction.
4. Manual QA scenarios were split between runtime recovery and deployment notes but lacked one release checklist.
5. Some backup wording could imply stronger durability than a local-only tool should claim.

Fixes applied:

1. Added an in-app Help route covering first use, workflows, local storage, JSON backups, imports, reset, snapshots, offline install limits, diagnostics, support, and release limits.
2. Added Help to primary navigation and browser smoke route/screenshot checks.
3. Added `docs/user-guide.md` for user-facing workflow and local-data documentation.
4. Added `docs/support.md` for diagnostics-first issue reporting without sharing world content by default.
5. Added `docs/versioning.md` for semantic versioning, schema migration expectations, release checklist ownership, and dependency update guidance.
6. Added `CHANGELOG.md` with the current unreleased pre-release entry.
7. Added `docs/qa/manual-release-checklist.md` for browser, responsive, keyboard, workflow, data/recovery, PWA, and documentation checks.
8. Updated `README.md` with Help and documentation links.
9. Reworded backup copy from durable to portable where needed.

Validation:

- `npm run typecheck`

Re-evaluation:

- Slice 13 is complete for the current release-readiness plan.
- A new user can now understand local storage, backup/export, import, reset, snapshots, offline limits, diagnostics, and release limitations from in-app Help or docs.
- Contributors have a stable changelog, versioning policy, support guidance, and manual QA checklist.
- Remaining future refinement: a richer searchable in-app guide can be considered later, but the current release help is sufficient for the local-only published prototype.
- The next most impactful uncompleted slice is Slice 14: Security, Privacy, And Legal Readiness.

### Implementation Pass: Slice 14 Completed

Evaluation performed:

- Confirmed the app has no backend, no telemetry, no account model, and no remote support access.
- Reviewed import behavior and confirmed JSON imports are parsed as data through `JSON.parse`, then validated by the world-document parser and import checks.
- Reviewed Markdown behavior and confirmed Markdown-style notes and exports render as React text or readonly textarea content, not executable HTML.
- Reviewed GitHub Pages hosting constraints and confirmed custom HTTP security headers cannot be enforced from the repository on project pages.
- Ran dependency audit for runtime dependencies.

Findings:

1. The project needed a dedicated privacy note that users can read outside the running app.
2. Security and privacy constraints were spread across README, Help, deployment docs, and support docs instead of one auditable record.
3. Static-host security header guidance needed to distinguish GitHub Pages limitations from alternate hosts that support headers.
4. Markdown safety claims needed focused test coverage.
5. ESLint did not ignore generated `.tmp` browser-smoke profiles, so lint could race with browser automation artifacts.

Fixes applied:

1. Added `PRIVACY.md` describing local browser storage, diagnostics, backups, and what the app does not collect.
2. Added `docs/security-privacy.md` covering local data, import safety, Markdown safety, diagnostics scope, static-host header guidance, and dependency review.
3. Updated static hosting docs to state that GitHub Pages cannot enforce custom security headers and to point alternate-host deployments to the recommended header starting point.
4. Updated the manual release checklist with security and privacy checks.
5. Added an in-app Help privacy section that states there is no telemetry or remote account.
6. Updated README documentation links for privacy and security guidance.
7. Added a focused Markdown export test proving hostile-looking HTML remains literal text in the Markdown output.
8. Added `.tmp` to ESLint global ignores so generated browser-smoke artifacts do not break lint.

Validation:

- `npm audit --omit=dev` found 0 vulnerabilities.
- `npx jest src\Utlilities\codexDataPortability.test.ts --runInBand`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run check:browser`

Re-evaluation:

- Slice 14 is complete for the current release-readiness plan.
- Public docs and in-app Help now make accurate privacy, local storage, no telemetry, and no account claims.
- Import and Markdown behavior are documented and have focused coverage for the current text-only implementation.
- Security-header guidance no longer overclaims what GitHub Pages can enforce.
- The next most impactful uncompleted slice is Slice 15: Versioning, Maintenance, And Release Operations.

### Implementation Pass: Slice 15 Completed

Evaluation performed:

- Checked whether app version metadata was surfaced in runtime diagnostics and Help.
- Confirmed `APP_VERSION` was still hand-maintained and needed an automated consistency check against `package.json`.
- Reviewed release documentation for version bump, changelog, schema migration, dependency updates, issue reporting, QA evidence, and deployment smoke ownership.
- Confirmed user support should remain diagnostics-first and should not ask for world content by default.

Findings:

1. In-app metadata and `package.json` could drift without a release check.
2. Release operations were partially documented across README, changelog, versioning, deployment, and QA docs but needed a single maintenance playbook.
3. Schema migration expectations were documented generally, but the current schema and legacy storage shape needed a dedicated record.
4. GitHub issue templates were missing, so bug reports, data recovery reports, and feature requests had no privacy-preserving intake structure.
5. A Node-based metadata consistency check should live in `scripts/`, not as a `src` Jest test, because app typechecking intentionally avoids Node globals.

Fixes applied:

1. Added `scripts/checkAppMetadata.cjs` to verify app name and app version metadata against `package.json`.
2. Added `npm run check:metadata` and included it in `npm run check`.
3. Added `docs/release/versioning-and-maintenance.md` as the release operations playbook.
4. Added `docs/release/schema-migrations.md` documenting schema `2`, current and legacy storage keys, migration coverage, and future schema-change expectations.
5. Added GitHub issue templates for bug reports, data recovery issues, and feature requests with diagnostics-first privacy guidance.
6. Updated README and versioning docs to link release operations and schema migration records.

Validation:

- `npm run check:metadata`
- `npm run typecheck`

Re-evaluation:

- Slice 15 is complete for the current release-readiness plan.
- Public releases now have a version metadata check, changelog, release playbook, schema migration record, dependency guidance, QA checklist, deployment smoke expectations, and privacy-preserving issue templates.
- Remaining future refinement: when the first real public version is cut, update `package.json`, `package-lock.json`, `APP_VERSION`, and `CHANGELOG.md` together and rerun the full release gate.
- No further slices remain in the current publish readiness plan.

## Next Action

All publish-readiness slices in this plan are now complete. Continue with final review, manual QA, or release preparation when requested.
