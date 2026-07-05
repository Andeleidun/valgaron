# Character Tree Implementation Plan

This plan records the analysis, implementation path, review findings, and completed fixes for bringing the character logical tree into the current Valgaron frontend and shared data system.

## Current System Analysis

Characters were previously the simplest codex entry type. The seed section in `packages/core/src/seedCodex.ts` exposed four static detail fields: `role`, `home`, `affiliation`, and `statusNote`. These fields were stored in each entry's flexible `fields: Record<string, string>` object and rendered by the shared entry form/detail components.

The frontend path is shared across codex sections:

- `EntryForm` renders base fields for name, summary, notes, tags, status, and pinned state.
- Detail fields come from `getDraftDetailFields(section, draft)`.
- Saved detail display comes from `getEntryDetailFields(section, entry)`.
- `entryFromDraft` saves all draft detail keys plus existing fields so hidden data is not dropped.
- Search indexes both visible fields and any extra saved `entry.fields` values.
- Hidden detail cleanup exists so category-specific place fields do not disappear after a category change.

Places already had a logical tree implementation:

- `place-relationship-tree.json` is the planning artifact.
- `scripts/generatePlaceTaxonomy.cjs` generates `placeRelationshipTree.generated.ts`.
- `placeTaxonomy.ts` turns generated field/profile/category metadata into visible detail fields.
- `EntryForm` already uses the taxonomy helper to conditionally render place fields by selected place category.
- Relationship-backed field controls exist for places, but the implementation is place-specific.

The gap was that characters did not use the taxonomy path. They had no category selector, no profile-based field visibility, no generated runtime metadata, and no first-class support for flexible ancestry/profession fields.

## Character Tree Artifact Review

The character planning artifacts introduced a richer model:

- Character categories describe entity shape, not story role.
- `ancestry` replaces race/species terminology for humanoid lineage concepts and remains creator-defined.
- `profession` replaces class/job/calling concepts and remains creator-defined.
- Link-worthy facts are identified separately from text fields.
- Category families cover sapient people, creatures, constructs, supernatural beings, shapeshifters, collective characters, and succession personas.

Review findings before implementation:

- The artifact shape is more nested than the place artifact, so it needs a character-specific generator rather than direct reuse of the place generator.
- `runtime.sharedDetailFields` was missing, so the runtime did not know which fields to show before category selection.
- The `forms` field incorrectly allowed lore targets under the `identity_of` relationship; lore belongs under transformation rules or related lore.
- The `profession` field incorrectly allowed faction targets while using the `profession_described_by` relationship; faction links belong in `affiliations` or `employerOrPatron`.
- The `succession` field incorrectly allowed timeline targets while using `descended_from`; transfer events belong in `notableEvents`.
- The broad `relationshipGraph` profile made construct and supernatural categories show humanoid-family fields by default. A narrower `storyLinks` profile was needed so categories show their own fields plus broadly useful non-family links.

Those issues were corrected before generating runtime metadata.

## Implementation Plan

1. Keep `character-relationship-tree.json` as the planning source of truth.
2. Add `scripts/generateCharacterTaxonomy.cjs` to flatten the nested character tree and generate TypeScript metadata.
3. Generate supported character categories, field catalog metadata, field profiles, category-to-profile mappings, relationship type vocabulary, and relationship-backed field config metadata.
4. Add `characterTaxonomy.ts` to expose character-specific helpers:
   - supported category options
   - category profile lookup
   - visible field derivation
   - hidden detail detection
   - relationship-backed field metadata for editor controls and migrations
5. Extend the shared taxonomy adapter so `getDraftDetailFields` and `getEntryDetailFields` route both places and characters through their taxonomies.
6. Update the frontend form to pass the full draft details into taxonomy resolution, so character category changes can reshape visible fields immediately.
7. Keep old character fields safe as hidden details instead of deleting them.
8. Add workspace-local suggestions for flexible character values like ancestry and profession without introducing bundled defaults.
9. Update seed data and shared fixtures to use the new first-pass character fields.
10. Add tests for the character taxonomy, artifact-to-runtime alignment, hidden details, suggestions, and existing entry helper behavior.

## Runtime Field Strategy

Before a category is selected, characters show these shared detail fields:

- `characterCategory`
- `narrativeRole`
- `ancestry`
- `profession`
- `homePlace`
- `affiliations`
- `currentStatus`

After a category is selected, the shared fields remain visible and the category's recommended field profiles are appended. This mirrors the place behavior: each record shows shared drafting fields plus the fields relevant to its category.

Ancestry and profession do not receive bundled option lists. They use workspace-local suggestions from values already used in existing character records. Character category receives fixed options from the generated taxonomy because categories drive field visibility.

## Completed Fixes And Improvements

- Added `scripts/generateCharacterTaxonomy.cjs`.
- Added generated runtime metadata in `packages/core/src/characterRelationshipTree.generated.ts`.
- Added `packages/core/src/characterTaxonomy.ts`.
- Extended shared taxonomy routing in `placeTaxonomy.ts` for character sections.
- Added generic hidden-detail handling for entries, while preserving place-specific helpers.
- Updated `WorldDetailField` with `suggestFromExistingValues`.
- Updated suggestion generation so custom flexible values can use workspace-local autocomplete.
- Updated character seed section fields and starter character records.
- Updated the shared React entry form to recalculate visible fields from the full draft.
- Changed hidden-detail UI copy from place-specific to generic.
- Added explicit legacy character import mapping for top-level `role`, `home`, `affiliation`, and `status` values.
- Split broad relationship visibility so humanoid and nonhumanoid sapient categories keep the full relationship graph, while constructs, creatures, supernatural beings, shapeshifters, collectives, and succession personas default to narrower story links.
- Added character taxonomy and artifact alignment tests.
- Added relationship-backed editor controls for saved character records by reusing a generic relationship-field contract.
- Added character relationship labels to the shared relationship type vocabulary.
- Narrowed runtime relationship-backed character field configs to true link-list fields so text fields such as ancestry and profession remain editable text with optional lore-link companion fields.
- Added perspective-aware character relationship grouping for detail views and shared relationship group models.
- Generalized the legacy-link review queue so web and mobile section screens can surface character relationship-backed text as well as place relationship-backed text.
- Added character profile labels to generated taxonomy metadata and grouped editable character detail fields by logical profiles on web and mobile.
- Added browser smoke coverage that opens a selected character directly by route and verifies grouped character fields plus linked relationship-backed controls at desktop and mobile web viewports.
- Fixed direct entry route initialization so character edit URLs preserve the requested selected entry during section reset/loading.
- Renamed the shared relationship-backed field helper module and exported helper names from place-specific terminology to generic relationship-field terminology.
- Added mobile route-adapter coverage for direct character edit routes so Expo Router receives the same `sectionId`, `entryId`, `intent`, and query parameters used by the web workflow route.
- Added mobile character editor parity coverage for direct route resolution, grouped editable character fields, flexible ancestry/profession text values, category suggestions, and relationship-backed linked controls without requiring a native renderer.
- Extracted the mobile entry editor model into a pure helper so `EntriesScreen` and mobile parity tests consume the same grouped-field, hidden-detail, and relationship-backed field model.
- Extended the mobile entry editor model with linked-field display state so selected relationships, target options, filtered options, visible options, and hidden-target messages are computed in the same pure seam used by tests and the screen.
- Fixed mobile direct character edit routes so the selected character and draft are initialized during the first render, not only after route effects run.
- Added a lightweight mocked mobile render smoke for `EntriesScreen` that verifies the direct character edit route renders grouped logical-tree fields and relationship-backed linked controls through the actual screen composition.
- Updated the web entry detail relationship panel to use the shared relationship group model, keeping place, character, and fallback relationship grouping consistent with the mobile screen.
- Extended browser smoke coverage so selected character detail panels must render grouped relationship rows, including Mira Rowan's `member of` link to The Cartographers Guild.
- Added `--check` mode to the place and character taxonomy generators and wired `npm run check:taxonomies` into the main repository check so generated tree metadata cannot silently drift from the JSON artifacts.
- Added shared model coverage for inverse character links on non-tree entry kinds, so faction detail panels keep showing incoming character relationships through the generic linked-record fallback group.
- Added browser smoke coverage for the Cartographers Guild direct route so inverse character links are verified in the rendered faction detail panel.
- Updated shared Help guidance so character category, flexible ancestry/profession values, and relationship-backed character fields are discoverable from the app help model.
- Extended browser smoke coverage for Help so the rendered app must include the character-tree guidance text.
- Added a mocked mobile Help screen render smoke so the shared character-tree guidance is verified through the mobile screen boundary too.
- Fixed the legacy relationship text review queue so exact-only saved text is also surfaced and can be batch-migrated instead of requiring per-entry cleanup.
- Updated entry completeness scoring so migrated relationship-backed fields count as complete when the corresponding relationship link exists.
- Extended browser smoke coverage for selected character edit routes so exact-only legacy relationship text must appear in the review panel with an available migration path.
- Aligned the web legacy relationship review copy with mobile so unresolved text and exact-match availability are described consistently across frontends.
- Extended the mocked mobile `EntriesScreen` render smoke so exact-only legacy relationship text and its migration action are covered at the mobile screen boundary.
- Extended browser smoke interaction coverage so migrating an exact-only character relationship text row removes the legacy review row while preserving the canonical relationship detail.
- Added runtime taxonomy coverage to guard ancestry and profession as creator-defined custom text fields with workspace-local suggestions, not bundled option lists.
- Cleaned the planning artifact so creator-authored text/list fields do not carry relationship metadata; optional links stay on explicit link-list fields such as `ancestryLore`, `professionLore`, and `relatedLore`, with generator and artifact-test coverage guarding that boundary.
- Updated the character-tree explanation document so it describes the same text/list versus link-list boundary as the canonical JSON artifact.
- Added a combined `npm run generate:taxonomies` script so place and character generated taxonomy files can be refreshed together.
- Updated README workflow guidance to include taxonomy artifacts, taxonomy generation, and taxonomy drift checks.
- Added the character relationship tree and implementation plan to the README documentation index.
- Updated the manual release checklist to call out `npm run generate:taxonomies` when taxonomy JSON artifacts change.
- Updated shared Help and the user guide so character relationship-backed examples match true link-list fields, while `forms` remains creator-authored text/list data.
- Updated the web/mobile parity checklist so character logical-tree fields and relationship-backed character controls are tracked as an explicit closed parity item.
- Extended browser Help smoke coverage so rendered web Help must include the corrected relationship-backed character example mentioning related lore.
- Added core relationship-field coverage for exact-only character legacy text migrations so field cleanup is guarded below the browser interaction smoke.
- Added the existing place relationship tree and place implementation plan to the README documentation index so taxonomy planning docs are discoverable as a matched place/character set.
- Updated the long-form frontend parity plan so character logical-tree fields are tracked beside place relationship fields in the debt ledger and feature matrix.
- Updated the place relationship-tree docs to mention the combined `npm run generate:taxonomies` workflow while preserving the targeted place generator command.
- Extended character relationship-field helper coverage so `abilities` and `forms` stay out of relationship-backed configs alongside ancestry and profession.
- Broadened artifact coverage so abilities, ancestry, forms, and profession are all guarded as creator-authored text/list fields without relationship metadata.
- Added duplicate-id guards for character artifact fields, profiles, relationship types, and tree nodes in both the generator and artifact test so generated map metadata and logical-tree identifiers cannot silently collide.
- Added matching duplicate-id guards for place relationship type ids and tree node ids in the place taxonomy generator and artifact test.
- Added non-empty id guards for generated place and character taxonomy identifiers so a single blank field, profile, relationship type, or tree node id cannot enter generated metadata.
- Added character field catalog guards for supported `valueType` and `cardinality` strings so taxonomy typos fail generation and artifact tests instead of degrading editor behavior.
- Added matching place field catalog guards for supported `valueType` strings in the generator and artifact test.
- Added relationship type guards for non-empty labels and supported source/target entry kinds in both place and character taxonomy generators and artifact tests.
- Added relationship-backed field target-kind guards so generated place and character editor controls cannot be created from fields with empty or unsupported target sets.
- Aligned place relationship type scopes with relationship-backed field targets for `connected to` and `controlled by`, then added a generator and artifact-test guard that each place field target kind is supported by its declared relationship type.
- Added place relationship-backed field guards so link fields must use single cardinality and link-list fields must use many cardinality before editor configs are generated.
- Added focused relationship-field coverage for one-cardinality text migration so replacing the primary relationship, deleting extra links, and clearing consumed legacy text are guarded below the UI.
- Fixed saved document parsing so `suggestFromExistingValues` survives `entryTypes` round trips for generated and custom detail fields.
- Tightened legacy character import migration so entry workflow statuses such as `canon` are not copied into the new `currentStatus` prose field.
- Added a character relationship display group for place and movement links, with coverage that every generated character relationship label maps outside the generic fallback group.

## Remaining Opportunities

The major character-tree runtime and editor slices are now implemented. Remaining opportunities are focused on deeper rendered evidence, terminology cleanup, and continued hardening rather than missing core data-model behavior.

Good follow-up targets:

- Add true device or React Native interaction checks once a native interaction harness is available for the prototype.
