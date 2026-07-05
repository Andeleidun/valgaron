import { describe, expect, it } from '@jest/globals';
import {
  filterPlaceRelationshipTargetOptions,
  buildPlaceRelationshipFieldTextMigrationOperation,
  buildPlaceRelationshipTextReviewBatchMigration,
  buildPlaceRelationshipTextReviewMigration,
  buildPlaceRelationshipTextReviewSuggestionMigration,
  getPlaceRelationshipTargetOptionDisplay,
  getPlaceRelationshipFieldTextMigration,
  getPlaceRelationshipFieldLinks,
  getPlaceRelationshipFieldTargetId,
  getPlaceRelationshipTextReviewSummary,
  getPlaceRelationshipTextReviewExactMatchLabel,
  getPlaceRelationshipTextReviewItems,
  getPlaceRelationshipTextReviewSuggestionLabels,
  getPlaceRelationshipTextReviewUnresolvedLabel,
  getPlaceRelationshipTextMigrationStatus,
  getPlaceRelationshipTargetOptions,
  limitPlaceRelationshipTargetOptions,
  makePlaceFieldRelationship,
  placeRelationshipFieldCopy,
  placeRelationshipTextReviewCopy,
} from './placeRelationshipFields';
import { placeRelationshipFieldConfigs } from './placeTaxonomy';
import type {
  WorldCodex,
  WorldEntry,
  WorldRelationship,
  WorldSectionConfig,
} from './types';

const placeSection: WorldSectionConfig = {
  id: 'places',
  kind: 'place',
  title: 'Places',
  singularTitle: 'Place',
  description: '',
  detailFields: [],
};

function makeEntry(
  id: string,
  name: string,
  category: string,
  status: WorldEntry['status'] = 'draft'
): WorldEntry {
  return {
    id,
    kind: 'place',
    name,
    summary: `${name} summary`,
    notes: '',
    tags: [],
    status,
    pinned: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    fields: { category },
  };
}

function makeRelationship(
  sourceEntryId: string,
  targetEntryId: string,
  type: string,
  directional = true
): WorldRelationship {
  return {
    id: `relationship-${sourceEntryId}-${targetEntryId}-${type}`,
    sourceEntryId,
    targetEntryId,
    type,
    directional,
    note: '',
    status: 'draft',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

const codex = {
  places: [
    makeEntry('place-river-main', 'Silver Run', 'River'),
    makeEntry('place-river-source', 'Moon Fork', 'River'),
    makeEntry('place-capital', 'Glassport', 'Capital'),
    makeEntry('place-village', 'Reed Village', 'Village'),
    makeEntry('place-archived-city', 'Old Capital', 'City', 'archived'),
  ],
  characters: [],
  factions: [],
  lore: [
    {
      ...makeEntry('lore-capital-charter', 'Capital Charter', 'Lore'),
      kind: 'lore',
    },
  ],
  timeline: [],
} as WorldCodex;

function makeTargetOption(entry: WorldEntry, isPreferredTarget = true) {
  return {
    entry,
    section: placeSection,
    isPreferredTarget,
    targetCategoryWarning: isPreferredTarget
      ? undefined
      : 'Unusual target for this field',
  };
}

describe('place relationship field helpers', () => {
  it('centralizes linked field renderer copy', () => {
    expect(placeRelationshipFieldCopy).toEqual({
      createMatchingRecordsMessage:
        'Create matching records before linking this field.',
      noLinkedRecordLabel: 'No linked record',
      noMatchingTargetsMessage:
        'No matching records. Clear the search to see all targets.',
      searchPlaceholder: 'Filter linked record targets',
    });
  });

  it('returns soft target options with preferred categories sorted first', () => {
    const capitalConfig = placeRelationshipFieldConfigs.find(
      (config) => config.fieldKey === 'capital'
    );
    const country = makeEntry('place-country', 'Veyr', 'Country');

    if (!capitalConfig) {
      throw new Error('Expected capital relationship config.');
    }

    expect(
      getPlaceRelationshipTargetOptions({
        codex,
        config: capitalConfig,
        sections: [placeSection],
        currentEntry: country,
      }).map((option) => ({
        id: option.entry.id,
        preferred: option.isPreferredTarget,
      }))
    ).toEqual([
      { id: 'place-capital', preferred: true },
      { id: 'place-river-source', preferred: false },
      { id: 'place-village', preferred: false },
      { id: 'place-river-main', preferred: false },
    ]);
  });

  it('keeps explicitly included selected targets available even when normally filtered out', () => {
    const capitalConfig = placeRelationshipFieldConfigs.find(
      (config) => config.fieldKey === 'capital'
    );
    const country = makeEntry('place-country', 'Veyr', 'Country');
    const loreSection: WorldSectionConfig = {
      id: 'lore',
      kind: 'lore',
      title: 'Lore',
      singularTitle: 'Lore',
      description: '',
      detailFields: [],
    };

    if (!capitalConfig) {
      throw new Error('Expected capital relationship config.');
    }

    expect(
      getPlaceRelationshipTargetOptions({
        codex,
        config: capitalConfig,
        includedTargetIds: new Set([
          'place-archived-city',
          'lore-capital-charter',
        ]),
        sections: [placeSection, loreSection],
        currentEntry: country,
      }).map((option) => ({
        id: option.entry.id,
        preferred: option.isPreferredTarget,
      }))
    ).toEqual([
      { id: 'place-capital', preferred: true },
      { id: 'place-archived-city', preferred: true },
      { id: 'lore-capital-charter', preferred: false },
      { id: 'place-river-source', preferred: false },
      { id: 'place-village', preferred: false },
      { id: 'place-river-main', preferred: false },
    ]);
  });

  it('keeps preferred unusual targets behind lazy expansion', () => {
    const settlementsConfig = placeRelationshipFieldConfigs.find(
      (config) => config.fieldKey === 'settlements'
    );
    const country = makeEntry('place-country', 'Veyr', 'Country');

    if (!settlementsConfig) {
      throw new Error('Expected settlements relationship config.');
    }

    const filteredOptions = filterPlaceRelationshipTargetOptions(
      getPlaceRelationshipTargetOptions({
        codex,
        config: settlementsConfig,
        sections: [placeSection],
        currentEntry: country,
      }),
      'moon',
      new Set()
    );
    const collapsedDisplay = getPlaceRelationshipTargetOptionDisplay({
      expandedUnusualTargets: false,
      limit: 10,
      options: filteredOptions,
      selectedTargetIds: new Set(),
    });
    const expandedDisplay = getPlaceRelationshipTargetOptionDisplay({
      expandedUnusualTargets: true,
      limit: 10,
      options: filteredOptions,
      selectedTargetIds: new Set(),
    });

    expect(collapsedDisplay.visibleOptions).toEqual([]);
    expect(collapsedDisplay.canExpandUnusualTargets).toBe(true);
    expect(collapsedDisplay.hiddenUnusualCount).toBe(1);
    expect(collapsedDisplay.showUnusualTargetsLabel).toBe(
      'Show 1 unusual target'
    );
    expect(
      expandedDisplay.visibleOptions.map((option) => option.entry.id)
    ).toEqual(['place-river-source']);
    expect(expandedDisplay.showUnusualTargetsLabel).toBe('');
  });

  it('does not offer unusual expansion before all preferred matches are visible', () => {
    const options = [
      makeTargetOption(makeEntry('place-capital-a', 'Amber Hall', 'Capital')),
      makeTargetOption(makeEntry('place-capital-b', 'Brass Hall', 'Capital')),
      makeTargetOption(
        makeEntry('place-river-a', 'Copper Run', 'River'),
        false
      ),
    ];

    const display = getPlaceRelationshipTargetOptionDisplay({
      expandedUnusualTargets: false,
      limit: 1,
      options,
      selectedTargetIds: new Set(),
    });

    expect(display).toMatchObject({
      canExpandUnusualTargets: false,
      hiddenPreferredCount: 1,
      hiddenPreferredMessage:
        'Showing 1 of 3 matches. Refine the search to show 1 more preferred record.',
      hiddenUnusualCount: 1,
      showUnusualTargetsLabel: '',
    });
  });

  it('shows soft unusual targets from the beginning after preferred targets', () => {
    const options = [
      makeTargetOption(makeEntry('place-capital-a', 'Amber Hall', 'Capital')),
      makeTargetOption(
        makeEntry('place-river-a', 'Copper Run', 'River'),
        false
      ),
      makeTargetOption(makeEntry('place-capital-b', 'Brass Hall', 'Capital')),
    ];

    const display = getPlaceRelationshipTargetOptionDisplay({
      expandedUnusualTargets: false,
      limit: 1,
      options,
      selectedTargetIds: new Set(),
      targetCategoryBehavior: 'soft',
    });

    expect(display.visibleOptions.map((option) => option.entry.id)).toEqual([
      'place-capital-a',
      'place-capital-b',
      'place-river-a',
    ]);
    expect(display).toMatchObject({
      canExpandUnusualTargets: false,
      hiddenPreferredCount: 0,
      hiddenUnusualCount: 0,
      showUnusualTargetsLabel: '',
    });
  });

  it('uses field role metadata when matching links and target ids', () => {
    const mouthConfig = placeRelationshipFieldConfigs.find(
      (config) => config.fieldKey === 'mouth'
    );
    const sourceConfig = placeRelationshipFieldConfigs.find(
      (config) => config.fieldKey === 'source'
    );
    const river = codex.places[0];
    const source = codex.places[1];
    const relationships = [
      makeRelationship(river.id, 'place-sea', 'flows into'),
      makeRelationship(source.id, river.id, 'flows into'),
    ];

    if (!mouthConfig || !sourceConfig) {
      throw new Error('Expected water relationship configs.');
    }

    const mouthLinks = getPlaceRelationshipFieldLinks(
      relationships,
      river,
      mouthConfig
    );
    const sourceLinks = getPlaceRelationshipFieldLinks(
      relationships,
      river,
      sourceConfig
    );

    expect(mouthLinks).toHaveLength(1);
    expect(getPlaceRelationshipFieldTargetId(mouthLinks[0], mouthConfig)).toBe(
      'place-sea'
    );
    expect(sourceLinks).toHaveLength(1);
    expect(
      getPlaceRelationshipFieldTargetId(sourceLinks[0], sourceConfig)
    ).toBe(source.id);
  });

  it('creates relationships with the current entry on the configured side', () => {
    const sourceConfig = placeRelationshipFieldConfigs.find(
      (config) => config.fieldKey === 'source'
    );
    const river = codex.places[0];
    const source = codex.places[1];

    if (!sourceConfig) {
      throw new Error('Expected source relationship config.');
    }

    expect(
      makePlaceFieldRelationship(river, sourceConfig, source.id)
    ).toMatchObject({
      sourceEntryId: source.id,
      targetEntryId: river.id,
      type: 'flows into',
      directional: true,
    });
  });

  it('keeps selected targets visible while filtering and limiting options', () => {
    const options = codex.places.map((entry) => makeTargetOption(entry));
    const selectedTargetIds = new Set(['place-river-source']);
    const filteredOptions = filterPlaceRelationshipTargetOptions(
      options,
      'glass',
      selectedTargetIds
    );
    const limitedOptions = limitPlaceRelationshipTargetOptions(
      filteredOptions,
      selectedTargetIds,
      1
    );

    expect(filteredOptions.map((option) => option.entry.id)).toEqual([
      'place-river-source',
      'place-capital',
    ]);
    expect(limitedOptions.map((option) => option.entry.id)).toEqual([
      'place-river-source',
    ]);
  });

  it('builds field text migrations from place relationship target options', () => {
    const config = placeRelationshipFieldConfigs.find(
      (item) => item.fieldKey === 'tributaries'
    );

    expect(config).toBeDefined();
    expect(
      getPlaceRelationshipFieldTextMigration({
        codex,
        config: config!,
        currentEntry: codex.places[0],
        sections: [placeSection],
        value: 'Moon Fork, Lost Spring',
      })
    ).toMatchObject({
      targetIds: ['place-river-source'],
      matchedFragments: ['Moon Fork'],
      unmatchedFragments: ['Lost Spring'],
      remainingText: 'Lost Spring',
    });
  });

  it('builds field text migration operations for renderers to apply', () => {
    const config = placeRelationshipFieldConfigs.find(
      (item) => item.fieldKey === 'tributaries'
    );
    const migration = getPlaceRelationshipFieldTextMigration({
      codex,
      config: config!,
      currentEntry: codex.places[0],
      sections: [placeSection],
      value: 'Moon Fork, Lost Spring',
    });
    const operation = buildPlaceRelationshipFieldTextMigrationOperation({
      config: config!,
      entry: codex.places[0],
      migration,
      relationships: [],
    });

    expect(operation.relationshipIdsToDelete).toEqual([]);
    expect(operation.relationshipsToSave).toHaveLength(1);
    expect(operation.relationshipsToSave[0].relationship).toMatchObject({
      sourceEntryId: 'place-river-source',
      targetEntryId: 'place-river-main',
      type: 'flows into',
    });
    expect(operation.fields.tributaries).toBe('Lost Spring');
  });

  it('removes consumed legacy text from field text migration operations', () => {
    const config = placeRelationshipFieldConfigs.find(
      (item) => item.fieldKey === 'tributaries'
    );
    const entry = {
      ...codex.places[0],
      fields: {
        ...codex.places[0].fields,
        tributaries: 'Moon Fork',
      },
    };
    const migration = getPlaceRelationshipFieldTextMigration({
      codex,
      config: config!,
      currentEntry: entry,
      sections: [placeSection],
      value: 'Moon Fork',
    });
    const operation = buildPlaceRelationshipFieldTextMigrationOperation({
      config: config!,
      entry,
      migration,
      relationships: [],
    });

    expect(operation.fields.tributaries).toBeUndefined();
  });

  it('builds a review queue for legacy link text that exact migration cannot resolve', () => {
    const reviewCodex = {
      ...codex,
      places: [
        {
          ...codex.places[0],
          fields: {
            ...codex.places[0].fields,
            tributaries: 'Moon Fork, Lost Spring',
          },
        },
        ...codex.places.slice(1),
      ],
    } as WorldCodex;

    expect(
      getPlaceRelationshipTextReviewItems({
        codex: reviewCodex,
        sections: [placeSection],
      })
    ).toEqual([
      {
        entryId: 'place-river-main',
        entryName: 'Silver Run',
        sectionId: 'places',
        fieldKey: 'tributaries',
        fieldLabel: 'Tributaries or feeders',
        value: 'Moon Fork, Lost Spring',
        exactMatchCount: 1,
        exactTargetIds: ['place-river-source'],
        remainingText: 'Lost Spring',
        unresolvedFragments: ['Lost Spring'],
        suggestedTargets: [],
        ambiguousFragments: [],
      },
    ]);
  });

  it('suggests candidate targets for unresolved fragments without making them exact matches', () => {
    const reviewCodex = {
      ...codex,
      places: [
        {
          ...codex.places[0],
          fields: {
            ...codex.places[0].fields,
            settlements: 'Glassport, Reed',
          },
        },
        ...codex.places.slice(1),
      ],
    } as WorldCodex;

    expect(
      getPlaceRelationshipTextReviewItems({
        codex: reviewCodex,
        sections: [placeSection],
      })[0]
    ).toMatchObject({
      fieldKey: 'settlements',
      exactTargetIds: ['place-capital'],
      unresolvedFragments: ['Reed'],
      suggestedTargets: [
        {
          fragment: 'Reed',
          targets: [
            {
              id: 'place-village',
              name: 'Reed Village',
              context: 'Village in Places',
            },
          ],
        },
      ],
    });
  });

  it('formats review labels for shared web and mobile cleanup displays', () => {
    expect(placeRelationshipTextReviewCopy).toMatchObject({
      title: 'Legacy Link Text',
      batchExactMatchLabel: 'Migrate All Exact Matches',
      exactMatchMigrationLabel: 'Migrate Exact Matches',
      hiddenPlaceDetailsTitle: 'Hidden place details',
      linkedFieldsTitle: 'Linked place fields',
      reviewEntryLabel: 'Review Entry',
      savedTextLinkNotesTitle: 'Saved text link notes',
      draftBlockedMessage:
        'Save or discard the current entry draft before migrating exact matches.',
      linkedFieldsBlockedMessage:
        'Save this place before editing relationship links.',
    });
    expect(getPlaceRelationshipTextReviewSummary(1)).toBe(
      '1 relationship-backed field still contains text that exact-match migration cannot fully resolve.'
    );
    expect(getPlaceRelationshipTextReviewSummary(2)).toBe(
      '2 relationship-backed fields still contain text that exact-match migration cannot fully resolve.'
    );

    const item = {
      entryId: 'place-river-main',
      entryName: 'Silver Run',
      sectionId: 'places',
      fieldKey: 'settlements',
      fieldLabel: 'Settlements',
      value: 'Glassport, Reed, Old Capital',
      exactMatchCount: 1,
      exactTargetIds: ['place-capital'],
      remainingText: 'Reed, Old Capital',
      unresolvedFragments: ['Reed'],
      suggestedTargets: [
        {
          fragment: 'Reed',
          targets: [
            {
              id: 'place-village',
              name: 'Reed Village',
              context: 'Village in Places',
            },
          ],
        },
      ],
      ambiguousFragments: [
        {
          fragment: 'Old Capital',
          targetIds: ['place-archived-city', 'place-duplicate-city'],
        },
      ],
    };

    expect(getPlaceRelationshipTextReviewUnresolvedLabel(item)).toBe(
      'Reed, Old Capital (duplicate name)'
    );
    expect(getPlaceRelationshipTextReviewExactMatchLabel(item)).toBe(
      '1 exact match available.'
    );
    expect(getPlaceRelationshipTextReviewSuggestionLabels(item)).toEqual([
      'Reed: Reed Village (Village in Places)',
    ]);
    expect(
      getPlaceRelationshipTextMigrationStatus({
        targetIds: ['place-capital'],
        remainingText: '',
      })
    ).toBe('1 exact match found.');
    expect(
      getPlaceRelationshipTextMigrationStatus({
        targetIds: ['place-capital', 'place-village'],
        remainingText: 'Old Capital',
      })
    ).toBe('2 exact matches found. Unmatched text will remain.');
    expect(
      getPlaceRelationshipTextMigrationStatus({
        targetIds: [],
        remainingText: 'Old Capital',
      })
    ).toBe('No exact matches found. Unmatched text will remain.');
  });

  it('builds exact-match review migration operations without duplicating links', () => {
    const tributariesConfig = placeRelationshipFieldConfigs.find(
      (config) => config.fieldKey === 'tributaries'
    );
    const entry = {
      ...codex.places[0],
      fields: {
        ...codex.places[0].fields,
        tributaries: 'Moon Fork, Lost Spring',
      },
    };

    if (!tributariesConfig) {
      throw new Error('Expected tributaries relationship config.');
    }

    const [item] = getPlaceRelationshipTextReviewItems({
      codex: {
        ...codex,
        places: [entry, ...codex.places.slice(1)],
      } as WorldCodex,
      sections: [placeSection],
    });
    const migration = buildPlaceRelationshipTextReviewMigration({
      config: tributariesConfig,
      entry,
      item,
      relationships: [],
    });

    expect(migration.relationshipIdsToDelete).toEqual([]);
    expect(migration.relationshipsToSave).toHaveLength(1);
    expect(migration.relationshipsToSave[0].relationship).toMatchObject({
      sourceEntryId: 'place-river-source',
      targetEntryId: 'place-river-main',
      type: 'flows into',
    });
    expect(migration.fields.tributaries).toBe('Lost Spring');
  });

  it('builds manual suggestion migrations for unresolved review fragments', () => {
    const settlementsConfig = placeRelationshipFieldConfigs.find(
      (config) => config.fieldKey === 'settlements'
    );
    const entry = {
      ...codex.places[0],
      fields: {
        ...codex.places[0].fields,
        settlements: 'Glassport, Reed, Missing Town',
      },
    };

    if (!settlementsConfig) {
      throw new Error('Expected settlements relationship config.');
    }

    const [item] = getPlaceRelationshipTextReviewItems({
      codex: {
        ...codex,
        places: [entry, ...codex.places.slice(1)],
      } as WorldCodex,
      sections: [placeSection],
    });
    const migration = buildPlaceRelationshipTextReviewSuggestionMigration({
      config: settlementsConfig,
      entry,
      fragment: 'Reed',
      item,
      relationships: [],
      targetEntryId: 'place-village',
    });

    expect(
      migration?.relationshipsToSave.map(({ relationship }) => relationship)
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceEntryId: 'place-river-main',
          targetEntryId: 'place-capital',
          type: 'contains',
        }),
        expect.objectContaining({
          sourceEntryId: 'place-river-main',
          targetEntryId: 'place-village',
          type: 'contains',
        }),
      ])
    );
    expect(migration?.fields.settlements).toBe('Missing Town');
  });

  it('rejects manual suggestion migrations for targets not suggested by the review item', () => {
    const settlementsConfig = placeRelationshipFieldConfigs.find(
      (config) => config.fieldKey === 'settlements'
    );
    const entry = {
      ...codex.places[0],
      fields: {
        ...codex.places[0].fields,
        settlements: 'Reed',
      },
    };

    if (!settlementsConfig) {
      throw new Error('Expected settlements relationship config.');
    }

    const [item] = getPlaceRelationshipTextReviewItems({
      codex: {
        ...codex,
        places: [entry, ...codex.places.slice(1)],
      } as WorldCodex,
      sections: [placeSection],
    });

    expect(
      buildPlaceRelationshipTextReviewSuggestionMigration({
        config: settlementsConfig,
        entry,
        fragment: 'Reed',
        item,
        relationships: [],
        targetEntryId: 'place-capital',
      })
    ).toBeNull();
  });

  it('builds batch review migrations without overwriting same-entry field cleanup', () => {
    const entry = {
      ...codex.places[0],
      fields: {
        ...codex.places[0].fields,
        tributaries: 'Moon Fork, Lost Spring',
        settlements: 'Reed Village, Missing Town',
      },
    };
    const reviewCodex = {
      ...codex,
      places: [entry, ...codex.places.slice(1)],
    } as WorldCodex;
    const items = getPlaceRelationshipTextReviewItems({
      codex: reviewCodex,
      sections: [placeSection],
    });
    const migration = buildPlaceRelationshipTextReviewBatchMigration({
      codex: reviewCodex,
      items,
      relationships: [],
      sections: [placeSection],
    });

    expect(items.map((item) => item.fieldKey).sort()).toEqual([
      'settlements',
      'tributaries',
    ]);
    expect(migration.relationshipsToSave).toHaveLength(2);
    expect(migration.entryFieldUpdates).toEqual([
      {
        entryId: 'place-river-main',
        fields: {
          category: 'River',
          settlements: 'Missing Town',
          tributaries: 'Lost Spring',
        },
      },
    ]);
  });
});
