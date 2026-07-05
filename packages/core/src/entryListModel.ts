import {
  entryDisplayCopy,
  formatUpdatedAt,
  getEntries,
  getEntryStatusLabel,
  getSectionTags,
} from './codexEntries';
import {
  getSearchableEntries,
  searchEntries,
  sortEntries,
} from './codexSearch';
import { filterTimelineEvents, sortTimelineEvents } from './codexTimeline';
import type { EntrySortControlValue } from './controlDescriptors';
import type {
  WorldEntry,
  WorldEntryStatus,
  WorldRelationship,
  WorldSectionConfig,
  WorldCodex,
} from './types';

export type EntryListItem = {
  id: string;
  name: string;
  sectionTitle: string;
  summary: string;
  summaryText: string;
  status: WorldEntry['status'];
  statusLabel: string;
  tags: readonly string[];
  tagsText: string;
  updatedAt: string;
  updatedText: string;
};

export type EntryListFilters = {
  showArchived?: boolean;
  sortKey?: EntrySortControlValue;
  status?: WorldEntryStatus | '';
  activeTag?: string;
  updatedWithinDays?: number | null;
  now?: Date;
  timelineEra?: string;
  timelineInvolvedEntryId?: string;
};

export type EntrySectionNavigationOption = {
  id: string;
  isActive: boolean;
  label: string;
  path: string;
  section: WorldSectionConfig;
};

export type EntryTagFilterOption = {
  isActive: boolean;
  label: string;
  nextValue: string;
  value: string;
};

export type EntryListEmptyStateModel = {
  title: string;
  detail: string;
  showArchivedAction: boolean;
};

type EntryListWorkspaceSource = {
  codex: WorldCodex;
  entryTypes: readonly WorldSectionConfig[];
  relationships: readonly WorldRelationship[];
};

export const entryListCopy = {
  clearFiltersLabel: 'Clear Filters',
  entryHelpLabel: 'Entry Help',
  timelineHelpLabel: 'Timeline Help',
} as const;

export function getEntryListEmptyStateModel({
  archivedCount,
  hasActiveFilters,
  section,
  showArchived,
  totalCount,
}: {
  archivedCount: number;
  hasActiveFilters: boolean;
  section: Pick<WorldSectionConfig, 'singularTitle' | 'title'>;
  showArchived: boolean;
  totalCount: number;
}): EntryListEmptyStateModel {
  const hasOnlyArchivedEntries = totalCount > 0 && archivedCount === totalCount;
  if (totalCount === 0) {
    return {
      title: `No ${section.title.toLowerCase()} saved yet.`,
      detail: `Create a ${section.singularTitle.toLowerCase()} when you are ready to draft this part of the world.`,
      showArchivedAction: false,
    };
  }
  if (hasOnlyArchivedEntries && !showArchived) {
    return {
      title: 'Only archived entries are in this section.',
      detail: 'Show archived entries to review or restore them.',
      showArchivedAction: true,
    };
  }
  return {
    title: hasActiveFilters
      ? 'No entries match these filters.'
      : 'No entries found.',
    detail: 'Try a different search term or clear the active filters.',
    showArchivedAction: false,
  };
}

export function getEntrySectionNavigationOptions(
  sections: readonly WorldSectionConfig[],
  activeSectionId: string
): EntrySectionNavigationOption[] {
  return sections.map((section) => ({
    id: section.id,
    isActive: section.id === activeSectionId,
    label: section.title,
    path: `/${section.id}`,
    section,
  }));
}

export function getEntryTagFilterOptions(
  entries: readonly WorldEntry[],
  activeTag: string,
  options: { includeAllOption?: boolean } = {}
): EntryTagFilterOption[] {
  const tagOptions = getSectionTags(entries).map((tag) => ({
    isActive: activeTag === tag,
    label: tag,
    nextValue: activeTag === tag ? '' : tag,
    value: tag,
  }));

  if (!options.includeAllOption || tagOptions.length === 0) {
    return tagOptions;
  }

  return [
    {
      isActive: activeTag === '',
      label: 'All Tags',
      nextValue: '',
      value: '',
    },
    ...tagOptions,
  ];
}

export function getEntryListModel(
  world: EntryListWorkspaceSource,
  section: WorldSectionConfig,
  query: string,
  filters: EntryListFilters = {}
): EntryListItem[] {
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
      summaryText: entry.summary || entryDisplayCopy.emptySummary,
      status: entry.status,
      statusLabel: getEntryStatusLabel(entry.status),
      tags: entry.tags,
      tagsText: entry.tags.join(', ') || entryDisplayCopy.noTagsLabel,
      updatedAt: entry.updatedAt,
      updatedText: `${entryDisplayCopy.updatedPrefix} ${formatUpdatedAt(
        entry.updatedAt
      )}`,
    }));
}
