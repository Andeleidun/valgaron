import { worldSections } from './seedCodex';
import type {
  CharacterEntry,
  FactionEntry,
  LoreEntry,
  PlaceEntry,
  TimelineEntry,
  WorldCodex,
  WorldDetailFieldKey,
  WorldEntry,
  WorldEntryKind,
  WorldSectionConfig,
  WorldSectionId,
} from '../types';

export type EntryDraft = {
  name: string;
  summary: string;
  tags: string;
  details: Record<string, string>;
};

/** Create a blank entry draft for forms. */
export function createEmptyDraft(): EntryDraft {
  return {
    name: '',
    summary: '',
    tags: '',
    details: {},
  };
}

/** Return the entry collection for a codex section. */
export function getEntries(
  codex: WorldCodex,
  sectionId: WorldSectionId
): WorldEntry[] {
  switch (sectionId) {
    case 'characters':
      return codex.characters;
    case 'places':
      return codex.places;
    case 'factions':
      return codex.factions;
    case 'lore':
      return codex.lore;
    case 'timeline':
      return codex.timeline;
  }
}

/** Resolve a section config from a route id. */
export function getSectionById(
  sectionId: string | undefined
): WorldSectionConfig | null {
  return worldSections.find((section) => section.id === sectionId) ?? null;
}

/** Read a detail field from any codex entry. */
export function getDetailValue(
  entry: WorldEntry,
  key: WorldDetailFieldKey
): string {
  if (key in entry) {
    const value = entry[key as keyof WorldEntry];
    return typeof value === 'string' ? value : '';
  }
  return '';
}

/** Build normalized search text for section-local filtering. */
export function getEntrySearchText(
  entry: WorldEntry,
  section: WorldSectionConfig
): string {
  return [
    entry.name,
    entry.summary,
    entry.tags.join(' '),
    ...section.detailFields.map((field) => getDetailValue(entry, field.key)),
  ]
    .join(' ')
    .toLowerCase();
}

/** Check whether an entry matches the current section filters. */
export function entryMatchesFilters(
  entry: WorldEntry,
  section: WorldSectionConfig,
  query: string,
  activeTag: string
): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  const matchesQuery =
    normalizedQuery.length === 0 ||
    getEntrySearchText(entry, section).includes(normalizedQuery);
  const matchesTag = !activeTag || entry.tags.includes(activeTag);
  return matchesQuery && matchesTag;
}

/** Get sorted unique tags for a section entry list. */
export function getSectionTags(entries: WorldEntry[]): string[] {
  return Array.from(new Set(entries.flatMap((entry) => entry.tags))).sort(
    (first, second) => first.localeCompare(second)
  );
}

/** Convert a saved entry into an editable form draft. */
export function draftFromEntry(
  entry: WorldEntry,
  section: WorldSectionConfig
): EntryDraft {
  return {
    name: entry.name,
    summary: entry.summary,
    tags: entry.tags.join(', '),
    details: Object.fromEntries(
      section.detailFields.map((field) => [
        field.key,
        getDetailValue(entry, field.key),
      ])
    ),
  };
}

/** Normalize a comma-separated tag field. */
export function normalizeTags(tags: string): string[] {
  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/** Create a stable local id from an entry kind and name. */
export function makeEntryId(kind: WorldEntryKind, name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : String(Date.now());
  return `${kind}-${slug || 'entry'}-${suffix}`;
}

function detail(draft: EntryDraft, key: WorldDetailFieldKey): string {
  return draft.details[key]?.trim() ?? '';
}

/** Convert a form draft into a saved codex entry. */
export function entryFromDraft(
  section: WorldSectionConfig,
  draft: EntryDraft,
  existingEntry?: WorldEntry
): WorldEntry {
  const base = {
    id: existingEntry?.id ?? makeEntryId(section.kind, draft.name),
    name: draft.name.trim(),
    summary: draft.summary.trim(),
    tags: normalizeTags(draft.tags),
    updatedAt: new Date().toISOString(),
  };

  switch (section.kind) {
    case 'character': {
      const entry: CharacterEntry = {
        ...base,
        kind: 'character',
        role: detail(draft, 'role'),
        home: detail(draft, 'home'),
        affiliation: detail(draft, 'affiliation'),
        status: detail(draft, 'status'),
      };
      return entry;
    }
    case 'place': {
      const entry: PlaceEntry = {
        ...base,
        kind: 'place',
        region: detail(draft, 'region'),
        climate: detail(draft, 'climate'),
        significance: detail(draft, 'significance'),
      };
      return entry;
    }
    case 'faction': {
      const entry: FactionEntry = {
        ...base,
        kind: 'faction',
        purpose: detail(draft, 'purpose'),
        influence: detail(draft, 'influence'),
        headquarters: detail(draft, 'headquarters'),
      };
      return entry;
    }
    case 'lore': {
      const entry: LoreEntry = {
        ...base,
        kind: 'lore',
        category: detail(draft, 'category'),
        source: detail(draft, 'source'),
        implications: detail(draft, 'implications'),
      };
      return entry;
    }
    case 'timeline': {
      const entry: TimelineEntry = {
        ...base,
        kind: 'timeline',
        dateLabel: detail(draft, 'dateLabel'),
        era: detail(draft, 'era'),
        consequences: detail(draft, 'consequences'),
      };
      return entry;
    }
  }
}

function upsertEntry<TEntry extends WorldEntry>(
  entries: TEntry[],
  entry: TEntry
): TEntry[] {
  const existingIndex = entries.findIndex((item) => item.id === entry.id);
  if (existingIndex === -1) {
    return [entry, ...entries];
  }
  return entries.map((item) => (item.id === entry.id ? entry : item));
}

/** Apply a created or edited entry to the correct codex collection. */
export function applyEntry(codex: WorldCodex, entry: WorldEntry): WorldCodex {
  switch (entry.kind) {
    case 'character':
      return { ...codex, characters: upsertEntry(codex.characters, entry) };
    case 'place':
      return { ...codex, places: upsertEntry(codex.places, entry) };
    case 'faction':
      return { ...codex, factions: upsertEntry(codex.factions, entry) };
    case 'lore':
      return { ...codex, lore: upsertEntry(codex.lore, entry) };
    case 'timeline':
      return { ...codex, timeline: upsertEntry(codex.timeline, entry) };
  }
}

/** Format an ISO timestamp for the English prototype UI. */
export function formatUpdatedAt(value: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}
