import { getEntries } from './codexEntries';
import { getHiddenEntryDetailValues } from './placeTaxonomy';
import { getRelationshipFieldConfigsForEntryKind } from './relationshipFields';
import { codexShellRoutes, getCodexEntriesRoute } from './shell';
import type {
  WorldDetailField,
  WorldSectionConfig,
  WorldWorkspace,
} from './types';

export const knowledgeSchemaCopy = {
  title: 'Knowledge Schema',
  typeSetupTitle: 'Type Setup',
  typeSetupDetail:
    'Create custom entry types, add durable user-defined fields, and review reusable schema choices in one place.',
  typeSetupActionLabel: 'Open Type Setup',
  reusableKnowledgeTitle: 'Reusable Knowledge',
  reusableKnowledgeDetail:
    'Factions and lore notes capture repeated organizations, categories, definitions, customs, and rules that other records can link to.',
  loreDefinitionsTitle: 'Lore Definition Types',
  loreDefinitionsDetail:
    'Observed lore categories show which reusable concepts are already taking shape.',
  entryTypesTitle: 'Entry Types And Fields',
  vocabularyTitle: 'Controlled Values And Observed Fields',
  vocabularyDetail:
    'Review fixed category choices and repeated flexible values before deciding what should become reusable taxonomy.',
  relationshipFieldsTitle: 'Relationship-backed fields',
  noRelationshipFieldsText: 'No relationship-backed fields for this type yet.',
  hiddenDetailsTitle: 'Hidden Detail Cleanup',
  hiddenDetailsDetail:
    'Removed or hidden fields still have saved values on entries until they are cleared from those entries.',
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
  mode: KnowledgeFieldMode;
  modeLabel: string;
  backingLabel: string;
  detail: string;
  relationshipType: string;
  targetSectionTitles: string[];
};

export type KnowledgeSectionRow = {
  id: string;
  title: string;
  singularTitle: string;
  description: string;
  custom: boolean;
  kindLabel: string;
  entryCount: number;
  entryCountLabel: string;
  fieldCount: number;
  relationshipFieldCount: number;
  route: string;
  fields: KnowledgeFieldRow[];
};

export type KnowledgeReusableDestination = {
  id: 'factions' | 'lore';
  title: string;
  detail: string;
  route: string;
};

export type KnowledgeLoreDefinitionRow = {
  id: string;
  label: string;
  count: number;
  countLabel: string;
  route: string;
};

export type KnowledgeVocabularyRow = {
  id: string;
  sectionId: string;
  sectionTitle: string;
  route: string;
  fieldKey: string;
  fieldLabel: string;
  mode: KnowledgeFieldMode;
  modeLabel: string;
  sourceLabel: 'Observed values' | 'Suggested values';
  summary: string;
  values: string[];
};

export type KnowledgeHiddenDetailRow = {
  id: string;
  sectionId: string;
  sectionTitle: string;
  entryId: string;
  entryName: string;
  fieldKey: string;
  fieldLabel: string;
  value: string;
  route: string;
};

export type KnowledgeSchemaModel = {
  title: string;
  entryTypesTitle: string;
  relationshipFieldsTitle: string;
  vocabulary: {
    title: string;
    detail: string;
    rows: KnowledgeVocabularyRow[];
  };
  hiddenDetails: {
    title: string;
    detail: string;
    rows: KnowledgeHiddenDetailRow[];
  };
  typeSetup: {
    title: string;
    detail: string;
    actionLabel: string;
    route: string;
    customTypeCount: number;
  };
  reusableKnowledge: {
    title: string;
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
  return `/${section.id}`;
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
  sections: readonly WorldSectionConfig[]
): KnowledgeFieldRow[] {
  const relationshipConfigs = new Map(
    getRelationshipFieldConfigsForEntryKind(section.kind).map((config) => [
      config.fieldKey,
      config,
    ])
  );

  return section.detailFields.map((field) => {
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

    return {
      key: field.key,
      label: field.label,
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
      relationshipType,
      targetSectionTitles,
    };
  });
}

function getObservedFieldValues(
  activeWorld: WorldWorkspace,
  section: WorldSectionConfig,
  field: WorldDetailField
): string[] {
  return Array.from(
    new Set(
      getEntries(activeWorld.codex, section.id)
        .map((entry) => entry.fields[field.key]?.trim() ?? '')
        .filter(Boolean)
    )
  ).sort((first, second) => first.localeCompare(second));
}

function getVocabularyRows(
  activeWorld: WorldWorkspace,
  sections: readonly KnowledgeSectionRow[]
): KnowledgeVocabularyRow[] {
  const sectionById = new Map(
    activeWorld.entryTypes.map((section) => [section.id, section])
  );
  return sections.flatMap((sectionRow) => {
    const section = sectionById.get(sectionRow.id);
    if (!section) {
      return [];
    }
    return sectionRow.fields.flatMap((fieldRow) => {
      if (fieldRow.mode === 'single-link' || fieldRow.mode === 'multi-link') {
        return [];
      }
      const field = section.detailFields.find(
        (candidate) => candidate.key === fieldRow.key
      );
      if (!field) {
        return [];
      }
      const suggestedValues = field.autocompleteOptions
        ? [...field.autocompleteOptions]
        : [];
      const observedValues = getObservedFieldValues(
        activeWorld,
        section,
        field
      );
      const values =
        fieldRow.mode === 'controlled-value' ? suggestedValues : observedValues;
      if (values.length === 0) {
        return [];
      }
      const sourceLabel =
        fieldRow.mode === 'controlled-value'
          ? 'Suggested values'
          : 'Observed values';
      return [
        {
          id: `${section.id}:${field.key}`,
          sectionId: section.id,
          sectionTitle: section.title,
          route: sectionRow.route,
          fieldKey: field.key,
          fieldLabel: field.label,
          mode: fieldRow.mode,
          modeLabel: fieldRow.modeLabel,
          sourceLabel,
          summary:
            sourceLabel === 'Suggested values'
              ? `${values.length} suggested ${
                  values.length === 1 ? 'value' : 'values'
                } define the current choice set.`
              : `${values.length} observed workspace ${
                  values.length === 1 ? 'value' : 'values'
                } can guide whether this field stays flexible or becomes reusable knowledge.`,
          values,
        } satisfies KnowledgeVocabularyRow,
      ];
    });
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
      route: `/lore?query=${encodeURIComponent(label)}`,
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
      getHiddenEntryDetailValues(section, entry.fields).map((field) => ({
        id: `${section.id}:${entry.id}:${field.key}`,
        sectionId: section.id,
        sectionTitle: section.title,
        entryId: entry.id,
        entryName: entry.name,
        fieldKey: field.key,
        fieldLabel: field.label,
        value: field.value,
        route: getCodexEntriesRoute({
          entryId: entry.id,
          intent: 'edit',
          query: entry.name,
          sectionId: section.id,
        }),
      }))
    );
  });
}

export function getKnowledgeSchemaModel(
  activeWorld: WorldWorkspace
): KnowledgeSchemaModel {
  const sections = activeWorld.entryTypes.map((section) => {
    const fields = toKnowledgeFieldRows(section, activeWorld.entryTypes);
    const relationshipFieldCount = fields.filter(
      (field) => field.mode === 'single-link' || field.mode === 'multi-link'
    ).length;
    const entryCount = getEntries(activeWorld.codex, section.id).length;

    return {
      id: section.id,
      title: section.title,
      singularTitle: section.singularTitle,
      description: section.description,
      custom: Boolean(section.custom),
      kindLabel: section.custom ? 'Custom entry type' : 'Built-in entry type',
      entryCount,
      entryCountLabel: `${entryCount} ${
        entryCount === 1 ? 'record' : 'records'
      }`,
      fieldCount: fields.length,
      relationshipFieldCount,
      route: getFieldRoute(section),
      fields,
    };
  });
  const destinations = sections
    .filter((section) => section.id === 'factions' || section.id === 'lore')
    .map((section) => ({
      id: section.id as 'factions' | 'lore',
      title: section.title,
      detail: section.description,
      route: section.route,
    }));
  const customTypeCount = sections.filter((section) => section.custom).length;
  const vocabularyRows = getVocabularyRows(activeWorld, sections);
  const loreDefinitions = getLoreDefinitionRows(activeWorld);
  const hiddenDetailRows = getHiddenDetailRows(activeWorld, sections);

  return {
    title: knowledgeSchemaCopy.title,
    entryTypesTitle: knowledgeSchemaCopy.entryTypesTitle,
    relationshipFieldsTitle: knowledgeSchemaCopy.relationshipFieldsTitle,
    typeSetup: {
      title: knowledgeSchemaCopy.typeSetupTitle,
      detail: knowledgeSchemaCopy.typeSetupDetail,
      actionLabel: knowledgeSchemaCopy.typeSetupActionLabel,
      route: `${codexShellRoutes.knowledge.path}#${knowledgeRouteFocusTargetIds.customEntryTypes}`,
      customTypeCount,
    },
    reusableKnowledge: {
      title: knowledgeSchemaCopy.reusableKnowledgeTitle,
      detail: knowledgeSchemaCopy.reusableKnowledgeDetail,
      destinations,
      loreDefinitionsTitle: knowledgeSchemaCopy.loreDefinitionsTitle,
      loreDefinitionsDetail: knowledgeSchemaCopy.loreDefinitionsDetail,
      loreDefinitions,
    },
    vocabulary: {
      title: knowledgeSchemaCopy.vocabularyTitle,
      detail: knowledgeSchemaCopy.vocabularyDetail,
      rows: vocabularyRows,
    },
    hiddenDetails: {
      title: knowledgeSchemaCopy.hiddenDetailsTitle,
      detail: knowledgeSchemaCopy.hiddenDetailsDetail,
      rows: hiddenDetailRows,
    },
    sections,
    totals: {
      entryTypeCount: sections.length,
      fieldCount: sections.reduce(
        (sum, section) => sum + section.fieldCount,
        0
      ),
      hiddenDetailCount: hiddenDetailRows.length,
      relationshipFieldCount: sections.reduce(
        (sum, section) => sum + section.relationshipFieldCount,
        0
      ),
      customTypeCount,
    },
  };
}
