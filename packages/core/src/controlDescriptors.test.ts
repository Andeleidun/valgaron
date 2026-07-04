import { describe, expect, it } from '@jest/globals';
import {
  entryDraftStatusControl,
  entryPinnedControl,
  entryScreenControlDescriptors,
  entryShowArchivedControl,
  entrySortControl,
  entryStatusFilterControl,
  entryUpdatedFilterControl,
  getEntrySortControlOptions,
  relationshipDirectionalControl,
  relationshipDraftStatusControl,
  relationshipGraphStatusFilterControl,
  relationshipGraphTypeFilterControl,
  relationshipListTypeFilterControl,
  relationshipScreenControlDescriptors,
  relationshipSourceControl,
  relationshipTargetControl,
} from './controlDescriptors';
import { worldEntryStatusOptions } from './codexEntries';

describe('shared control descriptors', () => {
  it('keeps entry controls aligned with the web-source control kinds', () => {
    expect(
      entryScreenControlDescriptors.map((control) => [
        control.id,
        control.kind,
        control.label,
      ])
    ).toEqual([
      ['entries.filters.status', 'select', 'Status'],
      ['entries.filters.sort', 'select', 'Sort'],
      ['entries.filters.updated', 'select', 'Updated'],
      ['entries.filters.showArchived', 'checkbox', 'Show archived'],
      ['entries.editor.status', 'select', 'Status'],
      ['entries.editor.pinned', 'checkbox', 'Pin on overview'],
    ]);
  });

  it('uses the same entry status options for filter and editor controls', () => {
    expect(entryStatusFilterControl.options).toEqual([
      { value: '', label: 'Any status' },
      ...worldEntryStatusOptions,
    ]);
    expect(entryDraftStatusControl.options).toEqual(worldEntryStatusOptions);
  });

  it('uses canonical web labels for entry sort controls', () => {
    expect(entrySortControl.options?.map((option) => option.label)).toEqual([
      'Recently updated',
      'Recently created',
      'Timeline order',
      'Name',
      'Status',
    ]);
    expect(
      getEntrySortControlOptions({ includeTimelineOrder: false }).map(
        (option) => option.value
      )
    ).toEqual(['updated-desc', 'created-desc', 'name', 'status']);
  });

  it('uses canonical web labels for the updated date filter', () => {
    expect(entryUpdatedFilterControl.options).toEqual([
      { value: '', label: 'Any time' },
      { value: '7', label: 'Last 7 days' },
      { value: '30', label: 'Last 30 days' },
      { value: '365', label: 'Last year' },
    ]);
  });

  it('defines accessibility labels for parity-critical entry controls', () => {
    expect(entryStatusFilterControl.accessibilityLabel).toBe(
      'Filter entries by status'
    );
    expect(entrySortControl.accessibilityLabel).toBe('Sort entries');
    expect(entryShowArchivedControl.accessibilityLabel).toBe(
      'Show archived entries'
    );
    expect(entryPinnedControl.accessibilityLabel).toBe('Pin entry on overview');
  });

  it('keeps relationship editor controls aligned with web-source controls', () => {
    expect(
      relationshipScreenControlDescriptors.map((control) => [
        control.id,
        control.kind,
        control.label,
      ])
    ).toEqual([
      ['relationships.editor.source', 'select', 'Source'],
      ['relationships.editor.target', 'select', 'Target'],
      ['relationships.editor.status', 'select', 'Status'],
      ['relationships.editor.directional', 'checkbox', 'Directional'],
      ['relationships.list.type', 'select', 'Type'],
      ['relationships.graph.status', 'select', 'Status'],
      ['relationships.graph.type', 'select', 'Type'],
    ]);
    expect(relationshipDraftStatusControl.options).toEqual(
      worldEntryStatusOptions
    );
    expect(relationshipDirectionalControl.accessibilityLabel).toBe(
      'Directional relationship'
    );
    expect(relationshipSourceControl.required).toBe(true);
    expect(relationshipTargetControl.required).toBe(true);
    expect(relationshipListTypeFilterControl.kind).toBe('select');
    expect(relationshipGraphStatusFilterControl.options).toEqual([
      { value: '', label: 'Any status' },
      ...worldEntryStatusOptions,
    ]);
    expect(relationshipGraphTypeFilterControl.accessibilityLabel).toBe(
      'Filter graph relationships by type'
    );
  });
});
