import { describe, expect, it } from '@jest/globals';
import {
  filterTimelineEvents,
  getTimelineDiagnostics,
  getTimelineEras,
  getTimelineHighlights,
  getTimelineInvolvedEntryIds,
  getTimelineOrderValue,
  getTimelineOrderUpdates,
  groupTimelineEventsByEra,
  sortTimelineEvents,
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
});
