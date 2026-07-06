import { describe, expect, it } from '@jest/globals';
import { applyEntry, entryFromDraft } from './codexEntries';
import { createSeedWorldDocument } from './seedCodex';
import { getActiveWorld } from './worldDocument';
import {
  createCustomEntryType,
  removeCustomEntryTypeField,
  updateActiveWorkspace,
} from './workspaceManagement';
import {
  getUtilitiesOverviewModel,
  getUtilitiesRouteFocusTargetId,
  utilityRouteFocusTargetIds,
  utilityWorkflowDestinations,
} from './workflowDestinations';

describe('workflow destinations', () => {
  it('keeps utility destinations centralized for web and mobile surfaces', () => {
    expect(
      utilityWorkflowDestinations.map((destination) => destination.id)
    ).toEqual(['knowledge-setup', 'data-tools', 'workspaces', 'help']);
    expect(
      utilityWorkflowDestinations.map((destination) => destination.path)
    ).toEqual([
      '/knowledge#custom-entry-types',
      '/data',
      '/workspaces',
      '/help',
    ]);
    expect(
      utilityWorkflowDestinations.map((destination) => destination.actionLabel)
    ).toEqual([
      'Open Knowledge Setup',
      'Open Data',
      'Open Workspaces',
      'Open Help',
    ]);
  });

  it('builds a shared Utilities overview with Knowledge schema status', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const overview = getUtilitiesOverviewModel(world);

    expect(overview.title).toBe('Project Tools');
    expect(overview.destinations).toBe(utilityWorkflowDestinations);
    expect(overview.knowledgeSummary.title).toBe('Knowledge Schema');
    expect(overview.knowledgeSummary.metrics).toEqual(
      expect.arrayContaining([
        '5 entry types',
        'No hidden detail cleanup targets.',
      ])
    );
    expect(
      overview.knowledgeSummary.actions.map((action) => action.actionLabel)
    ).toEqual(['Open Type Setup']);
  });

  it('resolves Utilities route focus targets for destination cards', () => {
    expect(
      getUtilitiesRouteFocusTargetId({
        focusId: utilityRouteFocusTargetIds.projectTools,
      })
    ).toBe(utilityRouteFocusTargetIds.projectTools);
    expect(getUtilitiesRouteFocusTargetId({ focusId: 'data-tools' })).toBe(
      'data-tools'
    );
    expect(getUtilitiesRouteFocusTargetId({ focusId: 'missing' })).toBe('');
    expect(getUtilitiesRouteFocusTargetId({ focusId: '' })).toBe('');
  });

  it('adds a cleanup action when hidden details exist', () => {
    const withCustomType = updateActiveWorkspace(
      createSeedWorldDocument(),
      (workspace) =>
        createCustomEntryType(workspace, {
          title: 'Artifacts',
          singularTitle: 'Artifact',
          description: 'Objects with story weight.',
          fields: 'Origin, Power',
        })
    );
    const customSection = getActiveWorld(withCustomType).entryTypes.find(
      (section) => section.id === 'artifacts'
    );
    const customEntry = entryFromDraft(customSection!, {
      name: 'Glass Key',
      summary: 'A key made of dawn glass.',
      notes: '',
      tags: 'artifact',
      status: 'draft',
      pinned: false,
      details: { origin: 'Glassroot Forest', power: 'Opens dawn doors' },
    });
    const withCustomEntry = updateActiveWorkspace(
      withCustomType,
      (workspace) => ({
        ...workspace,
        codex: applyEntry(workspace.codex, customEntry, workspace.entryTypes),
      })
    );
    const withRemovedField = updateActiveWorkspace(
      withCustomEntry,
      (workspace) => removeCustomEntryTypeField(workspace, 'artifacts', 'power')
    );

    const overview = getUtilitiesOverviewModel(
      getActiveWorld(withRemovedField)
    );

    expect(overview.knowledgeSummary.metrics).toContain(
      '1 hidden detail cleanup target ready to review.'
    );
    expect(overview.knowledgeSummary.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionLabel: 'Review Cleanup',
          path: '/knowledge#hidden-detail-cleanup',
        }),
      ])
    );
  });
});
