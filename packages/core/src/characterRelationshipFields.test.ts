import { describe, expect, it } from '@jest/globals';
import { relationshipTypeOptions } from './codexRelationships';
import {
  characterRelationshipFieldConfigs,
  type CharacterRelationshipFieldConfig,
} from './characterTaxonomy';
import {
  getRelationshipFieldLinks,
  getRelationshipFieldTargetId,
  getRelationshipTargetOptions,
  makeFieldRelationship,
  type RelationshipFieldConfig,
} from './relationshipFields';
import type {
  WorldCodex,
  WorldEntry,
  WorldRelationship,
  WorldSectionConfig,
} from './types';

const characterSection: WorldSectionConfig = {
  id: 'characters',
  kind: 'character',
  title: 'Characters',
  singularTitle: 'Character',
  description: '',
  detailFields: [],
};

const placeSection: WorldSectionConfig = {
  id: 'places',
  kind: 'place',
  title: 'Places',
  singularTitle: 'Place',
  description: '',
  detailFields: [],
};

const factionSection: WorldSectionConfig = {
  id: 'factions',
  kind: 'faction',
  title: 'Factions',
  singularTitle: 'Faction',
  description: '',
  detailFields: [],
};

function makeEntry(
  id: string,
  kind: string,
  name: string,
  fields: Record<string, string> = {}
): WorldEntry {
  return {
    id,
    kind,
    name,
    summary: `${name} summary`,
    notes: '',
    tags: [],
    status: 'draft',
    pinned: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    fields,
    images: [],
  };
}

function toRelationshipFieldConfig(
  config: CharacterRelationshipFieldConfig
): RelationshipFieldConfig {
  return {
    fieldKey: config.fieldKey,
    label: config.label,
    relationshipType: config.relationshipTypeLabel,
    directional: config.directional,
    cardinality: config.cardinality,
    currentEntryRole: config.currentEntryRole,
    targetEntryKinds: config.targetEntryKinds,
  };
}

function requireConfig(fieldKey: string): RelationshipFieldConfig {
  const config = characterRelationshipFieldConfigs.find(
    (item) => item.fieldKey === fieldKey
  );
  if (!config) {
    throw new Error(`Expected character relationship config ${fieldKey}.`);
  }
  return toRelationshipFieldConfig(config);
}

function makeRelationship(
  sourceEntryId: string,
  targetEntryId: string,
  type: string
): WorldRelationship {
  return {
    id: `relationship-${sourceEntryId}-${targetEntryId}-${type}`,
    sourceEntryId,
    targetEntryId,
    type,
    directional: true,
    note: '',
    status: 'draft',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

const codex = {
  characters: [
    makeEntry('character-mira', 'character', 'Mira Rowan'),
    makeEntry('character-parent', 'character', 'Aren Rowan'),
    makeEntry('character-mentor', 'character', 'Sera Venn'),
  ],
  places: [
    makeEntry('place-harbor', 'place', 'Northwatch Harbor', {
      category: 'Town',
    }),
  ],
  factions: [makeEntry('faction-guild', 'faction', 'Cartographers Guild')],
  lore: [],
  timeline: [],
} as WorldCodex;

describe('character relationship-backed field helpers', () => {
  it('exposes only link-list character fields as relationship-backed configs', () => {
    const fieldKeys = characterRelationshipFieldConfigs.map(
      (config) => config.fieldKey
    );

    expect(fieldKeys).toEqual(expect.arrayContaining(['homePlace', 'parents']));
    expect(fieldKeys).not.toContain('abilities');
    expect(fieldKeys).not.toContain('ancestry');
    expect(fieldKeys).not.toContain('forms');
    expect(fieldKeys).not.toContain('profession');
  });

  it('adds character relationship labels to the shared relationship vocabulary', () => {
    expect(relationshipTypeOptions).toEqual(
      expect.arrayContaining(['child of', 'mentor of', 'created by'])
    );
  });

  it('builds character target options from configured target entry kinds', () => {
    const homeConfig = requireConfig('homePlace');
    const affiliationConfig = requireConfig('affiliations');
    const character = codex.characters[0];

    expect(
      getRelationshipTargetOptions({
        codex,
        config: homeConfig,
        sections: [characterSection, placeSection, factionSection],
        currentEntry: character,
      }).map((option) => option.entry.id)
    ).toEqual(['place-harbor']);

    expect(
      getRelationshipTargetOptions({
        codex,
        config: affiliationConfig,
        sections: [characterSection, placeSection, factionSection],
        currentEntry: character,
      }).map((option) => option.entry.id)
    ).toEqual(['faction-guild']);
  });

  it('creates parent and mentor links with the current character on the configured side', () => {
    const parentConfig = requireConfig('parents');
    const mentorConfig = requireConfig('mentors');
    const character = codex.characters[0];

    expect(
      makeFieldRelationship(character, parentConfig, 'character-parent')
    ).toMatchObject({
      sourceEntryId: 'character-mira',
      targetEntryId: 'character-parent',
      type: 'child of',
      directional: true,
    });

    expect(
      makeFieldRelationship(character, mentorConfig, 'character-mentor')
    ).toMatchObject({
      sourceEntryId: 'character-mentor',
      targetEntryId: 'character-mira',
      type: 'mentor of',
      directional: true,
    });
  });

  it('finds character field links and target ids using current-entry role metadata', () => {
    const parentConfig = requireConfig('parents');
    const mentorConfig = requireConfig('mentors');
    const character = codex.characters[0];
    const relationships = [
      makeRelationship('character-mira', 'character-parent', 'child of'),
      makeRelationship('character-mentor', 'character-mira', 'mentor of'),
    ];

    const parentLinks = getRelationshipFieldLinks(
      relationships,
      character,
      parentConfig
    );
    const mentorLinks = getRelationshipFieldLinks(
      relationships,
      character,
      mentorConfig
    );

    expect(getRelationshipFieldTargetId(parentLinks[0], parentConfig)).toBe(
      'character-parent'
    );
    expect(getRelationshipFieldTargetId(mentorLinks[0], mentorConfig)).toBe(
      'character-mentor'
    );
  });
});
