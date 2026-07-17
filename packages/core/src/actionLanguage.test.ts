import { describe, expect, it } from '@jest/globals';
import { getEntryEditorSubmitLabel } from './codexEntries';
import { getRelationshipSubmitLabel } from './codexRelationships';
import { getKnowledgeSchemaModel } from './knowledgeSchema';
import { createSeedWorldDocument, worldSections } from './seedCodex';
import { getActiveWorld } from './worldDocument';
import { workspaceFeatureActions } from './workspaceFeatureModel';

describe('create and update action language', () => {
  it('uses context-aware action labels across shared web and mobile models', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const entryActions = worldSections.map((section) => {
      const existingEntry = world.codex[section.id][0];
      return {
        recordType: section.singularTitle,
        create: getEntryEditorSubmitLabel({ section, selectedEntry: null }),
        update: getEntryEditorSubmitLabel({
          section,
          selectedEntry: existingEntry,
        }),
        updateWithLinks: getEntryEditorSubmitLabel({
          section,
          selectedEntry: existingEntry,
          stagedRelationshipCount: 2,
        }),
      };
    });
    const knowledge = getKnowledgeSchemaModel(world);
    const firstField = knowledge.sections[0]?.fields[0];
    const firstValue = knowledge.vocabulary.rows[0]?.values[0];

    expect(entryActions).toEqual(
      worldSections.map((section) => ({
        recordType: section.singularTitle,
        create: `Create ${section.singularTitle}`,
        update: `Update ${section.singularTitle}`,
        updateWithLinks: `Update ${section.singularTitle} And 2 Links`,
      }))
    );
    expect({
      workspace: {
        create: workspaceFeatureActions.createWorkspace,
        update: workspaceFeatureActions.updateWorkspace,
      },
      world: {
        create: workspaceFeatureActions.createWorld,
        update: workspaceFeatureActions.updateWorld,
      },
      relationship: {
        create: getRelationshipSubmitLabel(null),
        update: getRelationshipSubmitLabel(world.relationships[0]),
      },
      fieldSettings: firstField?.updateSettingsLabel,
      fieldLabel: workspaceFeatureActions.updateFieldLabel,
      vocabularyValue: firstValue?.updateLabel,
    }).toEqual({
      workspace: {
        create: 'Create Workspace',
        update: 'Update Workspace',
      },
      world: { create: 'Create World', update: 'Update World' },
      relationship: {
        create: 'Create Relationship',
        update: 'Update Relationship',
      },
      fieldSettings: 'Update Field Settings',
      fieldLabel: 'Update Label',
      vocabularyValue: 'Update Value',
    });
  });
});
