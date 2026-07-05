import { describe, expect, it } from '@jest/globals';
import {
  filterSectionEntries,
  filterTimelineEvents,
  getActiveWorld,
  getBrokenRelationships,
  getEntries,
  getOrphanedEntries,
  getRelationshipGraph,
  getSearchableEntries,
  getTimelineDiagnostics,
  groupTimelineEventsByEra,
  parseWorldImport,
  searchEntries,
  serializeActiveWorldBackup,
  sortEntries,
} from '@valgaron/core';
import { createLargeWorldDocument } from './largeWorldFixtures';

function measure<TResult>(operation: () => TResult): {
  durationMs: number;
  result: TResult;
} {
  const startedAt = performance.now();
  const result = operation();
  return {
    durationMs: performance.now() - startedAt,
    result,
  };
}

describe('large world performance smoke', () => {
  it('keeps search, relationship, timeline, and backup helpers within broad readiness budgets', () => {
    const document = createLargeWorldDocument({
      entriesPerSection: 500,
      relationshipCount: 5000,
      planetaryWorldCount: 24,
    });
    const world = getActiveWorld(document);

    const searchableEntries = measure(() =>
      getSearchableEntries(world.codex, world.entryTypes)
    );
    const globalSearch = measure(() =>
      searchEntries(searchableEntries.result, world.entryTypes, 'route')
    );
    const characterFiltering = measure(() => {
      const characterSection = world.entryTypes.find(
        (section) => section.id === 'characters'
      );
      if (!characterSection) {
        throw new Error('Large fixture is missing characters.');
      }
      const filteredEntries = filterSectionEntries(
        getEntries(world.codex, characterSection.id),
        characterSection,
        {
          query: 'route',
          activeTag: 'shared',
          status: '',
          showArchived: false,
          updatedWithinDays: null,
        }
      );
      return sortEntries(filteredEntries, 'updated-desc');
    });
    const relationshipGraph = measure(() =>
      getRelationshipGraph(world.relationships, world.codex, world.entryTypes)
    );
    const relationshipDiagnostics = measure(() => ({
      broken: getBrokenRelationships(
        world.relationships,
        world.codex,
        world.entryTypes
      ),
      orphaned: getOrphanedEntries(
        world.relationships,
        world.codex,
        world.entryTypes
      ),
    }));
    const timelineEvents = getEntries(world.codex, 'timeline');
    const timelineDerivations = measure(() => ({
      diagnostics: getTimelineDiagnostics(timelineEvents, world.relationships),
      filtered: filterTimelineEvents(
        timelineEvents,
        {
          era: '',
          tag: 'shared',
          status: '',
          involvedEntryId: '',
        },
        world.relationships
      ),
      groups: groupTimelineEventsByEra(timelineEvents),
    }));
    const exportImport = measure(() => {
      const serializedBackup = serializeActiveWorldBackup(document);
      return parseWorldImport(serializedBackup);
    });

    expect(searchableEntries.result).toHaveLength(2500);
    expect(globalSearch.result.length).toBeGreaterThan(1000);
    expect(characterFiltering.result.length).toBeGreaterThan(0);
    expect(relationshipGraph.result.edges.length).toBeGreaterThan(0);
    expect(relationshipDiagnostics.result.broken).toHaveLength(0);
    expect(timelineDerivations.result.groups.length).toBeGreaterThan(0);
    expect(exportImport.result.ok).toBe(true);

    expect(searchableEntries.durationMs).toBeLessThan(100);
    expect(globalSearch.durationMs).toBeLessThan(500);
    expect(characterFiltering.durationMs).toBeLessThan(250);
    expect(relationshipGraph.durationMs).toBeLessThan(500);
    expect(relationshipDiagnostics.durationMs).toBeLessThan(750);
    expect(timelineDerivations.durationMs).toBeLessThan(500);
    expect(exportImport.durationMs).toBeLessThan(2500);
  });
});
