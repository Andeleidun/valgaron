import {
  codexShellRoutes,
  mobilePrimaryRouteOrder,
  mobileWebPrimaryRouteOrder,
  webPrimaryRouteOrder,
  type CodexShellRouteId,
} from './shell';

export type ValgaronSurface = 'desktop-web' | 'mobile-web' | 'native-mobile';

export type ValgaronLayoutMode = 'desktop' | 'mobile-web' | 'native-mobile';

export type ValgaronRenderer = 'web' | 'native';

export type ValgaronWorkflowStepId =
  | 'workbench'
  | 'timeline'
  | 'links'
  | 'knowledge'
  | 'more'
  | 'utilities';

export type MobileWorkbenchModeId = 'index' | 'context' | 'edit';

export type MobileWorkbenchModeOption = {
  id: MobileWorkbenchModeId;
  label: string;
  detail: string;
  disabled: boolean;
  isActive: boolean;
};

export type MobileWorkbenchModeModel = {
  activeMode: MobileWorkbenchModeId;
  title: string;
  options: readonly MobileWorkbenchModeOption[];
};

export type MobileEntryWorkflowSurface = 'workbench' | 'timeline';

export type MobileWorkbenchModeSummaryOptions = {
  activeMode: MobileWorkbenchModeId;
  reviewItemCount?: number;
  sectionSingularTitle: string;
  sectionTitle: string;
  selectedEntryName?: string;
  stagedRelationshipCount?: number;
  surface?: MobileEntryWorkflowSurface;
  visibleRecordCount: number;
};

export type ValgaronWorkflowStep = {
  id: ValgaronWorkflowStepId;
  label: string;
  routeId: CodexShellRouteId;
  route: string;
};

export type ValgaronSurfaceContract = {
  surface: ValgaronSurface;
  layoutMode: ValgaronLayoutMode;
  renderer: ValgaronRenderer;
  routeOrder: readonly CodexShellRouteId[];
  workflow: readonly ValgaronWorkflowStep[];
  usesStackedMobileFlow: boolean;
};

const desktopWebWorkflow = [
  {
    id: 'workbench',
    label: 'Workbench',
    routeId: 'entries',
    route: codexShellRoutes.entries.path,
  },
  {
    id: 'timeline',
    label: 'Timeline',
    routeId: 'timeline',
    route: codexShellRoutes.timeline.path,
  },
  {
    id: 'links',
    label: 'Relationships',
    routeId: 'relationships',
    route: codexShellRoutes.relationships.path,
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    routeId: 'knowledge',
    route: codexShellRoutes.knowledge.path,
  },
  {
    id: 'utilities',
    label: 'Utilities',
    routeId: 'utilities',
    route: codexShellRoutes.utilities.path,
  },
] as const satisfies readonly ValgaronWorkflowStep[];

const mobileWorkflow = [
  {
    id: 'workbench',
    label: 'Workbench',
    routeId: 'entries',
    route: codexShellRoutes.entries.path,
  },
  {
    id: 'timeline',
    label: 'Timeline',
    routeId: 'timeline',
    route: codexShellRoutes.timeline.path,
  },
  {
    id: 'links',
    label: 'Links',
    routeId: 'relationships',
    route: codexShellRoutes.relationships.path,
  },
  {
    id: 'more',
    label: 'More',
    routeId: 'utilities',
    route: codexShellRoutes.utilities.path,
  },
] as const satisfies readonly ValgaronWorkflowStep[];

export const valgaronSurfaceContracts = {
  desktopWeb: {
    surface: 'desktop-web',
    layoutMode: 'desktop',
    renderer: 'web',
    routeOrder: webPrimaryRouteOrder,
    workflow: desktopWebWorkflow,
    usesStackedMobileFlow: false,
  },
  mobileWeb: {
    surface: 'mobile-web',
    layoutMode: 'mobile-web',
    renderer: 'web',
    routeOrder: mobileWebPrimaryRouteOrder,
    workflow: mobileWorkflow,
    usesStackedMobileFlow: true,
  },
  nativeMobile: {
    surface: 'native-mobile',
    layoutMode: 'native-mobile',
    renderer: 'native',
    routeOrder: mobilePrimaryRouteOrder,
    workflow: mobileWorkflow,
    usesStackedMobileFlow: true,
  },
} as const satisfies Record<string, ValgaronSurfaceContract>;

export function getValgaronLayoutModeForSurface(
  surface: ValgaronSurface
): ValgaronLayoutMode {
  const contract = Object.values(valgaronSurfaceContracts).find(
    (candidate) => candidate.surface === surface
  );
  if (!contract) {
    throw new Error(`Unsupported Valgaron surface: ${surface}`);
  }
  return contract.layoutMode;
}

export function getValgaronWorkflow(
  surface: ValgaronSurface
): readonly ValgaronWorkflowStep[] {
  const contract = Object.values(valgaronSurfaceContracts).find(
    (candidate) => candidate.surface === surface
  );
  if (!contract) {
    throw new Error(`Unsupported Valgaron surface: ${surface}`);
  }
  return contract.workflow;
}

export function getMobileWorkbenchModeModel({
  activeMode,
  hasReviewItems = false,
  hasSelectedEntry = false,
  surface = 'workbench',
}: {
  activeMode: MobileWorkbenchModeId;
  hasReviewItems?: boolean;
  hasSelectedEntry?: boolean;
  surface?: MobileEntryWorkflowSurface;
}): MobileWorkbenchModeModel {
  const canUseContext = hasSelectedEntry || hasReviewItems;
  const resolvedActiveMode =
    activeMode === 'context' && !canUseContext ? 'index' : activeMode;
  const modeCopy =
    surface === 'timeline'
      ? {
          title: 'Timeline view',
          indexLabel: 'Events',
          indexDetail: 'Find, filter, and order timeline events.',
          contextDetail: 'Review involved records and timeline cleanup.',
          editDetail: 'Create or update the current timeline event.',
        }
      : {
          title: 'Workbench view',
          indexLabel: 'Index',
          indexDetail: 'Find and filter records.',
          contextDetail: 'Review links, cleanup, and selected-record context.',
          editDetail: 'Create or update the current draft.',
        };
  const options = [
    {
      id: 'index',
      label: modeCopy.indexLabel,
      detail: modeCopy.indexDetail,
      disabled: false,
    },
    {
      id: 'context',
      label: 'Context',
      detail: modeCopy.contextDetail,
      disabled: !canUseContext,
    },
    {
      id: 'edit',
      label: 'Edit',
      detail: modeCopy.editDetail,
      disabled: false,
    },
  ] as const satisfies readonly Omit<MobileWorkbenchModeOption, 'isActive'>[];

  return {
    activeMode: resolvedActiveMode,
    title: modeCopy.title,
    options: options.map((option) => ({
      ...option,
      isActive: option.id === resolvedActiveMode,
    })),
  };
}

function formatCount(count: number, singularLabel: string): string {
  return `${count} ${singularLabel}${count === 1 ? '' : 's'}`;
}

export function getMobileWorkbenchModeSummary({
  activeMode,
  reviewItemCount = 0,
  sectionSingularTitle,
  sectionTitle,
  selectedEntryName = '',
  stagedRelationshipCount = 0,
  surface = 'workbench',
  visibleRecordCount,
}: MobileWorkbenchModeSummaryOptions): string {
  if (activeMode === 'edit') {
    if (selectedEntryName) {
      return `Editing ${selectedEntryName}.`;
    }
    if (stagedRelationshipCount > 0) {
      return `New ${sectionSingularTitle} draft with ${formatCount(
        stagedRelationshipCount,
        'staged link'
      )}.`;
    }
    return `New ${sectionSingularTitle} draft.`;
  }

  if (activeMode === 'context') {
    if (selectedEntryName) {
      return `Reviewing context for ${selectedEntryName}.`;
    }
    if (reviewItemCount > 0) {
      return `${formatCount(reviewItemCount, 'review item')} ready.`;
    }
    return 'Select a record to review context.';
  }

  if (surface === 'timeline') {
    return `${formatCount(
      visibleRecordCount,
      'visible event'
    )} in ${sectionTitle}.`;
  }

  return `${formatCount(
    visibleRecordCount,
    'visible record'
  )} in ${sectionTitle}.`;
}
