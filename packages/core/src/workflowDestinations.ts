import {
  getKnowledgeSchemaModel,
  knowledgeRouteFocusTargetIds,
} from './knowledgeSchema';
import { getRelationshipStudioReviewModel } from './relationshipStudioReview';
import { getEntries } from './codexEntries';
import { getTimelineReviewModel } from './codexTimeline';
import {
  getWorkbenchRecordIndexModel,
  type WorkbenchRecordView,
  type WorkbenchRecordViewId,
} from './workbenchRecords';
import {
  codexShellRoutes,
  formatCodexRouteSearch,
  type CodexShellRouteId,
} from './shell';
import type { WorldWorkspace } from './types';

export type WorkflowDestination = {
  id: string;
  routeId: CodexShellRouteId;
  title: string;
  detail: string;
  actionLabel: string;
  path: string;
};

export type UtilityOverviewAction = {
  id: string;
  title: string;
  detail: string;
  actionLabel: string;
  count?: number;
  countLabel?: string;
  path: string;
};

export type UtilitiesOverviewModel = {
  title: string;
  detail: string;
  knowledgeSummary: {
    title: string;
    detail: string;
    metrics: string[];
    actions: UtilityOverviewAction[];
  };
  shortcutSummary: {
    title: string;
    detail: string;
    actions: UtilityOverviewAction[];
  };
  reviewSummary: {
    title: string;
    detail: string;
    totalIssueCount: number;
    metrics: string[];
    actions: UtilityOverviewAction[];
  };
  destinations: readonly WorkflowDestination[];
};

export function formatUtilityOverviewActionAccessibilityLabel(
  action: Pick<UtilityOverviewAction, 'actionLabel' | 'countLabel' | 'detail'>
): string {
  const normalizedActionLabel = action.actionLabel.toLowerCase();
  const countLabel =
    action.countLabel &&
    !normalizedActionLabel.includes(action.countLabel.toLowerCase())
      ? action.countLabel
      : '';
  return [action.actionLabel, countLabel, action.detail]
    .filter((part): part is string => Boolean(part))
    .join('. ');
}

export function formatWorkflowDestinationAccessibilityLabel(
  destination: Pick<WorkflowDestination, 'actionLabel' | 'detail'>
): string {
  return [destination.actionLabel, destination.detail].join('. ');
}

export const utilityWorkflowDestinations = [
  {
    id: 'knowledge-setup',
    routeId: 'knowledge',
    title: 'Knowledge Setup',
    detail:
      'Manage custom entry types, reusable fields, and knowledge structure.',
    actionLabel: 'Open Knowledge Setup',
    path: `${codexShellRoutes.knowledge.path}#${knowledgeRouteFocusTargetIds.customEntryTypes}`,
  },
  {
    id: 'data-tools',
    routeId: 'data',
    title: 'Data Tools',
    detail: 'Export backups, import JSON, review diagnostics, and reset seeds.',
    actionLabel: 'Open Data',
    path: codexShellRoutes.data.path,
  },
  {
    id: 'workspaces',
    routeId: 'workspaces',
    title: 'Workspaces',
    detail:
      'Manage project/universe workspaces and in-fiction worlds or planets.',
    actionLabel: 'Open Workspaces',
    path: codexShellRoutes.workspaces.path,
  },
  {
    id: 'help',
    routeId: 'help',
    title: 'Help',
    detail: 'Review workflow guidance, data limits, and local prototype notes.',
    actionLabel: 'Open Help',
    path: `${codexShellRoutes.help.path}?topic=utilities`,
  },
] as const satisfies readonly WorkflowDestination[];

export const utilityRouteFocusTargetIds = {
  projectTools: 'project-tools',
  knowledgeSetup: 'knowledge-setup',
  dataTools: 'data-tools',
  workspaces: 'workspaces',
  help: 'help',
} as const;

export type UtilityRouteFocusTargetId =
  (typeof utilityRouteFocusTargetIds)[keyof typeof utilityRouteFocusTargetIds];

function formatCount(count: number, singularLabel: string): string {
  return `${count} ${singularLabel}${count === 1 ? '' : 's'}`;
}

function formatReadyCount(count: number, singularLabel: string): string {
  return count > 0
    ? `${formatCount(count, singularLabel)} ready to review.`
    : `No ${singularLabel}s ready to review.`;
}

const workbenchReviewHotspotPriority = [
  'needs-review',
  'incomplete',
  'unlinked',
] as const satisfies readonly WorkbenchRecordViewId[];

function getWorkbenchReviewHotspotView(
  views: readonly WorkbenchRecordView[]
): WorkbenchRecordView | null {
  return (
    workbenchReviewHotspotPriority
      .map((viewId) => views.find((view) => view.id === viewId) ?? null)
      .find((view) => Boolean(view && view.count > 0)) ?? null
  );
}

function formatWorkbenchReviewActionLabel(view: WorkbenchRecordView): string {
  return `Open ${view.count} ${view.label} Record${
    view.count === 1 ? '' : 's'
  }`;
}

function getWorkbenchReviewQueueCopy(view: WorkbenchRecordView): {
  countSingularLabel: string;
  queueLabel: string;
} {
  switch (view.id) {
    case 'incomplete':
      return {
        countSingularLabel: 'incomplete record',
        queueLabel: 'Incomplete',
      };
    case 'needs-review':
      return {
        countSingularLabel: 'needs review record',
        queueLabel: 'Needs Review',
      };
    case 'unlinked':
      return {
        countSingularLabel: 'unlinked record',
        queueLabel: 'Unlinked',
      };
    default:
      return {
        countSingularLabel: `${view.label.toLowerCase()} record`,
        queueLabel: view.label,
      };
  }
}

export function getUtilitiesRouteFocusTargetId({
  focusId,
}: {
  focusId?: string | null;
}): UtilityRouteFocusTargetId | '' {
  const normalizedFocusId = focusId?.trim() ?? '';
  const matchedTargetId = Object.values(utilityRouteFocusTargetIds).find(
    (targetId) => targetId === normalizedFocusId
  );
  return matchedTargetId ?? '';
}

export function getUtilitiesOverviewModel(
  activeWorld: WorldWorkspace
): UtilitiesOverviewModel {
  const schemaModel = getKnowledgeSchemaModel(activeWorld);
  const workbenchModel = getWorkbenchRecordIndexModel(activeWorld);
  const timelineReview = getTimelineReviewModel(
    getEntries(activeWorld.codex, 'timeline'),
    activeWorld.relationships
  );
  const relationshipReview = getRelationshipStudioReviewModel(activeWorld);
  const hiddenDetailCount = schemaModel.totals.hiddenDetailCount;
  const workbenchReviewViews = workbenchModel.views.filter((view) =>
    ['incomplete', 'unlinked', 'needs-review'].includes(view.id)
  );
  const workbenchIssueCount = workbenchReviewViews.reduce(
    (count, view) => count + view.count,
    0
  );
  const workbenchHotspotView =
    getWorkbenchReviewHotspotView(workbenchReviewViews);
  const workbenchHotspotQueueCopy = workbenchHotspotView
    ? getWorkbenchReviewQueueCopy(workbenchHotspotView)
    : null;
  const relationshipIssueCount = relationshipReview.reviewSummary.items.reduce(
    (count, item) => count + item.count,
    0
  );
  const reviewActions: UtilityOverviewAction[] = [
    ...(workbenchIssueCount > 0 && workbenchHotspotView
      ? [
          {
            id: 'workbench-review',
            title: `Workbench ${workbenchHotspotView.label}`,
            detail: `Open the ${
              workbenchHotspotQueueCopy?.queueLabel ??
              workbenchHotspotView.label
            } Workbench queue before reviewing other record signals.`,
            actionLabel: formatWorkbenchReviewActionLabel(workbenchHotspotView),
            count: workbenchHotspotView.count,
            countLabel: formatCount(
              workbenchHotspotView.count,
              workbenchHotspotQueueCopy?.countSingularLabel ??
                `${workbenchHotspotView.label.toLowerCase()} record`
            ),
            path: `${codexShellRoutes.entries.path}${formatCodexRouteSearch({
              view: workbenchHotspotView.id,
            })}`,
          },
        ]
      : []),
    ...(timelineReview.totalIssueCount > 0
      ? [
          {
            id: 'timeline-review',
            title: timelineReview.title,
            detail:
              'Open timeline ordering and involved-record cleanup signals.',
            actionLabel: 'Open Timeline Review',
            count: timelineReview.totalIssueCount,
            countLabel: formatCount(
              timelineReview.totalIssueCount,
              'timeline signal'
            ),
            path: codexShellRoutes.timeline.path,
          },
        ]
      : []),
    ...(relationshipIssueCount > 0
      ? [
          {
            id: 'relationship-review',
            title: 'Relationship review',
            detail:
              'Open broken links, orphan records, duplicate links, and legacy link text cleanup.',
            actionLabel: 'Open Relationship Review',
            count: relationshipIssueCount,
            countLabel: formatCount(
              relationshipIssueCount,
              'relationship signal'
            ),
            path: codexShellRoutes.relationships.path,
          },
        ]
      : []),
    ...(hiddenDetailCount > 0
      ? [
          {
            id: 'knowledge-cleanup',
            title: schemaModel.hiddenDetails.title,
            detail: schemaModel.hiddenDetails.detail,
            actionLabel: 'Open Knowledge Cleanup',
            count: hiddenDetailCount,
            countLabel: formatCount(
              hiddenDetailCount,
              'hidden detail cleanup target'
            ),
            path: `${codexShellRoutes.knowledge.path}#${knowledgeRouteFocusTargetIds.hiddenDetails}`,
          },
        ]
      : []),
  ];
  const cleanupDetail =
    hiddenDetailCount > 0
      ? `${formatCount(
          hiddenDetailCount,
          'hidden detail cleanup target'
        )} ready to review.`
      : 'No hidden detail cleanup targets.';

  return {
    title: 'Project Tools',
    detail:
      'Open setup, backup, and reference workflows from one place while the primary workspace stays focused on drafting, chronology, and relationships.',
    knowledgeSummary: {
      title: schemaModel.title,
      detail: schemaModel.typeSetup.detail,
      metrics: [
        formatCount(schemaModel.totals.entryTypeCount, 'entry type'),
        formatCount(schemaModel.totals.fieldCount, 'field'),
        formatCount(
          schemaModel.totals.relationshipFieldCount,
          'relationship-backed field'
        ),
        cleanupDetail,
      ],
      actions: [
        {
          id: 'type-setup',
          title: schemaModel.typeSetup.title,
          detail: schemaModel.typeSetup.detail,
          actionLabel: schemaModel.typeSetup.actionLabel,
          path: schemaModel.typeSetup.route,
        },
        ...(hiddenDetailCount > 0
          ? [
              {
                id: 'hidden-detail-cleanup',
                title: schemaModel.hiddenDetails.title,
                detail: schemaModel.hiddenDetails.detail,
                actionLabel: 'Review Cleanup',
                path: `${codexShellRoutes.knowledge.path}#${knowledgeRouteFocusTargetIds.hiddenDetails}`,
              },
            ]
          : []),
      ],
    },
    shortcutSummary: {
      title: 'Tool shortcuts',
      detail:
        'Jump directly to backups, workspace management, and focused Help without scanning the full tools page.',
      actions: utilityWorkflowDestinations
        .filter((destination) => destination.id !== 'knowledge-setup')
        .map((destination) => ({
          id: destination.id,
          title: destination.title,
          detail: destination.detail,
          actionLabel: destination.actionLabel,
          path: destination.path,
        })),
    },
    reviewSummary: {
      title: 'Review hotspots',
      detail:
        'Jump to existing review surfaces when cleanup signals appear across records, chronology, relationships, or schema.',
      totalIssueCount:
        workbenchIssueCount +
        timelineReview.totalIssueCount +
        relationshipIssueCount +
        hiddenDetailCount,
      metrics: [
        formatReadyCount(workbenchIssueCount, 'Workbench record signal'),
        formatReadyCount(
          timelineReview.totalIssueCount,
          'timeline cleanup signal'
        ),
        formatReadyCount(relationshipIssueCount, 'relationship cleanup signal'),
        formatReadyCount(hiddenDetailCount, 'hidden detail cleanup target'),
      ],
      actions: reviewActions,
    },
    destinations: utilityWorkflowDestinations,
  };
}
