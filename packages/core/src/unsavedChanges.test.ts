import { describe, expect, it } from '@jest/globals';
import {
  getDiscardUnsavedChangesConfirmation,
  hasUnsavedChanges,
  unsavedChangesConfirmationCopy,
} from './unsavedChanges';

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

  it('returns a shared discard confirmation model for dirty drafts', () => {
    expect(getDiscardUnsavedChangesConfirmation({ isDirty: false })).toEqual({
      kind: 'clean',
    });

    expect(getDiscardUnsavedChangesConfirmation({ isDirty: true })).toEqual({
      actions: [
        {
          id: 'keep-editing',
          intent: 'cancel',
          label: unsavedChangesConfirmationCopy.keepEditingLabel,
        },
        {
          id: 'discard',
          intent: 'destructive',
          label: unsavedChangesConfirmationCopy.discardLabel,
        },
      ],
      browserMessage: `${unsavedChangesConfirmationCopy.title}\n\n${unsavedChangesConfirmationCopy.message}`,
      kind: 'confirm',
      message: unsavedChangesConfirmationCopy.message,
      title: unsavedChangesConfirmationCopy.title,
    });
  });

  it('allows screen-specific unsaved discard title and message overrides', () => {
    expect(
      getDiscardUnsavedChangesConfirmation({
        isDirty: true,
        message: 'Discard pasted import text?',
        title: 'Clear import text?',
      })
    ).toMatchObject({
      browserMessage: 'Clear import text?\n\nDiscard pasted import text?',
      message: 'Discard pasted import text?',
      title: 'Clear import text?',
    });
  });
});
