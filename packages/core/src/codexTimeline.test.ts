import { describe, expect, it } from '@jest/globals';
import {
  filterTimelineEvents,
  getTimelineEventItem,
  getTimelineEventDateLabel,
  getTimelineEventOrderLabel,
  getTimelineBrowseModel,
  getTimelineDiagnostics,
  getTimelineEras,
  getTimelineHighlights,
  getTimelineInvolvedEntryIds,
  getTimelineOrderValue,
  getTimelineOrderUpdates,
  getTimelineSummaryModel,
  groupTimelineEventsByEra,
  sortTimelineEvents,
  timelineFeatureCopy,
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
  };
}

describe('codex timeline helpers', () => {
  it('centralizes timeline browser labels and fallbacks', () => {
    expect(timelineFeatureCopy).toMatchObject({
      timelineBrowserTitle: 'Timeline Browser',
      anyEraLabel: 'Any Era',
      anyInvolvedLabel: 'Any Involved',
      clearTimelineFiltersLabel: 'Clear Timeline Filters',
      noTimelineEventsMatchFilters: 'No timeline events match these filters.',
      unorderedEventsLabel: 'Unordered events',
      duplicateOrdersLabel: 'Duplicate orders',
      unlinkedEventsLabel: 'Unlinked events',
    });
    expect(getTimelineEventDateLabel({ dateLabel: '' })).toBe('No date');
    expect(getTimelineEventDateLabel({ dateLabel: 'Year 4' })).toBe('Year 4');
    expect(getTimelineEventOrderLabel({ order: '' })).toBe('No order');
    expect(getTimelineEventOrderLabel({ order: '10' })).toBe('10');
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
      orderText: '10',
      summaryText:
        'A small crew charted the first reliable route between the harbor and the inland highlands.',
    });
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
