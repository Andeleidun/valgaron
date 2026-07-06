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
  getHiddenCharacterDetailValues,
  type HiddenCharacterDetailValue,
} from './characterTaxonomy';
import type { WorldDetailField, WorldSectionConfig } from './types';

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

export function getDraftDetailFields(
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
  fields: Readonly<Record<string, string>>
): HiddenPlaceDetailValue[] {
  if (section.kind !== 'place') {
    return [];
  }
  const visibleFieldKeys = new Set(
    getPlaceDetailFields(getPlaceCategoryFromFields(fields)).map(
      (field) => field.key
    )
  );
  return Object.entries(fields)
    .filter(([key, value]) => !visibleFieldKeys.has(key) && value.trim())
    .map(([key, value]) => ({
      key,
      label: getPlaceFieldDefinition(key).label,
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
  fields: Readonly<Record<string, string>>
): HiddenPlaceDetailValue[] {
  const visibleFieldKeys = new Set(
    section.detailFields.map((field) => field.key)
  );
  return Object.entries(fields)
    .filter(([key, value]) => !visibleFieldKeys.has(key) && value.trim())
    .map(([key, value]) => ({
      key,
      label: formatGenericFieldLabel(key),
      value,
    }))
    .sort((first, second) => first.label.localeCompare(second.label));
}

export function getHiddenEntryDetailValues(
  section: WorldSectionConfig,
  fields: Readonly<Record<string, string>>
): HiddenEntryDetailValue[] {
  if (section.kind === 'character') {
    return getHiddenCharacterDetailValues(fields);
  }
  if (section.kind === 'place') {
    return getHiddenPlaceDetailValues(section, fields);
  }
  return getHiddenGenericDetailValues(section, fields);
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
