import {
  getKnowledgeSchemaModel,
  knowledgeRouteFocusTargetIds,
} from './knowledgeSchema';
import { codexShellRoutes, type CodexShellRouteId } from './shell';
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
  destinations: readonly WorkflowDestination[];
};

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
    path: codexShellRoutes.help.path,
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
  const hiddenDetailCount = schemaModel.totals.hiddenDetailCount;
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
    destinations: utilityWorkflowDestinations,
  };
}
