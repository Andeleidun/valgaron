import { getEntries } from './codexEntries';
import { relationshipFromDraft } from './codexRelationships';
import {
  formatHiddenResultCountMessage,
  pluralizeCountLabel,
} from './featureDisplayLimits';
import {
  buildRelationshipTextMigration,
  splitRelationshipTextFragments,
  type RelationshipTextMigrationResult,
} from './relationshipTextMigration';
import {
  getEntryDetailFields,
  placeRelationshipFieldConfigs,
} from './placeTaxonomy';
import {
  characterRelationshipFieldConfigs,
  type CharacterRelationshipFieldConfig,
} from './characterTaxonomy';
import type {
  WorldCodex,
  WorldEntry,
  WorldRelationship,
  WorldSectionConfig,
} from './types';

export type RelationshipTargetOption = {
  entry: WorldEntry;
  section: WorldSectionConfig;
  isPreferredTarget: boolean;
  targetCategoryWarning?: string;
};

export type RelationshipFieldConfig = {
  fieldKey: string;
  label: string;
  relationshipType: string;
  directional: boolean;
  cardinality: 'one' | 'many';
  currentEntryRole: 'source' | 'target';
  targetEntryKinds: readonly string[];
  targetPlaceCategories?: readonly string[];
  targetCategoryBehavior?: 'hard' | 'preferred' | 'soft';
};

function characterConfigToRelationshipFieldConfig(
  config: CharacterRelationshipFieldConfig
): RelationshipFieldConfig {
  return {
    fieldKey: config.fieldKey,
    label: config.label,
    relationshipType: config.relationshipTypeLabel,
    directional: config.directional,
    cardinality: config.cardinality,
    currentEntryRole: config.currentEntryRole,
    targetEntryKinds: config.targetEntryKinds,
  };
}

export function getRelationshipFieldConfigsForEntryKind(
  entryKind: string
): RelationshipFieldConfig[] {
  if (entryKind === 'place') {
    return [...placeRelationshipFieldConfigs];
  }
  if (entryKind === 'character') {
    return characterRelationshipFieldConfigs.map(
      characterConfigToRelationshipFieldConfig
    );
  }
  return [];
}

export type RelationshipTargetOptionDisplay = {
  visibleOptions: RelationshipTargetOption[];
  hiddenPreferredCount: number;
  hiddenPreferredMessage: string;
  hiddenUnusualCount: number;
  canExpandUnusualTargets: boolean;
  showUnusualTargetsLabel: string;
};

export type RelationshipTextReviewItem = {
  entryId: string;
  entryName: string;
  sectionId: string;
  fieldKey: string;
  fieldLabel: string;
  value: string;
  exactMatchCount: number;
  exactTargetIds: string[];
  remainingText: string;
  unresolvedFragments: string[];
  suggestedTargets: {
    fragment: string;
    targets: {
      id: string;
      name: string;
      context: string;
    }[];
  }[];
  ambiguousFragments: {
    fragment: string;
    targetIds: string[];
  }[];
};

export const relationshipTextReviewCopy = {
  title: 'Legacy Link Text',
  batchExactMatchLabel: 'Migrate All Exact Matches',
  draftBlockedMessage:
    'Save or discard the current entry draft before migrating exact matches.',
  exactMatchMigrationLabel: 'Migrate Exact Matches',
  hiddenEntryDetailsTitle: 'Hidden entry details',
  linkedFieldsBlockedMessage:
    'Save this entry before editing relationship links.',
  linkedFieldsDescription:
    'These fields are saved as relationships so linked records stay navigable from both sides.',
  linkedFieldsTitle: 'Linked relationship fields',
  noExactMatchesFound: 'No exact matches found.',
  reviewEntryLabel: 'Review Entry',
  savedTextLinkNotesTitle: 'Saved text link notes',
  unmatchedTextWillRemain: 'Unmatched text will remain.',
} as const;

export const relationshipFieldCopy = {
  clearLinkedRecordsLabel: 'Clear linked records',
  createMatchingRecordsMessage:
    'Create matching records before linking this field.',
  noLinkedRecordLabel: 'No linked record',
  noMatchingTargetsMessage:
    'No matching records. Clear the search to see all targets.',
  searchPlaceholder: 'Filter linked record targets',
} as const;

export function getRelationshipTextReviewSummary(count: number): string {
  return `${count} relationship-backed field${count === 1 ? '' : 's'} ${
    count === 1 ? 'contains' : 'contain'
  } saved text that can be reviewed or migrated to relationships.`;
}

export function getRelationshipTextMigrationStatus({
  remainingText,
  targetIds,
}: Pick<
  RelationshipTextMigrationResult,
  'remainingText' | 'targetIds'
>): string {
  const matchText =
    targetIds.length > 0
      ? `${targetIds.length} exact match${
          targetIds.length === 1 ? '' : 'es'
        } found.`
      : relationshipTextReviewCopy.noExactMatchesFound;
  return remainingText
    ? `${matchText} ${relationshipTextReviewCopy.unmatchedTextWillRemain}`
    : matchText;
}

export type RelationshipTextReviewMigration = {
  relationshipIdsToDelete: string[];
  relationshipsToSave: {
    relationship: WorldRelationship;
    existingRelationship?: WorldRelationship;
  }[];
  fields: Record<string, string>;
};

export type RelationshipFieldTextMigrationOperation = {
  relationshipIdsToDelete: string[];
  relationshipsToSave: {
    relationship: WorldRelationship;
    existingRelationship?: WorldRelationship;
  }[];
  fields: Record<string, string>;
};

export type RelationshipTextReviewBatchMigration = {
  relationshipIdsToDelete: string[];
  relationshipsToSave: {
    relationship: WorldRelationship;
    existingRelationship?: WorldRelationship;
  }[];
  entryFieldUpdates: {
    entryId: string;
    fields: Record<string, string>;
  }[];
};

export type RelationshipTextReviewSuggestionMigrationInput = {
  config: RelationshipFieldConfig;
  entry: WorldEntry;
  fragment: string;
  item: RelationshipTextReviewItem;
  relationships: readonly WorldRelationship[];
  targetEntryId: string;
};

export function getRelationshipTextReviewUnresolvedLabel(
  item: RelationshipTextReviewItem
): string {
  const label = [
    ...item.unresolvedFragments,
    ...item.ambiguousFragments.map(
      (fragment) => `${fragment.fragment} (duplicate name)`
    ),
  ].join(', ');
  return label || 'None';
}

export function getRelationshipTextReviewExactMatchLabel(
  item: RelationshipTextReviewItem
): string {
  if (item.exactMatchCount === 0) {
    return 'No exact matches available.';
  }
  return `${item.exactMatchCount} exact match${
    item.exactMatchCount === 1 ? '' : 'es'
  } available.`;
}

export function getRelationshipTextReviewSuggestionLabels(
  item: RelationshipTextReviewItem
): string[] {
  return item.suggestedTargets.map(
    (suggestion) =>
      `${suggestion.fragment}: ${suggestion.targets
        .map((target) => `${target.name} (${target.context})`)
        .join(', ')}`
  );
}

export function getRelationshipTargetOptions({
  codex,
  config,
  includedTargetIds,
  sections,
  currentEntry,
}: {
  codex: WorldCodex;
  config: RelationshipFieldConfig;
  includedTargetIds?: ReadonlySet<string>;
  sections: readonly WorldSectionConfig[];
  currentEntry: WorldEntry;
}): RelationshipTargetOption[] {
  const targetCategoryBehavior =
    config.targetCategoryBehavior ??
    (config.targetPlaceCategories && config.targetPlaceCategories.length > 0
      ? 'preferred'
      : 'soft');
  const preferredPlaceCategories = new Set(config.targetPlaceCategories ?? []);

  return sections
    .filter((section) => {
      if (config.targetEntryKinds.includes(section.kind)) {
        return true;
      }
      return getEntries(codex, section.id).some((entry) =>
        includedTargetIds?.has(entry.id)
      );
    })
    .flatMap((section) =>
      getEntries(codex, section.id).flatMap(
        (entry): RelationshipTargetOption[] => {
          const selected = includedTargetIds?.has(entry.id) ?? false;
          if (entry.id === currentEntry.id) {
            return [];
          }
          if (entry.status === 'archived' && !selected) {
            return [];
          }
          const matchesTargetKind = config.targetEntryKinds.includes(
            section.kind
          );
          if (!matchesTargetKind && !selected) {
            return [];
          }
          const hasPreferredPlaceCategories =
            preferredPlaceCategories.size > 0 && section.kind === 'place';
          const isPreferredTarget =
            matchesTargetKind &&
            (!hasPreferredPlaceCategories ||
              preferredPlaceCategories.has(entry.fields.category ?? ''));
          if (
            !isPreferredTarget &&
            !selected &&
            section.kind === 'place' &&
            hasPreferredPlaceCategories &&
            targetCategoryBehavior === 'hard'
          ) {
            return [];
          }
          return [
            {
              entry,
              section,
              isPreferredTarget,
              targetCategoryWarning: isPreferredTarget
                ? undefined
                : 'Unusual target for this field',
            },
          ];
        }
      )
    )
    .sort(
      (first, second) =>
        Number(second.isPreferredTarget) - Number(first.isPreferredTarget) ||
        first.entry.name.localeCompare(second.entry.name)
    );
}

export function getRelationshipFieldTargetId(
  relationship: WorldRelationship,
  config: Pick<RelationshipFieldConfig, 'currentEntryRole'>
): string {
  return config.currentEntryRole === 'source'
    ? relationship.targetEntryId
    : relationship.sourceEntryId;
}

export function getRelationshipFieldLinks(
  relationships: readonly WorldRelationship[],
  entry: WorldEntry,
  config: Pick<
    RelationshipFieldConfig,
    'currentEntryRole' | 'directional' | 'relationshipType'
  >
): WorldRelationship[] {
  return relationships.filter(
    (relationship) =>
      (config.currentEntryRole === 'source'
        ? relationship.sourceEntryId === entry.id
        : relationship.targetEntryId === entry.id) &&
      relationship.type === config.relationshipType &&
      relationship.directional === config.directional
  );
}

export function makeFieldRelationship(
  entry: WorldEntry,
  config: RelationshipFieldConfig,
  targetEntryId: string,
  existingRelationship?: WorldRelationship
): WorldRelationship {
  const sourceEntryId =
    config.currentEntryRole === 'source' ? entry.id : targetEntryId;
  const relationshipTargetEntryId =
    config.currentEntryRole === 'source' ? targetEntryId : entry.id;
  return relationshipFromDraft(
    {
      sourceEntryId,
      targetEntryId: relationshipTargetEntryId,
      type: config.relationshipType,
      directional: config.directional,
      note: existingRelationship?.note ?? '',
      status: existingRelationship?.status ?? 'draft',
    },
    existingRelationship
  );
}

export function filterRelationshipTargetOptions(
  options: readonly RelationshipTargetOption[],
  query: string,
  selectedTargetIds: ReadonlySet<string>
): RelationshipTargetOption[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [...options];
  }
  return options.filter(
    (option) =>
      selectedTargetIds.has(option.entry.id) ||
      [
        option.entry.name,
        option.entry.summary,
        option.section.title,
        option.section.singularTitle,
        option.entry.fields.category,
        ...option.entry.tags,
      ].some((value) => value?.toLowerCase().includes(normalizedQuery))
  );
}

export function limitRelationshipTargetOptions(
  options: readonly RelationshipTargetOption[],
  selectedTargetIds: ReadonlySet<string>,
  limit: number
): RelationshipTargetOption[] {
  const selectedOptions = options.filter((option) =>
    selectedTargetIds.has(option.entry.id)
  );
  const unselectedOptions = options.filter(
    (option) => !selectedTargetIds.has(option.entry.id)
  );
  return [...selectedOptions, ...unselectedOptions].slice(
    0,
    Math.max(limit, selectedOptions.length)
  );
}

export function getRelationshipTargetOptionDisplay({
  expandedUnusualTargets,
  limit,
  options,
  selectedTargetIds,
  targetCategoryBehavior = 'preferred',
}: {
  expandedUnusualTargets: boolean;
  limit: number;
  options: readonly RelationshipTargetOption[];
  selectedTargetIds: ReadonlySet<string>;
  targetCategoryBehavior?: RelationshipFieldConfig['targetCategoryBehavior'];
}): RelationshipTargetOptionDisplay {
  const shouldShowUnusualTargets =
    expandedUnusualTargets || targetCategoryBehavior === 'soft';
  const selectedOptions = options.filter((option) =>
    selectedTargetIds.has(option.entry.id)
  );
  const selectedOptionIds = new Set(
    selectedOptions.map((option) => option.entry.id)
  );
  const preferredOptions = options.filter(
    (option) =>
      option.isPreferredTarget && !selectedOptionIds.has(option.entry.id)
  );
  const unusualOptions = options.filter(
    (option) =>
      !option.isPreferredTarget && !selectedOptionIds.has(option.entry.id)
  );
  const preferredLimit =
    targetCategoryBehavior === 'soft'
      ? Number.MAX_SAFE_INTEGER
      : Math.max(limit, selectedOptions.length);
  const visiblePreferredOptions = [
    ...selectedOptions,
    ...preferredOptions,
  ].slice(0, preferredLimit);
  const hiddenPreferredCount = Math.max(
    0,
    selectedOptions.length +
      preferredOptions.length -
      visiblePreferredOptions.length
  );
  const visibleUnusualOptions = shouldShowUnusualTargets ? unusualOptions : [];
  const canExpandUnusualTargets =
    !shouldShowUnusualTargets &&
    hiddenPreferredCount === 0 &&
    unusualOptions.length > 0;

  return {
    visibleOptions: [...visiblePreferredOptions, ...visibleUnusualOptions],
    hiddenPreferredCount,
    hiddenPreferredMessage:
      hiddenPreferredCount > 0
        ? `Showing ${visiblePreferredOptions.length} of ${
            options.length
          } matches. ${formatHiddenResultCountMessage({
            hiddenCount: hiddenPreferredCount,
            itemLabel: 'preferred record',
            refinementLabel: 'the search',
          })}`
        : '',
    hiddenUnusualCount: shouldShowUnusualTargets ? 0 : unusualOptions.length,
    canExpandUnusualTargets,
    showUnusualTargetsLabel: canExpandUnusualTargets
      ? `Show ${unusualOptions.length} unusual ${pluralizeCountLabel(
          unusualOptions.length,
          'target'
        )}`
      : '',
  };
}

function normalizeReviewFragment(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function getSuggestionTargetContext(option: RelationshipTargetOption): string {
  const category = option.entry.fields.category?.trim();
  return category
    ? `${category} in ${option.section.title}`
    : option.section.singularTitle;
}

function getSuggestedTargetsForUnresolvedFragments(
  unresolvedFragments: readonly string[],
  options: readonly RelationshipTargetOption[]
): RelationshipTextReviewItem['suggestedTargets'] {
  return unresolvedFragments
    .map((fragment) => {
      const normalizedFragment = normalizeReviewFragment(fragment);
      const targets = options
        .filter((option) => {
          const normalizedName = normalizeReviewFragment(option.entry.name);
          return (
            normalizedFragment.length > 0 &&
            normalizedName.length > 0 &&
            normalizedName !== normalizedFragment &&
            (normalizedName.includes(normalizedFragment) ||
              normalizedFragment.includes(normalizedName))
          );
        })
        .sort((first, second) => {
          const firstName = normalizeReviewFragment(first.entry.name);
          const secondName = normalizeReviewFragment(second.entry.name);
          const firstStarts = firstName.startsWith(normalizedFragment) ? 0 : 1;
          const secondStarts = secondName.startsWith(normalizedFragment)
            ? 0
            : 1;
          return (
            firstStarts - secondStarts ||
            first.entry.name.localeCompare(second.entry.name)
          );
        })
        .slice(0, 3)
        .map((option) => ({
          id: option.entry.id,
          name: option.entry.name,
          context: getSuggestionTargetContext(option),
        }));
      return {
        fragment,
        targets,
      };
    })
    .filter((suggestion) => suggestion.targets.length > 0);
}

export function getRelationshipTextReviewItems({
  codex,
  sections,
}: {
  codex: WorldCodex;
  sections: readonly WorldSectionConfig[];
}): RelationshipTextReviewItem[] {
  return sections
    .filter(
      (section) =>
        getRelationshipFieldConfigsForEntryKind(section.kind).length > 0
    )
    .flatMap((section) =>
      getEntries(codex, section.id).flatMap((entry) => {
        const visibleFieldKeys = new Set(
          getEntryDetailFields(section, entry).map((field) => field.key)
        );
        return getRelationshipFieldConfigsForEntryKind(section.kind)
          .filter((config) => visibleFieldKeys.has(config.fieldKey))
          .flatMap((config) => {
            const value = entry.fields[config.fieldKey]?.trim() ?? '';
            if (!value) {
              return [];
            }
            const options = getRelationshipTargetOptions({
              codex,
              config,
              sections,
              currentEntry: entry,
            });
            const migration = buildRelationshipTextMigration(
              value,
              options.map((option) => ({
                id: option.entry.id,
                name: option.entry.name,
              })),
              config.cardinality
            );
            if (migration.targetIds.length === 0 && !migration.remainingText) {
              return [];
            }
            return [
              {
                entryId: entry.id,
                entryName: entry.name,
                sectionId: section.id,
                fieldKey: config.fieldKey,
                fieldLabel: config.label,
                value,
                exactMatchCount: migration.targetIds.length,
                exactTargetIds: migration.targetIds,
                remainingText: migration.remainingText,
                unresolvedFragments: migration.unmatchedFragments,
                suggestedTargets: getSuggestedTargetsForUnresolvedFragments(
                  migration.unmatchedFragments,
                  options
                ),
                ambiguousFragments: migration.ambiguousFragments,
              },
            ];
          });
      })
    );
}

export function getRelationshipFieldTextMigration({
  codex,
  config,
  currentEntry,
  sections,
  value,
}: {
  codex: WorldCodex;
  config: RelationshipFieldConfig;
  currentEntry: WorldEntry;
  sections: readonly WorldSectionConfig[];
  value: string;
}) {
  const options = getRelationshipTargetOptions({
    codex,
    config,
    sections,
    currentEntry,
  });
  return buildRelationshipTextMigration(
    value,
    options.map((option) => ({
      id: option.entry.id,
      name: option.entry.name,
    })),
    config.cardinality
  );
}

export function buildRelationshipFieldTextMigrationOperation({
  config,
  entry,
  migration,
  relationships,
}: {
  config: RelationshipFieldConfig;
  entry: WorldEntry;
  migration: RelationshipTextMigrationResult;
  relationships: readonly WorldRelationship[];
}): RelationshipFieldTextMigrationOperation {
  const fieldRelationships = getRelationshipFieldLinks(
    relationships,
    entry,
    config
  );
  const relationshipIdsToDelete: string[] = [];
  const relationshipsToSave: RelationshipFieldTextMigrationOperation['relationshipsToSave'] =
    [];

  if (config.cardinality === 'one') {
    const [primaryRelationship, ...extraRelationships] = fieldRelationships;
    relationshipIdsToDelete.push(
      ...extraRelationships.map((relationship) => relationship.id)
    );
    const targetEntryId = migration.targetIds[0];
    if (
      targetEntryId &&
      (!primaryRelationship ||
        getRelationshipFieldTargetId(primaryRelationship, config) !==
          targetEntryId)
    ) {
      relationshipsToSave.push({
        relationship: makeFieldRelationship(
          entry,
          config,
          targetEntryId,
          primaryRelationship
        ),
        existingRelationship: primaryRelationship,
      });
    }
  } else {
    for (const targetEntryId of migration.targetIds) {
      const existingRelationship = fieldRelationships.find(
        (relationship) =>
          getRelationshipFieldTargetId(relationship, config) === targetEntryId
      );
      if (!existingRelationship) {
        relationshipsToSave.push({
          relationship: makeFieldRelationship(entry, config, targetEntryId),
        });
      }
    }
  }

  const fields = { ...entry.fields };
  if (migration.remainingText) {
    fields[config.fieldKey] = migration.remainingText;
  } else {
    delete fields[config.fieldKey];
  }

  return {
    relationshipIdsToDelete,
    relationshipsToSave,
    fields,
  };
}

export function buildRelationshipTextReviewMigration({
  config,
  entry,
  item,
  relationships,
}: {
  config: RelationshipFieldConfig;
  entry: WorldEntry;
  item: RelationshipTextReviewItem;
  relationships: readonly WorldRelationship[];
}): RelationshipTextReviewMigration {
  const fieldRelationships = getRelationshipFieldLinks(
    relationships,
    entry,
    config
  );
  const relationshipIdsToDelete: string[] = [];
  const relationshipsToSave: RelationshipTextReviewMigration['relationshipsToSave'] =
    [];

  if (config.cardinality === 'one') {
    const [primaryRelationship, ...extraRelationships] = fieldRelationships;
    relationshipIdsToDelete.push(
      ...extraRelationships.map((relationship) => relationship.id)
    );
    const targetEntryId = item.exactTargetIds[0];
    if (
      targetEntryId &&
      (!primaryRelationship ||
        getRelationshipFieldTargetId(primaryRelationship, config) !==
          targetEntryId)
    ) {
      relationshipsToSave.push({
        relationship: makeFieldRelationship(
          entry,
          config,
          targetEntryId,
          primaryRelationship
        ),
        existingRelationship: primaryRelationship,
      });
    }
  } else {
    for (const targetEntryId of item.exactTargetIds) {
      const existingRelationship = fieldRelationships.find(
        (relationship) =>
          getRelationshipFieldTargetId(relationship, config) === targetEntryId
      );
      if (!existingRelationship) {
        relationshipsToSave.push({
          relationship: makeFieldRelationship(entry, config, targetEntryId),
        });
      }
    }
  }

  const fields = { ...entry.fields };
  if (item.remainingText) {
    fields[item.fieldKey] = item.remainingText;
  } else {
    delete fields[item.fieldKey];
  }

  return {
    relationshipIdsToDelete,
    relationshipsToSave,
    fields,
  };
}

function removeFirstReviewFragment(
  value: string,
  fragmentToRemove: string
): string {
  let removed = false;
  const normalizedFragmentToRemove = normalizeReviewFragment(fragmentToRemove);
  return splitRelationshipTextFragments(value)
    .filter((fragment) => {
      if (
        !removed &&
        normalizeReviewFragment(fragment) === normalizedFragmentToRemove
      ) {
        removed = true;
        return false;
      }
      return true;
    })
    .join('\n');
}

export function buildRelationshipTextReviewSuggestionMigration({
  config,
  entry,
  fragment,
  item,
  relationships,
  targetEntryId,
}: RelationshipTextReviewSuggestionMigrationInput): RelationshipTextReviewMigration | null {
  const suggestedTarget = item.suggestedTargets
    .find((suggestion) => suggestion.fragment === fragment)
    ?.targets.some((target) => target.id === targetEntryId);
  if (!suggestedTarget) {
    return null;
  }
  const exactTargetIds =
    config.cardinality === 'one'
      ? [targetEntryId]
      : Array.from(new Set([...item.exactTargetIds, targetEntryId]));

  return buildRelationshipTextReviewMigration({
    config,
    entry,
    item: {
      ...item,
      exactTargetIds,
      remainingText: removeFirstReviewFragment(item.remainingText, fragment),
    },
    relationships,
  });
}

function getEntryIndex(
  codex: WorldCodex,
  sections: readonly WorldSectionConfig[]
): Map<string, WorldEntry> {
  return new Map(
    sections.flatMap((section) =>
      getEntries(codex, section.id).map((entry) => [entry.id, entry] as const)
    )
  );
}

export function buildRelationshipTextReviewBatchMigration({
  codex,
  items,
  relationships,
  sections,
}: {
  codex: WorldCodex;
  items: readonly RelationshipTextReviewItem[];
  relationships: readonly WorldRelationship[];
  sections: readonly WorldSectionConfig[];
}): RelationshipTextReviewBatchMigration {
  const entryById = getEntryIndex(codex, sections);
  const configByFieldKey = new Map(
    sections.flatMap((section) =>
      getRelationshipFieldConfigsForEntryKind(section.kind).map(
        (config) => [`${section.kind}:${config.fieldKey}`, config] as const
      )
    )
  );
  const relationshipIdsToDelete: string[] = [];
  const relationshipsToSave: RelationshipTextReviewBatchMigration['relationshipsToSave'] =
    [];
  const fieldsByEntryId = new Map<string, Record<string, string>>();

  for (const item of items) {
    if (item.exactTargetIds.length === 0) {
      continue;
    }
    const entry = entryById.get(item.entryId);
    const config = configByFieldKey.get(`${entry?.kind}:${item.fieldKey}`);
    if (!entry || !config) {
      continue;
    }
    const entryWithCurrentFields = {
      ...entry,
      fields: fieldsByEntryId.get(entry.id) ?? entry.fields,
    };
    const migration = buildRelationshipTextReviewMigration({
      config,
      entry: entryWithCurrentFields,
      item,
      relationships: [
        ...relationships,
        ...relationshipsToSave.map((saved) => saved.relationship),
      ],
    });
    for (const relationshipId of migration.relationshipIdsToDelete) {
      if (!relationshipIdsToDelete.includes(relationshipId)) {
        relationshipIdsToDelete.push(relationshipId);
      }
    }
    relationshipsToSave.push(...migration.relationshipsToSave);
    fieldsByEntryId.set(entry.id, migration.fields);
  }

  return {
    relationshipIdsToDelete,
    relationshipsToSave,
    entryFieldUpdates: Array.from(fieldsByEntryId.entries()).map(
      ([entryId, fields]) => ({
        entryId,
        fields,
      })
    ),
  };
}
