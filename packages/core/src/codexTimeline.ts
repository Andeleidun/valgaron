import type { WorldEntry, WorldEntryStatus, WorldRelationship } from './types';

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
