import { describe, expect, it } from '@jest/globals';
import { getActiveWorld, getEntries, worldSections } from '@valgaron/core';
import { createLargeWorldDocument } from './largeWorldFixtures';

describe('large world fixtures', () => {
  it('creates deterministic entries, relationships, and in-fiction worlds for every section', () => {
    const document = createLargeWorldDocument({
      entriesPerSection: 12,
      relationshipCount: 40,
      planetaryWorldCount: 3,
    });
    const world = getActiveWorld(document);

    expect(world.name).toBe('Large Fixture Workspace');
    expect(world.planetaryWorlds).toHaveLength(3);
    expect(world.relationships).toHaveLength(40);
    for (const section of worldSections) {
      expect(getEntries(world.codex, section.id)).toHaveLength(12);
    }
  });
});
