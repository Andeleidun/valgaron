import { describe, expect, it } from '@jest/globals';
import {
  createEmptyRelationshipDraft,
  deleteRelationship,
  deleteRelationshipsForEntry,
  findEntryById,
  filterRelationships,
  getEntryRelationships,
  getRelationshipGraph,
  relationshipFromDraft,
  upsertRelationship,
} from './codexRelationships';
import { createSeedCodex, worldSections } from './seedCodex';
import type { WorldRelationship } from '../types';

const fixedRelationship: WorldRelationship = {
  id: 'relationship-sera-registry',
  sourceEntryId: 'character-sera-vall',
  targetEntryId: 'faction-lantern-registry',
  type: 'member of',
  directional: true,
  note: 'Sera keeps witness ledgers for the Registry.',
  status: 'canon',
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-01T09:00:00.000Z',
};

describe('codexRelationships', () => {
  it('creates a blank relationship draft with safe defaults', () => {
    expect(createEmptyRelationshipDraft()).toEqual({
      sourceEntryId: '',
      targetEntryId: '',
      type: 'member of',
      directional: true,
      note: '',
      status: 'draft',
    });
  });

  it('converts a draft into a saved relationship', () => {
    const relationship = relationshipFromDraft({
      sourceEntryId: 'character-sera-vall',
      targetEntryId: 'faction-lantern-registry',
      type: ' member of ',
      directional: true,
      note: ' Keeps ledgers. ',
      status: 'canon',
    });

    expect(relationship.id).toMatch(/^relationship-member-of-/);
    expect(relationship.type).toBe('member of');
    expect(relationship.note).toBe('Keeps ledgers.');
    expect(relationship.createdAt).toBeTruthy();
    expect(relationship.updatedAt).toBeTruthy();
  });

  it('upserts and deletes relationships by id', () => {
    const updatedRelationship = {
      ...fixedRelationship,
      note: 'Updated note',
    };

    expect(upsertRelationship([], fixedRelationship)).toEqual([
      fixedRelationship,
    ]);
    expect(
      upsertRelationship([fixedRelationship], updatedRelationship)
    ).toEqual([updatedRelationship]);
    expect(
      deleteRelationship([fixedRelationship], fixedRelationship.id)
    ).toEqual([]);
  });

  it('removes relationships attached to a deleted entry', () => {
    const unrelatedRelationship = {
      ...fixedRelationship,
      id: 'relationship-other',
      sourceEntryId: 'character-kael-orrin',
      targetEntryId: 'lore-sunstones',
    };

    expect(
      deleteRelationshipsForEntry(
        [fixedRelationship, unrelatedRelationship],
        'character-sera-vall'
      )
    ).toEqual([unrelatedRelationship]);
  });

  it('filters relationships by type and attached entry', () => {
    const sunstoneRelationship = {
      ...fixedRelationship,
      id: 'relationship-kael-sunstones',
      sourceEntryId: 'character-kael-orrin',
      targetEntryId: 'lore-sunstones',
      type: 'carries',
    };

    expect(
      filterRelationships([fixedRelationship, sunstoneRelationship], {
        type: 'member of',
        entryId: '',
      })
    ).toEqual([fixedRelationship]);
    expect(
      filterRelationships([fixedRelationship, sunstoneRelationship], {
        type: '',
        entryId: 'lore-sunstones',
      })
    ).toEqual([sunstoneRelationship]);
    expect(
      filterRelationships([fixedRelationship, sunstoneRelationship], {
        type: 'member of',
        entryId: 'character-kael-orrin',
      })
    ).toEqual([]);
  });

  it('resolves entry relationships with source and target records', () => {
    const codex = createSeedCodex();

    expect(
      findEntryById(codex, worldSections, 'character-sera-vall')?.name
    ).toBe('Sera Vall');
    expect(
      getEntryRelationships(
        [fixedRelationship],
        codex,
        worldSections,
        'character-sera-vall'
      )
    ).toMatchObject([
      {
        id: fixedRelationship.id,
        sourceEntry: { name: 'Sera Vall' },
        targetEntry: { name: 'The Lantern Registry' },
      },
    ]);
  });

  it('builds graph data only for relationships with existing endpoints', () => {
    const codex = createSeedCodex();
    const brokenRelationship = {
      ...fixedRelationship,
      id: 'relationship-broken',
      targetEntryId: 'missing-entry',
    };

    expect(
      getRelationshipGraph(
        [fixedRelationship, brokenRelationship],
        codex,
        worldSections
      )
    ).toEqual({
      nodes: [
        {
          id: 'character-sera-vall',
          name: 'Sera Vall',
          sectionTitle: 'Characters',
          status: 'draft',
        },
        {
          id: 'faction-lantern-registry',
          name: 'The Lantern Registry',
          sectionTitle: 'Factions',
          status: 'draft',
        },
      ],
      edges: [
        {
          id: fixedRelationship.id,
          sourceId: 'character-sera-vall',
          targetId: 'faction-lantern-registry',
          label: 'member of',
          directional: true,
        },
      ],
    });
  });
});
