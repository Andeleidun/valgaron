import { describe, expect, it } from '@jest/globals';
import {
  entryDraftStatusControl,
  entryPinnedControl,
  entryScreenAccessibilityInventory,
  entryScreenControlDescriptors,
  entryShowArchivedControl,
  entrySortControl,
  entryStatusFilterControl,
  entryUpdatedFilterControl,
  getEntrySortControlOptions,
  relationshipScreenAccessibilityInventory,
  relationshipDirectionalControl,
  relationshipDraftStatusControl,
  relationshipGraphStatusFilterControl,
  relationshipGraphTypeFilterControl,
  relationshipListTypeFilterControl,
  relationshipNoteControl,
  relationshipScreenControlDescriptors,
  relationshipSourceControl,
  relationshipTargetControl,
  relationshipTypeControl,
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

  it('builds shared accessibility inventory for entry controls', () => {
    expect(
      entryScreenAccessibilityInventory.map((item) => [
        item.controlId,
        item.accessibleName,
        item.expectedStates,
      ])
    ).toEqual([
      [
        'entries.filters.status',
        'Filter entries by status',
        ['disabled', 'expanded', 'selectedValue'],
      ],
      [
        'entries.filters.sort',
        'Sort entries',
        ['disabled', 'expanded', 'selectedValue'],
      ],
      [
        'entries.filters.updated',
        'Filter entries by updated date',
        ['disabled', 'expanded', 'selectedValue'],
      ],
      [
        'entries.filters.showArchived',
        'Show archived entries',
        ['disabled', 'checked'],
      ],
      [
        'entries.editor.status',
        'Entry status',
        ['disabled', 'expanded', 'selectedValue', 'required'],
      ],
      [
        'entries.editor.pinned',
        'Pin entry on overview',
        ['disabled', 'checked'],
      ],
    ]);
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
      ['relationships.editor.type', 'text-field', 'Type'],
      ['relationships.editor.status', 'select', 'Status'],
      ['relationships.editor.directional', 'checkbox', 'Directional'],
      ['relationships.editor.note', 'textarea', 'Note'],
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
    expect(relationshipTypeControl.required).toBe(true);
    expect(relationshipNoteControl.accessibilityLabel).toBe(
      'Relationship note'
    );
    expect(relationshipListTypeFilterControl.kind).toBe('select');
    expect(relationshipGraphStatusFilterControl.options).toEqual([
      { value: '', label: 'Any status' },
      ...worldEntryStatusOptions,
    ]);
    expect(relationshipGraphTypeFilterControl.accessibilityLabel).toBe(
      'Filter graph relationships by type'
    );
  });

  it('builds shared accessibility inventory for relationship controls', () => {
    expect(
      relationshipScreenAccessibilityInventory.map((item) => [
        item.controlId,
        item.accessibleName,
        item.expectedStates,
      ])
    ).toEqual([
      [
        'relationships.editor.source',
        'Relationship source',
        ['disabled', 'expanded', 'selectedValue', 'required'],
      ],
      [
        'relationships.editor.target',
        'Relationship target',
        ['disabled', 'expanded', 'selectedValue', 'required'],
      ],
      [
        'relationships.editor.type',
        'Relationship type',
        ['disabled', 'required'],
      ],
      [
        'relationships.editor.status',
        'Relationship status',
        ['disabled', 'expanded', 'selectedValue', 'required'],
      ],
      [
        'relationships.editor.directional',
        'Directional relationship',
        ['disabled', 'checked'],
      ],
      ['relationships.editor.note', 'Relationship note', ['disabled']],
      [
        'relationships.list.type',
        'Filter relationships by type',
        ['disabled', 'expanded', 'selectedValue'],
      ],
      [
        'relationships.graph.status',
        'Filter graph records by status',
        ['disabled', 'expanded', 'selectedValue'],
      ],
      [
        'relationships.graph.type',
        'Filter graph relationships by type',
        ['disabled', 'expanded', 'selectedValue'],
      ],
    ]);
  });
});
