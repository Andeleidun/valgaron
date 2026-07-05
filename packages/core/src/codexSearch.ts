import type {
  WorldCodex,
  WorldEntry,
  WorldEntryStatus,
  WorldSectionConfig,
} from './types';
import { entryDisplayCopy, formatUpdatedAt, getEntries } from './codexEntries';

export type SearchableEntry = WorldEntry & {
  sectionId: string;
  sectionTitle: string;
  sectionPath: string;
};

export type EntrySortKey = 'updated-desc' | 'created-desc' | 'name' | 'status';

export type SectionEntryFilters = {
  query: string;
  activeTag: string;
  status: WorldEntryStatus | '';
  showArchived: boolean;
  updatedWithinDays: number | null;
  now?: Date;
};

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase();
}

function getEntrySearchText(
  entry: WorldEntry,
  section: WorldSectionConfig
): string {
  return [
    entry.name,
    entry.summary,
    entry.notes,
    entry.status,
    entry.tags.join(' '),
    ...section.detailFields.map((field) => entry.fields[field.key] ?? ''),
    ...Object.values(entry.fields),
  ]
    .join(' ')
    .toLowerCase();
}

function getSectionByIdMap(
  sections: readonly WorldSectionConfig[]
): Map<string, WorldSectionConfig> {
  return new Map(sections.map((section) => [section.id, section]));
}

/** Return every entry with its owning section metadata attached. */
export function getSearchableEntries(
  codex: WorldCodex,
  sections: readonly WorldSectionConfig[]
): SearchableEntry[] {
  return sections.flatMap((section) =>
    getEntries(codex, section.id).map((entry) => ({
      ...entry,
      sectionId: section.id,
      sectionTitle: section.title,
      sectionPath: `/${section.id}`,
    }))
  );
}

/** Search across all entry text, tags, notes, and configured detail fields. */
export function searchEntries(
  entries: readonly SearchableEntry[],
  sections: readonly WorldSectionConfig[],
  query: string
): SearchableEntry[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return [];
  }
  const sectionById = getSectionByIdMap(sections);
  return entries.filter((entry) => {
    const section = sectionById.get(entry.sectionId);
    return section
      ? getEntrySearchText(entry, section).includes(normalizedQuery)
      : false;
  });
}

/** Filter a section entry list by search, tag, status, and archived visibility. */
export function filterSectionEntries(
  entries: readonly WorldEntry[],
  section: WorldSectionConfig,
  filters: SectionEntryFilters
): WorldEntry[] {
  const normalizedQuery = normalizeSearchText(filters.query);
  const updatedCutoff = filters.updatedWithinDays
    ? (filters.now ?? new Date()).getTime() -
      filters.updatedWithinDays * 24 * 60 * 60 * 1000
    : null;
  return entries.filter((entry) => {
    const archivedVisible =
      filters.showArchived ||
      filters.status === 'archived' ||
      entry.status !== 'archived';
    const matchesQuery =
      !normalizedQuery ||
      getEntrySearchText(entry, section).includes(normalizedQuery);
    const matchesTag =
      !filters.activeTag || entry.tags.includes(filters.activeTag);
    const matchesStatus = !filters.status || entry.status === filters.status;
    const matchesUpdated =
      updatedCutoff === null ||
      new Date(entry.updatedAt).getTime() >= updatedCutoff;
    return (
      archivedVisible &&
      matchesQuery &&
      matchesTag &&
      matchesStatus &&
      matchesUpdated
    );
  });
}

/** Sort entries for section browsing. */
export function sortEntries(
  entries: readonly WorldEntry[],
  sortKey: EntrySortKey
): WorldEntry[] {
  return [...entries].sort((first, second) => {
    switch (sortKey) {
      case 'created-desc':
        return (
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
        );
      case 'name':
        return first.name.localeCompare(second.name);
      case 'status':
        return first.status.localeCompare(second.status);
      case 'updated-desc':
        return (
          new Date(second.updatedAt).getTime() -
          new Date(first.updatedAt).getTime()
        );
    }
  });
}

/** Build a short result context for global search output. */
export function getSearchResultContext(entry: SearchableEntry): string {
  return `${entry.sectionTitle} - ${
    entryDisplayCopy.updatedPrefix
  } ${formatUpdatedAt(entry.updatedAt)}`;
}
