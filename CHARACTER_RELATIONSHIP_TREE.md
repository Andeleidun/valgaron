# Character Relationship Tree

This document explains the planning artifact in `character-relationship-tree.json`. The JSON is the structured source for brainstorming character categories, category-specific fields, relationship-backed fields, and field dependencies for Valgaron's local World Codex prototype.

The current app stores character details flexibly as text fields. This artifact does not require an immediate migration. It is a data-systems map for deciding which character fields should display for which category, which fields should become typed links, and which concepts should remain flexible creator-authored values.

## Design Goals

The character model should help writers draft quickly without losing the graph structure that makes a codex useful. A character can be from a place, live in another place, belong to a faction, serve a ruler, owe a debt, have a mentor, appear in a prophecy, and be changed by a timeline event. Those facts should eventually be navigable relationships, not only repeated prose.

The core modeling rule is to separate entity shape from story function:

- Character category answers what kind of entity the record represents.
- Narrative role answers how the story uses that character.
- Ancestry answers humanoid race/species/people/lineage concepts and must stay creator-defined.
- Profession answers class/job/calling/trade concepts and must stay creator-defined.
- Faction, place, lore, and timeline connections should be linked when they name another record.
- Creator-authored text/list fields such as ancestry, profession, abilities, and forms should stay quick drafting fields; optional links belong in explicit companion link fields.

This avoids hardcoded fantasy assumptions while still giving future forms enough structure to show the right fields at the right time.

## Artifact Structure

`character-relationship-tree.json` has these major sections:

1. `classificationPrinciples`: data-model rules for keeping categories, roles, ancestry, profession, and graph links distinct.
2. `relationshipTypes`: canonical relationship semantics such as `resides in`, `member of`, `created by`, `mentor of`, `bound to`, and `participated in`.
3. `fieldCatalog`: reusable field definitions, including value type, cardinality, and relationship metadata only for fields that are true link lists.
4. `commonFieldProfiles`: reusable bundles of fields such as identity, place connections, profession and power, presentation, story engine, relationship graph, creature profile, construct profile, supernatural profile, shapeshifter profile, and collective profile.
5. `tree`: the logical character category hierarchy. Grouping nodes have `category: null`; selectable category nodes list recommended fields, use cases, avoid cases, and link priorities.
6. `fieldRelationshipRules`: dependencies between fields, such as ancestry suggesting culture and lifespan, or profession suggesting affiliation and rank.
7. `runtime`: compatibility notes for the current prototype fields: `role`, `home`, `affiliation`, and `statusNote`.
8. `implementationRecommendations`: practical guidance for turning the artifact into editor behavior.

## High-Level Tree

The tree starts at `Character`, then branches into five broad category families.

`Individual sapient characters` covers person-like characters with identity, social relationships, and decision-making. It includes humanoid people, nonhumanoid sapients, and shapeshifters or variant identities.

`Biological creature characters` covers named animals, companions, familiars, mounts, monsters, and creature-like threats. It emphasizes habitat, behavior, handler links, threat level, abilities, and limitations.

`Artificial or made characters` covers constructs, automatons, artificial intelligences, disembodied minds, animated objects, and manufactured or ritual-made beings. It emphasizes maker, model, directive, autonomy, fuel, and maintenance.

`Supernatural or otherworldly characters` covers spirits, undead, deities, divine figures, avatars, planar beings, and cosmic entities. It emphasizes domains, anchors, manifestations, worshippers, related lore, and timeline events.

`Composite or collective characters` covers hive minds, shared identities, swarms, mantles, reincarnation chains, and succession personas that the story treats as one character. It emphasizes members, spokespersons, shared mind, succession, and identity links.

## Category Strategy

Categories are form profiles, not rigid ontological claims. A writer should be able to draft a ghost as `Spirit or undead`, a god as `Deity or divine figure`, a named mount as `Animal or companion`, or a sentient ship-mind as `Artificial intelligence or disembodied mind`. If an unusual field is useful, the editor should allow it.

The recommended selectable categories are:

- `Humanoid person`
- `Nonhumanoid sapient`
- `Shapeshifter or variant identity`
- `Animal or companion`
- `Monster or threat`
- `Construct or automaton`
- `Artificial intelligence or disembodied mind`
- `Spirit or undead`
- `Deity or divine figure`
- `Cosmic or planar entity`
- `Collective character`
- `Lineage or succession persona`

These categories intentionally do not include specific ancestries or professions. A dwarf, elf, alien, giant, human, or other invented people should be entered as an ancestry value, not as a built-in category. A druid, writer, asteroid miner, surveyor, soldier, scholar, or other invented calling should be entered as a profession value, not as a built-in category.

## Ancestry

`Ancestry` is the preferred field name for concepts often labeled race, species, people, lineage, bloodline, heritage, or origin in fiction tools. It should be flexible text with workspace-local autocomplete from values the creator has already used. The builder should not ship a fixed ancestry list.

High-value related fields:

- `ancestryLore`: links to lore notes defining biology, inherited traits, history, taboos, or social treatment.
- `culture`: distinguishes upbringing, customs, language, or adopted community from ancestry.
- `homeland`: links to places associated with ancestral or cultural origin.
- `lifespan`: captures lifecycle, immortality, service life, reincarnation, or expected age range.
- `languages`: links ancestry and culture to communication systems.
- `appearance`, `abilities`, and `limitations`: capture traits only when relevant to the specific character.

The important data-system point is that ancestry should not carry everything. Culture, nationality, faction membership, profession, title, and home can be separate fields and links.

## Profession

`Profession` is the preferred field name for concepts often labeled class, job, vocation, trade, office, calling, station, or adventuring role. It should be flexible text with workspace-local autocomplete from values the creator has already used. The builder should not ship a fixed profession list.

High-value related fields:

- `professionLore`: links to reusable lore about duties, tools, class traditions, training, or social expectations.
- `affiliations`: links to guilds, armies, faiths, schools, orders, crews, courts, and other factions.
- `rankOrTitle`: names office, license, military grade, clergy rank, noble status, or ritual standing.
- `employerOrPatron`: links to the character, faction, or place that appoints, hires, owns, funds, or commands the character.
- `skills`, `resources`, and `obligations`: capture what the profession lets the character do and what it costs them.

Profession should not replace narrative role. A character can be a druid by profession, a ruler by title, a scout by current assignment, and a mentor by narrative role.

## Link-Backed Fields

The highest-value fields to turn into typed relationships are:

- `homePlace`: a place link using `resides in`.
- `currentLocation`: a place link using `located at`.
- `origin`: place, faction, lore, or timeline links using `originated from`.
- `affiliations`: faction links using `member of`.
- `employerOrPatron`: character, faction, or place links using `employed by`.
- `authorityOver`: character, faction, or place links using `leads`.
- `parents`, `siblings`, `partners`, `children`, and `mentors`: character links.
- `allies`, `rivals`, and `enemies`: character or faction links.
- `obligations`: character, faction, place, or lore links.
- `notableEvents`: timeline links using `participated in`, with specialized relationship types for caused or changed-by events.
- `relatedLore`: lore links for myths, rules, prophecies, customs, artifacts, technologies, and conditions.
- `maker`: creator links for constructs, artificial minds, and made beings.
- `anchor`: binding links for spirits, undead, divine figures, and disembodied minds.
- `spokespersons`, `members`, and `succession`: links for alternate identities, collective characters, and legacy characters.

These links should display inverse facts on the target records. A place should be able to show residents. A faction should be able to show members. A timeline event should be able to show participants. A lore note should be able to show characters it describes or mentions.

## Field Dependency Rules

Several fields imply nearby questions:

- Ancestry suggests ancestry lore, culture, homeland, lifespan, languages, appearance, abilities, and limitations.
- Profession suggests profession lore, affiliations, rank or title, employer or patron, skills, resources, and obligations.
- Home, current location, and origin should remain separate because a character can be from one place, live in another, and currently travel through a third.
- Rank or title should usually link to a faction, place, or lore note that gives it authority or meaning.
- Abilities should be paired with limitations, related lore, condition, and resources when consistency matters.
- Construct categories should emphasize maker, model, directive, autonomy, and maintenance over ancestry and biological family.
- Spirit and undead categories should emphasize anchor, manifestation, domain, origin, and notable events over ordinary residence.
- Collective categories need explicit member, spokesperson, shared mind, and territory modeling.
- Major current-status changes should link back to timeline events when possible.

These rules should be suggestions and warnings, not blockers. The prototype should preserve creative exceptions.

## Current Prototype Mapping

The app currently uses four loose character detail fields:

- `role`
- `home`
- `affiliation`
- `statusNote`

Those can map forward without breaking existing data:

- `role` may become `narrativeRole`, `profession`, or `rankOrTitle`.
- `home` may become `homePlace`, `homeland`, or `origin`.
- `affiliation` may become `affiliations`, `employerOrPatron`, or `rankOrTitle`.
- `statusNote` may become `currentStatus`, `condition`, or `currentGoal`.

The safest first implementation path is to add a character category field plus a small number of high-value fields while keeping all values in the current flexible `fields` object. Relationship-backed selectors can be introduced gradually.

## Recommended First Pass

For the first practical editor improvement, show these fields for most character records:

- `characterCategory`
- `narrativeRole`
- `ancestry`
- `profession`
- `homePlace`
- `affiliations`
- `currentStatus`

Then add category-specific groups:

- Humanoid and nonhumanoid sapients: identity, culture, profession, affiliations, relationships, and events.
- Creatures: habitat, behavior, handler, threat level, abilities, and limitations.
- Constructs and artificial minds: maker, model, directive, autonomy, fuel, and maintenance.
- Spirits, undead, divine, and cosmic beings: domain, anchor, manifestation, worshippers, territory, lore, and events.
- Shapeshifters and variant identities: forms, transformation rules, recognition clues, and secrets.
- Collective and succession characters: members, spokespersons, shared mind, succession, and transfer events.

## Data Modeling Guidance

Prefer graph links for facts that name another record. Use prose fields for ambiguity, secrets, half-formed drafts, private motivation, and details that do not yet deserve their own entry.

Do not require a lore note for every ancestry or profession. Let writers type flexible values quickly. When a value becomes reused or important, suggest a lore note and link it.

Keep text/list drafting fields separate from graph fields. `abilities` and `forms` can remain quick custom lists, while `relatedLore`, `spokespersons`, `members`, and other explicit link-list fields carry navigable records.

Do not require all category fields to be filled. A sparse character draft is still useful. Category profiles should reduce visual noise by showing likely fields first, not enforce a complete ontology.

Do not treat factions as characters unless the story needs a single character-like identity. A guild, army, court, church, school, or house normally belongs in factions. A hive mind, mantle, possessed host-chain, or shared persona can be a character when it acts like one.

Do not treat lore as characters unless the entry has agency. Species, ancestry definitions, bestiary entries, magical rules, rituals, doctrines, and cosmology usually belong in lore. A specific named creature, spirit, god, or sentient machine belongs in characters.
