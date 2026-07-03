import { afterEach, describe, expect, it, jest } from '@jest/globals';
import {
  confirmDiscardUnsavedChanges,
  hasUnsavedChanges,
} from './unsavedChanges';

describe('unsaved change helpers', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'window');
  });

  it('detects nested draft changes without depending on key order', () => {
    expect(
      hasUnsavedChanges(
        { name: 'Aster', details: { climate: 'Cold', orbit: 'High' } },
        { details: { orbit: 'High', climate: 'Cold' }, name: 'Aster' }
      )
    ).toBe(false);
    expect(
      hasUnsavedChanges(
        { name: 'Aster', details: { climate: 'Cold', orbit: 'High' } },
        { name: 'Aster', details: { climate: 'Wet', orbit: 'High' } }
      )
    ).toBe(true);
  });

  it('confirms before discarding dirty drafts', () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        confirm: jest.fn(() => true),
      },
    });

    expect(confirmDiscardUnsavedChanges(false)).toBe(true);
    expect(confirmDiscardUnsavedChanges(true)).toBe(true);
    expect(window.confirm).toHaveBeenCalledTimes(1);
  });

  it('blocks discards when confirmation is unavailable', () => {
    expect(confirmDiscardUnsavedChanges(true)).toBe(false);
  });
});
