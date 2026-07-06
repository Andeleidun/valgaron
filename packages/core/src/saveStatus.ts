import { formatUpdatedAt } from './codexEntries';
import { localPersistenceCopy } from './shell';

export type SaveStatusTone = 'info' | 'success' | 'warning' | 'danger';

export type DeviceSaveStatusModel = {
  title: string;
  label: string;
  detail: string;
  tone: SaveStatusTone;
};

export type LocalSaveStatusState =
  | 'saved'
  | 'unsaved'
  | 'dirty'
  | 'failed'
  | 'paused';

export type LocalSaveStatusModel = {
  label: string;
  detail: string;
  tone: SaveStatusTone;
};

export type DeviceCommitResultId =
  | 'entry-saved'
  | 'entry-updated'
  | 'relationship-saved'
  | 'relationship-updated'
  | 'workspace-created'
  | 'workspace-updated'
  | 'planetary-world-saved'
  | 'planetary-world-updated'
  | 'entry-type-created'
  | 'entry-type-updated';

export const deviceCommitResultMessages: Record<DeviceCommitResultId, string> =
  {
    'entry-saved': 'Saved entry on this device.',
    'entry-updated': 'Updated entry on this device.',
    'relationship-saved': 'Saved relationship on this device.',
    'relationship-updated': 'Updated relationship on this device.',
    'workspace-created': 'Created workspace on this device.',
    'workspace-updated': 'Updated workspace on this device.',
    'planetary-world-saved': 'Saved in-fiction world on this device.',
    'planetary-world-updated': 'Updated in-fiction world on this device.',
    'entry-type-created': 'Created entry type on this device.',
    'entry-type-updated': 'Updated entry type on this device.',
  };

export function getDeviceCommitResultMessage(id: DeviceCommitResultId): string {
  return deviceCommitResultMessages[id];
}

export function getDeviceCommitPendingMessage(
  savedFormMessage: string
): string {
  return savedFormMessage ? localPersistenceCopy.deviceSaving : '';
}

export function getDeviceCommitResolvedMessage({
  blockingFailureMessage = '',
  currentFormMessage,
  didSave,
  savedFormMessage,
}: {
  blockingFailureMessage?: string;
  currentFormMessage: string;
  didSave: boolean;
  savedFormMessage: string;
}): string {
  if (!didSave) {
    return localPersistenceCopy.deviceSaveFailed;
  }
  if (
    savedFormMessage &&
    (!blockingFailureMessage || currentFormMessage !== blockingFailureMessage)
  ) {
    return savedFormMessage;
  }
  return currentFormMessage;
}

export function getDeviceSaveStatusModel({
  savedAt,
  saveMessage,
}: {
  savedAt: string;
  saveMessage: string;
}): DeviceSaveStatusModel {
  const normalizedMessage = saveMessage.trim();
  const tone: SaveStatusTone = /^could not/i.test(normalizedMessage)
    ? 'danger'
    : /\bsaving\b/i.test(normalizedMessage)
    ? 'warning'
    : /\bsaved\b/i.test(normalizedMessage)
    ? 'success'
    : 'info';

  return {
    title: 'Save Status',
    label: normalizedMessage || localPersistenceCopy.deviceSaved,
    detail: `Document timestamp on ${
      localPersistenceCopy.deviceSaveTarget
    }: ${formatUpdatedAt(savedAt)}.`,
    tone,
  };
}

export function getLocalSaveStatusModel({
  savedAt,
  state,
  targetLabel = localPersistenceCopy.browserSaveTarget,
}: {
  savedAt: string;
  state: LocalSaveStatusState;
  targetLabel?: string;
}): LocalSaveStatusModel {
  switch (state) {
    case 'saved':
      return {
        label: 'Saved',
        detail: `Last save attempt: ${formatUpdatedAt(savedAt)}.`,
        tone: 'success',
      };
    case 'paused':
      return {
        label: 'Save Paused',
        detail: `Manual save paused after local storage recovery: ${formatUpdatedAt(
          savedAt
        )}.`,
        tone: 'danger',
      };
    case 'unsaved':
      return {
        label: 'Needs Save',
        detail: `This document is loaded in the session but has not been saved to current ${targetLabel} yet. Last document timestamp: ${formatUpdatedAt(
          savedAt
        )}.`,
        tone: 'warning',
      };
    case 'dirty':
      return {
        label: 'Unsaved',
        detail: `Unsaved session changes. Last ${targetLabel} save: ${formatUpdatedAt(
          savedAt
        )}.`,
        tone: 'warning',
      };
    case 'failed':
      return {
        label: 'Save Failed',
        detail: `Last save attempt: ${formatUpdatedAt(savedAt)}.`,
        tone: 'danger',
      };
  }
}
