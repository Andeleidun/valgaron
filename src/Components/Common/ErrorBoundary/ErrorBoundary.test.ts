import { describe, expect, it } from '@jest/globals';
import { didResetKeysChange } from './ErrorBoundary';

describe('ErrorBoundary reset keys', () => {
  it('resets only when an existing key list changes', () => {
    expect(didResetKeysChange([1], [2])).toBe(true);
    expect(didResetKeysChange([1], [1])).toBe(false);
    expect(didResetKeysChange(undefined, [1])).toBe(false);
  });
});
