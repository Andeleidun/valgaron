import { describe, expect, it } from '@jest/globals';
import {
  createEmptyRelationshipDraft,
  deleteRelationship,
  deleteRelationshipsForEntry,
  draftFromRelationship,
  findEntryById,
  filterRelationshipEntryPickerItems,
  filterRelationships,
  getBrokenRelationships,
  getEntryRelationshipGroupsModel,
  getEntryRelationshipSummaryModel,
  getEntryRelationships,
  getCharacterRelationshipGroups,
  getRelationshipDiagnosticsModel,
  getRelationshipEditorOptionsModel,
  getRelationshipEntryContextRoute,
  getRelationshipEntryRoute,
  getRelationshipEntryRouteById,
  getRelationshipListModel,
  getRelationshipManagementRoute,
  getRelationshipStudioModeModel,
  getOrphanedEntries,
  getPlaceRelationshipGroups,
  getRelationshipHealthSummary,
  getRelationshipEntries,
  getRelationshipEntryPickerItems,
  getRelationshipEntrySelectOptions,
  getRelationshipGraph,
  getRelationshipGraphTagOptions,
  getRelationshipGraphViewModel,
  getRelationshipTypeFilterOptions,
  getRelationshipTypeSuggestions,
  getSavedRelationshipTypes,
  relationshipFeatureCopy,
  relationshipTypeOptions,
  relationshipFromDraft,
  upsertRelationship,
} from './codexRelationships';
import {
  getDuplicateRelationshipGroups,
  getRelationshipStudioReviewModel,
} from './relationshipStudioReview';
import {
  createSeedCodex,
  createSeedWorldDocument,
  worldSections,
} from './seedCodex';
import { characterRelationshipTypeOptions } from './characterTaxonomy';
import type { WorldRelationship } from './types';
import { getActiveWorld } from './worldDocument';

const fixedRelationship: WorldRelationship = {
  id: 'relationship-mira-guild',
  sourceEntryId: 'character-mira-rowan',
  targetEntryId: 'faction-cartographers-guild',
  type: 'member of',
  directional: true,
  note: 'Mira files route notes for the guild.',
  status: 'canon',
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-01T09:00:00.000Z',
};

describe('codexRelationships', () => {
  it('centralizes relationship feature empty-state and draft copy', () => {
    expect(relationshipFeatureCopy).toMatchObject({
      clearFiltersLabel: 'Clear Filters',
      clearGraphFiltersLabel: 'Clear Graph Filters',
      helpLabel: 'Relationship Help',
      manageLinksLabel: 'Manage Links',
      openEntryLabel: 'Review Context',
      openSourceLabel: 'Open Source',
      openTargetLabel: 'Open Target',
      filterListLabel: 'Filter List',
      saveRelationshipLabel: 'Save Relationship',
      clearTypeFilterLabel: 'Clear Type Filter',
      clearEntryFilterLabel: 'Clear Entry Filter',
      clearSearchLabel: 'Clear Search',
      clearDraftLabel: 'Clear',
      anySectionLabel: 'Any Section',
      allTagsLabel: 'All Tags',
      deleteLabel: 'Delete',
      editLabel: 'Edit',
      entryPickersTitle: 'Entry Pickers',
      noEntryPickerMatchesMessage: 'No entries match this picker search.',
      repairLabel: 'Repair',
      searchEntriesLabel: 'Search entries',
      searchGraphRecordsLabel: 'Search graph records',
      searchRelationshipsLabel: 'Search relationships',
      sourcePickerLabel: 'Source',
      targetPickerLabel: 'Target',
      healthSectionTitle: 'Relationship Health',
      diagnosticsTitle: 'Diagnostics',
      brokenReferencesLabel: 'Broken references',
      orphanedRecordsLabel: 'Orphaned records',
      duplicateRelationshipsLabel: 'Duplicate Relationships',
      duplicateRelationshipsReviewLabel: 'Duplicate relationship review',
      duplicateRelationshipsDetail:
        'Saved relationships with the same source, target, type, status, direction, and note.',
      duplicateRelationshipsCleanupLabel: 'Remove Duplicate Relationships',
      duplicateRelationshipsCleanupBlockedMessage:
        'Save or discard the current relationship draft before running bulk cleanup.',
      noBrokenRelationshipsTitle: 'No broken relationships.',
      noConnectedGraphMatchesMessage:
        'No connected graph records match these filters.',
      savedSectionTitle: 'Saved Relationships',
      selectedEntrySectionTitle: 'Linked Records',
      selectedEntryEmptyTitle: 'No relationships yet.',
      selectedEntryEmptyDetail:
        'Use the Relationships page to connect this record to the world.',
      graphViewTitle: 'Graph view',
      graphBrowserTitle: 'Graph Browser',
      noGraphTitle: 'No graph yet.',
      noGraphDetail:
        'Graph rows appear once saved relationships have valid endpoints.',
      repairBrokenLinksTitle: 'Repair Broken Links',
      relationshipFormTitle: 'Relationship Form',
      minimumEntriesTitle: 'Create at least two entries first.',
      minimumEntriesDetail: 'Relationships need a source and a target record.',
      unsavedDraftMessage: 'Unsaved relationship draft.',
      noMatchesTitle: 'No relationships match the filters.',
      emptyTitle: 'No relationships yet.',
      studioTitle: 'Relationship Studio',
      studioReviewLabel: 'Review',
      studioGraphLabel: 'Graph',
      studioLinksLabel: 'Links',
      studioBulkEditLabel: 'Bulk Edit',
    });
  });

  it('builds relationship studio mode options with active and fallback states', () => {
    expect(getRelationshipStudioModeModel('graph')).toEqual({
      title: 'Relationship Studio',
      detail:
        'Audit graph health, browse connected records, compose ad hoc links, and prepare bulk cleanup.',
      activeMode: {
        id: 'graph',
        label: 'Graph',
        detail: 'Browse connected records and inspect visible graph links.',
        isActive: true,
      },
      modes: [
        {
          id: 'review',
          label: 'Review',
          detail: 'Repair broken references and find unlinked records.',
          isActive: false,
        },
        {
          id: 'graph',
          label: 'Graph',
          detail: 'Browse connected records and inspect visible graph links.',
          isActive: true,
        },
        {
          id: 'links',
          label: 'Links',
          detail: 'Search, edit, delete, or compose saved relationships.',
          isActive: false,
        },
        {
          id: 'bulk-edit',
          label: 'Bulk Edit',
          detail: 'Prepare larger relationship cleanup passes.',
          isActive: false,
        },
      ],
    });

    expect(getRelationshipStudioModeModel('missing').activeMode.id).toBe(
      'review'
    );
  });

  it('creates a blank relationship draft with safe defaults', () => {
    expect(createEmptyRelationshipDraft()).toEqual({
      sourceEntryId: '',
      targetEntryId: '',
      type: 'member of',
      directional: true,
      note: '',
      status: 'draft',
    });
  });

  it('builds shared entry edit routes for relationship entry targets', () => {
    expect(
      getRelationshipEntryRoute({
        entryId: 'character-mira-rowan',
        name: 'Mira Rowan',
        sectionId: 'characters',
      })
    ).toBe(
      '/entries?sectionId=characters&entryId=character-mira-rowan&intent=edit&query=Mira%20Rowan'
    );
    expect(
      getRelationshipEntryContextRoute({
        entryId: 'character-mira-rowan',
        name: 'Mira Rowan',
        sectionId: 'characters',
      })
    ).toBe(
      '/entries?sectionId=characters&entryId=character-mira-rowan&intent=context&query=Mira%20Rowan'
    );
  });

  it('builds shared relationship management routes for entries', () => {
    expect(
      getRelationshipManagementRoute({
        entryId: 'character-mira-rowan',
        name: 'Mira Rowan',
      })
    ).toBe(
      '/relationships?entryId=character-mira-rowan&entryQuery=Mira%20Rowan&relationshipQuery=Mira%20Rowan'
    );
  });

  it('resolves relationship entry routes by id from codex sections', () => {
    const world = getActiveWorld(createSeedWorldDocument());

    expect(
      getRelationshipEntryRouteById(
        world.codex,
        world.entryTypes,
        'character-mira-rowan'
      )
    ).toBe(
      '/entries?sectionId=characters&entryId=character-mira-rowan&intent=edit'
    );
    expect(
      getRelationshipEntryRouteById(world.codex, world.entryTypes, 'missing')
    ).toBe('/relationships');
  });

  it('includes place-tree relationship types in relationship suggestions', () => {
    expect(relationshipTypeOptions).toEqual(
      expect.arrayContaining([
        'located in',
        'contains',
        'controlled by',
        'claimed by',
        'flows into',
        'site of',
        'referenced by',
      ])
    );
  });

  it('builds shared relationship type and graph tag options', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const relationships = [
      ...world.relationships,
      {
        ...fixedRelationship,
        id: 'relationship-custom',
        type: ' custom bond ',
      },
    ];

    expect(getSavedRelationshipTypes(relationships)).toEqual([
      'caused by',
      'custom bond',
      'founded',
      'member of',
      'references',
    ]);
    expect(getRelationshipTypeSuggestions(relationships)).toEqual(
      expect.arrayContaining(['custom bond', 'flows into', 'member of'])
    );
    expect(getRelationshipTypeFilterOptions(relationships)[0]).toEqual({
      value: '',
      label: 'Any type',
    });
    expect(getRelationshipGraphTagOptions(world)).toEqual(
      expect.arrayContaining(['guild', 'harbor', 'maps'])
    );
    expect(getRelationshipEntrySelectOptions(world).slice(0, 2)).toEqual([
      { value: '', label: 'Choose entry' },
      { value: 'character-mira-rowan', label: 'Mira Rowan (Characters)' },
    ]);
  });

  it('builds shared relationship editor option models', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const model = getRelationshipEditorOptionsModel(
      world,
      {
        sourceEntryId: 'character-mira-rowan',
        targetEntryId: 'faction-cartographers-guild',
        type: 'member of',
        directional: true,
        note: '',
        status: 'canon',
      },
      'lore-tide-calendar'
    );

    expect(model.entries.map((entry) => entry.id)).toContain(
      'character-mira-rowan'
    );
    expect(model.entryOptions[0]).toEqual({
      value: '',
      label: 'Choose entry',
    });
    expect(model.selectedSourceEntry?.name).toBe('Mira Rowan');
    expect(model.selectedTargetEntry?.name).toBe('The Cartographers Guild');
    expect(model.selectedEntryFilter?.name).toBe('The Tide Calendar');
    expect(model.savedRelationshipTypes).toEqual([
      'caused by',
      'founded',
      'member of',
      'references',
    ]);
    expect(model.relationshipTypeSuggestions).toEqual(
      expect.arrayContaining(['flows into', 'member of'])
    );
    expect(model.relationshipTypeFilterOptions[0]).toEqual({
      value: '',
      label: 'Any type',
    });
    expect(model.graphTagOptions).toEqual(
      expect.arrayContaining(['guild', 'harbor', 'maps'])
    );
  });

  it('converts a draft into a saved relationship', () => {
    const relationship = relationshipFromDraft({
      sourceEntryId: 'character-mira-rowan',
      targetEntryId: 'faction-cartographers-guild',
      type: ' member of ',
      directional: true,
      note: ' Keeps ledgers. ',
      status: 'canon',
    });

    expect(relationship.id).toMatch(/^relationship-member-of-/);
    expect(relationship.type).toBe('member of');
    expect(relationship.note).toBe('Keeps ledgers.');
    expect(relationship.createdAt).toBeTruthy();
    expect(relationship.updatedAt).toBeTruthy();
  });

  it('converts a saved relationship into an editable draft', () => {
    expect(draftFromRelationship(fixedRelationship)).toEqual({
      sourceEntryId: fixedRelationship.sourceEntryId,
      targetEntryId: fixedRelationship.targetEntryId,
      type: fixedRelationship.type,
      directional: fixedRelationship.directional,
      note: fixedRelationship.note,
      status: fixedRelationship.status,
    });
  });

  it('filters relationship picker entries by name, section, id, status, and tags', () => {
    const codex = createSeedCodex();
    const entries = getRelationshipEntries(codex, worldSections);

    expect(
      getRelationshipEntryPickerItems(codex, worldSections, 'mira').map(
        (entry) => entry.name
      )
    ).toEqual(['Mira Rowan']);
    expect(
      getRelationshipEntryPickerItems(codex, worldSections, 'faction').map(
        (entry) => entry.sectionTitle
      )
    ).toEqual(['Factions', 'Factions']);
    expect(
      getRelationshipEntryPickerItems(
        codex,
        worldSections,
        'character-mira'
      ).map((entry) => entry.id)
    ).toEqual(['character-mira-rowan']);
    expect(
      filterRelationshipEntryPickerItems(entries, 'guild').some(
        (entry) => entry.name === 'The Cartographers Guild'
      )
    ).toBe(true);
  });

  it('upserts and deletes relationships by id', () => {
    const updatedRelationship = {
      ...fixedRelationship,
      note: 'Updated note',
    };

    expect(upsertRelationship([], fixedRelationship)).toEqual([
      fixedRelationship,
    ]);
    expect(
      upsertRelationship([fixedRelationship], updatedRelationship)
    ).toEqual([updatedRelationship]);
    expect(
      deleteRelationship([fixedRelationship], fixedRelationship.id)
    ).toEqual([]);
  });

  it('removes relationships attached to a deleted entry', () => {
    const unrelatedRelationship = {
      ...fixedRelationship,
      id: 'relationship-other',
      sourceEntryId: 'character-tomas-quill',
      targetEntryId: 'lore-tide-calendar',
    };

    expect(
      deleteRelationshipsForEntry(
        [fixedRelationship, unrelatedRelationship],
        'character-mira-rowan'
      )
    ).toEqual([unrelatedRelationship]);
  });

  it('filters relationships by type and attached entry', () => {
    const codex = createSeedCodex();
    const calendarRelationship = {
      ...fixedRelationship,
      id: 'relationship-tomas-calendar',
      sourceEntryId: 'character-tomas-quill',
      targetEntryId: 'lore-tide-calendar',
      type: 'references',
    };

    expect(
      filterRelationships([fixedRelationship, calendarRelationship], {
        type: 'member of',
        entryId: '',
      })
    ).toEqual([fixedRelationship]);
    expect(
      filterRelationships([fixedRelationship, calendarRelationship], {
        type: '',
        entryId: 'lore-tide-calendar',
      })
    ).toEqual([calendarRelationship]);
    expect(
      filterRelationships([fixedRelationship, calendarRelationship], {
        type: 'member of',
        entryId: 'character-tomas-quill',
      })
    ).toEqual([]);
    expect(
      filterRelationships([fixedRelationship, calendarRelationship], {
        type: '',
        entryId: '',
        query: 'cartographers',
        entryById: new Map(
          getRelationshipEntries(codex, worldSections).map((entry) => [
            entry.id,
            entry,
          ])
        ),
      })
    ).toEqual([fixedRelationship]);
    expect(
      filterRelationships([fixedRelationship, calendarRelationship], {
        type: '',
        entryId: '',
        query: 'references',
      })
    ).toEqual([calendarRelationship]);
  });

  it('resolves entry relationships with source and target records', () => {
    const codex = createSeedCodex();

    expect(
      findEntryById(codex, worldSections, 'character-mira-rowan')?.name
    ).toBe('Mira Rowan');
    expect(
      getEntryRelationships(
        [fixedRelationship],
        codex,
        worldSections,
        'character-mira-rowan'
      )
    ).toMatchObject([
      {
        id: fixedRelationship.id,
        sourceEntry: { name: 'Mira Rowan' },
        targetEntry: { name: 'The Cartographers Guild' },
      },
    ]);
  });

  it('groups place relationships by place-tree semantics', () => {
    const codex = createSeedCodex();
    const harbor = codex.places[0];
    const relationships: WorldRelationship[] = [
      {
        ...fixedRelationship,
        id: 'relationship-harbor-country',
        sourceEntryId: harbor.id,
        targetEntryId: 'place-glassroot-forest',
        type: 'located in',
      },
      {
        ...fixedRelationship,
        id: 'relationship-harbor-guild',
        sourceEntryId: harbor.id,
        targetEntryId: 'faction-cartographers-guild',
        type: 'controlled by',
      },
      {
        ...fixedRelationship,
        id: 'relationship-guild-controls-harbor',
        sourceEntryId: 'faction-cartographers-guild',
        targetEntryId: harbor.id,
        type: 'controls',
      },
      {
        ...fixedRelationship,
        id: 'relationship-calendar-harbor',
        sourceEntryId: 'lore-tide-calendar',
        targetEntryId: harbor.id,
        type: 'references',
      },
      {
        ...fixedRelationship,
        id: 'relationship-custom',
        sourceEntryId: harbor.id,
        targetEntryId: 'character-mira-rowan',
        type: 'favorite map room of',
      },
    ];

    expect(
      getPlaceRelationshipGroups(harbor, relationships, codex, worldSections)
    ).toMatchObject([
      {
        id: 'location',
        label: 'Location and parent places',
        relationships: [{ id: 'relationship-harbor-country' }],
      },
      {
        id: 'power',
        label: 'Control and claims',
        relationships: [
          { id: 'relationship-harbor-guild' },
          { id: 'relationship-guild-controls-harbor' },
        ],
      },
      {
        id: 'eventsLore',
        label: 'Events and lore',
        relationships: [{ id: 'relationship-calendar-harbor' }],
      },
      {
        id: 'other',
        label: 'Other links',
        relationships: [{ id: 'relationship-custom' }],
      },
    ]);
  });

  it('builds graph data only for relationships with existing endpoints', () => {
    const codex = createSeedCodex();
    const brokenRelationship = {
      ...fixedRelationship,
      id: 'relationship-broken',
      targetEntryId: 'missing-entry',
    };

    expect(
      getRelationshipGraph(
        [fixedRelationship, brokenRelationship],
        codex,
        worldSections
      )
    ).toEqual({
      nodes: [
        {
          id: 'character-mira-rowan',
          name: 'Mira Rowan',
          sectionId: 'characters',
          sectionTitle: 'Characters',
          status: 'draft',
          statusLabel: 'Draft',
          summaryText:
            'A careful surveyor keeping field notes, route sketches, and practical warnings for new expeditions.',
          tags: ['surveyor', 'routes', 'maps'],
        },
        {
          id: 'faction-cartographers-guild',
          name: 'The Cartographers Guild',
          sectionId: 'factions',
          sectionTitle: 'Factions',
          status: 'draft',
          statusLabel: 'Draft',
          summaryText:
            'A practical guild that licenses survey crews, maintains maps, and sells verified route updates.',
          tags: ['maps', 'routes', 'guild'],
        },
      ],
      edges: [
        {
          id: fixedRelationship.id,
          sourceId: 'character-mira-rowan',
          targetId: 'faction-cartographers-guild',
          label: 'member of',
          directional: true,
        },
      ],
    });
  });

  it('reports broken relationships with missing endpoints', () => {
    const codex = createSeedCodex();
    const brokenRelationship = {
      ...fixedRelationship,
      id: 'relationship-broken',
      targetEntryId: 'missing-entry',
    };

    expect(
      getBrokenRelationships(
        [fixedRelationship, brokenRelationship],
        codex,
        worldSections
      )
    ).toMatchObject([
      {
        id: 'relationship-broken',
        missingSource: false,
        missingTarget: true,
        sourceEntry: { name: 'Mira Rowan' },
        targetEntry: null,
      },
    ]);
  });

  it('reports orphaned entries without saved relationships', () => {
    const codex = createSeedCodex();

    expect(
      getOrphanedEntries([fixedRelationship], codex, worldSections).map(
        (entry) => entry.id
      )
    ).toEqual([
      'character-tomas-quill',
      'place-northwatch-harbor',
      'place-glassroot-forest',
      'faction-ember-court',
      'lore-waystones',
      'lore-tide-calendar',
      'timeline-first-survey',
      'timeline-harbor-accord',
    ]);
  });

  it('summarizes relationship health counts', () => {
    const codex = createSeedCodex();
    const brokenRelationship = {
      ...fixedRelationship,
      id: 'relationship-broken',
      targetEntryId: 'missing-entry',
    };

    expect(
      getRelationshipHealthSummary(
        [fixedRelationship, brokenRelationship],
        codex,
        worldSections
      )
    ).toEqual({
      brokenRelationshipCount: 1,
      orphanedEntryCount: 8,
    });
  });

  it('builds shared relationship list rows with filters and endpoint labels', () => {
    const world = getActiveWorld(createSeedWorldDocument());

    expect(
      getRelationshipListModel(world, {
        query: 'cartographers',
        type: 'member of',
      })
    ).toEqual([
      expect.objectContaining({
        id: 'relationship-mira-cartographers-guild',
        sourceName: 'Mira Rowan',
        sourceSectionTitle: 'Characters',
        statusLabel: 'Canon',
        targetName: 'The Cartographers Guild',
        targetSectionTitle: 'Factions',
        type: 'member of',
        directionLabel: '->',
      }),
    ]);
    expect(
      getRelationshipListModel(world, {
        entryId: 'lore-tide-calendar',
      }).map((relationship) => relationship.type)
    ).toEqual(['references']);
  });

  it('falls back to endpoint ids in shared relationship list rows', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const missingTargetWorld = {
      ...world,
      relationships: [
        {
          ...world.relationships[0],
          id: 'relationship-missing-target',
          targetEntryId: 'missing-entry',
        },
      ],
    };

    expect(getRelationshipListModel(missingTargetWorld)).toEqual([
      expect.objectContaining({
        sourceName: 'Mira Rowan',
        targetName: 'missing-entry',
        targetSectionTitle: '',
      }),
    ]);
  });

  it('summarizes linked records for a selected entry', () => {
    const world = getActiveWorld(createSeedWorldDocument());

    expect(
      getEntryRelationshipSummaryModel(world, 'character-mira-rowan')[0]
    ).toMatchObject({
      directionLabel: 'To',
      relatedEntryId: 'faction-cartographers-guild',
      relatedEntryName: 'The Cartographers Guild',
      relatedSectionId: 'factions',
      type: 'member of',
    });
  });

  it('groups place linked records for place detail sections', () => {
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

    expect(getEntryRelationshipGroupsModel(groupedWorld, harbor)).toMatchObject(
      [
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
      ]
    );
  });

  it('groups character linked records for character detail sections', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const mira = world.codex.characters[0];
    const groupedWorld = {
      ...world,
      relationships: [
        {
          ...world.relationships[0],
          id: 'relationship-mira-parent',
          sourceEntryId: mira.id,
          targetEntryId: 'character-tomas-quill',
          type: 'child of',
        },
        {
          ...world.relationships[0],
          id: 'relationship-tomas-mentor-mira',
          sourceEntryId: 'character-tomas-quill',
          targetEntryId: mira.id,
          type: 'mentor of',
        },
        {
          ...world.relationships[0],
          id: 'relationship-mira-first-survey',
          sourceEntryId: mira.id,
          targetEntryId: 'timeline-first-survey',
          type: 'participated in',
        },
        ...world.relationships,
      ],
    };

    expect(
      getCharacterRelationshipGroups(
        mira,
        groupedWorld.relationships,
        groupedWorld.codex,
        groupedWorld.entryTypes
      ).map((group) => ({
        id: group.id,
        label: group.label,
        types: group.relationships.map((relationship) => relationship.type),
      }))
    ).toEqual([
      {
        id: 'affiliations',
        label: 'Affiliations and service',
        types: ['member of'],
      },
      {
        id: 'family',
        label: 'Family and lineage',
        types: ['child of'],
      },
      {
        id: 'social',
        label: 'Allies, partners, and mentors',
        types: ['mentor of'],
      },
      {
        id: 'eventsLore',
        label: 'Events and lore',
        types: ['participated in'],
      },
    ]);
  });

  it('groups every generated character relationship type outside the fallback group', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const mira = world.codex.characters[0];
    const counterpartId = 'faction-cartographers-guild';
    const relationships = characterRelationshipTypeOptions.flatMap(
      (type, index): WorldRelationship[] => [
        {
          ...fixedRelationship,
          id: `relationship-character-source-${index}`,
          sourceEntryId: mira.id,
          targetEntryId: counterpartId,
          type,
        },
        {
          ...fixedRelationship,
          id: `relationship-character-target-${index}`,
          sourceEntryId: counterpartId,
          targetEntryId: mira.id,
          type,
        },
      ]
    );

    const groupedNonFallbackTypes = new Set(
      getCharacterRelationshipGroups(
        mira,
        relationships,
        world.codex,
        world.entryTypes
      )
        .filter((group) => group.id !== 'other')
        .flatMap((group) =>
          group.relationships.map((relationship) => relationship.type)
        )
    );

    expect(
      characterRelationshipTypeOptions.filter(
        (type) => !groupedNonFallbackTypes.has(type)
      )
    ).toEqual([]);
  });

  it('uses character groups in shared entry relationship group models', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const tomas = world.codex.characters[1];

    expect(getEntryRelationshipGroupsModel(world, tomas)).toMatchObject([
      {
        id: 'eventsLore',
        label: 'Events and lore',
        relationships: [
          {
            relatedEntryId: 'lore-tide-calendar',
            relatedEntryName: 'The Tide Calendar',
            type: 'references',
          },
        ],
      },
    ]);
  });

  it('falls back to linked-record groups for non-tree entry kinds with inverse character links', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const guild = world.codex.factions.find(
      (entry) => entry.id === 'faction-cartographers-guild'
    );

    if (!guild) {
      throw new Error('Seed guild fixture is missing.');
    }

    expect(getEntryRelationshipGroupsModel(world, guild)).toMatchObject([
      {
        id: 'linked-records',
        label: 'Linked records',
        relationships: [
          {
            directionLabel: 'From',
            relatedEntryId: 'character-mira-rowan',
            relatedEntryName: 'Mira Rowan',
            relatedSectionId: 'characters',
            type: 'member of',
          },
          {
            directionLabel: 'From',
            relatedEntryId: 'timeline-harbor-accord',
            relatedEntryName: 'Harbor Accord Signed',
            relatedSectionId: 'timeline',
            type: 'founded',
          },
        ],
      },
    ]);
  });

  it('builds a shared relationship diagnostics model', () => {
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
    const diagnostics = getRelationshipDiagnosticsModel(brokenWorld);

    expect(diagnostics.healthSummary).toEqual({
      brokenRelationshipCount: 1,
      orphanedEntryCount: 2,
    });
    expect(diagnostics.brokenRelationships).toEqual([
      expect.objectContaining({
        id: 'relationship-broken-source',
        missingSource: true,
        missingTarget: false,
        sourceName: 'missing-character',
      }),
    ]);
    expect(diagnostics.orphanedEntries.map((entry) => entry.name)).toEqual([
      'Northwatch Harbor',
      'The Ember Court',
    ]);
  });

  it('builds a shared relationship studio review model with legacy text cleanup', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const review = getRelationshipStudioReviewModel(world);

    expect(review.hasIssues).toBe(true);
    expect(review.healthSummary).toEqual({
      brokenRelationshipCount: 0,
      orphanedEntryCount: 2,
    });
    expect(review.reviewSummary).toMatchObject({
      hasIssues: true,
      totalIssueCount: review.legacyTextItems.length + 2,
      items: [
        {
          id: 'broken-relationships',
          count: 0,
          severity: 'critical',
          title: 'Broken references',
        },
        {
          id: 'orphaned-records',
          count: 2,
          title: 'Orphaned records',
        },
        {
          id: 'duplicate-relationships',
          count: 0,
          countLabel: '0 groups',
          title: 'Duplicate Relationships',
        },
        {
          id: 'legacy-text-links',
          count: review.legacyTextItems.length,
          title: 'Legacy Link Text',
        },
      ],
    });
    expect(review.legacyTextExactItemCount).toBeGreaterThan(0);
    expect(review.legacyTextItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entryId: 'character-mira-rowan',
          fieldKey: 'affiliations',
          exactTargetIds: ['faction-cartographers-guild'],
        }),
      ])
    );
  });

  it('detects conservative duplicate relationship groups for review and cleanup', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const duplicate = {
      ...world.relationships[0],
      id: 'relationship-duplicate-member',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    };
    const olderOriginal = {
      ...world.relationships[0],
      createdAt: '2026-05-01T00:00:00.000Z',
    };
    const differentNote = {
      ...world.relationships[0],
      id: 'relationship-different-note',
      note: 'Separate useful context.',
    };
    const groups = getDuplicateRelationshipGroups({
      codex: world.codex,
      entryTypes: world.entryTypes,
      relationships: [duplicate, olderOriginal, differentNote],
    });

    expect(groups).toEqual([
      expect.objectContaining({
        retainedRelationshipId: olderOriginal.id,
        duplicateRelationshipIds: ['relationship-duplicate-member'],
        duplicateCount: 1,
        sourceName: 'Mira Rowan',
        targetName: 'The Cartographers Guild',
        type: 'member of',
      }),
    ]);
  });

  it('filters graph data by section, status, tag, and relationship type', () => {
    const codex = createSeedCodex();
    const referencesRelationship = {
      ...fixedRelationship,
      id: 'relationship-mira-waystones',
      targetEntryId: 'lore-waystones',
      type: 'references',
    };

    expect(
      getRelationshipGraph(
        [fixedRelationship, referencesRelationship],
        codex,
        worldSections,
        {
          sectionId: '',
          status: 'draft',
          tag: 'maps',
          type: 'member of',
        }
      )
    ).toMatchObject({
      nodes: [
        {
          id: 'character-mira-rowan',
          sectionId: 'characters',
        },
        {
          id: 'faction-cartographers-guild',
          sectionId: 'factions',
        },
      ],
      edges: [
        {
          id: fixedRelationship.id,
        },
      ],
    });
    expect(
      getRelationshipGraph(
        [fixedRelationship, referencesRelationship],
        codex,
        worldSections,
        {
          sectionId: 'characters',
          status: '',
          tag: '',
          type: 'member of',
        }
      ).edges
    ).toEqual([]);
  });

  it('builds shared named relationship graph rows', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const graph = getRelationshipGraphViewModel(world, {
      sectionId: '',
      status: '',
      tag: '',
      type: 'member of',
    });

    expect(graph.nodes.map((node) => node.name)).toContain('Mira Rowan');
    expect(graph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Mira Rowan',
          statusLabel: 'Draft',
          summaryText:
            'A careful surveyor keeping field notes, route sketches, and practical warnings for new expeditions.',
        }),
      ])
    );
    expect(graph.edges).toEqual([
      expect.objectContaining({
        id: 'relationship-mira-cartographers-guild',
        label: 'member of',
        sourceName: 'Mira Rowan',
        targetName: 'The Cartographers Guild',
        directionLabel: '->',
      }),
    ]);
  });
});
