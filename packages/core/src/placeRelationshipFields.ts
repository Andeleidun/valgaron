import { getEntries } from './codexEntries';
import { relationshipFromDraft } from './codexRelationships';
import { buildRelationshipTextMigration } from './relationshipTextMigration';
import {
  getEntryDetailFields,
  placeRelationshipFieldConfigs,
  type PlaceRelationshipFieldConfig,
} from './placeTaxonomy';
import type {
  WorldCodex,
  WorldEntry,
  WorldRelationship,
  WorldSectionConfig,
} from './types';

export type PlaceRelationshipTargetOption = {
  entry: WorldEntry;
  section: WorldSectionConfig;
};

export type PlaceRelationshipTextReviewItem = {
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

export type PlaceRelationshipTextReviewMigration = {
  relationshipIdsToDelete: string[];
  relationshipsToSave: {
    relationship: WorldRelationship;
    existingRelationship?: WorldRelationship;
  }[];
  fields: Record<string, string>;
};

export type PlaceRelationshipTextReviewBatchMigration = {
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

export function getPlaceRelationshipTextReviewUnresolvedLabel(
  item: PlaceRelationshipTextReviewItem
): string {
  return [
    ...item.unresolvedFragments,
    ...item.ambiguousFragments.map(
      (fragment) => `${fragment.fragment} (duplicate name)`
    ),
  ].join(', ');
}

export function getPlaceRelationshipTextReviewExactMatchLabel(
  item: PlaceRelationshipTextReviewItem
): string {
  if (item.exactMatchCount === 0) {
    return 'No exact matches available.';
  }
  return `${item.exactMatchCount} exact match${
    item.exactMatchCount === 1 ? '' : 'es'
  } available.`;
}

export function getPlaceRelationshipTextReviewSuggestionLabels(
  item: PlaceRelationshipTextReviewItem
): string[] {
  return item.suggestedTargets.map(
    (suggestion) =>
      `${suggestion.fragment}: ${suggestion.targets
        .map((target) => `${target.name} (${target.context})`)
        .join(', ')}`
  );
}

export function getPlaceRelationshipTargetOptions({
  codex,
  config,
  includedTargetIds,
  sections,
  currentEntry,
}: {
  codex: WorldCodex;
  config: PlaceRelationshipFieldConfig;
  includedTargetIds?: ReadonlySet<string>;
  sections: readonly WorldSectionConfig[];
  currentEntry: WorldEntry;
}): PlaceRelationshipTargetOption[] {
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
      getEntries(codex, section.id)
        .filter((entry) => {
          if (entry.id === currentEntry.id) {
            return false;
          }
          if (includedTargetIds?.has(entry.id)) {
            return true;
          }
          if (entry.status === 'archived') {
            return false;
          }
          if (
            section.kind === 'place' &&
            config.targetPlaceCategories &&
            config.targetPlaceCategories.length > 0
          ) {
            return config.targetPlaceCategories.includes(
              entry.fields.category ?? ''
            );
          }
          return true;
        })
        .map((entry) => ({ entry, section }))
    )
    .sort((first, second) => first.entry.name.localeCompare(second.entry.name));
}

export function getPlaceRelationshipFieldTargetId(
  relationship: WorldRelationship,
  config: PlaceRelationshipFieldConfig
): string {
  return config.currentEntryRole === 'source'
    ? relationship.targetEntryId
    : relationship.sourceEntryId;
}

export function getPlaceRelationshipFieldLinks(
  relationships: readonly WorldRelationship[],
  entry: WorldEntry,
  config: PlaceRelationshipFieldConfig
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

export function makePlaceFieldRelationship(
  entry: WorldEntry,
  config: PlaceRelationshipFieldConfig,
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

export function filterPlaceRelationshipTargetOptions(
  options: readonly PlaceRelationshipTargetOption[],
  query: string,
  selectedTargetIds: ReadonlySet<string>
): PlaceRelationshipTargetOption[] {
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

export function limitPlaceRelationshipTargetOptions(
  options: readonly PlaceRelationshipTargetOption[],
  selectedTargetIds: ReadonlySet<string>,
  limit: number
): PlaceRelationshipTargetOption[] {
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

function normalizeReviewFragment(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function getSuggestionTargetContext(
  option: PlaceRelationshipTargetOption
): string {
  const category = option.entry.fields.category?.trim();
  return category
    ? `${category} in ${option.section.title}`
    : option.section.singularTitle;
}

function getSuggestedTargetsForUnresolvedFragments(
  unresolvedFragments: readonly string[],
  options: readonly PlaceRelationshipTargetOption[]
): PlaceRelationshipTextReviewItem['suggestedTargets'] {
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

export function getPlaceRelationshipTextReviewItems({
  codex,
  sections,
}: {
  codex: WorldCodex;
  sections: readonly WorldSectionConfig[];
}): PlaceRelationshipTextReviewItem[] {
  return sections
    .filter((section) => section.kind === 'place')
    .flatMap((section) =>
      getEntries(codex, section.id).flatMap((entry) => {
        const visibleFieldKeys = new Set(
          getEntryDetailFields(section, entry).map((field) => field.key)
        );
        return placeRelationshipFieldConfigs
          .filter((config) => visibleFieldKeys.has(config.fieldKey))
          .flatMap((config) => {
            const value = entry.fields[config.fieldKey]?.trim() ?? '';
            if (!value) {
              return [];
            }
            const options = getPlaceRelationshipTargetOptions({
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
            if (!migration.remainingText) {
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

export function buildPlaceRelationshipTextReviewMigration({
  config,
  entry,
  item,
  relationships,
}: {
  config: PlaceRelationshipFieldConfig;
  entry: WorldEntry;
  item: PlaceRelationshipTextReviewItem;
  relationships: readonly WorldRelationship[];
}): PlaceRelationshipTextReviewMigration {
  const fieldRelationships = getPlaceRelationshipFieldLinks(
    relationships,
    entry,
    config
  );
  const relationshipIdsToDelete: string[] = [];
  const relationshipsToSave: PlaceRelationshipTextReviewMigration['relationshipsToSave'] =
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
        getPlaceRelationshipFieldTargetId(primaryRelationship, config) !==
          targetEntryId)
    ) {
      relationshipsToSave.push({
        relationship: makePlaceFieldRelationship(
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
          getPlaceRelationshipFieldTargetId(relationship, config) ===
          targetEntryId
      );
      if (!existingRelationship) {
        relationshipsToSave.push({
          relationship: makePlaceFieldRelationship(
            entry,
            config,
            targetEntryId
          ),
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

export function buildPlaceRelationshipTextReviewBatchMigration({
  codex,
  items,
  relationships,
  sections,
}: {
  codex: WorldCodex;
  items: readonly PlaceRelationshipTextReviewItem[];
  relationships: readonly WorldRelationship[];
  sections: readonly WorldSectionConfig[];
}): PlaceRelationshipTextReviewBatchMigration {
  const entryById = getEntryIndex(codex, sections);
  const configByFieldKey = new Map(
    placeRelationshipFieldConfigs.map((config) => [config.fieldKey, config])
  );
  const relationshipIdsToDelete: string[] = [];
  const relationshipsToSave: PlaceRelationshipTextReviewBatchMigration['relationshipsToSave'] =
    [];
  const fieldsByEntryId = new Map<string, Record<string, string>>();

  for (const item of items) {
    if (item.exactTargetIds.length === 0) {
      continue;
    }
    const entry = entryById.get(item.entryId);
    const config = configByFieldKey.get(item.fieldKey);
    if (!entry || !config) {
      continue;
    }
    const entryWithCurrentFields = {
      ...entry,
      fields: fieldsByEntryId.get(entry.id) ?? entry.fields,
    };
    const migration = buildPlaceRelationshipTextReviewMigration({
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
