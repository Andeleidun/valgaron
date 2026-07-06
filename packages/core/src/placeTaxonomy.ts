import {
  categoryProfiles,
  placeFieldCatalog,
  placeRelationshipFieldConfigs as generatedPlaceRelationshipFieldConfigs,
  placeRelationshipTypeOptions as generatedPlaceRelationshipTypeOptions,
  placeSharedFieldKeys,
  profileFieldKeys,
  supportedPlaceCategoryOptions as generatedSupportedPlaceCategoryOptions,
} from './placeRelationshipTree.generated';
import {
  getCharacterCategoryFromFields,
  getCharacterDetailFields,
  type HiddenCharacterDetailValue,
} from './characterTaxonomy';
import type {
  WorldDetailField,
  WorldSectionConfig,
  WorldWorkspaceSchema,
} from './types';

export const supportedPlaceCategoryOptions: readonly string[] =
  generatedSupportedPlaceCategoryOptions;

type DraftLike = {
  details: Record<string, string>;
};

type EntryLike = {
  fields: Record<string, string>;
};

export type HiddenPlaceDetailValue = {
  key: string;
  label: string;
  value: string;
};

export type HiddenEntryDetailValue =
  | HiddenPlaceDetailValue
  | HiddenCharacterDetailValue;

export type PlaceRelationshipFieldConfig = {
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

export type PlaceFieldProfileId = keyof typeof profileFieldKeys;

export type PlaceRelationshipGroupId =
  | 'location'
  | 'contents'
  | 'power'
  | 'routes'
  | 'people'
  | 'eventsLore'
  | 'origins'
  | 'other';

export const placeRelationshipTypeOptions: readonly string[] =
  generatedPlaceRelationshipTypeOptions;

export const placeRelationshipFieldConfigs: readonly PlaceRelationshipFieldConfig[] =
  generatedPlaceRelationshipFieldConfigs;

function isMultilineValueType(valueType: string): boolean {
  return valueType === 'markdown' || valueType === 'linkList';
}

function getPlaceFieldDefinition(key: string): WorldDetailField {
  const field = placeFieldCatalog[key as keyof typeof placeFieldCatalog];
  if (!field) {
    return {
      key,
      label: formatUnknownFieldLabel(key),
    };
  }
  return {
    key,
    label: field.label,
    multiline: isMultilineValueType(field.valueType) || undefined,
    autocompleteOptions:
      key === 'category' ? supportedPlaceCategoryOptions : undefined,
  };
}

function uniqueFieldKeys(keys: readonly string[]): string[] {
  return Array.from(new Set(keys));
}

function fieldsFromKeys(keys: readonly string[]): WorldDetailField[] {
  return uniqueFieldKeys(keys).map((key) => getPlaceFieldDefinition(key));
}

function formatUnknownFieldLabel(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (firstLetter) => firstLetter.toUpperCase());
}

export function getPlaceCategoryFromFields(
  fields: Readonly<Record<string, string>>
): string {
  return fields.category?.trim() ?? '';
}

export function getPlaceDetailFields(category: string): WorldDetailField[] {
  const profiles = getPlaceCategoryProfileIds(category);
  if (profiles.length === 0) {
    return fieldsFromKeys(placeSharedFieldKeys);
  }
  return fieldsFromKeys([
    ...placeSharedFieldKeys,
    ...profiles.flatMap((profile) => profileFieldKeys[profile]),
  ]);
}

export function getEntryDetailFields(
  section: WorldSectionConfig,
  entry?: EntryLike,
  workspaceSchema?: WorldWorkspaceSchema
): WorldDetailField[] {
  const fields =
    section.kind === 'character'
      ? getCharacterDetailFields(
          entry ? getCharacterCategoryFromFields(entry.fields) : ''
        )
      : section.kind !== 'place'
      ? [...section.detailFields]
      : getPlaceDetailFields(
          entry ? getPlaceCategoryFromFields(entry.fields) : ''
        );
  return applyDetailFieldOverrides(section, fields, workspaceSchema);
}

export function getDraftDetailFields(
  section: WorldSectionConfig,
  draft?: DraftLike,
  workspaceSchema?: WorldWorkspaceSchema
): WorldDetailField[] {
  const fields =
    section.kind === 'character'
      ? getCharacterDetailFields(
          draft ? getCharacterCategoryFromFields(draft.details) : ''
        )
      : section.kind !== 'place'
      ? [...section.detailFields]
      : getPlaceDetailFields(
          draft ? getPlaceCategoryFromFields(draft.details) : ''
        );
  return applyDetailFieldOverrides(section, fields, workspaceSchema);
}

export function applyDetailFieldOverrides(
  section: WorldSectionConfig,
  fields: readonly WorldDetailField[],
  workspaceSchema?: WorldWorkspaceSchema
): WorldDetailField[] {
  const fieldOverrides = workspaceSchema?.fieldOverrides[section.id] ?? {};
  return fields
    .map((field, index) => {
      const override = fieldOverrides[field.key];
      return {
        ...field,
        label: override?.label?.trim() || field.label,
        __order: override?.order ?? index + 1,
        __hasOrder: override?.order !== undefined,
        __originalIndex: index,
        __hidden: Boolean(override?.hidden),
      };
    })
    .filter((field) => !field.__hidden)
    .sort(
      (first, second) =>
        first.__order - second.__order ||
        Number(second.__hasOrder) - Number(first.__hasOrder) ||
        first.__originalIndex - second.__originalIndex
    )
    .map((field) => ({
      key: field.key,
      label: field.label,
      ...(field.multiline ? { multiline: field.multiline } : {}),
      ...(field.autocompleteOptions
        ? { autocompleteOptions: field.autocompleteOptions }
        : {}),
      ...(field.suggestFromExistingValues
        ? { suggestFromExistingValues: field.suggestFromExistingValues }
        : {}),
    }));
}

function getVisibleDetailFieldKeys(
  section: WorldSectionConfig,
  fields: Readonly<Record<string, string>>,
  workspaceSchema?: WorldWorkspaceSchema
): Set<string> {
  if (section.kind === 'character') {
    return new Set(
      getEntryDetailFields(section, { fields }, workspaceSchema).map(
        (field) => field.key
      )
    );
  }
  if (section.kind === 'place') {
    return new Set(
      getEntryDetailFields(section, { fields }, workspaceSchema).map(
        (field) => field.key
      )
    );
  }
  return new Set(
    applyDetailFieldOverrides(
      section,
      section.detailFields,
      workspaceSchema
    ).map((field) => field.key)
  );
}

function getDetailFieldLabel(
  section: WorldSectionConfig,
  key: string,
  fallback: string,
  workspaceSchema?: WorldWorkspaceSchema
): string {
  const override = workspaceSchema?.fieldOverrides[section.id]?.[key];
  return override?.label?.trim() || fallback;
}

export function getRawEntryDetailFields(
  section: WorldSectionConfig,
  entry?: EntryLike
): WorldDetailField[] {
  if (section.kind === 'character') {
    return getCharacterDetailFields(
      entry ? getCharacterCategoryFromFields(entry.fields) : ''
    );
  }
  if (section.kind !== 'place') {
    return [...section.detailFields];
  }
  return getPlaceDetailFields(
    entry ? getPlaceCategoryFromFields(entry.fields) : ''
  );
}

export function getRawDraftDetailFields(
  section: WorldSectionConfig,
  draft?: DraftLike
): WorldDetailField[] {
  if (section.kind === 'character') {
    return getCharacterDetailFields(
      draft ? getCharacterCategoryFromFields(draft.details) : ''
    );
  }
  if (section.kind !== 'place') {
    return [...section.detailFields];
  }
  return getPlaceDetailFields(
    draft ? getPlaceCategoryFromFields(draft.details) : ''
  );
}

export function getHiddenPlaceDetailValues(
  section: WorldSectionConfig,
  fields: Readonly<Record<string, string>>,
  workspaceSchema?: WorldWorkspaceSchema
): HiddenPlaceDetailValue[] {
  if (section.kind !== 'place') {
    return [];
  }
  const visibleFieldKeys = getVisibleDetailFieldKeys(
    section,
    fields,
    workspaceSchema
  );
  return Object.entries(fields)
    .filter(([key, value]) => !visibleFieldKeys.has(key) && value.trim())
    .map(([key, value]) => ({
      key,
      label: getDetailFieldLabel(
        section,
        key,
        getPlaceFieldDefinition(key).label,
        workspaceSchema
      ),
      value,
    }))
    .sort((first, second) => first.label.localeCompare(second.label));
}

function formatGenericFieldLabel(key: string): string {
  return key
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getHiddenGenericDetailValues(
  section: WorldSectionConfig,
  fields: Readonly<Record<string, string>>,
  workspaceSchema?: WorldWorkspaceSchema
): HiddenPlaceDetailValue[] {
  const visibleFieldKeys = getVisibleDetailFieldKeys(
    section,
    fields,
    workspaceSchema
  );
  return Object.entries(fields)
    .filter(([key, value]) => !visibleFieldKeys.has(key) && value.trim())
    .map(([key, value]) => ({
      key,
      label: getDetailFieldLabel(
        section,
        key,
        formatGenericFieldLabel(key),
        workspaceSchema
      ),
      value,
    }))
    .sort((first, second) => first.label.localeCompare(second.label));
}

export function getHiddenEntryDetailValues(
  section: WorldSectionConfig,
  fields: Readonly<Record<string, string>>,
  workspaceSchema?: WorldWorkspaceSchema
): HiddenEntryDetailValue[] {
  if (section.kind === 'character') {
    const visibleFieldKeys = getVisibleDetailFieldKeys(
      section,
      fields,
      workspaceSchema
    );
    const labelByKey = new Map(
      getRawEntryDetailFields(section, { fields }).map((field) => [
        field.key,
        field.label,
      ])
    );
    return Object.entries(fields)
      .filter(([key, value]) => !visibleFieldKeys.has(key) && value.trim())
      .map(([key, value]) => ({
        key,
        label: getDetailFieldLabel(
          section,
          key,
          labelByKey.get(key) ?? formatGenericFieldLabel(key),
          workspaceSchema
        ),
        value,
      }))
      .sort((first, second) => first.label.localeCompare(second.label));
  }
  if (section.kind === 'place') {
    return getHiddenPlaceDetailValues(section, fields, workspaceSchema);
  }
  return getHiddenGenericDetailValues(section, fields, workspaceSchema);
}

export function getPlaceCategoryProfileIds(
  category: string
): readonly PlaceFieldProfileId[] {
  const normalizedCategory = category.trim() as keyof typeof categoryProfiles;
  return categoryProfiles[normalizedCategory] ?? [];
}

function hasPlaceProfile(category: string, profileId: PlaceFieldProfileId) {
  return getPlaceCategoryProfileIds(category).includes(profileId);
}

export function getPlaceRelationshipGroupLabel(
  category: string,
  groupId: PlaceRelationshipGroupId
): string {
  const normalizedCategory = category.trim();
  if (groupId === 'contents') {
    if (hasPlaceProfile(normalizedCategory, 'politicalPlace')) {
      return 'Settlements and regions';
    }
    if (hasPlaceProfile(normalizedCategory, 'settlementPlace')) {
      return 'Districts and local places';
    }
    if (hasPlaceProfile(normalizedCategory, 'cosmicPlace')) {
      return 'Contained celestial places';
    }
    if (hasPlaceProfile(normalizedCategory, 'otherworldlyPlace')) {
      return 'Contained realms and domains';
    }
    return 'Contained places';
  }
  if (groupId === 'routes') {
    if (hasPlaceProfile(normalizedCategory, 'waterPlace')) {
      return 'Water and route links';
    }
    if (hasPlaceProfile(normalizedCategory, 'routePlace')) {
      return 'Endpoints and route links';
    }
    return 'Borders, routes, and flows';
  }
  if (groupId === 'power') {
    return 'Control and claims';
  }
  if (groupId === 'people') {
    if (hasPlaceProfile(normalizedCategory, 'settlementPlace')) {
      return 'Residents and local groups';
    }
    return 'People and groups';
  }
  if (groupId === 'eventsLore') {
    return 'Events and lore';
  }
  if (groupId === 'origins') {
    return hasPlaceProfile(normalizedCategory, 'builtPlace')
      ? 'Builders and origins'
      : 'Founding and origins';
  }
  if (groupId === 'location') {
    return 'Location and parent places';
  }
  return 'Other links';
}
