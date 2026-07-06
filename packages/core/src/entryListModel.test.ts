import { describe, expect, it } from '@jest/globals';
import { createSeedWorldDocument } from './seedCodex';
import { getActiveWorld } from './worldDocument';
import {
  entryListCopy,
  formatEntryListShownCount,
  formatEntrySectionEntriesLabel,
  formatEntrySectionFiltersLabel,
  formatEntrySectionSearchLabel,
  getEntryListEmptyStateModel,
  getEntryListModel,
  getEntrySectionNavigationOptions,
  getEntryTagFilterOptions,
} from './entryListModel';
import { timelineUnassignedEraFilterValue } from './codexTimeline';

describe('entry list model', () => {
  it('centralizes entry list command labels', () => {
    expect(entryListCopy).toEqual({
      clearFiltersLabel: 'Clear Filters',
      entryHelpLabel: 'Entry Help',
      entriesTitle: 'Entries',
      filterByTagLabel: 'Filter by tag',
      filtersTitle: 'Filters',
      searchSectionLabel: 'Search this section',
      sectionsTitle: 'Sections',
      timelineHelpLabel: 'Timeline Help',
    });
  });

  it('formats shared entry list surface labels', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const section = world.entryTypes[0];

    expect(formatEntryListShownCount(2, 10)).toBe('2 of 10 shown');
    expect(formatEntrySectionEntriesLabel(section)).toBe('Characters entries');
    expect(formatEntrySectionFiltersLabel(section)).toBe('Characters filters');
    expect(formatEntrySectionSearchLabel(section)).toBe('Search Characters');
  });

  it('builds shared section navigation options with active state and paths', () => {
    const world = getActiveWorld(createSeedWorldDocument());

    expect(
      getEntrySectionNavigationOptions(world.entryTypes, 'places')
        .slice(0, 3)
        .map((option) => ({
          id: option.id,
          isActive: option.isActive,
          label: option.label,
          path: option.path,
        }))
    ).toEqual([
      {
        id: 'characters',
        isActive: false,
        label: 'Characters',
        path: '/entries?sectionId=characters',
      },
      {
        id: 'places',
        isActive: true,
        label: 'Places',
        path: '/entries?sectionId=places',
      },
      {
        id: 'factions',
        isActive: false,
        label: 'Factions',
        path: '/entries?sectionId=factions',
      },
    ]);
  });

  it('builds shared tag filter options with optional all-tags control', () => {
    const world = getActiveWorld(createSeedWorldDocument());

    expect(
      getEntryTagFilterOptions(world.codex.characters, 'maps').map(
        (option) => ({
          isActive: option.isActive,
          label: option.label,
          nextValue: option.nextValue,
          value: option.value,
        })
      )
    ).toContainEqual({
      isActive: true,
      label: 'maps',
      nextValue: '',
      value: 'maps',
    });

    expect(
      getEntryTagFilterOptions(world.codex.characters, '', {
        includeAllOption: true,
      })[0]
    ).toEqual({
      isActive: true,
      label: 'All Tags',
      nextValue: '',
      value: '',
    });
  });

  it('builds shared empty states for entry lists', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const section = world.entryTypes[0];

    expect(
      getEntryListEmptyStateModel({
        archivedCount: 0,
        hasActiveFilters: false,
        section,
        showArchived: false,
        totalCount: 0,
      })
    ).toEqual({
      title: 'No characters saved yet.',
      detail:
        'Create a character when you are ready to draft this part of the world.',
      showArchivedAction: false,
      showArchivedActionLabel: null,
    });
    expect(
      getEntryListEmptyStateModel({
        archivedCount: 2,
        hasActiveFilters: false,
        section,
        showArchived: false,
        totalCount: 2,
      })
    ).toEqual({
      title: 'Only archived entries are in this section.',
      detail: 'Show archived entries to review or restore them.',
      showArchivedAction: true,
      showArchivedActionLabel: 'Show Archived',
    });
    expect(
      getEntryListEmptyStateModel({
        archivedCount: 0,
        hasActiveFilters: true,
        section,
        showArchived: true,
        totalCount: 2,
      })
    ).toEqual({
      title: 'No entries match these filters.',
      detail: 'Try a different search term or clear the active filters.',
      showArchivedAction: false,
      showArchivedActionLabel: null,
    });
  });

  it('filters section entries with Valgaron search text', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const section = world.entryTypes[0];

    const rows = getEntryListModel(world, section, 'route sketches');

    expect(rows.map((entry) => entry.name)).toEqual(['Mira Rowan']);
    expect(rows[0]).toMatchObject({
      editAccessibilityLabel: 'Edit Mira Rowan',
      editLabel: 'Edit',
      moveEarlierAccessibilityLabel: null,
      moveEarlierLabel: null,
      moveLaterAccessibilityLabel: null,
      moveLaterLabel: null,
      reviewContextAccessibilityLabel: 'Review context for Mira Rowan',
      reviewContextLabel: 'Context',
      statusLabel: 'Draft',
      summaryText:
        'A careful surveyor keeping field notes, route sketches, and practical warnings for new expeditions.',
      tagsText: 'surveyor, routes, maps',
    });
    expect(rows[0].updatedText).toMatch(/^Updated /);
  });

  it('can include archived entries for restore workflows', () => {
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

    expect(getEntryListModel(archivedWorld, section, '')).toEqual([]);
    expect(
      getEntryListModel(archivedWorld, section, '', { showArchived: true })
    ).toHaveLength(1);
    expect(
      getEntryListModel(archivedWorld, section, '', {
        status: 'archived',
      }).map((entry) => entry.status)
    ).toEqual(['archived']);
  });

  it('filters section entries by status, tag, and updated date', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const section = world.entryTypes[0];

    expect(
      getEntryListModel(world, section, '', { status: 'draft' }).map(
        (entry) => entry.name
      )
    ).toEqual(['Mira Rowan', 'Tomas Quill']);
    expect(
      getEntryListModel(world, section, '', { activeTag: 'maps' }).map(
        (entry) => entry.name
      )
    ).toEqual(['Mira Rowan']);
    expect(
      getEntryListModel(world, section, '', {
        now: new Date('2026-06-02T00:00:00.000Z'),
        updatedWithinDays: 3,
      }).map((entry) => entry.name)
    ).toEqual(['Mira Rowan']);
  });

  it('sorts section entries with shared browsing options', () => {
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

    expect(
      getEntryListModel(sortedWorld, section, '', {
        sortKey: 'updated-desc',
      }).map((entry) => entry.name)
    ).toEqual(['Zara Rowan', 'Aster Quill']);
    expect(
      getEntryListModel(sortedWorld, section, '', {
        sortKey: 'created-desc',
      }).map((entry) => entry.name)
    ).toEqual(['Aster Quill', 'Zara Rowan']);
    expect(
      getEntryListModel(sortedWorld, section, '', { sortKey: 'name' }).map(
        (entry) => entry.name
      )
    ).toEqual(['Aster Quill', 'Zara Rowan']);
  });

  it('orders timeline entries by shared timeline sort rules', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const section = world.entryTypes.find((item) => item.id === 'timeline');

    expect(section).toBeDefined();
    const rows = getEntryListModel(world, section!, '', {});

    expect(rows.map((entry) => entry.name)).toEqual([
      'Harbor Accord Signed',
      'First Northern Survey',
    ]);
    expect(rows[0]).toMatchObject({
      moveEarlierAccessibilityLabel: 'Move Harbor Accord Signed earlier',
      moveEarlierLabel: 'Earlier',
      moveLaterAccessibilityLabel: 'Move Harbor Accord Signed later',
      moveLaterLabel: 'Later',
    });
  });

  it('filters timeline entries to unassigned eras', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const section = world.entryTypes.find((item) => item.id === 'timeline');
    const worldWithUnassignedEvent = {
      ...world,
      codex: {
        ...world.codex,
        timeline: world.codex.timeline.map((event) =>
          event.id === 'timeline-first-survey'
            ? { ...event, fields: { ...event.fields, era: '' } }
            : event
        ),
      },
    };

    expect(section).toBeDefined();
    expect(
      getEntryListModel(worldWithUnassignedEvent, section!, '', {
        timelineEra: timelineUnassignedEraFilterValue,
      }).map((entry) => entry.name)
    ).toEqual(['First Northern Survey']);
  });
});
