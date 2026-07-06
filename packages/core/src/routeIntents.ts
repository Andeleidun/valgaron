import {
  codexShellRoutes,
  formatCodexRouteSearch,
  getCodexEntriesRoute,
  getCodexRelationshipsRoute,
  type CodexShellRouteId,
} from './shell';
import {
  getCodexHelpRoute,
  isCodexHelpFocusId,
  type CodexHelpFocusId,
} from './helpTopics';
import { isCodexExportMode } from './codexDataPortability';
import type { DataExportMode } from './dataFeatureModel';
import {
  getUtilitiesRouteFocusTargetId,
  type UtilityRouteFocusTargetId,
} from './workflowDestinations';

export type CodexRouteIntent = {
  routeId: CodexShellRouteId;
  pathname: string;
  params: Record<string, string>;
  focusId?: string;
};

export type CodexWorkflowIntent =
  | {
      kind: 'overview';
    }
  | {
      kind: 'entries-browse';
      query: string;
      sectionId: string;
    }
  | {
      timelineContext?: {
        era: string;
        involvedEntryId: string;
      };
      kind: 'entry-create';
      query: string;
      sectionId: string;
    }
  | {
      entryId: string;
      query: string;
      sectionId: string;
      kind: 'entry-edit';
    }
  | {
      entryId: string;
      query: string;
      sectionId: string;
      kind: 'entry-context';
    }
  | {
      kind: 'timeline';
    }
  | {
      entryId: string;
      entryQuery: string;
      kind: 'relationships';
      relationshipQuery: string;
    }
  | {
      kind: 'knowledge';
    }
  | {
      focusId: UtilityRouteFocusTargetId | '';
      kind: 'utilities';
    }
  | {
      kind: 'workspaces';
    }
  | {
      focusId: string;
      kind: 'data';
      mode: DataExportMode | '';
    }
  | {
      kind: 'help';
      topic: CodexHelpFocusId | '';
    };

const codexShellRouteEntries = Object.entries(codexShellRoutes) as Array<
  [CodexShellRouteId, { path: string }]
>;

export const codexWorkflowRouteSamples = [
  ...codexShellRouteEntries.map(([, route]) => route.path),
  getCodexEntriesRoute({
    entryId: 'character-mira-rowan',
    intent: 'edit',
    query: 'Mira Rowan',
    sectionId: 'characters',
  }),
  getCodexEntriesRoute({
    entryId: 'character-mira-rowan',
    intent: 'context',
    query: 'Mira Rowan',
    sectionId: 'characters',
  }),
  getCodexEntriesRoute({ sectionId: 'places', intent: 'new' }),
  getCodexRelationshipsRoute({
    entryId: 'character-mira-rowan',
    entryQuery: 'Mira Rowan',
    relationshipQuery: 'oath=broken & owed',
  }),
  '/timeline',
  '/timeline?entryId=timeline-founding&intent=edit&query=Founding%20of%20Valgaron',
  '/timeline?intent=new&era=Charter%20Era&involvedEntryId=faction-cartographers-guild',
  '/utilities#data-tools',
  '/data#import-json-backup',
  '/data?mode=full-json#export',
  getCodexHelpRoute('timeline'),
] as const;

function getRouteIdForPathname(pathname: string): CodexShellRouteId {
  const matchedRoute = codexShellRouteEntries.find(
    ([, route]) => route.path === pathname
  );
  if (!matchedRoute) {
    throw new Error(`Unsupported codex route path: ${pathname}`);
  }
  return matchedRoute[0];
}

function decodeRouteFocusId(
  rawFocusId: string | undefined
): string | undefined {
  return rawFocusId ? decodeURIComponent(rawFocusId) : undefined;
}

export function parseCodexRouteIntent(route: string): CodexRouteIntent {
  const hashStart = route.indexOf('#');
  const routeWithoutHash = hashStart >= 0 ? route.slice(0, hashStart) : route;
  const focusId = decodeRouteFocusId(
    hashStart >= 0 ? route.slice(hashStart + 1) : undefined
  );
  const queryStart = routeWithoutHash.indexOf('?');
  const pathname =
    (queryStart >= 0
      ? routeWithoutHash.slice(0, queryStart)
      : routeWithoutHash) || '/';
  const search = queryStart >= 0 ? routeWithoutHash.slice(queryStart + 1) : '';
  const params: Record<string, string> = {};
  new URLSearchParams(search).forEach((value, key) => {
    params[key] = value;
  });

  return {
    routeId: getRouteIdForPathname(pathname),
    pathname,
    params,
    ...(focusId ? { focusId } : {}),
  };
}

export function formatCodexRouteIntent(intent: CodexRouteIntent): string {
  const route = codexShellRoutes[intent.routeId];
  const focus = intent.focusId ? `#${encodeURIComponent(intent.focusId)}` : '';
  return `${route.path}${formatCodexRouteSearch(intent.params)}${focus}`;
}

export function getCodexWorkflowIntent(
  route: string | CodexRouteIntent
): CodexWorkflowIntent {
  const intent =
    typeof route === 'string' ? parseCodexRouteIntent(route) : route;
  switch (intent.routeId) {
    case 'overview':
      return { kind: 'overview' };
    case 'entries': {
      const sectionId = intent.params.sectionId ?? '';
      const query = intent.params.query ?? '';
      const requestedIntent = intent.params.intent;
      const entryId = intent.params.entryId;
      if (requestedIntent === 'new') {
        return { kind: 'entry-create', query, sectionId };
      }
      if (requestedIntent === 'context') {
        return {
          entryId: entryId ?? '',
          kind: 'entry-context',
          query,
          sectionId,
        };
      }
      if (entryId || requestedIntent === 'edit') {
        return {
          entryId: entryId ?? '',
          kind: 'entry-edit',
          query,
          sectionId,
        };
      }
      return {
        kind: 'entries-browse',
        query,
        sectionId,
      };
    }
    case 'timeline': {
      const query = intent.params.query ?? '';
      const requestedIntent = intent.params.intent;
      const entryId = intent.params.entryId;
      if (requestedIntent === 'new') {
        return {
          kind: 'entry-create',
          query,
          sectionId: 'timeline',
          timelineContext: {
            era: intent.params.era ?? '',
            involvedEntryId: intent.params.involvedEntryId ?? '',
          },
        };
      }
      if (entryId || requestedIntent === 'edit') {
        return {
          entryId: entryId ?? '',
          kind: 'entry-edit',
          query,
          sectionId: 'timeline',
        };
      }
      return { kind: 'timeline' };
    }
    case 'relationships':
      return {
        entryId: intent.params.entryId ?? '',
        entryQuery: intent.params.entryQuery ?? '',
        kind: 'relationships',
        relationshipQuery: intent.params.relationshipQuery ?? '',
      };
    case 'knowledge':
      return { kind: 'knowledge' };
    case 'utilities':
      return {
        focusId: getUtilitiesRouteFocusTargetId({
          focusId: intent.focusId,
        }),
        kind: 'utilities',
      };
    case 'workspaces':
      return { kind: 'workspaces' };
    case 'data':
      return {
        focusId: intent.focusId ?? '',
        kind: 'data',
        mode: isCodexExportMode(intent.params.mode) ? intent.params.mode : '',
      };
    case 'help':
      return {
        kind: 'help',
        topic: isCodexHelpFocusId(intent.params.topic)
          ? intent.params.topic
          : '',
      };
  }
}
