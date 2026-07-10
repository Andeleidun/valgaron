import { describe, expect, it } from '@jest/globals';
import {
  createEmptyDraft,
  createSeedWorldDocument,
  draftFromEntry,
  entryEditorDisplayLimits,
  getActiveWorld,
  getEntries,
  type WorldEntry,
  type WorldSectionConfig,
} from '@valgaron/core';
import { getMobileRouteHref } from '../navigation/mobileRoutes';
import { getMobileEntryEditorModel } from './mobileEntryEditorModel';

describe('mobile character editor parity', () => {
  it('resolves a direct character edit route into grouped editable fields and linked controls', () => {
    const href = getMobileRouteHref(
      '/entries?sectionId=characters&entryId=character-mira-rowan&intent=edit&query=Mira%20Rowan'
    );
    const world = getActiveWorld(createSeedWorldDocument());
    const section = world.entryTypes.find(
      (candidate) => candidate.id === href.params.sectionId
    );

    if (!section) {
      throw new Error('Expected the mobile route to resolve a section.');
    }

    const sectionEntries = getEntries(world.codex, section.id);
    const selectedEntry = sectionEntries.find(
      (entry) => entry.id === href.params.entryId
    );

    if (!selectedEntry) {
      throw new Error('Expected the mobile route to resolve an entry.');
    }

    const draft = draftFromEntry(selectedEntry, section);
    const editorModel = getMobileEntryEditorModel({
      codex: world.codex,
      draft,
      relationships: world.relationships,
      section,
      sectionEntries,
      sections: world.entryTypes,
      selectedEntry,
    });

    expect(href).toEqual({
      pathname: '/entries',
      params: {
        entryId: 'character-mira-rowan',
        intent: 'edit',
        query: 'Mira Rowan',
        sectionId: 'characters',
      },
    });
    expect(selectedEntry.name).toBe('Mira Rowan');
    expect(editorModel.detailFieldGroups.map((group) => group.label)).toEqual([
      'Record basics',
      'Category and role',
      'Identity and origin',
      'Profession and power',
      'Presentation',
      'Story engine',
    ]);
    expect(
      editorModel.detailFieldGroups.flatMap((group) =>
        group.fields.map((field) => field.key)
      )
    ).toEqual(
      expect.arrayContaining(['ancestry', 'profession', 'currentStatus'])
    );
    expect(
      editorModel.activeRelationshipFieldConfigs.map((config) => config.label)
    ).toEqual(expect.arrayContaining(['Home', 'Affiliations']));
    expect(
      editorModel.activeRelationshipFieldConfigs.map(
        (config) => config.fieldKey
      )
    ).not.toEqual(expect.arrayContaining(['ancestry', 'profession']));
    const editableFields = editorModel.detailFieldGroups.flatMap(
      (group) => group.fields
    );
    expect(
      editableFields.find((field) => field.key === 'characterCategory')
        ?.suggestions
    ).toContain('Construct or automaton');
    expect(editableFields.find((field) => field.key === 'ancestry')).toEqual(
      expect.objectContaining({
        key: 'ancestry',
        value: 'Human',
      })
    );
    expect(editableFields.find((field) => field.key === 'profession')).toEqual(
      expect.objectContaining({
        key: 'profession',
        value: 'Surveyor',
      })
    );
    const homeField = editorModel.linkedFieldDisplayModels.find(
      (field) => field.config.fieldKey === 'homePlace'
    );
    const affiliationsField = editorModel.linkedFieldDisplayModels.find(
      (field) => field.config.fieldKey === 'affiliations'
    );

    expect(homeField).toBeDefined();
    expect(homeField?.options.map((option) => option.entry.name)).toContain(
      'Northwatch Harbor'
    );
    expect(homeField?.fieldRelationships).toHaveLength(0);
    expect(affiliationsField).toBeDefined();
    expect(
      affiliationsField?.visibleOptions.map((option) => option.entry.name)
    ).toContain('The Cartographers Guild');
    expect(Array.from(affiliationsField?.selectedTargetIds ?? [])).toContain(
      'faction-cartographers-guild'
    );
  });

  it('reports hidden suggestion counts for capped mobile editor suggestions', () => {
    const section: WorldSectionConfig = {
      id: 'artifacts',
      kind: 'artifact',
      title: 'Artifacts',
      singularTitle: 'Artifact',
      description: 'Objects with history.',
      custom: true,
      detailFields: [
        {
          key: 'origin',
          label: 'Origin',
          suggestFromExistingValues: true,
        },
      ],
    };
    const sectionEntries: WorldEntry[] = Array.from(
      { length: entryEditorDisplayLimits.detailSuggestions + 2 },
      (_, index) => ({
        createdAt: '2026-01-01T00:00:00.000Z',
        fields: { origin: `Origin ${index + 1}` },
        images: [],
        id: `artifact-${index + 1}`,
        kind: 'artifact',
        name: `Artifact ${index + 1}`,
        notes: '',
        pinned: false,
        status: 'draft',
        summary: '',
        tags: [],
        updatedAt: '2026-01-01T00:00:00.000Z',
      })
    );
    const editorModel = getMobileEntryEditorModel({
      draft: createEmptyDraft(),
      section,
      sectionEntries,
      selectedEntry: null,
    });
    const originField = editorModel.detailFieldGroups[0]?.fields.find(
      (field) => field.key === 'origin'
    );

    expect(originField?.suggestions).toHaveLength(
      entryEditorDisplayLimits.detailSuggestions
    );
    expect(originField?.hiddenSuggestionCount).toBe(2);
    expect(originField?.hiddenSuggestionLabel).toBe(
      '2 more suggestions available. Type to use another value.'
    );
  });
});
