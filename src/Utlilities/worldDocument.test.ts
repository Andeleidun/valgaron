import { describe, expect, it } from '@jest/globals';
import type { WorldDocument } from '../types';
import { createSeedCodex, createSeedWorldDocument } from './seedCodex';
import {
  CURRENT_WORLD_SCHEMA_VERSION,
  getActiveWorld,
  parseWorldDocument,
  updateActiveWorld,
} from './worldDocument';

describe('world document helpers', () => {
  it('creates a versioned multi-world document with custom entry type definitions', () => {
    const document = createSeedWorldDocument();
    const activeWorld = getActiveWorld(document);

    expect(document.schemaVersion).toBe(CURRENT_WORLD_SCHEMA_VERSION);
    expect(document.worlds).toHaveLength(1);
    expect(activeWorld.entryTypes.map((entryType) => entryType.id)).toEqual([
      'characters',
      'places',
      'factions',
      'lore',
      'timeline',
    ]);
    expect(activeWorld.codex).toEqual(createSeedCodex());
  });

  it('migrates the legacy single-world codex shape', () => {
    const migratedDocument = parseWorldDocument(createSeedCodex());

    expect(migratedDocument?.schemaVersion).toBe(CURRENT_WORLD_SCHEMA_VERSION);
    expect(migratedDocument?.activeWorldId).toBe('world-valgaron');
    expect(
      migratedDocument ? getActiveWorld(migratedDocument).codex : null
    ).toEqual(createSeedCodex());
  });

  it('accepts multiple worlds and preserves valid relationships', () => {
    const document = createSeedWorldDocument();
    const secondWorld = {
      ...getActiveWorld(document),
      id: 'world-second',
      name: 'Second World',
      relationships: [
        {
          id: 'relationship-one',
          sourceEntryId: 'character-sera-vall',
          targetEntryId: 'faction-lantern-registry',
          type: 'member of',
          directional: true,
          note: 'Works with the registry.',
          status: 'draft' as const,
          createdAt: '2026-06-01T00:00:00.000Z',
          updatedAt: '2026-06-01T00:00:00.000Z',
        },
      ],
    };
    const multiWorldDocument: WorldDocument = {
      ...document,
      activeWorldId: secondWorld.id,
      worlds: [getActiveWorld(document), secondWorld],
    };

    expect(parseWorldDocument(multiWorldDocument)).toEqual(multiWorldDocument);
    expect(getActiveWorld(multiWorldDocument)).toEqual(secondWorld);
  });

  it('normalizes missing custom entry type collections during parse', () => {
    const document = createSeedWorldDocument();
    const activeWorld = getActiveWorld(document);
    const customSection = {
      id: 'artifacts',
      kind: 'artifact',
      title: 'Artifacts',
      singularTitle: 'Artifact',
      description: 'Objects with story weight.',
      detailFields: [{ key: 'origin', label: 'Origin' }],
      custom: true,
    };
    const customDocument: WorldDocument = {
      ...document,
      worlds: [
        {
          ...activeWorld,
          entryTypes: [...activeWorld.entryTypes, customSection],
          codex: activeWorld.codex,
        },
      ],
    };

    const parsedDocument = parseWorldDocument(customDocument);

    expect(
      parsedDocument ? getActiveWorld(parsedDocument).codex.artifacts : null
    ).toEqual([]);
  });

  it('updates only the active world', () => {
    const document = createSeedWorldDocument();
    const updatedDocument = updateActiveWorld(document, (world) => ({
      ...world,
      name: 'Renamed Valgaron',
    }));

    expect(getActiveWorld(updatedDocument).name).toBe('Renamed Valgaron');
    expect(updatedDocument.savedAt).not.toBe(document.savedAt);
  });

  it('rejects malformed world documents', () => {
    const document = createSeedWorldDocument();

    expect(
      parseWorldDocument({
        ...document,
        activeWorldId: 'missing-world',
      })
    ).toBeNull();
    expect(
      parseWorldDocument({
        ...document,
        worlds: [
          {
            ...getActiveWorld(document),
            relationships: [{ id: 'bad-relationship' }],
          },
        ],
      })
    ).toBeNull();
    expect(parseWorldDocument({})).toBeNull();
  });
});
