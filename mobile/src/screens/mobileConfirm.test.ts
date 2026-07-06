import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  destructiveActionCopy,
  destructiveActionDialogCopy,
  formatDestructiveActionTitle,
} from '@valgaron/core';
import { Alert } from 'react-native';
import { confirmMobileDestructiveAction } from './mobileConfirm';

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('mobile destructive confirmation presenter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('presents the shared default action title when no subject is provided', () => {
    const onConfirm = jest.fn();

    confirmMobileDestructiveAction('reset-document', onConfirm);

    expect(Alert.alert).toHaveBeenCalledWith(
      destructiveActionCopy['reset-document'].title,
      destructiveActionCopy['reset-document'].message,
      [
        { text: destructiveActionDialogCopy.cancelLabel, style: 'cancel' },
        {
          text: destructiveActionCopy['reset-document'].confirmLabel,
          style: 'destructive',
          onPress: onConfirm,
        },
      ]
    );
  });

  it('presents a subject-specific title when a subject is provided', () => {
    const onConfirm = jest.fn();

    confirmMobileDestructiveAction('delete-entry', onConfirm, 'Mira Rowan');

    expect(Alert.alert).toHaveBeenCalledWith(
      formatDestructiveActionTitle('delete-entry', 'Mira Rowan'),
      destructiveActionCopy['delete-entry'].message,
      [
        { text: destructiveActionDialogCopy.cancelLabel, style: 'cancel' },
        {
          text: destructiveActionCopy['delete-entry'].confirmLabel,
          style: 'destructive',
          onPress: onConfirm,
        },
      ]
    );
  });
});
