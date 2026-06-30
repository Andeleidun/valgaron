import { describe, expect, it } from '@jest/globals';
import {
  filterTimelineEvents,
  getTimelineEras,
  getTimelineInvolvedEntryIds,
  getTimelineOrderValue,
  groupTimelineEventsByEra,
  sortTimelineEvents,
} from './codexTimeline';
import { createSeedWorld } from './seedCodex';
import type { WorldEntry } from '../types';

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

describe('codexTimeline', () => {
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
    ).toContain('lore-dragon-tithe');
    expect(
      filterTimelineEvents(
        events,
        {
          era: 'Late Compact Era',
          tag: 'dragons',
          status: 'draft',
          involvedEntryId: 'lore-dragon-tithe',
        },
        world.relationships
      ).map((event) => event.id)
    ).toEqual(['timeline-gate-sealed']);
  });
});
