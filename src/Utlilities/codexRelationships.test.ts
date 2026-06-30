import { describe, expect, it } from '@jest/globals';
import {
  createEmptyRelationshipDraft,
  deleteRelationship,
  deleteRelationshipsForEntry,
  findEntryById,
  filterRelationships,
  getBrokenRelationships,
  getEntryRelationships,
  getOrphanedEntries,
  getRelationshipGraph,
  relationshipFromDraft,
  upsertRelationship,
} from './codexRelationships';
import { createSeedCodex, worldSections } from './seedCodex';
import type { WorldRelationship } from '../types';

const fixedRelationship: WorldRelationship = {
  id: 'relationship-mira-guild',
  sourceEntryId: 'character-mira-rowan',
  targetEntryId: 'faction-cartographers-guild',
  type: 'member of',
  directional: true,
  note: 'Mira files route notes for the guild.',
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
      sourceEntryId: 'character-mira-rowan',
      targetEntryId: 'faction-cartographers-guild',
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
      sourceEntryId: 'character-tomas-quill',
      targetEntryId: 'lore-tide-calendar',
    };

    expect(
      deleteRelationshipsForEntry(
        [fixedRelationship, unrelatedRelationship],
        'character-mira-rowan'
      )
    ).toEqual([unrelatedRelationship]);
  });

  it('filters relationships by type and attached entry', () => {
    const calendarRelationship = {
      ...fixedRelationship,
      id: 'relationship-tomas-calendar',
      sourceEntryId: 'character-tomas-quill',
      targetEntryId: 'lore-tide-calendar',
      type: 'references',
    };

    expect(
      filterRelationships([fixedRelationship, calendarRelationship], {
        type: 'member of',
        entryId: '',
      })
    ).toEqual([fixedRelationship]);
    expect(
      filterRelationships([fixedRelationship, calendarRelationship], {
        type: '',
        entryId: 'lore-tide-calendar',
      })
    ).toEqual([calendarRelationship]);
    expect(
      filterRelationships([fixedRelationship, calendarRelationship], {
        type: 'member of',
        entryId: 'character-tomas-quill',
      })
    ).toEqual([]);
  });

  it('resolves entry relationships with source and target records', () => {
    const codex = createSeedCodex();

    expect(
      findEntryById(codex, worldSections, 'character-mira-rowan')?.name
    ).toBe('Mira Rowan');
    expect(
      getEntryRelationships(
        [fixedRelationship],
        codex,
        worldSections,
        'character-mira-rowan'
      )
    ).toMatchObject([
      {
        id: fixedRelationship.id,
        sourceEntry: { name: 'Mira Rowan' },
        targetEntry: { name: 'The Cartographers Guild' },
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
          id: 'character-mira-rowan',
          name: 'Mira Rowan',
          sectionId: 'characters',
          sectionTitle: 'Characters',
          status: 'draft',
          tags: ['surveyor', 'routes', 'maps'],
        },
        {
          id: 'faction-cartographers-guild',
          name: 'The Cartographers Guild',
          sectionId: 'factions',
          sectionTitle: 'Factions',
          status: 'draft',
          tags: ['maps', 'routes', 'guild'],
        },
      ],
      edges: [
        {
          id: fixedRelationship.id,
          sourceId: 'character-mira-rowan',
          targetId: 'faction-cartographers-guild',
          label: 'member of',
          directional: true,
        },
      ],
    });
  });

  it('reports broken relationships with missing endpoints', () => {
    const codex = createSeedCodex();
    const brokenRelationship = {
      ...fixedRelationship,
      id: 'relationship-broken',
      targetEntryId: 'missing-entry',
    };

    expect(
      getBrokenRelationships(
        [fixedRelationship, brokenRelationship],
        codex,
        worldSections
      )
    ).toMatchObject([
      {
        id: 'relationship-broken',
        missingSource: false,
        missingTarget: true,
        sourceEntry: { name: 'Mira Rowan' },
        targetEntry: null,
      },
    ]);
  });

  it('reports orphaned entries without saved relationships', () => {
    const codex = createSeedCodex();

    expect(
      getOrphanedEntries([fixedRelationship], codex, worldSections).map(
        (entry) => entry.id
      )
    ).toEqual([
      'character-tomas-quill',
      'place-northwatch-harbor',
      'place-glassroot-forest',
      'faction-ember-court',
      'lore-waystones',
      'lore-tide-calendar',
      'timeline-first-survey',
      'timeline-harbor-accord',
    ]);
  });

  it('filters graph data by section, status, tag, and relationship type', () => {
    const codex = createSeedCodex();
    const referencesRelationship = {
      ...fixedRelationship,
      id: 'relationship-mira-waystones',
      targetEntryId: 'lore-waystones',
      type: 'references',
    };

    expect(
      getRelationshipGraph(
        [fixedRelationship, referencesRelationship],
        codex,
        worldSections,
        {
          sectionId: '',
          status: 'draft',
          tag: 'maps',
          type: 'member of',
        }
      )
    ).toMatchObject({
      nodes: [
        {
          id: 'character-mira-rowan',
          sectionId: 'characters',
        },
        {
          id: 'faction-cartographers-guild',
          sectionId: 'factions',
        },
      ],
      edges: [
        {
          id: fixedRelationship.id,
        },
      ],
    });
    expect(
      getRelationshipGraph(
        [fixedRelationship, referencesRelationship],
        codex,
        worldSections,
        {
          sectionId: 'characters',
          status: '',
          tag: '',
          type: 'member of',
        }
      ).edges
    ).toEqual([]);
  });
});
