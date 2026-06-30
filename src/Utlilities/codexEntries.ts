import { worldSections } from './seedCodex';
import type {
  WorldCodex,
  WorldDetailFieldKey,
  WorldEntry,
  WorldEntryKind,
  WorldEntryStatus,
  WorldSectionConfig,
  WorldSectionId,
} from '../types';

export const worldEntryStatusOptions: readonly {
  value: WorldEntryStatus;
  label: string;
}[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'canon', label: 'Canon' },
  { value: 'needs-review', label: 'Needs Review' },
  { value: 'deprecated', label: 'Deprecated' },
  { value: 'archived', label: 'Archived' },
];

/** Return the display label for an entry status. */
export function getEntryStatusLabel(status: WorldEntryStatus): string {
  return (
    worldEntryStatusOptions.find((option) => option.value === status)?.label ??
    status
  );
}

export type EntryDraft = {
  name: string;
  summary: string;
  notes: string;
  tags: string;
  status: WorldEntryStatus;
  pinned: boolean;
  details: Record<string, string>;
};

/** Create a blank entry draft for forms. */
export function createEmptyDraft(): EntryDraft {
  return {
    name: '',
    summary: '',
    notes: '',
    tags: '',
    status: 'draft',
    pinned: false,
    details: {},
  };
}

/** Return the entry collection for a codex section. */
export function getEntries(
  codex: WorldCodex,
  sectionId: WorldSectionId
): WorldEntry[] {
  return codex[sectionId] ?? [];
}

/** Resolve a section config from a route id. */
export function getSectionById(
  sectionId: string | undefined,
  sections: readonly WorldSectionConfig[] = worldSections
): WorldSectionConfig | null {
  return sections.find((section) => section.id === sectionId) ?? null;
}

/** Read a detail field from any codex entry. */
export function getDetailValue(
  entry: WorldEntry,
  key: WorldDetailFieldKey
): string {
  return entry.fields[key] ?? '';
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
    notes: entry.notes,
    tags: entry.tags.join(', '),
    status: entry.status,
    pinned: entry.pinned,
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
    kind: section.kind,
    name: draft.name.trim(),
    summary: draft.summary.trim(),
    notes: draft.notes.trim(),
    tags: normalizeTags(draft.tags),
    status: draft.status,
    pinned: draft.pinned,
    createdAt: existingEntry?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fields: Object.fromEntries(
      section.detailFields.map((field) => [field.key, detail(draft, field.key)])
    ),
  };

  return base;
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
export function applyEntry(
  codex: WorldCodex,
  entry: WorldEntry,
  sections: readonly WorldSectionConfig[] = worldSections
): WorldCodex {
  const section = sections.find((item) => item.kind === entry.kind);
  const sectionId = section?.id ?? entry.kind;
  return {
    ...codex,
    [sectionId]: upsertEntry(getEntries(codex, sectionId), entry),
  };
}

/** Remove an entry from its section collection. */
export function deleteEntry(
  codex: WorldCodex,
  entry: WorldEntry,
  sections: readonly WorldSectionConfig[] = worldSections
): WorldCodex {
  const section = sections.find((item) => item.kind === entry.kind);
  const sectionId = section?.id ?? entry.kind;
  return {
    ...codex,
    [sectionId]: getEntries(codex, sectionId).filter(
      (item) => item.id !== entry.id
    ),
  };
}

/** Archive or restore an entry without deleting it. */
export function setEntryArchived(
  codex: WorldCodex,
  entry: WorldEntry,
  archived: boolean,
  sections: readonly WorldSectionConfig[] = worldSections
): WorldCodex {
  return applyEntry(
    codex,
    {
      ...entry,
      status: archived ? 'archived' : 'draft',
      updatedAt: new Date().toISOString(),
    },
    sections
  );
}

/** Create a duplicate entry with a fresh id. */
export function duplicateEntry(
  section: WorldSectionConfig,
  entry: WorldEntry
): WorldEntry {
  const timestamp = new Date().toISOString();
  return {
    ...entry,
    id: makeEntryId(entry.kind, `${entry.name} copy`),
    name: `${entry.name} Copy`,
    status: 'draft',
    pinned: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    fields: { ...entry.fields },
    tags: [...entry.tags],
    kind: section.kind,
  };
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
