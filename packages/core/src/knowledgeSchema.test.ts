import { describe, expect, it } from '@jest/globals';
import {
  filterKnowledgeFieldConfigurationSections,
  filterKnowledgeHiddenDetailRows,
  filterKnowledgeVocabularyValueRows,
  formatKnowledgeVocabularyHiddenValueCount,
  getKnowledgeRouteFocusTargetId,
  getKnowledgeSchemaModel,
  knowledgeRouteFocusTargetIds,
} from './knowledgeSchema';
import { createSeedWorldDocument } from './seedCodex';
import { getActiveWorld } from './worldDocument';
import { applyEntry, entryFromDraft } from './codexEntries';
import {
  createCustomEntryType,
  removeCustomEntryTypeField,
  updateActiveWorkspace,
  updateFieldOverride,
} from './workspaceManagement';

describe('knowledgeSchema', () => {
  it('builds a shared schema overview for built-in sections and relationship fields', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const model = getKnowledgeSchemaModel(world);

    expect(model.totals).toMatchObject({
      entryTypeCount: 5,
      customTypeCount: 0,
      hiddenDetailCount: 0,
    });
    expect(model.totals.fieldCount).toBeGreaterThan(0);
    expect(model.totals.relationshipFieldCount).toBeGreaterThan(0);
    expect(model.overview).toMatchObject({
      entryTypesLabel: 'Entry types',
      entryTypesDetail: '0 custom types.',
      fieldsLabel: 'Fields',
      fieldsDetail: 'Text, category, and relationship-backed fields.',
      relationshipFieldsLabel: 'Linked fields',
      relationshipFieldsDetail: 'Fields backed by current relationships.',
      hiddenDetailsLabel: 'Hidden details',
      hiddenDetailsDetail: 'Retained values from removed or hidden fields.',
      mobileStructureSummary: `${model.totals.entryTypeCount} entry types, ${model.totals.fieldCount} fields, and ${model.totals.relationshipFieldCount} relationship-backed fields.`,
      mobileHiddenDetailSummary: '0 hidden detail cleanup targets.',
    });
    expect(model.typeSetup.detail).toContain('user-defined fields');
    expect(model.typeSetup.actionAccessibilityLabel).toBe(
      'Open Type Setup section'
    );
    expect(model.typeSetup).toMatchObject({
      customTypeCountLabel: '0 custom types in this workspace.',
      emptyCustomTypesText:
        'No custom entry types yet. Create one when built-in sections are not enough.',
      addFieldsLabel: 'Add fields',
      addFieldsRequiredError: 'Add at least one field.',
    });
    expect(model.typeSetup.route).toBe('/knowledge#custom-entry-types');
    expect(model.fieldConfiguration).toMatchObject({
      title: 'Field Configuration',
      detail:
        'Rename fields, add editor help, hide unused fields, change display order, and connect reusable vocabularies without changing saved field keys.',
      searchLabel: 'Search field settings',
      searchPlaceholder: 'Search sections, fields, vocabularies, or modes',
      noSearchResultsText: 'No field settings match this search.',
      defaultOrderPlaceholder: 'Default',
      customSettingsStatusLabel: 'Custom settings',
      defaultSettingsStatusLabel: 'Default settings',
      fieldLabelFieldLabel: 'Label',
      fieldHelpTextFieldLabel: 'Help text',
      fieldOrderFieldLabel: 'Display order',
      fieldHiddenToggleLabel: 'Hide field from editors',
      currentVocabularyLabel: 'Current vocabulary',
      noVocabularyOptionLabel: 'No vocabulary',
      vocabularyLabel: 'Vocabulary',
      vocabularyModeLabel: 'Vocabulary mode',
      chooseVocabularyBeforeModeText:
        'Choose a vocabulary before setting restricted choices.',
      relationshipBackedVocabularyHelpText:
        'Relationship-backed fields use linked records instead of vocabulary values.',
      fieldLabelRequiredError: 'Field label is required.',
      displayOrderInvalidError:
        'Display order must be a positive whole number.',
    });
    expect(model.fieldConfiguration.vocabularyModeOptions).toEqual([
      { label: 'Suggested choices', value: 'suggestions' },
      { label: 'Restricted choices', value: 'restricted' },
    ]);
    expect(model.hiddenDetails.reviewActionAccessibilityLabel).toBe(
      'Review 0 hidden detail cleanup targets'
    );
    expect(model.hiddenDetails.clearAllActionLabel).toBe(
      'Clear All Hidden Details'
    );
    expect(model.hiddenDetails.searchLabel).toBe('Search hidden details');
    expect(model.hiddenDetails.searchPlaceholder).toBe(
      'Entry, field, section, or retained value'
    );
    expect(model.hiddenDetails.noSearchResultsText).toBe(
      'No hidden detail cleanup targets match this search.'
    );
    expect(model.hiddenDetails.emptyText).toBe(
      'No hidden detail cleanup targets.'
    );
    expect(model.hiddenDetails.reviewActionRoute).toBe(
      '/knowledge#hidden-detail-cleanup'
    );
    expect(model.vocabulary).toMatchObject({
      activeValuesTitle: 'Active values',
      searchValuesLabel: 'Search values',
      valueLabelFieldLabel: 'Label',
      valueDescriptionFieldLabel: 'Description',
      valueAliasesFieldLabel: 'Aliases',
      aliasesHelpText: 'Separate aliases with commas.',
      newValueLabelFieldLabel: 'New value',
      newValueDescriptionFieldLabel: 'Description',
      newValueAliasesFieldLabel: 'Aliases',
      archivedRestoreHelpText:
        'Re-adding an archived label restores that value.',
    });
    expect(model.sections[0]).toMatchObject({
      fieldConfigurationSummary: 'Characters: 7 fields, 2 records.',
      fieldCountLabel: '7 fields',
      openAccessibilityLabel: 'Open Characters records',
      openLabel: 'Open Characters',
      relationshipFieldCountLabel: '2 relationship-backed fields',
      schemaSummary: 'Characters: 7 fields, 2 relationship-backed fields.',
    });
    expect(model.reusableKnowledge.destinations.map((item) => item.id)).toEqual(
      ['factions', 'lore']
    );
    expect(model.reusableKnowledge.destinations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'factions',
          openAccessibilityLabel: 'Open Factions reusable knowledge',
          openLabel: 'Open Factions',
        }),
        expect.objectContaining({
          id: 'lore',
          openAccessibilityLabel: 'Open Lore reusable knowledge',
          openLabel: 'Open Lore',
        }),
      ])
    );
  });

  it('resolves route focus targets for Knowledge section intents', () => {
    expect(
      getKnowledgeRouteFocusTargetId({
        focusId: knowledgeRouteFocusTargetIds.customEntryTypes,
      })
    ).toBe(knowledgeRouteFocusTargetIds.customEntryTypes);
    expect(
      getKnowledgeRouteFocusTargetId({
        focusId: knowledgeRouteFocusTargetIds.hiddenDetails,
      })
    ).toBe(knowledgeRouteFocusTargetIds.hiddenDetails);
    expect(getKnowledgeRouteFocusTargetId({ focusId: 'missing' })).toBe('');
    expect(getKnowledgeRouteFocusTargetId({ focusId: '' })).toBe('');
  });

  it('classifies flexible, controlled, and relationship-backed fields', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const model = getKnowledgeSchemaModel(world);
    const character = model.sections.find(
      (section) => section.id === 'characters'
    );
    const timeline = model.sections.find(
      (section) => section.id === 'timeline'
    );

    expect(character?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'characterCategory',
          mode: 'controlled-value',
        }),
        expect.objectContaining({
          key: 'ancestry',
          mode: 'free-text',
        }),
        expect.objectContaining({
          key: 'profession',
          mode: 'free-text',
        }),
        expect.objectContaining({
          key: 'homePlace',
          mode: 'multi-link',
          backingLabel: 'Relationship: resides in',
          targetSectionTitles: ['Places'],
        }),
        expect.objectContaining({
          key: 'affiliations',
          mode: 'multi-link',
          targetSectionTitles: ['Factions'],
        }),
      ])
    );
    expect(timeline?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'involvedRecords',
          mode: 'multi-link',
          backingLabel: 'Relationship: involves',
          targetSectionTitles: ['Characters', 'Places', 'Factions', 'Lore'],
        }),
      ])
    );
  });

  it('reports field override configuration for Knowledge controls', () => {
    const world = updateFieldOverride(
      getActiveWorld(createSeedWorldDocument()),
      'characters',
      'ancestry',
      {
        label: 'Lineage',
        helpText: 'Pick an active ancestry value where possible.',
        hidden: true,
        order: '1',
        vocabularyId: 'character-ancestry',
        vocabularyMode: 'restricted',
      }
    );
    const model = getKnowledgeSchemaModel(world);
    const character = model.sections.find(
      (section) => section.id === 'characters'
    );
    const ancestry = character?.fields.find(
      (field) => field.key === 'ancestry'
    );

    expect(character?.fields[0]).toMatchObject({
      key: 'ancestry',
      label: 'Lineage',
    });
    expect(ancestry).toMatchObject({
      baseLabel: 'Ancestry',
      helpText: 'Pick an active ancestry value where possible.',
      hidden: true,
      moveFieldDownAccessibilityLabel: 'Move Lineage down in Characters',
      moveFieldUpAccessibilityLabel: 'Move Lineage up in Characters',
      order: 1,
      removeFieldAccessibilityLabel: 'Remove Lineage from Characters',
      removeFieldConfirmationSubject: 'Lineage from Characters',
      resetSettingsAccessibilityLabel:
        'Reset Lineage settings in Characters to defaults',
      resetSettingsLabel: 'Reset to Defaults',
      updateFieldLabelAccessibilityLabel: 'Update Lineage label in Characters',
      updateSettingsAccessibilityLabel: 'Update Lineage settings in Characters',
      updateSettingsLabel: 'Update Field Settings',
      settingsHelpFieldLabel: 'Help text for Lineage in Characters',
      settingsHiddenFieldLabel: 'Hide Lineage from editors in Characters',
      settingsLabelFieldLabel: 'Label for Lineage in Characters',
      settingsOrderFieldLabel: 'Display order for Lineage in Characters',
      settingsVocabularyFieldLabel: 'Vocabulary for Lineage in Characters',
      settingsVocabularyModeFieldLabel:
        'Vocabulary mode for Lineage in Characters',
      vocabularyId: 'character-ancestry',
      vocabularyName: 'Character ancestry',
      vocabularyMode: 'restricted',
      vocabularyModeLabel: 'Restricted choices',
    });
  });

  it('filters field configuration sections by section and field metadata', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const model = getKnowledgeSchemaModel(world);

    expect(
      filterKnowledgeFieldConfigurationSections(
        model.sections,
        'named figures'
      ).map((section) => section.id)
    ).toEqual(['characters']);
    expect(
      filterKnowledgeFieldConfigurationSections(
        model.sections,
        'profession'
      ).map((section) => ({
        id: section.id,
        fields: section.fields.map((field) => field.key),
      }))
    ).toEqual([{ id: 'characters', fields: ['profession'] }]);
    expect(
      filterKnowledgeFieldConfigurationSections(
        model.sections,
        'character profession'
      ).map((section) => ({
        id: section.id,
        fields: section.fields.map((field) => field.key),
      }))
    ).toEqual([{ id: 'characters', fields: ['profession'] }]);
  });

  it('summarizes durable workspace vocabularies and field usage', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const model = getKnowledgeSchemaModel(world);
    const characterCategory = model.vocabulary.rows.find(
      (row) => row.id === 'character-category'
    );
    const characterAncestry = model.vocabulary.rows.find(
      (row) => row.id === 'character-ancestry'
    );
    const placeCategory = model.vocabulary.rows.find(
      (row) => row.id === 'place-category'
    );

    expect(characterCategory).toMatchObject({
      id: 'character-category',
      name: 'Character category',
      activeCount: expect.any(Number),
      archivedCount: 0,
      statusSummary: '12 active values; 0 archived values',
    });
    expect(characterCategory?.values).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Humanoid person' }),
      ])
    );
    expect(characterCategory?.fieldUsages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sectionTitle: 'Characters',
          fieldLabel: 'Character category',
          modeLabel: 'Suggested choices',
          summaryText: 'Characters: Character category (Suggested choices)',
        }),
      ])
    );
    expect(characterAncestry?.values).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          aliasesFieldLabel: 'Edit Human aliases',
          archiveAccessibilityLabel: 'Archive Human from Character ancestry',
          archiveLabel: 'Archive',
          descriptionFieldLabel: 'Edit Human description',
          label: 'Human',
          labelFieldLabel: 'Edit Human label',
          moveDownAccessibilityLabel: 'Move Human down in Character ancestry',
          moveDownLabel: 'Move Down',
          moveUpAccessibilityLabel: 'Move Human up in Character ancestry',
          moveUpLabel: 'Move Up',
          restoreAccessibilityLabel: 'Restore Human to Character ancestry',
          restoreLabel: 'Restore Human',
          updateAccessibilityLabel: 'Update Human in Character ancestry',
          updateLabel: 'Update Value',
        }),
      ])
    );
    expect(characterAncestry?.addValueAccessibilityLabel).toBe(
      'Add value to Character ancestry'
    );
    expect(characterAncestry).toMatchObject({
      addValueLabel: 'Add Value',
      archivedValuesLabel: 'Character ancestry archived values',
      fieldUsageLabel: 'Character ancestry field usage',
      fieldUsageSummaryIntro: 'Character ancestry field usage: used by',
      newValueAliasesFieldLabel: 'New Character ancestry aliases',
      newValueDescriptionFieldLabel: 'New Character ancestry description',
      newValueLabelFieldLabel: 'New Character ancestry value',
      noActiveValuesText: 'No active Character ancestry values.',
      noMatchingValuesText:
        'No active Character ancestry values match this search.',
      searchValuesFieldLabel: 'Search Character ancestry values',
      searchValuesPlaceholder: 'Search Character ancestry',
      showAllValuesLabel: 'Show All Character ancestry Values',
      showFewerValuesLabel: 'Show Fewer Character ancestry Values',
    });
    expect(characterAncestry?.fieldUsages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          openAccessibilityLabel:
            'Open Characters fields using Character ancestry',
          openLabel: 'Open Characters',
          summaryText: 'Characters: Ancestry (Suggested choices)',
        }),
      ])
    );
    expect(placeCategory?.summary).toContain('field uses this vocabulary');
    expect(
      formatKnowledgeVocabularyHiddenValueCount('Character ancestry', 1)
    ).toBe('1 more Character ancestry value.');
    expect(
      formatKnowledgeVocabularyHiddenValueCount('Character ancestry', 3)
    ).toBe('3 more Character ancestry values.');
    expect(placeCategory?.fieldUsages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sectionTitle: 'Places',
          fieldLabel: 'Place category',
          summaryText: 'Places: Place category (Suggested choices)',
        }),
      ])
    );
    expect(
      model.vocabulary.rows.some((row) =>
        row.fieldUsages.some((usage) => usage.fieldKey === 'affiliations')
      )
    ).toBe(false);
  });

  it('filters vocabulary values by label, description, and aliases', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const model = getKnowledgeSchemaModel(world);
    const characterProfession = model.vocabulary.rows.find(
      (row) => row.id === 'character-profession'
    );

    if (!characterProfession) {
      throw new Error('Expected character profession vocabulary.');
    }

    const values = [
      ...characterProfession.values,
      {
        aliasesFieldLabel: 'Edit Trail Finder aliases',
        archiveAccessibilityLabel:
          'Archive Trail Finder from Character profession',
        archiveLabel: 'Archive',
        descriptionFieldLabel: 'Edit Trail Finder description',
        id: 'trail-finder',
        label: 'Trail Finder',
        labelFieldLabel: 'Edit Trail Finder label',
        description: 'Route planning specialist',
        aliases: ['Pathfinder'],
        moveDownAccessibilityLabel:
          'Move Trail Finder down in Character profession',
        moveDownLabel: 'Move Down',
        moveUpAccessibilityLabel:
          'Move Trail Finder up in Character profession',
        moveUpLabel: 'Move Up',
        restoreAccessibilityLabel:
          'Restore Trail Finder to Character profession',
        restoreLabel: 'Restore Trail Finder',
        updateAccessibilityLabel: 'Update Trail Finder in Character profession',
        updateLabel: 'Update Value',
        status: 'active' as const,
      },
    ];

    expect(
      filterKnowledgeVocabularyValueRows(values, 'path').map(
        (value) => value.label
      )
    ).toEqual(['Trail Finder']);
    expect(
      filterKnowledgeVocabularyValueRows(values, 'route').map(
        (value) => value.label
      )
    ).toEqual(['Trail Finder']);
    expect(
      filterKnowledgeVocabularyValueRows(values, 'sold').map(
        (value) => value.label
      )
    ).toEqual(['Soldier']);
  });

  it('classifies custom entry type field definition hints', () => {
    const document = updateActiveWorkspace(
      createSeedWorldDocument(),
      (workspace) =>
        createCustomEntryType(workspace, {
          title: 'Orders',
          singularTitle: 'Order',
          description: 'Organizations with field rules.',
          fields:
            'Founding notes (long); Standing [Hidden | Public]; Profession (suggest)',
        })
    );
    const model = getKnowledgeSchemaModel(getActiveWorld(document));
    const orders = model.sections.find((section) => section.id === 'orders');

    expect(orders?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'founding-notes',
          mode: 'multiline-text',
        }),
        expect.objectContaining({
          key: 'standing',
          mode: 'controlled-value',
        }),
        expect.objectContaining({
          key: 'profession',
          mode: 'free-text',
          detail: 'Free text with suggestions from existing records.',
        }),
      ])
    );
    expect(
      model.vocabulary.rows.some((row) => row.id === 'orders:standing')
    ).toBe(false);
  });

  it('summarizes hidden detail cleanup targets after custom field removal', () => {
    const withCustomType = updateActiveWorkspace(
      createSeedWorldDocument(),
      (workspace) =>
        createCustomEntryType(workspace, {
          title: 'Artifacts',
          singularTitle: 'Artifact',
          description: 'Objects with story weight.',
          fields: 'Origin, Power',
        })
    );
    const customSection = getActiveWorld(withCustomType).entryTypes.find(
      (section) => section.id === 'artifacts'
    );
    const customEntry = entryFromDraft(customSection!, {
      name: 'Glass Key',
      summary: 'A key made of dawn glass.',
      notes: '',
      tags: 'artifact',
      status: 'draft',
      pinned: false,
      details: { origin: 'Glassroot Forest', power: 'Opens dawn doors' },
    });
    const withCustomEntry = updateActiveWorkspace(
      withCustomType,
      (workspace) => ({
        ...workspace,
        codex: applyEntry(workspace.codex, customEntry, workspace.entryTypes),
      })
    );
    const withRemovedField = updateActiveWorkspace(
      withCustomEntry,
      (workspace) => removeCustomEntryTypeField(workspace, 'artifacts', 'power')
    );
    const model = getKnowledgeSchemaModel(getActiveWorld(withRemovedField));
    const modelCustomSection = model.sections.find(
      (section) => section.id === 'artifacts'
    );

    expect(modelCustomSection?.addFieldsAccessibilityLabel).toBe(
      'Add fields to Artifacts'
    );
    expect(model.actionDialogKickerLabel).toBe('Knowledge schema action');
    expect(model.entryTypesKickerLabel).toBe('Current structure');
    expect(model.fieldConfiguration.kickerLabel).toBe('Field configuration');
    expect(model.hiddenDetails.kickerLabel).toBe('Schema cleanup');
    expect(model.reusableKnowledge.kickerLabel).toBe('Reusable taxonomy');
    expect(model.typeSetup.kickerLabel).toBe('Schema setup');
    expect(model.vocabulary.kickerLabel).toBe('Value taxonomy');
    expect(modelCustomSection?.addFieldsFieldLabel).toBe(
      'Add fields to Artifacts'
    );
    expect(modelCustomSection?.addFieldsPreviewLabel).toBe(
      'New Artifacts field preview'
    );
    expect(modelCustomSection?.fieldOrderAccessibilityLabel).toBe(
      'Artifacts field order'
    );
    expect(modelCustomSection?.fieldOrderTitle).toBe('Field order');
    expect(modelCustomSection?.deleteTypeAccessibilityLabel).toBe(
      'Delete custom entry type Artifacts'
    );
    expect(modelCustomSection?.deleteTypeAccessibilityHint).toBe(
      'Deletes this custom entry type, its entries, and its relationships after confirmation.'
    );
    expect(modelCustomSection?.deleteTypeConfirmationSubject).toBe('Artifacts');
    expect(modelCustomSection?.fields[0]).toMatchObject({
      renameFieldLabel: 'Rename Origin in Artifacts',
      removeFieldAccessibilityHint:
        'Removes this field from the custom type. Existing entry values stay saved as hidden details.',
      retainedValueSummary:
        'Origin: Free text; values stay saved under origin.',
      updateFieldLabelAccessibilityLabel: 'Update Origin label in Artifacts',
    });
    expect(model.totals.hiddenDetailCount).toBe(1);
    expect(model.hiddenDetails.reviewActionAccessibilityLabel).toBe(
      'Review 1 hidden detail cleanup target'
    );
    expect(model.typeSetup.customFieldPreviewAccessibilityLabel).toBe(
      'Custom field preview'
    );
    expect(model.typeSetup.customFieldPreviewTitle).toBe('Field preview');
    expect(model.hiddenDetails.rows).toEqual([
      {
        clearAccessibilityLabel: 'Clear hidden detail Power from Glass Key',
        clearLabel: 'Clear Detail',
        id: `artifacts:${customEntry.id}:power`,
        sectionId: 'artifacts',
        sectionTitle: 'Artifacts',
        entryId: customEntry.id,
        entryName: 'Glass Key',
        fieldKey: 'power',
        fieldLabel: 'Power',
        reviewAccessibilityLabel: 'Review Glass Key for hidden detail Power',
        reviewLabel: 'Review Entry',
        value: 'Opens dawn doors',
        route: `/entries?sectionId=artifacts&entryId=${customEntry.id}&intent=edit&query=Glass%20Key`,
      },
    ]);
    expect(
      filterKnowledgeHiddenDetailRows(model.hiddenDetails.rows, 'glass').map(
        (row) => row.id
      )
    ).toEqual([`artifacts:${customEntry.id}:power`]);
    expect(
      filterKnowledgeHiddenDetailRows(model.hiddenDetails.rows, 'power').map(
        (row) => row.id
      )
    ).toEqual([`artifacts:${customEntry.id}:power`]);
    expect(
      filterKnowledgeHiddenDetailRows(model.hiddenDetails.rows, 'missing')
    ).toEqual([]);
  });

  it('derives lore definition types from current lore categories', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const model = getKnowledgeSchemaModel(world);

    expect(model.reusableKnowledge.loreDefinitions).toEqual([
      {
        id: 'navigation-practice',
        label: 'Navigation practice',
        count: 1,
        countLabel: '1 lore note',
        openAccessibilityLabel: 'Open Lore notes for Navigation practice',
        openLabel: 'Open Lore',
        route: '/entries?sectionId=lore&query=Navigation%20practice',
      },
      {
        id: 'travel-custom',
        label: 'Travel custom',
        count: 1,
        countLabel: '1 lore note',
        openAccessibilityLabel: 'Open Lore notes for Travel custom',
        openLabel: 'Open Lore',
        route: '/entries?sectionId=lore&query=Travel%20custom',
      },
    ]);
  });
});
