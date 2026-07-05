import type {
  WorldDocument,
  WorldSectionConfig,
  WorldSectionId,
  WorldWorkspace,
} from './types';
import { getEntries } from './codexEntries';
import {
  getSearchableEntries,
  getSearchResultContext,
  searchEntries,
  type SearchableEntry,
} from './codexSearch';
import { entryDisplayCopy, formatUpdatedAt } from './codexEntries';
import { getIncompleteEntries, type EntryCompleteness } from './codexTemplates';
import { getActiveWorld } from './worldDocument';
import { getWorkspaceCounts } from './workspaceManagement';
import { getCodexEntriesRoute } from './shell';

export type CodexOverviewSummary = {
  workspaceName: string;
  worldCount: number;
  activeWorkspaceCount: number;
  archivedWorkspaceCount: number;
  entryCount: number;
  visibleEntryCount: number;
  archivedEntryCount: number;
  relationshipCount: number;
  incompleteEntryCount: number;
  sectionCounts: Record<WorldSectionId, number>;
};

export type CodexOverviewEntryHighlights = {
  pinned: WorkspaceOverviewDisplayEntry[];
  recent: WorkspaceOverviewDisplayEntry[];
};

export type WorkspaceOverviewDisplayEntry = SearchableEntry & {
  contextText: string;
  summaryText: string;
  updatedText: string;
};

export type WorkspaceOverviewIncompleteEntry = EntryCompleteness & {
  contextText: string;
  promptText: string;
};

export const overviewFeatureCopy = {
  activeWorkspacesStatLabel: 'Active workspaces',
  clearSearchLabel: 'Clear Search',
  codexTotalsLabel: 'Codex totals',
  currentDraftStateTitle: 'Current Draft State',
  editLabel: 'Edit',
  entriesStatLabel: 'Entries',
  globalSearchKicker: 'Global search',
  globalSearchTitle: 'Find anything in this world',
  incompleteKicker: 'Needs attention',
  incompleteTitle: 'Incomplete records',
  localDataNoticeDetail:
    'Use the header Save button to write current progress to this browser profile. Export JSON backups regularly, especially before clearing browser data or changing devices.',
  localDataNoticeLabel: 'Local data notice',
  localDataNoticeTitle: 'Local browser data.',
  noRecentRecordsTitle: 'No recent records yet.',
  noRecentRecordsDetail:
    'Create a codex record to start filling this workspace.',
  noSearchResultsDetail: 'Try another name, tag, note, or world detail.',
  noSearchResultsTitle: 'No entries found.',
  noVisibleDraftingPrompts: 'No visible entries need drafting prompts.',
  openDataLabel: 'Open Data',
  openLabel: 'Open',
  pinnedKicker: 'Pinned',
  pinnedTitle: 'Important records',
  quickCreateKicker: 'Quick create',
  quickCreateTitle: 'Start a new record',
  recentKicker: 'Recently updated',
  recentTitle: 'Latest codex work',
  relationshipsStatLabel: 'Relationships',
  searchEntriesLabel: 'Search entries',
  searchHelpText: 'Search names, tags, notes, and detail fields.',
  searchPlaceholder: 'Search codex records',
  workspaceStatLabel: 'Workspace',
  workspaceKickerSuffix: 'Workspace',
} as const;

const incompleteEntryPromptPreviewCount = 2;

export function getWorkspaceOverviewWorkspaceKicker(
  summary: Pick<CodexOverviewSummary, 'workspaceName'>
): string {
  return `${summary.workspaceName} ${overviewFeatureCopy.workspaceKickerSuffix}`;
}

export function getWorkspaceOverviewDraftingPromptCountLabel(
  count: number
): string {
  return `${count} visible entries still have drafting prompts.`;
}

export function getWorkspaceOverviewOpenEntryAccessibilityLabel(
  entry: Pick<SearchableEntry, 'name'>
): string {
  return `${overviewFeatureCopy.openLabel} ${entry.name}`;
}

export function getWorkspaceOverviewEditEntryAccessibilityLabel(
  entry: Pick<SearchableEntry, 'name'>
): string {
  return `${overviewFeatureCopy.editLabel} ${entry.name}`;
}

export function getWorkspaceOverviewDisplayEntry(
  entry: SearchableEntry
): WorkspaceOverviewDisplayEntry {
  return {
    ...entry,
    contextText: getSearchResultContext(entry),
    summaryText: entry.summary || entryDisplayCopy.emptySummary,
    updatedText: `${entryDisplayCopy.updatedPrefix} ${formatUpdatedAt(
      entry.updatedAt
    )}`,
  };
}

export function getWorkspaceOverviewIncompleteEntry(
  item: EntryCompleteness
): WorkspaceOverviewIncompleteEntry {
  return {
    ...item,
    contextText: `${item.section.title} - ${item.percent}% complete`,
    promptText: item.prompts
      .slice(0, incompleteEntryPromptPreviewCount)
      .join(' '),
  };
}

export type WorkspaceOverviewModel = {
  summary: CodexOverviewSummary;
  sections: readonly WorldSectionConfig[];
  quickCreateActions: readonly WorkspaceOverviewQuickCreateAction[];
  searchResults: WorkspaceOverviewDisplayEntry[];
  entryHighlights: CodexOverviewEntryHighlights;
  incompleteEntries: WorkspaceOverviewIncompleteEntry[];
};

export type WorkspaceOverviewQuickCreateAction = {
  id: string;
  label: string;
  route: string;
  sectionId: WorldSectionId;
};

export type WorkspaceOverviewEntryRouteTarget = Pick<
  SearchableEntry,
  'id' | 'name' | 'sectionId'
>;

export type WorkspaceOverviewModelInput = {
  workspace: WorldWorkspace;
  document?: WorldDocument;
  query?: string;
  searchLimit?: number;
  highlightLimit?: number;
  incompleteLimit?: number;
};

export function getVisibleWorkspaceEntries(
  workspace: WorldWorkspace
): SearchableEntry[] {
  return getSearchableEntries(workspace.codex, workspace.entryTypes).filter(
    (entry) => entry.status !== 'archived'
  );
}

export function getWorkspaceOverviewEntryHighlights(
  workspace: WorldWorkspace,
  limit = 4
): CodexOverviewEntryHighlights {
  const visibleEntries = getVisibleWorkspaceEntries(workspace);
  return {
    pinned: visibleEntries
      .filter((entry) => entry.pinned)
      .slice(0, limit)
      .map(getWorkspaceOverviewDisplayEntry),
    recent: [...visibleEntries]
      .sort(
        (first, second) =>
          new Date(second.updatedAt).getTime() -
          new Date(first.updatedAt).getTime()
      )
      .slice(0, limit)
      .map(getWorkspaceOverviewDisplayEntry),
  };
}

export function getWorkspaceOverviewSearchResults(
  workspace: WorldWorkspace,
  query: string,
  limit = 8
): WorkspaceOverviewDisplayEntry[] {
  return searchEntries(
    getVisibleWorkspaceEntries(workspace),
    workspace.entryTypes,
    query
  )
    .slice(0, limit)
    .map(getWorkspaceOverviewDisplayEntry);
}

export function getWorkspaceOverviewIncompleteEntries(
  workspace: WorldWorkspace,
  limit = 6
): WorkspaceOverviewIncompleteEntry[] {
  return getIncompleteEntries(
    getVisibleWorkspaceEntries(workspace),
    workspace.entryTypes,
    workspace.relationships
  )
    .slice(0, limit)
    .map(getWorkspaceOverviewIncompleteEntry);
}

export function getWorkspaceOverviewQuickCreateActions(
  sections: readonly WorldSectionConfig[]
): WorkspaceOverviewQuickCreateAction[] {
  return sections.map((section) => ({
    id: `quick-create-${section.id}`,
    label: `New ${section.singularTitle}`,
    route: getCodexEntriesRoute({ sectionId: section.id, intent: 'new' }),
    sectionId: section.id,
  }));
}

export function getWorkspaceOverviewSectionRoute(
  section: Pick<WorldSectionConfig, 'id'>
): string {
  return getCodexEntriesRoute({ sectionId: section.id });
}

export function getWorkspaceOverviewEntryRoute(
  entry: WorkspaceOverviewEntryRouteTarget
): string {
  return getCodexEntriesRoute({
    entryId: entry.id,
    intent: 'edit',
    query: entry.name,
    sectionId: entry.sectionId,
  });
}

export function getCodexOverviewSummary(
  document: WorldDocument
): CodexOverviewSummary {
  return getWorkspaceOverviewSummary(getActiveWorld(document), document);
}

export function getWorkspaceOverviewSummary(
  workspace: WorldWorkspace,
  document?: WorldDocument
): CodexOverviewSummary {
  const entries = getSearchableEntries(workspace.codex, workspace.entryTypes);
  const visibleEntries = getVisibleWorkspaceEntries(workspace);
  const workspaceCounts = document
    ? getWorkspaceCounts(document)
    : {
        total: 1,
        active: workspace.status === 'archived' ? 0 : 1,
        archived: workspace.status === 'archived' ? 1 : 0,
        activeWorkspaceName: workspace.name,
      };

  return {
    workspaceName: workspace.name,
    worldCount: workspaceCounts.total,
    activeWorkspaceCount: workspaceCounts.active,
    archivedWorkspaceCount: workspaceCounts.archived,
    entryCount: entries.length,
    visibleEntryCount: visibleEntries.length,
    archivedEntryCount: entries.length - visibleEntries.length,
    relationshipCount: workspace.relationships.length,
    incompleteEntryCount: getIncompleteEntries(
      visibleEntries,
      workspace.entryTypes,
      workspace.relationships
    ).length,
    sectionCounts: Object.fromEntries(
      workspace.entryTypes.map((section) => [
        section.id,
        getEntries(workspace.codex, section.id).length,
      ])
    ),
  };
}

export function getWorkspaceOverviewModel({
  workspace,
  document,
  query = '',
  searchLimit = 8,
  highlightLimit = 4,
  incompleteLimit = 6,
}: WorkspaceOverviewModelInput): WorkspaceOverviewModel {
  return {
    summary: getWorkspaceOverviewSummary(workspace, document),
    sections: workspace.entryTypes,
    quickCreateActions: getWorkspaceOverviewQuickCreateActions(
      workspace.entryTypes
    ),
    searchResults: getWorkspaceOverviewSearchResults(
      workspace,
      query,
      searchLimit
    ),
    entryHighlights: getWorkspaceOverviewEntryHighlights(
      workspace,
      highlightLimit
    ),
    incompleteEntries: getWorkspaceOverviewIncompleteEntries(
      workspace,
      incompleteLimit
    ),
  };
}
