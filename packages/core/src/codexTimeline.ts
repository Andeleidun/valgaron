import { entryDisplayCopy, getEntries } from './codexEntries';
import {
  findEntryById,
  getRelationshipEntries,
  type RelationshipGraphNode,
} from './codexRelationships';
import { getSearchableEntries, searchEntries } from './codexSearch';
import type {
  WorldCodex,
  WorldEntry,
  WorldEntryStatus,
  WorldRelationship,
  WorldSectionConfig,
  WorldWorkspace,
} from './types';

export type TimelineFilters = {
  era: string;
  tag: string;
  status: WorldEntryStatus | '';
  involvedEntryId: string;
};

export type TimelineEraGroup = {
  era: string;
  events: WorldEntry[];
};

export type TimelineOrderDirection = 'earlier' | 'later';

export type TimelineDiagnostics = {
  unorderedEvents: WorldEntry[];
  duplicateOrderGroups: Array<{
    order: number;
    events: WorldEntry[];
  }>;
  unlinkedEvents: WorldEntry[];
};

export type TimelineSummaryModel = {
  highlightNames: string[];
  unorderedCount: number;
  duplicateOrderCount: number;
  unlinkedCount: number;
};

export type TimelineEventItem = {
  id: string;
  name: string;
  summary: string;
  summaryText: string;
  status: WorldEntryStatus;
  tags: readonly string[];
  dateLabel: string;
  dateText: string;
  era: string;
  order: string;
  orderText: string;
  contextText: string;
  involvedEntryNames: readonly string[];
};

export type TimelineEraBrowseGroup = {
  era: string;
  events: TimelineEventItem[];
};

export type TimelineBrowseFilters = TimelineFilters & {
  query?: string;
  showArchived?: boolean;
};

export type TimelineBrowseModel = {
  eras: readonly string[];
  involvedEntries: readonly RelationshipGraphNode[];
  groups: readonly TimelineEraBrowseGroup[];
  unorderedNames: readonly string[];
  duplicateOrderLabels: readonly string[];
  unlinkedNames: readonly string[];
};

type TimelineEventItemSource = {
  codex: WorldCodex;
  entryTypes: readonly WorldSectionConfig[];
  relationships: readonly WorldRelationship[];
};

export const timelineFeatureCopy = {
  anyEraLabel: 'Any Era',
  anyInvolvedLabel: 'Any Involved',
  clearTimelineFiltersLabel: 'Clear Timeline Filters',
  duplicateOrdersLabel: 'Duplicate orders',
  duplicateOrderGroupsLabel: 'Duplicate order groups',
  highlightsLabel: 'Highlights',
  needsOrderLabel: 'Needs order',
  noDateLabel: 'No date',
  noDateLabelSentence: 'No date label.',
  noInvolvedRecordsLabel: 'No involved records',
  noInvolvedSearchMatches: 'No involved records match this filter search.',
  noTimelineEventsFoundTitle: 'No timeline events found.',
  noTimelineEventsFoundDetail:
    'Clear filters or add a timeline event to build chronology.',
  noTimelineEventsMatchFilters: 'No timeline events match these filters.',
  noVisibleTimelineEvents: 'No visible timeline events.',
  searchInvolvedFiltersLabel: 'Search involved filters',
  timelineBrowserTitle: 'Timeline Browser',
  unlinkedEventsLabel: 'Unlinked events',
  unorderedEventsLabel: 'Unordered events',
  unorderedLabel: 'Unordered',
  noOrderLabel: 'No order',
} as const;

export function getTimelineEventDateLabel(
  event: Pick<TimelineEventItem, 'dateLabel'>
): string {
  return event.dateLabel || timelineFeatureCopy.noDateLabel;
}

export function getTimelineEventOrderLabel(
  event: Pick<TimelineEventItem, 'order'>
): string {
  return event.order || timelineFeatureCopy.noOrderLabel;
}

/** Read the optional numeric timeline order field from a timeline event. */
export function getTimelineOrderValue(event: WorldEntry): number {
  const rawOrder = event.fields.order?.trim() ?? '';
  if (!rawOrder) {
    return Number.POSITIVE_INFINITY;
  }
  const orderValue = Number(rawOrder);
  return Number.isFinite(orderValue) ? orderValue : Number.POSITIVE_INFINITY;
}

function timelineOrderLabel(order: number): string {
  return Number.isFinite(order) ? String(order) : '';
}

function withTimelineOrder(event: WorldEntry, order: number): WorldEntry {
  return {
    ...event,
    fields: {
      ...event.fields,
      order: timelineOrderLabel(order),
    },
    updatedAt: new Date().toISOString(),
  };
}

/** Sort timeline events by explicit order, then date label, then name. */
export function sortTimelineEvents(
  events: readonly WorldEntry[]
): WorldEntry[] {
  return [...events].sort((first, second) => {
    const orderDifference =
      getTimelineOrderValue(first) - getTimelineOrderValue(second);
    if (orderDifference !== 0) {
      return orderDifference;
    }
    const dateDifference = (first.fields.dateLabel ?? '').localeCompare(
      second.fields.dateLabel ?? ''
    );
    return dateDifference || first.name.localeCompare(second.name);
  });
}

export function getTimelineOrderUpdates(
  events: readonly WorldEntry[],
  eventId: string,
  direction: TimelineOrderDirection
): WorldEntry[] {
  const sortedEvents = sortTimelineEvents(events);
  const eventIndex = sortedEvents.findIndex((event) => event.id === eventId);
  if (eventIndex === -1) {
    return [];
  }
  const targetIndex = direction === 'earlier' ? eventIndex - 1 : eventIndex + 1;
  if (targetIndex < 0 || targetIndex >= sortedEvents.length) {
    return [];
  }
  const normalizedEvents = sortedEvents.map((event, index) =>
    withTimelineOrder(event, (index + 1) * 10)
  );
  const selectedEvent = normalizedEvents[eventIndex];
  const targetEvent = normalizedEvents[targetIndex];
  return [
    withTimelineOrder(selectedEvent, getTimelineOrderValue(targetEvent)),
    withTimelineOrder(targetEvent, getTimelineOrderValue(selectedEvent)),
  ];
}

/** Return sorted eras represented by a timeline event list. */
export function getTimelineEras(events: readonly WorldEntry[]): string[] {
  return Array.from(
    new Set(
      events
        .map((event) => event.fields.era?.trim())
        .filter((era): era is string => Boolean(era))
    )
  ).sort((first, second) => first.localeCompare(second));
}

/** Return every entry id connected to a timeline event by relationship. */
export function getTimelineInvolvedEntryIds(
  event: WorldEntry,
  relationships: readonly WorldRelationship[]
): string[] {
  return getTimelineInvolvedEntryIdsByEvent(relationships).get(event.id) ?? [];
}

/** Index relationship-linked entry ids by timeline event id. */
export function getTimelineInvolvedEntryIdsByEvent(
  relationships: readonly WorldRelationship[]
): Map<string, string[]> {
  const involvedEntryIdsByEvent = new Map<string, Set<string>>();
  for (const relationship of relationships) {
    const sourceLinks =
      involvedEntryIdsByEvent.get(relationship.sourceEntryId) ??
      new Set<string>();
    sourceLinks.add(relationship.targetEntryId);
    involvedEntryIdsByEvent.set(relationship.sourceEntryId, sourceLinks);

    const targetLinks =
      involvedEntryIdsByEvent.get(relationship.targetEntryId) ??
      new Set<string>();
    targetLinks.add(relationship.sourceEntryId);
    involvedEntryIdsByEvent.set(relationship.targetEntryId, targetLinks);
  }
  return new Map(
    Array.from(involvedEntryIdsByEvent, ([entryId, entryIds]) => [
      entryId,
      Array.from(entryIds),
    ])
  );
}

/** Filter timeline events by timeline-specific fields and relationship links. */
export function filterTimelineEvents(
  events: readonly WorldEntry[],
  filters: TimelineFilters,
  relationships: readonly WorldRelationship[]
): WorldEntry[] {
  const involvedEntryIdsByEvent =
    getTimelineInvolvedEntryIdsByEvent(relationships);
  return events.filter((event) => {
    const matchesEra = !filters.era || event.fields.era === filters.era;
    const matchesTag = !filters.tag || event.tags.includes(filters.tag);
    const matchesStatus = !filters.status || event.status === filters.status;
    const matchesInvolvedEntry =
      !filters.involvedEntryId ||
      (involvedEntryIdsByEvent.get(event.id) ?? []).includes(
        filters.involvedEntryId
      );
    return matchesEra && matchesTag && matchesStatus && matchesInvolvedEntry;
  });
}

/** Group timeline events by era after applying stable timeline sorting. */
export function groupTimelineEventsByEra(
  events: readonly WorldEntry[]
): TimelineEraGroup[] {
  const sortedEvents = sortTimelineEvents(events);
  const groups = new Map<string, WorldEntry[]>();
  for (const event of sortedEvents) {
    const era = event.fields.era?.trim() || 'Unassigned Era';
    const groupedEvents = groups.get(era);
    if (groupedEvents) {
      groupedEvents.push(event);
    } else {
      groups.set(era, [event]);
    }
  }
  return Array.from(groups, ([era, groupedEvents]) => ({
    era,
    events: groupedEvents,
  }));
}

export function getTimelineDiagnostics(
  events: readonly WorldEntry[],
  relationships: readonly WorldRelationship[]
): TimelineDiagnostics {
  const orderGroups = new Map<number, WorldEntry[]>();
  const unorderedEvents: WorldEntry[] = [];
  const involvedEntryIdsByEvent =
    getTimelineInvolvedEntryIdsByEvent(relationships);
  for (const event of events) {
    const order = getTimelineOrderValue(event);
    if (!Number.isFinite(order)) {
      unorderedEvents.push(event);
      continue;
    }
    orderGroups.set(order, [...(orderGroups.get(order) ?? []), event]);
  }
  return {
    unorderedEvents,
    duplicateOrderGroups: Array.from(orderGroups, ([order, groupedEvents]) => ({
      order,
      events: groupedEvents,
    })).filter((group) => group.events.length > 1),
    unlinkedEvents: events.filter(
      (event) => (involvedEntryIdsByEvent.get(event.id) ?? []).length === 0
    ),
  };
}

export function getTimelineHighlights(
  events: readonly WorldEntry[],
  limit = 3
): WorldEntry[] {
  return sortTimelineEvents(events)
    .filter((event) => event.status !== 'archived')
    .slice(0, limit);
}

export function getTimelineSummaryModel(
  world: WorldWorkspace
): TimelineSummaryModel {
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

export function getTimelineEventItem(
  world: TimelineEventItemSource,
  event: WorldEntry
): TimelineEventItem {
  const involvedEntryNames = getTimelineInvolvedEntryIds(
    event,
    world.relationships
  ).map((entryId) => {
    const entry = findEntryById(world.codex, world.entryTypes, entryId);
    return entry?.name ?? entryId;
  });
  const dateLabel = event.fields.dateLabel ?? '';
  const order = event.fields.order ?? '';
  const dateText = getTimelineEventDateLabel({ dateLabel });
  const orderText = getTimelineEventOrderLabel({ order });
  return {
    id: event.id,
    name: event.name,
    summary: event.summary,
    summaryText: event.summary || entryDisplayCopy.emptySummary,
    status: event.status,
    tags: event.tags,
    dateLabel,
    dateText,
    era: event.fields.era ?? '',
    order,
    orderText,
    contextText: `${orderText} - ${dateText}`,
    involvedEntryNames,
  };
}

export function getTimelineBrowseModel(
  world: WorldWorkspace,
  filters: TimelineBrowseFilters
): TimelineBrowseModel {
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
    {
      era: filters.era,
      involvedEntryId: filters.involvedEntryId,
      status: filters.status,
      tag: filters.tag,
    },
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
      events: group.events.map((event) => getTimelineEventItem(world, event)),
    })),
    unorderedNames: diagnostics.unorderedEvents.map((event) => event.name),
    duplicateOrderLabels: diagnostics.duplicateOrderGroups.map(
      (group) =>
        `${group.order}: ${group.events.map((event) => event.name).join(', ')}`
    ),
    unlinkedNames: diagnostics.unlinkedEvents.map((event) => event.name),
  };
}
