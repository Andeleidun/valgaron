import {
  destructiveActionCopy,
  type DestructiveActionCopy,
  type DestructiveActionId,
} from '@valgaron/core';

export type MobileDestructiveActionId = DestructiveActionId;

export type MobileDestructiveActionCopy = DestructiveActionCopy;

export const mobileDestructiveActionCopy = destructiveActionCopy;

export type MobileDataActionResultId = Extract<
  MobileDestructiveActionId,
  'import-document' | 'reset-document' | 'restore-snapshot'
>;

export const mobileDataActionResultMessages: Record<
  MobileDataActionResultId,
  string
> = {
  'import-document':
    'Imported backup on this device. A recovery snapshot was saved first.',
  'reset-document':
    'Starter data is open on this device. A recovery snapshot was saved first.',
  'restore-snapshot':
    'Restored the selected recovery snapshot. The previous document was saved as a new recovery snapshot first.',
};

export const mobileRecoverySnapshotSaveFailedMessage =
  'Could not save the recovery snapshot to this device. Export JSON before continuing destructive edits.';

export function getMobileDataActionResultMessage(
  actionId: MobileDataActionResultId
): string {
  return mobileDataActionResultMessages[actionId];
}
