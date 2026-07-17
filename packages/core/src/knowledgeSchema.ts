import { getEntries } from './codexEntries';
import { getDestructiveActionCopy } from './destructiveActions';
import { getHiddenEntryDetailValues } from './placeTaxonomy';
import { getRelationshipFieldConfigsForEntryKind } from './relationshipFields';
import { codexShellRoutes, getCodexEntriesRoute } from './shell';
import type {
  WorldDetailField,
  WorldSectionConfig,
  WorldVocabularyMode,
  WorldVocabularyValue,
  WorldWorkspace,
} from './types';

export const knowledgeSchemaCopy = {
  title: 'Knowledge Schema',
  actionDialogKickerLabel: 'Knowledge schema action',
  overviewEntryTypesLabel: 'Entry types',
  overviewFieldsLabel: 'Fields',
  overviewFieldsDetail: 'Text, category, and relationship-backed fields.',
  overviewRelationshipFieldsLabel: 'Linked fields',
  overviewRelationshipFieldsDetail: 'Fields backed by current relationships.',
  overviewHiddenDetailsLabel: 'Hidden details',
  overviewHiddenDetailsDetail: 'Retained values from removed or hidden fields.',
  typeSetupTitle: 'Type Setup',
  typeSetupKickerLabel: 'Schema setup',
  typeSetupDetail:
    'Create custom entry types, add user-defined fields, and review reusable schema choices in one place.',
  typeSetupActionLabel: 'Open Type Setup',
  typeSetupCustomTypeCountLabel: 'custom types in this workspace.',
  typeSetupEmptyCustomTypesText:
    'No custom entry types yet. Create one when built-in sections are not enough.',
  typeSetupAddFieldsLabel: 'Add fields',
  typeSetupAddFieldsRequiredError: 'Add at least one field.',
  typeSetupCustomFieldPreviewAccessibilityLabel: 'Custom field preview',
  typeSetupCustomFieldPreviewTitle: 'Field preview',
  reusableKnowledgeTitle: 'Reusable Knowledge',
  reusableKnowledgeKickerLabel: 'Reusable taxonomy',
  reusableKnowledgeDetail:
    'Factions and lore notes capture repeated organizations, categories, definitions, customs, and rules that other records can link to.',
  loreDefinitionsTitle: 'Lore Definition Types',
  loreDefinitionsDetail:
    'Observed lore categories show which reusable concepts are already taking shape.',
  entryTypesTitle: 'Entry Types And Fields',
  entryTypesKickerLabel: 'Current structure',
  vocabularyTitle: 'Vocabulary Manager',
  vocabularyKickerLabel: 'Value taxonomy',
  vocabularyDetail:
    'Manage reusable vocabulary values and review which entry fields use each list.',
  vocabularyActiveValuesTitle: 'Active values',
  vocabularySearchValuesLabel: 'Search values',
  vocabularyValueLabelFieldLabel: 'Label',
  vocabularyValueDescriptionFieldLabel: 'Description',
  vocabularyValueAliasesFieldLabel: 'Aliases',
  vocabularyAliasesHelpText: 'Separate aliases with commas.',
  vocabularyNewValueLabelFieldLabel: 'New value',
  vocabularyNewValueDescriptionFieldLabel: 'Description',
  vocabularyNewValueAliasesFieldLabel: 'Aliases',
  vocabularyArchivedRestoreHelpText:
    'Re-adding an archived label restores that value.',
  relationshipFieldsTitle: 'Relationship-backed fields',
  noRelationshipFieldsText: 'No relationship-backed fields for this type yet.',
  fieldConfigurationTitle: 'Field Configuration',
  fieldConfigurationKickerLabel: 'Field configuration',
  fieldConfigurationDetail:
    'Rename fields, add editor help, hide unused fields, change display order, and connect reusable vocabularies without changing saved field keys.',
  fieldConfigurationSearchLabel: 'Search field settings',
  fieldConfigurationSearchPlaceholder:
    'Search sections, fields, vocabularies, or modes',
  fieldConfigurationNoSearchResultsText: 'No field settings match this search.',
  fieldConfigurationDefaultOrderPlaceholder: 'Default',
  fieldConfigurationCustomSettingsStatusLabel: 'Custom settings',
  fieldConfigurationDefaultSettingsStatusLabel: 'Default settings',
  fieldConfigurationFieldLabelFieldLabel: 'Label',
  fieldConfigurationFieldHelpTextFieldLabel: 'Help text',
  fieldConfigurationFieldOrderFieldLabel: 'Display order',
  fieldConfigurationFieldHiddenToggleLabel: 'Hide field from editors',
  fieldConfigurationCurrentVocabularyLabel: 'Current vocabulary',
  fieldConfigurationNoVocabularyOptionLabel: 'No vocabulary',
  fieldConfigurationVocabularyLabel: 'Vocabulary',
  fieldConfigurationVocabularyModeLabel: 'Vocabulary mode',
  fieldConfigurationChooseVocabularyBeforeModeText:
    'Choose a vocabulary before setting restricted choices.',
  fieldConfigurationRelationshipBackedVocabularyHelpText:
    'Relationship-backed fields use linked records instead of vocabulary values.',
  fieldConfigurationFieldLabelRequiredError: 'Field label is required.',
  fieldConfigurationDisplayOrderInvalidError:
    'Display order must be a positive whole number.',
  hiddenDetailsTitle: 'Hidden Detail Cleanup',
  hiddenDetailsKickerLabel: 'Schema cleanup',
  hiddenDetailsDetail:
    'Removed or hidden fields still have saved values on entries until they are cleared from those entries.',
  hiddenDetailsSearchLabel: 'Search hidden details',
  hiddenDetailsSearchPlaceholder: 'Entry, field, section, or retained value',
  hiddenDetailsNoSearchResultsText:
    'No hidden detail cleanup targets match this search.',
  hiddenDetailsEmptyText: 'No hidden detail cleanup targets.',
} as const;

export const knowledgeRouteFocusTargetIds = {
  customEntryTypes: 'custom-entry-types',
  hiddenDetails: 'hidden-detail-cleanup',
} as const;

export type KnowledgeRouteFocusTargetId =
  (typeof knowledgeRouteFocusTargetIds)[keyof typeof knowledgeRouteFocusTargetIds];

export type KnowledgeFieldMode =
  | 'controlled-value'
  | 'free-text'
  | 'multiline-text'
  | 'multi-link'
  | 'single-link';

export type KnowledgeFieldRow = {
  key: string;
  label: string;
  baseLabel: string;
  mode: KnowledgeFieldMode;
  modeLabel: string;
  backingLabel: string;
  detail: string;
  helpText: string;
  hidden: boolean;
  order: number | null;
  settingsHelpFieldLabel: string;
  settingsHiddenFieldLabel: string;
  settingsLabelFieldLabel: string;
  settingsOrderFieldLabel: string;
  settingsVocabularyFieldLabel: string;
  settingsVocabularyModeFieldLabel: string;
  vocabularyId: string;
  vocabularyName: string;
  vocabularyMode: WorldVocabularyMode;
  vocabularyModeLabel: string;
  moveFieldDownAccessibilityLabel: string;
  moveFieldUpAccessibilityLabel: string;
  removeFieldAccessibilityLabel: string;
  removeFieldConfirmationSubject: string;
  relationshipType: string;
  renameFieldLabel: string;
  retainedValueSummary: string;
  resetSettingsAccessibilityLabel: string;
  resetSettingsLabel: string;
  updateFieldLabelAccessibilityLabel: string;
  updateSettingsAccessibilityLabel: string;
  updateSettingsLabel: string;
  removeFieldAccessibilityHint: string;
  targetSectionTitles: string[];
};

export type KnowledgeSectionRow = {
  addFieldsAccessibilityLabel: string;
  addFieldsFieldLabel: string;
  addFieldsPreviewLabel: string;
  id: string;
  title: string;
  singularTitle: string;
  description: string;
  custom: boolean;
  deleteTypeAccessibilityLabel: string;
  deleteTypeAccessibilityHint: string;
  deleteTypeConfirmationSubject: string;
  kindLabel: string;
  entryCount: number;
  entryCountLabel: string;
  fieldCount: number;
  fieldCountLabel: string;
  fieldConfigurationSummary: string;
  fieldOrderAccessibilityLabel: string;
  fieldOrderTitle: string;
  openAccessibilityLabel: string;
  openLabel: string;
  relationshipFieldCount: number;
  relationshipFieldCountLabel: string;
  route: string;
  schemaSummary: string;
  fields: KnowledgeFieldRow[];
};

export function filterKnowledgeFieldConfigurationSections(
  sections: readonly KnowledgeSectionRow[],
  query: string
): KnowledgeSectionRow[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) {
    return sections.map((section) => ({
      ...section,
      fields: [...section.fields],
    }));
  }
  return sections.flatMap((section) => {
    const sectionText = [
      section.title,
      section.singularTitle,
      section.description,
      section.kindLabel,
    ].join(' ');
    const sectionMatches = sectionText
      .toLocaleLowerCase()
      .includes(normalizedQuery);
    const fields = sectionMatches
      ? section.fields
      : section.fields.filter((field) =>
          [
            field.key,
            field.label,
            field.baseLabel,
            field.modeLabel,
            field.backingLabel,
            field.detail,
            field.helpText,
            field.vocabularyName,
            field.vocabularyModeLabel,
            field.relationshipType,
            ...field.targetSectionTitles,
          ]
            .join(' ')
            .toLocaleLowerCase()
            .includes(normalizedQuery)
        );
    return fields.length > 0
      ? [
          {
            ...section,
            fields: [...fields],
          },
        ]
      : [];
  });
}

export type KnowledgeReusableDestination = {
  id: 'factions' | 'lore';
  title: string;
  detail: string;
  openAccessibilityLabel: string;
  openLabel: string;
  route: string;
};

export type KnowledgeLoreDefinitionRow = {
  id: string;
  label: string;
  count: number;
  countLabel: string;
  openAccessibilityLabel: string;
  openLabel: string;
  route: string;
};

export type KnowledgeVocabularyRow = {
  addValueAccessibilityLabel: string;
  addValueLabel: string;
  archivedValuesLabel: string;
  fieldUsageLabel: string;
  fieldUsageSummaryIntro: string;
  id: string;
  newValueAliasesFieldLabel: string;
  newValueDescriptionFieldLabel: string;
  newValueLabelFieldLabel: string;
  noActiveValuesText: string;
  noMatchingValuesText: string;
  searchValuesFieldLabel: string;
  searchValuesPlaceholder: string;
  showAllValuesLabel: string;
  showFewerValuesLabel: string;
  statusSummary: string;
  name: string;
  description: string;
  summary: string;
  activeCount: number;
  archivedCount: number;
  fieldUsages: KnowledgeVocabularyFieldUsageRow[];
  values: KnowledgeVocabularyValueRow[];
  archivedValues: KnowledgeVocabularyValueRow[];
};

export type KnowledgeVocabularyFieldUsageRow = {
  id: string;
  sectionId: string;
  sectionTitle: string;
  fieldKey: string;
  fieldLabel: string;
  mode: WorldVocabularyMode;
  modeLabel: string;
  openAccessibilityLabel: string;
  openLabel: string;
  route: string;
  summaryText: string;
};

export type KnowledgeVocabularyValueRow = {
  archiveAccessibilityLabel: string;
  archiveLabel: string;
  aliasesFieldLabel: string;
  descriptionFieldLabel: string;
  id: string;
  label: string;
  labelFieldLabel: string;
  description: string;
  aliases: string[];
  moveDownAccessibilityLabel: string;
  moveDownLabel: string;
  moveUpAccessibilityLabel: string;
  moveUpLabel: string;
  restoreAccessibilityLabel: string;
  restoreLabel: string;
  updateAccessibilityLabel: string;
  updateLabel: string;
  status: WorldVocabularyValue['status'];
  order?: number;
};

export function filterKnowledgeVocabularyValueRows(
  values: readonly KnowledgeVocabularyValueRow[],
  query: string
): KnowledgeVocabularyValueRow[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) {
    return [...values];
  }
  return values.filter((value) =>
    [value.label, value.description, ...value.aliases].some((candidate) =>
      candidate.toLocaleLowerCase().includes(normalizedQuery)
    )
  );
}

export function formatKnowledgeVocabularyHiddenValueCount(
  vocabularyName: string,
  count: number
): string {
  const safeCount = Math.max(0, count);
  return `${safeCount} more ${vocabularyName} ${
    safeCount === 1 ? 'value' : 'values'
  }.`;
}

export type KnowledgeHiddenDetailRow = {
  clearAccessibilityLabel: string;
  clearLabel: string;
  id: string;
  sectionId: string;
  sectionTitle: string;
  entryId: string;
  entryName: string;
  fieldKey: string;
  fieldLabel: string;
  reviewAccessibilityLabel: string;
  reviewLabel: string;
  value: string;
  route: string;
};

export function filterKnowledgeHiddenDetailRows(
  rows: readonly KnowledgeHiddenDetailRow[],
  query: string
): KnowledgeHiddenDetailRow[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) {
    return [...rows];
  }
  return rows.filter((row) =>
    [row.sectionTitle, row.entryName, row.fieldKey, row.fieldLabel, row.value]
      .join(' ')
      .toLocaleLowerCase()
      .includes(normalizedQuery)
  );
}

export type KnowledgeSchemaModel = {
  title: string;
  actionDialogKickerLabel: string;
  entryTypesTitle: string;
  entryTypesKickerLabel: string;
  relationshipFieldsTitle: string;
  overview: {
    entryTypesLabel: string;
    entryTypesDetail: string;
    fieldsLabel: string;
    fieldsDetail: string;
    relationshipFieldsLabel: string;
    relationshipFieldsDetail: string;
    hiddenDetailsLabel: string;
    hiddenDetailsDetail: string;
    mobileStructureSummary: string;
    mobileHiddenDetailSummary: string;
  };
  fieldConfiguration: {
    title: string;
    kickerLabel: string;
    detail: string;
    searchLabel: string;
    searchPlaceholder: string;
    noSearchResultsText: string;
    defaultOrderPlaceholder: string;
    customSettingsStatusLabel: string;
    defaultSettingsStatusLabel: string;
    fieldLabelFieldLabel: string;
    fieldHelpTextFieldLabel: string;
    fieldOrderFieldLabel: string;
    fieldHiddenToggleLabel: string;
    currentVocabularyLabel: string;
    noVocabularyOptionLabel: string;
    vocabularyLabel: string;
    vocabularyModeLabel: string;
    vocabularyModeOptions: {
      label: string;
      value: WorldVocabularyMode;
    }[];
    chooseVocabularyBeforeModeText: string;
    relationshipBackedVocabularyHelpText: string;
    fieldLabelRequiredError: string;
    displayOrderInvalidError: string;
  };
  vocabulary: {
    title: string;
    kickerLabel: string;
    detail: string;
    activeValuesTitle: string;
    searchValuesLabel: string;
    valueLabelFieldLabel: string;
    valueDescriptionFieldLabel: string;
    valueAliasesFieldLabel: string;
    aliasesHelpText: string;
    newValueLabelFieldLabel: string;
    newValueDescriptionFieldLabel: string;
    newValueAliasesFieldLabel: string;
    archivedRestoreHelpText: string;
    rows: KnowledgeVocabularyRow[];
  };
  hiddenDetails: {
    title: string;
    kickerLabel: string;
    detail: string;
    clearAllActionLabel: string;
    reviewActionAccessibilityLabel: string;
    reviewActionLabel: string;
    reviewActionRoute: string;
    searchLabel: string;
    searchPlaceholder: string;
    noSearchResultsText: string;
    emptyText: string;
    rows: KnowledgeHiddenDetailRow[];
  };
  typeSetup: {
    title: string;
    kickerLabel: string;
    detail: string;
    actionAccessibilityLabel: string;
    actionLabel: string;
    route: string;
    customTypeCount: number;
    customTypeCountLabel: string;
    emptyCustomTypesText: string;
    addFieldsLabel: string;
    addFieldsRequiredError: string;
    customFieldPreviewAccessibilityLabel: string;
    customFieldPreviewTitle: string;
  };
  reusableKnowledge: {
    title: string;
    kickerLabel: string;
    detail: string;
    destinations: KnowledgeReusableDestination[];
    loreDefinitionsTitle: string;
    loreDefinitionsDetail: string;
    loreDefinitions: KnowledgeLoreDefinitionRow[];
  };
  sections: KnowledgeSectionRow[];
  totals: {
    entryTypeCount: number;
    fieldCount: number;
    hiddenDetailCount: number;
    relationshipFieldCount: number;
    customTypeCount: number;
  };
};

export function getKnowledgeRouteFocusTargetId({
  focusId,
}: {
  focusId?: string | null;
}): KnowledgeRouteFocusTargetId | '' {
  if (focusId === knowledgeRouteFocusTargetIds.customEntryTypes) {
    return knowledgeRouteFocusTargetIds.customEntryTypes;
  }
  if (focusId === knowledgeRouteFocusTargetIds.hiddenDetails) {
    return knowledgeRouteFocusTargetIds.hiddenDetails;
  }
  return '';
}

const fieldModeLabels: Record<KnowledgeFieldMode, string> = {
  'controlled-value': 'Controlled value',
  'free-text': 'Free text',
  'multiline-text': 'Multiline text',
  'multi-link': 'Multi link',
  'single-link': 'Single link',
};

function getFieldRoute(section: WorldSectionConfig): string {
  return getCodexEntriesRoute({ sectionId: section.id });
}

function getFieldDetail({
  field,
  mode,
  relationshipType,
  targetSectionTitles,
}: {
  field: WorldDetailField;
  mode: KnowledgeFieldMode;
  relationshipType: string;
  targetSectionTitles: readonly string[];
}) {
  if (mode === 'controlled-value') {
    return field.autocompleteOptions?.length
      ? `${field.autocompleteOptions.length} suggested values.`
      : 'Uses a controlled value list.';
  }
  if (mode === 'single-link') {
    return `Stores one linked record as a ${relationshipType} relationship targeting ${targetSectionTitles.join(
      ', '
    )}.`;
  }
  if (mode === 'multi-link') {
    return `Stores multiple linked records as ${relationshipType} relationships targeting ${targetSectionTitles.join(
      ', '
    )}.`;
  }
  if (mode === 'multiline-text') {
    return 'Supports longer drafting notes.';
  }
  if (field.suggestFromExistingValues) {
    return 'Free text with suggestions from existing records.';
  }
  return 'Flexible text for creator-defined wording.';
}

function toKnowledgeFieldRows(
  section: WorldSectionConfig,
  sections: readonly WorldSectionConfig[],
  activeWorld: WorldWorkspace
): KnowledgeFieldRow[] {
  const relationshipConfigs = new Map(
    getRelationshipFieldConfigsForEntryKind(section.kind).map((config) => [
      config.fieldKey,
      config,
    ])
  );
  const vocabularyById = new Map(
    activeWorld.schema.vocabularies.map((vocabulary) => [
      vocabulary.id,
      vocabulary.name,
    ])
  );
  const fieldOverrides = activeWorld.schema.fieldOverrides[section.id] ?? {};

  return section.detailFields
    .map((sourceField, index) => {
      const override = fieldOverrides[sourceField.key] ?? {};
      return {
        ...sourceField,
        label: override.label?.trim() || sourceField.label,
        __hasOrder: override.order !== undefined,
        __originalIndex: index,
        __order: override.order ?? index + 1,
      };
    })
    .sort(
      (first, second) =>
        first.__order - second.__order ||
        Number(second.__hasOrder) - Number(first.__hasOrder) ||
        first.__originalIndex - second.__originalIndex
    )
    .map((sortedField) => {
      const field: WorldDetailField = {
        key: sortedField.key,
        label: sortedField.label,
        ...(sortedField.multiline ? { multiline: sortedField.multiline } : {}),
        ...(sortedField.autocompleteOptions
          ? { autocompleteOptions: sortedField.autocompleteOptions }
          : {}),
        ...(sortedField.suggestFromExistingValues
          ? {
              suggestFromExistingValues: sortedField.suggestFromExistingValues,
            }
          : {}),
      };
      const sourceField =
        section.detailFields.find((candidate) => candidate.key === field.key) ??
        field;
      const override = fieldOverrides[field.key] ?? {};
      const relationshipConfig = relationshipConfigs.get(field.key);
      const mode: KnowledgeFieldMode = relationshipConfig
        ? relationshipConfig.cardinality === 'one'
          ? 'single-link'
          : 'multi-link'
        : field.autocompleteOptions?.length
        ? 'controlled-value'
        : field.multiline
        ? 'multiline-text'
        : 'free-text';
      const targetSectionTitles = relationshipConfig
        ? sections
            .filter((candidate) =>
              relationshipConfig.targetEntryKinds.includes(candidate.kind)
            )
            .map((candidate) => candidate.title)
        : [];
      const relationshipType = relationshipConfig?.relationshipType ?? '';
      const vocabularyMode = override.vocabularyMode ?? 'suggestions';

      return {
        key: field.key,
        label: field.label,
        baseLabel: sourceField.label,
        mode,
        modeLabel: fieldModeLabels[mode],
        backingLabel: relationshipConfig
          ? `Relationship: ${relationshipType}`
          : 'Entry field',
        detail: getFieldDetail({
          field,
          mode,
          relationshipType,
          targetSectionTitles,
        }),
        helpText: override.helpText ?? '',
        hidden: Boolean(override.hidden),
        order: override.order ?? null,
        settingsHelpFieldLabel: `Help text for ${field.label} in ${section.title}`,
        settingsHiddenFieldLabel: `Hide ${field.label} from editors in ${section.title}`,
        settingsLabelFieldLabel: `Label for ${field.label} in ${section.title}`,
        settingsOrderFieldLabel: `Display order for ${field.label} in ${section.title}`,
        settingsVocabularyFieldLabel: `Vocabulary for ${field.label} in ${section.title}`,
        settingsVocabularyModeFieldLabel: `Vocabulary mode for ${field.label} in ${section.title}`,
        vocabularyId: override.vocabularyId ?? '',
        vocabularyName: override.vocabularyId
          ? vocabularyById.get(override.vocabularyId) ?? 'Unknown vocabulary'
          : '',
        vocabularyMode,
        vocabularyModeLabel: getVocabularyModeLabel(vocabularyMode),
        moveFieldDownAccessibilityLabel: `Move ${field.label} down in ${section.title}`,
        moveFieldUpAccessibilityLabel: `Move ${field.label} up in ${section.title}`,
        removeFieldAccessibilityLabel: `Remove ${field.label} from ${section.title}`,
        removeFieldAccessibilityHint:
          'Removes this field from the custom type. Existing entry values stay saved as hidden details.',
        removeFieldConfirmationSubject: `${field.label} from ${section.title}`,
        relationshipType,
        renameFieldLabel: `Rename ${field.label} in ${section.title}`,
        retainedValueSummary: `${field.label}: ${fieldModeLabels[mode]}; values stay saved under ${field.key}.`,
        resetSettingsAccessibilityLabel: `Reset ${field.label} settings in ${section.title} to defaults`,
        resetSettingsLabel: 'Reset to Defaults',
        updateFieldLabelAccessibilityLabel: `Update ${field.label} label in ${section.title}`,
        updateSettingsAccessibilityLabel: `Update ${field.label} settings in ${section.title}`,
        updateSettingsLabel: 'Update Field Settings',
        targetSectionTitles,
      };
    });
}

function getVocabularyModeLabel(mode: WorldVocabularyMode): string {
  return mode === 'restricted' ? 'Restricted choices' : 'Suggested choices';
}

function formatKnowledgeCount(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? '' : 's'}`;
}

function sortVocabularyValues(
  values: readonly WorldVocabularyValue[],
  vocabularyName: string
): KnowledgeVocabularyValueRow[] {
  return [...values]
    .sort(
      (first, second) =>
        (first.order ?? Number.MAX_SAFE_INTEGER) -
          (second.order ?? Number.MAX_SAFE_INTEGER) ||
        first.label.localeCompare(second.label)
    )
    .map((value) => ({
      archiveAccessibilityLabel: `Archive ${value.label} from ${vocabularyName}`,
      archiveLabel: 'Archive',
      aliasesFieldLabel: `Edit ${value.label} aliases`,
      descriptionFieldLabel: `Edit ${value.label} description`,
      id: value.id,
      label: value.label,
      labelFieldLabel: `Edit ${value.label} label`,
      description: value.description,
      aliases: [...value.aliases],
      moveDownAccessibilityLabel: `Move ${value.label} down in ${vocabularyName}`,
      moveDownLabel: 'Move Down',
      moveUpAccessibilityLabel: `Move ${value.label} up in ${vocabularyName}`,
      moveUpLabel: 'Move Up',
      restoreAccessibilityLabel: `Restore ${value.label} to ${vocabularyName}`,
      restoreLabel: `Restore ${value.label}`,
      updateAccessibilityLabel: `Update ${value.label} in ${vocabularyName}`,
      updateLabel: 'Update Value',
      status: value.status,
      ...(value.order !== undefined ? { order: value.order } : {}),
    }));
}

function getVocabularyFieldUsages(
  activeWorld: WorldWorkspace,
  vocabularyId: string,
  vocabularyName: string
): KnowledgeVocabularyFieldUsageRow[] {
  const sectionById = new Map(
    activeWorld.entryTypes.map((section) => [section.id, section])
  );
  return Object.entries(activeWorld.schema.fieldOverrides).flatMap(
    ([sectionId, fields]) => {
      const section = sectionById.get(sectionId);
      if (!section) {
        return [];
      }
      return Object.entries(fields).flatMap(([fieldKey, override]) => {
        if (override.vocabularyId !== vocabularyId) {
          return [];
        }
        const field = section.detailFields.find(
          (candidate) => candidate.key === fieldKey
        );
        if (!field) {
          return [];
        }
        const mode = override.vocabularyMode ?? 'suggestions';
        return [
          {
            id: `${sectionId}:${fieldKey}`,
            sectionId,
            sectionTitle: section.title,
            fieldKey,
            fieldLabel: override.label ?? field.label,
            mode,
            modeLabel: getVocabularyModeLabel(mode),
            openAccessibilityLabel: `Open ${section.title} fields using ${vocabularyName}`,
            openLabel: `Open ${section.title}`,
            route: getFieldRoute(section),
            summaryText: `${section.title}: ${
              override.label ?? field.label
            } (${getVocabularyModeLabel(mode)})`,
          },
        ];
      });
    }
  );
}

function getVocabularyRows(
  activeWorld: WorldWorkspace
): KnowledgeVocabularyRow[] {
  return activeWorld.schema.vocabularies.map((vocabulary) => {
    const activeValues = sortVocabularyValues(
      vocabulary.values.filter((value) => value.status === 'active'),
      vocabulary.name
    );
    const archivedValues = sortVocabularyValues(
      vocabulary.values.filter((value) => value.status === 'archived'),
      vocabulary.name
    );
    const fieldUsages = getVocabularyFieldUsages(
      activeWorld,
      vocabulary.id,
      vocabulary.name
    );
    const valueLabel =
      activeValues.length === 1 ? 'active value' : 'active values';
    const archivedLabel =
      archivedValues.length === 1 ? 'archived value' : 'archived values';
    const fieldLabel = fieldUsages.length === 1 ? 'field uses' : 'fields use';

    return {
      addValueAccessibilityLabel: `Add value to ${vocabulary.name}`,
      addValueLabel: 'Add Value',
      archivedValuesLabel: `${vocabulary.name} archived values`,
      fieldUsageLabel: `${vocabulary.name} field usage`,
      fieldUsageSummaryIntro: `${vocabulary.name} field usage: used by`,
      id: vocabulary.id,
      newValueAliasesFieldLabel: `New ${vocabulary.name} aliases`,
      newValueDescriptionFieldLabel: `New ${vocabulary.name} description`,
      newValueLabelFieldLabel: `New ${vocabulary.name} value`,
      noActiveValuesText: `No active ${vocabulary.name} values.`,
      noMatchingValuesText: `No active ${vocabulary.name} values match this search.`,
      searchValuesFieldLabel: `Search ${vocabulary.name} values`,
      searchValuesPlaceholder: `Search ${vocabulary.name}`,
      showAllValuesLabel: `Show All ${vocabulary.name} Values`,
      showFewerValuesLabel: `Show Fewer ${vocabulary.name} Values`,
      statusSummary: `${activeValues.length} ${valueLabel}; ${archivedValues.length} ${archivedLabel}`,
      name: vocabulary.name,
      description: vocabulary.description,
      summary: `${activeValues.length} ${valueLabel}; ${archivedValues.length} ${archivedLabel}; ${fieldUsages.length} ${fieldLabel} this vocabulary.`,
      activeCount: activeValues.length,
      archivedCount: archivedValues.length,
      fieldUsages,
      values: activeValues,
      archivedValues,
    };
  });
}

function getLoreDefinitionRows(
  activeWorld: WorldWorkspace
): KnowledgeLoreDefinitionRow[] {
  const loreEntries = getEntries(activeWorld.codex, 'lore');
  const counts = new Map<string, number>();
  for (const entry of loreEntries) {
    const label = entry.fields.category?.trim();
    if (label) {
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort(
      ([firstLabel, firstCount], [secondLabel, secondCount]) =>
        secondCount - firstCount || firstLabel.localeCompare(secondLabel)
    )
    .map(([label, count]) => ({
      id: label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      label,
      count,
      countLabel: `${count} ${count === 1 ? 'lore note' : 'lore notes'}`,
      openAccessibilityLabel: `Open Lore notes for ${label}`,
      openLabel: 'Open Lore',
      route: getCodexEntriesRoute({ sectionId: 'lore', query: label }),
    }));
}

function getHiddenDetailRows(
  activeWorld: WorldWorkspace,
  sections: readonly KnowledgeSectionRow[]
): KnowledgeHiddenDetailRow[] {
  const sectionById = new Map(
    activeWorld.entryTypes.map((section) => [section.id, section])
  );
  return sections.flatMap((sectionRow) => {
    const section = sectionById.get(sectionRow.id);
    if (!section) {
      return [];
    }
    return getEntries(activeWorld.codex, section.id).flatMap((entry) =>
      getHiddenEntryDetailValues(section, entry.fields, activeWorld.schema).map(
        (field) => ({
          id: `${section.id}:${entry.id}:${field.key}`,
          clearAccessibilityLabel: `Clear hidden detail ${field.label} from ${entry.name}`,
          clearLabel: 'Clear Detail',
          sectionId: section.id,
          sectionTitle: section.title,
          entryId: entry.id,
          entryName: entry.name,
          fieldKey: field.key,
          fieldLabel: field.label,
          reviewAccessibilityLabel: `Review ${entry.name} for hidden detail ${field.label}`,
          reviewLabel: 'Review Entry',
          value: field.value,
          route: getCodexEntriesRoute({
            entryId: entry.id,
            intent: 'edit',
            query: entry.name,
            sectionId: section.id,
          }),
        })
      )
    );
  });
}

export function getKnowledgeSchemaModel(
  activeWorld: WorldWorkspace
): KnowledgeSchemaModel {
  const sections = activeWorld.entryTypes.map((section) => {
    const fields = toKnowledgeFieldRows(
      section,
      activeWorld.entryTypes,
      activeWorld
    );
    const relationshipFieldCount = fields.filter(
      (field) => field.mode === 'single-link' || field.mode === 'multi-link'
    ).length;
    const entryCount = getEntries(activeWorld.codex, section.id).length;
    const fieldCountLabel = formatKnowledgeCount(fields.length, 'field');
    const relationshipFieldCountLabel = formatKnowledgeCount(
      relationshipFieldCount,
      'relationship-backed field'
    );

    return {
      addFieldsAccessibilityLabel: `Add fields to ${section.title}`,
      addFieldsFieldLabel: `Add fields to ${section.title}`,
      addFieldsPreviewLabel: `New ${section.title} field preview`,
      id: section.id,
      title: section.title,
      singularTitle: section.singularTitle,
      description: section.description,
      custom: Boolean(section.custom),
      deleteTypeAccessibilityLabel: `Delete custom entry type ${section.title}`,
      deleteTypeAccessibilityHint:
        'Deletes this custom entry type, its entries, and its relationships after confirmation.',
      deleteTypeConfirmationSubject: section.title,
      kindLabel: section.custom ? 'Custom entry type' : 'Built-in entry type',
      entryCount,
      entryCountLabel: `${entryCount} ${
        entryCount === 1 ? 'record' : 'records'
      }`,
      fieldCount: fields.length,
      fieldCountLabel,
      fieldConfigurationSummary: `${
        section.title
      }: ${fieldCountLabel}, ${entryCount} ${
        entryCount === 1 ? 'record' : 'records'
      }.`,
      fieldOrderAccessibilityLabel: `${section.title} field order`,
      fieldOrderTitle: 'Field order',
      openAccessibilityLabel: `Open ${section.title} records`,
      openLabel: `Open ${section.title}`,
      relationshipFieldCount,
      relationshipFieldCountLabel,
      route: getFieldRoute(section),
      schemaSummary: `${section.title}: ${fieldCountLabel}, ${relationshipFieldCountLabel}.`,
      fields,
    };
  });
  const destinations = sections
    .filter((section) => section.id === 'factions' || section.id === 'lore')
    .map((section) => ({
      id: section.id as 'factions' | 'lore',
      title: section.title,
      detail: section.description,
      openAccessibilityLabel: `Open ${section.title} reusable knowledge`,
      openLabel: `Open ${section.title}`,
      route: section.route,
    }));
  const customTypeCount = sections.filter((section) => section.custom).length;
  const vocabularyRows = getVocabularyRows(activeWorld);
  const loreDefinitions = getLoreDefinitionRows(activeWorld);
  const hiddenDetailRows = getHiddenDetailRows(activeWorld, sections);
  const fieldCount = sections.reduce(
    (sum, section) => sum + section.fieldCount,
    0
  );
  const relationshipFieldCount = sections.reduce(
    (sum, section) => sum + section.relationshipFieldCount,
    0
  );
  const entryTypeCountText = formatKnowledgeCount(
    sections.length,
    'entry type'
  );
  const fieldCountText = formatKnowledgeCount(fieldCount, 'field');
  const relationshipFieldCountText = formatKnowledgeCount(
    relationshipFieldCount,
    'relationship-backed field'
  );
  const hiddenDetailCountText = formatKnowledgeCount(
    hiddenDetailRows.length,
    'hidden detail cleanup target'
  );

  return {
    title: knowledgeSchemaCopy.title,
    actionDialogKickerLabel: knowledgeSchemaCopy.actionDialogKickerLabel,
    entryTypesTitle: knowledgeSchemaCopy.entryTypesTitle,
    entryTypesKickerLabel: knowledgeSchemaCopy.entryTypesKickerLabel,
    relationshipFieldsTitle: knowledgeSchemaCopy.relationshipFieldsTitle,
    overview: {
      entryTypesLabel: knowledgeSchemaCopy.overviewEntryTypesLabel,
      entryTypesDetail: `${formatKnowledgeCount(
        customTypeCount,
        'custom type'
      )}.`,
      fieldsLabel: knowledgeSchemaCopy.overviewFieldsLabel,
      fieldsDetail: knowledgeSchemaCopy.overviewFieldsDetail,
      relationshipFieldsLabel:
        knowledgeSchemaCopy.overviewRelationshipFieldsLabel,
      relationshipFieldsDetail:
        knowledgeSchemaCopy.overviewRelationshipFieldsDetail,
      hiddenDetailsLabel: knowledgeSchemaCopy.overviewHiddenDetailsLabel,
      hiddenDetailsDetail: knowledgeSchemaCopy.overviewHiddenDetailsDetail,
      mobileStructureSummary: `${entryTypeCountText}, ${fieldCountText}, and ${relationshipFieldCountText}.`,
      mobileHiddenDetailSummary: `${hiddenDetailCountText}.`,
    },
    fieldConfiguration: {
      title: knowledgeSchemaCopy.fieldConfigurationTitle,
      kickerLabel: knowledgeSchemaCopy.fieldConfigurationKickerLabel,
      detail: knowledgeSchemaCopy.fieldConfigurationDetail,
      searchLabel: knowledgeSchemaCopy.fieldConfigurationSearchLabel,
      searchPlaceholder:
        knowledgeSchemaCopy.fieldConfigurationSearchPlaceholder,
      noSearchResultsText:
        knowledgeSchemaCopy.fieldConfigurationNoSearchResultsText,
      defaultOrderPlaceholder:
        knowledgeSchemaCopy.fieldConfigurationDefaultOrderPlaceholder,
      customSettingsStatusLabel:
        knowledgeSchemaCopy.fieldConfigurationCustomSettingsStatusLabel,
      defaultSettingsStatusLabel:
        knowledgeSchemaCopy.fieldConfigurationDefaultSettingsStatusLabel,
      fieldLabelFieldLabel:
        knowledgeSchemaCopy.fieldConfigurationFieldLabelFieldLabel,
      fieldHelpTextFieldLabel:
        knowledgeSchemaCopy.fieldConfigurationFieldHelpTextFieldLabel,
      fieldOrderFieldLabel:
        knowledgeSchemaCopy.fieldConfigurationFieldOrderFieldLabel,
      fieldHiddenToggleLabel:
        knowledgeSchemaCopy.fieldConfigurationFieldHiddenToggleLabel,
      currentVocabularyLabel:
        knowledgeSchemaCopy.fieldConfigurationCurrentVocabularyLabel,
      noVocabularyOptionLabel:
        knowledgeSchemaCopy.fieldConfigurationNoVocabularyOptionLabel,
      vocabularyLabel: knowledgeSchemaCopy.fieldConfigurationVocabularyLabel,
      vocabularyModeLabel:
        knowledgeSchemaCopy.fieldConfigurationVocabularyModeLabel,
      vocabularyModeOptions: [
        { label: getVocabularyModeLabel('suggestions'), value: 'suggestions' },
        { label: getVocabularyModeLabel('restricted'), value: 'restricted' },
      ],
      chooseVocabularyBeforeModeText:
        knowledgeSchemaCopy.fieldConfigurationChooseVocabularyBeforeModeText,
      relationshipBackedVocabularyHelpText:
        knowledgeSchemaCopy.fieldConfigurationRelationshipBackedVocabularyHelpText,
      fieldLabelRequiredError:
        knowledgeSchemaCopy.fieldConfigurationFieldLabelRequiredError,
      displayOrderInvalidError:
        knowledgeSchemaCopy.fieldConfigurationDisplayOrderInvalidError,
    },
    typeSetup: {
      title: knowledgeSchemaCopy.typeSetupTitle,
      kickerLabel: knowledgeSchemaCopy.typeSetupKickerLabel,
      detail: knowledgeSchemaCopy.typeSetupDetail,
      actionAccessibilityLabel: 'Open Type Setup section',
      actionLabel: knowledgeSchemaCopy.typeSetupActionLabel,
      route: `${codexShellRoutes.knowledge.path}#${knowledgeRouteFocusTargetIds.customEntryTypes}`,
      customTypeCount,
      customTypeCountLabel: `${customTypeCount} ${knowledgeSchemaCopy.typeSetupCustomTypeCountLabel}`,
      emptyCustomTypesText: knowledgeSchemaCopy.typeSetupEmptyCustomTypesText,
      addFieldsLabel: knowledgeSchemaCopy.typeSetupAddFieldsLabel,
      addFieldsRequiredError:
        knowledgeSchemaCopy.typeSetupAddFieldsRequiredError,
      customFieldPreviewAccessibilityLabel:
        knowledgeSchemaCopy.typeSetupCustomFieldPreviewAccessibilityLabel,
      customFieldPreviewTitle:
        knowledgeSchemaCopy.typeSetupCustomFieldPreviewTitle,
    },
    reusableKnowledge: {
      title: knowledgeSchemaCopy.reusableKnowledgeTitle,
      kickerLabel: knowledgeSchemaCopy.reusableKnowledgeKickerLabel,
      detail: knowledgeSchemaCopy.reusableKnowledgeDetail,
      destinations,
      loreDefinitionsTitle: knowledgeSchemaCopy.loreDefinitionsTitle,
      loreDefinitionsDetail: knowledgeSchemaCopy.loreDefinitionsDetail,
      loreDefinitions,
    },
    vocabulary: {
      title: knowledgeSchemaCopy.vocabularyTitle,
      kickerLabel: knowledgeSchemaCopy.vocabularyKickerLabel,
      detail: knowledgeSchemaCopy.vocabularyDetail,
      activeValuesTitle: knowledgeSchemaCopy.vocabularyActiveValuesTitle,
      searchValuesLabel: knowledgeSchemaCopy.vocabularySearchValuesLabel,
      valueLabelFieldLabel: knowledgeSchemaCopy.vocabularyValueLabelFieldLabel,
      valueDescriptionFieldLabel:
        knowledgeSchemaCopy.vocabularyValueDescriptionFieldLabel,
      valueAliasesFieldLabel:
        knowledgeSchemaCopy.vocabularyValueAliasesFieldLabel,
      aliasesHelpText: knowledgeSchemaCopy.vocabularyAliasesHelpText,
      newValueLabelFieldLabel:
        knowledgeSchemaCopy.vocabularyNewValueLabelFieldLabel,
      newValueDescriptionFieldLabel:
        knowledgeSchemaCopy.vocabularyNewValueDescriptionFieldLabel,
      newValueAliasesFieldLabel:
        knowledgeSchemaCopy.vocabularyNewValueAliasesFieldLabel,
      archivedRestoreHelpText:
        knowledgeSchemaCopy.vocabularyArchivedRestoreHelpText,
      rows: vocabularyRows,
    },
    hiddenDetails: {
      title: knowledgeSchemaCopy.hiddenDetailsTitle,
      kickerLabel: knowledgeSchemaCopy.hiddenDetailsKickerLabel,
      detail: knowledgeSchemaCopy.hiddenDetailsDetail,
      clearAllActionLabel: getDestructiveActionCopy(
        'clear-hidden-entry-details'
      ).confirmLabel,
      reviewActionAccessibilityLabel: `Review ${
        hiddenDetailRows.length
      } hidden detail cleanup ${
        hiddenDetailRows.length === 1 ? 'target' : 'targets'
      }`,
      reviewActionLabel: 'Review Cleanup',
      reviewActionRoute: `${codexShellRoutes.knowledge.path}#${knowledgeRouteFocusTargetIds.hiddenDetails}`,
      searchLabel: knowledgeSchemaCopy.hiddenDetailsSearchLabel,
      searchPlaceholder: knowledgeSchemaCopy.hiddenDetailsSearchPlaceholder,
      noSearchResultsText: knowledgeSchemaCopy.hiddenDetailsNoSearchResultsText,
      emptyText: knowledgeSchemaCopy.hiddenDetailsEmptyText,
      rows: hiddenDetailRows,
    },
    sections,
    totals: {
      entryTypeCount: sections.length,
      fieldCount,
      hiddenDetailCount: hiddenDetailRows.length,
      relationshipFieldCount,
      customTypeCount,
    },
  };
}
