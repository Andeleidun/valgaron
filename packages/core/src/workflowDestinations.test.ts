import { describe, expect, it } from '@jest/globals';
import { applyEntry, entryFromDraft } from './codexEntries';
import { cloneWorkspaceSchema, createSeedWorldDocument } from './seedCodex';
import { getActiveWorld } from './worldDocument';
import {
  createCustomEntryType,
  removeCustomEntryTypeField,
  updateActiveWorkspace,
} from './workspaceManagement';
import {
  formatUtilityOverviewActionAccessibilityLabel,
  formatWorkflowDestinationAccessibilityLabel,
  getUtilitiesOverviewModel,
  getUtilitiesRouteFocusTargetId,
  utilityRouteFocusTargetIds,
  utilityWorkflowDestinations,
} from './workflowDestinations';
import type { WorldEntryStatus, WorldWorkspace } from './types';

function createCompleteSingleRecordWorld(
  status: WorldEntryStatus
): WorldWorkspace {
  return {
    id: 'world-review-routing',
    name: 'Review Routing',
    summary: '',
    defaultEra: '',
    status: 'active',
    planetaryWorlds: [],
    entryTypes: [
      {
        id: 'artifacts',
        kind: 'artifact',
        title: 'Artifacts',
        singularTitle: 'Artifact',
        description: '',
        detailFields: [],
        custom: true,
      },
    ],
    schema: cloneWorkspaceSchema(),
    codex: {
      artifacts: [
        {
          id: `artifact-${status}`,
          kind: 'artifact',
          name: 'Complete Scout',
          summary: 'A complete record used for hotspot routing.',
          notes: 'Ready for review routing.',
          tags: ['scout'],
          status,
          pinned: false,
          createdAt: '2026-07-06T00:00:00.000Z',
          updatedAt: '2026-07-06T00:00:00.000Z',
          fields: {},
        },
      ],
      characters: [],
      places: [],
      factions: [],
      lore: [],
      timeline: [],
    },
    relationships: [],
    createdAt: '2026-07-06T00:00:00.000Z',
    updatedAt: '2026-07-06T00:00:00.000Z',
  };
}

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
      '/help?topic=utilities',
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
    expect(overview.kickerLabel).toBe('Workflow Hub');
    expect(overview.destinations).toBe(utilityWorkflowDestinations);
    expect(overview.knowledgeSummary.title).toBe('Knowledge Schema');
    expect(overview.knowledgeSummary.metrics).toEqual(
      expect.arrayContaining([
        '5 entry types',
        'No hidden detail cleanup targets.',
      ])
    );
    expect(overview.knowledgeSummary.compactMetricLines).toEqual([
      '5 entry types, 22 fields, 3 relationship-backed fields.',
      'No hidden detail cleanup targets.',
    ]);
    expect(
      overview.knowledgeSummary.actions.map((action) => action.actionLabel)
    ).toEqual(['Open Type Setup']);
    expect(overview.shortcutSummary).toMatchObject({
      title: 'Tool shortcuts',
      actions: [
        { actionLabel: 'Open Data', path: '/data' },
        { actionLabel: 'Open Workspaces', path: '/workspaces' },
        { actionLabel: 'Open Help', path: '/help?topic=utilities' },
      ],
    });
    expect(overview.reviewSummary).toMatchObject({
      title: 'Review hotspots',
      detail:
        'Jump to existing review surfaces when cleanup signals appear across records, chronology, relationships, or schema.',
      emptyActionText: 'No cross-surface review hotspots need action.',
    });
    expect(overview.reviewSummary.metrics).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Workbench record signal'),
        expect.stringContaining('timeline cleanup signal'),
        expect.stringContaining('relationship cleanup signal'),
        expect.stringContaining('hidden detail cleanup target'),
      ])
    );
    expect(overview.reviewSummary.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionLabel: 'Open 10 Incomplete Records',
          count: 10,
          countLabel: '10 incomplete records',
          path: '/entries?view=incomplete',
        }),
        expect.objectContaining({
          actionLabel: 'Open Relationship Review',
          path: '/relationships',
        }),
      ])
    );
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

  it('formats utility action accessibility labels with count and detail context', () => {
    expect(
      formatUtilityOverviewActionAccessibilityLabel({
        actionLabel: 'Open Unlinked Record',
        countLabel: '1 record signal',
        detail: 'Open the unlinked Workbench queue before other signals.',
      })
    ).toBe(
      'Open Unlinked Record. 1 record signal. Open the unlinked Workbench queue before other signals.'
    );
    expect(
      formatUtilityOverviewActionAccessibilityLabel({
        actionLabel: 'Open Data',
        detail: 'Export backups and review diagnostics.',
      })
    ).toBe('Open Data. Export backups and review diagnostics.');
    expect(
      formatUtilityOverviewActionAccessibilityLabel({
        actionLabel: 'Open 10 Incomplete Records',
        countLabel: '10 incomplete records',
        detail:
          'Open the Incomplete Workbench queue before reviewing other record signals.',
      })
    ).toBe(
      'Open 10 Incomplete Records. Open the Incomplete Workbench queue before reviewing other record signals.'
    );
    expect(
      formatUtilityOverviewActionAccessibilityLabel({
        actionLabel: 'Open 1 Needs Review Record',
        countLabel: '1 needs review record',
        detail:
          'Open the Needs Review Workbench queue before reviewing other record signals.',
      })
    ).toBe(
      'Open 1 Needs Review Record. Open the Needs Review Workbench queue before reviewing other record signals.'
    );
  });

  it('formats workflow destination accessibility labels with destination detail', () => {
    expect(
      formatWorkflowDestinationAccessibilityLabel({
        actionLabel: 'Open Knowledge Setup',
        detail:
          'Manage custom entry types, reusable fields, and knowledge structure.',
      })
    ).toBe(
      'Open Knowledge Setup. Manage custom entry types, reusable fields, and knowledge structure.'
    );
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
    expect(overview.reviewSummary.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionLabel: 'Open Knowledge Cleanup',
          path: '/knowledge#hidden-detail-cleanup',
        }),
      ])
    );
  });

  it('routes Workbench hotspots to the active review queue', () => {
    const unlinkedOverview = getUtilitiesOverviewModel(
      createCompleteSingleRecordWorld('canon')
    );
    const needsReviewOverview = getUtilitiesOverviewModel(
      createCompleteSingleRecordWorld('needs-review')
    );

    expect(
      unlinkedOverview.reviewSummary.actions.find(
        (action) => action.id === 'workbench-review'
      )
    ).toMatchObject({
      actionLabel: 'Open 1 Unlinked Record',
      count: 1,
      countLabel: '1 unlinked record',
      detail:
        'Open the Unlinked Workbench queue before reviewing other record signals.',
      path: '/entries?view=unlinked',
    });
    expect(
      needsReviewOverview.reviewSummary.actions.find(
        (action) => action.id === 'workbench-review'
      )
    ).toMatchObject({
      actionLabel: 'Open 1 Needs Review Record',
      count: 1,
      countLabel: '1 needs review record',
      detail:
        'Open the Needs Review Workbench queue before reviewing other record signals.',
      path: '/entries?view=needs-review',
    });
  });
});
