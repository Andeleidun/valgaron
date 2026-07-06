# Schema Migrations

Valgaron World Codex stores local documents with an explicit schema version.

## Current Schema

- Current world document schema: `2`
- Current storage key: `valgaron.worldDocument.v2`
- Legacy codex storage key: `valgaron.worldCodex.v1`

Schema version `2` supports:

- multiple project/universe workspaces;
- in-fiction worlds and planets inside each workspace;
- custom entry type definitions;
- codex entries grouped by entry type;
- relationships;
- recovery snapshots stored separately.

## Supported Legacy Shape

The earlier `valgaron.worldCodex.v1` shape is migrated into a schema `2`
document with one active workspace named `Migrated Workspace`.

The core schema migration path is covered by
`packages/core/src/worldDocument.test.ts`; browser storage fallback and legacy
load behavior are covered by `src/Utlilities/codexStorage.test.ts`.

## Adding A Future Schema

Do not introduce schema `3` for review-only Knowledge behavior. The current
schema `2` already supports custom entry types, custom fields stored in entry
type definitions, relationship-backed records, observed vocabulary review, and
hidden detail cleanup. Add schema `3` only when a product decision requires new
durable document data, such as workspace-owned editable vocabularies or built-in
field definitions that cannot be represented by the current `WorldDetailField`
metadata.

The next approved schema track is schema `3` for durable schema and vocabulary
editing. It should use a clean break because there are no live users or live
data, store workspace-owned vocabularies, and support scoped built-in field
overrides for labels, help text, visibility, order, and vocabulary attachment.
Schema `2` remains the current runtime schema until that implementation lands.

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
- preserve humane recovery behavior for unreadable or unsupported local data by
  showing starter data plus recovery/Data guidance.

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

When adding schema `3` or later:

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
