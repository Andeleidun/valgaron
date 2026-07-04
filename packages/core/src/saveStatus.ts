import { formatUpdatedAt } from './codexEntries';
import { localPersistenceCopy } from './shell';

export type SaveStatusTone = 'info' | 'success' | 'warning' | 'danger';

export type DeviceSaveStatusModel = {
  title: string;
  label: string;
  detail: string;
  tone: SaveStatusTone;
};

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
