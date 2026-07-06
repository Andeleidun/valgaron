import {
  entryDisplayCopy,
  getEntries,
  getEntryEditorDetailFieldModels,
  getEntryEditorNewTitle,
  getEntryEditorSubmitLabel,
  type EntryDraft,
  type EntryEditorDetailFieldModel,
} from './codexEntries';
import { getDraftDetailFields } from './placeTaxonomy';
import {
  createEmptyRelationshipDraft,
  findEntryById,
  getRelationshipEntries,
  type RelationshipGraphNode,
} from './codexRelationships';
import { getSearchableEntries, searchEntries } from './codexSearch';
import {
  createStagedRelationshipDraft,
  draftTransactionEntryId,
  normalizeStagedRelationshipDrafts,
  type StagedRelationshipDraft,
} from './entryDraftTransactions';
import {
  filterRelationshipTargetOptions,
  getRelationshipFieldConfigsForEntryKind,
  getRelationshipFieldLinks,
  getRelationshipFieldTargetId,
  getRelationshipFieldTextMigration,
  getRelationshipTargetOptionDisplay,
  getRelationshipTargetOptions,
  relationshipTextReviewCopy,
  type RelationshipFieldConfig,
  type RelationshipTargetOption,
  type RelationshipTargetOptionDisplay,
} from './relationshipFields';
import {
  getReviewTraySummaryModel,
  type ReviewTraySummaryModel,
} from './reviewTray';
import type {
  WorldCodex,
  WorldEntry,
  WorldEntryStatus,
  WorldRelationship,
  WorldSectionConfig,
  WorldWorkspaceSchema,
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

export type TimelineReviewItemId =
  | 'unordered-events'
  | 'duplicate-orders'
  | 'unlinked-events';

export type TimelineReviewTarget = {
  label: string;
  eventIds: readonly string[];
};

export type TimelineReviewItem = {
  id: TimelineReviewItemId;
  title: string;
  count: number;
  summary: string;
  itemLabels: readonly string[];
  targets: readonly TimelineReviewTarget[];
};

export type TimelineReviewModel = {
  title: string;
  totalIssueCount: number;
  hasIssues: boolean;
  items: readonly TimelineReviewItem[];
  reviewSummary: ReviewTraySummaryModel;
};

export type TimelineEraManagerItem = {
  era: string;
  eventCount: number;
};

export type TimelineEraManagerModel = {
  eras: readonly TimelineEraManagerItem[];
  unassignedCount: number;
  totalEraCount: number;
  namedEraCountLabel: string;
};

export type TimelineEraReassignmentDraft = {
  sourceEra: string;
  targetEra: string;
  updatedAt?: string;
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
  involvedEntriesAccessibilityLabel: string;
  moveEarlierAccessibilityLabel: string;
  moveEarlierLabel: string;
  moveLaterAccessibilityLabel: string;
  moveLaterLabel: string;
  openAccessibilityLabel: string;
  openLabel: string;
  reviewContextAccessibilityLabel: string;
  reviewContextLabel: string;
};

export type TimelineEraBrowseGroup = {
  era: string;
  events: TimelineEventItem[];
};

export type TimelineSurfaceModel = {
  eventCount: number;
  review: TimelineReviewModel;
  eraManager: TimelineEraManagerModel;
  highlights: readonly TimelineEventItem[];
  sortedEvents: readonly TimelineEventItem[];
  groups: readonly TimelineEraBrowseGroup[];
};

export type TimelineBrowseFilters = TimelineFilters & {
  query?: string;
  showArchived?: boolean;
};

export type TimelineBrowseModel = {
  eras: readonly string[];
  involvedEntries: readonly RelationshipGraphNode[];
  groups: readonly TimelineEraBrowseGroup[];
  review: TimelineReviewModel;
  unorderedNames: readonly string[];
  duplicateOrderLabels: readonly string[];
  unlinkedNames: readonly string[];
};

export type TimelineEditorFieldGroup = {
  id: string;
  label: string;
  fields: readonly EntryEditorDetailFieldModel[];
};

export type TimelineEditorInvolvedRecord = {
  id: string;
  name: string;
  sectionTitle: string;
  selected: boolean;
};

export type TimelineEditorLegacyInvolvedText = {
  title: string;
  label: string;
  value: string;
  exactMatchCount: number;
  remainingText: string;
  canMigrate: boolean;
};

export type TimelineEditorInvolvedRecordsModel = {
  title: string;
  description: string;
  savedEntryMessage: string;
  saveBeforeEditMessage: string;
  searchLabel: string;
  searchPlaceholder: string;
  optionListLabel: string;
  emptySearchLabel: string;
  selectedRecordsLabel: string;
  selectedRecordsSummaryLabel: string | null;
  options: readonly TimelineEditorInvolvedRecord[];
  selectedRecords: readonly TimelineEditorInvolvedRecord[];
  display: RelationshipTargetOptionDisplay;
  legacyText: TimelineEditorLegacyInvolvedText | null;
  duplicateStagedTargetIds: readonly string[];
  duplicateStagedTargetLabel: string | null;
};

export type TimelineEventEditorModel = {
  title: string;
  submitLabel: string;
  chronology: TimelineEditorFieldGroup;
  outcomes: TimelineEditorFieldGroup;
  extraDetails: TimelineEditorFieldGroup | null;
  involvedRecords: TimelineEditorInvolvedRecordsModel;
};

export type TimelineEventEditorModelOptions = {
  draft: EntryDraft;
  expandedInvolvedRecords?: boolean;
  involvedRecordLimit?: number;
  involvedRecordQuery?: string;
  section: WorldSectionConfig;
  selectedEntry?: WorldEntry | null;
  suggestionLimit?: number;
  stagedRelationships?: readonly StagedRelationshipDraft[];
  world: {
    codex: WorldCodex;
    entryTypes: readonly WorldSectionConfig[];
    relationships: readonly WorldRelationship[];
    schema?: WorldWorkspaceSchema;
  };
};

export type TimelineEventItemSource = {
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
  duplicateStagedInvolvedRecordLabel:
    'Duplicate involved links were removed from the save list. Only one link per involved record will be saved.',
  eraFilterLabel: 'Era',
  eraManagerTitle: 'Era Manager',
  eraReassignmentActionLabel: 'Apply Era Change',
  eraReassignmentSourceLabel: 'Era to change',
  eraReassignmentTargetLabel: 'New or existing era',
  eraReassignmentTargetPlaceholder: 'Era name',
  highlightsLabel: 'Highlights',
  timelineErasLabel: 'Timeline eras',
  timelineHighlightsLabel: 'Timeline highlights',
  timelineOverviewTitle: 'Timeline view',
  timelineTableLabel: 'Timeline table',
  timelineTableColumnLabels: {
    order: 'Order',
    event: 'Event',
    date: 'Date',
    era: 'Era',
    links: 'Links',
    actions: 'Actions',
  },
  needsOrderLabel: 'Needs order',
  noDateLabel: 'No date',
  noDateLabelSentence: 'No date label.',
  noInvolvedRecordsLabel: 'No involved records',
  noInvolvedSearchMatches: 'No involved records match this filter search.',
  noReviewIssuesLabel: 'No timeline review issues found.',
  noTimelineEventsFoundTitle: 'No timeline events found.',
  noTimelineEventsFoundDetail:
    'Clear filters or add a timeline event to build chronology.',
  noTimelineEventsMatchFilters: 'No timeline events match these filters.',
  noVisibleTimelineEvents: 'No visible timeline events.',
  involvedFilterLabel: 'Involved entry',
  searchInvolvedFiltersLabel: 'Search involved filters',
  searchInvolvedFiltersPlaceholder: 'Record name, section, tag, status, or id',
  timelineBrowserTitle: 'Timeline Browser',
  timelineReviewTitle: 'Timeline Review',
  unlinkedEventsLabel: 'Unlinked events',
  unassignedEraLabel: 'Unassigned Era',
  unorderedEventsLabel: 'Unordered events',
  unorderedLabel: 'Unordered',
  noOrderLabel: 'No order',
} as const;

export function formatTimelineVisibleEventCount(count: number): string {
  return `${count} visible event${count === 1 ? '' : 's'}`;
}

export function formatTimelineReviewIssueCount(count: number): string {
  return `${count} review issue${count === 1 ? '' : 's'}`;
}

export const timelineUnassignedEraFilterValue = '__timeline_unassigned_era__';

const timelineChronologyFieldKeys = ['order', 'dateLabel', 'era'] as const;
const timelineOutcomeFieldKeys = ['consequences'] as const;
const timelineLegacyInvolvedFieldKey = 'involvedRecords';

function getTimelineRelationshipConfig(
  section: WorldSectionConfig
): RelationshipFieldConfig {
  const config = getRelationshipFieldConfigsForEntryKind(section.kind).find(
    (candidate) => candidate.fieldKey === timelineLegacyInvolvedFieldKey
  );
  if (!config) {
    throw new Error('Timeline involved record relationship config is missing.');
  }
  return config;
}

function getTimelineEditorFieldGroup({
  fieldKeys,
  fields,
  id,
  label,
}: {
  fieldKeys: readonly string[];
  fields: readonly EntryEditorDetailFieldModel[];
  id: string;
  label: string;
}): TimelineEditorFieldGroup {
  const fieldKeySet = new Set(fieldKeys);
  return {
    id,
    label,
    fields: fields.filter((field) => fieldKeySet.has(field.key)),
  };
}

function getTimelineStagedTargetId(
  relationship: StagedRelationshipDraft
): string {
  return relationship.sourceEntryId === draftTransactionEntryId
    ? relationship.targetEntryId
    : relationship.sourceEntryId;
}

function getTimelineEditorCurrentEntry({
  draft,
  section,
  selectedEntry,
}: {
  draft: EntryDraft;
  section: WorldSectionConfig;
  selectedEntry?: WorldEntry | null;
}): WorldEntry {
  if (selectedEntry) {
    return selectedEntry;
  }
  return {
    id: draftTransactionEntryId,
    kind: section.kind,
    name: draft.name,
    summary: draft.summary,
    notes: draft.notes,
    tags: draft.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    status: draft.status,
    pinned: draft.pinned,
    createdAt: '',
    updatedAt: '',
    fields: draft.details,
  };
}

function formatTimelineInvolvedRecord(
  option: RelationshipTargetOption,
  selectedTargetIds: ReadonlySet<string>
): TimelineEditorInvolvedRecord {
  return {
    id: option.entry.id,
    name: option.entry.name,
    sectionTitle: option.section.title,
    selected: selectedTargetIds.has(option.entry.id),
  };
}

export function createTimelineInvolvedRecordStagedRelationship(
  targetEntryId: string,
  stagedId?: string
): StagedRelationshipDraft | null {
  const normalizedTargetEntryId = targetEntryId.trim();
  if (!normalizedTargetEntryId) {
    return null;
  }
  return createStagedRelationshipDraft(
    {
      ...createEmptyRelationshipDraft(),
      sourceEntryId: draftTransactionEntryId,
      targetEntryId: normalizedTargetEntryId,
      type: 'involves',
      directional: false,
      note: '',
      status: 'draft',
    },
    stagedId
  );
}

export function getTimelineEventEditorModel({
  draft,
  expandedInvolvedRecords = false,
  involvedRecordLimit = 60,
  involvedRecordQuery = '',
  section,
  selectedEntry,
  suggestionLimit = Number.POSITIVE_INFINITY,
  stagedRelationships = [],
  world,
}: TimelineEventEditorModelOptions): TimelineEventEditorModel {
  const sectionEntries = getEntries(world.codex, section.id);
  const fieldModels = getEntryEditorDetailFieldModels({
    draft,
    fields: getDraftDetailFields(section, draft, world.schema),
    sectionEntries,
    sectionId: section.id,
    suggestionLimit,
    workspaceSchema: world.schema,
  });
  const chronology = getTimelineEditorFieldGroup({
    fieldKeys: timelineChronologyFieldKeys,
    fields: fieldModels,
    id: 'timelineEditorChronology',
    label: 'Chronology',
  });
  const outcomes = getTimelineEditorFieldGroup({
    fieldKeys: timelineOutcomeFieldKeys,
    fields: fieldModels,
    id: 'timelineEditorOutcomes',
    label: 'Outcomes',
  });
  const ownedFieldKeys = new Set([
    ...timelineChronologyFieldKeys,
    ...timelineOutcomeFieldKeys,
    timelineLegacyInvolvedFieldKey,
  ]);
  const extraFields = fieldModels.filter(
    (field) => !ownedFieldKeys.has(field.key)
  );
  const config = getTimelineRelationshipConfig(section);
  const currentEntry = getTimelineEditorCurrentEntry({
    draft,
    section,
    selectedEntry,
  });
  const selectedTargetIds = new Set<string>(
    selectedEntry
      ? [
          ...getRelationshipFieldLinks(
            world.relationships,
            selectedEntry,
            config
          )
            .map((relationship) =>
              getRelationshipFieldTargetId(relationship, config)
            )
            .filter(Boolean),
          ...getTimelineInvolvedEntryIds(selectedEntry, world.relationships),
        ]
      : []
  );
  const stagedTargetIds = stagedRelationships
    .filter((relationship) => relationship.type === config.relationshipType)
    .map(getTimelineStagedTargetId)
    .filter(Boolean);
  stagedTargetIds.forEach((targetId) => selectedTargetIds.add(targetId));
  const duplicateStagedTargetIds = stagedTargetIds.filter(
    (targetId, index) => stagedTargetIds.indexOf(targetId) !== index
  );
  const duplicateStagedTargetLabel =
    duplicateStagedTargetIds.length > 0
      ? timelineFeatureCopy.duplicateStagedInvolvedRecordLabel
      : null;
  const targetOptions = getRelationshipTargetOptions({
    codex: world.codex,
    config,
    currentEntry,
    includedTargetIds: selectedTargetIds,
    sections: world.entryTypes,
  });
  const filteredOptions = filterRelationshipTargetOptions(
    targetOptions,
    involvedRecordQuery,
    selectedTargetIds
  );
  const display = getRelationshipTargetOptionDisplay({
    expandedPreferredTargets: expandedInvolvedRecords,
    expandedUnusualTargets: expandedInvolvedRecords,
    limit: involvedRecordLimit,
    options: filteredOptions,
    selectedTargetIds,
    targetCategoryBehavior: config.targetCategoryBehavior,
  });
  const visibleRecords = display.visibleOptions.map((option) =>
    formatTimelineInvolvedRecord(option, selectedTargetIds)
  );
  const selectedRecords = targetOptions
    .filter((option) => selectedTargetIds.has(option.entry.id))
    .map((option) => formatTimelineInvolvedRecord(option, selectedTargetIds));
  const legacyValue =
    draft.details[timelineLegacyInvolvedFieldKey]?.trim() ?? '';
  const legacyMigration =
    selectedEntry && legacyValue
      ? getRelationshipFieldTextMigration({
          codex: world.codex,
          config,
          currentEntry: selectedEntry,
          sections: world.entryTypes,
          value: legacyValue,
        })
      : null;

  return {
    title: selectedEntry
      ? `Edit ${selectedEntry.name}`
      : getEntryEditorNewTitle(section),
    submitLabel: getEntryEditorSubmitLabel({
      section,
      selectedEntry,
      stagedRelationshipCount:
        normalizeStagedRelationshipDrafts(stagedRelationships).length,
    }),
    chronology,
    outcomes,
    extraDetails:
      extraFields.length > 0
        ? {
            id: 'timelineEditorDetails',
            label: 'Additional details',
            fields: extraFields,
          }
        : null,
    involvedRecords: {
      title: 'Involved records',
      description:
        'Link the characters, places, factions, and lore notes involved in this event.',
      savedEntryMessage:
        'Use the relationship-backed controls below to update involved records.',
      saveBeforeEditMessage:
        'Save this timeline event before editing involved records.',
      searchLabel: 'Search involved records',
      searchPlaceholder: 'Character, place, faction, or lore note',
      optionListLabel: 'Choose involved records',
      emptySearchLabel: 'No involved records match this search.',
      selectedRecordsLabel: 'Selected involved records',
      selectedRecordsSummaryLabel:
        selectedRecords.length > 0
          ? `Selected: ${selectedRecords
              .map((record) => record.name)
              .join(', ')}`
          : null,
      options: visibleRecords,
      selectedRecords,
      display,
      legacyText: legacyValue
        ? {
            title: relationshipTextReviewCopy.savedTextLinkNotesTitle,
            label: config.label,
            value: legacyValue,
            exactMatchCount: legacyMigration?.targetIds.length ?? 0,
            remainingText: legacyMigration?.remainingText ?? legacyValue,
            canMigrate: Boolean(legacyMigration?.targetIds.length),
          }
        : null,
      duplicateStagedTargetIds,
      duplicateStagedTargetLabel,
    },
  };
}

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
    const eventEra = event.fields.era?.trim() ?? '';
    const matchesEra =
      !filters.era ||
      (filters.era === timelineUnassignedEraFilterValue
        ? !eventEra
        : eventEra === filters.era);
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
    const era =
      event.fields.era?.trim() || timelineFeatureCopy.unassignedEraLabel;
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

export function getTimelineEraManagerModel(
  events: readonly WorldEntry[]
): TimelineEraManagerModel {
  const eraCounts = new Map<string, number>();
  let unassignedCount = 0;
  for (const event of events) {
    const era = event.fields.era?.trim() ?? '';
    if (!era) {
      unassignedCount += 1;
      continue;
    }
    eraCounts.set(era, (eraCounts.get(era) ?? 0) + 1);
  }
  const eras = Array.from(eraCounts, ([era, eventCount]) => ({
    era,
    eventCount,
  })).sort((first, second) => first.era.localeCompare(second.era));

  return {
    eras,
    unassignedCount,
    totalEraCount: eras.length,
    namedEraCountLabel: `${eras.length} named era${
      eras.length === 1 ? '' : 's'
    }`,
  };
}

export function getTimelineEraReassignmentUpdates(
  events: readonly WorldEntry[],
  draft: TimelineEraReassignmentDraft
): WorldEntry[] {
  const sourceEra = draft.sourceEra.trim();
  const targetEra = draft.targetEra.trim();
  if (!targetEra || sourceEra === targetEra) {
    return [];
  }
  const timestamp = draft.updatedAt ?? new Date().toISOString();
  return events
    .filter((event) => (event.fields.era?.trim() ?? '') === sourceEra)
    .map((event) => ({
      ...event,
      fields: {
        ...event.fields,
        era: targetEra,
      },
      updatedAt: timestamp,
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

function formatDuplicateOrderLabel(group: {
  order: number;
  events: readonly WorldEntry[];
}): string {
  return `${group.order}: ${group.events
    .map((event) => event.name)
    .join(', ')}`;
}

function makeEventReviewTargets(
  events: readonly WorldEntry[]
): TimelineReviewTarget[] {
  return events.map((event) => ({
    label: event.name,
    eventIds: [event.id],
  }));
}

export function getTimelineReviewModel(
  events: readonly WorldEntry[],
  relationships: readonly WorldRelationship[]
): TimelineReviewModel {
  const diagnostics = getTimelineDiagnostics(events, relationships);
  const duplicateOrderTargets = diagnostics.duplicateOrderGroups.map(
    (group) => ({
      label: formatDuplicateOrderLabel(group),
      eventIds: group.events.map((event) => event.id),
    })
  );
  const items: TimelineReviewItem[] = [
    {
      id: 'unordered-events',
      title: timelineFeatureCopy.unorderedEventsLabel,
      count: diagnostics.unorderedEvents.length,
      summary: 'Events without a numeric sort order.',
      itemLabels: diagnostics.unorderedEvents.map((event) => event.name),
      targets: makeEventReviewTargets(diagnostics.unorderedEvents),
    },
    {
      id: 'duplicate-orders',
      title: timelineFeatureCopy.duplicateOrdersLabel,
      count: diagnostics.duplicateOrderGroups.length,
      summary: 'Order values shared by more than one event.',
      itemLabels: duplicateOrderTargets.map((target) => target.label),
      targets: duplicateOrderTargets,
    },
    {
      id: 'unlinked-events',
      title: timelineFeatureCopy.unlinkedEventsLabel,
      count: diagnostics.unlinkedEvents.length,
      summary: 'Events with no involved records.',
      itemLabels: diagnostics.unlinkedEvents.map((event) => event.name),
      targets: makeEventReviewTargets(diagnostics.unlinkedEvents),
    },
  ];

  const totalIssueCount = items.reduce((total, item) => total + item.count, 0);
  const reviewSummary = getReviewTraySummaryModel(
    items.map((item) => ({
      id: item.id,
      title: item.title,
      count: item.count,
      detail: item.summary,
    }))
  );
  return {
    title: timelineFeatureCopy.timelineReviewTitle,
    totalIssueCount,
    hasIssues: totalIssueCount > 0,
    items,
    reviewSummary,
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
    involvedEntriesAccessibilityLabel: `${event.name} involved entries`,
    moveEarlierAccessibilityLabel: `Move ${event.name} earlier`,
    moveEarlierLabel: 'Earlier',
    moveLaterAccessibilityLabel: `Move ${event.name} later`,
    moveLaterLabel: 'Later',
    openAccessibilityLabel: `Open ${event.name}`,
    openLabel: 'Open Event',
    reviewContextAccessibilityLabel: `Review context for ${event.name}`,
    reviewContextLabel: 'Review Context',
  };
}

export function getTimelineSurfaceModel(
  world: TimelineEventItemSource,
  events: readonly WorldEntry[]
): TimelineSurfaceModel {
  return {
    eventCount: events.length,
    review: getTimelineReviewModel(events, world.relationships),
    eraManager: getTimelineEraManagerModel(events),
    highlights: getTimelineHighlights(events).map((event) =>
      getTimelineEventItem(world, event)
    ),
    sortedEvents: sortTimelineEvents(events).map((event) =>
      getTimelineEventItem(world, event)
    ),
    groups: groupTimelineEventsByEra(events).map((group) => ({
      era: group.era,
      events: group.events.map((event) => getTimelineEventItem(world, event)),
    })),
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
  const review = getTimelineReviewModel(filteredEvents, world.relationships);

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
    review,
    unorderedNames: diagnostics.unorderedEvents.map((event) => event.name),
    duplicateOrderLabels: diagnostics.duplicateOrderGroups.map(
      formatDuplicateOrderLabel
    ),
    unlinkedNames: diagnostics.unlinkedEvents.map((event) => event.name),
  };
}
