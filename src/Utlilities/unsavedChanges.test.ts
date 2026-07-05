import { afterEach, describe, expect, it, jest } from '@jest/globals';
import {
  getDiscardUnsavedChangesConfirmation,
  hasUnsavedChanges,
} from '@valgaron/core';
import {
  confirmDiscardUnsavedChanges as confirmBrowserDiscardUnsavedChanges,
  hasUnsavedChanges as hasUnsavedChangesFromWebAdapter,
} from './unsavedChanges';

describe('unsaved change helpers', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'window');
  });

  it('detects nested draft changes without depending on key order', () => {
    expect(
      hasUnsavedChangesFromWebAdapter(
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

    expect(confirmBrowserDiscardUnsavedChanges(false)).toBe(true);
    expect(confirmBrowserDiscardUnsavedChanges(true)).toBe(true);
    expect(window.confirm).toHaveBeenCalledTimes(1);
    const confirmation = getDiscardUnsavedChangesConfirmation({
      isDirty: true,
    });
    expect(window.confirm).toHaveBeenCalledWith(
      confirmation.kind === 'confirm' ? confirmation.browserMessage : ''
    );
  });

  it('blocks discards when confirmation is unavailable', () => {
    expect(confirmBrowserDiscardUnsavedChanges(true)).toBe(false);
  });
});
