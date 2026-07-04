import { worldEntryStatusOptions } from './codexEntries';
import type { EntrySortKey } from './codexSearch';
import type { WorldEntryStatus } from './types';

export type ControlKind =
  | 'button'
  | 'checkbox'
  | 'select'
  | 'segmented-control'
  | 'text-field'
  | 'textarea';

export type ControlOption<TValue extends string = string> = {
  value: TValue;
  label: string;
};

export type ControlDescriptor<TValue extends string = string> = {
  id: string;
  kind: ControlKind;
  label: string;
  accessibilityLabel: string;
  options?: readonly ControlOption<TValue>[];
  required?: boolean;
};

export type EntrySortControlValue = EntrySortKey | 'timeline-order';
export type EntryStatusFilterValue = WorldEntryStatus | '';
export type EntryUpdatedFilterValue = '' | '7' | '30' | '365';

export const entrySortControlOptions = [
  { value: 'updated-desc', label: 'Recently updated' },
  { value: 'created-desc', label: 'Recently created' },
  { value: 'timeline-order', label: 'Timeline order' },
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
] as const satisfies readonly ControlOption<EntrySortControlValue>[];

export function getEntrySortControlOptions({
  includeTimelineOrder,
}: {
  includeTimelineOrder: boolean;
}): readonly ControlOption<EntrySortControlValue>[] {
  return includeTimelineOrder
    ? entrySortControlOptions
    : entrySortControlOptions.filter(
        (option) => option.value !== 'timeline-order'
      );
}

export const entryStatusFilterControl = {
  id: 'entries.filters.status',
  kind: 'select',
  label: 'Status',
  accessibilityLabel: 'Filter entries by status',
  options: [{ value: '', label: 'Any status' }, ...worldEntryStatusOptions],
} as const satisfies ControlDescriptor<EntryStatusFilterValue>;

export const entrySortControl = {
  id: 'entries.filters.sort',
  kind: 'select',
  label: 'Sort',
  accessibilityLabel: 'Sort entries',
  options: entrySortControlOptions,
} as const satisfies ControlDescriptor<EntrySortControlValue>;

export const entryShowArchivedControl = {
  id: 'entries.filters.showArchived',
  kind: 'checkbox',
  label: 'Show archived',
  accessibilityLabel: 'Show archived entries',
} as const satisfies ControlDescriptor;

export const entryUpdatedFilterControl = {
  id: 'entries.filters.updated',
  kind: 'select',
  label: 'Updated',
  accessibilityLabel: 'Filter entries by updated date',
  options: [
    { value: '', label: 'Any time' },
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '365', label: 'Last year' },
  ],
} as const satisfies ControlDescriptor<EntryUpdatedFilterValue>;

export const entryDraftStatusControl = {
  id: 'entries.editor.status',
  kind: 'select',
  label: 'Status',
  accessibilityLabel: 'Entry status',
  options: worldEntryStatusOptions,
  required: true,
} as const satisfies ControlDescriptor<WorldEntryStatus>;

export const entryPinnedControl = {
  id: 'entries.editor.pinned',
  kind: 'checkbox',
  label: 'Pin on overview',
  accessibilityLabel: 'Pin entry on overview',
} as const satisfies ControlDescriptor;

export const relationshipDraftStatusControl = {
  id: 'relationships.editor.status',
  kind: 'select',
  label: 'Status',
  accessibilityLabel: 'Relationship status',
  options: worldEntryStatusOptions,
  required: true,
} as const satisfies ControlDescriptor<WorldEntryStatus>;

export const relationshipSourceControl = {
  id: 'relationships.editor.source',
  kind: 'select',
  label: 'Source',
  accessibilityLabel: 'Relationship source',
  required: true,
} as const satisfies ControlDescriptor;

export const relationshipTargetControl = {
  id: 'relationships.editor.target',
  kind: 'select',
  label: 'Target',
  accessibilityLabel: 'Relationship target',
  required: true,
} as const satisfies ControlDescriptor;

export const relationshipDirectionalControl = {
  id: 'relationships.editor.directional',
  kind: 'checkbox',
  label: 'Directional',
  accessibilityLabel: 'Directional relationship',
} as const satisfies ControlDescriptor;

export const relationshipListTypeFilterControl = {
  id: 'relationships.list.type',
  kind: 'select',
  label: 'Type',
  accessibilityLabel: 'Filter relationships by type',
} as const satisfies ControlDescriptor;

export const relationshipGraphStatusFilterControl = {
  id: 'relationships.graph.status',
  kind: 'select',
  label: 'Status',
  accessibilityLabel: 'Filter graph records by status',
  options: [{ value: '', label: 'Any status' }, ...worldEntryStatusOptions],
} as const satisfies ControlDescriptor<EntryStatusFilterValue>;

export const relationshipGraphTypeFilterControl = {
  id: 'relationships.graph.type',
  kind: 'select',
  label: 'Type',
  accessibilityLabel: 'Filter graph relationships by type',
} as const satisfies ControlDescriptor;

export const entryScreenControlDescriptors = [
  entryStatusFilterControl,
  entrySortControl,
  entryUpdatedFilterControl,
  entryShowArchivedControl,
  entryDraftStatusControl,
  entryPinnedControl,
] as const satisfies readonly ControlDescriptor[];

export const relationshipScreenControlDescriptors = [
  relationshipSourceControl,
  relationshipTargetControl,
  relationshipDraftStatusControl,
  relationshipDirectionalControl,
  relationshipListTypeFilterControl,
  relationshipGraphStatusFilterControl,
  relationshipGraphTypeFilterControl,
] as const satisfies readonly ControlDescriptor[];
