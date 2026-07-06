import { describe, expect, it } from '@jest/globals';
import {
  characterRelationshipFieldConfigs,
  characterRelationshipTypeOptions,
  getCharacterCategoryProfileIds,
  getHiddenCharacterDetailValues,
  supportedCharacterCategoryOptions,
} from './characterTaxonomy';
import { characterFieldCatalog } from './characterRelationshipTree.generated';
import { getDraftDetailFields, getEntryDetailFields } from './placeTaxonomy';
import { getEntryDetailFieldSuggestions, getSectionById } from './codexEntries';
import { createSeedCodex, worldSections } from './seedCodex';

describe('character taxonomy', () => {
  it('covers all supported character categories with field profiles', () => {
    const missingProfileCategories = supportedCharacterCategoryOptions.filter(
      (category) => getCharacterCategoryProfileIds(category).length === 0
    );

    expect(missingProfileCategories).toEqual([]);
  });

  it('returns shared character fields until a category is selected', () => {
    const section = getSectionById('characters');

    if (!section) {
      throw new Error('Expected character section seed config.');
    }

    expect(getDraftDetailFields(section).map((field) => field.key)).toEqual([
      'characterCategory',
      'narrativeRole',
      'ancestry',
      'profession',
      'homePlace',
      'affiliations',
      'currentStatus',
    ]);
  });

  it('returns category-specific character fields for saved entries', () => {
    const section = getSectionById('characters');
    const codex = createSeedCodex();

    if (!section) {
      throw new Error('Expected character section seed config.');
    }

    const humanoid = {
      ...codex.characters[0],
      fields: {
        ...codex.characters[0].fields,
        characterCategory: 'Humanoid person',
      },
    };
    const construct = {
      ...codex.characters[0],
      fields: {
        ...codex.characters[0].fields,
        characterCategory: 'Construct or automaton',
      },
    };

    const humanoidFields = getEntryDetailFields(section, humanoid).map(
      (field) => field.key
    );
    const constructFields = getEntryDetailFields(section, construct).map(
      (field) => field.key
    );

    expect(humanoidFields).toContain('parents');
    expect(humanoidFields).toContain('culture');
    expect(humanoidFields).not.toContain('maintenance');
    expect(constructFields).toContain('maker');
    expect(constructFields).toContain('directive');
    expect(constructFields).toContain('maintenance');
    expect(constructFields).not.toContain('parents');
  });

  it('identifies populated character fields hidden by the current category', () => {
    expect(
      getHiddenCharacterDetailValues({
        characterCategory: 'Construct or automaton',
        maker: 'The Brass College',
        parents: 'Old family note',
        role: 'Legacy role value',
        emptyHiddenField: '',
      })
    ).toEqual([
      {
        key: 'parents',
        label: 'Parents or creators',
        value: 'Old family note',
      },
      {
        key: 'role',
        label: 'Role',
        value: 'Legacy role value',
      },
    ]);
  });

  it('builds local suggestions for flexible ancestry and profession fields', () => {
    const section = getSectionById('characters');
    const codex = createSeedCodex();

    if (!section) {
      throw new Error('Expected character section seed config.');
    }

    const fields = getDraftDetailFields(section);
    const suggestions = getEntryDetailFieldSuggestions({
      entries: codex.characters,
      fields,
    });

    expect(suggestions.characterCategory).toContain('Humanoid person');
    expect(suggestions.characterCategory).toContain('Construct or automaton');
    expect(suggestions.ancestry).toEqual(['Human']);
    expect(suggestions.profession).toEqual(['Surveyor', 'Quartermaster']);
  });

  it('keeps ancestry and profession as creator-defined fields without bundled options', () => {
    const section = getSectionById('characters');

    if (!section) {
      throw new Error('Expected character section seed config.');
    }

    const fields = getDraftDetailFields(section);
    const ancestry = fields.find((field) => field.key === 'ancestry');
    const profession = fields.find((field) => field.key === 'profession');

    expect(characterFieldCatalog.ancestry).toMatchObject({
      valueType: 'customText',
      suggestFromExistingValues: true,
    });
    expect(characterFieldCatalog.profession).toMatchObject({
      valueType: 'customText',
      suggestFromExistingValues: true,
    });
    expect(ancestry).toMatchObject({
      key: 'ancestry',
      suggestFromExistingValues: true,
    });
    expect(profession).toMatchObject({
      key: 'profession',
      suggestFromExistingValues: true,
    });
    expect(ancestry?.autocompleteOptions).toBeUndefined();
    expect(profession?.autocompleteOptions).toBeUndefined();
  });

  it('keeps relationship-backed character field configs aligned with relationship type labels', () => {
    const relationshipTypeLabels = new Set(characterRelationshipTypeOptions);
    const sectionKinds = new Set(worldSections.map((section) => section.kind));

    expect(characterRelationshipFieldConfigs.length).toBeGreaterThan(0);
    expect(
      characterRelationshipFieldConfigs
        .map((config) => config.relationshipTypeLabel)
        .filter((label) => !relationshipTypeLabels.has(label))
    ).toEqual([]);
    expect(
      characterRelationshipFieldConfigs.flatMap((config) =>
        config.targetEntryKinds.filter((kind) => !sectionKinds.has(kind))
      )
    ).toEqual([]);
    expect(
      characterRelationshipFieldConfigs.map((config) => config.fieldKey)
    ).toEqual(
      expect.arrayContaining([
        'ancestryLore',
        'professionLore',
        'homePlace',
        'affiliations',
        'parents',
        'maker',
        'anchor',
        'notableEvents',
        'relatedLore',
      ])
    );
  });
});
