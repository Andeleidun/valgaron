import { describe, expect, it } from '@jest/globals';
import { draftFromEntry } from './codexEntries';
import { createSectionEntryDraft } from './codexTemplates';
import {
  createTimelineInvolvedRecordStagedRelationship,
  filterTimelineEvents,
  formatTimelineReviewIssueCount,
  formatTimelineVisibleEventCount,
  getTimelineEventItem,
  getTimelineEventDateLabel,
  getTimelineEventOrderLabel,
  getTimelineBrowseModel,
  getTimelineDiagnostics,
  getTimelineEraManagerModel,
  getTimelineEraReassignmentUpdates,
  getTimelineEras,
  getTimelineEventEditorModel,
  getTimelineHighlights,
  getTimelineInvolvedEntryIds,
  getTimelineOrderValue,
  getTimelineOrderUpdates,
  getTimelineReviewModel,
  getTimelineSummaryModel,
  getTimelineSurfaceModel,
  groupTimelineEventsByEra,
  sortTimelineEvents,
  timelineFeatureCopy,
  timelineUnassignedEraFilterValue,
} from './codexTimeline';
import { createSeedWorld } from './seedCodex';
import type { WorldEntry } from './types';

function timelineEvent(
  id: string,
  name: string,
  order: string,
  era: string,
  tags: string[] = []
): WorldEntry {
  return {
    id,
    kind: 'timeline',
    name,
    summary: '',
    notes: '',
    tags,
    status: 'draft',
    pinned: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    fields: {
      order,
      dateLabel: `Year ${order}`,
      era,
      consequences: '',
    },
    images: [],
  };
}

describe('codex timeline helpers', () => {
  it('centralizes timeline browser labels and fallbacks', () => {
    expect(timelineFeatureCopy).toMatchObject({
      timelineBrowserTitle: 'Timeline Browser',
      anyEraLabel: 'Any Era',
      anyInvolvedLabel: 'Any Involved',
      clearTimelineFiltersLabel: 'Clear Timeline Filters',
      eraFilterLabel: 'Era',
      involvedFilterLabel: 'Involved entry',
      noTimelineEventsMatchFilters: 'No timeline events match these filters.',
      timelineOverviewTitle: 'Timeline view',
      timelineErasLabel: 'Timeline eras',
      timelineHighlightsLabel: 'Timeline highlights',
      timelineTableLabel: 'Timeline table',
      timelineTableColumnLabels: {
        order: 'Order',
        event: 'Event',
        date: 'Date',
        era: 'Era',
        links: 'Links',
        actions: 'Actions',
      },
      searchInvolvedFiltersLabel: 'Search involved filters',
      searchInvolvedFiltersPlaceholder:
        'Record name, section, tag, status, or id',
      unorderedEventsLabel: 'Unordered events',
      duplicateOrdersLabel: 'Duplicate orders',
      unlinkedEventsLabel: 'Unlinked events',
    });
    expect(getTimelineEventDateLabel({ dateLabel: '' })).toBe('No date');
    expect(formatTimelineVisibleEventCount(1)).toBe('1 visible event');
    expect(formatTimelineVisibleEventCount(2)).toBe('2 visible events');
    expect(formatTimelineReviewIssueCount(1)).toBe('1 review issue');
    expect(formatTimelineReviewIssueCount(2)).toBe('2 review issues');
    expect(getTimelineEventDateLabel({ dateLabel: 'Year 4' })).toBe('Year 4');
    expect(getTimelineEventOrderLabel({ order: '' })).toBe('No order');
    expect(getTimelineEventOrderLabel({ order: '10' })).toBe('10');
  });

  it('creates staged involved-record relationships for new timeline events', () => {
    expect(
      createTimelineInvolvedRecordStagedRelationship(
        ' character-mira-rowan ',
        'staged-timeline-involved'
      )
    ).toMatchObject({
      stagedId: 'staged-timeline-involved',
      sourceEntryId: '__draft-entry__',
      targetEntryId: 'character-mira-rowan',
      type: 'involves',
      directional: false,
      status: 'draft',
    });
    expect(createTimelineInvolvedRecordStagedRelationship('   ')).toBeNull();
  });

  it('builds a custom timeline editor model for chronology and involved links', () => {
    const world = createSeedWorld();
    const section = world.entryTypes.find((item) => item.id === 'timeline');
    const event = world.codex.timeline.find(
      (entry) => entry.id === 'timeline-harbor-accord'
    );
    if (!section || !event) {
      throw new Error('Expected seeded timeline event.');
    }
    const model = getTimelineEventEditorModel({
      draft: draftFromEntry(event, section),
      section,
      selectedEntry: event,
      world,
    });

    expect(model.title).toBe(`Edit ${event.name}`);
    expect(model.submitLabel).toBe('Update Timeline Event');
    expect(model.chronology.fields.map((field) => field.key)).toEqual([
      'order',
      'dateLabel',
      'era',
    ]);
    expect(model.outcomes.fields.map((field) => field.key)).toEqual([
      'consequences',
    ]);
    expect(
      model.involvedRecords.selectedRecords.map((record) => record.id)
    ).toEqual(['faction-cartographers-guild']);
    expect(model.involvedRecords).toMatchObject({
      title: 'Involved records',
      searchLabel: 'Search involved records',
      searchPlaceholder: 'Character, place, faction, or lore note',
      optionListLabel: 'Choose involved records',
      emptySearchLabel: 'No involved records match this search.',
      selectedRecordsLabel: 'Selected involved records',
      selectedRecordsSummaryLabel: 'Selected: The Cartographers Guild',
      currentEntryMessage:
        'Use the relationship-backed controls below to update involved records.',
      applyBeforeEditMessage:
        'Create or update this timeline event before editing involved records.',
    });
    expect(model.involvedRecords.legacyText).toBeNull();
  });

  it('caps timeline editor field suggestions when a limit is provided', () => {
    const world = createSeedWorld();
    const section = world.entryTypes.find((item) => item.id === 'timeline');
    if (!section) {
      throw new Error('Expected timeline section.');
    }
    const model = getTimelineEventEditorModel({
      draft: createSectionEntryDraft(section),
      section,
      suggestionLimit: 1,
      world,
    });

    expect(
      model.chronology.fields.find((field) => field.key === 'era')?.suggestions
    ).toHaveLength(1);
  });

  it('groups custom timeline fields as additional details', () => {
    const world = createSeedWorld();
    const section = world.entryTypes.find((item) => item.id === 'timeline');
    if (!section) {
      throw new Error('Expected timeline section.');
    }
    const sectionWithCustomField = {
      ...section,
      detailFields: [
        ...section.detailFields,
        {
          key: 'prophecy',
          label: 'Prophecy',
          suggestFromExistingValues: true,
        },
      ],
    };
    const model = getTimelineEventEditorModel({
      draft: createSectionEntryDraft(sectionWithCustomField),
      section: sectionWithCustomField,
      world,
    });

    expect(model.extraDetails).toMatchObject({
      id: 'timelineEditorDetails',
      label: 'Additional details',
      fields: [expect.objectContaining({ key: 'prophecy' })],
    });
  });

  it('seeds new timeline editor models from route context and staged links', () => {
    const world = createSeedWorld();
    const section = world.entryTypes.find((item) => item.id === 'timeline');
    if (!section) {
      throw new Error('Expected timeline section.');
    }
    const stagedRelationship = createTimelineInvolvedRecordStagedRelationship(
      'place-northwatch-harbor',
      'staged-context-link'
    );
    if (!stagedRelationship) {
      throw new Error('Expected staged relationship.');
    }
    const model = getTimelineEventEditorModel({
      draft: createSectionEntryDraft(section, {
        timelineEra: 'Northwatch Era',
      }),
      section,
      stagedRelationships: [stagedRelationship],
      world,
    });

    expect(model.title).toBe('New Timeline Event');
    expect(model.submitLabel).toBe('Create Timeline Event And 1 Link');
    expect(
      model.chronology.fields.find((field) => field.key === 'era')?.value
    ).toBe('Northwatch Era');
    expect(model.involvedRecords.selectedRecords).toEqual([
      expect.objectContaining({
        id: 'place-northwatch-harbor',
        selected: true,
      }),
    ]);
  });

  it('warns when duplicate staged timeline involved links will be pruned', () => {
    const world = createSeedWorld();
    const section = world.entryTypes.find((item) => item.id === 'timeline');
    if (!section) {
      throw new Error('Expected timeline section.');
    }
    const stagedRelationship = createTimelineInvolvedRecordStagedRelationship(
      'faction-cartographers-guild',
      'staged-context-link'
    );
    const duplicateStagedRelationship =
      createTimelineInvolvedRecordStagedRelationship(
        'faction-cartographers-guild',
        'staged-duplicate-context-link'
      );
    if (!stagedRelationship || !duplicateStagedRelationship) {
      throw new Error('Expected staged relationships.');
    }
    const model = getTimelineEventEditorModel({
      draft: createSectionEntryDraft(section),
      section,
      stagedRelationships: [stagedRelationship, duplicateStagedRelationship],
      world,
    });

    expect(model.submitLabel).toBe('Create Timeline Event And 1 Link');
    expect(model.involvedRecords.duplicateStagedTargetIds).toEqual([
      'faction-cartographers-guild',
    ]);
    expect(model.involvedRecords.duplicateStagedTargetLabel).toBe(
      timelineFeatureCopy.duplicateStagedInvolvedRecordLabel
    );
  });

  it('surfaces legacy involved-record text as cleanup support', () => {
    const world = createSeedWorld();
    const section = world.entryTypes.find((item) => item.id === 'timeline');
    const event = world.codex.timeline.find(
      (entry) => entry.id === 'timeline-harbor-accord'
    );
    if (!section || !event) {
      throw new Error('Expected seeded timeline event.');
    }
    const draft = draftFromEntry(
      {
        ...event,
        fields: {
          ...event.fields,
          involvedRecords: 'Mira Rowan',
        },
      },
      section
    );
    const model = getTimelineEventEditorModel({
      draft,
      section,
      selectedEntry: event,
      world,
    });

    expect(model.involvedRecords.legacyText).toMatchObject({
      label: 'Involved records',
      value: 'Mira Rowan',
      exactMatchCount: 1,
      canMigrate: true,
    });
  });

  it('reads numeric timeline order values with an unsorted fallback', () => {
    expect(
      getTimelineOrderValue(timelineEvent('one', 'One', '12', 'Era'))
    ).toBe(12);
    expect(
      getTimelineOrderValue(timelineEvent('bad', 'Bad', 'unknown', 'Era'))
    ).toBe(Number.POSITIVE_INFINITY);
  });

  it('sorts events by order and groups them by era', () => {
    const early = timelineEvent('early', 'Early', '1', 'First Era');
    const later = timelineEvent('later', 'Later', '20', 'Second Era');
    const sameOrder = timelineEvent('same', 'Same', '20', 'Second Era');

    expect(sortTimelineEvents([later, sameOrder, early])).toEqual([
      early,
      later,
      sameOrder,
    ]);
    expect(groupTimelineEventsByEra([later, early])).toEqual([
      { era: 'First Era', events: [early] },
      { era: 'Second Era', events: [later] },
    ]);
  });

  it('returns order updates for moving events earlier or later', () => {
    const first = timelineEvent('first', 'First', '10', 'Era');
    const second = timelineEvent('second', 'Second', '20', 'Era');
    const third = timelineEvent('third', 'Third', '', 'Era');

    expect(
      getTimelineOrderUpdates([first, second, third], 'second', 'earlier').map(
        (event) => [event.id, event.fields.order]
      )
    ).toEqual([
      ['second', '10'],
      ['first', '20'],
    ]);
    expect(
      getTimelineOrderUpdates([first, second, third], 'second', 'later').map(
        (event) => [event.id, event.fields.order]
      )
    ).toEqual([
      ['second', '30'],
      ['third', '20'],
    ]);
    expect(
      getTimelineOrderUpdates([first, second], 'first', 'earlier')
    ).toEqual([]);
  });

  it('returns sorted eras from a timeline list', () => {
    expect(
      getTimelineEras([
        timelineEvent('second', 'Second', '2', 'Second Era'),
        timelineEvent('first', 'First', '1', 'First Era'),
      ])
    ).toEqual(['First Era', 'Second Era']);
  });

  it('builds an era manager model with counts and unassigned events', () => {
    expect(
      getTimelineEraManagerModel([
        timelineEvent('second-a', 'Second A', '2', 'Second Era'),
        timelineEvent('unassigned', 'Unassigned', '3', ''),
        timelineEvent('first', 'First', '1', 'First Era'),
        timelineEvent('second-b', 'Second B', '4', 'Second Era'),
      ])
    ).toEqual({
      eras: [
        { era: 'First Era', eventCount: 1 },
        { era: 'Second Era', eventCount: 2 },
      ],
      namedEraCountLabel: '2 named eras',
      totalEraCount: 2,
      unassignedCount: 1,
    });
  });

  it('builds era reassignment updates for renaming, merging, and assigning unassigned events', () => {
    const first = timelineEvent('first', 'First', '1', 'First Era');
    const second = timelineEvent('second', 'Second', '2', 'First Era');
    const third = timelineEvent('third', 'Third', '3', 'Second Era');
    const unassigned = timelineEvent('unassigned', 'Unassigned', '4', '');

    expect(
      getTimelineEraReassignmentUpdates([first, second, third, unassigned], {
        sourceEra: 'First Era',
        targetEra: 'Founding Era',
        updatedAt: '2026-07-05T12:00:00.000Z',
      }).map((event) => [event.id, event.fields.era, event.updatedAt])
    ).toEqual([
      ['first', 'Founding Era', '2026-07-05T12:00:00.000Z'],
      ['second', 'Founding Era', '2026-07-05T12:00:00.000Z'],
    ]);

    expect(
      getTimelineEraReassignmentUpdates([first, unassigned], {
        sourceEra: '',
        targetEra: 'Founding Era',
      }).map((event) => [event.id, event.fields.era])
    ).toEqual([['unassigned', 'Founding Era']]);

    expect(
      getTimelineEraReassignmentUpdates([first], {
        sourceEra: 'First Era',
        targetEra: ' First Era ',
      })
    ).toEqual([]);
  });

  it('filters timeline events by era, tag, status, and involved entry', () => {
    const world = createSeedWorld();
    const events = world.codex.timeline;

    expect(
      getTimelineInvolvedEntryIds(events[0], world.relationships)
    ).toContain('lore-waystones');
    expect(
      filterTimelineEvents(
        events,
        {
          era: 'Survey Era',
          tag: 'survey',
          status: 'draft',
          involvedEntryId: 'lore-waystones',
        },
        world.relationships
      ).map((event) => event.id)
    ).toEqual(['timeline-first-survey']);

    expect(
      filterTimelineEvents(
        [timelineEvent('unassigned', 'Unassigned', '1', '')],
        {
          era: timelineUnassignedEraFilterValue,
          tag: '',
          status: '',
          involvedEntryId: '',
        },
        []
      ).map((event) => event.id)
    ).toEqual(['unassigned']);
  });

  it('reports timeline ordering and relationship diagnostics', () => {
    const duplicateA = timelineEvent('duplicate-a', 'Duplicate A', '10', 'Era');
    const duplicateB = timelineEvent('duplicate-b', 'Duplicate B', '10', 'Era');
    const unordered = timelineEvent('unordered', 'Unordered', '', 'Era');

    expect(
      getTimelineDiagnostics(
        [duplicateA, duplicateB, unordered],
        [
          {
            id: 'relationship-timeline',
            sourceEntryId: 'duplicate-a',
            targetEntryId: 'character-mira-rowan',
            type: 'references',
            directional: true,
            note: '',
            status: 'draft',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ]
      )
    ).toMatchObject({
      unorderedEvents: [{ id: 'unordered' }],
      duplicateOrderGroups: [
        {
          order: 10,
          events: [{ id: 'duplicate-a' }, { id: 'duplicate-b' }],
        },
      ],
      unlinkedEvents: [{ id: 'duplicate-b' }, { id: 'unordered' }],
    });
  });

  it('builds a shared timeline review tray model', () => {
    const duplicateA = timelineEvent('duplicate-a', 'Duplicate A', '10', 'Era');
    const duplicateB = timelineEvent('duplicate-b', 'Duplicate B', '10', 'Era');
    const unordered = timelineEvent('unordered', 'Unordered', '', 'Era');

    expect(
      getTimelineReviewModel(
        [duplicateA, duplicateB, unordered],
        [
          {
            id: 'relationship-timeline',
            sourceEntryId: 'duplicate-a',
            targetEntryId: 'character-mira-rowan',
            type: 'references',
            directional: true,
            note: '',
            status: 'draft',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ]
      )
    ).toEqual({
      title: 'Timeline Review',
      totalIssueCount: 4,
      hasIssues: true,
      reviewSummary: {
        hasIssues: true,
        totalIssueCount: 4,
        items: [
          {
            id: 'unordered-events',
            title: 'Unordered events',
            count: 1,
            countLabel: '1',
            detail: 'Events without a numeric sort order.',
            hasIssues: true,
            severity: 'warning',
          },
          {
            id: 'duplicate-orders',
            title: 'Duplicate orders',
            count: 1,
            countLabel: '1',
            detail: 'Order values shared by more than one event.',
            hasIssues: true,
            severity: 'warning',
          },
          {
            id: 'unlinked-events',
            title: 'Unlinked events',
            count: 2,
            countLabel: '2',
            detail: 'Events with no involved records.',
            hasIssues: true,
            severity: 'warning',
          },
        ],
      },
      items: [
        {
          id: 'unordered-events',
          title: 'Unordered events',
          count: 1,
          summary: 'Events without a numeric sort order.',
          itemLabels: ['Unordered'],
          targets: [{ label: 'Unordered', eventIds: ['unordered'] }],
        },
        {
          id: 'duplicate-orders',
          title: 'Duplicate orders',
          count: 1,
          summary: 'Order values shared by more than one event.',
          itemLabels: ['10: Duplicate A, Duplicate B'],
          targets: [
            {
              label: '10: Duplicate A, Duplicate B',
              eventIds: ['duplicate-a', 'duplicate-b'],
            },
          ],
        },
        {
          id: 'unlinked-events',
          title: 'Unlinked events',
          count: 2,
          summary: 'Events with no involved records.',
          itemLabels: ['Duplicate B', 'Unordered'],
          targets: [
            { label: 'Duplicate B', eventIds: ['duplicate-b'] },
            { label: 'Unordered', eventIds: ['unordered'] },
          ],
        },
      ],
    });
  });

  it('returns sorted non-archived timeline highlights', () => {
    const early = timelineEvent('early', 'Early', '1', 'Era');
    const archived = {
      ...timelineEvent('archived', 'Archived', '2', 'Era'),
      status: 'archived' as const,
    };
    const later = timelineEvent('later', 'Later', '3', 'Era');

    expect(getTimelineHighlights([later, archived, early])).toEqual([
      early,
      later,
    ]);
  });

  it('builds a shared timeline summary model', () => {
    expect(getTimelineSummaryModel(createSeedWorld())).toEqual({
      highlightNames: ['Harbor Accord Signed', 'First Northern Survey'],
      unorderedCount: 0,
      duplicateOrderCount: 0,
      unlinkedCount: 0,
    });
  });

  it('builds shared timeline event display items', () => {
    const world = createSeedWorld();
    const item = getTimelineEventItem(world, world.codex.timeline[0]);

    expect(item).toMatchObject({
      contextText: '10 - Year 10 of the Harbor Charter',
      dateText: 'Year 10 of the Harbor Charter',
      involvedEntriesAccessibilityLabel:
        'First Northern Survey involved entries',
      moveEarlierAccessibilityLabel: 'Move First Northern Survey earlier',
      moveEarlierLabel: 'Earlier',
      moveLaterAccessibilityLabel: 'Move First Northern Survey later',
      moveLaterLabel: 'Later',
      openAccessibilityLabel: 'Open First Northern Survey',
      openLabel: 'Open Event',
      orderText: '10',
      reviewContextAccessibilityLabel:
        'Review context for First Northern Survey',
      reviewContextLabel: 'Review Context',
      summaryText:
        'A small crew charted the first reliable route between the harbor and the inland highlands.',
    });
  });

  it('builds a shared timeline surface model for overview rendering', () => {
    const world = createSeedWorld();
    const surface = getTimelineSurfaceModel(world, world.codex.timeline);

    expect(surface.eventCount).toBe(2);
    expect(surface.review).toMatchObject({
      title: 'Timeline Review',
      totalIssueCount: 0,
    });
    expect(surface.eraManager).toMatchObject({
      namedEraCountLabel: '2 named eras',
      totalEraCount: 2,
      unassignedCount: 0,
    });
    expect(surface.highlights.map((event) => event.name)).toEqual([
      'Harbor Accord Signed',
      'First Northern Survey',
    ]);
    expect(surface.sortedEvents.map((event) => event.name)).toEqual([
      'Harbor Accord Signed',
      'First Northern Survey',
    ]);
    expect(surface.groups.map((group) => group.era)).toEqual([
      'Charter Era',
      'Survey Era',
    ]);
  });

  it('builds shared timeline browse groups and filter options', () => {
    const world = createSeedWorld();
    const browse = getTimelineBrowseModel(world, {
      era: '',
      involvedEntryId: 'faction-cartographers-guild',
      status: '',
      tag: '',
    });

    expect(browse.eras).toEqual(['Charter Era', 'Survey Era']);
    expect(browse.involvedEntries.map((entry) => entry.name)).toContain(
      'The Cartographers Guild'
    );
    expect(browse.groups).toEqual([
      {
        era: 'Charter Era',
        events: [
          expect.objectContaining({
            name: 'Harbor Accord Signed',
            contextText: '4 - Year 4 of the Harbor Charter',
            dateLabel: 'Year 4 of the Harbor Charter',
            dateText: 'Year 4 of the Harbor Charter',
            involvedEntryNames: ['The Cartographers Guild'],
            orderText: '4',
            summaryText:
              'Guild officers, shipwrights, and patrons agreed on shared map fees and expedition rules.',
          }),
        ],
      },
    ]);
    expect(browse.review).toMatchObject({
      title: 'Timeline Review',
      totalIssueCount: 0,
      hasIssues: false,
    });
    expect(browse.unorderedNames).toEqual([]);
    expect(browse.duplicateOrderLabels).toEqual([]);
    expect(browse.unlinkedNames).toEqual([]);
  });

  it('keeps timeline browsing aligned with section search and archive visibility', () => {
    const world = createSeedWorld();
    const archivedWorld = {
      ...world,
      codex: {
        ...world.codex,
        timeline: world.codex.timeline.map((event) =>
          event.id === 'timeline-harbor-accord'
            ? {
                ...event,
                status: 'archived' as const,
              }
            : event.id === 'timeline-first-survey'
            ? {
                ...event,
                fields: {
                  ...event.fields,
                  order: '',
                },
              }
            : event
        ),
      },
    };

    expect(
      getTimelineBrowseModel(world, {
        era: '',
        involvedEntryId: '',
        query: 'harbor accord',
        status: '',
        tag: '',
      }).groups.flatMap((group) => group.events.map((event) => event.name))
    ).toEqual(['Harbor Accord Signed']);
    expect(
      getTimelineBrowseModel(archivedWorld, {
        era: '',
        involvedEntryId: '',
        query: 'harbor accord',
        status: '',
        tag: '',
      }).groups
    ).toEqual([]);
    expect(
      getTimelineBrowseModel(archivedWorld, {
        era: '',
        involvedEntryId: '',
        query: 'harbor accord',
        status: '',
        tag: '',
      }).unorderedNames
    ).toEqual([]);
    expect(
      getTimelineBrowseModel(archivedWorld, {
        era: '',
        involvedEntryId: '',
        query: 'harbor accord',
        status: '',
        tag: '',
      }).involvedEntries
    ).toEqual([]);
    expect(
      getTimelineBrowseModel(archivedWorld, {
        era: '',
        involvedEntryId: '',
        query: 'harbor accord',
        showArchived: true,
        status: '',
        tag: '',
      }).groups.flatMap((group) => group.events.map((event) => event.name))
    ).toEqual(['Harbor Accord Signed']);
    expect(
      getTimelineBrowseModel(archivedWorld, {
        era: '',
        involvedEntryId: '',
        query: 'harbor accord',
        showArchived: true,
        status: '',
        tag: '',
      }).unorderedNames
    ).toEqual([]);
    expect(
      getTimelineBrowseModel(archivedWorld, {
        era: '',
        involvedEntryId: '',
        query: 'harbor accord',
        showArchived: true,
        status: '',
        tag: '',
      }).involvedEntries.map((entry) => entry.name)
    ).toEqual(['The Cartographers Guild']);
  });
});
