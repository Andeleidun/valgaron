import { worldSections } from './seedCodex';
import {
  getEntryDetailFields,
  getHiddenPlaceDetailValues,
  type HiddenPlaceDetailValue,
} from './placeTaxonomy';
import type {
  WorldCodex,
  WorldDetailField,
  WorldDetailFieldKey,
  WorldEntry,
  WorldEntryKind,
  WorldEntryStatus,
  WorldSectionConfig,
  WorldSectionId,
} from './types';
import { makeLocalIdSuffix } from './ids';

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

export const entryNameCopyFeedback = {
  actionLabel: 'Copy Name',
  missingName: 'Add a name before copying it.',
  unavailable: 'Clipboard copy is unavailable in this runtime.',
  failed: 'Clipboard copy failed.',
} as const;

export const entryEditorCopy = {
  applyTemplateLabel: 'Apply Template',
  archiveLabel: 'Archive',
  clearLabel: 'Clear',
  createKicker: 'New entry',
  deleteLabel: 'Delete',
  deletePermanentlyLabel: 'Delete Permanently',
  duplicateLabel: 'Duplicate',
  emptyNotesPreview: 'No notes to preview yet.',
  editKicker: 'Edit entry',
  nameLabel: 'Name',
  newDraftLabel: 'New Draft',
  newLabel: 'New',
  notesLabel: 'Notes',
  notesPreviewKicker: 'Markdown preview',
  notesPreviewTitle: 'Notes preview',
  restoreLabel: 'Restore',
  saveChangesLabel: 'Save Changes',
  summaryLabel: 'Summary',
  tagsLabel: 'Tags',
  hiddenDetailsTitle: 'Hidden place details',
  unsavedDraftMessage: 'Unsaved entry draft.',
  unsavedLabel: 'Unsaved',
  useAsTemplateLabel: 'Use As Template',
} as const;

export const entryEditorFieldCopy = {
  namePlaceholderSuffix: 'name',
  summaryPlaceholder: 'A short working summary',
  notesPlaceholder: 'Markdown-style drafting notes',
  tagsPlaceholder: 'comma, separated, tags',
} as const;

export const entryEditorAccessibilityCopy = {
  deleteHint: 'Deletes the entry and its relationships after confirmation.',
} as const;

export const entryDisplayCopy = {
  createdLabel: 'Created',
  emptySummary: 'No summary yet.',
  noTagsLabel: 'No tags',
  pinnedLabel: 'Pinned',
  sectionDetailSuffix: 'detail',
  tagsLabel: 'Tags',
  updatedLabel: 'Updated',
  updatedPrefix: 'Updated',
  yesLabel: 'Yes',
  noLabel: 'No',
} as const;

export type EntryDetailDisplayField = {
  label: string;
  value: string;
};

export type EntryDetailDisplayModel = {
  created: EntryDetailDisplayField;
  hiddenDetails: HiddenPlaceDetailValue[];
  kicker: string;
  name: string;
  notes: string;
  pinned: EntryDetailDisplayField;
  statusLabel: string;
  summary: string;
  tags: readonly string[];
  tagsLabel: string;
  updated: EntryDetailDisplayField;
  visibleDetails: EntryDetailDisplayField[];
};

export type EntryEditorBaseFieldKey = 'name' | 'summary' | 'notes' | 'tags';

export type EntryEditorBaseFieldModel = {
  id: `entries.editor.${EntryEditorBaseFieldKey}`;
  key: EntryEditorBaseFieldKey;
  label: string;
  multiline: boolean;
  placeholder: string;
  rows: number;
  value: string;
};

export type EntryEditorDetailFieldModel = {
  key: WorldDetailFieldKey;
  label: string;
  multiline: boolean;
  rows: number;
  suggestions: readonly string[];
  value: string;
};

export type EntryEditorNotesPreviewModel = {
  body: string;
  emptyText: string;
  hasContent: boolean;
  kicker: string;
  title: string;
};

export type EntryHiddenDetailCleanupFieldModel = HiddenPlaceDetailValue & {
  clearLabel: string;
};

export type EntryHiddenDetailCleanupModel = {
  fields: readonly EntryHiddenDetailCleanupFieldModel[];
  title: string;
};

export type EntryEditorSelectedActionModel = {
  archiveAccessibilityLabel: string;
  archiveLabel: string;
  deleteAccessibilityHint: string;
  deleteAccessibilityLabel: string;
  deleteLabel: string;
  duplicateAccessibilityLabel: string;
  duplicateLabel: string;
  useAsTemplateAccessibilityLabel: string;
  useAsTemplateLabel: string;
};

export function getEntryNameCopyText(name: string): string | null {
  const normalizedName = name.trim();
  return normalizedName || null;
}

export function getEntryNameCopiedMessage(name: string): string {
  return `Copied ${name}.`;
}

export function getEntryEditorBaseFields(
  section: Pick<WorldSectionConfig, 'singularTitle'>,
  draft: EntryDraft
): EntryEditorBaseFieldModel[] {
  return [
    {
      id: 'entries.editor.name',
      key: 'name',
      label: entryEditorCopy.nameLabel,
      multiline: false,
      placeholder: `${section.singularTitle} ${entryEditorFieldCopy.namePlaceholderSuffix}`,
      rows: 1,
      value: draft.name,
    },
    {
      id: 'entries.editor.summary',
      key: 'summary',
      label: entryEditorCopy.summaryLabel,
      multiline: true,
      placeholder: entryEditorFieldCopy.summaryPlaceholder,
      rows: 4,
      value: draft.summary,
    },
    {
      id: 'entries.editor.notes',
      key: 'notes',
      label: entryEditorCopy.notesLabel,
      multiline: true,
      placeholder: entryEditorFieldCopy.notesPlaceholder,
      rows: 5,
      value: draft.notes,
    },
    {
      id: 'entries.editor.tags',
      key: 'tags',
      label: entryEditorCopy.tagsLabel,
      multiline: false,
      placeholder: entryEditorFieldCopy.tagsPlaceholder,
      rows: 1,
      value: draft.tags,
    },
  ];
}

export function getEntryEditorNotesPreviewModel(
  notes: string
): EntryEditorNotesPreviewModel {
  const body = notes.trim();
  return {
    body,
    emptyText: entryEditorCopy.emptyNotesPreview,
    hasContent: body.length > 0,
    kicker: entryEditorCopy.notesPreviewKicker,
    title: entryEditorCopy.notesPreviewTitle,
  };
}

export function getEntryEditorCreateTitle(
  section: Pick<WorldSectionConfig, 'singularTitle'>
): string {
  return `Create ${section.singularTitle}`;
}

export function getEntryEditorNewTitle(
  section: Pick<WorldSectionConfig, 'singularTitle'>
): string {
  return `New ${section.singularTitle}`;
}

export function getEntryEditorSubmitLabel({
  section,
  selectedEntry,
}: {
  section: Pick<WorldSectionConfig, 'singularTitle'>;
  selectedEntry: WorldEntry | null | undefined;
}): string {
  return selectedEntry
    ? entryEditorCopy.saveChangesLabel
    : getEntryEditorCreateTitle(section);
}

/** Return the display label for an entry status. */
export function getEntryStatusLabel(status: WorldEntryStatus): string {
  return (
    worldEntryStatusOptions.find((option) => option.value === status)?.label ??
    status
  );
}

export function getEntryDetailDisplayModel(
  section: WorldSectionConfig,
  entry: WorldEntry
): EntryDetailDisplayModel {
  return {
    created: {
      label: entryDisplayCopy.createdLabel,
      value: formatUpdatedAt(entry.createdAt),
    },
    hiddenDetails: getHiddenPlaceDetailValues(section, entry.fields),
    kicker: `${section.singularTitle} ${entryDisplayCopy.sectionDetailSuffix}`,
    name: entry.name,
    notes: entry.notes,
    pinned: {
      label: entryDisplayCopy.pinnedLabel,
      value: entry.pinned
        ? entryDisplayCopy.yesLabel
        : entryDisplayCopy.noLabel,
    },
    statusLabel: getEntryStatusLabel(entry.status),
    summary: entry.summary || entryDisplayCopy.emptySummary,
    tags: entry.tags,
    tagsLabel: entryDisplayCopy.tagsLabel,
    updated: {
      label: entryDisplayCopy.updatedLabel,
      value: formatUpdatedAt(entry.updatedAt),
    },
    visibleDetails: getEntryDetailFields(section, entry)
      .map((field) => ({
        label: field.label,
        value: getDetailValue(entry, field.key),
      }))
      .filter((field) => field.value),
  };
}

export function getEntryEditorDetailFieldModels({
  draft,
  fields,
  sectionEntries,
  suggestionLimit = Number.POSITIVE_INFINITY,
}: {
  draft: EntryDraft;
  fields: readonly Pick<
    WorldDetailField,
    'autocompleteOptions' | 'key' | 'label' | 'multiline'
  >[];
  sectionEntries: readonly WorldEntry[];
  suggestionLimit?: number;
}): EntryEditorDetailFieldModel[] {
  const suggestionsByKey = getEntryDetailFieldSuggestions(
    fields,
    sectionEntries
  );
  return fields.map((field) => {
    const value = draft.details[field.key] ?? '';
    const suggestions = (suggestionsByKey[field.key] ?? [])
      .filter((suggestion) => suggestion !== value)
      .slice(0, Math.max(0, suggestionLimit));
    return {
      key: field.key,
      label: field.label,
      multiline: Boolean(field.multiline),
      rows: field.multiline ? 3 : 1,
      suggestions,
      value,
    };
  });
}

export function getEntryHiddenDetailCleanupModel(
  section: WorldSectionConfig,
  draft: EntryDraft
): EntryHiddenDetailCleanupModel {
  return {
    fields: getHiddenPlaceDetailValues(section, draft.details).map((field) => ({
      ...field,
      clearLabel: entryEditorCopy.clearLabel,
    })),
    title: entryEditorCopy.hiddenDetailsTitle,
  };
}

export function getEntryEditorSelectedActionModel(
  entry: WorldEntry
): EntryEditorSelectedActionModel {
  const archiveLabel =
    entry.status === 'archived'
      ? entryEditorCopy.restoreLabel
      : entryEditorCopy.archiveLabel;
  return {
    archiveAccessibilityLabel: `${archiveLabel} ${entry.name}`,
    archiveLabel,
    deleteAccessibilityHint: entryEditorAccessibilityCopy.deleteHint,
    deleteAccessibilityLabel: `${entryEditorCopy.deletePermanentlyLabel} ${entry.name}`,
    deleteLabel: entryEditorCopy.deletePermanentlyLabel,
    duplicateAccessibilityLabel: `${entryEditorCopy.duplicateLabel} ${entry.name}`,
    duplicateLabel: entryEditorCopy.duplicateLabel,
    useAsTemplateAccessibilityLabel: `Use ${entry.name} as a template`,
    useAsTemplateLabel: entryEditorCopy.useAsTemplateLabel,
  };
}

/** Build autocomplete suggestions for detail fields that opt into suggestions. */
export function getEntryDetailFieldSuggestions(
  fields: readonly Pick<WorldDetailField, 'autocompleteOptions' | 'key'>[],
  entries: readonly WorldEntry[]
): Record<WorldDetailFieldKey, string[]> {
  return Object.fromEntries(
    fields.map((field) => {
      const suggestions = new Map<string, string>();
      for (const option of field.autocompleteOptions ?? []) {
        const normalizedOption = option.trim();
        if (normalizedOption) {
          suggestions.set(normalizedOption.toLowerCase(), normalizedOption);
        }
      }
      if (suggestions.size > 0) {
        for (const entry of entries) {
          const value = entry.fields[field.key]?.trim();
          if (value) {
            suggestions.set(value.toLowerCase(), value);
          }
        }
      }
      return [field.key, Array.from(suggestions.values()).sort()];
    })
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
  const entryDetailFields = getEntryDetailFields(section, entry);
  const sectionFieldKeys = new Set(entryDetailFields.map((field) => field.key));
  const searchableFieldValues = [
    ...entryDetailFields.map((field) => getDetailValue(entry, field.key)),
    ...Object.entries(entry.fields)
      .filter(([key]) => !sectionFieldKeys.has(key))
      .map(([, value]) => value),
  ];
  return [
    entry.name,
    entry.summary,
    entry.tags.join(' '),
    ...searchableFieldValues,
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
export function getSectionTags(entries: readonly WorldEntry[]): string[] {
  return Array.from(new Set(entries.flatMap((entry) => entry.tags))).sort(
    (first, second) => first.localeCompare(second)
  );
}

/** Convert a saved entry into an editable form draft. */
export function draftFromEntry(
  entry: WorldEntry,
  section: WorldSectionConfig
): EntryDraft {
  const details = { ...entry.fields };
  for (const field of section.detailFields) {
    if (!(field.key in details)) {
      details[field.key] = getDetailValue(entry, field.key);
    }
  }
  return {
    name: entry.name,
    summary: entry.summary,
    notes: entry.notes,
    tags: entry.tags.join(', '),
    status: entry.status,
    pinned: entry.pinned,
    details,
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
  const suffix = makeLocalIdSuffix();
  return `${kind}-${slug || 'entry'}-${suffix}`;
}

function detail(draft: EntryDraft, key: WorldDetailFieldKey): string {
  return draft.details[key]?.trim() ?? '';
}

function entryFieldsFromDraft(
  fieldKeys: ReadonlySet<WorldDetailFieldKey>,
  draft: EntryDraft
): Record<string, string> {
  return Object.fromEntries(
    Array.from(fieldKeys)
      .map((key) => [key, detail(draft, key)] as const)
      .filter(([, value]) => value.length > 0)
  );
}

/** Convert a form draft into a saved codex entry. */
export function entryFromDraft(
  section: WorldSectionConfig,
  draft: EntryDraft,
  existingEntry?: WorldEntry
): WorldEntry {
  const fieldKeys = new Set([
    ...section.detailFields.map((field) => field.key),
    ...Object.keys(existingEntry?.fields ?? {}),
    ...Object.keys(draft.details),
  ]);
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
    fields: entryFieldsFromDraft(fieldKeys, draft),
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
