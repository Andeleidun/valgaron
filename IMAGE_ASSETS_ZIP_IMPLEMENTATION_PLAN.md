# Image Assets And ZIP Portability Implementation Plan

Date: July 9, 2026  
Status: Approved for implementation on July 10, 2026  
Source design:
`docs/planning/image-assets-and-zip-portability-design-plan.md`  
Perspective: Staff software engineer for mobile, web, and frontend systems

Implementation progress: schema 4, browser and native binary repositories,
entry authoring/display, exact-JSON ZIP export/import, migration, integrity
checks, snapshot-aware cleanup, diagnostics, and product documentation are
implemented. Final release evidence is recorded by the task handoff rather than
embedded as volatile command output in this plan.

## 1. Executive Summary

Valgaron will support two image sources on world codex entries:

- Remote web images, persisted as validated HTTPS URI strings.
- User-uploaded raster images, persisted as URI strings plus document-owned
  asset metadata while binary bytes remain in platform-local binary storage.

The portability workflow will add active-workspace and full-document ZIP
backups. Each ZIP will contain the exact canonical JSON backup already generated
by Valgaron plus the uploaded image files reachable from that JSON. Remote web
images remain links and will not be fetched during export.

The recommended implementation introduces world document schema version 4,
IndexedDB binary storage on web, app-managed files on mobile, transactional ZIP
import, snapshot-aware asset cleanup, and a staged web-first/mobile-safe rollout.

This document is the execution plan. It defines decisions, work packages, file
ownership, sequencing, validation, rollout, rollback, and completion criteria.
It does not authorize implementation choices that remain behind a decision
gate.

## 2. Required Outcome

When complete, a user can:

1. Add an HTTPS image URI to any supported codex entry.
2. Upload a supported raster image to that entry.
3. Add accessible alternative text and an optional caption.
4. Reorder images, with the first image acting as the cover.
5. Save, reload, view, duplicate, archive, restore, and delete entries without
   losing or incorrectly duplicating image data.
6. Download existing JSON formats exactly as before.
7. Download a full-document or active-workspace ZIP containing:
   - the exact JSON serializer output; and
   - every reachable uploaded image at its JSON URI path.
8. Import a valid JSON or ZIP backup, preview its contents, confirm replacement,
   and recover the complete document and uploaded images.
9. Diagnose missing or corrupt local image bytes without exposing creative
   content in diagnostics by default.
10. Use the shared schema on web and mobile without one client silently
    discarding fields created by the other.

## 3. Scope

### 3.1 In Scope

- A typed image reference array on supported entries.
- A document-level uploaded image asset catalog.
- HTTPS remote image rendering.
- Uploaded JPEG, PNG, WebP, and GIF persistence and display.
- Web upload, entry editing, cover/gallery display, and responsive behavior.
- Web IndexedDB binary storage.
- Exact-JSON active and full ZIP creation.
- Safe JSON and ZIP import with preview and replacement confirmation.
- Schema 3 to schema 4 migration if Gate 7 approves it.
- Recovery-snapshot-aware binary reachability and cleanup.
- Safe staged mobile schema support followed by native upload/ZIP parity.
- Content-free image integrity diagnostics.
- Accessibility, privacy, security, capacity, support, and release documentation.

### 3.2 Out Of Scope

- Cloud storage, hosted image proxying, accounts, sync, or collaboration.
- Automatically downloading remote web images into ZIPs.
- Editing, cropping, filtering, or transforming images.
- Automatic EXIF stripping or transcoding in the first slice.
- SVG support.
- Video, audio, documents, or generic attachments.
- Image search, stock-image licensing, or web scraping.
- Availability guarantees for browser-local or installed-app storage.
- Adding images to workspaces or in-fiction world/planet records unless Gate 1
  selects that broader scope.

## 4. Current Runtime Baseline

The implementation must extend the current architecture rather than introduce a
second document system:

- `WorldDocument` is currently schema version 3.
- `WorldEntryBase` is the common record contract and has no image field.
- Shared parsing and validation live in
  `packages/core/src/worldDocument.ts`.
- Shared import/export logic lives in
  `packages/core/src/codexDataPortability.ts`.
- Web stores one document JSON string in `localStorage` at
  `valgaron.worldDocument.v3`.
- Mobile stores one document JSON string in `AsyncStorage` at
  `valgaron.mobile.worldDocument.v3`.
- Web JSON downloads are implemented through
  `src/Utlilities/fileDownloads.ts` and `src/Pages/DataPage.tsx`.
- Mobile shares export text from `mobile/src/screens/DataScreen.tsx`.
- Recovery snapshots contain `WorldDocument` JSON but no binary payload.
- The existing `ImageUploader` creates temporary `blob:` URLs and cannot be
  used as durable persistence without refactoring.
- `ImageView` already provides a gallery dialog foundation but is not wired to
  codex entries or a local asset resolver.
- No application ZIP codec, IndexedDB repository, or mobile app-file repository
  is currently implemented.

Binary data must not be added to the current JSON string stores. `blob:`, picker
content, and temporary `file:` URIs must never be persisted in the shared
document.

## 5. Decision Gates

Implementation Phase 1 must not start until the required decisions are recorded
in this document or the user explicitly authorizes the recommended set.

### Gate 1: Supported Records And Gallery Cardinality

Options:

1. Every `WorldEntry` gets up to six images; first image is cover.
2. Entries, workspaces, and in-fiction worlds get images in the first release.
3. Supported records get one cover image only.

Recommendation: option 1.

Tradeoff: option 1 reuses the shared entry model and editor while keeping the
first slice bounded. Option 2 requires distinct workspace and planetary-world
mutation/editor work. Option 3 is simpler but creates an avoidable second schema
change when galleries are added.

Consequences:

- Web/mobile: one common entry media workflow under option 1.
- Data: add `images` only to `WorldEntryBase` under option 1.
- Tests: exercise the shared behavior across built-in and custom entry types.
- Documentation: explicitly state excluded record types.

Decision: Approved option 1 on July 10, 2026.

### Gate 2: Uploaded Image URI Contract

Options:

1. `images/<asset-id>.<ext>` plus a document-level asset catalog.
2. `valgaron-asset://<asset-id>` plus ZIP-time JSON path rewriting.
3. Base64/data URI bytes inside entry JSON.

Recommendation: option 1.

Tradeoff: relative generated URIs are understandable after extraction and let
the JSON remain unchanged inside the ZIP. Opaque URIs require rewriting or a
separate resolution manifest. Base64 inflates data and threatens localStorage
and AsyncStorage limits.

Consequences:

- Web/mobile: platform resolvers intercept known `images/...` URIs.
- Data: asset reference integrity becomes a schema invariant.
- Tests: cover safe path generation, uniqueness, and invalid path rejection.
- Documentation: publish the schema 4 URI rules.

Decision: Approved option 1 on July 10, 2026.

### Gate 3: Platform Binary Storage

Options:

1. IndexedDB blobs on web and app-managed filesystem files on mobile.
2. Current localStorage/AsyncStorage JSON strings.
3. Memory-only upload bytes.

Recommendation: option 1.

Tradeoff: option 1 adds an asynchronous two-store coordinator but is the only
durable option that keeps binary data out of the world JSON. Option 2 has severe
capacity and serialization costs. Option 3 loses uploads on reload.

Consequences:

- Web: IndexedDB adapter, quota handling, and object URL lifecycle.
- Mobile: system picker plus immediate copy into app-owned storage.
- Data: binary-first/document-second persistence coordination.
- Tests: memory adapter plus platform adapter failure tests.
- Documentation: storage clearing, quota, and uninstall limitations.

Decision: Approved option 1 on July 10, 2026.

### Gate 4: ZIP Restore Capability

Options:

1. Deliver ZIP export and ZIP import together.
2. Deliver export first and keep import JSON-only temporarily.
3. Describe ZIP as a non-restorable media bundle.

Recommendation: option 1.

Tradeoff: round-trip support is more work but makes the ZIP a real backup. An
export-only package can preserve files outside the app but cannot restore the
new durable feature.

Consequences:

- Web/mobile: add binary file selection and package preview.
- Data: validate all package contents before replacing either store.
- Tests: traversal, bomb limits, mismatches, rollback, and legacy JSON.
- Documentation: distinguish JSON reference export from complete ZIP backup.

Decision: Approved option 1 on July 10, 2026.

### Gate 5: Remote Web Images In ZIP

Options:

1. Leave remote images as URI strings only.
2. Fetch every remote image during export.
3. Later add an explicit `Make local copy` action; normal export remains
   link-only.

Recommendation: option 1 for this release, with option 3 as a future feature.

Tradeoff: link-only export is deterministic and avoids unexpected network,
copyright, hotlink, CORS, drift, and size behavior. Remote images may be
unavailable offline or disappear later.

Consequences:

- Web/mobile: stable remote-load failure placeholder.
- Data: remote URI remains in JSON but its bytes are not backed up.
- Tests: assert ZIP generation performs no network request.
- Documentation: disclose third-party loading and link durability limits.

Decision: Approved option 1 on July 10, 2026.

### Gate 6: Formats And Limits

Options:

1. Preserve verified JPEG, PNG, WebP, and GIF bytes; reject SVG and unknown
   content; enforce file, record, and package limits.
2. Transcode uploads and strip metadata.
3. Trust any picker-reported `image/*` MIME type.

Recommendation: option 1 with initial limits of 10 MB per image, six images per
entry, and 100 MB of reachable uploaded bytes per ZIP.

Tradeoff: preserving bytes avoids quality loss and cross-platform image
processing complexity but can retain EXIF metadata. Transcoding improves
normalization/privacy at a significant implementation and memory cost. Trusting
MIME alone is unsafe.

Consequences:

- Web/mobile: validate before document mutation and explain failures.
- Data: extension derives from verified MIME; filename is metadata only.
- Tests: magic bytes, MIME spoofing, boundary sizes, aggregate package limits.
- Documentation: warn about EXIF in intentionally shared ZIP files.

Decision: Approved option 1 on July 10, 2026, with limits of 10 MB per image,
six images per entry, and 100 MB of reachable uploaded bytes per ZIP.

### Gate 7: Schema 3 Compatibility

Options:

1. Schema 4 with deterministic schema 3 migration to empty images/assets.
2. Schema 4 clean break.
3. Optional new fields under schema 3.

Recommendation: option 1.

Tradeoff: migration adds storage-key and parser work but avoids discarding
existing creative content. A clean break matches earlier prototype practice but
is disproportionate for an additive empty-array migration. Keeping version 3
hides a durable compatibility change.

Consequences:

- Web/mobile: v4-first, v3-fallback loading without overwriting v3 until a
  successful v4 save.
- Data: import normalizes v3 to v4 and writes only v4.
- Tests: migration fixtures, key precedence, failed-write recovery.
- Documentation: schema migration and service worker upgrade notes.

Decision: Approved option 1 on July 10, 2026.

### Gate 8: Mobile Delivery Sequence

Options:

1. Ship web first while mobile rejects schema 4.
2. Ship shared schema plus lossless mobile compatibility, complete web, then add
   full native authoring and ZIP parity.
3. Hold all release until complete web/native parity.

Recommendation: option 2.

Tradeoff: option 2 preserves data safely while honoring web-first product
direction. Option 1 risks mobile becoming destructive or unusable. Option 3
delays web value for platform work that can safely follow.

Consequences:

- Web: full flow can release first.
- Mobile: must preserve all fields and show explicit unavailable states.
- Data: no capability flags enter the world document.
- Tests: shared parity fixture proves mobile does not drop image metadata.
- Documentation: temporary capability boundary must be explicit.

Decision: Approved option 2 on July 10, 2026.

### Recommended Approval Set

The approved set is `1, 1, 1, 1, 1, 1, 1, 2`, with the limits above. Imported
ZIP packages reject unexpected entries, and valid HTTPS query strings and
fragments are preserved.

## 6. Provisional Data Contract

The work breakdown below assumes the recommended gates for planning purposes.
It is provisional until the gates are approved.

```ts
export type WorldImageReference = {
  id: string;
  uri: string;
  altText: string;
  caption: string;
  decorative: boolean;
};

export type WorldImageAsset = {
  id: string;
  uri: string;
  originalFilename: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
  byteSize: number;
  sha256: string;
  createdAt: string;
};

export type WorldEntryBase = {
  // Existing fields remain unchanged.
  images: WorldImageReference[];
};

export type WorldDocument = {
  schemaVersion: 4;
  activeWorldId: string;
  worlds: WorldWorkspace[];
  assets: WorldImageAsset[];
  savedAt: string;
};
```

`decorative` is explicit so empty alt text is intentional and testable. For an
informative image, `altText.trim()` must be non-empty. Caption remains optional.

### 6.1 URI Invariants

- Remote source: absolute `https:` URI.
- Uploaded source: exact generated `images/<asset-id>.<verified-extension>`.
- `blob:`, `data:`, `file:`, picker content URIs, protocol-relative URLs,
  dot-segment paths, backslashes, query strings on local paths, and arbitrary
  relative paths are invalid persisted values.
- An uploaded URI has exactly one matching asset metadata record.
- A remote URI has no asset metadata record.
- Asset ids, asset URIs, and image reference ids are unique within their scope.
- User filenames never determine local keys or archive paths.
- Uploaded assets are immutable. Replacing bytes creates a new asset id.

### 6.2 Ownership And Sharing

- The asset catalog is document-owned, not workspace-owned.
- Entry references may share an immutable uploaded asset.
- Duplicating an entry copies image references but does not copy bytes.
- Reordering changes cover/gallery order only.
- Archiving does not change asset reachability.
- Removing the last current-document reference removes current document asset
  metadata, subject to recovery snapshot retention for physical bytes.

## 7. ZIP Contract

### 7.1 Archive Layout

```text
valgaron-all-workspaces.zip
|-- valgaron-all-workspaces.json
`-- images/
    |-- asset-<id>.jpg
    `-- asset-<id>.png
```

Active-workspace packages use the existing active JSON filename and include
only uploaded binaries reachable from the exported workspace. Full packages
include every uploaded binary reachable from the current document.

### 7.2 Exact JSON Requirement

The archive builder must accept the already generated serializer string and
write those exact UTF-8 bytes. It must not:

- call the serializer again;
- rewrite image URIs;
- reorder keys or arrays;
- add a ZIP-only manifest to the JSON;
- fetch or replace remote URI content.

An automated test must extract the JSON entry and compare bytes with the input
serializer string.

### 7.3 Completeness Rules

- Every uploaded URI referenced by exported JSON appears once in the archive.
- No unreferenced current binary appears.
- Recovery-snapshot-only assets do not appear in a normal current backup.
- Remote HTTPS sources never appear as files.
- Missing, unreadable, wrong-size, or wrong-hash uploaded bytes block a complete
  ZIP and produce a diagnosable error.
- JSON-only export remains available if ZIP completeness fails.

## 8. Architectural Boundaries

### 8.1 Shared Core Owns

- Schema types and parsers.
- Schema migration.
- URI classification and reference validation.
- Asset reachability and reference counting.
- Image mutations.
- Active/full export asset selection.
- Import preview counts and integrity issues.
- Platform-neutral ZIP package plans.
- Content-free diagnostics.

Core must not import DOM `Blob`, IndexedDB, browser object URLs, React Native,
Expo modules, or platform file URIs.

### 8.2 Platform Package Owns

- Asynchronous binary repository contracts.
- In-memory test repository.
- Shared typed result/error categories.
- Optional byte/hash helpers that are genuinely platform-neutral.

Provisional contract:

```ts
export type BinaryAsset = {
  bytes: Uint8Array;
  mediaType: string;
};

export type BinaryAssetRepository = {
  read(assetId: string): Promise<BinaryAsset | null>;
  write(assetId: string, asset: BinaryAsset): Promise<boolean>;
  remove(assetId: string): Promise<boolean>;
  listIds(): Promise<readonly string[]>;
};
```

If mobile package creation cannot safely materialize `Uint8Array`, keep the
logical operations but add a platform file-handle/stream export boundary. Do
not force native files through a browser-shaped memory API.

### 8.3 Web Owns

- IndexedDB database lifecycle and Blob storage.
- Browser `File` selection and validation integration.
- Object URL acquisition, reference counting, and revocation.
- Remote `<img>` behavior and referrer policy.
- ZIP codec invocation and Blob download.
- Web save/import coordination across localStorage and IndexedDB.
- Web progress, error, and recovery UI.

### 8.4 Mobile Owns

- System picker integration.
- Copying temporary/content URIs to app-owned files.
- App-file URI resolution for display.
- Native ZIP codec/file creation.
- Document picker and share/save sheet integration.
- Temporary package cleanup.
- Installed-app storage and low-space error behavior.

## 9. Runtime State And Transaction Model

### 9.1 Asset Runtime States

Runtime state must be derived rather than persisted in `WorldDocument`:

- `remote`: HTTPS URI, no local bytes expected.
- `staged`: selected bytes exist but the saved document does not reference them.
- `available`: metadata and verified local bytes exist.
- `missing`: metadata exists but bytes cannot be read.
- `corrupt`: bytes disagree with verified size/hash/type.
- `unreferenced`: bytes exist but no current document or retained snapshot owns
  them.

The UI may show these states, but they are platform state, not schema fields.

### 9.2 Save Transaction

1. Validate URI/image draft and selected file.
2. Verify magic bytes, MIME, size, and approved extension.
3. Generate immutable asset id and path.
4. Compute SHA-256.
5. Write binary bytes to the platform repository.
6. Add asset metadata and entry reference to in-memory document state.
7. On web explicit Save or mobile device save, write the schema 4 JSON.
8. If JSON write fails, retain the prior saved JSON and mark newly written bytes
   for safe orphan cleanup.
9. Report whether the draft remains open and whether retry is possible.

No UI success message may claim persistence before both required stores have
completed their part.

### 9.3 Delete And Garbage Collection

1. Remove only the selected image reference from the entry.
2. Recalculate current-document references.
3. Remove asset metadata only when no current entry references the asset.
4. Retain physical bytes while the current document or any retained recovery
   snapshot references the asset metadata.
5. Run physical cleanup only after the owning JSON/snapshot mutation succeeds.
6. Treat cleanup failure as a diagnostic warning, not document corruption.

Run bounded garbage collection after successful save, import, reset, snapshot
deletion/eviction, and safe startup maintenance. Never garbage-collect before a
replacement transaction commits.

### 9.4 ZIP Import Transaction

1. Detect JSON versus ZIP from content signatures, not extension only.
2. Enforce compressed bytes, expanded bytes, entry count, and path depth limits.
3. Reject absolute paths, `..`, backslash separators, duplicate paths,
   encrypted entries, symlinks, unsupported compression, and multiple JSON
   roots.
4. Parse JSON through the shared import/migration path.
5. Build the exact expected local file set from validated JSON.
6. Reject missing files and apply the approved unexpected-file policy.
7. Verify each file's signature, MIME, byte size, path, and SHA-256.
8. Produce a preview with workspace, entry, relationship, web image, uploaded
   image, asset, and byte counts.
9. Await explicit destructive replacement confirmation.
10. Create the existing recovery snapshot of the current document.
11. Stage every incoming binary under new transaction ownership.
12. Persist the replacement document.
13. Commit staged binaries and garbage-collect unreachable old binaries.
14. On failure, retain the prior document and binaries and remove only new
    unreferenced staged files.

Image bytes must not be decoded or rendered during package validation.

## 10. File-Level Change Map

The exact names of new modules may be adjusted during implementation, but their
responsibilities must remain separated.

| Area                      | Existing files to update                                                               | Expected new files                                                                |
| ------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Core types                | `packages/core/src/types.ts`, `packages/core/src/index.ts`                             | `packages/core/src/imageAssets.ts`, `imageAssetLimits.ts`                         |
| Core parsing              | `packages/core/src/worldDocument.ts`, tests                                            | Focused image/parser fixtures and tests                                           |
| Entry mutations           | `packages/core/src/codexEntries.ts`, `documentMutations.ts`, tests                     | Image mutation tests if not colocated                                             |
| Portability               | `packages/core/src/codexDataPortability.ts`, `dataFeatureModel.ts`, diagnostics, tests | `packages/core/src/zipBackup.ts` and tests                                        |
| Seed/fixtures             | `packages/core/src/seedCodex.ts`, frontend parity and large-world fixtures             | Schema 3 and schema 4 backup fixtures                                             |
| Platform contract         | `packages/platform/src/index.ts`, tests                                                | Binary repository types/memory adapter if extracted                               |
| Web storage               | `src/Utlilities/codexStorage.ts`, `storageAdapter.ts`, snapshots, state hook           | `imageAssetStorage.ts`, `imageAssetResolver.ts`, `imagePersistenceCoordinator.ts` |
| Web downloads/import      | `src/Utlilities/fileDownloads.ts`, `src/Pages/DataPage.tsx`, tests                     | `zipDownloads.ts`, `zipImports.ts`                                                |
| Web entry UI              | `src/Components/Codex/CodexEntryViews.tsx`, section/workbench routes, tests            | `EntryImageEditor.tsx`, `EntryImageGallery.tsx` where extraction is warranted     |
| Existing image components | `ImageUploader.tsx`, `ImageView.tsx`, exports, CSS                                     | Focused resolver hooks/tests                                                      |
| Mobile storage            | `mobile/src/storage/mobileStorage.ts`, adapter tests                                   | `mobileImageAssetStorage.ts`, resolver, coordinator                               |
| Mobile state/UI           | `MobileCodexContext.tsx`, `EntriesScreen.tsx`, `DataScreen.tsx`, tests                 | Picker/ZIP helpers isolated from screens                                          |
| Docs/release              | README, privacy, security, user guide, migration, QA, support, changelog               | No additional planning artifact required                                          |

Do not combine the browser binary repository, React editor, ZIP parser, and
schema parser into one utility. These areas have different trust, lifecycle,
and test boundaries.

## 11. Implementation Work Packages

Each work package should be independently reviewable and keep the repository
green before the next begins. Suggested PR boundaries are listed in Section 12.

### WP0: Decision Closure And Baseline

Goal: establish approved scope and a trustworthy pre-change baseline.

Tasks:

1. Record all eight gate choices and numeric limits.
2. Confirm whether unexpected files in an imported ZIP are rejected or ignored
   with a warning. Recommendation: reject for the first version.
3. Confirm whether remote URI fragments/query strings are preserved.
   Recommendation: preserve valid HTTPS URI text after trimming surrounding
   whitespace; do not normalize signed query parameters.
4. Inventory current uncommitted work and isolate image changes from unrelated
   dashboard work.
5. Run the full baseline validation commands in Section 15.
6. Capture schema 3 JSON serializer fixtures for active and full backups.
7. Record current web/mobile storage recovery behavior.

Exit criteria:

- Decisions are explicit.
- Baseline failures are either fixed or documented before image work.
- Serializer fixtures are reviewed and stable.

Rollback: none; this package changes planning/fixtures only.

### WP1: Schema 4 Types, Migration, And Validation

Goal: make the shared data model capable of losslessly representing image
references and uploaded asset metadata.

Tasks:

1. Add `WorldImageReference`, `WorldImageAsset`, and approved MIME unions.
2. Add `images` to `WorldEntryBase` and `assets` to `WorldDocument`.
3. Change the current schema version constant and type literal to 4.
4. Implement strict image reference and asset parsers using `unknown` narrowing.
5. Implement URI classification without browser-only APIs.
6. Enforce uniqueness and uploaded-reference/catalog integrity.
7. Add the approved schema 3 migration that supplies empty arrays throughout.
8. Update seeds, fixtures, recovery snapshot parsing, and shared package exports.
9. Update web and mobile storage keys and v4-first/v3-fallback load behavior.
10. Ensure a failed v4 write never removes or overwrites the usable v3 value.

Tests:

- Valid schema 4 with remote and uploaded images.
- Every invalid protocol/path/catalog relationship.
- Duplicate ids and URIs.
- Informative versus decorative alt validation.
- Schema 3 migration and exact creative-content preservation.
- Current/legacy storage key precedence and write failure.
- Recovery snapshot parsing under the new schema.

Exit criteria:

- Shared core, web storage, and mobile storage tests pass.
- Both clients can load and round-trip schema 4 without binary implementation.
- No runtime-only URI can pass the parser.

Rollback: remove v4 writes while retaining migration code behind an unreleased
feature boundary; do not delete v3 user data.

### WP2: Pure Image Domain Logic

Goal: centralize image mutations, reachability, limits, and package selection.

Tasks:

1. Add immutable helpers to add, update, reorder, and remove references.
2. Add cover derivation from array order.
3. Add remote/uploaded source classification.
4. Add reachable asset selection for a document and single workspace.
5. Add reference counts across the document and recovery snapshots.
6. Add asset metadata removal rules and garbage-collection candidate selection.
7. Add file size/count/package limit constants and pure validation.
8. Add MIME-to-extension and generated-path helpers.
9. Update duplicate/delete/workspace-delete/reset mutation paths to call the
   shared lifecycle logic rather than reimplement it.
10. Extend content-free diagnostics and import/export previews.

Tests:

- Add/edit/reorder/remove and first-as-cover behavior.
- Shared immutable asset on duplicate.
- Last live reference removal.
- Snapshot-only retention and snapshot eviction.
- Active/full reachability across multiple workspaces.
- Limit boundary and aggregate byte behavior.
- Diagnostics exclude filenames, URIs, ids, alt text, captions, and hashes.

Exit criteria:

- Every durable image transition has a pure tested helper.
- No React or platform storage dependency is present in the module.

Rollback: schema can remain with empty arrays while UI stays disabled.

### WP3: Platform Repository Contract And Web IndexedDB

Goal: persist uploaded bytes durably on web without changing JSON storage.

Tasks:

1. Add typed repository result/error categories.
2. Add an in-memory repository for deterministic tests.
3. Define IndexedDB database name, object store, key/version, and upgrade path.
4. Store immutable Blob/metadata records by asset id.
5. Implement read, write, remove, exists/list, and integrity-read operations.
6. Implement object URL acquisition with consumer reference counts.
7. Revoke object URLs on last release, asset replacement, and teardown.
8. Add the binary-first/document-second persistence coordinator.
9. Add bounded, snapshot-aware orphan cleanup.
10. Surface unavailable, quota, transaction-abort, and corruption errors.

Tests:

- Repository CRUD and idempotent immutable writes.
- Database upgrade/open failure.
- Quota/write/read/remove failures.
- Coordinator success, JSON failure, retry, and orphan cleanup.
- Object URL reuse and revocation.
- Reload simulation with document metadata plus stored bytes.

Exit criteria:

- A binary survives browser reload and resolves from its persisted relative URI.
- Failed binary or JSON writes never corrupt the last saved document.
- Cleanup cannot remove snapshot-reachable bytes.

Rollback: disable upload authoring; leave the IndexedDB store intact so a later
build can recover staged data. Never clear it automatically during rollback.

### WP4: Web Entry Authoring And Gallery

Goal: deliver the complete browser entry image workflow.

Tasks:

1. Add an `Images` region to the shared entry editor.
2. Add `Add web image` with HTTPS URI, alt/decorative, and caption inputs.
3. Refactor or replace `ImageUploader` so it passes selected `File` objects to
   the persistence workflow instead of exposing durable `blob:` strings.
4. Validate file count, bytes, signature, MIME, and aggregate limits before
   committing the draft.
5. Add source badges, cover indicator, thumbnail, reorder, edit, and remove.
6. Keep remove/reorder actions keyboard accessible with visible focus.
7. Add staged upload cancel cleanup.
8. Add gallery/cover display to selected entry details.
9. Integrate the platform resolver with `ImageView` and verify its dialog focus.
10. Add remote load, local missing, corrupt, and offline placeholders.
11. Preserve an editable URI after remote load failure.
12. Verify dense desktop and narrow mobile-web layout without horizontal
    overflow.

Tests:

- Render tests for empty, remote, uploaded, mixed, missing, and corrupt states.
- Form validation and informative/decorative alt behavior.
- Same-file reselection and picker cancellation.
- Reorder/cover/remove/undo draft behavior.
- Save/reload and entry duplicate/delete behavior.
- Object URLs never appear in serialized document output.
- Keyboard/focus labels and image alt output.

Exit criteria:

- All supported entries can complete the image lifecycle on web.
- Reload/offline behavior matches source type.
- There is no binary/base64 data in React world-document state.

Rollback: hide authoring controls while retaining read/preserve support for
schema 4 documents.

### WP5: ZIP Codec Selection And Package Builder

Goal: build deterministic active and full ZIP packages without coupling core to
a specific UI or storage engine.

Tasks:

1. Evaluate typed ZIP implementations for supported browsers and Expo/React
   Native. Record bundle size, memory behavior, ZIP64/stream limitations,
   maintenance, license, security history, and Node-polyfill requirements.
2. Add only an explicitly reviewed direct dependency; do not rely on a
   transitive Expo package.
3. Implement a core package plan containing JSON filename/text and ordered asset
   descriptors.
4. Read each uploaded asset through the repository with bounded concurrency.
5. Verify size/hash immediately before packaging.
6. Enforce aggregate package limits before large allocation.
7. Produce active and full archives with stable paths.
8. Expose progress phases: planning, verifying, compressing, finalizing.
9. Add browser ZIP Blob download without placing bytes in a textarea.
10. Preserve current JSON/Markdown export actions unchanged.

Tests:

- Extracted JSON bytes exactly equal serializer input.
- Active versus full asset selection.
- Shared assets included once.
- Remote URIs trigger no asset read and no network request.
- Missing/mismatched asset blocks success.
- Empty-image archive contains JSON and no images directory requirement.
- Boundary package size and cancellation behavior.

Exit criteria:

- Both ZIP modes are deterministic and complete.
- Existing JSON fixture output remains unchanged except approved schema 4 data.
- Codec constraints are documented and enforced in UI copy.

Rollback: remove ZIP actions while keeping JSON export and stored assets intact.

### WP6: Safe ZIP Import And Replacement

Goal: restore the complete schema and uploaded bytes without exposing existing
data to partial replacement.

Tasks:

1. Add content-signature JSON/ZIP detection.
2. Add archive structural limits and path validation before extraction.
3. Parse exactly one expected root JSON backup.
4. Validate the JSON through shared import/migration logic.
5. Compute expected asset paths and reject missing/duplicate/unapproved entries.
6. Verify every image signature, MIME, size, and hash.
7. Extend import preview with safe counts and total uploaded bytes.
8. Preserve existing destructive confirmation and dialog focus behavior.
9. Create the current recovery snapshot before replacement.
10. Stage binaries, save JSON, commit, then clean old unreachable bytes.
11. Implement rollback for every failure point.
12. Keep paste/file JSON import working for legacy backups.

Tests:

- Valid full and active ZIP round trip.
- Schema 3 JSON and schema 4 JSON-only import.
- Traversal, absolute paths, duplicate paths, encrypted/unsupported entries,
  excessive compression, too many files, missing JSON, and multiple JSON roots.
- Missing, extra, spoofed, wrong-size, and wrong-hash image files.
- User cancellation before confirmation.
- Binary-stage failure, JSON-save failure, and cleanup failure.
- Prior document/snapshots remain recoverable after every failed transaction.

Exit criteria:

- A ZIP exported by Valgaron restores every uploaded image.
- No invalid package can partially replace current data.
- JSON-only recovery remains available.

Rollback: disable ZIP import separately from ZIP export if a parser defect is
found; preserve JSON import and do not delete downloaded packages.

### WP7: Mobile Schema Compatibility

Goal: ensure the web-first schema release cannot cause mobile data loss.

Tasks:

1. Update mobile storage/import/parser integration for schema 4 migration.
2. Preserve image references and asset metadata across every mobile mutation.
3. Render remote images where supported.
4. Show an explicit unavailable state for uploaded images whose bytes are not
   present on the device.
5. Prevent mobile from claiming JSON-only export contains uploaded bytes.
6. Add safe copy that explains the temporary capability boundary.
7. Extend shared frontend parity fixtures with mixed image sources.

Tests:

- Mobile load/edit/save does not drop schema 4 fields.
- Entry and unrelated relationship/workspace edits preserve assets.
- Missing uploaded bytes show a stable state without deletion.
- Mobile JSON export retains URI and catalog metadata.

Exit criteria:

- Mobile is lossless before web schema 4 can be released.
- Capability limitations are explicit in product copy and release notes.

Rollback: block schema 4 write paths on mobile but retain read-only recovery/Data
access; never normalize images away.

### WP8: Native Mobile Upload, Display, And ZIP Parity

Goal: complete installed-app image and portability workflows.

Tasks:

1. Add SDK-compatible direct dependencies for system selection, filesystem,
   hashing, ZIP, document picking, and sharing only after review.
2. Copy accepted picker/content URIs into an app-owned asset directory.
3. Never persist Android content URIs or iOS temporary picker paths.
4. Add app-file repository and local display resolver.
5. Add the shared entry image editing model with native primitives.
6. Add accessible cover/gallery rendering and missing/corrupt placeholders.
7. Generate ZIPs in a temporary/cache directory.
8. Share/save packages through the native system surface.
9. Import ZIP/JSON through a document picker and shared preview logic.
10. Clean temporary package files after safe completion.
11. Validate low-space, permission, cancellation, backgrounding, and app restart
    behavior.

Tests:

- Picker URI copy and app-owned path persistence.
- Installed-app reload and missing-file behavior.
- Native package bytes match shared web fixtures.
- Share/document picker cancellation and failure.
- Android/iOS source resolution and screen-reader labels.
- Mobile data export/import parity tests.

Exit criteria:

- Mobile can author, persist, share, import, and restore the same logical data.
- Platform-only URIs never enter JSON.

Rollback: disable native authoring/ZIP actions but retain schema preservation and
remote image display.

### WP9: Documentation, QA, And Release Hardening

Goal: align product claims, recovery guidance, and release evidence with the
new durable data.

Tasks:

1. Update README feature and local-data summaries.
2. Update user guide for URI/upload/gallery/backup/restore/offline workflows.
3. Update privacy policy for remote host requests and preserved EXIF metadata.
4. Update security documentation for protocol allowlists, byte validation,
   archive defenses, CSP/referrer behavior, and non-executable rendering.
5. Update schema migration and versioning documentation.
6. Update support guidance and content-free diagnostics instructions.
7. Expand manual web/mobile/PWA release checklists.
8. Update changelog and staged mobile boundary notes.
9. Verify service worker behavior so stale code cannot strand schema 4 data.
10. Remove obsolete image scaffolding/exports only after runtime consumers are
    migrated and tests prove no use remains.

Exit criteria:

- Documentation makes no cloud, availability, privacy, or backup guarantee.
- Every destructive and recovery flow has manual QA coverage.
- Full release validation passes.

Rollback: documentation follows shipped capability; do not document disabled
features as available.

## 12. Suggested PR / Delivery Sequence

Keep changes reviewable and avoid one cross-platform mega-change:

1. **PR 1 — Decisions and schema fixtures:** approved gates, v3 serializer
   fixtures, baseline tests.
2. **PR 2 — Schema 4 and migration:** types, parser, seeds, storage key loading,
   mobile lossless compatibility.
3. **PR 3 — Pure image domain:** mutations, URI validation, reachability,
   diagnostics, package planning.
4. **PR 4 — Web binary persistence:** IndexedDB adapter, object URL resolver,
   save coordination, garbage collection.
5. **PR 5 — Web authoring/display:** editor, upload/URI flows, gallery,
   accessibility and responsive behavior.
6. **PR 6 — ZIP export:** reviewed codec, active/full package builder, Data UI.
7. **PR 7 — ZIP import:** safe parser, preview, transaction, rollback.
8. **PR 8 — Native binary parity:** picker, app files, display, share/import.
9. **PR 9 — Release hardening:** documentation, PWA, smoke, manual QA, cleanup.

PR 2 must include mobile preservation before any schema 4 document can be
created in a release build. ZIP import should not be released separately from
its adversarial tests.

## 13. UX And Accessibility Requirements

### 13.1 Entry Editor

- Use direct English labels: `Images`, `Add web image`, `Upload image`, `Cover`,
  `Alternative text`, `Decorative image`, `Caption`, `Move earlier`, `Move
later`, and `Remove`.
- Explain allowed formats, limits, and remote loading before selection.
- Require alt text unless decorative is explicitly selected.
- Keep thumbnails supplemental; source, cover, errors, and actions must not rely
  on color or image content alone.
- Reorder/remove controls must be keyboard usable with visible focus.
- Announce upload, validation, reorder, and removal results through existing
  toast/status infrastructure where appropriate.
- Do not lose the URI or draft metadata when a remote preview fails.
- Do not block saving unrelated entry edits because a remote server is offline.
- Do block saving an invalid local uploaded reference.

### 13.2 Entry Detail

- Cover image must have correct alt behavior.
- Gallery dialog retains Escape, next/previous keyboard behavior, focus entry,
  and focus restoration.
- Missing/corrupt images render a text alternative and diagnostic action.
- Large images use bounded responsive dimensions without layout shift or
  horizontal overflow.

### 13.3 Data Screen

- Keep JSON and Markdown actions intact.
- Pair active JSON with active ZIP, and full JSON with full ZIP.
- Explain: `ZIP includes uploaded images. Web image links remain links.`
- Show package progress and disable duplicate submissions.
- State whether a failure left the saved document unchanged.
- Import preview must include asset count and total size without listing private
  filenames or URIs by default.

## 14. Security And Privacy Requirements

- Production-persisted remote sources must use `https:`.
- Development localhost exceptions must not weaken persisted production data.
- Saving a remote URI must not prefetch it.
- Rendering a remote image is an explicit third-party network request and must
  be documented.
- Use conservative `referrerPolicy` and CSP `img-src` rules compatible with
  HTTPS, local object URLs, and current PWA behavior.
- Validate magic bytes, MIME, extension mapping, and size before persistence.
- Reject SVG in the initial implementation.
- Preserve original bytes only under the approved policy and disclose that EXIF
  may remain.
- Generated ids determine storage and ZIP paths.
- Imported names, captions, alt text, and URI strings are always rendered as
  text/data, never injected HTML.
- ZIP import must defend against traversal, bombs, duplicate paths, unsupported
  entry types, and partial replacement.
- Diagnostics must not include creative text, URIs, filenames, asset ids,
  hashes, or image bytes by default.

## 15. Validation Plan

### 15.1 Per-Change Minimum

After every file edit:

```text
npx prettier --write <changed-files>
```

Run the closest focused Jest test after every behavior change. For schema and
platform contract changes, run package tests before proceeding to UI work.

### 15.2 Phase Gate

Before completing any source phase:

```text
npm test
npm run test:mobile
npm run typecheck
npm run typecheck:mobile
npx eslint .
npx vite build
```

Additional gates:

- Run `npm run check:performance` after reachability, diagnostics, gallery list,
  or ZIP planning changes.
- Run browser smoke after editor or Data route changes.
- Run PWA verification after storage key, service worker, or production build
  changes.
- Run mobile doctor after adding Expo dependencies.
- Run mobile rendered/E2E flows after native authoring or Data changes when the
  environment is available.
- Track and stop every verification server started for the task.

Current Node/Vite version warnings must be reported separately from code
failures.

### 15.3 Requirements Traceability

| Requirement                             | Primary automated evidence           | Manual evidence                   |
| --------------------------------------- | ------------------------------------ | --------------------------------- |
| Remote source persists as URI           | Core parser/serializer tests         | Reload and offline web/mobile     |
| Upload expands model without JSON bytes | Schema and serialization tests       | Inspect exported JSON             |
| Uploaded bytes persist                  | Repository/coordinator tests         | Reload browser/app                |
| Exact JSON in ZIP                       | Byte equality extraction test        | Inspect extracted package         |
| ZIP contains reachable uploads          | Active/full reachability tests       | Two-workspace package review      |
| ZIP excludes remote bytes               | No-network/read-spy test             | Export while offline              |
| Safe restore                            | Import transaction/adversarial tests | Replace and recover workflow      |
| No silent mobile loss                   | Shared parity fixture                | Web-create/mobile-edit/web-reopen |
| Snapshot-safe deletion                  | Reachability/GC tests                | Delete and restore snapshot       |
| Accessible gallery/editor               | Render and interaction tests         | Keyboard/screen-reader pass       |
| Content-free diagnostics                | Snapshot/object assertions           | Inspect diagnostics export        |

## 16. Performance And Capacity Plan

- Keep binary bytes out of world document state, textareas, localStorage,
  AsyncStorage, diagnostics, and JSON recovery snapshots.
- Render thumbnails from object/file URIs instead of base64.
- Do not eagerly decode all gallery images.
- Hash and package asynchronously with progress feedback.
- Read assets with bounded concurrency.
- Use package streaming where the approved codec and target support it.
- If a target requires in-memory assembly, check aggregate limits before
  allocation and fail with actionable copy.
- Do not add large image fixtures to git; generate small signature-valid bytes
  in tests and add metadata-only dimensions to performance fixtures.
- Measure object URL leaks, ZIP peak memory, IndexedDB read latency, and entry
  list render behavior with the maximum approved image count.

## 17. Diagnostics And Observability

Add these content-free fields to local diagnostics:

- referenced web image count;
- referenced uploaded image count;
- asset metadata count;
- available local binary count;
- missing binary count;
- corrupt binary count;
- unreachable binary count;
- reachable uploaded byte total;
- last asset-store error category.

Do not add remote URIs, local paths, original filenames, ids, alt text, captions,
hashes, or raw errors that may expose device paths. Map platform failures to a
small typed category set such as `unavailable`, `quota`, `permission`, `read`,
`write`, `integrity`, `package`, and `cleanup`.

## 18. Risk Register

| Risk                                      | Impact                            | Mitigation                                                      | Release blocker       |
| ----------------------------------------- | --------------------------------- | --------------------------------------------------------------- | --------------------- |
| JSON references bytes that were not saved | Broken images/backups             | Binary-first coordinator and failure rollback                   | Yes                   |
| Garbage collection removes snapshot asset | Recovery data loss                | Reachability across current document and all retained snapshots | Yes                   |
| Mobile drops new schema fields            | Cross-client data loss            | Ship lossless mobile compatibility with schema PR               | Yes                   |
| ZIP import path traversal/bomb            | Storage or availability harm      | Strict structure/size/path validation before extraction         | Yes                   |
| Remote image causes unexpected request    | Privacy surprise                  | No save-time fetch, explicit copy, referrer policy              | Yes                   |
| MIME spoof or SVG active content          | Security/cross-renderer risk      | Magic-byte allowlist and SVG rejection                          | Yes                   |
| ZIP assembly exhausts memory              | Crash/failed backup               | Aggregate cap, bounded reads, streaming where possible          | Yes                   |
| IndexedDB/file quota exhausted            | Upload/save failure               | Preflight where possible, typed error, prior JSON remains valid | Yes                   |
| Original upload retains EXIF              | Privacy leak when user shares ZIP | Disclosure now; later explicit metadata stripping               | Documentation blocker |
| Remote URI becomes unavailable            | Broken preview                    | Editable URI and stable placeholder; not a save failure         | No                    |
| Codec adds large/unsafe dependency        | Bundle/security regression        | Explicit dependency review and isolation                        | Yes                   |
| Stale service worker loads schema-3 code  | Recovery failure                  | PWA upgrade/recovery tests and Data route access                | Yes                   |

## 19. Rollout Strategy

1. Land schema 4 migration and mobile lossless preservation behind no visible
   authoring controls.
2. Land web binary storage and integrity diagnostics.
3. Enable web authoring/display only after persistence and reload evidence.
4. Enable ZIP export only after exact-byte and completeness tests.
5. Enable ZIP import only after adversarial and rollback tests.
6. Release the web feature with the documented mobile compatibility boundary.
7. Add native authoring and ZIP parity in the next capability release.
8. Remove temporary compatibility copy only after native parity is verified.

Because this is a local prototype without telemetry, rollout validation relies
on deterministic automated evidence, manual release checks, support diagnostics,
and explicit recovery behavior rather than production analytics.

## 20. Rollback Strategy

- Preserve schema 4 read support even if authoring is disabled.
- Never roll back by deleting IndexedDB/app files or v3/v4 JSON keys.
- Feature-disable upload, ZIP export, and ZIP import independently.
- Keep Data and recovery routes accessible after render failures.
- Retain JSON-only export/import as the minimum recovery path.
- If schema 4 writing is disabled, keep existing schema 4 documents readable and
  prevent clients from silently saving a downgraded schema.
- If ZIP import is disabled, downloaded ZIPs remain user-owned files and must
  not be mutated.
- Document any temporary disabled capability in release notes and Help.

## 21. Documentation Checklist

- [x] `README.md` — image and ZIP feature summary.
- [x] `docs/user-guide.md` — add/edit/view/offline/backup/restore workflows.
- [x] `PRIVACY.md` — third-party image requests and EXIF in shared originals.
- [x] `docs/security-privacy.md` — URI, byte, renderer, ZIP, CSP, and referrer
      controls.
- [x] `docs/release/schema-migrations.md` — schema 4, v3 migration, storage key
      precedence, rollback.
- [x] `docs/versioning.md` — compatibility and release expectations.
- [x] `docs/release/versioning-and-maintenance.md` — operational upgrade steps.
- [x] `docs/qa/manual-release-checklist.md` — web/mobile/PWA image scenarios.
- [x] `docs/qa/runtime-recovery.md` — missing/corrupt binary and failed
      transaction cases.
- [x] `docs/support.md` — content-safe asset diagnostic guidance.
- [x] `CHANGELOG.md` — schema, user workflow, and mobile staging notes.

## 22. Definition Of Done

The implementation is complete only when all of the following are true:

- [ ] Every approved record type supports the approved image count.
- [ ] HTTPS and uploaded sources add, edit, reorder, remove, display, save, and
      reload correctly.
- [ ] First-image cover behavior is consistent on web and mobile.
- [ ] Informative images require alt text; decorative images are explicit.
- [ ] Persisted JSON contains URI strings and metadata only.
- [ ] Persisted JSON contains no `blob:`, `data:`, temporary `file:`, picker URI,
      base64, or binary byte payload.
- [ ] Every uploaded reference has valid catalog metadata and local bytes, or a
      clear missing/corrupt diagnostic state.
- [ ] Full and active ZIPs contain the exact canonical JSON bytes.
- [ ] ZIPs contain exactly the reachable uploaded binaries at their JSON URI
      paths.
- [ ] ZIP creation never fetches remote sources.
- [ ] JSON and ZIP import validate fully before replacement.
- [ ] Failed imports leave the prior document and binaries recoverable.
- [ ] Schema 3 compatibility follows the approved decision without silent loss.
- [ ] Mobile preserves schema 4 throughout the staged rollout.
- [ ] Recovery snapshots protect still-referenced binaries.
- [ ] Orphan cleanup is bounded, safe, and diagnosable.
- [ ] UI remains keyboard usable, screen-reader understandable, responsive, and
      consistent with the dense MUI-based codex.
- [ ] Privacy/security/support/schema/release documentation is updated.
- [ ] Focused tests, `npm test`, mobile tests, typechecks, ESLint, Vite build,
      performance, PWA, browser smoke, and applicable native checks pass.
- [ ] All task-started verification processes are stopped.

## 23. Implementation Start Checklist

Before changing source code:

- [x] User approves or replaces all eight gate recommendations.
- [x] Exact image/file/package limits are approved.
- [x] Unexpected ZIP entry policy is approved.
- [x] Baseline `npm test` is green.
- [x] Baseline typechecks, lint, and build are green or existing failures are
      explicitly isolated.
- [x] Unrelated worktree changes are identified and preserved.
- [x] PR 1 fixtures lock the current JSON serializer behavior.
- [x] Mobile lossless schema compatibility is scheduled with schema 4.

Implementation begins with WP0 and proceeds in dependency order. A later work
package may be prepared in parallel only when it does not assume an unresolved
gate or mutate the same schema/storage surface.
