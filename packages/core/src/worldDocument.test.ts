import { describe, expect, it } from '@jest/globals';
import type { WorldDocument } from './types';
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
    const placeSection = activeWorld.entryTypes.find(
      (entryType) => entryType.id === 'places'
    );
    expect(placeSection).toMatchObject({
      title: 'Places',
      singularTitle: 'Place',
    });
    expect(placeSection?.detailFields[0]).toMatchObject({
      key: 'category',
      label: 'Place category',
      autocompleteOptions: expect.arrayContaining([
        'World',
        'Planet',
        'Forest',
        'City',
        'Moon',
        'Mountain',
        'River',
        'Town',
        'Star',
        'Coast',
        'Island',
        'Country',
        'Lake',
        'Solar system',
        'Galaxy',
      ]),
    });
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

  it('maps legacy character detail fields without copying workflow status into current status', () => {
    const legacyCodex = {
      ...createSeedCodex(),
      characters: [
        {
          id: 'character-legacy',
          kind: 'character',
          name: 'Legacy Scout',
          summary: '',
          notes: '',
          tags: [],
          status: 'canon',
          role: 'Guide',
          home: 'Northwatch Harbor',
          affiliation: 'The Cartographers Guild',
          pinned: false,
          createdAt: '2026-06-01T00:00:00.000Z',
          updatedAt: '2026-06-01T00:00:00.000Z',
        },
      ],
    };

    const migratedDocument = parseWorldDocument(legacyCodex);
    const migratedCharacter = migratedDocument
      ? getActiveWorld(migratedDocument).codex.characters[0]
      : null;

    expect(migratedCharacter).toMatchObject({
      status: 'canon',
      fields: {
        role: 'Guide',
        narrativeRole: 'Guide',
        home: 'Northwatch Harbor',
        homePlace: 'Northwatch Harbor',
        affiliation: 'The Cartographers Guild',
        affiliations: 'The Cartographers Guild',
      },
    });
    expect(migratedCharacter?.fields.currentStatus).toBeUndefined();
    expect(migratedCharacter?.fields.statusNote).toBeUndefined();
  });

  it('preserves legacy character prose status values when they are not workflow statuses', () => {
    const legacyCodex = {
      ...createSeedCodex(),
      characters: [
        {
          id: 'character-legacy',
          kind: 'character',
          name: 'Legacy Scout',
          summary: '',
          notes: '',
          tags: [],
          status: 'Missing beyond the reef',
          pinned: false,
          createdAt: '2026-06-01T00:00:00.000Z',
          updatedAt: '2026-06-01T00:00:00.000Z',
        },
      ],
    };

    const migratedDocument = parseWorldDocument(legacyCodex);
    const migratedCharacter = migratedDocument
      ? getActiveWorld(migratedDocument).codex.characters[0]
      : null;

    expect(migratedCharacter).toMatchObject({
      status: 'draft',
      fields: {
        statusNote: 'Missing beyond the reef',
        currentStatus: 'Missing beyond the reef',
      },
    });
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
          sourceEntryId: 'character-mira-rowan',
          targetEntryId: 'faction-cartographers-guild',
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

  it('preserves detail fields that suggest values from existing entries during parse', () => {
    const document = createSeedWorldDocument();
    const activeWorld = getActiveWorld(document);
    const customSection = {
      id: 'guilds',
      kind: 'guild',
      title: 'Guilds',
      singularTitle: 'Guild',
      description: 'Creator-defined organizations.',
      detailFields: [
        {
          key: 'trade',
          label: 'Trade',
          suggestFromExistingValues: true,
        },
      ],
      custom: true,
    };
    const customDocument: WorldDocument = {
      ...document,
      worlds: [
        {
          ...activeWorld,
          entryTypes: [...activeWorld.entryTypes, customSection],
          codex: {
            ...activeWorld.codex,
            guilds: [],
          },
        },
      ],
    };

    const parsedDocument = parseWorldDocument(customDocument);
    const parsedSection = parsedDocument
      ? getActiveWorld(parsedDocument).entryTypes.find(
          (section) => section.id === 'guilds'
        )
      : null;

    expect(parsedSection?.detailFields).toEqual([
      {
        key: 'trade',
        label: 'Trade',
        suggestFromExistingValues: true,
      },
    ]);
  });

  it('updates only the active world', () => {
    const document = createSeedWorldDocument();
    const updatedDocument = updateActiveWorld(document, (world) => ({
      ...world,
      name: 'Renamed Workspace',
    }));

    expect(getActiveWorld(updatedDocument).name).toBe('Renamed Workspace');
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
    expect(
      parseWorldDocument({
        ...document,
        worlds: [
          {
            ...getActiveWorld(document),
            codex: {},
            entryTypes: [],
          },
        ],
      })
    ).toBeNull();
    expect(parseWorldDocument({})).toBeNull();
  });
});
