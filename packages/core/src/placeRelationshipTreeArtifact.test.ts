import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  placeRelationshipFieldConfigs,
  supportedPlaceCategoryOptions,
} from './placeTaxonomy';

type PlaceRelationshipTreeArtifact = {
  schemaVersion: number;
  fieldCatalog: Record<string, unknown>;
  tree: {
    category: string | null;
  }[];
};

function readPlanningArtifact(): PlaceRelationshipTreeArtifact {
  return JSON.parse(
    readFileSync(join(process.cwd(), 'place-relationship-tree.json'), 'utf8')
  ) as PlaceRelationshipTreeArtifact;
}

describe('place relationship tree planning artifact', () => {
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

  it('documents runtime relationship-backed fields in the planning field catalog', () => {
    const artifact = readPlanningArtifact();
    const fieldCatalogKeys = new Set(Object.keys(artifact.fieldCatalog));

    expect(
      placeRelationshipFieldConfigs
        .map((config) => config.fieldKey)
        .filter((fieldKey) => !fieldCatalogKeys.has(fieldKey))
    ).toEqual([]);
  });
});
