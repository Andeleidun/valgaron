import { describe, expect, it } from '@jest/globals';
import {
  filterRelationshipTargetOptions,
  buildRelationshipFieldTextMigrationOperation,
  buildRelationshipTextReviewBatchMigration,
  buildRelationshipTextReviewMigration,
  buildRelationshipTextReviewSuggestionMigration,
  getRelationshipTargetOptionDisplay,
  getRelationshipFieldConfigsForEntryKind,
  getRelationshipFieldTextMigration,
  getRelationshipFieldLinks,
  getRelationshipFieldTargetId,
  getRelationshipTextReviewSummary,
  getRelationshipTextReviewExactMatchLabel,
  getRelationshipTextReviewItems,
  getRelationshipTextReviewSuggestionLabels,
  getRelationshipTextReviewUnresolvedLabel,
  getRelationshipTextMigrationStatus,
  getRelationshipTargetOptions,
  limitRelationshipTargetOptions,
  makeFieldRelationship,
  relationshipFieldCopy,
  relationshipTextReviewCopy,
} from './relationshipFields';
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

const characterSection: WorldSectionConfig = {
  id: 'characters',
  kind: 'character',
  title: 'Characters',
  singularTitle: 'Character',
  description: '',
  detailFields: [],
};

const factionSection: WorldSectionConfig = {
  id: 'factions',
  kind: 'faction',
  title: 'Factions',
  singularTitle: 'Faction',
  description: '',
  detailFields: [],
};

const loreSection: WorldSectionConfig = {
  id: 'lore',
  kind: 'lore',
  title: 'Lore',
  singularTitle: 'Lore',
  description: '',
  detailFields: [],
};

const timelineSection: WorldSectionConfig = {
  id: 'timeline',
  kind: 'timeline',
  title: 'Timeline',
  singularTitle: 'Timeline Event',
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

describe('relationship-backed field helpers', () => {
  it('centralizes linked field renderer copy', () => {
    expect(relationshipFieldCopy).toEqual({
      clearLinkedRecordsLabel: 'Clear linked records',
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
      getRelationshipTargetOptions({
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
      getRelationshipTargetOptions({
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

    const filteredOptions = filterRelationshipTargetOptions(
      getRelationshipTargetOptions({
        codex,
        config: settlementsConfig,
        sections: [placeSection],
        currentEntry: country,
      }),
      'moon',
      new Set()
    );
    const collapsedDisplay = getRelationshipTargetOptionDisplay({
      expandedUnusualTargets: false,
      limit: 10,
      options: filteredOptions,
      selectedTargetIds: new Set(),
    });
    const expandedDisplay = getRelationshipTargetOptionDisplay({
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

  it('offers preferred expansion before unusual target expansion', () => {
    const options = [
      makeTargetOption(makeEntry('place-capital-a', 'Amber Hall', 'Capital')),
      makeTargetOption(makeEntry('place-capital-b', 'Brass Hall', 'Capital')),
      makeTargetOption(
        makeEntry('place-river-a', 'Copper Run', 'River'),
        false
      ),
    ];

    const collapsedDisplay = getRelationshipTargetOptionDisplay({
      expandedUnusualTargets: false,
      limit: 1,
      options,
      selectedTargetIds: new Set(),
    });
    const preferredExpandedDisplay = getRelationshipTargetOptionDisplay({
      expandedPreferredTargets: true,
      expandedUnusualTargets: false,
      limit: 1,
      options,
      selectedTargetIds: new Set(),
    });

    expect(collapsedDisplay).toMatchObject({
      canExpandPreferredTargets: true,
      canExpandUnusualTargets: false,
      hiddenPreferredCount: 1,
      hiddenPreferredMessage: '1 more preferred record.',
      hiddenUnusualCount: 1,
      showPreferredTargetsLabel: 'Show 1 More Preferred Record',
      showUnusualTargetsLabel: '',
    });
    expect(
      preferredExpandedDisplay.visibleOptions.map((option) => option.entry.id)
    ).toEqual(['place-capital-a', 'place-capital-b']);
    expect(preferredExpandedDisplay).toMatchObject({
      canExpandPreferredTargets: false,
      canExpandUnusualTargets: true,
      hiddenPreferredCount: 0,
      hiddenUnusualCount: 1,
      showPreferredTargetsLabel: '',
      showUnusualTargetsLabel: 'Show 1 unusual target',
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

    const display = getRelationshipTargetOptionDisplay({
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

    const mouthLinks = getRelationshipFieldLinks(
      relationships,
      river,
      mouthConfig
    );
    const sourceLinks = getRelationshipFieldLinks(
      relationships,
      river,
      sourceConfig
    );

    expect(mouthLinks).toHaveLength(1);
    expect(getRelationshipFieldTargetId(mouthLinks[0], mouthConfig)).toBe(
      'place-sea'
    );
    expect(sourceLinks).toHaveLength(1);
    expect(getRelationshipFieldTargetId(sourceLinks[0], sourceConfig)).toBe(
      source.id
    );
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

    expect(makeFieldRelationship(river, sourceConfig, source.id)).toMatchObject(
      {
        sourceEntryId: source.id,
        targetEntryId: river.id,
        type: 'flows into',
        directional: true,
      }
    );
  });

  it('defines a timeline involved-record relationship field', () => {
    const [config] = getRelationshipFieldConfigsForEntryKind('timeline');
    const event = {
      ...makeEntry('timeline-accord', 'Harbor Accord', ''),
      kind: 'timeline',
    };
    const timelineCodex = {
      ...codex,
      characters: [
        {
          ...makeEntry('character-mira', 'Mira Rowan', ''),
          kind: 'character',
        },
      ],
      factions: [
        {
          ...makeEntry('faction-guild', 'Cartographers Guild', ''),
          kind: 'faction',
        },
      ],
      lore: [
        {
          ...makeEntry('lore-charter', 'Harbor Charter', ''),
          kind: 'lore',
        },
      ],
      timeline: [event],
    } as WorldCodex;

    expect(config).toMatchObject({
      cardinality: 'many',
      currentEntryRole: 'source',
      directional: false,
      fieldKey: 'involvedRecords',
      label: 'Involved records',
      relationshipType: 'involves',
      targetEntryKinds: ['character', 'place', 'faction', 'lore'],
    });
    expect(
      getRelationshipTargetOptions({
        codex: timelineCodex,
        config,
        currentEntry: event,
        sections: [
          characterSection,
          placeSection,
          factionSection,
          loreSection,
          timelineSection,
        ],
      }).map((option) => option.entry.id)
    ).toEqual([
      'faction-guild',
      'place-capital',
      'lore-charter',
      'character-mira',
      'place-river-source',
      'place-village',
      'place-river-main',
    ]);
    expect(
      makeFieldRelationship(event, config, 'character-mira')
    ).toMatchObject({
      directional: false,
      sourceEntryId: 'timeline-accord',
      targetEntryId: 'character-mira',
      type: 'involves',
    });
  });

  it('keeps selected targets visible while filtering and limiting options', () => {
    const options = codex.places.map((entry) => makeTargetOption(entry));
    const selectedTargetIds = new Set(['place-river-source']);
    const filteredOptions = filterRelationshipTargetOptions(
      options,
      'glass',
      selectedTargetIds
    );
    const limitedOptions = limitRelationshipTargetOptions(
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

  it('builds field text migrations from relationship target options', () => {
    const config = placeRelationshipFieldConfigs.find(
      (item) => item.fieldKey === 'tributaries'
    );

    expect(config).toBeDefined();
    expect(
      getRelationshipFieldTextMigration({
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
    const migration = getRelationshipFieldTextMigration({
      codex,
      config: config!,
      currentEntry: codex.places[0],
      sections: [placeSection],
      value: 'Moon Fork, Lost Spring',
    });
    const operation = buildRelationshipFieldTextMigrationOperation({
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
    const migration = getRelationshipFieldTextMigration({
      codex,
      config: config!,
      currentEntry: entry,
      sections: [placeSection],
      value: 'Moon Fork',
    });
    const operation = buildRelationshipFieldTextMigrationOperation({
      config: config!,
      entry,
      migration,
      relationships: [],
    });

    expect(operation.fields.tributaries).toBeUndefined();
  });

  it('replaces one-cardinality field links and deletes extras during field text migration', () => {
    const config = placeRelationshipFieldConfigs.find(
      (item) => item.fieldKey === 'capital'
    );
    const entry = {
      ...makeEntry('place-country', 'Veyr', 'Country'),
      fields: {
        category: 'Country',
        capital: 'Glassport',
      },
    };
    const migration = getRelationshipFieldTextMigration({
      codex,
      config: config!,
      currentEntry: entry,
      sections: [placeSection],
      value: 'Glassport',
    });
    const primaryRelationship = makeRelationship(
      entry.id,
      'place-village',
      'has capital'
    );
    const extraRelationship = makeRelationship(
      entry.id,
      'place-river-source',
      'has capital'
    );
    const operation = buildRelationshipFieldTextMigrationOperation({
      config: config!,
      entry,
      migration,
      relationships: [primaryRelationship, extraRelationship],
    });

    expect(operation.relationshipIdsToDelete).toEqual([extraRelationship.id]);
    expect(operation.relationshipsToSave).toHaveLength(1);
    expect(operation.relationshipsToSave[0]).toMatchObject({
      existingRelationship: primaryRelationship,
      relationship: {
        id: primaryRelationship.id,
        sourceEntryId: entry.id,
        targetEntryId: 'place-capital',
        type: 'has capital',
      },
    });
    expect(operation.fields.capital).toBeUndefined();
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
      getRelationshipTextReviewItems({
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

  it('builds review queue items for exact-only legacy link text', () => {
    const reviewCodex = {
      ...codex,
      places: [
        {
          ...codex.places[0],
          fields: {
            ...codex.places[0].fields,
            tributaries: 'Moon Fork',
          },
        },
        ...codex.places.slice(1),
      ],
    } as WorldCodex;

    expect(
      getRelationshipTextReviewItems({
        codex: reviewCodex,
        sections: [placeSection],
      })
    ).toEqual([
      expect.objectContaining({
        entryId: 'place-river-main',
        fieldKey: 'tributaries',
        exactMatchCount: 1,
        exactTargetIds: ['place-river-source'],
        remainingText: '',
        unresolvedFragments: [],
      }),
    ]);
  });

  it('filters legacy link text review items by entry id when requested', () => {
    const reviewCodex = {
      ...codex,
      places: [
        {
          ...codex.places[0],
          fields: {
            ...codex.places[0].fields,
            tributaries: 'Moon Fork',
          },
        },
        ...codex.places.slice(1),
      ],
    } as WorldCodex;

    expect(
      getRelationshipTextReviewItems({
        codex: reviewCodex,
        entryIds: ['place-river-main'],
        sections: [placeSection],
      }).map((item) => item.entryId)
    ).toEqual(['place-river-main']);
    expect(
      getRelationshipTextReviewItems({
        codex: reviewCodex,
        entryIds: ['place-river-source'],
        sections: [placeSection],
      })
    ).toEqual([]);
  });

  it('builds batch migrations that clear exact-only legacy link text', () => {
    const entry = {
      ...codex.places[0],
      fields: {
        ...codex.places[0].fields,
        tributaries: 'Moon Fork',
      },
    };
    const reviewCodex = {
      ...codex,
      places: [entry, ...codex.places.slice(1)],
    } as WorldCodex;
    const items = getRelationshipTextReviewItems({
      codex: reviewCodex,
      sections: [placeSection],
    });
    const migration = buildRelationshipTextReviewBatchMigration({
      codex: reviewCodex,
      items,
      relationships: [],
      sections: [placeSection],
    });

    expect(migration.relationshipsToSave).toHaveLength(1);
    expect(migration.entryFieldUpdates).toEqual([
      {
        entryId: 'place-river-main',
        fields: {
          category: 'River',
        },
      },
    ]);
  });

  it('builds review queue items for character relationship-backed text', () => {
    const reviewCodex = {
      ...codex,
      characters: [
        {
          ...makeEntry('character-scout', 'Mira Rowan', '', 'draft'),
          kind: 'character',
          fields: {
            characterCategory: 'Humanoid person',
            homePlace: 'Glassport, Missing Camp',
          },
        },
      ],
    } as WorldCodex;

    expect(
      getRelationshipTextReviewItems({
        codex: reviewCodex,
        sections: [characterSection, placeSection, factionSection],
      })
    ).toEqual([
      expect.objectContaining({
        entryId: 'character-scout',
        sectionId: 'characters',
        fieldKey: 'homePlace',
        fieldLabel: 'Home',
        exactMatchCount: 1,
        exactTargetIds: ['place-capital'],
        remainingText: 'Missing Camp',
        unresolvedFragments: ['Missing Camp'],
      }),
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
      getRelationshipTextReviewItems({
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
    expect(relationshipTextReviewCopy).toMatchObject({
      title: 'Legacy Link Text',
      batchExactMatchLabel: 'Migrate All Exact Matches',
      exactMatchMigrationLabel: 'Migrate Exact Matches',
      hiddenEntryDetailsTitle: 'Hidden entry details',
      linkedFieldsTitle: 'Linked relationship fields',
      reviewEntryLabel: 'Review Entry',
      savedTextLinkNotesTitle: 'Saved text link notes',
      draftBlockedMessage:
        'Save or discard the current entry draft before migrating exact matches.',
      linkedFieldsBlockedMessage:
        'Save this entry before editing relationship links.',
    });
    expect(getRelationshipTextReviewSummary(1)).toBe(
      '1 relationship-backed field contains saved text that can be reviewed or migrated to relationships.'
    );
    expect(getRelationshipTextReviewSummary(2)).toBe(
      '2 relationship-backed fields contain saved text that can be reviewed or migrated to relationships.'
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

    expect(getRelationshipTextReviewUnresolvedLabel(item)).toBe(
      'Reed, Old Capital (duplicate name)'
    );
    expect(
      getRelationshipTextReviewUnresolvedLabel({
        ...item,
        ambiguousFragments: [],
        unresolvedFragments: [],
      })
    ).toBe('None');
    expect(getRelationshipTextReviewExactMatchLabel(item)).toBe(
      '1 exact match available.'
    );
    expect(getRelationshipTextReviewSuggestionLabels(item)).toEqual([
      'Reed: Reed Village (Village in Places)',
    ]);
    expect(
      getRelationshipTextMigrationStatus({
        targetIds: ['place-capital'],
        remainingText: '',
      })
    ).toBe('1 exact match found.');
    expect(
      getRelationshipTextMigrationStatus({
        targetIds: ['place-capital', 'place-village'],
        remainingText: 'Old Capital',
      })
    ).toBe('2 exact matches found. Unmatched text will remain.');
    expect(
      getRelationshipTextMigrationStatus({
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

    const [item] = getRelationshipTextReviewItems({
      codex: {
        ...codex,
        places: [entry, ...codex.places.slice(1)],
      } as WorldCodex,
      sections: [placeSection],
    });
    const migration = buildRelationshipTextReviewMigration({
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

    const [item] = getRelationshipTextReviewItems({
      codex: {
        ...codex,
        places: [entry, ...codex.places.slice(1)],
      } as WorldCodex,
      sections: [placeSection],
    });
    const migration = buildRelationshipTextReviewSuggestionMigration({
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

    const [item] = getRelationshipTextReviewItems({
      codex: {
        ...codex,
        places: [entry, ...codex.places.slice(1)],
      } as WorldCodex,
      sections: [placeSection],
    });

    expect(
      buildRelationshipTextReviewSuggestionMigration({
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
    const items = getRelationshipTextReviewItems({
      codex: reviewCodex,
      sections: [placeSection],
    });
    const migration = buildRelationshipTextReviewBatchMigration({
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

  it('builds batch review migrations for character relationship-backed text', () => {
    const character = {
      ...makeEntry('character-scout', 'Mira Rowan', '', 'draft'),
      kind: 'character',
      fields: {
        characterCategory: 'Humanoid person',
        affiliations: 'Cartographers Guild, Missing Guild',
      },
    };
    const reviewCodex = {
      ...codex,
      characters: [character],
      factions: [
        {
          ...makeEntry('faction-cartographers', 'Cartographers Guild', ''),
          kind: 'faction',
        },
      ],
    } as WorldCodex;
    const items = getRelationshipTextReviewItems({
      codex: reviewCodex,
      sections: [characterSection, placeSection, factionSection],
    });
    const migration = buildRelationshipTextReviewBatchMigration({
      codex: reviewCodex,
      items,
      relationships: [],
      sections: [characterSection, placeSection, factionSection],
    });

    expect(items).toEqual([
      expect.objectContaining({
        entryId: 'character-scout',
        fieldKey: 'affiliations',
        exactTargetIds: ['faction-cartographers'],
        remainingText: 'Missing Guild',
      }),
    ]);
    expect(migration.relationshipsToSave).toHaveLength(1);
    expect(migration.relationshipsToSave[0].relationship).toMatchObject({
      sourceEntryId: 'character-scout',
      targetEntryId: 'faction-cartographers',
      type: 'member of',
    });
    expect(migration.entryFieldUpdates).toEqual([
      {
        entryId: 'character-scout',
        fields: {
          affiliations: 'Missing Guild',
          characterCategory: 'Humanoid person',
        },
      },
    ]);
  });

  it('builds batch review migrations that clear exact-only character relationship-backed text', () => {
    const character = {
      ...makeEntry('character-scout', 'Mira Rowan', '', 'draft'),
      kind: 'character',
      fields: {
        characterCategory: 'Humanoid person',
        affiliations: 'Cartographers Guild',
      },
    };
    const reviewCodex = {
      ...codex,
      characters: [character],
      factions: [
        {
          ...makeEntry('faction-cartographers', 'Cartographers Guild', ''),
          kind: 'faction',
        },
      ],
    } as WorldCodex;
    const items = getRelationshipTextReviewItems({
      codex: reviewCodex,
      sections: [characterSection, factionSection],
    });
    const migration = buildRelationshipTextReviewBatchMigration({
      codex: reviewCodex,
      items,
      relationships: [],
      sections: [characterSection, factionSection],
    });

    expect(items).toEqual([
      expect.objectContaining({
        entryId: 'character-scout',
        fieldKey: 'affiliations',
        exactTargetIds: ['faction-cartographers'],
        remainingText: '',
        unresolvedFragments: [],
      }),
    ]);
    expect(migration.relationshipsToSave).toHaveLength(1);
    expect(migration.relationshipsToSave[0].relationship).toMatchObject({
      sourceEntryId: 'character-scout',
      targetEntryId: 'faction-cartographers',
      type: 'member of',
    });
    expect(migration.entryFieldUpdates).toEqual([
      {
        entryId: 'character-scout',
        fields: {
          characterCategory: 'Humanoid person',
        },
      },
    ]);
  });
});
