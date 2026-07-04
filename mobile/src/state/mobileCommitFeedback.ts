import { localPersistenceCopy } from '@valgaron/core';
import { mobileRecoverySnapshotSaveFailedMessage } from './mobileDestructiveActions';

export function getMobileCommitPendingMessage(
  savedFormMessage: string
): string {
  return savedFormMessage ? localPersistenceCopy.deviceSaving : '';
}

export function getMobileCommitResolvedMessage({
  currentFormMessage,
  didSave,
  savedFormMessage,
}: {
  currentFormMessage: string;
  didSave: boolean;
  savedFormMessage: string;
}): string {
  if (!didSave) {
    return localPersistenceCopy.deviceSaveFailed;
  }
  if (
    savedFormMessage &&
    currentFormMessage !== mobileRecoverySnapshotSaveFailedMessage
  ) {
    return savedFormMessage;
  }
  return currentFormMessage;
}
