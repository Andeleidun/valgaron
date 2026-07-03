import { describe, expect, it } from '@jest/globals';
import { getTrappedFocusTargetIndex } from './dialogFocus';

describe('dialog focus helpers', () => {
  it('wraps forward focus from the final element to the first element', () => {
    expect(getTrappedFocusTargetIndex(3, 2, 'next')).toBe(0);
  });

  it('wraps backward focus from the first element to the final element', () => {
    expect(getTrappedFocusTargetIndex(3, 0, 'previous')).toBe(2);
  });

  it('moves focus within the dialog when wrapping is not needed', () => {
    expect(getTrappedFocusTargetIndex(4, 1, 'next')).toBe(2);
    expect(getTrappedFocusTargetIndex(4, 2, 'previous')).toBe(1);
  });

  it('returns no target when the dialog has no focusable elements', () => {
    expect(getTrappedFocusTargetIndex(0, 0, 'next')).toBe(-1);
  });
});
