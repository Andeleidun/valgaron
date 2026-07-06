import { describe, expect, it } from '@jest/globals';
import {
  getDraftDetailFields,
  getEntryDetailFields,
  getHiddenPlaceDetailValues,
  getPlaceCategoryProfileIds,
  placeRelationshipFieldConfigs,
  placeRelationshipTypeOptions,
  supportedPlaceCategoryOptions,
} from './placeTaxonomy';
import { getSectionById } from './codexEntries';
import {
  createSeedCodex,
  createSeedWorldDocument,
  worldSections,
} from './seedCodex';

describe('place taxonomy', () => {
  it('covers all supported place categories with field profiles', () => {
    const missingProfileCategories = supportedPlaceCategoryOptions.filter(
      (category) => getPlaceCategoryProfileIds(category).length === 0
    );

    expect(missingProfileCategories).toEqual([]);
  });

  it('returns only shared place fields until a category is selected', () => {
    const section = getSectionById('places');

    if (!section) {
      throw new Error('Expected place section seed config.');
    }

    expect(getDraftDetailFields(section).map((field) => field.key)).toEqual([
      'category',
      'region',
      'climate',
      'significance',
    ]);
  });

  it('returns category-specific place fields for saved entries', () => {
    const section = getSectionById('places');
    const codex = createSeedCodex();

    if (!section) {
      throw new Error('Expected place section seed config.');
    }

    const city = {
      ...codex.places[0],
      fields: { ...codex.places[0].fields, category: 'City' },
    };
    const river = {
      ...codex.places[0],
      fields: { ...codex.places[0].fields, category: 'River' },
    };

    const cityFields = getEntryDetailFields(section, city).map(
      (field) => field.key
    );
    const riverFields = getEntryDetailFields(section, river).map(
      (field) => field.key
    );

    expect(cityFields).toContain('districts');
    expect(cityFields).toContain('population');
    expect(cityFields).not.toContain('tributaries');
    expect(riverFields).toContain('source');
    expect(riverFields).toContain('mouth');
    expect(riverFields).toContain('tributaries');
    expect(riverFields).not.toContain('districts');
  });

  it('applies schema field overrides to labels, order, and visibility', () => {
    const section = getSectionById('characters');
    const world = createSeedWorldDocument().worlds[0];

    if (!section) {
      throw new Error('Expected character section seed config.');
    }

    const schema = {
      ...world.schema,
      fieldOverrides: {
        ...world.schema.fieldOverrides,
        characters: {
          ...world.schema.fieldOverrides.characters,
          ancestry: {
            label: 'People',
            order: 1,
            vocabularyId: 'character-ancestry',
            vocabularyMode: 'suggestions' as const,
          },
          characterCategory: {
            hidden: true,
            vocabularyId: 'character-category',
            vocabularyMode: 'suggestions' as const,
          },
        },
      },
    };

    expect(
      getDraftDetailFields(section, undefined, schema)
        .slice(0, 2)
        .map((field) => [field.key, field.label])
    ).toEqual([
      ['ancestry', 'People'],
      ['narrativeRole', 'Narrative role'],
    ]);
    expect(
      getDraftDetailFields(section, undefined, schema).map((field) => field.key)
    ).not.toContain('characterCategory');
  });

  it('identifies populated place fields hidden by the current category', () => {
    const section = getSectionById('places');

    if (!section) {
      throw new Error('Expected place section seed config.');
    }

    expect(
      getHiddenPlaceDetailValues(section, {
        category: 'River',
        source: 'North glacier',
        districts: 'Old Market',
        population: '12,000',
        hiddenPlanningNote: 'Keep the old city fields.',
        emptyHiddenField: '',
      })
    ).toEqual([
      {
        key: 'districts',
        label: 'Districts or local areas',
        value: 'Old Market',
      },
      {
        key: 'hiddenPlanningNote',
        label: 'Hidden Planning Note',
        value: 'Keep the old city fields.',
      },
      {
        key: 'population',
        label: 'Population',
        value: '12,000',
      },
    ]);
  });

  it('keeps relationship-backed field configs aligned with place relationship types', () => {
    const relationshipTypes = new Set(placeRelationshipTypeOptions);
    const configTypes = placeRelationshipFieldConfigs.map(
      (config) => config.relationshipType
    );

    expect(configTypes.length).toBeGreaterThan(0);
    expect(configTypes.every((type) => relationshipTypes.has(type))).toBe(true);
    expect(
      placeRelationshipFieldConfigs.map((config) => config.fieldKey)
    ).toEqual(
      expect.arrayContaining([
        'parentPlace',
        'capital',
        'settlements',
        'childPlaces',
        'regions',
        'districts',
        'landmarks',
        'waters',
        'neighbors',
        'routeConnections',
        'tradePartners',
        'controllingPowers',
        'claimants',
        'inhabitants',
        'founders',
        'builders',
        'notableEvents',
        'relatedLore',
        'source',
        'mouth',
        'tributaries',
      ])
    );
    expect(
      placeRelationshipFieldConfigs.filter(
        (config) => config.currentEntryRole === 'target'
      )
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldKey: 'source',
          relationshipType: 'flows into',
        }),
        expect.objectContaining({
          fieldKey: 'tributaries',
          relationshipType: 'flows into',
        }),
      ])
    );
  });

  it('keeps relationship-backed field configs aligned with supported targets and visible fields', () => {
    const sectionKinds = new Set(worldSections.map((section) => section.kind));
    const supportedPlaceCategories = new Set(supportedPlaceCategoryOptions);
    const placeSection = getSectionById('places');

    if (!placeSection) {
      throw new Error('Expected place section seed config.');
    }

    const visiblePlaceFieldKeys = new Set(
      supportedPlaceCategoryOptions.flatMap((category) =>
        getDraftDetailFields(placeSection, {
          details: { category },
        }).map((field) => field.key)
      )
    );

    expect(
      placeRelationshipFieldConfigs.flatMap((config) =>
        config.targetEntryKinds.filter((kind) => !sectionKinds.has(kind))
      )
    ).toEqual([]);
    expect(
      placeRelationshipFieldConfigs.flatMap(
        (config) =>
          config.targetPlaceCategories?.filter(
            (category) => !supportedPlaceCategories.has(category)
          ) ?? []
      )
    ).toEqual([]);
    expect(
      placeRelationshipFieldConfigs
        .map((config) => config.fieldKey)
        .filter((fieldKey) => !visiblePlaceFieldKeys.has(fieldKey))
    ).toEqual([]);
  });
});
