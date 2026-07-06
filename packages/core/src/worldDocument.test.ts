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
    expect(document.schemaVersion).toBe(3);
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
    expect(activeWorld.schema.vocabularies.map((item) => item.id)).toEqual([
      'character-category',
      'character-ancestry',
      'character-profession',
      'place-category',
      'faction-influence',
      'lore-category',
      'timeline-era',
    ]);
    expect(
      activeWorld.schema.fieldOverrides.characters.profession
    ).toMatchObject({
      vocabularyId: 'character-profession',
      vocabularyMode: 'suggestions',
    });
    expect(
      activeWorld.schema.vocabularies.find((item) => item.id === 'timeline-era')
        ?.values[0]
    ).toMatchObject({
      id: 'founding-era',
      label: 'Founding Era',
      status: 'active',
      order: 1,
    });
  });

  it('rejects legacy single-world codex and schema 2 document shapes', () => {
    const schema2Document = {
      ...createSeedWorldDocument(),
      schemaVersion: 2,
    };

    expect(parseWorldDocument(createSeedCodex())).toBeNull();
    expect(parseWorldDocument(schema2Document)).toBeNull();
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
        worlds: [
          {
            ...getActiveWorld(document),
            schema: {
              ...getActiveWorld(document).schema,
              vocabularies: [
                {
                  id: 'bad-vocabulary',
                  name: 'Bad Vocabulary',
                  description: '',
                  values: [{ id: 'bad-value' }],
                },
              ],
            },
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
            schema: {
              ...getActiveWorld(document).schema,
              vocabularies: getActiveWorld(document).schema.vocabularies.map(
                (vocabulary) =>
                  vocabulary.id === 'timeline-era'
                    ? {
                        ...vocabulary,
                        values: vocabulary.values.map((value) =>
                          value.id === 'founding-era'
                            ? { ...value, order: 0 }
                            : value
                        ),
                      }
                    : vocabulary
              ),
            },
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
            schema: {
              ...getActiveWorld(document).schema,
              fieldOverrides: {
                ...getActiveWorld(document).schema.fieldOverrides,
                characters: {
                  ...getActiveWorld(document).schema.fieldOverrides.characters,
                  ancestry: {
                    order: 1.5,
                  },
                },
              },
            },
          },
        ],
      })
    ).toBeNull();
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
