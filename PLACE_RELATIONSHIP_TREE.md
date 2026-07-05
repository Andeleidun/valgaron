# Place Relationship Tree

This document explains the canonical place taxonomy artifact in `place-relationship-tree.json`. The JSON is the source of truth for supported place categories, category field profiles, relationship-backed place fields, target guidance, and relationship vocabulary. Runtime TypeScript metadata is generated from it by `npm run generate:taxonomies` or the targeted `npm run generate:place-taxonomy`; the app still stores place details flexibly as `Record<string, string>` so the editor can stay easy to evolve.

## Design Goals

The place model should help a writer move through the world like a reader would: from a country to its cities, from a city to its districts and factions, from a river to the towns on its banks, from a fortress to the army that controls it, and from a ruin to the event that destroyed it.

The core data-system rule is that linked facts should not be duplicated as loose text. If a city is located in a country, that relationship should let the city page show its country and the country page show the city. Text fields are still useful for narrative explanation, but the navigable graph should come from typed links.

## Artifact Structure

`place-relationship-tree.json` has six major sections:

1. `relationshipTypes`: canonical relationship semantics such as `located in`, `contains`, `controlled by`, `site of`, and `flows into`.
2. `fieldCatalog`: reusable field definitions, including value type, intended target entries, cardinality, and relationship type where applicable.
3. `commonFieldProfiles`: reusable bundles of fields for broad groups like political places, settlements, natural terrain, water places, built sites, routes, cosmic places, and otherworldly places.
4. `tree`: the logical category hierarchy. Every current place category from the app's `supportedPlaceCategoryOptions` appears as a node. Grouping nodes have `category: null` and exist only to organize the tree.
5. `runtime`: adapter metadata for the current prototype, including which catalog fields are core entry fields and which detail fields render before category selection.
6. `implementationRecommendations`: practical guidance for turning this artifact into editor behavior.

## High-Level Tree

The tree starts at `World`, then branches into broad families:

- Astronomical space: galaxy, nebula, solar system, star, planet, moon, asteroid belt, and space station.
- Otherworldly geography: dimension, plane, and realm.
- Terrestrial macro geography: continents, political territories, settlements, built sites, routes, terrain, water, coasts, islands, and subterranean places.
- Political and administrative places: country, kingdom, province, and region.
- Settlements: capital, city, town, village, hamlet, harbor, and port.
- Built and cultural sites: fortress, castle, temple, ruin, and mine.
- Routes and corridors: road and pass.
- Land biomes and terrain: forest, jungle, desert, swamp, wetland, plains, steppe, tundra, mountain range, mountain, valley, canyon, plateau, volcano, glacier, and cave.
- Water and coastal places: river, lake, ocean, sea, coast, bay, gulf, island, peninsula, and archipelago.

Several grouping nodes are not real selectable categories. They make the relationship tree easier to reason about and can become UI sections, filters, or internal profile groups later.

## Link-Backed Fields

The most important future editor improvement is to treat these fields as relationship-backed selectors:

- `parentPlace`: the immediate container, represented by `located in`.
- `childPlaces`: direct contents, represented by `contains` or inverse `located in`.
- `capital`: a linked place, usually Capital, City, Town, Fortress, or Castle.
- `settlements`: linked inhabited places inside a larger place.
- `districts`: linked local areas inside settlements.
- `regions`: linked subdivisions, biomes, or named areas.
- `neighbors`: adjacent places, represented by `bordered by`.
- `routeConnections`: roads, passes, waterways, ports, harbors, and other connected places.
- `controllingPowers`: factions, characters, or places that currently control the place.
- `claimants`: disputed owners, rival governments, dynasties, factions, or characters.
- `inhabitants`: notable resident characters or factions.
- `founders` and `builders`: founding people, factions, parent colonies, or events.
- `notableEvents`: timeline records that occurred at or changed the place.
- `relatedLore`: lore notes for laws, customs, magic, ecology, myths, hazards, or technology.
- `waters`, `source`, `mouth`, and `tributaries`: hydrological and coastal graph links.

For example, a Country should expose linked settlements, capital, provinces, borders, controlling factions, claimants, trade partners, founding events, and related lore. A City should expose its parent country or province, districts, resident characters, factions, route connections, waters, and local events. A River should expose source, mouth, tributaries, settlements along it, crossings, ports, and downstream connections.

## Category Field Strategy

Every place still needs shared drafting fields: name, alternate names, category, summary, status, tags, history, current tension, secrets, related lore, and notable events. Category-specific fields should then narrow the editor to the questions most relevant to that place type.

Political places need government, population, demographics, economy, defenses, infrastructure, capital, settlements, regions, controlling powers, and claimants.

Settlements need parent place, districts, route connections, residents, factions, economy, defenses, infrastructure, landmarks, founding links, and local events.

Natural places need climate, terrain, hazards, resources, flora and fauna, access, travel time, landmarks, waters, settlements, and related lore.

Water places need source, mouth, tributaries, connected waters, settlements, ports, hazards, navigability, resources, and downstream or coastal relationships.

Built sites need builders, function, condition, controlling powers, inhabitants, access, infrastructure, defenses, events, and related lore.

Routes need endpoints, connected places, access rules, travel time, hazards, controlling powers, strategic value, settlements along the route, and landmarks.

Cosmic and otherworldly places need scale, access rules, hazards, controlling powers, inhabitants, child places, neighboring places, magic or technology, and lore that explains nonstandard physics or cosmology.

## Data Modeling Guidance

Relationship-backed fields should be stored once and displayed from both sides. A `located in` relationship from City to Country should automatically make the Country show that City under settlements or child places. A `flows into` relationship from River to Sea should make the Sea show the River as an incoming watercourse.

The JSON intentionally uses soft target categories. A fantasy world may have a Temple as a capital, a River as a border, a Space station as a port, or a Dimension containing a Kingdom. The editor should suggest likely target categories, sort primary matches first, and show warnings for unusual links, but it should not block creative exceptions during drafting. Some fields can show unusual targets immediately; others can keep the primary list focused and reveal unusual targets only when the writer expands the target list.

`Region` should remain the safe placeholder category. Many places start as "northern region", "haunted zone", or "imperial district" before becoming a province, forest, realm, or wasteland. Category changes should preserve relationships whenever possible.

## Runtime Generation

The JSON is canonical, but the TypeScript app imports generated metadata rather than parsing the root JSON at runtime. This keeps the TypeScript project-reference setup simple and gives tests a clear drift check.

After changing the JSON, run:

```sh
npm run generate:taxonomies
```

This refreshes both generated taxonomy files. For a targeted place-only refresh, `npm run generate:place-taxonomy` updates `packages/core/src/placeRelationshipTree.generated.ts`. Core taxonomy helpers then derive place category options, visible field profiles, relationship-backed field configs, and relationship type suggestions from the generated metadata.

The artifact test suite checks that generated metadata still matches the JSON field catalog, profiles, category tree, shared detail fields, relationship roles, target kinds, target categories, and relationship vocabulary.

## Suggested Implementation Path

1. Keep the current flexible `entry.fields` storage, but add a category-to-field-profile map for visible editor fields.
2. Add relationship-backed field widgets for parent place, child places, settlements, capital, controlling powers, inhabitants, notable events, and related lore.
3. Derive inverse displays instead of asking users to maintain both sides of a relationship.
4. Add lightweight category suggestions based on the selected place category and target category.
5. Later, migrate high-value fields from plain strings to typed field definitions while preserving existing localStorage documents.
