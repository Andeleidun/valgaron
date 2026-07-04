import type {
  CodexOverviewSummary,
  RelationshipGraphNode,
  WorldDocument,
  WorldEntry,
  WorldEntryStatus,
  WorldSectionConfig,
  WorldWorkspace,
} from '@valgaron/core';
import {
  createEmptyDraft,
  createTemplateDraft,
  draftFromEntry,
  entrySortControlOptions,
  getDraftDetailFields,
  getCodexOverviewSummary,
  getEntryRelationships,
  getEntries,
  filterRelationships,
  findEntryById,
  getBrokenRelationships,
  getRelationshipEntries,
  getRelationshipGraph,
  getRelationshipHealthSummary,
  getOrphanedEntries,
  getPlaceRelationshipGroups,
  getSearchableEntries,
  getTimelineEras,
  getTimelineDiagnostics,
  getTimelineHighlights,
  groupTimelineEventsByEra,
  filterTimelineEvents,
  getTimelineInvolvedEntryIds,
  getWorkspaceOverviewEntryHighlights,
  sortEntries,
  sortTimelineEvents,
  searchEntries,
  type EntryDraft,
  type EntrySortControlValue,
  type RelationshipGraphFilters,
  type RelationshipWithEntries,
  type TimelineFilters,
} from '@valgaron/core';

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

export type MobileEntryRelationshipGroup = {
  id: string;
  label: string;
  relationships: MobileEntryRelationshipItem[];
};

export type MobileRelationshipHealthSummary = {
  brokenRelationshipCount: number;
  orphanedEntryCount: number;
};

export type MobileRelationshipGraphEdge = {
  id: string;
  label: string;
  sourceName: string;
  sourceId: string;
  targetName: string;
  targetId: string;
  directionLabel: '->' | '<->';
};

export type MobileRelationshipGraphView = {
  nodes: RelationshipGraphNode[];
  edges: MobileRelationshipGraphEdge[];
};

export type MobileBrokenRelationshipItem = {
  id: string;
  type: string;
  sourceEntryId: string;
  sourceName: string;
  targetEntryId: string;
  targetName: string;
  missingSource: boolean;
  missingTarget: boolean;
};

export type MobileEntryListFilters = {
  showArchived?: boolean;
  sortKey?: MobileEntrySortKey;
  status?: WorldEntryStatus | '';
  activeTag?: string;
  updatedWithinDays?: number | null;
  now?: Date;
  timelineEra?: string;
  timelineInvolvedEntryId?: string;
};

export type MobileEntrySortKey = EntrySortControlValue;

export type MobileEntrySortOption = {
  key: MobileEntrySortKey;
  label: string;
  timelineOnly?: boolean;
};

export const mobileEntrySortOptions: readonly MobileEntrySortOption[] =
  entrySortControlOptions.map((option) => ({
    key: option.value,
    label: option.label,
    timelineOnly: option.value === 'timeline-order' ? true : undefined,
  }));

export type MobileRelationshipEntryPickerItem = RelationshipGraphNode;

export type MobileRelationshipListFilters = {
  entryId?: string;
  type?: string;
};

export type MobileRelationshipGraphFilters = RelationshipGraphFilters;

export type MobileTimelineSummary = {
  highlightNames: string[];
  unorderedCount: number;
  duplicateOrderCount: number;
  unlinkedCount: number;
};

export type MobileTimelineEventItem = {
  id: string;
  name: string;
  summary: string;
  status: WorldEntryStatus;
  tags: readonly string[];
  dateLabel: string;
  era: string;
  order: string;
  involvedEntryNames: readonly string[];
};

export type MobileTimelineEraGroup = {
  era: string;
  events: MobileTimelineEventItem[];
};

export type MobileTimelineBrowseView = {
  eras: readonly string[];
  involvedEntries: readonly RelationshipGraphNode[];
  groups: readonly MobileTimelineEraGroup[];
  unorderedNames: readonly string[];
  duplicateOrderLabels: readonly string[];
  unlinkedNames: readonly string[];
};

export type MobileTimelineBrowseFilters = TimelineFilters & {
  query?: string;
  showArchived?: boolean;
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
    updatedWithinDays = null,
    now,
    timelineEra = '',
    timelineInvolvedEntryId = '',
  } = filters;
  const updatedCutoff = updatedWithinDays
    ? (now ?? new Date()).getTime() - updatedWithinDays * 24 * 60 * 60 * 1000
    : null;
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
  const timelineFilteredEntries =
    section.id === 'timeline'
      ? filterTimelineEvents(
          entries,
          {
            era: timelineEra,
            involvedEntryId: timelineInvolvedEntryId,
            status,
            tag: activeTag,
          },
          world.relationships
        )
      : entries;
  const orderedEntries =
    section.id === 'timeline' && sortKey === 'timeline-order'
      ? sortTimelineEvents(timelineFilteredEntries)
      : sortEntries(
          timelineFilteredEntries,
          sortKey === 'timeline-order' ? 'updated-desc' : sortKey
        );
  return orderedEntries
    .filter(
      (entry) =>
        showArchived || status === 'archived' || entry.status !== 'archived'
    )
    .filter((entry) => !status || entry.status === status)
    .filter((entry) => !activeTag || entry.tags.includes(activeTag))
    .filter(
      (entry) =>
        updatedCutoff === null ||
        new Date(entry.updatedAt).getTime() >= updatedCutoff
    )
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

export function getMobileEntryRelationshipGroups(
  world: WorldWorkspace,
  entry: WorldEntry
): MobileEntryRelationshipGroup[] {
  const relationshipEntryById = new Map(
    getRelationshipEntries(world.codex, world.entryTypes).map((item) => [
      item.id,
      item,
    ])
  );
  const toMobileRelationshipItem = (
    relationship: RelationshipWithEntries
  ): MobileEntryRelationshipItem => {
    const isSource = relationship.sourceEntryId === entry.id;
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
  };
  if (entry.kind !== 'place') {
    const relationships = getMobileEntryRelationshipSummary(world, entry.id);
    return relationships.length > 0
      ? [{ id: 'linked-records', label: 'Linked records', relationships }]
      : [];
  }
  return getPlaceRelationshipGroups(
    entry,
    world.relationships,
    world.codex,
    world.entryTypes
  ).map((group) => ({
    id: group.id,
    label: group.label,
    relationships: group.relationships.map(toMobileRelationshipItem),
  }));
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

export function getMobileBrokenRelationshipList(
  world: WorldWorkspace
): MobileBrokenRelationshipItem[] {
  return getBrokenRelationships(
    world.relationships,
    world.codex,
    world.entryTypes
  ).map((relationship) => ({
    id: relationship.id,
    type: relationship.type,
    sourceEntryId: relationship.sourceEntryId,
    sourceName: relationship.sourceEntry?.name ?? relationship.sourceEntryId,
    targetEntryId: relationship.targetEntryId,
    targetName: relationship.targetEntry?.name ?? relationship.targetEntryId,
    missingSource: relationship.missingSource,
    missingTarget: relationship.missingTarget,
  }));
}

export function getMobileOrphanedRelationshipEntries(
  world: WorldWorkspace
): RelationshipGraphNode[] {
  return getOrphanedEntries(world.relationships, world.codex, world.entryTypes);
}

export function getMobileRelationshipGraphView(
  world: WorldWorkspace,
  filters: MobileRelationshipGraphFilters
): MobileRelationshipGraphView {
  const graph = getRelationshipGraph(
    world.relationships,
    world.codex,
    world.entryTypes,
    filters
  );
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  return {
    nodes: graph.nodes,
    edges: graph.edges.map((edge) => ({
      id: edge.id,
      label: edge.label,
      sourceId: edge.sourceId,
      sourceName: nodeById.get(edge.sourceId)?.name ?? edge.sourceId,
      targetId: edge.targetId,
      targetName: nodeById.get(edge.targetId)?.name ?? edge.targetId,
      directionLabel: edge.directional ? '->' : '<->',
    })),
  };
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

function toMobileTimelineEventItem(
  world: WorldWorkspace,
  event: WorldEntry
): MobileTimelineEventItem {
  const involvedEntryNames = getTimelineInvolvedEntryIds(
    event,
    world.relationships
  ).map((entryId) => {
    const entry = findEntryById(world.codex, world.entryTypes, entryId);
    return entry?.name ?? entryId;
  });
  return {
    id: event.id,
    name: event.name,
    summary: event.summary,
    status: event.status,
    tags: event.tags,
    dateLabel: event.fields.dateLabel ?? '',
    era: event.fields.era ?? '',
    order: event.fields.order ?? '',
    involvedEntryNames,
  };
}

export function getMobileTimelineBrowseView(
  world: WorldWorkspace,
  filters: MobileTimelineBrowseFilters
): MobileTimelineBrowseView {
  const timelineEvents = getEntries(world.codex, 'timeline');
  const normalizedQuery = filters.query?.trim() ?? '';
  const queriedEvents =
    normalizedQuery.length > 0
      ? searchEntries(
          getSearchableEntries(world.codex, world.entryTypes),
          world.entryTypes,
          normalizedQuery
        ).filter((entry) => entry.sectionId === 'timeline')
      : timelineEvents;
  const visibleEvents = queriedEvents.filter(
    (event) =>
      filters.showArchived ||
      filters.status === 'archived' ||
      event.status !== 'archived'
  );
  const optionBaseEvents = filterTimelineEvents(
    visibleEvents,
    {
      era: '',
      involvedEntryId: '',
      status: filters.status,
      tag: filters.tag,
    },
    world.relationships
  );
  const involvedOptionBaseEvents = filterTimelineEvents(
    visibleEvents,
    {
      era: filters.era,
      involvedEntryId: '',
      status: filters.status,
      tag: filters.tag,
    },
    world.relationships
  );
  const involvedEntryIds = new Set(
    involvedOptionBaseEvents.flatMap((event) =>
      getTimelineInvolvedEntryIds(event, world.relationships)
    )
  );
  const filteredEvents = filterTimelineEvents(
    visibleEvents,
    filters,
    world.relationships
  );
  const diagnostics = getTimelineDiagnostics(
    filteredEvents,
    world.relationships
  );

  return {
    eras: getTimelineEras(optionBaseEvents),
    involvedEntries: getRelationshipEntries(
      world.codex,
      world.entryTypes
    ).filter((entry) => involvedEntryIds.has(entry.id)),
    groups: groupTimelineEventsByEra(filteredEvents).map((group) => ({
      era: group.era,
      events: group.events.map((event) =>
        toMobileTimelineEventItem(world, event)
      ),
    })),
    unorderedNames: diagnostics.unorderedEvents.map((event) => event.name),
    duplicateOrderLabels: diagnostics.duplicateOrderGroups.map(
      (group) =>
        `${group.order}: ${group.events.map((event) => event.name).join(', ')}`
    ),
    unlinkedNames: diagnostics.unlinkedEvents.map((event) => event.name),
  };
}

export function createMobileEntryDraft(
  section: WorldSectionConfig
): EntryDraft {
  return {
    ...createEmptyDraft(),
    tags: section.kind,
    details: Object.fromEntries(
      getDraftDetailFields(section).map((field) => [field.key, ''])
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
