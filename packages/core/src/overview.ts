import type { WorldDocument, WorldSectionId, WorldWorkspace } from './types';
import { getEntries } from './codexEntries';
import { getSearchableEntries, type SearchableEntry } from './codexSearch';
import { getIncompleteEntries } from './codexTemplates';
import { getActiveWorld } from './worldDocument';
import { getWorkspaceCounts } from './workspaceManagement';

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
  pinned: SearchableEntry[];
  recent: SearchableEntry[];
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
    pinned: visibleEntries.filter((entry) => entry.pinned).slice(0, limit),
    recent: [...visibleEntries]
      .sort(
        (first, second) =>
          new Date(second.updatedAt).getTime() -
          new Date(first.updatedAt).getTime()
      )
      .slice(0, limit),
  };
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
      workspace.entryTypes
    ).length,
    sectionCounts: Object.fromEntries(
      workspace.entryTypes.map((section) => [
        section.id,
        getEntries(workspace.codex, section.id).length,
      ])
    ),
  };
}
