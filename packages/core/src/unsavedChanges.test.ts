import { describe, expect, it } from '@jest/globals';
import { hasUnsavedChanges } from './unsavedChanges';

describe('unsaved changes', () => {
  it('compares structured draft values independent of object key order', () => {
    expect(
      hasUnsavedChanges(
        { name: 'Aster', details: { era: 'Second', region: 'North' } },
        { details: { region: 'North', era: 'Second' }, name: 'Aster' }
      )
    ).toBe(false);
  });

  it('detects nested draft edits', () => {
    expect(
      hasUnsavedChanges(
        { name: 'Aster', tags: ['north', 'trade'] },
        { name: 'Aster', tags: ['north', 'trade', 'river'] }
      )
    ).toBe(true);
  });
});
