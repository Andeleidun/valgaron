import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  placeRelationshipFieldConfigs,
  placeRelationshipTypeOptions,
  supportedPlaceCategoryOptions,
} from './placeTaxonomy';
import {
  categoryProfiles,
  placeFieldCatalog,
  placeSharedFieldKeys,
  profileFieldKeys,
} from './placeRelationshipTree.generated';

type PlaceRelationshipTreeArtifact = {
  schemaVersion: number;
  commonFieldProfiles: Record<string, string[]>;
  fieldCatalog: Record<string, PlaceRelationshipTreeFieldCatalogEntry>;
  relationshipTypes: PlaceRelationshipTreeRelationshipType[];
  runtime: {
    coreEntryFields: string[];
    sharedDetailFields: string[];
  };
  scope: {
    nonPlaceLinkTargets: string[];
  };
  tree: PlaceRelationshipTreeNode[];
};

type PlaceRelationshipTreeRelationshipType = {
  id: string;
  label: string;
  inverseLabel?: string;
  sourceKinds?: string[];
  targetKinds: string[];
};

type PlaceRelationshipTreeFieldCatalogEntry = {
  cardinality?: string;
  currentEntryRole?: string;
  label: string;
  relationshipType?: string;
  targetCategoryBehavior?: string;
  targetEntryKinds?: string[];
  targetCategories?: string[];
  valueType: string;
};

type PlaceRelationshipTreeImportantLink = {
  field: string;
  targetEntryKinds?: string[];
  targetCategories?: string[];
};

type PlaceRelationshipTreeNode = {
  category: string | null;
  fieldProfiles?: string[];
  id: string;
  importantLinks?: PlaceRelationshipTreeImportantLink[];
  primaryParentCategories?: string[];
  typicalChildCategories?: string[];
};

function readPlanningArtifact(): PlaceRelationshipTreeArtifact {
  return JSON.parse(
    readFileSync(join(process.cwd(), 'place-relationship-tree.json'), 'utf8')
  ) as PlaceRelationshipTreeArtifact;
}

describe('place relationship tree canonical artifact', () => {
  const allowedFieldValueTypes = new Set([
    'enum',
    'link',
    'linkList',
    'markdown',
    'string',
    'stringList',
  ]);

  it('keeps artifact ids unique where generated metadata uses identifiers', () => {
    const artifact = readPlanningArtifact();
    const relationshipTypeIds = artifact.relationshipTypes.map(
      (relationshipType) => relationshipType.id
    );
    const treeNodeIds = artifact.tree.map((node) => node.id);

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
    expect(new Set(relationshipTypeIds).size).toBe(relationshipTypeIds.length);
    expect(new Set(treeNodeIds).size).toBe(treeNodeIds.length);
  });

  it('generates runtime taxonomy metadata from the canonical artifact', () => {
    const artifact = readPlanningArtifact();
    const generatedFieldCatalog = placeFieldCatalog as Record<
      string,
      { label: string; valueType: string }
    >;
    const generatedProfileFieldKeys = profileFieldKeys as Record<
      string,
      readonly string[]
    >;
    const generatedCategoryProfiles = categoryProfiles as Record<
      string,
      readonly string[]
    >;
    const coreEntryFields = new Set(artifact.runtime.coreEntryFields);

    expect([...placeSharedFieldKeys]).toEqual(
      artifact.runtime.sharedDetailFields
    );

    for (const [fieldKey, field] of Object.entries(artifact.fieldCatalog)) {
      if (coreEntryFields.has(fieldKey)) {
        expect(generatedFieldCatalog[fieldKey]).toBeUndefined();
        continue;
      }
      expect(generatedFieldCatalog[fieldKey]).toMatchObject({
        label: field.label,
        valueType: field.valueType,
      });
    }

    for (const [profileId, fieldKeys] of Object.entries(
      artifact.commonFieldProfiles
    )) {
      expect(generatedProfileFieldKeys[profileId]).toEqual(
        fieldKeys.filter((fieldKey) => !coreEntryFields.has(fieldKey))
      );
    }

    for (const node of artifact.tree) {
      if (!node.category) {
        continue;
      }
      expect(generatedCategoryProfiles[node.category]).toEqual(
        node.fieldProfiles ?? []
      );
    }
  });

  it('keeps runtime place categories aligned with the planning tree', () => {
    const artifact = readPlanningArtifact();
    const planningCategories = artifact.tree
      .map((node) => node.category)
      .filter((category): category is string => Boolean(category))
      .sort();
    const runtimeCategories = [...supportedPlaceCategoryOptions].sort();

    expect(artifact.schemaVersion).toBe(1);
    expect(planningCategories).toEqual(runtimeCategories);
  });

  it('keeps runtime relationship-backed field metadata aligned with the planning field catalog', () => {
    const artifact = readPlanningArtifact();
    const relationshipTypeLabels = new Set(
      artifact.relationshipTypes.flatMap((relationshipType) => [
        relationshipType.label,
        relationshipType.inverseLabel,
      ])
    );

    for (const config of placeRelationshipFieldConfigs) {
      const fieldCatalogEntry = artifact.fieldCatalog[config.fieldKey];

      expect(fieldCatalogEntry).toBeDefined();
      expect(fieldCatalogEntry.label).toBe(config.label);
      expect(fieldCatalogEntry.relationshipType).toBe(config.relationshipType);
      expect(fieldCatalogEntry.currentEntryRole).toBe(config.currentEntryRole);
      expect(fieldCatalogEntry.targetCategoryBehavior).toBe(
        config.targetCategoryBehavior
      );
      expect(relationshipTypeLabels.has(config.relationshipType)).toBe(true);
      expect(fieldCatalogEntry.targetEntryKinds ?? []).toEqual([
        ...config.targetEntryKinds,
      ]);
      expect(fieldCatalogEntry.targetCategories ?? []).toEqual([
        ...(config.targetPlaceCategories ?? []),
      ]);
    }
  });

  it('keeps runtime and planning relationship type vocabularies aligned', () => {
    const artifact = readPlanningArtifact();
    const artifactRelationshipTypeLabels = new Set(
      artifact.relationshipTypes.flatMap((relationshipType) => [
        relationshipType.label,
        relationshipType.inverseLabel,
      ])
    );
    const runtimeRelationshipTypeLabels = new Set(placeRelationshipTypeOptions);

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

  it('keeps tree field, profile, target kind, and category references valid', () => {
    const artifact = readPlanningArtifact();
    const fieldKeys = new Set(Object.keys(artifact.fieldCatalog));
    const profileIds = new Set(Object.keys(artifact.commonFieldProfiles));
    const supportedCategories = new Set(supportedPlaceCategoryOptions);
    const supportedEntryKinds = new Set([
      'place',
      ...artifact.scope.nonPlaceLinkTargets,
    ]);
    const relationshipByLabel = new Map(
      artifact.relationshipTypes.flatMap((relationshipType) =>
        [relationshipType.label, relationshipType.inverseLabel]
          .filter((label): label is string => Boolean(label))
          .map((label) => [label, relationshipType])
      )
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

    for (const [profileId, profileFieldKeys] of Object.entries(
      artifact.commonFieldProfiles
    )) {
      expect(
        profileFieldKeys.filter((fieldKey) => !fieldKeys.has(fieldKey))
      ).toEqual([]);
      expect(profileId).toBeTruthy();
    }

    for (const [fieldKey, field] of Object.entries(artifact.fieldCatalog)) {
      expect(allowedFieldValueTypes.has(field.valueType)).toBe(true);
      expect(
        (field.targetEntryKinds ?? []).filter(
          (entryKind) => !supportedEntryKinds.has(entryKind)
        )
      ).toEqual([]);
      if (field.relationshipType) {
        expect(['link', 'linkList']).toContain(field.valueType);
        expect(field.cardinality).toBe(
          field.valueType === 'link' ? 'zeroOrOne' : 'zeroOrMany'
        );
        expect(field.targetEntryKinds?.length ?? 0).toBeGreaterThan(0);
        expect(
          (field.targetEntryKinds ?? []).every((entryKind) => entryKind.trim())
        ).toBe(true);
        const relationshipType = relationshipByLabel.get(
          field.relationshipType
        );
        expect(relationshipType).toBeDefined();
        expect(
          (field.targetEntryKinds ?? []).filter(
            (entryKind) => !relationshipType?.targetKinds.includes(entryKind)
          )
        ).toEqual([]);
      }
      expect(
        (field.targetCategories ?? []).filter(
          (category) => !supportedCategories.has(category)
        )
      ).toEqual([]);
      expect(fieldKey).toBeTruthy();
    }

    for (const node of artifact.tree) {
      expect(
        (node.fieldProfiles ?? []).filter(
          (profileId) => !profileIds.has(profileId)
        )
      ).toEqual([]);
      expect(
        [
          ...(node.primaryParentCategories ?? []),
          ...(node.typicalChildCategories ?? []),
        ].filter((category) => !supportedCategories.has(category))
      ).toEqual([]);

      for (const link of node.importantLinks ?? []) {
        expect(fieldKeys.has(link.field)).toBe(true);
        expect(
          (link.targetEntryKinds ?? []).filter(
            (entryKind) => !supportedEntryKinds.has(entryKind)
          )
        ).toEqual([]);
        expect(
          (link.targetCategories ?? []).filter(
            (category) => !supportedCategories.has(category)
          )
        ).toEqual([]);
      }
    }
  });
});
