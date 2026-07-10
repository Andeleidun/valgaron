import { describe, expect, it } from '@jest/globals';
import { moveMobileSectionOrder } from './useMobileSectionPreferences';

describe('mobile section preference ordering', () => {
  it('moves a section to the next visible position across hidden sections', () => {
    const order = ['summary', 'conditional', 'editor'];
    expect(moveMobileSectionOrder(order, 'summary', 2)).toEqual([
      'editor',
      'conditional',
      'summary',
    ]);
  });

  it('keeps the order unchanged when the requested target is invalid', () => {
    const order = ['summary', 'editor'];
    expect(moveMobileSectionOrder(order, 'summary', -1)).toBe(order);
  });
});
