# Place Relationship Tree

This document explains the planning artifact in `place-relationship-tree.json`. It is meant for product and data-model brainstorming, not as a committed runtime schema. The current app stores all place details as flexible string fields, so this tree describes which future fields should display for each place category and which fields should be backed by relationships to other Codex entries.

## Design Goals

The place model should help a writer move through the world like a reader would: from a country to its cities, from a city to its districts and factions, from a river to the towns on its banks, from a fortress to the army that controls it, and from a ruin to the event that destroyed it.

The core data-system rule is that linked facts should not be duplicated as loose text. If a city is located in a country, that relationship should let the city page show its country and the country page show the city. Text fields are still useful for narrative explanation, but the navigable graph should come from typed links.

## Artifact Structure

`place-relationship-tree.json` has five major sections:

1. `relationshipTypes`: canonical relationship semantics such as `located in`, `contains`, `controlled by`, `site of`, and `flows into`.
2. `fieldCatalog`: reusable field definitions, including value type, intended target entries, cardinality, and relationship type where applicable.
3. `commonFieldProfiles`: reusable bundles of fields for broad groups like political places, settlements, natural terrain, water places, built sites, routes, cosmic places, and otherworldly places.
4. `tree`: the logical category hierarchy. Every current place category from the app's `supportedPlaceCategoryOptions` appears as a node. Grouping nodes have `category: null` and exist only to organize the tree.
5. `implementationRecommendations`: practical guidance for turning this artifact into editor behavior.

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

The JSON intentionally uses soft target categories. A fantasy world may have a Temple as a capital, a River as a border, a Space station as a port, or a Dimension containing a Kingdom. The editor should suggest likely target categories and show warnings for unusual links, but it should not block creative exceptions during drafting.

`Region` should remain the safe placeholder category. Many places start as "northern region", "haunted zone", or "imperial district" before becoming a province, forest, realm, or wasteland. Category changes should preserve relationships whenever possible.

## Suggested Implementation Path

1. Keep the current flexible `entry.fields` storage, but add a category-to-field-profile map for visible editor fields.
2. Add relationship-backed field widgets for parent place, child places, settlements, capital, controlling powers, inhabitants, notable events, and related lore.
3. Derive inverse displays instead of asking users to maintain both sides of a relationship.
4. Add lightweight category suggestions based on the selected place category and target category.
5. Later, migrate high-value fields from plain strings to typed field definitions while preserving existing localStorage documents.
