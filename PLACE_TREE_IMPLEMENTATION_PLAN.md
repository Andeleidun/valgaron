# Place Tree Implementation Plan

## Current System Analysis

The current runtime model has one `place` entry kind. A place is a generic `WorldEntry` whose specialized data lives in `entry.fields`, a `Record<string, string>`. The web and mobile frontends read the active section configuration and render every `section.detailFields` item for every entry in that section. For places, that means every place currently gets exactly these fields: `category`, `region`, `climate`, and `significance`.

This is simple and migration-friendly, but it cannot express the logical tree from `place-relationship-tree.json`. A Country, River, City, Temple, Plane, and Space station all render the same place form, so the UI does not guide the writer toward the relevant questions for the category they selected.

The most important data risk is save-time field loss. Before this change, `entryFromDraft` persisted only keys listed in `section.detailFields`. If the frontend rendered category-specific fields without changing persistence, those values would be dropped on save. Existing unknown fields imported from a future schema, custom experiments, or category changes would also be at risk.

Search and completeness also depended on static section fields. That meant dynamic fields would be invisible to search and drafting prompts unless they were routed through a shared field-selection API.

The relationship system is currently generic. It can connect any two entries with a type string, but it does not know that a Country's `settlements` field should be backed by `contains` or inverse `located in`, or that a River's `mouth` should be backed by `flows into`. Relationship-backed editors are therefore a second phase, not a safe first step.

## Planning Artifact Analysis

`place-relationship-tree.json` is comprehensive enough to drive product and schema work:

- It covers all 57 current place categories.
- It separates reusable field definitions from category nodes.
- It identifies relationship-backed fields and likely target entry kinds.
- It uses grouping nodes to make the category tree easier to reason about.
- It recommends soft constraints, inverse displays, and relationship-backed links.

The artifact is intentionally broader than the current runtime. Some target hints mention aspirational categories such as bridges, markets, oases, or craters that are not selectable place categories today. That is acceptable in a planning document, but runtime code should constrain itself to the current category list until new categories are intentionally added.

The markdown explanation correctly frames the JSON as a planning artifact rather than a committed schema. It also identifies the key implementation direction: derive inverse relationship displays and avoid duplicated text once relationship-backed field widgets exist.

## Implementation Strategy

The safest implementation path is staged.

Stage 1 is now implemented: introduce a shared core place taxonomy that maps each supported category to a focused set of visible detail fields. Web and mobile forms use that shared API, and core persistence preserves all detail keys so hidden fields are not lost.

Stage 2 is now implemented: existing saved relationships are grouped under place-specific headings such as location, contained places, control and claims, routes, people and groups, events and lore, origins, and other links. This does not change the save model.

Stage 3 is implemented for the current place-link model: the web and mobile entry editors now expose searchable relationship-backed controls for saved place entries when the entry has no unsaved detail changes. The implemented controls cover parent place, capital, settlements, child places, regions, districts, landmarks, waters, neighbors, route connections, trade partners, controlling powers, claimants, inhabitants, founders, builders, notable events, related lore, river sources, river mouths, and tributaries. Text values from older drafts remain visible as read-only saved text link notes with explicit clear actions.

Stage 4 should decide whether the planning JSON becomes canonical generated source or remains a product/data design artifact with runtime coverage tests. The current implementation keeps runtime metadata in TypeScript because the JSON includes intentionally aspirational categories and relationship concepts beyond the current prototype's editor controls.

Runtime guard tests now cover both artifact drift and relationship-config integrity: category nodes must match supported runtime categories, relationship-backed fields must be documented by the planning field catalog, relationship configs must point only at configured section kinds and supported place categories, and every configured relationship-backed field must be visible for at least one supported place category.

## Stage 1 Changes

The implemented first pass adds `packages/core/src/placeTaxonomy.ts` with:

- The supported category list used by seed config.
- Shared place fields that preserve current behavior: `category`, `region`, `climate`, and `significance`.
- Reusable field profiles for political places, settlements, maritime settlements, built sites, routes, natural terrain, mountain systems, water places, island/coastal places, cosmic places, and otherworldly places.
- Category-to-profile mappings covering all 57 current categories.
- APIs for entry-specific and draft-specific visible fields.

Core entry helpers now:

- Search all saved field values, not just static section fields.
- Build drafts from all existing entry fields plus currently visible fields.
- Persist the union of static fields, currently visible fields, existing saved fields, and draft fields.
- Use dynamic fields for completeness prompts.

Web and mobile entry forms now:

- Render static fields for non-place sections.
- Render shared place fields when no category is selected.
- Render category-specific place fields as soon as a category is selected.
- Keep using the same local `entry.fields` storage format.

## Stage 2 Changes

The second pass adds category-aware relationship grouping without changing stored relationship data.

Core relationship helpers now:

- Group attached place relationships into semantic buckets.
- Preserve arbitrary custom relationship types under `Other links`.
- Use place-category-aware labels for contained-place and route groups.
- Derive relationship type suggestions from the taxonomy so place-tree types are available in the relationship editor.

Web and mobile detail views now:

- Render grouped linked records for place entries.
- Keep non-place linked records in the existing flat relationship flow.
- Show saved but currently hidden place details in a read-only `Hidden place details` section.

The hidden detail review intentionally does not make stale category fields part of the active category form. It exposes preserved values so they are not invisible after a category change or import.

## Stage 3 Changes

The third pass adds relationship-backed editing for place fields that can be represented as explicit relationships.

Core taxonomy now defines `placeRelationshipFieldConfigs` for:

- `parentPlace` as `located in`.
- `capital` as `has capital`.
- `settlements` as `contains`.
- `childPlaces` as `contains`.
- `regions` as `contains`.
- `districts` as `contains`.
- `landmarks` as `contains`.
- `waters` as `contains`.
- `neighbors` as `bordered by`.
- `routeConnections` as `connected to`.
- `tradePartners` as `connected to`.
- `controllingPowers` as `controlled by`.
- `claimants` as `claimed by`.
- `inhabitants` as `home of`.
- `founders` as `founded by`.
- `builders` as `built by`.
- `notableEvents` as `site of`.
- `relatedLore` as `references`.
- `source` as incoming `flows into`.
- `mouth` as `flows into`.
- `tributaries` as incoming `flows into`.

Web and mobile editors now:

- Replace those fields with relationship controls for saved place entries.
- Gate relationship edits while entry details are dirty, because available link fields can depend on an unsaved category.
- Search target options per field while keeping already-selected targets visible.
- Cap visible target matches in large lists and prompt the user to refine search for hidden matches.
- Keep relationship-backed text values visible as read-only notes with explicit clear actions.
- Offer exact-match migration for legacy text notes: unambiguous target names are converted into relationships, unresolved text remains, and the cleaned field value is saved with the migration action.
- Let users clear preserved hidden place detail values deliberately.
- Use lightweight unlink operations for field toggles while preserving recovery snapshots for explicit relationship deletes from relationship-management flows.
- Surface unresolved legacy relationship text in web and mobile place sections so users can jump to affected entries for manual cleanup, migrate per-field exact matches, or migrate all visible exact matches from the review queue.

Shared core helpers now own the relationship-backed field behaviors both frontends use:

- Eligible target option discovery.
- Source/target role-aware relationship matching.
- Relationship construction for direct and inverse fields.
- Search filtering that retains selected records.
- Visible result capping that keeps selected records in view.
- Workspace-level review items for legacy relationship text that exact-match migration cannot fully resolve.
- Pure migration operations for applying exact matches from review items without duplicating source/target relationship logic in web and mobile.
- Batch migration operations for applying exact matches across multiple review items without overwriting same-entry field cleanup.
- Conservative candidate suggestions for unresolved fragments based on eligible target record names, with category/section context for review; suggestions are displayed for review only and are not automatically migrated.
- Shared display helpers for unresolved fragment labels, exact-match status text, and suggestion labels so web and mobile cleanup queues describe the same review state.

Focused tests cover those shared interaction behaviors without adding a browser or React Native rendering harness to the prototype.

This deliberately stops short of fuzzy or bulk relationship-backed migration. The current controls create and remove relationships, including inverse/source-side water links, and can migrate exact legacy text matches. They intentionally do not guess at partial prose, misspellings, or duplicate record names.

## Reviewed Gaps And Fix Plan

Gap: legacy relationship-backed text migration is exact-match only.
Root cause: legacy values are free text and may contain names, prose, multiple entities, duplicate names, or unresolved concepts that do not map safely to existing entry IDs.
Best path: keep exact-match migration as the safe default. Core exposes review items plus per-item and batch exact-match migration operations for unresolved fragments, and web/mobile place sections now show a compact cleanup queue with read-only candidate suggestions instead of fuzzy auto-linking.

Gap: the planning JSON is not imported directly by runtime code.
Root cause: the repo uses TypeScript project references without JSON module imports, and the planning JSON contains documentation-only details.
Best path: keep runtime taxonomy as typed TypeScript and treat `place-relationship-tree.json` as a planning artifact. Coverage tests now verify that runtime place categories match JSON category nodes and that runtime relationship-backed fields are documented in the JSON field catalog. If the JSON becomes canonical later, add a build-time generation script rather than importing root JSON into core.

Gap: relationship types in the current app remain a broad string list.
Root cause: existing relationships are intentionally generic and user-extensible.
Best path: extend relationship suggestions with place-tree types while preserving custom strings.

Gap: full rendered frontend interaction tests are still thin.
Root cause: Jest currently runs in a Node environment without React DOM or React Native testing-library setup. Shared relationship-field behavior is now covered in core, but actual rendered control clicks and form dirty-state messages are not exercised through a component harness.
Best path: keep shared behavior covered in core. Add rendered web/mobile interaction tests later only if the project adopts a stable frontend test harness.

## Next Implementation Plan

1. Add rendered web/mobile interaction tests if the project adopts a stable frontend test harness.
2. Revisit generated taxonomy only if the planning JSON becomes a product-owned canonical schema.
3. Consider click-to-fill unresolved suggestions only after the editor has a clear manual confirmation flow; keep automatic migration exact-match only.
