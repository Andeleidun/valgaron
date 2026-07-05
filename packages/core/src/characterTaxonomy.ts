import {
  characterCategoryProfiles,
  characterFieldCatalog,
  characterProfileFieldKeys,
  characterProfileLabels,
  characterRelationshipFieldConfigs as generatedCharacterRelationshipFieldConfigs,
  characterRelationshipTypeOptions as generatedCharacterRelationshipTypeOptions,
  characterSharedFieldKeys,
  supportedCharacterCategoryOptions as generatedSupportedCharacterCategoryOptions,
} from './characterRelationshipTree.generated';
import type { WorldDetailField } from './types';

type DraftLike = {
  details: Record<string, string>;
};

type EntryLike = {
  fields: Record<string, string>;
};

export type HiddenCharacterDetailValue = {
  key: string;
  label: string;
  value: string;
};

export type CharacterRelationshipFieldConfig = {
  fieldKey: string;
  label: string;
  relationshipTypeId: string;
  relationshipTypeLabel: string;
  directional: boolean;
  cardinality: 'one' | 'many';
  currentEntryRole: 'source' | 'target';
  targetEntryKinds: readonly string[];
};

export type CharacterFieldProfileId = keyof typeof characterProfileFieldKeys;

export type CharacterDetailFieldProfileGroup = {
  id: string;
  label: string;
  fields: WorldDetailField[];
};

export const supportedCharacterCategoryOptions: readonly string[] =
  generatedSupportedCharacterCategoryOptions;

export const characterRelationshipTypeOptions: readonly string[] =
  generatedCharacterRelationshipTypeOptions;

export const characterRelationshipFieldConfigs: readonly CharacterRelationshipFieldConfig[] =
  generatedCharacterRelationshipFieldConfigs;

function isMultilineValueType(valueType: string): boolean {
  return valueType === 'longText' || valueType === 'linkList';
}

function formatUnknownFieldLabel(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (firstLetter) => firstLetter.toUpperCase());
}

function getCharacterFieldDefinition(key: string): WorldDetailField {
  const field =
    characterFieldCatalog[key as keyof typeof characterFieldCatalog];
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
      key === 'characterCategory'
        ? supportedCharacterCategoryOptions
        : undefined,
    suggestFromExistingValues: field.suggestFromExistingValues || undefined,
  };
}

function uniqueFieldKeys(keys: readonly string[]): string[] {
  return Array.from(new Set(keys));
}

function fieldsFromKeys(keys: readonly string[]): WorldDetailField[] {
  return uniqueFieldKeys(keys).map((key) => getCharacterFieldDefinition(key));
}

export function getCharacterCategoryFromFields(
  fields: Readonly<Record<string, string>>
): string {
  return fields.characterCategory?.trim() ?? '';
}

export function getCharacterDetailFields(category: string): WorldDetailField[] {
  const profiles = getCharacterCategoryProfileIds(category);
  if (profiles.length === 0) {
    return fieldsFromKeys(characterSharedFieldKeys);
  }
  return fieldsFromKeys([
    ...characterSharedFieldKeys,
    ...profiles.flatMap((profile) => characterProfileFieldKeys[profile]),
  ]);
}

export function getCharacterEntryDetailFields(
  entry?: EntryLike
): WorldDetailField[] {
  return getCharacterDetailFields(
    entry ? getCharacterCategoryFromFields(entry.fields) : ''
  );
}

export function getCharacterDraftDetailFields(
  draft?: DraftLike
): WorldDetailField[] {
  return getCharacterDetailFields(
    draft ? getCharacterCategoryFromFields(draft.details) : ''
  );
}

export function getHiddenCharacterDetailValues(
  fields: Readonly<Record<string, string>>
): HiddenCharacterDetailValue[] {
  const visibleFieldKeys = new Set(
    getCharacterDetailFields(getCharacterCategoryFromFields(fields)).map(
      (field) => field.key
    )
  );
  return Object.entries(fields)
    .filter(([key, value]) => !visibleFieldKeys.has(key) && value.trim())
    .map(([key, value]) => ({
      key,
      label: getCharacterFieldDefinition(key).label,
      value,
    }))
    .sort((first, second) => first.label.localeCompare(second.label));
}

export function getCharacterCategoryProfileIds(
  category: string
): readonly CharacterFieldProfileId[] {
  const normalizedCategory =
    category.trim() as keyof typeof characterCategoryProfiles;
  return characterCategoryProfiles[normalizedCategory] ?? [];
}

export function getCharacterDetailFieldProfileGroups({
  category,
  fields,
}: {
  category: string;
  fields: readonly WorldDetailField[];
}): CharacterDetailFieldProfileGroup[] {
  const fieldsByKey = new Map(fields.map((field) => [field.key, field]));
  const usedFieldKeys = new Set<string>();
  const profileIds = getCharacterCategoryProfileIds(category);
  if (profileIds.length === 0) {
    return fields.length > 0
      ? [
          {
            id: 'characterShared',
            label: 'Character basics',
            fields: [...fields],
          },
        ]
      : [];
  }

  const groups = profileIds.flatMap((profileId) => {
    const groupFields = characterProfileFieldKeys[profileId].flatMap((key) => {
      const field = fieldsByKey.get(key);
      if (!field || usedFieldKeys.has(key)) {
        return [];
      }
      usedFieldKeys.add(key);
      return [field];
    });
    return groupFields.length > 0
      ? [
          {
            id: profileId,
            label: characterProfileLabels[profileId],
            fields: groupFields,
          },
        ]
      : [];
  });

  const ungroupedFields = fields.filter(
    (field) => !usedFieldKeys.has(field.key)
  );
  return ungroupedFields.length > 0
    ? [
        ...groups,
        {
          id: 'characterOther',
          label: 'Other character details',
          fields: ungroupedFields,
        },
      ]
    : groups;
}
