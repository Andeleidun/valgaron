import {
  filterRelationshipTargetOptions,
  entryEditorDisplayLimits,
  getDraftDetailFields,
  getEntryEditorDetailFieldGroups,
  getEntryHiddenDetailCleanupModel,
  getRelationshipFieldLinks,
  getRelationshipFieldTargetId,
  getRelationshipTargetOptionDisplay,
  getRelationshipTargetOptions,
  getRelationshipFieldConfigsForEntryKind,
  mobileFeatureDisplayLimits,
  type EntryDraft,
  type RelationshipFieldConfig,
  type WorldCodex,
  type WorldEntry,
  type WorldRelationship,
  type WorldSectionConfig,
  type WorldWorkspaceSchema,
} from '@valgaron/core';

export type MobileLinkedFieldDisplayModel = {
  config: RelationshipFieldConfig;
  fieldQuery: string;
  fieldRelationships: readonly WorldRelationship[];
  filteredOptions: ReturnType<typeof filterRelationshipTargetOptions>;
  hiddenPreferredCount: number;
  optionDisplay: ReturnType<typeof getRelationshipTargetOptionDisplay>;
  options: ReturnType<typeof getRelationshipTargetOptions>;
  selectedTargetIds: ReadonlySet<string>;
  visibleOptions: ReturnType<
    typeof getRelationshipTargetOptionDisplay
  >['visibleOptions'];
};

export type MobileEntryEditorModel = {
  activeRelationshipFieldConfigs: readonly RelationshipFieldConfig[];
  detailFieldGroups: ReturnType<typeof getEntryEditorDetailFieldGroups>;
  editableDetailFields: ReturnType<typeof getDraftDetailFields>;
  hiddenDetailCleanup: ReturnType<typeof getEntryHiddenDetailCleanupModel>;
  legacyRelationshipTextValues: {
    config: RelationshipFieldConfig;
    key: string;
    label: string;
    value: string;
  }[];
  linkedFieldDisplayModels: MobileLinkedFieldDisplayModel[];
  visibleDetailFields: ReturnType<typeof getDraftDetailFields>;
};

export function getMobileEntryEditorModel({
  codex,
  draft,
  expandedLinkedFieldPreferredTargets = {},
  expandedLinkedFieldTargets = {},
  linkedFieldQueries = {},
  relationships = [],
  section,
  sectionEntries,
  sections = [],
  selectedEntry,
  workspaceSchema,
}: {
  codex?: WorldCodex;
  draft: EntryDraft;
  expandedLinkedFieldPreferredTargets?: Readonly<Record<string, boolean>>;
  expandedLinkedFieldTargets?: Readonly<Record<string, boolean>>;
  linkedFieldQueries?: Readonly<Record<string, string>>;
  relationships?: readonly WorldRelationship[];
  section: WorldSectionConfig;
  sectionEntries: readonly WorldEntry[];
  sections?: readonly WorldSectionConfig[];
  selectedEntry: WorldEntry | null;
  workspaceSchema?: WorldWorkspaceSchema;
}): MobileEntryEditorModel {
  const visibleDetailFields = getDraftDetailFields(
    section,
    draft,
    workspaceSchema
  );
  const visibleFieldKeys = new Set(
    visibleDetailFields.map((field) => field.key)
  );
  const activeRelationshipFieldConfigs = selectedEntry?.kind
    ? getRelationshipFieldConfigsForEntryKind(selectedEntry.kind).filter(
        (config) => visibleFieldKeys.has(config.fieldKey)
      )
    : [];
  const relationshipFieldKeys = new Set(
    activeRelationshipFieldConfigs.map((config) => config.fieldKey)
  );
  const editableDetailFields =
    selectedEntry?.kind &&
    getRelationshipFieldConfigsForEntryKind(selectedEntry.kind).length > 0
      ? visibleDetailFields.filter(
          (field) => !relationshipFieldKeys.has(field.key)
        )
      : visibleDetailFields;
  const detailFieldGroups = getEntryEditorDetailFieldGroups({
    draft,
    fields: editableDetailFields,
    section,
    sectionEntries,
    suggestionLimit: entryEditorDisplayLimits.detailSuggestions,
    workspaceSchema,
  });
  const hiddenDetailCleanup = getEntryHiddenDetailCleanupModel(
    section,
    draft,
    workspaceSchema
  );
  const legacyRelationshipTextValues = activeRelationshipFieldConfigs
    .map((config) => ({
      config,
      key: config.fieldKey,
      label: config.label,
      value: draft.details[config.fieldKey]?.trim() ?? '',
    }))
    .filter((field) => field.value);
  const linkedFieldDisplayModels =
    selectedEntry && codex && sections.length > 0
      ? activeRelationshipFieldConfigs.map((config) => {
          const fieldRelationships = getRelationshipFieldLinks(
            relationships,
            selectedEntry,
            config
          );
          const selectedTargetIds = new Set(
            fieldRelationships.map((relationship) =>
              getRelationshipFieldTargetId(relationship, config)
            )
          );
          const options = getRelationshipTargetOptions({
            codex,
            config,
            includedTargetIds: selectedTargetIds,
            sections,
            currentEntry: selectedEntry,
          });
          const fieldQuery = linkedFieldQueries[config.fieldKey] ?? '';
          const filteredOptions = filterRelationshipTargetOptions(
            options,
            fieldQuery,
            selectedTargetIds
          );
          const optionDisplay = getRelationshipTargetOptionDisplay({
            expandedPreferredTargets: Boolean(
              expandedLinkedFieldPreferredTargets[config.fieldKey]
            ),
            expandedUnusualTargets: Boolean(
              expandedLinkedFieldTargets[config.fieldKey]
            ),
            limit: mobileFeatureDisplayLimits.relationshipTargetOptions,
            options: filteredOptions,
            selectedTargetIds,
            targetCategoryBehavior: config.targetCategoryBehavior,
          });

          return {
            config,
            fieldQuery,
            fieldRelationships,
            filteredOptions,
            hiddenPreferredCount: optionDisplay.hiddenPreferredCount,
            optionDisplay,
            options,
            selectedTargetIds,
            visibleOptions: optionDisplay.visibleOptions,
          };
        })
      : [];

  return {
    activeRelationshipFieldConfigs,
    detailFieldGroups,
    editableDetailFields,
    hiddenDetailCleanup,
    legacyRelationshipTextValues,
    linkedFieldDisplayModels,
    visibleDetailFields,
  };
}
