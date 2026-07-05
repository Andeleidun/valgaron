import { describe, expect, it } from '@jest/globals';
import { createSeedWorldDocument } from './seedCodex';
import {
  getCodexOverviewSummary,
  getVisibleWorkspaceEntries,
  getWorkspaceOverviewDisplayEntry,
  getWorkspaceOverviewDraftingPromptCountLabel,
  getWorkspaceOverviewEditEntryAccessibilityLabel,
  getWorkspaceOverviewEntryRoute,
  getWorkspaceOverviewEntryHighlights,
  getWorkspaceOverviewIncompleteEntry,
  getWorkspaceOverviewIncompleteEntries,
  getWorkspaceOverviewModel,
  getWorkspaceOverviewOpenEntryAccessibilityLabel,
  getWorkspaceOverviewQuickCreateActions,
  getWorkspaceOverviewSectionRoute,
  getWorkspaceOverviewWorkspaceKicker,
  getWorkspaceOverviewSearchResults,
  overviewFeatureCopy,
} from './overview';
import { getActiveWorld } from './worldDocument';

describe('overview summary', () => {
  it('centralizes overview empty-state copy', () => {
    expect(overviewFeatureCopy).toMatchObject({
      activeWorkspacesStatLabel: 'Active workspaces',
      clearSearchLabel: 'Clear Search',
      codexTotalsLabel: 'Codex totals',
      currentDraftStateTitle: 'Current Draft State',
      editLabel: 'Edit',
      entriesStatLabel: 'Entries',
      globalSearchKicker: 'Global search',
      globalSearchTitle: 'Find anything in this world',
      incompleteKicker: 'Needs attention',
      incompleteTitle: 'Incomplete records',
      localDataNoticeTitle: 'Local browser data.',
      noRecentRecordsTitle: 'No recent records yet.',
      noRecentRecordsDetail:
        'Create a codex record to start filling this workspace.',
      noSearchResultsDetail: 'Try another name, tag, note, or world detail.',
      noSearchResultsTitle: 'No entries found.',
      noVisibleDraftingPrompts: 'No visible entries need drafting prompts.',
      openDataLabel: 'Open Data',
      openLabel: 'Open',
      pinnedKicker: 'Pinned',
      pinnedTitle: 'Important records',
      quickCreateKicker: 'Quick create',
      quickCreateTitle: 'Start a new record',
      recentKicker: 'Recently updated',
      recentTitle: 'Latest codex work',
      relationshipsStatLabel: 'Relationships',
      searchEntriesLabel: 'Search entries',
      searchHelpText: 'Search names, tags, notes, and detail fields.',
      searchPlaceholder: 'Search codex records',
      workspaceKickerSuffix: 'Workspace',
      workspaceStatLabel: 'Workspace',
    });
  });

  it('builds shared overview helper labels', () => {
    const entry = {
      name: 'Mira Rowan',
    };

    expect(
      getWorkspaceOverviewWorkspaceKicker({ workspaceName: 'Sample Atlas' })
    ).toBe('Sample Atlas Workspace');
    expect(getWorkspaceOverviewDraftingPromptCountLabel(3)).toBe(
      '3 visible entries still have drafting prompts.'
    );
    expect(getWorkspaceOverviewOpenEntryAccessibilityLabel(entry)).toBe(
      'Open Mira Rowan'
    );
    expect(getWorkspaceOverviewEditEntryAccessibilityLabel(entry)).toBe(
      'Edit Mira Rowan'
    );
  });

  it('builds shared overview entry display text', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const entry = getWorkspaceOverviewSearchResults(world, 'route sketches', 1);

    expect(entry[0]).toMatchObject({
      contextText: expect.stringMatching(/^Characters - Updated /),
      name: 'Mira Rowan',
      summaryText:
        'A careful surveyor keeping field notes, route sketches, and practical warnings for new expeditions.',
      updatedText: expect.stringMatching(/^Updated /),
    });
    expect(
      getWorkspaceOverviewDisplayEntry({
        ...entry[0],
        id: 'blank-summary',
        summary: '',
      }).summaryText
    ).toBe('No summary yet.');
  });

  it('builds shared incomplete entry display text', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const [item] = getWorkspaceOverviewIncompleteEntries(world, 1);

    if (!item) {
      throw new Error('Expected at least one incomplete seed entry.');
    }

    expect(item).toMatchObject({
      contextText: expect.stringMatching(/^[A-Za-z ]+ - \d+% complete$/),
      promptText: expect.any(String),
    });
    expect(item?.promptText.length).toBeGreaterThan(0);
    expect(
      getWorkspaceOverviewIncompleteEntry({
        ...item,
        prompts: ['First prompt.', 'Second prompt.', 'Third prompt.'],
      }).promptText
    ).toBe('First prompt. Second prompt.');
  });

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

  it('builds overview search and drafting queues with shared limits', () => {
    const document = createSeedWorldDocument();
    const world = getActiveWorld(document);
    const hiddenArchivedEntry = {
      ...world.codex.characters[0],
      id: 'character-archived-route',
      name: 'Archived Route Keeper',
      status: 'archived' as const,
      summary: 'route sketches',
    };
    const editedWorld = {
      ...world,
      codex: {
        ...world.codex,
        characters: [hiddenArchivedEntry, ...world.codex.characters],
      },
    };

    expect(
      getWorkspaceOverviewSearchResults(editedWorld, 'route sketches', 8).map(
        (entry) => entry.name
      )
    ).toEqual(['Mira Rowan']);
    expect(
      getWorkspaceOverviewIncompleteEntries(editedWorld, 1).map(
        (item) => item.entry.name
      )
    ).toHaveLength(1);
  });

  it('builds shared overview entry edit routes', () => {
    expect(
      getWorkspaceOverviewEntryRoute({
        id: 'character-mira-rowan',
        name: 'Mira Rowan',
        sectionId: 'characters',
      })
    ).toBe(
      '/entries?sectionId=characters&entryId=character-mira-rowan&intent=edit&query=Mira%20Rowan'
    );
  });

  it('builds shared overview section routes', () => {
    expect(getWorkspaceOverviewSectionRoute({ id: 'places' })).toBe(
      '/entries?sectionId=places'
    );
  });

  it('builds shared quick-create actions for every section', () => {
    const world = getActiveWorld(createSeedWorldDocument());

    expect(
      getWorkspaceOverviewQuickCreateActions(world.entryTypes)
        .slice(0, 2)
        .map((action) => ({
          id: action.id,
          label: action.label,
          route: action.route,
          sectionId: action.sectionId,
        }))
    ).toEqual([
      {
        id: 'quick-create-characters',
        label: 'New Character',
        route: '/entries?sectionId=characters&intent=new',
        sectionId: 'characters',
      },
      {
        id: 'quick-create-places',
        label: 'New Place',
        route: '/entries?sectionId=places&intent=new',
        sectionId: 'places',
      },
    ]);
  });

  it('builds the composite overview model with shared limits', () => {
    const document = createSeedWorldDocument();
    const world = getActiveWorld(document);
    const model = getWorkspaceOverviewModel({
      document,
      workspace: world,
      query: 'cartographers',
      searchLimit: 1,
      highlightLimit: 1,
      incompleteLimit: 2,
    });

    expect(model.summary.workspaceName).toBe('Sample Atlas');
    expect(model.sections.map((section) => section.id)).toEqual([
      'characters',
      'places',
      'factions',
      'lore',
      'timeline',
    ]);
    expect(model.quickCreateActions).toHaveLength(model.sections.length);
    expect(model.searchResults.map((entry) => entry.name)).toEqual([
      'Mira Rowan',
    ]);
    expect(model.searchResults[0]?.summaryText).toBe(
      'A careful surveyor keeping field notes, route sketches, and practical warnings for new expeditions.'
    );
    expect(model.entryHighlights.recent).toHaveLength(1);
    expect(model.entryHighlights.recent[0]?.updatedText).toMatch(/^Updated /);
    expect(model.incompleteEntries.length).toBeLessThanOrEqual(2);
    expect(model.incompleteEntries[0]?.contextText).toMatch(
      /^\w+ - \d+% complete$/
    );
  });
});
