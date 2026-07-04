import { describe, expect, it } from '@jest/globals';
import {
  buildRelationshipTextMigration,
  splitRelationshipTextFragments,
} from './relationshipTextMigration';

const candidates = [
  { id: 'place-river-a', name: 'Silver Run' },
  { id: 'place-river-b', name: 'Moon Fork' },
  { id: 'place-city-a', name: 'Glassport' },
];

describe('relationship text migration', () => {
  it('splits legacy link text into durable candidate fragments', () => {
    expect(
      splitRelationshipTextFragments(`
        - Silver Run
        Moon Fork; "Glassport", Unknown place
      `)
    ).toEqual(['Silver Run', 'Moon Fork', 'Glassport', 'Unknown place']);
  });

  it('returns exact unambiguous matches and preserves unmatched text', () => {
    expect(
      buildRelationshipTextMigration(
        'silver run, Moon Fork; Unmapped feeder',
        candidates,
        'many'
      )
    ).toEqual({
      fragments: ['silver run', 'Moon Fork', 'Unmapped feeder'],
      targetIds: ['place-river-a', 'place-river-b'],
      matchedFragments: ['silver run', 'Moon Fork'],
      unmatchedFragments: ['Unmapped feeder'],
      ambiguousFragments: [],
      remainingText: 'Unmapped feeder',
    });
  });

  it('keeps duplicate-name matches unresolved', () => {
    const result = buildRelationshipTextMigration(
      'Glassport',
      [...candidates, { id: 'place-city-b', name: 'Glassport' }],
      'many'
    );

    expect(result.targetIds).toEqual([]);
    expect(result.remainingText).toBe('Glassport');
    expect(result.ambiguousFragments).toEqual([
      {
        fragment: 'Glassport',
        targetIds: ['place-city-a', 'place-city-b'],
      },
    ]);
  });

  it('migrates one-to-one fields only when one exact target is found', () => {
    expect(
      buildRelationshipTextMigration('Silver Run', candidates, 'one').targetIds
    ).toEqual(['place-river-a']);
    expect(
      buildRelationshipTextMigration('Silver Run, Moon Fork', candidates, 'one')
    ).toMatchObject({
      targetIds: [],
      remainingText: 'Silver Run, Moon Fork',
    });
  });
});
