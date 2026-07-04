import { describe, expect, it } from '@jest/globals';
import { createFrontendParityWorldDocument } from './frontendParityFixture';
import { createSeedWorldDocument } from './seedCodex';
import {
  createCustomEntryType,
  createWorkspace,
  updateActiveWorkspace,
} from './workspaceManagement';
import {
  getPlanetaryWorldFormKicker,
  getPlanetaryWorldFormTitle,
  getWorkspaceFormKicker,
  getWorkspaceFormTitle,
  getWorkspaceFeatureModel,
  workspaceFeatureActions,
  workspaceFeatureCopy,
} from './workspaceFeatureModel';
import { getActiveWorld } from './worldDocument';

describe('workspace feature model', () => {
  it('centralizes Workspaces screen action labels', () => {
    expect(workspaceFeatureActions).toMatchObject({
      newWorkspace: 'New Workspace',
      saveWorkspace: 'Save Workspace',
      createWorkspace: 'Create Workspace',
      deletePermanently: 'Delete Permanently',
      deleteType: 'Delete Type',
      newWorld: 'New World',
      newWorldDraft: 'New World Draft',
    });
  });

  it('centralizes Workspaces screen headings and form titles', () => {
    expect(workspaceFeatureCopy.sections).toEqual({
      workspaces: 'Project/universe workspaces',
      planetaryWorlds: 'In-fiction worlds and planets',
      customEntryTypes: 'Custom entry types',
    });
    expect(getWorkspaceFormKicker()).toBe('New workspace metadata');
    expect(getWorkspaceFormTitle()).toBe('Create project/universe');
    expect(getWorkspaceFormKicker('Parity Atlas')).toBe('Edit workspace');
    expect(getWorkspaceFormTitle('Parity Atlas')).toBe('Parity Atlas');
    expect(getPlanetaryWorldFormKicker()).toBe('New world');
    expect(getPlanetaryWorldFormTitle()).toBe('Create in-fiction world');
    expect(getPlanetaryWorldFormKicker('Aurelia')).toBe('Edit world');
    expect(getPlanetaryWorldFormTitle('Aurelia')).toBe('Aurelia');
  });

  it('builds shared workspace rows with action state and search', () => {
    const seed = createSeedWorldDocument();
    const document = createWorkspace(seed, {
      name: 'Archive Candidate',
      summary: 'A workspace for archival tests.',
      defaultEra: 'Third Age',
    });
    const model = getWorkspaceFeatureModel({
      activeWorld: getActiveWorld(document),
      document,
      queries: { workspaces: 'archive' },
      selectedWorkspaceId: seed.activeWorldId,
    });

    expect(model.selectedWorkspace?.id).toBe(seed.activeWorldId);
    expect(model.selectedWorkspaceActionState?.switchLabel).toBe('Switch');
    expect(model.activeWorkspaceCount).toBe(2);
    expect(model.workspaces.rows).toHaveLength(1);
    expect(model.workspaces.rows[0]).toMatchObject({
      name: 'Archive Candidate',
      kindLabel: 'Project/universe workspace',
      statusLine: 'active - Third Age',
      summaryText: 'A workspace for archival tests.',
      isActive: true,
      actionState: {
        switchLabel: 'Current',
        canSwitch: false,
        canArchive: true,
        canDelete: true,
      },
    });
  });

  it('summarizes custom entry types and in-fiction worlds from the active workspace', () => {
    const fixture = createFrontendParityWorldDocument();
    const activeWorld = getActiveWorld(fixture);
    const model = getWorkspaceFeatureModel({
      activeWorld,
      document: fixture,
      queries: {
        customEntryTypes: 'artifact',
        planetaryWorlds: 'veil',
      },
    });

    expect(model.customEntryTypes.rows[0]).toMatchObject({
      title: 'Artifacts',
      descriptionText: 'Objects with worldbuilding importance.',
      fieldsText: 'Origin, Power, Current keeper',
      entryCountLabel: '1 entry',
    });
    expect(model.planetaryWorlds.rows[0]).toMatchObject({
      name: 'Veil Moon',
      kindLabel: 'Archived in-fiction world',
      statusLine: 'archived - Lost moon',
      classificationLabel: 'Lost moon',
      climateText: 'Climate: Frozen storm belts',
      terrainText: 'Terrain: Ice shelves',
      tagsText: 'Tags: archived-world',
    });
  });

  it('uses the shared result limit and empty text for large lists', () => {
    let document = createSeedWorldDocument();
    for (const title of ['Artifacts', 'Relics', 'Rituals']) {
      document = updateActiveWorkspace(document, (workspace) =>
        createCustomEntryType(workspace, {
          title,
          singularTitle: title.slice(0, -1),
          description: '',
          fields: 'Origin',
        })
      );
    }

    const model = getWorkspaceFeatureModel({
      activeWorld: getActiveWorld(document),
      document,
      queries: {
        customEntryTypes: '',
        planetaryWorlds: 'missing',
      },
      resultLimit: 2,
    });

    expect(model.customEntryTypes.rows.map((row) => row.title)).toEqual([
      'Artifacts',
      'Relics',
    ]);
    expect(model.customEntryTypes.hiddenCount).toBe(1);
    expect(model.customEntryTypes.hiddenText).toBe(
      'Refine custom type search to show 1 more type.'
    );
    expect(model.planetaryWorlds.rows).toEqual([]);
    expect(model.planetaryWorlds.emptyText).toBe(
      'No in-fiction worlds match this search.'
    );
  });
});
