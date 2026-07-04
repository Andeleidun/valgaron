import type {
  CodexOverviewSummary,
  RelationshipGraphNode,
  RecoverySnapshotSummary,
  WorldDocument,
  WorldEntry,
  WorldEntryStatus,
  WorldSectionConfig,
  WorldWorkspace,
  WorkspaceActionState,
} from '@valgaron/core';
import {
  createEmptyDraft,
  createTemplateDraft,
  draftFromEntry,
  formatUpdatedAt,
  getCodexOverviewSummary,
  getEntryRelationships,
  getEntries,
  filterRelationships,
  getRelationshipEntries,
  getRelationshipHealthSummary,
  getRecoverySnapshotReasonPhrase,
  getSearchableEntries,
  getTimelineDiagnostics,
  getTimelineHighlights,
  getWorkspaceActionState,
  getWorkspaceOverviewEntryHighlights,
  sortEntries,
  sortTimelineEvents,
  searchEntries,
  type EntryDraft,
  type EntrySortKey,
} from '@valgaron/core';
import type {
  MobileDocumentLoadStatus,
  MobileRecoverySnapshot,
} from '../storage/mobileStorage';

export type MobileOverviewSummary = CodexOverviewSummary;

export type MobileEntryListItem = {
  id: string;
  name: string;
  sectionTitle: string;
  summary: string;
  status: WorldEntry['status'];
  tags: readonly string[];
  updatedAt: string;
};

export type MobileOverviewSearchResult = MobileEntryListItem & {
  sectionId: string;
};

export type MobileOverviewEntryHighlights = {
  pinned: MobileOverviewSearchResult[];
  recent: MobileOverviewSearchResult[];
};

export type MobileRelationshipListItem = {
  id: string;
  type: string;
  status: WorldEntryStatus;
  sourceEntryId: string;
  sourceSectionId: string;
  sourceSectionTitle: string;
  sourceName: string;
  targetEntryId: string;
  targetSectionId: string;
  targetSectionTitle: string;
  targetName: string;
  directionLabel: '->' | '<->';
  note: string;
};

export type MobileEntryRelationshipItem = {
  id: string;
  type: string;
  directionLabel: 'To' | 'From' | 'Linked with';
  relatedEntryId: string;
  relatedEntryName: string;
  relatedSectionId: string;
  note: string;
};

export type MobileRelationshipHealthSummary = {
  brokenRelationshipCount: number;
  orphanedEntryCount: number;
};

export type MobileEntryListFilters = {
  showArchived?: boolean;
  sortKey?: MobileEntrySortKey;
  status?: WorldEntryStatus | '';
  activeTag?: string;
};

export type MobileEntrySortKey = EntrySortKey | 'timeline-order';

export type MobileEntrySortOption = {
  key: MobileEntrySortKey;
  label: string;
  timelineOnly?: boolean;
};

export const mobileEntrySortOptions: readonly MobileEntrySortOption[] = [
  { key: 'updated-desc', label: 'Updated' },
  { key: 'created-desc', label: 'Created' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'timeline-order', label: 'Timeline', timelineOnly: true },
];

export type MobileRelationshipEntryPickerItem = RelationshipGraphNode;

export type MobileRelationshipListFilters = {
  entryId?: string;
  type?: string;
};

export type MobileWorkspaceActionState = WorkspaceActionState;

export type MobileTimelineSummary = {
  highlightNames: string[];
  unorderedCount: number;
  duplicateOrderCount: number;
  unlinkedCount: number;
};

export type MobileDataStorageStatus = {
  loadLine: string;
  saveLine: string;
  recoveryLine: string;
};

export function getMobileOverviewSummary(
  document: WorldDocument
): MobileOverviewSummary {
  return getCodexOverviewSummary(document);
}

function toMobileOverviewSearchResult(
  entry: ReturnType<typeof getSearchableEntries>[number]
): MobileOverviewSearchResult {
  return {
    id: entry.id,
    name: entry.name,
    sectionId: entry.sectionId,
    sectionTitle: entry.sectionTitle,
    summary: entry.summary,
    status: entry.status,
    tags: entry.tags,
    updatedAt: entry.updatedAt,
  };
}

export function getMobileOverviewSearchResults(
  world: WorldWorkspace,
  query: string,
  limit = 8
): MobileOverviewSearchResult[] {
  const visibleEntries = getSearchableEntries(
    world.codex,
    world.entryTypes
  ).filter((entry) => entry.status !== 'archived');
  return searchEntries(visibleEntries, world.entryTypes, query)
    .slice(0, limit)
    .map(toMobileOverviewSearchResult);
}

export function getMobileOverviewEntryHighlights(
  world: WorldWorkspace
): MobileOverviewEntryHighlights {
  const highlights = getWorkspaceOverviewEntryHighlights(world, 4);
  return {
    pinned: highlights.pinned.map(toMobileOverviewSearchResult),
    recent: highlights.recent.map(toMobileOverviewSearchResult),
  };
}

export function getMobileEntryList(
  world: WorldWorkspace,
  section: WorldSectionConfig,
  query: string,
  filters: MobileEntryListFilters = {}
): MobileEntryListItem[] {
  const {
    showArchived = false,
    sortKey = section.id === 'timeline' ? 'timeline-order' : 'updated-desc',
    status = '',
    activeTag = '',
  } = filters;
  const sectionEntries = getEntries(world.codex, section.id);
  const entries =
    query.trim().length > 0
      ? searchEntries(
          getSearchableEntries(world.codex, world.entryTypes),
          world.entryTypes,
          query
        ).filter((entry) => entry.sectionId === section.id)
      : sectionEntries.map((entry) => ({
          ...entry,
          sectionId: section.id,
          sectionTitle: section.title,
          sectionPath: `/${section.id}`,
        }));
  const orderedEntries =
    section.id === 'timeline' && sortKey === 'timeline-order'
      ? sortTimelineEvents(entries)
      : sortEntries(
          entries,
          sortKey === 'timeline-order' ? 'updated-desc' : sortKey
        );
  return orderedEntries
    .filter(
      (entry) =>
        showArchived || status === 'archived' || entry.status !== 'archived'
    )
    .filter((entry) => !status || entry.status === status)
    .filter((entry) => !activeTag || entry.tags.includes(activeTag))
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      sectionTitle: section.title,
      summary: entry.summary,
      status: entry.status,
      tags: entry.tags,
      updatedAt: entry.updatedAt,
    }));
}

export function getMobileRelationshipList(
  world: WorldWorkspace,
  query = '',
  filters: MobileRelationshipListFilters = {}
): MobileRelationshipListItem[] {
  const relationshipEntries = getRelationshipEntries(
    world.codex,
    world.entryTypes
  );
  const relationshipEntryById = new Map(
    relationshipEntries.map((entry) => [entry.id, entry])
  );
  const relationships = filterRelationships(world.relationships, {
    type: filters.type ?? '',
    entryId: filters.entryId ?? '',
    query,
    entryById: relationshipEntryById,
  });
  return relationships.map((relationship) => {
    const sourceEntryNode =
      relationshipEntryById.get(relationship.sourceEntryId) ?? null;
    const targetEntryNode =
      relationshipEntryById.get(relationship.targetEntryId) ?? null;
    return {
      id: relationship.id,
      type: relationship.type,
      status: relationship.status,
      sourceEntryId: relationship.sourceEntryId,
      sourceSectionId: sourceEntryNode?.sectionId ?? '',
      sourceSectionTitle: sourceEntryNode?.sectionTitle ?? '',
      sourceName: sourceEntryNode?.name ?? relationship.sourceEntryId,
      targetEntryId: relationship.targetEntryId,
      targetSectionId: targetEntryNode?.sectionId ?? '',
      targetSectionTitle: targetEntryNode?.sectionTitle ?? '',
      targetName: targetEntryNode?.name ?? relationship.targetEntryId,
      directionLabel: relationship.directional ? '->' : '<->',
      note: relationship.note,
    };
  });
}

export function getMobileEntryRelationshipSummary(
  world: WorldWorkspace,
  entryId: string
): MobileEntryRelationshipItem[] {
  const relationshipEntryById = new Map(
    getRelationshipEntries(world.codex, world.entryTypes).map((entry) => [
      entry.id,
      entry,
    ])
  );
  return getEntryRelationships(
    world.relationships,
    world.codex,
    world.entryTypes,
    entryId
  ).map((relationship) => {
    const isSource = relationship.sourceEntryId === entryId;
    const relatedEntry = isSource
      ? relationship.targetEntry
      : relationship.sourceEntry;
    const relatedEntryNode = relatedEntry
      ? relationshipEntryById.get(relatedEntry.id) ?? null
      : null;
    return {
      id: relationship.id,
      type: relationship.type,
      directionLabel: relationship.directional
        ? isSource
          ? 'To'
          : 'From'
        : 'Linked with',
      relatedEntryId: relatedEntry?.id ?? '',
      relatedEntryName: relatedEntry?.name ?? 'Missing entry',
      relatedSectionId: relatedEntryNode?.sectionId ?? '',
      note: relationship.note,
    };
  });
}

export function getMobileRelationshipEntryPickerItems(
  world: WorldWorkspace,
  query: string
): MobileRelationshipEntryPickerItem[] {
  const entries = getRelationshipEntries(world.codex, world.entryTypes);
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return entries;
  }
  return entries.filter((entry) =>
    [
      entry.name,
      entry.id,
      entry.sectionTitle,
      entry.status,
      ...entry.tags,
    ].some((value) => value.toLowerCase().includes(normalizedQuery))
  );
}

export function getMobileRelationshipHealthSummary(
  world: WorldWorkspace
): MobileRelationshipHealthSummary {
  return getRelationshipHealthSummary(
    world.relationships,
    world.codex,
    world.entryTypes
  );
}

export function getMobileWorkspaceActionState({
  activeWorkspaceId,
  activeWorkspaceCount,
  workspace,
  workspaceCount,
}: {
  activeWorkspaceId: string;
  activeWorkspaceCount: number;
  workspace: WorldWorkspace;
  workspaceCount: number;
}): MobileWorkspaceActionState {
  return getWorkspaceActionState({
    activeWorkspaceId,
    activeWorkspaceCount,
    workspace,
    workspaceCount,
  });
}

export function getMobileTimelineSummary(
  world: WorldWorkspace
): MobileTimelineSummary {
  const timelineEvents = getEntries(world.codex, 'timeline');
  const diagnostics = getTimelineDiagnostics(
    timelineEvents,
    world.relationships
  );
  return {
    highlightNames: getTimelineHighlights(timelineEvents).map(
      (event) => event.name
    ),
    unorderedCount: diagnostics.unorderedEvents.length,
    duplicateOrderCount: diagnostics.duplicateOrderGroups.length,
    unlinkedCount: diagnostics.unlinkedEvents.length,
  };
}

export function createMobileEntryDraft(
  section: WorldSectionConfig
): EntryDraft {
  return {
    ...createEmptyDraft(),
    tags: section.kind,
    details: Object.fromEntries(
      section.detailFields.map((field) => [field.key, ''])
    ),
  };
}

export function createMobileEntryTemplateDraft(
  entry: WorldEntry,
  section: WorldSectionConfig
): EntryDraft {
  return {
    ...draftFromEntry(entry, section),
    name: `${entry.name} Template`,
    status: 'draft',
  };
}

export function applyMobileEntrySectionTemplate(
  draft: EntryDraft,
  section: WorldSectionConfig
): EntryDraft {
  const template = createTemplateDraft(section);
  return {
    ...draft,
    summary: draft.summary || template.summary,
    notes: draft.notes || template.notes,
    tags: draft.tags || template.tags,
    details: { ...template.details, ...draft.details },
  };
}

export function getLocalDeviceStatusText(savedAt: string): string {
  return `Document timestamp on this device: ${formatUpdatedAt(savedAt)}`;
}

export function getMobileDataStorageStatus({
  lastRecoverySnapshot,
  loadStatus,
  saveMessage,
}: {
  lastRecoverySnapshot: MobileRecoverySnapshot | null;
  loadStatus: MobileDocumentLoadStatus;
  saveMessage: string;
}): MobileDataStorageStatus {
  return {
    loadLine: `Load state: ${loadStatus.source}, checked ${formatUpdatedAt(
      loadStatus.checkedAt
    )}.`,
    saveLine: `Device save: ${saveMessage}`,
    recoveryLine: lastRecoverySnapshot
      ? `Recovery snapshot: available ${getRecoverySnapshotReasonPhrase(
          lastRecoverySnapshot.reason
        )}, saved ${formatUpdatedAt(lastRecoverySnapshot.createdAt)}.`
      : 'Recovery snapshot: none saved on this device.',
  };
}

export function getMobileRecoverySnapshotText(
  summary: RecoverySnapshotSummary
): string {
  return `Latest recovery snapshot ${getRecoverySnapshotReasonPhrase(
    summary.reason
  )}: ${summary.activeWorldName}, ${summary.entryCount} entries, ${
    summary.relationshipCount
  } relationships, saved ${formatUpdatedAt(summary.createdAt)}.`;
}
