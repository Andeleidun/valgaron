export type CodexShellRouteId =
  | 'overview'
  | 'entries'
  | 'timeline'
  | 'relationships'
  | 'knowledge'
  | 'utilities'
  | 'workspaces'
  | 'data'
  | 'help';

export type CodexShellRoute = {
  id: CodexShellRouteId;
  title: string;
  path: string;
  parentId?: CodexShellRouteId;
};

export type CodexScreenIntro = {
  kicker: string;
  title: string;
  detail: string;
};

export type CodexRouteParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export type CodexEntryRouteParams = {
  sectionId?: string;
  entryId?: string;
  intent?: 'new' | 'edit' | 'context';
  query?: string;
};

export type CodexRelationshipRouteParams = {
  entryId?: string;
  entryQuery?: string;
  relationshipQuery?: string;
};

export const valgaronProduct = {
  name: 'Valgaron',
  codexTitle: 'World Codex',
  fullTitle: 'Valgaron World Codex',
  version: '0.0.0',
} as const;

export const codexShellRoutes = {
  overview: { id: 'overview', title: 'Overview', path: '/' },
  entries: { id: 'entries', title: 'Workbench', path: '/entries' },
  timeline: { id: 'timeline', title: 'Timeline', path: '/timeline' },
  relationships: {
    id: 'relationships',
    title: 'Relationships',
    path: '/relationships',
  },
  knowledge: { id: 'knowledge', title: 'Knowledge', path: '/knowledge' },
  utilities: { id: 'utilities', title: 'Utilities', path: '/utilities' },
  workspaces: {
    id: 'workspaces',
    title: 'Workspaces',
    path: '/utilities/workspaces',
    parentId: 'utilities',
  },
  data: {
    id: 'data',
    title: 'Data',
    path: '/utilities/data',
    parentId: 'utilities',
  },
  help: {
    id: 'help',
    title: 'Help',
    path: '/utilities/help',
    parentId: 'utilities',
  },
} as const satisfies Record<CodexShellRouteId, CodexShellRoute>;

const valgaronPrivacyPolicyWebPath = `${codexShellRoutes.help.path}/privacy`;

export const valgaronPrivacyPolicy = {
  title: 'Valgaron World Codex Privacy Policy',
  webPath: valgaronPrivacyPolicyWebPath,
  webUrl: `https://andeleidun.github.io/valgaron${valgaronPrivacyPolicyWebPath}`,
  actionLabel: 'Read Privacy Policy',
} as const;

export function getRelativeChildRoutePath(
  parentPath: string,
  childPath: string
): string {
  const childPathPrefix = `${parentPath.replace(/\/$/, '')}/`;
  if (!childPath.startsWith(childPathPrefix)) {
    throw new Error(
      `Route path ${childPath} is not a child of parent path ${parentPath}.`
    );
  }
  return childPath.slice(childPathPrefix.length);
}

export function getCodexShellChildRoutePath(id: CodexShellRouteId): string {
  const route: CodexShellRoute = codexShellRoutes[id];
  if (!route.parentId) {
    throw new Error(`Codex shell route ${id} does not have a parent route.`);
  }
  return getRelativeChildRoutePath(
    codexShellRoutes[route.parentId].path,
    route.path
  );
}

export const codexScreenIntros = {
  overview: {
    kicker: 'Workspace overview',
    title: 'Draft the world where the story can breathe.',
    detail:
      'Capture the people, places, powers, lore, and turning points that make a setting coherent enough to write in.',
  },
  entries: {
    kicker: 'Codex records',
    title: codexShellRoutes.entries.title,
    detail:
      'Browse, search, create, edit, archive, and connect codex records from one working surface.',
  },
  timeline: {
    kicker: 'Chronology',
    title: codexShellRoutes.timeline.title,
    detail:
      'Review timeline events, eras, involved records, highlights, diagnostics, and order controls.',
  },
  relationships: {
    kicker: 'World logic',
    title: codexShellRoutes.relationships.title,
    detail:
      'Connect entries into alliances, memberships, causes, references, and other links that make the world easier to reason about.',
  },
  knowledge: {
    kicker: 'Schema and lore structure',
    title: codexShellRoutes.knowledge.title,
    detail:
      'Centralize lore organization, custom entry types, reusable fields, categories, and world taxonomy decisions.',
  },
  utilities: {
    kicker: 'Project tools',
    title: codexShellRoutes.utilities.title,
    detail:
      'Open world setup, backup and import tools, diagnostics, and help without crowding primary drafting workflows.',
  },
  workspaces: {
    kicker: 'Project and universe management',
    title: codexShellRoutes.workspaces.title,
    detail:
      'Manage project/universe workspaces and in-fiction worlds or planets; use Knowledge for custom entry types and schema setup.',
  },
  data: {
    kicker: 'Local data',
    title: codexShellRoutes.data.title,
    detail:
      'Export JSON backups, copy Markdown reference text, import validated backups, and reset local starter data.',
  },
  help: {
    kicker: codexShellRoutes.help.title,
    title: valgaronProduct.fullTitle,
    detail:
      'A local workspace for organizing fiction and tabletop worldbuilding records.',
  },
} as const satisfies Record<CodexShellRouteId, CodexScreenIntro>;

export const webPrimaryRouteOrder = [
  'entries',
  'timeline',
  'relationships',
  'knowledge',
  'utilities',
] as const satisfies readonly CodexShellRouteId[];

export const mobilePrimaryRouteOrder = [
  'entries',
  'timeline',
  'relationships',
  'utilities',
] as const satisfies readonly CodexShellRouteId[];

export const mobileWebPrimaryRouteOrder = [
  'entries',
  'timeline',
  'relationships',
  'utilities',
] as const satisfies readonly CodexShellRouteId[];

export const mobileShellRouteLabels = {
  overview: 'Home',
  entries: codexShellRoutes.entries.title,
  timeline: codexShellRoutes.timeline.title,
  relationships: 'Links',
  knowledge: codexShellRoutes.knowledge.title,
  utilities: 'More',
  workspaces: 'Worlds',
  data: codexShellRoutes.data.title,
  help: codexShellRoutes.help.title,
} as const satisfies Record<CodexShellRouteId, string>;

export const mobileWebShellRouteLabels = {
  overview: 'Home',
  entries: 'Workbench',
  timeline: codexShellRoutes.timeline.title,
  relationships: 'Links',
  knowledge: codexShellRoutes.knowledge.title,
  utilities: 'More',
  workspaces: 'Worlds',
  data: codexShellRoutes.data.title,
  help: codexShellRoutes.help.title,
} as const satisfies Record<CodexShellRouteId, string>;

export const localPersistenceCopy = {
  browserSaveTarget: 'localStorage',
  deviceSaveTarget: 'this device',
  browserSaved: 'Saved to localStorage.',
  deviceSaved: 'Saved on this device.',
  deviceSaving: 'Saving to this device...',
  deviceSaveFailed: 'Could not save to this device.',
  noAccountOrSync:
    'This prototype stores worlds locally and does not add account or remote sync workflows.',
} as const;

export function getCodexShellRoutes(
  ids: readonly CodexShellRouteId[]
): CodexShellRoute[] {
  return ids.map((id) => codexShellRoutes[id]);
}

export function getCodexShellRouteTitle(id: CodexShellRouteId): string {
  return codexShellRoutes[id].title;
}

export function getCodexMobileShellRouteLabel(id: CodexShellRouteId): string {
  return mobileShellRouteLabels[id];
}

export function getCodexMobileWebShellRouteLabel(
  id: CodexShellRouteId
): string {
  return mobileWebShellRouteLabels[id];
}

export function getCodexScreenIntro(id: CodexShellRouteId): CodexScreenIntro {
  return codexScreenIntros[id];
}

export function formatCodexRouteSearch(params: CodexRouteParams): string {
  const search = Object.entries(params)
    .flatMap(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        return [];
      }
      return [
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
      ];
    })
    .join('&');
  return search ? `?${search}` : '';
}

export function getCodexEntriesRoute(
  params: CodexEntryRouteParams = {}
): string {
  return `${codexShellRoutes.entries.path}${formatCodexRouteSearch({
    sectionId: params.sectionId,
    entryId: params.entryId,
    intent: params.intent,
    query: params.query,
  })}`;
}

export function getCodexRelationshipsRoute(
  params: CodexRelationshipRouteParams = {}
): string {
  return `${codexShellRoutes.relationships.path}${formatCodexRouteSearch({
    entryId: params.entryId,
    entryQuery: params.entryQuery,
    relationshipQuery: params.relationshipQuery,
  })}`;
}
