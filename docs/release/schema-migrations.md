# Schema Migrations

Valgaron World Codex stores local documents with an explicit schema version.

## Current Schema

- Current world document schema: `4`
- Current web storage key: `valgaron.worldDocument.v4`
- Current mobile storage key: `valgaron.mobile.worldDocument.v4`

Schema version `4` adds:

- per-entry ordered image references with URI, alternative text, caption, and
  explicit decorative state;
- document-level immutable uploaded-image metadata;
- generated `images/<asset-id>.<ext>` paths for uploaded bytes;
- HTTPS remote image URI references;
- exact-JSON ZIP packaging with reachable uploaded image files;
- schema 3 migration with empty image and asset arrays.

Uploaded bytes are intentionally outside the JSON document: browser IndexedDB
on web and app-managed files on mobile. The JSON asset catalog records filename,
verified MIME, size, SHA-256, and creation time.

Schema version `3` established:

- multiple project/universe workspaces;
- in-fiction worlds and planets inside each workspace;
- custom entry type definitions;
- workspace-owned vocabulary registries;
- sparse built-in field overrides;
- codex entries grouped by entry type;
- relationships;
- recovery snapshots stored separately.

## Previous Shapes And Migration

Valid schema 3 documents are migrated deterministically in memory by adding
empty `images` arrays to entries, an empty document `assets` catalog, and schema
version 4. Web and mobile read the v4 key first and then their legacy v3 key.
They write only v4 and do not remove the v3 value before a v4 save succeeds.

The earlier schema 2 and single-world schema 1 shapes remain unsupported. If no
valid current or migratable document exists, the app opens starter data with
recovery guidance.

## Schema 4 Image Invariants

- Persisted remote images use absolute HTTPS URIs.
- Persisted uploads use only generated `images/...` URIs.
- `blob:`, `data:`, `file:`, picker/content, unsafe relative, and protocol-
  relative sources are rejected.
- Every upload reference has exactly one asset metadata row and reachable local
  binary for a complete ZIP.
- Informative images require alternative text; decorative images store an
  explicit flag and empty alternative text.
- SVG and unknown image content are rejected.
- Limits are six images per entry, 10 MB per image, and 100 MB of reachable
  uploaded bytes per ZIP.
- Remote image bytes are never fetched during export.

## Adding A Future Schema

Do not introduce schema 5 for review-only Knowledge behavior. Schema `4`
already supports images plus the schema 3 custom entry types and fields stored in entry type
definitions, relationship-backed records, workspace-owned vocabularies, scoped
field overrides, and hidden detail cleanup. Add a future schema only when a
product decision requires new durable document data that cannot be represented
by the current schema.

The following schema 3 notes are retained as historical design context; schema
4 and the v4 storage keys above are the current runtime contract.

Schema `3` established the vocabulary editing baseline. It used a
clean break because there are no live users or live data, stores
workspace-owned vocabularies, and supports scoped built-in field overrides for
labels, help text, visibility, order, and vocabulary attachment.

The approved schema `3` design direction is:

- a flat workspace vocabulary registry;
- vocabulary values with label, description, aliases, status, and sort order;
- sparse built-in field overrides keyed by stable entry type and field ids;
- hidden built-in fields that hide from editors without deleting saved values;
- a browser Knowledge Vocabulary Manager as the first UI slice;
- focused mobile More vocabulary editing for value metadata and ordering, while
  deeper built-in field configuration remains browser-first.

The approved schema `3` behavior direction is:

- seed editable neutral default vocabularies for built-in fields;
- expose observed entry values as review candidates instead of auto-promoting
  them into durable vocabularies;
- support per-field vocabulary enforcement with suggestion-only as the default
  and restricted-value validation as an opt-in field setting;
- treat aliases as search and match helpers only, not automatic value
  normalization;
- use active and archived vocabulary value statuses only;
- make the first browser field-configuration slice cover vocabulary attachment
  and visibility before label, help text, and order editing.

The approved schema `3` implementation direction is:

- use `valgaron.worldDocument.v3` as the new storage key;
- implement core schema, import/export, diagnostics, and tests before browser
  Knowledge, mobile More, or editor integration;
- ship Vocabulary Manager persistence before editor suggestions;
- add restricted vocabulary validation in the same slice as editor suggestions;
- require the full release evidence bar before schema `3` is considered
  complete;
- preserve humane recovery behavior for unreadable or invalid current local data
  by showing starter data plus recovery/Data guidance.

Additional approved schema `3` model decisions:

- vocabulary and value ids use stable generated slugs with collision suffixes;
- seeded vocabularies attach automatically to matching built-in fields;
- initial seeds cover Characters, Places, Factions, Lore, and Timeline;
- duplicate active value labels are blocked within a vocabulary;
- re-adding an archived label restores that archived value;
- value order is manual first with alphabetical fallback;
- observed candidates come from the active workspace only;
- observed candidates can be accepted, ignored, or merged into an existing value
  as an alias;
- hidden fields appear in an expandable Hidden values detail block when saved
  data exists;
- durable Vocabulary Manager replaces passive vocabulary review inside
  Knowledge;
- mobile More uses a compact vocabulary list/detail editing flow;
- full-document import replaces the document wholesale after validation, with a
  single warning when schema or vocabulary replacement impact needs to be called
  out;
- Markdown reference export includes vocabularies;
- diagnostics include vocabulary counts only, not labels, descriptions, or
  aliases;
- the first implementation slice is core schema `3`, seed vocabularies,
  export/import, and diagnostics tests only.

When adding schema `5` or later:

1. decide whether a previous parser or migration path is needed; with no live
   users or live data, a clean break is acceptable;
2. add fixtures for the previous and new schema shapes;
3. add tests for load, import, export, diagnostics, active workspace selection,
   and fallback behavior;
4. update the storage key only when necessary;
5. review service worker cache behavior so stale app code does not strand users
   with a document that requires newer migration logic;
6. document the change in `CHANGELOG.md`, `docs/versioning.md`, and this file.

## Recovery Principle

Invalid or unreadable local storage must not blank the app. The app should load
starter data, explain the recovery state on Data, and encourage JSON export
before risky changes.
