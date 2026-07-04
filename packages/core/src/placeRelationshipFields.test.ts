import { describe, expect, it } from '@jest/globals';
import {
  filterPlaceRelationshipTargetOptions,
  buildPlaceRelationshipTextReviewBatchMigration,
  buildPlaceRelationshipTextReviewMigration,
  getPlaceRelationshipFieldLinks,
  getPlaceRelationshipFieldTargetId,
  getPlaceRelationshipTextReviewExactMatchLabel,
  getPlaceRelationshipTextReviewItems,
  getPlaceRelationshipTextReviewSuggestionLabels,
  getPlaceRelationshipTextReviewUnresolvedLabel,
  getPlaceRelationshipTargetOptions,
  limitPlaceRelationshipTargetOptions,
  makePlaceFieldRelationship,
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

describe('place relationship field helpers', () => {
  it('returns eligible target options by section, status, and target category', () => {
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
      }).map((option) => option.entry.id)
    ).toEqual(['place-capital']);
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
      }).map((option) => option.entry.id)
    ).toEqual(['lore-capital-charter', 'place-capital', 'place-archived-city']);
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
    const options = codex.places.map((entry) => ({
      entry,
      section: placeSection,
    }));
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
