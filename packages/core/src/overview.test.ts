import { describe, expect, it } from '@jest/globals';
import { createSeedWorldDocument } from './seedCodex';
import {
  getCodexOverviewSummary,
  getVisibleWorkspaceEntries,
  getWorkspaceOverviewEntryHighlights,
} from './overview';
import { getActiveWorld } from './worldDocument';

describe('overview summary', () => {
  it('summarizes the active workspace with section counts', () => {
    expect(getCodexOverviewSummary(createSeedWorldDocument())).toMatchObject({
      workspaceName: 'Sample Atlas',
      worldCount: 1,
      activeWorkspaceCount: 1,
      archivedWorkspaceCount: 0,
      entryCount: 10,
      visibleEntryCount: 10,
      archivedEntryCount: 0,
      relationshipCount: 5,
      sectionCounts: {
        characters: 2,
        places: 2,
        factions: 2,
        lore: 2,
        timeline: 2,
      },
    });
  });

  it('builds shared pinned and recent entry highlights without archived records', () => {
    const document = createSeedWorldDocument();
    const world = getActiveWorld(document);
    const archivedPinnedEntry = {
      ...world.codex.characters[0],
      id: 'character-archived-pinned',
      name: 'Archived Pinned',
      pinned: true,
      status: 'archived' as const,
      updatedAt: '2030-01-01T00:00:00.000Z',
    };
    const editedWorld = {
      ...world,
      codex: {
        ...world.codex,
        characters: [archivedPinnedEntry, ...world.codex.characters],
      },
    };

    const visibleEntries = getVisibleWorkspaceEntries(editedWorld);
    const highlights = getWorkspaceOverviewEntryHighlights(editedWorld, 2);

    expect(
      visibleEntries.some((entry) => entry.id === archivedPinnedEntry.id)
    ).toBe(false);
    expect(highlights.pinned.map((entry) => entry.id)).not.toContain(
      archivedPinnedEntry.id
    );
    expect(highlights.recent).toHaveLength(2);
    expect(highlights.recent.map((entry) => entry.updatedAt)).toEqual(
      [...highlights.recent]
        .map((entry) => entry.updatedAt)
        .sort((first, second) => second.localeCompare(first))
    );
  });
});
