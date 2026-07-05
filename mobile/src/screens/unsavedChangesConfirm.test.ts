import { describe, expect, it, jest } from '@jest/globals';
import {
  getDiscardUnsavedChangesConfirmation,
  unsavedChangesConfirmationCopy,
} from '@valgaron/core';
import { Alert } from 'react-native';
import { confirmDiscardUnsavedChangesOnMobile } from './unsavedChangesConfirm';

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('mobile unsaved changes confirmation presenter', () => {
  it('runs the discard action immediately when the draft is clean', () => {
    const onDiscard = jest.fn();

    confirmDiscardUnsavedChangesOnMobile(false, onDiscard);

    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('presents shared cancel and discard actions for dirty drafts', () => {
    const onCancel = jest.fn();
    const onDiscard = jest.fn();

    confirmDiscardUnsavedChangesOnMobile(true, onDiscard, onCancel);

    const confirmation = getDiscardUnsavedChangesConfirmation({
      isDirty: true,
    });
    expect(confirmation.kind).toBe('confirm');
    expect(Alert.alert).toHaveBeenCalledWith(
      unsavedChangesConfirmationCopy.title,
      unsavedChangesConfirmationCopy.message,
      [
        {
          onPress: onCancel,
          style: 'cancel',
          text: unsavedChangesConfirmationCopy.keepEditingLabel,
        },
        {
          onPress: onDiscard,
          style: 'destructive',
          text: unsavedChangesConfirmationCopy.discardLabel,
        },
      ]
    );
  });
});
