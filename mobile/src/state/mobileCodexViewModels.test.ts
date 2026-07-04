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
  getMobileBrokenRelationshipList,
  getMobileEntryRelationshipGroups,
  getMobileEntryRelationshipSummary,
  getMobileEntryList,
  getMobileOrphanedRelationshipEntries,
  getMobileOverviewEntryHighlights,
  getMobileOverviewSummary,
  getMobileOverviewSearchResults,
  getMobileRelationshipEntryPickerItems,
  getMobileRelationshipGraphView,
  getMobileRelationshipHealthSummary,
  getMobileRelationshipList,
  getMobileTimelineBrowseView,
  getMobileTimelineSummary,
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
    expect(
      getMobileEntryList(world, section, '', {
        now: new Date('2026-06-02T00:00:00.000Z'),
        updatedWithinDays: 3,
      }).map((entry) => entry.name)
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
      'Recently updated',
      'Recently created',
      'Timeline order',
      'Name',
      'Status',
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

  it('groups place linked records for mobile place detail sections', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const harbor = world.codex.places[0];
    const groupedWorld = {
      ...world,
      relationships: [
        {
          ...world.relationships[0],
          id: 'relationship-harbor-forest',
          sourceEntryId: harbor.id,
          targetEntryId: 'place-glassroot-forest',
          type: 'located in',
        },
        {
          ...world.relationships[0],
          id: 'relationship-harbor-guild',
          sourceEntryId: harbor.id,
          targetEntryId: 'faction-cartographers-guild',
          type: 'controlled by',
        },
        ...world.relationships,
      ],
    };

    expect(
      getMobileEntryRelationshipGroups(groupedWorld, harbor)
    ).toMatchObject([
      {
        id: 'location',
        label: 'Location and parent places',
        relationships: [
          {
            relatedEntryId: 'place-glassroot-forest',
            relatedEntryName: 'Glassroot Forest',
            type: 'located in',
          },
        ],
      },
      {
        id: 'power',
        label: 'Control and claims',
        relationships: [
          {
            relatedEntryId: 'faction-cartographers-guild',
            relatedEntryName: 'The Cartographers Guild',
            type: 'controlled by',
          },
        ],
      },
    ]);
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

  it('exposes relationship graph, broken-link, and orphan data for mobile repair workflows', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const brokenWorld = {
      ...world,
      relationships: [
        {
          ...world.relationships[0],
          id: 'relationship-broken-source',
          sourceEntryId: 'missing-character',
        },
        ...world.relationships,
      ],
    };
    const graph = getMobileRelationshipGraphView(world, {
      sectionId: '',
      status: '',
      tag: '',
      type: 'member of',
    });

    expect(graph.nodes.map((node) => node.name)).toContain('Mira Rowan');
    expect(graph.edges).toEqual([
      expect.objectContaining({
        label: 'member of',
        sourceName: 'Mira Rowan',
        targetName: 'The Cartographers Guild',
      }),
    ]);
    expect(getMobileBrokenRelationshipList(brokenWorld)).toEqual([
      expect.objectContaining({
        id: 'relationship-broken-source',
        missingSource: true,
        missingTarget: false,
        sourceName: 'missing-character',
      }),
    ]);
    expect(
      getMobileOrphanedRelationshipEntries(world).map((entry) => entry.name)
    ).toEqual(['Northwatch Harbor', 'The Ember Court']);
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

  it('groups and filters timeline browsing with shared relationship involvement rules', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const browse = getMobileTimelineBrowseView(world, {
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
            dateLabel: 'Year 4 of the Harbor Charter',
            involvedEntryNames: ['The Cartographers Guild'],
          }),
        ],
      },
    ]);
    expect(browse.unorderedNames).toEqual([]);
    expect(browse.duplicateOrderLabels).toEqual([]);
    expect(browse.unlinkedNames).toEqual([]);
  });

  it('keeps mobile timeline browsing aligned with section search and archive visibility', () => {
    const world = getActiveWorld(createSeedWorldDocument());
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
      getMobileTimelineBrowseView(world, {
        era: '',
        involvedEntryId: '',
        query: 'harbor accord',
        status: '',
        tag: '',
      }).groups.flatMap((group) => group.events.map((event) => event.name))
    ).toEqual(['Harbor Accord Signed']);
    expect(
      getMobileTimelineBrowseView(archivedWorld, {
        era: '',
        involvedEntryId: '',
        query: 'harbor accord',
        status: '',
        tag: '',
      }).groups
    ).toEqual([]);
    expect(
      getMobileTimelineBrowseView(archivedWorld, {
        era: '',
        involvedEntryId: '',
        query: 'harbor accord',
        status: '',
        tag: '',
      }).unorderedNames
    ).toEqual([]);
    expect(
      getMobileTimelineBrowseView(archivedWorld, {
        era: '',
        involvedEntryId: '',
        query: 'harbor accord',
        status: '',
        tag: '',
      }).involvedEntries
    ).toEqual([]);
    expect(
      getMobileTimelineBrowseView(archivedWorld, {
        era: '',
        involvedEntryId: '',
        query: 'harbor accord',
        showArchived: true,
        status: '',
        tag: '',
      }).groups.flatMap((group) => group.events.map((event) => event.name))
    ).toEqual(['Harbor Accord Signed']);
    expect(
      getMobileTimelineBrowseView(archivedWorld, {
        era: '',
        involvedEntryId: '',
        query: 'harbor accord',
        showArchived: true,
        status: '',
        tag: '',
      }).unorderedNames
    ).toEqual([]);
    expect(
      getMobileTimelineBrowseView(archivedWorld, {
        era: '',
        involvedEntryId: '',
        query: 'harbor accord',
        showArchived: true,
        status: '',
        tag: '',
      }).involvedEntries.map((entry) => entry.name)
    ).toEqual(['The Cartographers Guild']);
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
});
