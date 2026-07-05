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

The markdown explanation now frames the JSON as the canonical taxonomy source for the current prototype. It also identifies the key implementation direction: derive inverse relationship displays and avoid duplicated text once relationship-backed field widgets exist.

## Implementation Strategy

The safest implementation path is staged.

Stage 1 is now implemented: introduce a shared core place taxonomy that maps each supported category to a focused set of visible detail fields. Web and mobile forms use that shared API, and core persistence preserves all detail keys so hidden fields are not lost.

Stage 2 is now implemented: existing saved relationships are grouped under place-specific headings such as location, contained places, control and claims, routes, people and groups, events and lore, origins, and other links. This does not change the save model.

Stage 3 is implemented for the current place-link model: the web and mobile entry editors now expose searchable relationship-backed controls for saved place entries when the entry has no unsaved detail changes. The implemented controls cover parent place, capital, settlements, child places, regions, districts, landmarks, waters, neighbors, route connections, trade partners, controlling powers, claimants, inhabitants, founders, builders, notable events, related lore, river sources, river mouths, and tributaries. Text values from older drafts remain visible as read-only saved text link notes with explicit clear actions.

Stage 4 is now implemented: `place-relationship-tree.json` is the canonical source for place categories, relationship vocabulary, field catalog labels, profile-to-field mappings, category-to-profile mappings, relationship-backed field configs, target categories, current-entry relationship roles, and soft target behavior. `npm run generate:taxonomies` refreshes generated taxonomy metadata, `npm run generate:place-taxonomy` can refresh only `packages/core/src/placeRelationshipTree.generated.ts`, and `placeTaxonomy.ts` consumes that generated metadata instead of maintaining a parallel hand-written taxonomy.

Runtime guard tests now cover both artifact drift and relationship-config integrity: category nodes must match supported runtime categories, relationship-backed fields must match the planning field catalog, relationship vocabularies must align between runtime and the artifact, tree field/profile/category references must stay valid, relationship configs must point only at configured section kinds and supported place categories, and every configured relationship-backed field must be visible for at least one supported place category.

The JSON remains intentionally lightweight as a schema. It owns editor taxonomy and relationship metadata, but saved place values still use flexible string fields. That is the right level of polish for this local creative-drafting prototype: the editor gets a coherent, testable taxonomy without turning every conceptual field into a strict database contract before the product needs that rigidity.

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
- Apply target categories as soft guidance rather than blanket hard filters: preferred fields show primary matches first and lazy-load unusual targets on request, while soft fields such as capital, source, and mouth show unusual targets immediately below primary matches.
- Cap visible preferred target matches in large lists and prompt the user to refine search for hidden preferred matches.
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
- Preferred-versus-unusual target metadata, non-closing unusual-target expansion, and visible result capping that keeps selected records in view.
- Workspace-level review items for legacy relationship text that exact-match migration cannot fully resolve.
- Pure migration operations for applying exact matches from review items without duplicating source/target relationship logic in web and mobile.
- Batch migration operations for applying exact matches across multiple review items without overwriting same-entry field cleanup.
- Conservative candidate suggestions for unresolved fragments based on eligible target record names, with category/section context for review; suggestions are displayed for review only and are not automatically migrated.
- Manual suggestion migration for unresolved fragments, where the writer explicitly links one suggested target and only that fragment is removed from the preserved legacy text.
- Shared display helpers for unresolved fragment labels, exact-match status text, and suggestion labels so web and mobile cleanup queues describe the same review state.

Focused tests cover those shared interaction behaviors without adding a browser or React Native rendering harness to the prototype. As the behavior matures, the next testing priority should be unit and interaction coverage for the shared models and the rendered editor controls, not broad end-to-end infrastructure.

This deliberately stops short of fuzzy or bulk relationship-backed migration. The current controls create and remove relationships, including inverse/source-side water links, and can migrate exact legacy text matches. They intentionally do not guess at partial prose, misspellings, or duplicate record names.

## Reviewed Gaps And Fix Plan

Gap: legacy relationship-backed text migration is conservative.
Root cause: legacy values are free text, not structured references. A value like `Old capital near Reed, formerly claimed by the river cult` may contain a real place name, prose, multiple entities, historical context, and concepts that do not exist as entries yet. Duplicate names are also common in worldbuilding. Automatically converting that text into links can silently create false facts, remove useful prose, or connect the wrong entry.
Current behavior: exact, unambiguous target names can be migrated into relationships. Unresolved text remains visible. Candidate suggestions are shown only as review aids, and manual suggestion migration only links the target the writer explicitly chooses.
Recommended default: keep automatic migration exact-match only. This preserves user intent and avoids surprising graph changes while still removing the tedious cleanup for obvious matches.

Migration options:

1. Keep current conservative migration.
   This is safest and already implemented. Exact matches migrate; ambiguous, partial, or prose fragments stay visible. This is best for a creative drafting tool where preserving notes matters more than aggressive normalization.

2. Add confidence-scored fuzzy suggestions without auto-apply.
   Core could rank possible targets using normalized names, aliases, category fit, section kind, and token overlap. The UI would show "Suggested matches" with confidence labels. The writer still chooses. This improves cleanup speed without risking silent bad links.

3. Add batch review for high-confidence suggestions.
   The system could group suggestions above a strict threshold and let the writer approve several at once. This is useful after interaction tests cover the review flow. It should still require explicit confirmation and show exactly which text will be removed.

4. Add aliases to improve exact matching.
   If entries gain an alias/alternate-name index, exact migration can match known alternate names without fuzzy guessing. This is a good middle ground because it expands deterministic migration while keeping the rule understandable.

5. Add automatic fuzzy migration.
   This is not recommended for the current prototype. It creates the highest risk of false graph edges and lost notes. It would only make sense with undo history, strong review UI, confidence reporting, and a larger test harness.

Gap: the JSON is canonical but runtime imports generated TypeScript.
Root cause: the repo uses TypeScript project references without JSON module imports, and direct root-JSON imports would complicate build settings across web, mobile, and core.
Best path: keep `place-relationship-tree.json` canonical and refresh generated taxonomy metadata with `npm run generate:taxonomies` or the targeted `npm run generate:place-taxonomy`. Coverage tests verify that generated metadata matches the JSON source.

Gap: relationship types in the current app remain a broad string list.
Root cause: existing relationships are intentionally generic and user-extensible.
Best path: extend relationship suggestions with place-tree types while preserving custom strings.

Gap: full rendered frontend interaction tests are still thin.
Root cause: Jest currently runs in a Node environment without React DOM or React Native testing-library setup. Shared relationship-field behavior is now covered in core, but actual rendered control clicks and form dirty-state messages are not exercised through a component harness.
Best path: focus next on unit and interaction tests. Keep pure core unit tests for taxonomy, target filtering, migration operations, and route/state models. Add rendered interaction tests for the web and mobile place editors once the behavior stabilizes: category changes should update visible fields, linked-field controls should preserve selected targets, unusual-target expansion should not close the option list, dirty drafts should block relationship edits, and migration buttons should leave unresolved text intact.

## Next Implementation Plan

1. Keep `place-relationship-tree.json` canonical and run `npm run generate:taxonomies` after taxonomy edits.
2. Add unit coverage for any new migration heuristics before adding rendered interaction coverage.
3. Add rendered web/mobile interaction tests after the place editor behavior stabilizes.
4. Keep automatic migration exact-match only unless a future review UI explicitly supports confidence-scored batch approvals.
