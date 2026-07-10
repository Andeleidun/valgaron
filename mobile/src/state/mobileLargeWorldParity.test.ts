import { describe, expect, it } from '@jest/globals';
import {
  createSeedWorldDocument,
  getActiveWorld,
  getEntryListModel,
  getLimitedResultModel,
  getRelationshipEntryPickerItems,
  getRelationshipListModel,
  mobileFeatureDisplayLimits,
  type WorldEntry,
  type WorldRelationship,
  type WorldWorkspace,
} from '@valgaron/core';

function createCharacter(index: number): WorldEntry {
  const id = `character-bulk-${String(index).padStart(3, '0')}`;
  return {
    id,
    kind: 'character',
    name: `Bulk Character ${String(index).padStart(3, '0')}`,
    summary: 'Large-world reachability fixture.',
    status: 'draft',
    pinned: false,
    tags: ['bulk'],
    fields: {
      affiliation: '',
      home: '',
      role: 'supporting cast',
      statusNote: '',
    },
    images: [],
    notes: '',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  };
}

function createLargeMobileWorld(): WorldWorkspace {
  const seedWorld = getActiveWorld(createSeedWorldDocument());
  const needleCharacter: WorldEntry = {
    ...createCharacter(999),
    id: 'character-needle',
    name: 'Needle Character',
    summary: 'Findable by mobile search after default list capping.',
    tags: ['needle'],
  };
  const bulkCharacters = Array.from({ length: 72 }, (_, index) =>
    createCharacter(index)
  );
  const relationships: WorldRelationship[] = bulkCharacters
    .slice(0, 56)
    .map((character, index) => ({
      id: `relationship-bulk-${String(index).padStart(3, '0')}`,
      sourceEntryId: character.id,
      targetEntryId: 'faction-cartographers-guild',
      type: 'member of',
      directional: true,
      status: 'draft',
      note: 'Bulk relationship fixture.',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    }));
  relationships.push({
    id: 'relationship-needle',
    sourceEntryId: needleCharacter.id,
    targetEntryId: 'faction-cartographers-guild',
    type: 'needle alliance',
    directional: true,
    status: 'draft',
    note: 'Findable by mobile relationship search.',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  });

  return {
    ...seedWorld,
    codex: {
      ...seedWorld.codex,
      characters: [...bulkCharacters, needleCharacter],
    },
    relationships: [...seedWorld.relationships, ...relationships],
  };
}

describe('mobile large-world parity', () => {
  it('keeps capped mobile entry lists reachable through search', () => {
    const world = createLargeMobileWorld();
    const characterSection = world.entryTypes.find(
      (section) => section.id === 'characters'
    );

    expect(characterSection).toBeDefined();
    const allEntries = getEntryListModel(world, characterSection!, '', {
      sortKey: 'name',
    });
    const defaultDisplay = getLimitedResultModel(
      allEntries,
      mobileFeatureDisplayLimits.entryResults
    );
    const searchedDisplay = getLimitedResultModel(
      getEntryListModel(world, characterSection!, 'Needle Character', {
        sortKey: 'name',
      }),
      mobileFeatureDisplayLimits.entryResults
    );

    expect(defaultDisplay.hiddenCount).toBeGreaterThan(0);
    expect(
      defaultDisplay.visibleItems.map((entry) => entry.name)
    ).not.toContain('Needle Character');
    expect(searchedDisplay.visibleItems.map((entry) => entry.name)).toEqual([
      'Needle Character',
    ]);
  });

  it('keeps capped mobile relationship pickers and lists reachable through search', () => {
    const world = createLargeMobileWorld();
    const defaultPickerDisplay = getLimitedResultModel(
      getRelationshipEntryPickerItems(world.codex, world.entryTypes, ''),
      mobileFeatureDisplayLimits.pickerResults
    );
    const searchedPickerDisplay = getLimitedResultModel(
      getRelationshipEntryPickerItems(
        world.codex,
        world.entryTypes,
        'Needle Character'
      ),
      mobileFeatureDisplayLimits.pickerResults
    );
    const defaultRelationshipDisplay = getLimitedResultModel(
      getRelationshipListModel(world),
      mobileFeatureDisplayLimits.relationshipResults
    );
    const searchedRelationshipDisplay = getLimitedResultModel(
      getRelationshipListModel(world, { query: 'needle alliance' }),
      mobileFeatureDisplayLimits.relationshipResults
    );

    expect(defaultPickerDisplay.hiddenCount).toBeGreaterThan(0);
    expect(
      defaultPickerDisplay.visibleItems.map((entry) => entry.name)
    ).not.toContain('Needle Character');
    expect(
      searchedPickerDisplay.visibleItems.map((entry) => entry.name)
    ).toEqual(['Needle Character']);
    expect(defaultRelationshipDisplay.hiddenCount).toBeGreaterThan(0);
    expect(
      searchedRelationshipDisplay.visibleItems.map(
        (relationship) => relationship.type
      )
    ).toEqual(['needle alliance']);
  });
});
