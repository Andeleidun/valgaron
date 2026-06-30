import type { WorldEntry, WorldEntryStatus, WorldRelationship } from '../types';

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

/** Read the optional numeric timeline order field from a timeline event. */
export function getTimelineOrderValue(event: WorldEntry): number {
  const orderValue = Number(event.fields.order);
  return Number.isFinite(orderValue) ? orderValue : Number.POSITIVE_INFINITY;
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
  return Array.from(
    new Set(
      relationships.flatMap((relationship) => {
        if (relationship.sourceEntryId === event.id) {
          return [relationship.targetEntryId];
        }
        if (relationship.targetEntryId === event.id) {
          return [relationship.sourceEntryId];
        }
        return [];
      })
    )
  );
}

/** Filter timeline events by timeline-specific fields and relationship links. */
export function filterTimelineEvents(
  events: readonly WorldEntry[],
  filters: TimelineFilters,
  relationships: readonly WorldRelationship[]
): WorldEntry[] {
  return events.filter((event) => {
    const matchesEra = !filters.era || event.fields.era === filters.era;
    const matchesTag = !filters.tag || event.tags.includes(filters.tag);
    const matchesStatus = !filters.status || event.status === filters.status;
    const matchesInvolvedEntry =
      !filters.involvedEntryId ||
      getTimelineInvolvedEntryIds(event, relationships).includes(
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
    groups.set(era, [...(groups.get(era) ?? []), event]);
  }
  return Array.from(groups, ([era, groupedEvents]) => ({
    era,
    events: groupedEvents,
  }));
}
