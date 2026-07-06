import { describe, expect, it } from '@jest/globals';
import { createSeedWorld } from './seedCodex';
import {
  getWorkbenchRecordIndexItems,
  getWorkbenchRecordIndexModel,
  getWorkbenchSectionActions,
  getWorkbenchRecordPickerModel,
  isWorkbenchRecordViewId,
  workbenchRecordViewLabels,
} from './workbenchRecords';

describe('workbench record index', () => {
  it('builds universal record index items with routes and relationship counts', () => {
    const world = createSeedWorld();
    const records = getWorkbenchRecordIndexItems(world);
    const mira = records.find((record) => record.id === 'character-mira-rowan');

    expect(records).toHaveLength(10);
    expect(mira).toMatchObject({
      id: 'character-mira-rowan',
      name: 'Mira Rowan',
      sectionId: 'characters',
      sectionTitle: 'Characters',
      route:
        '/entries?sectionId=characters&entryId=character-mira-rowan&intent=context&query=Mira%20Rowan',
      editorRoute:
        '/characters?entryId=character-mira-rowan&intent=edit&query=Mira%20Rowan',
      relationshipCount: 1,
      status: 'draft',
    });
    expect(mira?.summaryText).toContain('surveyor');
    expect(mira?.updatedText).toContain('Updated');
  });

  it('builds saved Workbench views for common drafting queues', () => {
    const world = createSeedWorld();
    const archivedCharacter = {
      ...world.codex.characters[0],
      id: 'character-archived',
      name: 'Archived Scout',
      status: 'archived' as const,
    };
    const needsReviewPlace = {
      ...world.codex.places[0],
      id: 'place-needs-review',
      name: 'Review Outpost',
      status: 'needs-review' as const,
      pinned: true,
      fields: {},
    };
    const editedWorld = {
      ...world,
      codex: {
        ...world.codex,
        characters: [...world.codex.characters, archivedCharacter],
        places: [...world.codex.places, needsReviewPlace],
      },
    };

    const model = getWorkbenchRecordIndexModel(editedWorld, {
      selectedEntryId: 'place-needs-review',
      viewId: 'needs-review',
      viewLimit: 3,
    });
    const counts = Object.fromEntries(
      model.views.map((view) => [view.id, view.count])
    );

    expect(model.views.map((view) => view.label)).toEqual(
      Object.values(workbenchRecordViewLabels)
    );
    expect(counts).toMatchObject({
      all: 11,
      archived: 1,
      incomplete: 11,
      pinned: 1,
      unlinked: 3,
      'needs-review': 1,
    });
    expect(model.activeView.id).toBe('needs-review');
    expect(model.activeView.records).toHaveLength(1);
    expect(
      model.views.find((view) => view.id === 'recent')?.records
    ).toHaveLength(3);
    expect(model.selectedContext.record?.id).toBe('place-needs-review');
    expect(model.selectedContext.section?.id).toBe('places');
    expect(model.selectedContext.incompletePrompts.length).toBeGreaterThan(0);
    expect(model.selectedContext.reviewSummary.items).toEqual([
      expect.objectContaining({
        count: model.selectedContext.incompletePrompts.length,
        id: 'drafting-prompts',
        title: 'Drafting prompts',
      }),
      expect.objectContaining({
        count: 0,
        id: 'legacy-link-text',
        title: 'Legacy link text',
      }),
    ]);
  });

  it('validates Workbench view ids for route parameters', () => {
    expect(isWorkbenchRecordViewId('needs-review')).toBe(true);
    expect(isWorkbenchRecordViewId('recent')).toBe(true);
    expect(isWorkbenchRecordViewId('missing')).toBe(false);
    expect(isWorkbenchRecordViewId('')).toBe(false);
  });

  it('builds related record chips for the selected context', () => {
    const model = getWorkbenchRecordIndexModel(createSeedWorld(), {
      selectedEntryId: 'character-mira-rowan',
    });

    expect(model.selectedContext.relatedRecordChips).toEqual([
      expect.objectContaining({
        id: 'faction-cartographers-guild',
        label: 'The Cartographers Guild',
        relationshipId: 'relationship-mira-cartographers-guild',
        relationshipType: 'member of',
        route:
          '/entries?sectionId=factions&entryId=faction-cartographers-guild&intent=context&query=The%20Cartographers%20Guild',
        sectionTitle: 'Factions',
      }),
    ]);
    expect(model.selectedContext.relationshipStudioRoute).toBe(
      '/relationships?entryId=character-mira-rowan&entryQuery=Mira%20Rowan'
    );
    expect(model.selectedContext.reviewSummary).toMatchObject({
      hasIssues: true,
      items: [
        {
          id: 'drafting-prompts',
          title: 'Drafting prompts',
        },
        {
          count: 2,
          countLabel: '2 fields',
          id: 'legacy-link-text',
          title: 'Legacy link text',
        },
      ],
    });
  });

  it('filters the index by shared search before building views', () => {
    const model = getWorkbenchRecordIndexModel(createSeedWorld(), {
      selectedEntryId: 'character-mira-rowan',
      query: 'calendar',
    });

    expect(model.records.map((record) => record.id).sort()).toEqual([
      'lore-tide-calendar',
    ]);
    expect(model.views.find((view) => view.id === 'all')?.count).toBe(1);
    expect(model.selectedContext.record?.id).toBe('character-mira-rowan');
  });

  it('filters the Workbench index by active section before building views', () => {
    const model = getWorkbenchRecordIndexModel(createSeedWorld(), {
      sectionId: 'places',
    });

    expect(model.activeSectionId).toBe('places');
    expect(model.records.map((record) => record.sectionId)).toEqual([
      'places',
      'places',
    ]);
    expect(model.views.find((view) => view.id === 'all')?.count).toBe(2);
    expect(
      model.sectionActions.find((action) => action.sectionId === 'places')
    ).toMatchObject({
      isActive: true,
      label: 'Places',
      recordCount: 2,
    });
  });

  it('builds section actions with create and open routes', () => {
    const world = createSeedWorld();
    const actions = getWorkbenchSectionActions(
      world,
      getWorkbenchRecordIndexItems(world),
      'characters'
    );

    expect(
      actions.find((action) => action.sectionId === 'characters')
    ).toMatchObject({
      createRoute: '/entries?sectionId=characters&intent=new',
      isActive: true,
      openRoute: '/entries?sectionId=characters',
      recordCount: 2,
      singularLabel: 'Character',
    });
  });

  it('returns an empty selected context when no selected record is available', () => {
    const model = getWorkbenchRecordIndexModel(createSeedWorld(), {
      selectedEntryId: 'missing-entry',
    });

    expect(model.selectedContext).toMatchObject({
      record: null,
      section: null,
      relationshipCount: 0,
      relationshipStudioRoute: null,
      relationships: [],
      completionPercent: null,
      incompletePrompts: [],
      reviewSummary: {
        hasIssues: false,
        totalIssueCount: 0,
      },
    });
  });

  it('builds a reusable capped record picker model for relationship workflows', () => {
    const model = getWorkbenchRecordPickerModel(createSeedWorld(), {
      excludedEntryIds: ['character-mira-rowan'],
      limit: 2,
      query: 'guild',
      selectedEntryIds: ['faction-cartographers-guild'],
    });

    expect(model.items.map((item) => item.id)).toEqual([
      'faction-cartographers-guild',
      'timeline-harbor-accord',
    ]);
    expect(model.visibleItems).toHaveLength(2);
    expect(model.hiddenCount).toBe(0);
    expect(model.selectedItems).toEqual([
      expect.objectContaining({
        id: 'faction-cartographers-guild',
        selected: true,
      }),
    ]);
    expect(model.items.some((item) => item.id === 'character-mira-rowan')).toBe(
      false
    );
  });
});
