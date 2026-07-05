export type CodexShellRouteId =
  | 'overview'
  | 'entries'
  | 'relationships'
  | 'workspaces'
  | 'data'
  | 'help';

export type CodexShellRoute = {
  id: CodexShellRouteId;
  title: string;
  path: string;
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
  intent?: 'new' | 'edit';
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
  entries: { id: 'entries', title: 'Entries', path: '/entries' },
  relationships: {
    id: 'relationships',
    title: 'Relationships',
    path: '/relationships',
  },
  workspaces: { id: 'workspaces', title: 'Workspaces', path: '/workspaces' },
  data: { id: 'data', title: 'Data', path: '/data' },
  help: { id: 'help', title: 'Help', path: '/help' },
} as const satisfies Record<CodexShellRouteId, CodexShellRoute>;

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
    detail: 'Browse, search, create, edit, archive, and delete codex records.',
  },
  relationships: {
    kicker: 'World logic',
    title: codexShellRoutes.relationships.title,
    detail:
      'Connect entries into alliances, memberships, causes, references, and other links that make the world easier to reason about.',
  },
  workspaces: {
    kicker: 'Project and universe management',
    title: codexShellRoutes.workspaces.title,
    detail:
      'Manage project/universe workspaces and custom entry types; use Places for worlds, planets, and map-scale places inside the active workspace.',
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
  'overview',
  'relationships',
  'data',
  'workspaces',
  'help',
] as const satisfies readonly CodexShellRouteId[];

export const mobilePrimaryRouteOrder = [
  'overview',
  'entries',
  'relationships',
  'workspaces',
  'data',
  'help',
] as const satisfies readonly CodexShellRouteId[];

export const mobileShellRouteLabels = {
  overview: 'Home',
  entries: codexShellRoutes.entries.title,
  relationships: 'Links',
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
