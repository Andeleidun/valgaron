import { describe, expect, it } from '@jest/globals';
import {
  createSeedWorldDocument,
  getActiveWorld,
  type WorldCodex,
} from '@valgaron/core';
import {
  createMobileEntryDraft,
  createMobileEntryTemplateDraft,
  applyMobileEntrySectionTemplate,
  getLocalDeviceStatusText,
  getMobileDataStorageStatus,
  getMobileEntryRelationshipSummary,
  getMobileEntryList,
  getMobileOverviewEntryHighlights,
  getMobileOverviewSummary,
  getMobileOverviewSearchResults,
  getMobileRelationshipEntryPickerItems,
  getMobileRecoverySnapshotText,
  getMobileRelationshipHealthSummary,
  getMobileRelationshipList,
  getMobileTimelineSummary,
  getMobileWorkspaceActionState,
  mobileEntrySortOptions,
} from './mobileCodexViewModels';

describe('mobile codex view models', () => {
  it('summarizes the active local world document', () => {
    expect(getMobileOverviewSummary(createSeedWorldDocument())).toMatchObject({
      workspaceName: 'Sample Atlas',
      worldCount: 1,
      activeWorkspaceCount: 1,
      entryCount: 10,
      relationshipCount: 5,
    });
  });

  it('returns compact mobile overview search results', () => {
    const world = getActiveWorld(createSeedWorldDocument());

    expect(
      getMobileOverviewSearchResults(world, 'cartographers').map((entry) => ({
        name: entry.name,
        sectionId: entry.sectionId,
        sectionTitle: entry.sectionTitle,
      }))
    ).toEqual([
      {
        name: 'Mira Rowan',
        sectionId: 'characters',
        sectionTitle: 'Characters',
      },
      {
        name: 'The Cartographers Guild',
        sectionId: 'factions',
        sectionTitle: 'Factions',
      },
    ]);
  });

  it('returns mobile overview pinned and recent entry highlights', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const pinnedWorld = {
      ...world,
      codex: {
        ...world.codex,
        characters: [
          {
            ...world.codex.characters[0],
            pinned: true,
            updatedAt: '2026-06-02T09:00:00.000Z',
          },
          ...world.codex.characters.slice(1),
        ],
        timeline: [
          { ...world.codex.timeline[0], pinned: true },
          ...world.codex.timeline.slice(1),
        ],
      },
    };
    const highlights = getMobileOverviewEntryHighlights(pinnedWorld);

    expect(highlights.pinned.map((entry) => entry.name)).toEqual([
      'Mira Rowan',
      'First Northern Survey',
    ]);
    expect(highlights.recent[0].name).toBe('Mira Rowan');
  });

  it('returns empty overview highlights for a cleared workspace', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const clearedCodex = world.entryTypes.reduce<WorldCodex>(
      (codex, section) => ({
        ...codex,
        [section.id]: [],
      }),
      {
        characters: [],
        places: [],
        factions: [],
        lore: [],
        timeline: [],
      }
    );
    const clearedWorld = {
      ...world,
      codex: clearedCodex,
    };

    expect(getMobileOverviewEntryHighlights(clearedWorld)).toEqual({
      pinned: [],
      recent: [],
    });
  });

  it('filters section entries with Valgaron search text', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const section = world.entryTypes[0];

    expect(
      getMobileEntryList(world, section, 'route sketches').map(
        (entry) => entry.name
      )
    ).toEqual(['Mira Rowan']);
  });

  it('can include archived entries for mobile restore workflows', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const section = world.entryTypes[0];
    const archivedWorld = {
      ...world,
      codex: {
        ...world.codex,
        characters: [
          {
            ...world.codex.characters[0],
            status: 'archived' as const,
          },
        ],
      },
    };

    expect(getMobileEntryList(archivedWorld, section, '')).toEqual([]);
    expect(
      getMobileEntryList(archivedWorld, section, '', { showArchived: true })
    ).toHaveLength(1);
    expect(
      getMobileEntryList(archivedWorld, section, '', {
        status: 'archived',
      }).map((entry) => entry.status)
    ).toEqual(['archived']);
  });

  it('filters mobile section entries by status and tag', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const section = world.entryTypes[0];

    expect(
      getMobileEntryList(world, section, '', { status: 'draft' }).map(
        (entry) => entry.name
      )
    ).toEqual(['Mira Rowan', 'Tomas Quill']);
    expect(
      getMobileEntryList(world, section, '', { activeTag: 'maps' }).map(
        (entry) => entry.name
      )
    ).toEqual(['Mira Rowan']);
  });

  it('sorts mobile section entries with the same options as web browsing', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const section = world.entryTypes[0];
    const sortedWorld = {
      ...world,
      codex: {
        ...world.codex,
        characters: [
          {
            ...world.codex.characters[0],
            name: 'Zara Rowan',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-03T00:00:00.000Z',
          },
          {
            ...world.codex.characters[1],
            name: 'Aster Quill',
            createdAt: '2026-01-04T00:00:00.000Z',
            updatedAt: '2026-01-02T00:00:00.000Z',
          },
        ],
      },
    };

    expect(mobileEntrySortOptions.map((option) => option.label)).toEqual([
      'Updated',
      'Created',
      'Name',
      'Status',
      'Timeline',
    ]);
    expect(
      getMobileEntryList(sortedWorld, section, '', {
        sortKey: 'updated-desc',
      }).map((entry) => entry.name)
    ).toEqual(['Zara Rowan', 'Aster Quill']);
    expect(
      getMobileEntryList(sortedWorld, section, '', {
        sortKey: 'created-desc',
      }).map((entry) => entry.name)
    ).toEqual(['Aster Quill', 'Zara Rowan']);
    expect(
      getMobileEntryList(sortedWorld, section, '', { sortKey: 'name' }).map(
        (entry) => entry.name
      )
    ).toEqual(['Aster Quill', 'Zara Rowan']);
  });

  it('orders mobile timeline entries by shared timeline sort rules', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const section = world.entryTypes.find((item) => item.id === 'timeline');

    expect(section).toBeDefined();
    expect(
      getMobileEntryList(world, section!, '', {}).map((entry) => entry.name)
    ).toEqual(['Harbor Accord Signed', 'First Northern Survey']);
  });

  it('resolves relationship endpoint names for mobile lists', () => {
    const world = getActiveWorld(createSeedWorldDocument());

    expect(getMobileRelationshipList(world)[0]).toMatchObject({
      type: 'member of',
      status: 'canon',
      sourceEntryId: 'character-mira-rowan',
      sourceName: 'Mira Rowan',
      sourceSectionId: 'characters',
      targetEntryId: 'faction-cartographers-guild',
      targetName: 'The Cartographers Guild',
      targetSectionId: 'factions',
      directionLabel: '->',
    });
    expect(
      getMobileRelationshipList(world, 'member of').map((item) => item.type)
    ).toEqual(['member of']);
    expect(
      getMobileRelationshipList(world, 'cartographers').some(
        (item) => item.targetName === 'The Cartographers Guild'
      )
    ).toBe(true);
    expect(
      getMobileRelationshipList(world, 'factions').some(
        (item) => item.targetSectionTitle === 'Factions'
      )
    ).toBe(true);
    expect(
      getMobileRelationshipList(world, 'character-mira-rowan').map(
        (item) => item.sourceName
      )
    ).toEqual(['Mira Rowan']);
    expect(
      getMobileRelationshipList(world, '', {
        entryId: 'lore-tide-calendar',
      }).map((item) => item.type)
    ).toEqual(['references']);
    expect(
      getMobileRelationshipList(world, '', {
        type: 'references',
      }).map((item) => item.type)
    ).toEqual(['references', 'references']);
  });

  it('summarizes linked records for a selected mobile entry', () => {
    const world = getActiveWorld(createSeedWorldDocument());

    expect(
      getMobileEntryRelationshipSummary(world, 'character-mira-rowan')[0]
    ).toMatchObject({
      directionLabel: 'To',
      relatedEntryId: 'faction-cartographers-guild',
      relatedEntryName: 'The Cartographers Guild',
      relatedSectionId: 'factions',
      type: 'member of',
    });
  });

  it('filters relationship picker entries by name, section, id, and tags', () => {
    const world = getActiveWorld(createSeedWorldDocument());

    expect(
      getMobileRelationshipEntryPickerItems(world, 'mira').map(
        (entry) => entry.name
      )
    ).toEqual(['Mira Rowan']);
    expect(
      getMobileRelationshipEntryPickerItems(world, 'faction').map(
        (entry) => entry.sectionTitle
      )
    ).toEqual(['Factions', 'Factions']);
    expect(
      getMobileRelationshipEntryPickerItems(world, 'character-mira').map(
        (entry) => entry.id
      )
    ).toEqual(['character-mira-rowan']);
    expect(
      getMobileRelationshipEntryPickerItems(world, 'guild').some(
        (entry) => entry.name === 'The Cartographers Guild'
      )
    ).toBe(true);
  });

  it('summarizes relationship health for mobile diagnostics', () => {
    const world = getActiveWorld(createSeedWorldDocument());

    expect(getMobileRelationshipHealthSummary(world)).toEqual({
      brokenRelationshipCount: 0,
      orphanedEntryCount: 2,
    });
  });

  it('keeps workspace actions aligned with core workspace rules', () => {
    const world = getActiveWorld(createSeedWorldDocument());

    expect(
      getMobileWorkspaceActionState({
        activeWorkspaceId: world.id,
        activeWorkspaceCount: 1,
        workspace: world,
        workspaceCount: 1,
      })
    ).toEqual({
      switchLabel: 'Current',
      canSwitch: false,
      canArchive: false,
      canDelete: false,
    });
    expect(
      getMobileWorkspaceActionState({
        activeWorkspaceId: 'other-workspace',
        activeWorkspaceCount: 2,
        workspace: world,
        workspaceCount: 2,
      })
    ).toEqual({
      switchLabel: 'Switch',
      canSwitch: true,
      canArchive: true,
      canDelete: true,
    });
    expect(
      getMobileWorkspaceActionState({
        activeWorkspaceId: 'other-workspace',
        activeWorkspaceCount: 1,
        workspace: { ...world, status: 'archived' },
        workspaceCount: 2,
      })
    ).toEqual({
      switchLabel: 'Archived',
      canSwitch: false,
      canArchive: true,
      canDelete: true,
    });
  });

  it('summarizes timeline health and highlights for mobile', () => {
    expect(
      getMobileTimelineSummary(getActiveWorld(createSeedWorldDocument()))
    ).toEqual({
      highlightNames: ['Harbor Accord Signed', 'First Northern Survey'],
      unorderedCount: 0,
      duplicateOrderCount: 0,
      unlinkedCount: 0,
    });
  });

  it('creates compact entry drafts', () => {
    const section = getActiveWorld(createSeedWorldDocument()).entryTypes[0];
    const draft = createMobileEntryDraft(section);

    expect(draft.tags).toBe('character');
    expect(draft.details).toEqual({
      role: '',
      home: '',
      affiliation: '',
      statusNote: '',
    });
  });

  it('creates mobile template drafts from existing entries', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const section = world.entryTypes[0];
    const draft = createMobileEntryTemplateDraft(
      world.codex.characters[0],
      section
    );

    expect(draft.name).toBe('Mira Rowan Template');
    expect(draft.status).toBe('draft');
    expect(draft.summary).toBe(world.codex.characters[0].summary);
  });

  it('applies shared section templates to mobile entry drafts', () => {
    const section = getActiveWorld(createSeedWorldDocument()).entryTypes[0];
    const draft = applyMobileEntrySectionTemplate(
      { ...createMobileEntryDraft(section), tags: '', notes: '' },
      section
    );

    expect(draft.tags).toBe('character');
    expect(draft.notes).toContain('## Role in the story');
  });

  it('uses neutral local-device timestamp text', () => {
    const text = getLocalDeviceStatusText('2026-06-01T09:00:00.000Z');

    expect(text).toContain('Jun 1, 2026');
    expect(text).toContain('Document timestamp');
    expect(text).not.toContain('Saved on this device');
  });

  it('summarizes mobile Data storage state without world content', () => {
    const status = getMobileDataStorageStatus({
      lastRecoverySnapshot: {
        createdAt: '2026-06-01T09:00:00.000Z',
        document: createSeedWorldDocument(),
        id: 'snapshot-import-test',
        reason: 'import',
      },
      loadStatus: {
        checkedAt: '2026-06-01T09:00:00.000Z',
        message: 'Loaded saved data.',
        source: 'saved',
      },
      saveMessage: 'Saved to this device.',
    });

    expect(status.loadLine).toContain('Load state: saved');
    expect(status.saveLine).toBe('Device save: Saved to this device.');
    expect(status.recoveryLine).toContain('before import');
    expect(JSON.stringify(status)).not.toContain('Sample Atlas');
    expect(JSON.stringify(status)).not.toContain('Mira Rowan');
  });

  it('formats recovery snapshot summaries with action context', () => {
    expect(
      getMobileRecoverySnapshotText({
        id: 'snapshot-reset-test',
        reason: 'reset',
        createdAt: '2026-06-01T09:00:00.000Z',
        activeWorldName: 'Sample Atlas',
        worldCount: 1,
        entryCount: 10,
        relationshipCount: 5,
      })
    ).toContain('before reset');
    expect(
      getMobileRecoverySnapshotText({
        id: 'snapshot-reset-test',
        reason: 'reset',
        createdAt: '2026-06-01T09:00:00.000Z',
        activeWorldName: 'Sample Atlas',
        worldCount: 1,
        entryCount: 10,
        relationshipCount: 5,
      })
    ).toContain('Jun 1, 2026');
  });
});
