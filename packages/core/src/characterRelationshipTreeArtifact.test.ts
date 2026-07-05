import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  characterRelationshipFieldConfigs,
  characterRelationshipTypeOptions,
  supportedCharacterCategoryOptions,
} from './characterTaxonomy';
import {
  characterCategoryProfiles,
  characterFieldCatalog,
  characterProfileLabels,
  characterProfileFieldKeys,
  characterSharedFieldKeys,
} from './characterRelationshipTree.generated';

type CharacterRelationshipTreeArtifact = {
  schemaVersion: number;
  commonFieldProfiles: CharacterRelationshipTreeFieldProfile[];
  fieldCatalog: CharacterRelationshipTreeFieldCatalogEntry[];
  relationshipTypes: CharacterRelationshipTreeRelationshipType[];
  runtime: {
    coreEntryFields: string[];
    sharedDetailFields: string[];
  };
  scope: {
    linkedEntryKinds: string[];
  };
  tree: CharacterRelationshipTreeNode;
};

type CharacterRelationshipTreeRelationshipType = {
  id: string;
  label: string;
  inverseLabel?: string;
  sourceKinds?: string[];
  targetKinds: string[];
};

type CharacterRelationshipTreeFieldCatalogEntry = {
  cardinality: string;
  currentEntryRole?: string;
  id: string;
  label: string;
  relationshipType?: string;
  targetKinds?: string[];
  valueType: string;
};

type CharacterRelationshipTreeFieldProfile = {
  id: string;
  label: string;
  fields: string[];
};

type CharacterRelationshipTreeNode = {
  category: string | null;
  children?: CharacterRelationshipTreeNode[];
  fieldProfiles?: string[];
  highValueFields?: string[];
  id: string;
  recommendedFieldProfiles?: string[];
};

function readPlanningArtifact(): CharacterRelationshipTreeArtifact {
  return JSON.parse(
    readFileSync(
      join(process.cwd(), 'character-relationship-tree.json'),
      'utf8'
    )
  ) as CharacterRelationshipTreeArtifact;
}

function flattenTree(
  node: CharacterRelationshipTreeNode
): CharacterRelationshipTreeNode[] {
  return [node, ...(node.children ?? []).flatMap(flattenTree)];
}

describe('character relationship tree canonical artifact', () => {
  const allowedFieldValueTypes = new Set([
    'category',
    'customText',
    'customTextList',
    'linkList',
    'longText',
    'status',
    'text',
    'textList',
  ]);
  const allowedFieldCardinalities = new Set(['one', 'many']);

  it('keeps artifact ids unique where generated metadata uses maps', () => {
    const artifact = readPlanningArtifact();
    const fieldIds = artifact.fieldCatalog.map((field) => field.id);
    const profileIds = artifact.commonFieldProfiles.map(
      (profile) => profile.id
    );
    const relationshipTypeIds = artifact.relationshipTypes.map(
      (relationshipType) => relationshipType.id
    );
    const treeNodeIds = flattenTree(artifact.tree).map((node) => node.id);

    expect(fieldIds.every((id) => id.trim())).toBe(true);
    expect(profileIds.every((id) => id.trim())).toBe(true);
    expect(relationshipTypeIds.every((id) => id.trim())).toBe(true);
    expect(treeNodeIds.every((id) => id.trim())).toBe(true);
    expect(
      artifact.relationshipTypes.every(
        (relationshipType) =>
          relationshipType.label.trim() &&
          (relationshipType.inverseLabel === undefined ||
            relationshipType.inverseLabel.trim())
      )
    ).toBe(true);
    expect(new Set(fieldIds).size).toBe(fieldIds.length);
    expect(new Set(profileIds).size).toBe(profileIds.length);
    expect(new Set(relationshipTypeIds).size).toBe(relationshipTypeIds.length);
    expect(new Set(treeNodeIds).size).toBe(treeNodeIds.length);
  });

  it('generates runtime taxonomy metadata from the canonical artifact', () => {
    const artifact = readPlanningArtifact();
    const generatedFieldCatalog = characterFieldCatalog as Record<
      string,
      { label: string; valueType: string }
    >;
    const generatedProfileFieldKeys = characterProfileFieldKeys as Record<
      string,
      readonly string[]
    >;
    const generatedProfileLabels = characterProfileLabels as Record<
      string,
      string
    >;
    const generatedCategoryProfiles = characterCategoryProfiles as Record<
      string,
      readonly string[]
    >;
    const coreEntryFields = new Set(artifact.runtime.coreEntryFields);

    expect([...characterSharedFieldKeys]).toEqual(
      artifact.runtime.sharedDetailFields
    );

    for (const field of artifact.fieldCatalog) {
      if (coreEntryFields.has(field.id)) {
        expect(generatedFieldCatalog[field.id]).toBeUndefined();
        continue;
      }
      expect(generatedFieldCatalog[field.id]).toMatchObject({
        label: field.label,
        valueType: field.valueType,
      });
    }

    for (const profile of artifact.commonFieldProfiles) {
      expect(generatedProfileLabels[profile.id]).toBe(profile.label);
      expect(generatedProfileFieldKeys[profile.id]).toEqual(
        profile.fields.filter((fieldKey) => !coreEntryFields.has(fieldKey))
      );
    }

    for (const node of flattenTree(artifact.tree)) {
      if (!node.category) {
        continue;
      }
      expect(generatedCategoryProfiles[node.category]).toEqual(
        node.recommendedFieldProfiles ?? node.fieldProfiles ?? []
      );
    }
  });

  it('keeps runtime character categories aligned with the planning tree', () => {
    const artifact = readPlanningArtifact();
    const planningCategories = flattenTree(artifact.tree)
      .map((node) => node.category)
      .filter((category): category is string => Boolean(category))
      .sort();
    const runtimeCategories = [...supportedCharacterCategoryOptions].sort();

    expect(artifact.schemaVersion).toBe(1);
    expect(planningCategories).toEqual(runtimeCategories);
  });

  it('keeps runtime relationship-backed field metadata aligned with the planning field catalog', () => {
    const artifact = readPlanningArtifact();
    const fieldCatalogById = new Map(
      artifact.fieldCatalog.map((field) => [field.id, field])
    );

    for (const config of characterRelationshipFieldConfigs) {
      const fieldCatalogEntry = fieldCatalogById.get(config.fieldKey);

      expect(fieldCatalogEntry).toBeDefined();
      expect(fieldCatalogEntry?.label).toBe(config.label);
      expect(fieldCatalogEntry?.relationshipType).toBe(
        config.relationshipTypeId
      );
      expect(fieldCatalogEntry?.currentEntryRole ?? 'source').toBe(
        config.currentEntryRole
      );
      expect(fieldCatalogEntry?.targetKinds ?? []).toEqual([
        ...config.targetEntryKinds,
      ]);
    }
  });

  it('keeps creator-authored text fields separate from optional links', () => {
    const artifact = readPlanningArtifact();
    const fieldCatalogById = new Map(
      artifact.fieldCatalog.map((field) => [field.id, field])
    );

    for (const fieldKey of ['abilities', 'ancestry', 'forms', 'profession']) {
      const field = fieldCatalogById.get(fieldKey);

      expect(field).toMatchObject({
        valueType:
          fieldKey === 'abilities' || fieldKey === 'forms'
            ? 'customTextList'
            : 'customText',
      });
      expect(field?.currentEntryRole).toBeUndefined();
      expect(field?.relationshipType).toBeUndefined();
      expect(field?.targetKinds).toBeUndefined();
    }

    expect(fieldCatalogById.get('ancestryLore')).toMatchObject({
      relationshipType: 'ancestry_described_by',
      targetKinds: ['lore'],
      valueType: 'linkList',
    });
    expect(fieldCatalogById.get('professionLore')).toMatchObject({
      relationshipType: 'profession_described_by',
      targetKinds: ['lore'],
      valueType: 'linkList',
    });
  });

  it('keeps runtime and planning relationship type vocabularies aligned', () => {
    const artifact = readPlanningArtifact();
    const artifactRelationshipTypeLabels = new Set(
      artifact.relationshipTypes.flatMap((relationshipType) => [
        relationshipType.label,
        relationshipType.inverseLabel,
      ])
    );
    const runtimeRelationshipTypeLabels = new Set(
      characterRelationshipTypeOptions
    );

    expect(
      [...artifactRelationshipTypeLabels]
        .filter((label): label is string => Boolean(label))
        .filter((label) => !runtimeRelationshipTypeLabels.has(label))
    ).toEqual([]);
    expect(
      [...runtimeRelationshipTypeLabels].filter(
        (label) => !artifactRelationshipTypeLabels.has(label)
      )
    ).toEqual([]);
  });

  it('keeps tree field, profile, target kind, and relationship references valid', () => {
    const artifact = readPlanningArtifact();
    const fieldKeys = new Set(artifact.fieldCatalog.map((field) => field.id));
    const profileIds = new Set(
      artifact.commonFieldProfiles.map((profile) => profile.id)
    );
    const supportedEntryKinds = new Set(artifact.scope.linkedEntryKinds);
    const relationshipById = new Map(
      artifact.relationshipTypes.map((relationshipType) => [
        relationshipType.id,
        relationshipType,
      ])
    );

    for (const relationshipType of artifact.relationshipTypes) {
      expect(relationshipType.targetKinds.length).toBeGreaterThan(0);
      expect(
        [
          ...(relationshipType.sourceKinds ?? []),
          ...relationshipType.targetKinds,
        ].filter((entryKind) => !supportedEntryKinds.has(entryKind))
      ).toEqual([]);
    }

    for (const profile of artifact.commonFieldProfiles) {
      expect(
        profile.fields.filter((fieldKey) => !fieldKeys.has(fieldKey))
      ).toEqual([]);
      expect(profile.id).toBeTruthy();
    }

    for (const field of artifact.fieldCatalog) {
      expect(allowedFieldValueTypes.has(field.valueType)).toBe(true);
      expect(allowedFieldCardinalities.has(field.cardinality)).toBe(true);
      expect(
        (field.targetKinds ?? []).filter(
          (entryKind) => !supportedEntryKinds.has(entryKind)
        )
      ).toEqual([]);
      if (field.relationshipType) {
        expect(field.valueType).toBe('linkList');
        expect(field.targetKinds?.length ?? 0).toBeGreaterThan(0);
        expect((field.targetKinds ?? []).every((kind) => kind.trim())).toBe(
          true
        );
        const relationshipType = relationshipById.get(field.relationshipType);
        expect(relationshipType).toBeDefined();
        expect(
          (field.targetKinds ?? []).filter(
            (entryKind) => !relationshipType?.targetKinds.includes(entryKind)
          )
        ).toEqual([]);
      }
      expect(field.id).toBeTruthy();
    }

    for (const node of flattenTree(artifact.tree)) {
      expect(
        [
          ...(node.fieldProfiles ?? []),
          ...(node.recommendedFieldProfiles ?? []),
        ].filter((profileId) => !profileIds.has(profileId))
      ).toEqual([]);
      expect(
        (node.highValueFields ?? []).filter(
          (fieldKey) => !fieldKeys.has(fieldKey)
        )
      ).toEqual([]);
    }
  });
});
