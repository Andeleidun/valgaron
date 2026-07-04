import { describe, expect, it } from '@jest/globals';
import { localPersistenceCopy } from '@valgaron/core';
import {
  getMobileCommitPendingMessage,
  getMobileCommitResolvedMessage,
} from './mobileCommitFeedback';
import { mobileRecoverySnapshotSaveFailedMessage } from './mobileDestructiveActions';

describe('mobile commit feedback', () => {
  it('shows pending feedback only when a success message is expected', () => {
    expect(getMobileCommitPendingMessage('Saved entry on this device.')).toBe(
      localPersistenceCopy.deviceSaving
    );
    expect(getMobileCommitPendingMessage('')).toBe('');
  });

  it('resolves save feedback after the device write completes', () => {
    expect(
      getMobileCommitResolvedMessage({
        currentFormMessage: localPersistenceCopy.deviceSaving,
        didSave: true,
        savedFormMessage: 'Saved entry on this device.',
      })
    ).toBe('Saved entry on this device.');
    expect(
      getMobileCommitResolvedMessage({
        currentFormMessage: localPersistenceCopy.deviceSaving,
        didSave: false,
        savedFormMessage: 'Saved entry on this device.',
      })
    ).toBe(localPersistenceCopy.deviceSaveFailed);
  });

  it('does not hide recovery snapshot failures behind success feedback', () => {
    expect(
      getMobileCommitResolvedMessage({
        currentFormMessage: mobileRecoverySnapshotSaveFailedMessage,
        didSave: true,
        savedFormMessage: 'Imported backup on this device.',
      })
    ).toBe(mobileRecoverySnapshotSaveFailedMessage);
  });
});
