# Create/Update Labels and Document Undo/Redo Implementation Plan

## Purpose

Update Valgaron's action language so that a button says **Save** only when it
actually writes durable data. Actions that commit a local form draft into the
in-memory `WorldDocument` will instead say **Create _X_** or **Update _X_**
according to whether the record already exists.

Add fully functional **Undo** and **Redo** controls immediately before the web
header's real Save control. Undo and Redo will move through committed
`WorldDocument` changes without writing to `localStorage`; the existing Save
control will remain the explicit durable-persistence boundary.

This plan is based on the runtime code as of 2026-07-17.

In this document, **durable** is shorthand for "written to the platform's
existing local persistence adapter" (`localStorage` on web and `AsyncStorage`
on mobile). It does not imply backup, synchronization, account recovery,
cross-device availability, or protection from browser/app data deletion.

## Outcomes

When this work is complete:

1. No editor submit button will imply durable persistence when it only updates
   React state.
2. Submit actions covered by this change will use `Create <record type>` for a
   new record and `Update <record type>` for an existing record. Existing
   commands whose precise verbs are Add, Apply, Move, Archive, Restore, or
   Delete will keep those verbs.
3. The web header will render `Undo`, `Redo`, and then the existing Save status
   button as one accessible control group.
4. One user action that changes creative `WorldDocument` content or selection
   will create one history entry, even when it updates an entry and several
   relationships together. Save metadata and separate stores remain excluded.
5. Undo and Redo will correctly update dirty/save status relative to the last
   successful `localStorage` write.
6. A successful Save will not erase history. Undoing away from the saved
   revision will make the document dirty; redoing back to it will make the
   document clean again.
7. History will be session-local, bounded, and discarded on reload. Durable
   data behavior and the `WorldDocument` storage schema will not change.
8. Image bytes needed by an undo or redo revision will not be garbage-collected
   while that revision remains reachable.
9. Header Save and history navigation will behave predictably when the current
   page contains an unsubmitted form draft.
10. React Strict Mode or two changes dispatched in the same task will not
    generate duplicate IDs/timestamps, lose a revision, or apply an operation
    against stale document state.

## Current-State Audit

### The one durable web Save action

`src/App.tsx` renders the header Save/status button. It calls
`saveCurrentDocument` from `src/Utlilities/useWorldDocumentState.ts`, which
stamps `savedAt` and calls `saveWorldDocument` to write the current document to
browser `localStorage`. This action must keep Save terminology:

- `Save`
- `Retry Save`
- `Saved`
- `Save Failed`, `Save Paused`, `Needs Save`, and `Save Status` status copy

The Data page, recovery messages, README, deployment checks, privacy copy, and
user guide may also continue to call this operation Save because it is the real
durable boundary.

### Editor buttons that currently do not durably save on web

| Surface                             | Current label                     | Required label                    |
| ----------------------------------- | --------------------------------- | --------------------------------- |
| Existing project/universe workspace | `Save Workspace`                  | `Update Workspace`                |
| New project/universe workspace      | `Create Workspace`                | Keep `Create Workspace`           |
| Existing in-fiction world           | `Save World`                      | `Update World`                    |
| New in-fiction world                | `Create World`                    | Keep `Create World`               |
| Existing codex entry                | `Save Changes`                    | `Update <section singular title>` |
| New codex entry                     | `Create <section singular title>` | Keep current create label         |
| Existing timeline event             | `Save Changes`                    | `Update Timeline Event`           |
| New timeline event                  | `Create Timeline Event`           | Keep current create label         |
| Existing relationship               | `Save Relationship`               | `Update Relationship`             |
| New relationship                    | `Save Relationship`               | `Create Relationship`             |
| Existing custom-field configuration | `Save Field Settings`             | `Update Field Settings`           |
| Existing custom-field label         | `Save Label`                      | `Update Label`                    |
| Existing vocabulary value           | `Save Value`                      | `Update Value`                    |
| New custom entry type               | `Create Entry Type`               | Keep current create label         |

The same substitutions must be made in visible labels, accessibility labels,
render models, tests, and nearby help text that currently says a draft is
"saved" by one of these non-durable actions.

### Secondary terminology that would otherwise remain misleading

The button rename alone would leave nearby browser copy using "saved" to mean
"present in the in-memory document." Update that copy in the same slice so the
interface teaches one consistent persistence boundary:

| Current browser/shared copy             | Replacement direction                     |
| --------------------------------------- | ----------------------------------------- |
| `Saved Relationships` / `Saved links`   | `Current Relationships` / `Current Links` |
| `saved relationship links`              | `current relationship links`              |
| `Links to create on save`               | `Links to create with this entry`         |
| `save list`                             | `pending link list`                       |
| `will be saved together`                | `will be created or updated together`     |
| `Save or discard the current ... draft` | `Apply or discard the current ... draft`  |
| `Save this entry before ...`            | `Create or update this entry before ...`  |
| `Saved as <type> relationship`          | `Linked as <type> relationship`           |
| Form-level `Unsaved ... draft`          | `Unapplied ... draft changes`             |

This secondary pass applies to runtime copy in `codexRelationships.ts`,
`codexTimeline.ts`, `entryDraftTransactions.ts`, `relationshipFields.ts`,
`knowledgeSchema.ts`, `codexEntries.ts`, `dataFeatureModel.ts`,
`workspaceFeatureModel.ts`, `helpTopics.ts`, `unsavedChanges.ts`, the
`links.saved-list` dashboard card title, `CodexEntryViews.tsx`, and the
corresponding mobile views. Update the shared discard title/message to say that
a draft has not been applied to the current document, then let the header add
the requested Undo/Redo action context through the existing override mechanism.
It does not rename internal collection fields such as `relationshipsToSave`, historical
planning prose, or comments where "saved record" simply distinguishes a
domain record from a form draft.

Continue to use Save/Saved for operations that really write storage: the web
header, recovery snapshot writes, exported backup timestamps, mobile device
save results, and storage load/migration messages. Add a focused allowlist test
or documented search audit so future copy changes do not regress this boundary.

### Shared web/mobile copy caveat

Most labels above come from `packages/core` and are rendered by both the web
and React Native applications. Mobile's `commitDocument` currently attempts an
`AsyncStorage` write after every controller mutation, whereas web requires the
header Save action. A blind search-and-replace would obscure this difference.

`Create` and `Update` are still accurate on mobile, so the recommended shared
copy is platform-neutral action language. Platform-specific status copy should
continue to explain whether the resulting document is only in the browser
session or has been written to device storage.

### Existing unrelated history

Dashboard customization already has its own 20-entry undo/redo reducer in
`packages/core/src/dashboardLayout.ts`. It changes persisted layout preferences,
not world content. Keep dashboard history separate; document Undo/Redo must not
consume or expose layout operations.

Recovery snapshots are also separate. They are durable safety checkpoints for
destructive actions, not a replacement for fine-grained session history.

## Decision Gates Before Implementation

The repository instructions require explicit resolution of product, UX, data,
and implementation gates. The implementation should not begin until the
following recommendations are approved or replaced.

### Gate 1: Platform scope for history

**Option A — Web document history first (recommended).** Add global Undo/Redo
beside the browser header Save button. Apply accurate Create/Update copy to both
web and mobile where shared models are used.

- Web: fulfills the requested placement and manual-save workflow.
- Mobile: gets accurate action labels but retains its current auto-persisting
  controller and no new global history UI.
- Data: no schema or device-storage changes.
- Tests: concentrated transition, hook, web rendering, and browser behavior tests;
  update mobile shared-copy expectations.
- Documentation: describe browser session history and state that it is not yet
  a mobile feature.

**Option B — Web and mobile history together.** Add the same history model to
`MobileCodexContext`, persist the result of each mobile Undo/Redo to
`AsyncStorage`, and choose a mobile placement because mobile has no header Save
button.

- Web: same result as Option A.
- Mobile: stronger parity, but requires new screen placement, asynchronous
  failure behavior, and native interaction tests.
- Data: still no schema change, but Undo/Redo becomes a device write on mobile.
- Tests and documentation: substantially broader.

**Recommendation:** Option A. It matches the web-first prototype direction and
the user's explicit instruction to place the controls next to the Save button.
The architecture should remain portable so mobile can adopt it later. Selecting
Option B also opens a required mobile UX/implementation gate for control
placement and serialized `AsyncStorage` writes; do not infer either answer from
the web design.

### Gate 2: What one history step means

**Option A — Committed document actions (recommended).** Record changes only
when a form is submitted or a command mutates `WorldDocument`. Text typed into
an unsubmitted form remains governed by the browser or input's native editing
history.

- Web: global Undo/Redo has a clear document-wide meaning.
- Mobile: the model can later wrap controller commits.
- Data: history snapshots contain valid `WorldDocument` states rather than
  incomplete drafts.
- Tests: deterministic pure history-transition and transaction tests.
- Documentation: distinguish "draft changes" from "document history."

**Option B — Every field keystroke.** Lift all page-local drafts into one global
history and record text input changes.

- Web/mobile: much larger UX and state-management redesign.
- Data/performance: high-frequency, high-memory history with coalescing rules.
- Tests: composition events, text coalescing, selection, and per-field native
  behavior become part of scope.

**Recommendation:** Option A. An Undo click reverses the last committed codex
operation, while Ctrl/Cmd+Z inside an input remains native text undo.

### Gate 3: Included operations and atomicity

**Option A — Every `WorldDocument` mutation (recommended).** Include create,
update, archive, restore, delete, reorder, schema changes, workspace switches,
imports, resets, recovery restores, and other operations currently routed
through `setUnsavedDocument`. Group all writes caused by one click or submit
into one transaction.

**Option B — Only create/update forms.** Exclude archive, delete, reset, import,
workspace switching, schema cleanup, and similar commands.

Option B makes global history incomplete and leaves users unable to predict
what Undo will reverse. Option A gives a consistent rule: if an operation makes
the header dirty, it appears in document history. Deleting a recovery snapshot
is excluded because it mutates the separate recovery store, not
`WorldDocument`. Dashboard layout changes remain excluded for the same reason.

- Web: Option A gives one predictable global stack and requires atomic batch
  APIs; Option B is smaller but visibly partial.
- Mobile: no history behavior changes under Gate 1 Option A; a later mobile
  adoption should use the same operation inclusion rule.
- Data: neither choice changes the stored schema; Option A temporarily retains
  more session revisions and related image bytes.
- Tests: Option A requires one-step coverage for every exposed mutation family.
- Documentation: list excluded dashboard/recovery-store actions explicitly.

**Recommendation:** Option A. Existing recovery snapshots remain in place as a
second safety layer for destructive actions.

### Gate 4: History capacity and lifetime

**Option A — 20 in-memory steps (recommended).** Reuse the existing dashboard
history precedent. Immutable updates retain structural sharing, image bytes
remain outside the document, and memory remains bounded.

**Option B — 50 in-memory steps.** Gives more reach at greater memory cost for
large worlds.

**Option C — Persist history.** Restores Undo/Redo after reload, but adds a new
storage schema, migrations, quota pressure, privacy/documentation work, and
recovery rules.

**Recommendation:** Option A. Do not persist history. Reload begins with the
durably stored document and empty Undo/Redo stacks.

Consequences of the recommendation: web and any later mobile integration lose
history on process/reload boundaries by design; stored document schemas and
migrations do not change; tests enforce the capacity and reload reset; user and
privacy guidance must not imply history is a backup. Option B changes only the
memory/performance tradeoff. Option C would affect web, mobile, data migrations,
quota handling, privacy copy, recovery behavior, and release tests and is out of
prototype scope.

### Gate 5: Save and redo-stack behavior

**Option A — Save preserves both history stacks (recommended).** Save marks the
current revision as the durable baseline but is not itself undoable. A user can
save after undo and still redo; the redone revision then becomes dirty.

**Option B — Save clears history.** Simpler cleanup semantics, but users lose
the requested forward/backward navigation merely by persisting their work.

**Recommendation:** Option A. Protect assets referenced by any reachable
history revision so preserving Redo cannot produce broken images.

- Web: Save remains a persistence action, not a history edit.
- Mobile: no effect under the recommended web-only scope; if mobile adopts
  history, its automatic write queue must use the same baseline/redo rule.
- Data: stored schema is unchanged, but asset cleanup must consider future
  revisions.
- Tests: cover Save after Undo and Redo across that new baseline.
- Documentation: state that Save does not clear session history.

### Gate 6: Header actions while a page-local draft is dirty

The current dirty-form guards protect navigation and page-local commands, but
`App.tsx` cannot tell whether a nested editor has an unsubmitted draft. Adding
global history without resolving that gap could let Undo replace the record or
workspace underneath a dirty form.

**Option A — Register active dirty drafts and guard history navigation
(recommended).** Add a small app-level draft-state coordinator. Existing pages
register an aggregate dirty boolean, a draft-discard callback, and any staged
uploaded asset IDs that cleanup must retain. They do not move draft field values
into global state.

- Undo/Redo with no dirty draft runs immediately.
- Undo/Redo with a dirty draft uses the existing discard-confirmation language,
  names the requested history action, and proceeds only after confirmation.
- Confirming discards page-local drafts before activating the historical
  revision, including explicitly removing abandoned staged image bytes;
  canceling changes neither drafts nor history.
- Header Save remains available because users may need to persist previously
  applied document changes without losing a new draft. Its accessible help and
  success announcement explicitly state that an active unapplied draft was not
  included. Save-time garbage collection receives registered staged asset IDs
  so it cannot invalidate that retained draft.
- Web tests cover pages with one dirty form and Knowledge/Workspaces pages with
  several possible dirty forms.
- Mobile is unchanged under Gate 1 Option A.
- Data remains page-local plus a registry of dirty flags/staged asset IDs; no
  draft values or new persistent schema are introduced.
- Documentation explains that header Save excludes unapplied drafts and that
  confirmed history navigation discards them.

**Option B — Disable Undo/Redo whenever a draft is dirty.** This avoids data
replacement but can strand users until they discover which of several forms is
dirty, and native disabled buttons cannot explain the resolution as clearly.

**Option C — Preserve and rebase dirty drafts through history.** This avoids a
confirmation, but requires conflict detection for deleted records, changed
schemas, switched workspaces, and imported documents. It is a much larger
draft-merge feature.

**Recommendation:** Option A. Implement the smallest coordinator needed by the
header; continue keeping actual draft data local to each page/editor.

### Gate 7: History-retained image bytes and storage pressure

History revisions do not duplicate IndexedDB bytes, but they can keep otherwise
orphaned uploads reachable. Twenty revisions that repeatedly replace large
images can therefore retain substantially more bytes than the present document.

**Option A — Count-bounded history with existing upload failure handling
(recommended for the prototype).** Keep at most 20 revisions, retain every
asset needed by them, and let the existing image preparation/storage path reject
a new upload if IndexedDB cannot accept it. Evicted revisions release their
asset references at the next safe cleanup point. Never delete a reachable
revision's bytes to make an upload appear successful.

**Option B — Dual revision and byte budget.** Add an explicit history-only asset
budget (which itself requires a chosen size), evict the oldest revisions before
cleanup when the budget is exceeded, and announce the reduced Undo depth.

**Option C — Keep bytes indefinitely for the session.** Simplifies immediate
Redo but permits unbounded orphan retention until reload and is not acceptable.

- Web: Option A keeps predictable action depth until the browser rejects a new
  upload; Option B makes history depth data-dependent.
- Mobile: unchanged under Gate 1 Option A; a later mobile history feature needs
  its own file-storage quota policy.
- Data: no schema change. Option A must expose retained unique-byte totals in
  tests/diagnostics where practical and must not claim browser quota capacity.
- Tests: use unique asset metadata to verify eviction and cleanup; simulate
  repository write failure without relying on a real browser quota.
- Documentation: explain that history retains referenced image bytes and is not
  a backup; storage limits can prevent a new upload.

**Recommendation:** Option A. It avoids silent data/history loss and does not
invent an arbitrary byte promise for a browser-local prototype.

## Detailed Design

### 1. Context-aware action copy

Keep label decisions in shared model helpers instead of scattering ternaries
through web and mobile components.

#### Workspaces and in-fiction worlds

In `packages/core/src/workspaceFeatureModel.ts`:

- Replace `workspaceFeatureActions.saveWorkspace` with `updateWorkspace` and
  the value `Update Workspace`.
- Replace `workspaceFeatureActions.saveWorld` with `updateWorld` and the value
  `Update World`.
- Keep `createWorkspace` and `createWorld`.
- Replace `saveFieldLabel` with `updateFieldLabel` and the value `Update Label`.
- Update `workspaceFeatureModel.test.ts` to assert the new contract.

Consume these names in:

- `src/Pages/WorkspacesPage.tsx`
- `src/Pages/KnowledgePage.tsx`
- `mobile/src/screens/WorkspacesScreen.tsx`
- `mobile/src/screens/MoreScreen.tsx`

#### Codex entries and timeline events

In `packages/core/src/codexEntries.ts`:

- Remove `entryEditorCopy.saveChangesLabel`.
- Add a helper such as `getEntryEditorUpdateTitle(section)` returning
  `Update ${section.singularTitle}`.
- Make `getEntryEditorSubmitLabel` return Create for no selected entry and
  Update for an existing entry.
- Preserve the staged-link count in both branches, for example
  `Update Character And 2 Links`, so the label describes the complete atomic
  transaction.

Update the direct and timeline model tests in:

- `packages/core/src/codexEntries.test.ts`
- `packages/core/src/codexTimeline.test.ts`
- `src/Components/Codex/CodexEntryViews.render.test.ts`
- `src/Pages/TimelinePage.render.test.tsx`
- `src/Pages/WorkbenchPage.render.test.ts`

Revise `stagedRelationshipDraftCopy` and validation guidance in
`entryDraftTransactions.ts`, `relationshipFields.ts`, and `codexTimeline.ts`
where "save this entry" currently means commit a draft. Prefer concrete copy
such as "Create or update this entry first" or "Apply these links with the
entry update." Do not change text that explicitly refers to the durable header
Save action.

#### Relationships

In `packages/core/src/codexRelationships.ts`:

- Replace the static `saveRelationshipLabel` with Create and Update labels or a
  `getRelationshipSubmitLabel(existingRelationship)` helper.
- Provide matching accessibility labels that include context when available,
  such as `Update relationship between <source> and <target>`.

Use the helper in:

- `src/Pages/RelationshipsPage.tsx`
- `mobile/src/screens/RelationshipsScreen.tsx`
- inline relationship editors in
  `src/Components/Codex/CodexEntryViews.tsx`, if they render the same action

Update `packages/core/src/codexRelationships.test.ts`, web relationship render
tests, and mobile relationship render tests for both create and edit states.

#### Knowledge configuration

In `packages/core/src/knowledgeSchema.ts`:

- Rename `saveSettingsLabel` to `updateSettingsLabel` and render
  `Update Field Settings`.
- Rename `saveSettingsAccessibilityLabel` to
  `updateSettingsAccessibilityLabel`.
- Rename `saveFieldLabelAccessibilityLabel` to
  `updateFieldLabelAccessibilityLabel`.
- Rename a vocabulary row's `saveLabel`/`saveAccessibilityLabel` to
  `updateLabel`/`updateAccessibilityLabel`, with `Update Value` copy.
- Keep `Add Value`. It is an accurate specialized create-context command and
  does not imply durable persistence; the request does not require replacing
  precise verbs that never said Save.

Update web and mobile consumers and the following tests:

- `packages/core/src/knowledgeSchema.test.ts`
- `src/Pages/KnowledgePage.render.test.tsx`
- `mobile/src/screens/EntriesScreen.render.test.ts`

#### Internal names

Do not mechanically rename storage functions such as `saveWorldDocument`; they
perform real persistence. Core upsert functions such as
`saveEntryInActiveWorkspace` can remain initially to limit churn, but UI-facing
props and local handlers should use `commit`, `create`, or `update` where that
prevents the durable/in-memory distinction from becoming ambiguous. No runtime
behavior should depend on matching a displayed string.

Rename the mobile entry action test ID from `entries.editor.save` to
`entries.editor.submit` (or a more specific create/update-neutral ID) and update
`mobile/e2e/flows/character-tree.yaml`. Test IDs are not user-facing, but
leaving this one behind would encode the obsolete semantic model in automation.
Test fixtures that use `Save Entry` only as arbitrary button text should use a
neutral label so repository searches remain meaningful.

### 2. Pure world-document history model

Add `packages/core/src/worldDocumentHistory.ts` and export it from
`packages/core/src/index.ts`. Keep the transition functions independent of
React, clocks, random ID generation, storage, and browser globals. This makes
the state rules testable in the Node Jest environment and leaves a future
mobile integration path.

Suggested types:

```ts
type WorldDocumentRevision = {
  id: number;
  actionLabel: string | null;
  document: WorldDocument;
  origin: 'initial' | 'import' | 'reset' | 'recovery-restore';
};

type WorldDocumentHistory = {
  past: readonly WorldDocumentRevision[];
  present: WorldDocumentRevision;
  future: readonly WorldDocumentRevision[];
  nextRevisionId: number;
  persistedRevisionId: number | null;
  lastPersistedAt: string | null;
  documentSavedAt: string;
  initialRevisionId: number;
  initialUnpersistedState: 'unsaved' | 'paused' | null;
  limit: number;
};
```

The pure transition helpers must support:

- `commit`: push the old present into `past`, install one new present, trim the
  oldest past entries to the configured limit, and clear `future`.
- `undo`: move present to the front of `future` and activate the newest past
  revision.
- `redo`: move present to `past` and activate the nearest future revision.
- `mark-persisted`: mark the present revision ID and durable timestamp after a
  successful write without creating a history entry or clearing either stack.
- `replace-after-load`: initialize a clean or unsaved baseline from the current
  load result with empty stacks.

Rules:

1. A failed mutation validation does not create a revision.
2. A semantic no-op does not create a revision or recovery snapshot. Detect it
   before generating mutation timestamps. Make domain commands compare their
   normalized editable inputs and return an explicit `didChange` result or the
   original document reference. Do not use `JSON.stringify` or deep cloning on
   every mutation; that would add avoidable large-world latency.
   Cover unchanged form resubmission, switching to the already active
   workspace, setting an already-current archive state, moving at a boundary,
   and commands whose target is missing or protected from deletion.
3. `savedAt` is persistence metadata, not undoable creative content. Whenever a
   revision becomes present, normalize its document's `savedAt` to
   `documentSavedAt`. Initially this is the loaded document timestamp even when
   a seed or legacy document has not reached the current storage key. A
   successful Save updates `documentSavedAt` and `lastPersistedAt` in the
   present revision without creating a new revision. A failed Save updates
   neither.
4. `hasUnsavedDocumentChanges` is derived from
   `present.id !== persistedRevisionId`. A seed or migrated legacy-schema state
   that has not been written to the current schema key uses
   `persistedRevisionId: null`.
5. Undo/Redo availability is derived from stack lengths, never from save state.
6. The action label describes the user gesture that produced the newer
   revision. Undo announces that label; Redo re-applies it.
7. The approved limit means at most that many reversible actions are reachable
   across `past` and `future`; moving backward or forward must not duplicate
   revisions or grow the retained set. A branch after Undo drops all future
   revisions before applying capacity trimming.
8. The initial revision has no action label. `initialRevisionId` and
   `initialUnpersistedState` preserve the difference between an ordinary empty
   seed (`unsaved`), a corrupt-storage fallback (`paused`), and a current stored
   document (`null`, because it has a persisted revision). Apply the initial
   `paused`/`unsaved` state only while `persistedRevisionId` is still null. Once
   any current-schema Save succeeds, an older initial revision is `dirty`
   relative to that new baseline rather than paused.
9. Ordinary create/update/archive/delete/schema operations inherit the present
   revision's origin. Import, reset, and recovery restore assign a new origin.
   Undo/Redo therefore restores the origin with the document instead of leaving
   Data-page provenance copy out of sync.

Add `packages/core/src/worldDocumentHistory.test.ts` covering initialization,
bounded history, no-op commits, branching after Undo, redo invalidation, Save
without stack clearing, current-schema and legacy-schema loads, paused-baseline
restoration, saved-baseline traversal, and `savedAt` normalization.

### 3. One mutation gateway and atomic user actions

Refactor `src/Utlilities/useWorldDocumentState.ts` so every document mutation
uses one history-aware gateway, for example:

```ts
commitDocumentChange(actionDescriptor, prepareOperation);
```

Replace the separate `document` state and loose `markUnsaved` sequencing with a
history controller backed by the pure core transitions. Continue to keep load
status, save-attempt status, recovery snapshot status, and recovery snapshot
records in their appropriate separate state.

#### React purity and stale-state requirements

Do not dispatch an impure updater function for a React reducer to execute.
Current domain helpers generate dates and IDs, and React Strict Mode may invoke
reducers or functional state updaters more than once. The integration must:

1. Read the latest history state from one synchronized source, not a render
   closure that can lag another commit in the same task.
2. Generate the operation timestamp and any IDs exactly once at the event
   boundary, or inject precomputed deterministic values into domain helpers.
3. Prepare and validate the entire next document exactly once.
4. Pass the precomputed immutable document and action descriptor to a pure
   history transition.
5. Update the synchronized history reference before exposing another command,
   then schedule React state from that exact next history value.

A small `useRef` plus pure state transitions is acceptable when it is kept in
lockstep with rendered state and tested with two synchronous commits. An
equally valid command/reducer design must carry deterministic timestamps and
IDs in the action. Do not invoke `Date.now`, `new Date`, `Math.random`, local ID
generators, storage, or cleanup from the pure history transition.

The hook's public model should expose:

- `canUndo`
- `canRedo`
- `undoLabel` and `redoLabel`, or the action descriptions needed to build them
- `undoDocumentChange()`
- `redoDocumentChange()`
- an announcement/status string for the latest history navigation
- the existing `document`, derived active-world data, Save state, and mutation
  methods

Every mutation currently calling `setUnsavedDocument` must supply a concise,
stable action label. Examples:

- `Create Character “Mara”`
- `Update Timeline Event “The Sundering”`
- `Create Relationship`
- `Archive Place “Glass Harbor”`
- `Delete Faction “Ash Council”`
- `Update Character category settings`
- `Switch to workspace “Northern Realms”`
- `Import JSON backup`
- `Reset to starter data`

Do not include unsanitized long notes in labels. Use names where present and a
generic record type when names are empty.

Centralize action-description formatting: trim and collapse subject whitespace,
cap the announced subject to a documented length (for example 80 Unicode code
points plus an ellipsis), preserve the full document value itself, and fall
back to the record type for an empty name. Test quotes, line breaks, emoji, and
very long names so history announcements cannot become noisy or malformed.

#### Atomicity requirement

Several current flows call mutation props repeatedly for one interaction. They
must be converted to a batch/transaction callback before history is enabled;
otherwise one form submit would require multiple Undo clicks.

Audit and refactor at least these paths:

- Entry submit plus staged relationships in `SectionPage.tsx` and
  `WorkbenchPage.tsx`.
- Timeline entry relationship-field migrations in `SectionPage.tsx`.
- Timeline bulk event updates passed through `onSaveEvents`.
- Relationship text migrations in `RelationshipsPage.tsx`.
- Entry-detail relationship migrations in `CodexEntryViews.tsx`.
- Any duplicate/archive/delete command that modifies both codex entries,
  relationships, and asset metadata.

Use narrow typed batch methods rather than allowing pages to call the state
setter directly. A suitable hook contract can include:

- commit one entry plus its assets and zero or more relationships;
- commit multiple entries as one named operation;
- commit a relationship migration containing entry and relationship updates;
- commit a generic pre-defined core domain operation only where a narrow method
  would duplicate substantial code.

The same atomic update must preserve current validation behavior: validate the
whole operation first, then commit once. A partially valid operation must not
create a partial revision.

Use this order for each command:

1. resolve the latest present revision;
2. normalize and validate all inputs;
3. prepare the complete next document with one operation timestamp;
4. detect a no-op and return without history, recovery, or cleanup side
   effects;
5. for a destructive operation, write its recovery snapshot from the exact
   current document;
6. commit one history revision; and
7. schedule non-destructive post-commit work such as safe asset cleanup.

If a ZIP import installs IndexedDB bytes before its document transaction,
retain those bytes for the new present/future revision and compensate or clean
them up if document preparation cannot commit. Import, entry-image, and
recovery-snapshot side effects must never leave a half-applied document
revision.

#### Mutation coverage matrix

Use this as the implementation audit for every current
`setUnsavedDocument` path and the batched page flows that feed it:

| Mutation family            | Commands included in document history                                                          | Transaction/recovery rule                                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Entries                    | create/update, duplicate, archive/restore, permanent delete, timeline reorder/era batch        | Entry plus staged links/assets is one revision; permanent delete keeps its recovery snapshot                                        |
| Relationships              | create/update, unlink, confirmed delete, text/field migration, duplicate cleanup               | Every user command is one revision even when it touches several relationships/entries; confirmed delete keeps its recovery snapshot |
| Whole document             | reset, JSON/ZIP import, recovery-snapshot restore                                              | Replace as one revision with origin metadata; create the pre-change snapshot; retain/compensate ZIP bytes                           |
| Workspaces                 | create, metadata update, active-workspace switch, archive/restore, duplicate, permanent delete | One revision each; protected/no-op operations create none; permanent delete keeps its snapshot                                      |
| In-fiction worlds          | create/update, archive/restore, permanent delete                                               | One revision each; permanent delete keeps its snapshot                                                                              |
| Entry-type schema          | create type, add/move/rename/remove field, delete type                                         | One revision per command; destructive cleanup/delete paths retain existing snapshots where currently required                       |
| Vocabularies and overrides | add/update/archive/restore/move value, update/reset field override                             | One revision per command; unchanged normalized values create none                                                                   |
| Hidden-detail cleanup      | clear one value, clear all values                                                              | One revision per command plus the existing schema-cleanup snapshot                                                                  |
| Separate stores            | delete recovery snapshot; dashboard layout preference changes                                  | Excluded from document history; keep their existing dedicated behavior/history                                                      |

Add a table-driven test or explicit test checklist that invokes every public
`WorldDocumentState` mutation and asserts: expected revision delta, expected
action description, expected recovery-snapshot delta, and no-op behavior.

### 4. Save-status integration

Keep `getLocalSaveButtonModel` and true Save copy in
`packages/core/src/saveStatus.ts`.

Change state transitions as follows:

| Event                                                                             | Present document             | Persisted baseline            | Save status                                     |
| --------------------------------------------------------------------------------- | ---------------------------- | ----------------------------- | ----------------------------------------------- |
| Load valid current-schema storage                                                 | Loaded revision              | Same revision                 | `saved`                                         |
| Load and migrate legacy schema 3                                                  | Migrated revision            | None for current schema 4 key | `unsaved`                                       |
| Load seed with no stored document                                                 | Seed revision                | None                          | `unsaved`                                       |
| Load fallback after corrupt/unreadable storage                                    | Protected seed revision      | None                          | `paused`                                        |
| Commit document change                                                            | New revision                 | Unchanged                     | `dirty`                                         |
| Undo/Redo to persisted revision                                                   | Historical revision          | Same revision ID              | `saved`                                         |
| Undo back to protected initial fallback before any successful current-schema Save | Initial revision             | None                          | `paused`                                        |
| Undo back to ordinary seed/legacy initial revision before any successful Save     | Initial revision             | None                          | `unsaved`                                       |
| Undo to any older initial revision after a successful Save                        | Initial revision             | Different persisted revision  | `dirty`                                         |
| Undo/Redo to any other unpersisted revision                                       | Historical revision          | Unchanged                     | `dirty`                                         |
| Successful Save                                                                   | Same revision, new `savedAt` | Present revision              | `saved`                                         |
| Failed Save                                                                       | Same revision                | Unchanged                     | `failed` for that current view                  |
| Commit or history navigation after failed Save                                    | New/selected revision        | Unchanged                     | Re-derived from baseline; stale failure cleared |

`useBeforeUnloadWarning` must continue to use the derived
`hasUnsavedDocumentChanges`. Undoing exactly back to the successful Save
baseline must remove the warning; redoing away from it must restore the
warning.

Save itself is not a creative change and is not Undoable. Undo/Redo never call
`saveWorldDocument` on web. Users must explicitly Save the historical revision
if they want it to become durable.

Separate timestamps that the current `WorldDocumentSaveStatus.savedAt` field
conflates:

- `lastPersistedAt`: the timestamp of the last successful current-schema
  `localStorage` write and the value exposed as `document.savedAt`;
- `lastSaveAttemptAt`: the timestamp of the most recent attempt, successful or
  failed; and
- `initialDocumentTimestamp`: available for an unsaved migrated/seed document
  when no successful current-schema write exists.

Update `getLocalSaveStatusModel` as needed so dirty status never calls a failed
attempt the "last save." Failed status should report both the failed attempt
time and the last successful save when one exists. A failed attempt must not
stamp `document.savedAt`, move `persistedRevisionId`, or run destructive asset
cleanup.

#### Load provenance and diagnostics

The current hook mutates `loadStatus` during import, reset, and recovery restore.
Treating it as unrelated state would make it stale after Undo/Redo. Split the
concerns without losing recovery diagnostics:

- Keep startup storage issues, checked time, and original source diagnostics in
  an immutable session record for diagnostics/export.
- Separately derive whether a startup issue is still an active warning. Edits,
  import, and history navigation do not resolve a corrupt current storage key;
  the first successful current-schema Save does. After resolution, keep the
  startup issue as historical diagnostic evidence without continuing to label
  the current document Save Paused.
- Store the current document origin on each revision (`initial`, `import`,
  `reset`, or `recovery-restore`); ordinary edits inherit it.
- Derive the Data page's current-origin message from the present revision plus
  startup diagnostics.
- Undo/Redo restores the previous origin with the document. For example,
  undoing Reset must not leave "Starter data was loaded by reset" as the current
  document message.
- Saving changes persistence state and can resolve the active storage warning;
  it does not rewrite the immutable record of what happened at startup.

Update `RuntimeErrorFallback`, Data-page models, and their tests only as needed
for the refined status shape. Test Import → Undo → Redo, Reset → Undo, recovery
restore → Undo, an unresolved corrupt-storage warning through history, and the
warning becoming historical after a successful Save.

### 5. Recovery snapshots and destructive actions

Keep the current snapshot-before-destructive-action behavior for delete, reset,
import, recovery restore, and schema cleanup. Then commit the destructive
change as one normal history revision.

- Undoing the destructive change does not delete the recovery snapshot.
- Redoing it does not create another recovery snapshot.
- Deleting a recovery snapshot is not in document history.
- Restoring a recovery snapshot is one undoable document replacement.
- Reloading still discards session history but retains recovery snapshots under
  their existing policy.

Refactor snapshot capture to read the history controller's current present
revision rather than a potentially stale closure. Test rapid sequential
operations so each snapshot contains the actual pre-change document.

### 6. Image asset retention

World history stores image metadata and references, while uploaded bytes live
in IndexedDB. The current `cleanupBrowserImageAssets(savedDocument)` only
protects the current document and recovery snapshots. With Redo preserved, a
Save after Undo could otherwise delete image bytes needed by a future revision.

Update `src/Utlilities/imageAssetGarbageCollection.ts` and the core retained-ID
helper so cleanup can retain asset IDs referenced by:

1. the present document;
2. all reachable past and future document revisions; and
3. existing recovery snapshots; and
4. staged uploaded asset IDs registered by mounted unapplied drafts.

Run cleanup after successful durable Save, initial load, snapshot deletion, and
after explicit draft discard. Do not run eager eviction cleanup unless the
current staged-ID registry is included; otherwise wait for the next successful
Save or established safe cleanup point. Never delete bytes merely because an
Undo made them temporarily unreachable from the present revision.

Thread the same retention input through every cleanup caller, including
`deleteSnapshot`; protecting staged IDs only in `saveCurrentDocument` would
leave another route to the same data-loss bug.

Add tests for:

- create entry with image, Undo, Redo;
- Undo image creation, Save the older revision, then Redo;
- delete image, Undo, Save, and verify the restored image remains resolvable;
- eviction of the last history/recovery reference followed by cleanup.
- upload an image into an unapplied draft, use header Save, and verify the draft
  preview/bytes remain available;
- confirm history navigation with that draft and verify its discard callback
  removes the abandoned staged bytes.

### 7. Header controls and responsive layout

In `src/App.tsx`, render a named group immediately before the existing Save
button:

```text
[Undo] [Redo] [Save / Saved / Retry Save] [Data Menu]
```

Implementation details:

- Wrap Undo, Redo, and Save in a `role="group"` with an accessible label such
  as `Document history and save controls`.
- Keep visible `Undo` and `Redo` text at all breakpoints.
- Disable Undo when `past` is empty and Redo when `future` is empty.
- Use contextual accessibility labels when available, such as
  `Undo update Character “Mara”` and `Redo update Character “Mara”`.
- Use one dedicated visually hidden `role="status"`/`aria-live="polite"` region
  that reports `Undid …` or `Redid …` and the current persistence state. Remove
  `aria-live` from the Save button so label changes and the dedicated status do
  not produce duplicate announcements. Do not point `aria-describedby` at
  transient live text.
- Preserve visible focus styles, current button minimum heights, and logical
  tab order: Undo, Redo, Save, Data Menu.
- Do not disable Undo merely because Save failed or is paused.
- Keep focus on the activated button after the state transition.
- If a dirty draft exists, apply the approved Gate 6 behavior before changing
  history. A canceled confirmation must leave focus, history, and announcement
  text unchanged.
- Keep the control group outside the existing route `ErrorBoundary`. Pass the
  present revision ID through `resetKeys` so a successful Undo/Redo clears a
  latched route-render error and retries against the selected revision. Do not
  reset the boundary for a canceled history action.

In `src/App.css`:

- Add a compact `.vwb-document-controls` flex group with a small internal gap.
- Update the header grid so the group occupies the current Save column rather
  than adding two independent grid columns.
- At desktop width, use the current brand/navigation/control/menu grid. At 900
  and 768 pixels, keep the document group in the existing action area and put
  navigation on its own row. At 520 pixels and below, put brand plus Data Menu
  on the first row, the complete Undo/Redo/Save group on a full-width second
  row, and mobile navigation on its own row. Allow the controls to share or
  wrap within that full-width row at 320 pixels without changing their logical
  order. This prevents three new controls from competing with the brand and
  Data Menu in the current phone header row.
- Preserve 44-pixel mobile-web touch targets at the existing small-screen
  breakpoint.
- Test long Save states such as `Retry Save` and browser zoom at 200%.

Do not add document-wide keyboard shortcuts in the first slice unless the
decision gate explicitly requests them. Browser-native Ctrl/Cmd+Z must keep
working inside inputs, textareas, selects, and content-editable regions, and the
existing dashboard Undo/Redo must remain independent. A later shortcut slice
must define conflict rules before intercepting global key events.

### 8. Draft reconciliation

Document history does not include unsubmitted page-local form drafts. Under the
recommended Gate 6 choice, add a minimal draft-state coordinator above the
routes:

- Each mounted route/editor that already computes a dirty boolean registers
  `{ id, isDirty, discard, retainedAssetIds }`; draft field values remain
  local. Non-image forms use an empty retained-ID list.
- Multiple registrations are supported because Knowledge, Workspaces, and
  nested codex editors can have more than one dirty source.
- Registration cleanup on unmount prevents stale dirty flags.
- The coordinator exposes `hasUnappliedDraftChanges`, the union of staged asset
  IDs, and one `discardAll` operation to the header/history owner.
- Confirmed Undo/Redo invokes registered discard callbacks (including staged
  byte removal), advances a narrow active-route reset epoch if needed, then
  activates the target revision as one user operation.
- Canceled Undo/Redo changes nothing.
- Header Save does not reset or include a local draft. Its announcement says
  `Saved applied document changes; unapplied form changes were not included`
  when appropriate, and its successful asset cleanup protects all registered
  staged IDs.

Wire the existing aggregate dirty values from Workbench/section entry editors,
Timeline, Relationships, Knowledge, Workspaces, and the Data import draft.
Reuse those same values for `useUnsavedChangesWarning` so navigation guards and
header guards cannot disagree about whether an unapplied draft exists.

Use the existing discard-confirmation helper and shared copy rather than a
second browser-dialog implementation. Ensure the coordinator is compatible
with server/static rendering tests and does not update parent state during a
child render.

After any history transition, verify these clean-state cases:

- Undo removes the selected entry: the editor resolves the now-missing route or
  selection without throwing.
- Redo restores a record: selection is restored only if current navigation
  state still identifies it.
- Undo switches the active workspace: page-local selections initialize from
  the newly active workspace.
- Import/reset/recovery restore invalidates route IDs safely.
- Native text undo inside a field does not trigger document Undo.

Pass a read-only `documentRevisionId` only to components that need to detect a
clean external transition; do not use it as a React `key` for the whole app,
because that would unnecessarily reset navigation, dashboard state, menus, and
focus after every commit.

## File-by-File Implementation Map

### Shared core

- `packages/core/src/worldDocumentHistory.ts` — new history types, pure
  transitions, status selectors, and capacity rules.
- `packages/core/src/worldDocumentHistory.test.ts` — exhaustive transition and
  capacity tests.
- `packages/core/src/index.ts` — export the history model.
- `packages/core/src/codexEntries.ts` and tests — dynamic Create/Update entry
  labels and staged-link wording.
- `packages/core/src/codexRelationships.ts` and tests — dynamic
  Create/Update relationship labels.
- `packages/core/src/codexTimeline.ts` and tests — updated timeline submit and
  prerequisite copy.
- `packages/core/src/entryDraftTransactions.ts` and tests — commit wording.
- `packages/core/src/relationshipFields.ts` and tests — replace misleading
  editor Save wording while preserving true persistence wording.
- `packages/core/src/workspaceFeatureModel.ts` and tests — Update Workspace,
  Update World, and Update Label actions.
- `packages/core/src/knowledgeSchema.ts` and tests — Update Field Settings,
  Update Label, and Update Value labels/accessibility names.
- `packages/core/src/dashboardLayout.ts` and tests — rename only the
  relationship card title from `Saved links` to `Current links`; do not alter
  dashboard layout history behavior.
- `packages/core/src/helpTopics.ts` and tests — replace non-durable "saved
  relationship" wording while keeping real web/mobile persistence guidance.
- `packages/core/src/dataFeatureModel.ts` and tests — change only form/import
  draft status to Unapplied while preserving Manual Save, recovery snapshot,
  and device persistence copy.
- `packages/core/src/saveStatus.ts` and tests — model successful-persistence and
  failed-attempt timestamps without conflating them.
- `packages/core/src/unsavedChanges.ts` and tests — use Unapplied Draft copy and
  support the history action's contextual discard-confirmation title/message.
- `packages/core/src/imageAssets.ts` and tests — accept all reachable history
  documents when calculating retained asset IDs.

### Web application

- `src/Utlilities/useWorldDocumentState.ts` — history controller integration,
  atomic commit gateway, persisted-baseline logic, and public Undo/Redo model.
- `src/Utlilities/useWorldDocumentState.test.ts` — save-state transition helper
  coverage for current, legacy, seed, corrupt fallback, failed attempt, and
  baseline traversal; keep browser-dependent behavior in smoke tests rather
  than adding a new DOM test dependency.
- `src/Utlilities/documentDraftState.tsx` and tests — minimal aggregate dirty
  registration and confirmed reset epoch under recommended Gate 6.
- `src/Utlilities/imageAssetGarbageCollection.ts` and a new focused test —
  history-aware retention and eviction cleanup.
- `src/App.tsx` — Undo/Redo/Save group and route prop updates for atomic batch
  methods, plus the present revision ID as the route ErrorBoundary reset key.
- `src/App.css` — responsive control-group layout.
- `src/Components/Common/DocumentPersistenceControls.tsx` and a static render
  test — isolated control order, disabled states, accessible group/name, and
  single live region. Keep `App.tsx` focused on wiring.
- `src/Components/Common/ErrorBoundary/ErrorBoundary.test.tsx` — verify a
  revision reset-key change clears a latched route error while an unchanged key
  does not.
- `src/Pages/WorkspacesPage.tsx` — Create/Update labels.
- `src/Pages/RelationshipsPage.tsx` — Create/Update relationship label and
  atomic migrations.
- `src/Pages/SectionPage.tsx` — atomic entry, timeline, and relationship
  transactions.
- `src/Pages/WorkbenchPage.tsx` — atomic entry plus staged-link transaction.
- `src/Pages/KnowledgePage.tsx` — Update configuration labels.
- `src/Pages/DataPage.tsx` and `src/Components/Common/RuntimeErrorFallback.tsx`
  — consume the refined persistence-attempt and revision-origin status without
  hiding startup recovery diagnostics.
- `src/Components/Codex/CodexEntryViews.tsx` — Update entry labels and atomic
  relationship migrations.
- Relevant web render tests — assert both new and existing form contexts, button
  order, disabled states, accessibility labels, and no residual misleading Save
  buttons.
- `src/Utlilities/largeWorldPerformance.test.ts` — add a broad budget for 20
  history commits plus full Undo/Redo traversal and prove the implementation
  does not serialize the complete document per command.
- `scripts/browserSmoke.cjs` — end-to-end durable-baseline, Undo, Redo, reload,
  and responsive-header smoke coverage.

### Mobile application under recommended Gate 1

- `mobile/src/screens/WorkspacesScreen.tsx` — consume shared Update actions.
- `mobile/src/screens/RelationshipsScreen.tsx` — dynamic Create/Update action.
- `mobile/src/screens/MoreScreen.tsx` — Update configuration actions.
- `mobile/src/screens/EntriesScreen.tsx` — consume dynamic entry Create/Update
  labels where applicable.
- Mobile render tests — update shared-copy expectations and verify mobile save
  status still reports the outcome of the automatic device write.
- `mobile/e2e/flows/character-tree.yaml` — update the neutral entry-submit test
  ID and retain the existing flow assertion.
- `mobile/src/state/MobileCodexContext.tsx` — no history change under Gate 1;
  only update handler names/messages where necessary to keep action and
  persistence semantics distinct.

### Documentation

- `README.md` — add browser session history and clarify that only header Save
  writes current browser data.
- `docs/user-guide.md` — document Create/Update versus Save, history capacity,
  reload behavior, draft exclusions, and recovery-snapshot distinction.
- `docs/deployment/static-hosting.md` — extend manual verification to include
  Update, Undo, Redo, Save, and reload.
- `docs/qa/manual-release-checklist.md` — add desktop, phone-width, keyboard,
  focus, history-baseline, and failed-storage checks.
- `docs/qa/web-mobile-parity-checklist.md` — record the approved Gate 1 platform
  scope and shared action-copy behavior.
- Do not rewrite historical planning logs solely to replace old labels. Update
  only current guidance or add a dated note when a historical document could
  otherwise be mistaken for current runtime behavior.

## Implementation Sequence

### Phase 1: Lock decisions and action-language contract

1. Resolve the seven gates above.
2. Add a shared action-label matrix test covering create and update context for
   workspace, in-fiction world, each entry section, timeline event,
   relationship, field settings, label, and vocabulary value.
3. Update shared core models and all web/mobile consumers.
4. Update secondary Current/Applied/Linked and Unapplied Draft terminology.
5. Run focused core and render tests. Confirm the header, recovery snapshot,
   export timestamp, storage migration, and mobile device-result Save copy is
   unchanged.

Exit criterion: a repository search finds no user-facing `Save <X>` action
unless the corresponding click performs a durable write. False positives in
historical docs and internal function names are documented rather than blindly
renamed.

### Phase 2: Build and test the pure history model

1. Add revision types, pure transitions, capacity trimming, and selectors.
2. Model current-schema, legacy, seed, protected fallback, persisted revision,
   and `savedAt` metadata explicitly.
3. Test branch, baseline, no-op, limit, deterministic metadata, same-task
   commits, and Save-preserves-history cases.
4. Export the model without integrating UI yet.

Exit criterion: pure tests prove all state transitions and no production UI has
changed behavior beyond Phase 1 copy.

### Phase 3: Integrate the web state owner

1. Replace `setUnsavedDocument` with the history-aware mutation gateway.
2. Route every current document mutation through it with action metadata.
3. Add typed atomic batch methods and remove per-item callback loops from one
   user gesture.
4. Derive dirty state and Save state from the persisted revision.
5. Separate successful persistence timestamps from failed-attempt timestamps.
6. Preserve load recovery, recovery snapshots, import/reset, and failure
   behavior.

Exit criterion: all document mutations produce exactly one expected revision;
Undo and Redo work through the hook API without UI controls.

### Phase 4: Protect image assets and destructive recovery

1. Extend retained asset calculation over present, past, future, and recovery
   snapshots.
2. Make snapshot capture use the current history revision.
3. Add ZIP import compensation/retention behavior.
4. Add image and destructive-operation tests.

Exit criterion: no reachable revision can refer to deleted image bytes, and
destructive actions remain both Undoable and protected by recovery snapshots.

### Phase 5: Add header UI and accessibility behavior

1. Render Undo and Redo before Save.
2. Add the approved dirty-draft coordinator and guarded history actions.
3. Add disabled/contextual/single-live-region states.
4. Update responsive CSS at every existing header breakpoint.
5. Verify draft reset/cancel behavior and dashboard-history independence.

Exit criterion: the controls remain visible, ordered, keyboard-usable, and
understandable from desktop through phone width and 200% zoom.

### Phase 6: Documentation and end-to-end verification

1. Update current user, deployment, QA, and parity documentation.
2. Add browser smoke coverage for Create/Update labels and full history/save
   sequences.
3. Run the validation matrix below.
4. Remove or stop exporting obsolete UI-facing Save label fields.

Exit criterion: automated checks pass and the manual acceptance scenarios are
recorded with results.

## Test Plan

### Pure history tests

- Initial valid-storage revision is clean and has no history.
- Initial seed revision is unsaved and has no persisted revision ID.
- Initial migrated legacy-schema revision is unsaved until schema 4 Save.
- Initial corrupt/unreadable-storage fallback is paused; commit makes it dirty,
  and Undo back to that exact initial revision restores paused status only until
  a current-schema Save succeeds.
- One commit enables Undo and clears Redo.
- Undo and Redo move the correct revision and expose the correct action label.
- Undo followed by a new commit discards the old redo branch.
- The total reachable reversible actions never exceeds the approved limit
  through repeated Undo/Redo/branch sequences.
- A no-op mutation creates no history, timestamp churn, recovery snapshot, or
  asset cleanup.
- Two synchronous commits use the latest revision and preserve both changes.
- Re-running the same deterministic transition, as React Strict Mode may do,
  produces the same IDs, timestamps, and document.
- One atomic entry-plus-three-links submission creates one revision.
- One timeline bulk operation creates one revision.
- Successful Save marks present persisted without clearing past or future.
- Failed Save changes no revision or baseline.
- Failed Save records its attempt time separately from the last successful
  persistence time; history navigation clears stale failure presentation.
- Undo to the persisted revision is clean; Redo away from it is dirty.
- Save after Undo makes that historical revision the new baseline; Redo is
  retained and dirty.
- `savedAt` always describes the last successful durable write, not the
  historical revision's original timestamp.
- Import/Reset/Recovery Restore origins traverse with revisions, while startup
  storage issues remain available throughout the session.

### Copy/model tests

- Each create form says Create with the correct record type.
- Each existing-record form says Update with the correct record type.
- Relationship create/edit states differ.
- Entry/timeline labels include staged-link counts in both contexts.
- Knowledge settings, field labels, and vocabulary values say Update.
- Relationship panels and help use Current/Applied/Linked terminology instead
  of calling in-memory document records Saved.
- Header Save/status models retain current Save wording.
- Accessibility labels contain the same action semantics as visible labels.
- Mobile shared render tests expect Create/Update while device-persistence
  success/failure copy remains unchanged.
- A source/copy audit allowlists only true persistence, recovery, timestamp,
  internal symbol, and historical-document uses of Save/Saved.

### Web integration tests

- Buttons are DOM-ordered Undo, Redo, Save, Data Menu.
- Undo and Redo begin disabled.
- Create a record: Undo enables; Redo does not.
- Undo removes the record in memory and enables Redo.
- Redo restores it with all relationships and images.
- Save, update, Undo, and Redo correctly move among Saved and dirty states.
- Reload restores only the last explicitly saved revision and starts with empty
  history.
- Import, reset, archive, delete, schema cleanup, and workspace switch are each
  one Undo step.
- Undo/Redo around import, reset, and recovery restore keeps Data-page origin
  copy aligned with the present document and preserves startup error details.
- Recovery snapshot deletion does not affect document history.
- Dashboard layout Undo does not affect document history and vice versa.
- A storage write failure retains the last durable baseline and allows history
  navigation.
- A failed Save does not stamp `document.savedAt` or trigger asset deletion.
- Before-unload warning follows the derived dirty state.
- Two programmatic mutations in one task do not lose the first update.
- A route render error leaves header history available; Undo changes the reset
  key, clears the boundary, and retries the prior revision.
- Twenty history operations and complete traversal on the large-world fixture
  stay within an explicit broad performance budget without full-document JSON
  serialization per step.

### Draft and accessibility tests

- Native text editing remains independent of document Undo.
- Undo/Redo with dirty drafts prompts once; Cancel changes nothing and Confirm
  discards registered drafts before history navigation.
- Multiple dirty registrations aggregate and unregister correctly.
- Saving with a dirty draft persists only the applied document, retains the
  draft, and announces that the draft was excluded.
- A clean edited record that disappears through Undo exits/rebases safely.
- Disabled controls remain focusable only if the chosen accessibility pattern
  requires it; otherwise their disabled state is conveyed by the native button.
- Screen-reader announcements describe the operation and persistence state once
  without duplicate live regions.
- Focus remains visible and stable after activation.
- Tab order and control grouping are correct.
- Header controls fit at 1440, 1024, 768, 520, and 320 CSS pixels and at 200%
  zoom without horizontal page overflow.

### Image/recovery tests

- Assets referenced only by past or future revisions are retained.
- Assets with no current, history, or recovery references are collectible.
- ZIP-imported assets survive Undo, Save of the prior revision, and Redo.
- Header Save while an image draft is unapplied retains its staged IndexedDB
  bytes; confirmed discard/history navigation removes them.
- If ZIP asset installation succeeds but the document transaction cannot
  commit, newly installed unreferenced bytes are cleaned up.
- Simulated IndexedDB write failure rejects the new upload without evicting a
  reachable revision or changing document history.
- Undo/Redo never creates duplicate recovery snapshots.
- Restore snapshot is Undoable as one action.

## Validation Commands

Run Prettier after each implementation slice and the closest focused test while
iterating. Before completion run, from the project root:

```powershell
npx prettier --write <edited files>
npm test
npm run typecheck
npx eslint .
npx vite build
```

Because shared core copy is consumed by mobile, also run:

```powershell
npm run typecheck:mobile
npm run test:mobile
```

Run `npm run check:browser` after the browser smoke script and built app are in
the expected state. If the current Node version is below Vite's requirement,
report the Node/Vite environment failure separately from source-code failures,
as required by `AGENTS.md`.

`npm test` is a mandatory completion gate. Do not report the feature complete
without its result.

## Manual Acceptance Scenarios

1. Start from a clean, saved document. Confirm Undo and Redo are disabled and
   the header says Saved.
2. Create a Character. Confirm the form said Create Character, the record
   appears, Undo becomes enabled, and the header becomes dirty.
3. Undo. Confirm the Character disappears, Redo becomes enabled, and the header
   returns to Saved when the original revision was the durable baseline.
4. Redo. Confirm the Character returns and the header becomes dirty.
5. Save and reload. Confirm the Character remains and both history buttons reset
   to disabled.
6. Edit that Character with two staged relationships. Confirm the action says
   Update Character And 2 Links and one Undo reverses the entry and both links.
7. Undo the update, Save the older revision, then Redo. Confirm Redo still works,
   the restored revision is dirty, and all related images still render.
8. Create and edit a Relationship. Confirm the button changes from Create
   Relationship to Update Relationship.
9. Edit a workspace, in-fiction world, field configuration, field label, and
   vocabulary value. Confirm every existing-record action says Update and none
   of those clicks claims to write `localStorage`.
10. Delete a record. Confirm one Undo restores it and its relationships while a
    recovery snapshot remains available.
11. Import a backup and Undo it. Confirm the pre-import document returns without
    an automatic durable write. Repeat with a ZIP containing uploaded images,
    Save the pre-import revision, Redo, and confirm imported images still load.
12. Force `localStorage` writes to fail. Confirm Retry Save appears, Undo/Redo
    remain usable, the failed-attempt time is distinct, and the last successful
    baseline and `document.savedAt` are not changed.
13. Begin editing a form without applying it. Confirm Undo/Redo asks before
    discarding; Cancel preserves both draft and history. Confirm header Save
    retains the draft and announces that it was not included.
14. Load a migrated schema 3 document and confirm it starts Needs Save. Load a
    corrupt-storage fallback, edit it, then Undo before saving and confirm Save
    Paused returns. Save an edited revision successfully, Undo to the original
    fallback, and confirm it is now dirty rather than paused while startup
    diagnostics remain available.
15. Submit an unchanged form and attempt an invalid/destructive no-op. Confirm
    neither creates history or a recovery snapshot.
16. Repeat the header flow with keyboard-only navigation and a screen reader,
    then at 900, 768, 520, and 320 pixels and 200% zoom. Confirm the phone layout
    uses separate brand/menu, document-control, and navigation rows without
    horizontal overflow.
17. On mobile, confirm Create/Update labels are accurate and automatic device
    save success/failure messages still match actual `AsyncStorage` outcomes.

## Risks and Mitigations

| Risk                                                                          | Mitigation                                                                                                                                                 |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One submit creates several history entries                                    | Replace repeated mutation callbacks with one typed atomic transaction before enabling UI.                                                                  |
| Undo state and Save status drift apart                                        | Track a stable persisted revision ID and derive dirty state from it.                                                                                       |
| Historical `savedAt` values misrepresent persistence                          | Treat `savedAt` as non-undoable metadata and normalize on revision activation.                                                                             |
| Redo restores metadata for deleted image bytes                                | Retain assets across present, past, future, and recovery snapshots.                                                                                        |
| Global Undo overwrites a local draft                                          | Aggregate dirty registrations, confirm discard, clean staged bytes, and reset the active route before changing revision.                                   |
| Header becomes unusable on narrow screens                                     | Group the three controls, revise existing breakpoints, and test long status labels/zoom.                                                                   |
| Shared copy change falsely implies mobile no longer persists                  | Separate Create/Update action copy from device save-result status copy.                                                                                    |
| Large documents consume excessive memory                                      | Use immutable structural sharing, exclude binary bytes, cap history at the approved limit, and extend large-world performance tests.                       |
| Recovery and Undo are confused                                                | Keep stores and UI concepts separate and document their different lifetime and purpose.                                                                    |
| Search/replace changes true Save language                                     | Classify each occurrence by whether its action invokes browser/device storage before editing.                                                              |
| React repeats an impure reducer/updater or same-task commands use stale state | Precompute deterministic operation metadata once, use pure transitions, and keep one synchronized latest-history source.                                   |
| Undo loses the corrupt-storage warning                                        | Retain the initial revision ID and its `paused`/`unsaved` classification independently of the persisted baseline.                                          |
| Header Save appears to include a local draft                                  | Register aggregate dirty-draft state and explicitly announce that Save persisted only applied document changes.                                            |
| ZIP/image or recovery side effects partially succeed                          | Order validation, side effects, and the atomic document commit; retain or compensate installed bytes on failure.                                           |
| The saved baseline is evicted by the bounded history                          | Keep its revision ID for dirty comparison; document that once unreachable, returning to it requires another explicit Save rather than unbounded retention. |
| History retains many unique uploaded images                                   | Bound revisions, clean after eviction at a staged-draft-safe point, and reject new writes rather than deleting reachable bytes.                            |

## Definition of Done

The feature is complete only when all of the following are true:

- Every former non-durable `Save <X>` editor submit action uses Create or Update
  according to context; precise Add/Apply/Move/Archive/Restore/Delete commands
  remain intact.
- Nearby Current/Applied/Linked and Unapplied Draft copy no longer describes
  in-memory document commits as durably saved.
- The real durable header Save action and persistence status copy remain
  accurate.
- Undo and Redo are immediately before Save, accessible, responsive, and driven
  by real document history.
- Every creative document-changing or active-workspace gesture is exactly one
  atomic history step; durable Save metadata and explicitly excluded separate
  stores are not history steps.
- No-op and invalid commands create no history or destructive side effects, and
  deterministic same-task/Strict-Mode behavior is covered by tests.
- Save baseline, failed-save, reload, import/reset, destructive action, local
  draft, legacy/paused load, dashboard-history, and image-retention behaviors
  match this plan.
- Shared web/mobile copy and tests are consistent with each platform's actual
  persistence policy.
- Current documentation explains the distinction among draft updates, session
  history, recovery snapshots, and durable Save.
- Prettier, `npm test`, typecheck, mobile typecheck, ESLint, and Vite build have
  been run and their results reported; `npm test` passes.
